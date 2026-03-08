/**
 * NuGrid Table Engine.
 *
 * Creates a reactive table that builds columns, headers, and row models on demand.
 * All state is read from NuGrid state refs via StateAccessors.
 */

import type {
  EngineColumn,
  EngineColumnDef,
  EngineHeaderGroup,
  EngineRow,
  EngineRowModel,
  EngineTable,
  StateAccessors,
} from './types'

import { createEngineColumn } from './column'
import { buildCoreRowModel } from './core-row-model'
import { buildGroupedRowModel } from './grouped-row-model'
import { buildEngineHeaderGroups } from './headers'
import { createEngineRow } from './row'

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface CreateNuGridTableOptions<T> {
  data: T[] | (() => T[])
  columnDefs: EngineColumnDef<T>[]
  state: StateAccessors
  getRowId?: (row: T, index: number, parent?: EngineRow<T>) => string
  meta?: Record<string, any>
  enableColumnResizing?: boolean
  enableSorting?: boolean
  enableMultiSort?: boolean
  enableExpanding?: boolean
  enableRowSelection?: boolean | ((row: EngineRow<T>) => boolean)
  enableMultiRowSelection?: boolean | ((row: EngineRow<T>) => boolean)
  isMultiSortEvent?: (event: unknown) => boolean
  maxMultiSortColCount?: number
  renderFallbackValue?: any
  [key: string]: any
}

// ---------------------------------------------------------------------------
// Cache helpers — shallow comparison handles in-place state mutations
// ---------------------------------------------------------------------------

function shallowEqual(
  a: Record<string, any> | undefined,
  b: Record<string, any> | undefined,
): boolean {
  if (a === b) return true
  if (!a || !b) return false
  const keysA = Object.keys(a)
  if (keysA.length !== Object.keys(b).length) return false
  for (const key of keysA) {
    const va = a[key]
    const vb = b[key]
    if (va === vb) continue
    if (Array.isArray(va) && Array.isArray(vb)) {
      if (va.length !== vb.length) return false
      for (let i = 0; i < va.length; i++) {
        if (va[i] !== vb[i]) return false
      }
      continue
    }
    return false
  }
  return true
}

/** Shallow-copy a state object, also copying any array values. */
function snapshotState(obj: Record<string, any>): Record<string, any> {
  const copy: Record<string, any> = {}
  for (const key of Object.keys(obj)) {
    copy[key] = Array.isArray(obj[key]) ? [...obj[key]] : obj[key]
  }
  return copy
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createNuGridTable<T>(options: CreateNuGridTableOptions<T>): EngineTable<T> {
  const { state } = options

  // -- Build columns from defs --
  const allColumns: EngineColumn<T>[] = options.columnDefs.map((def) =>
    createEngineColumn<T>(def, 0, undefined, state, options),
  )

  // -- Column lookups --
  const allFlatColumns: EngineColumn<T>[] = allColumns.flatMap((c) => c.getFlatColumns())
  const allLeafColumns: EngineColumn<T>[] = allColumns.flatMap((c) => c.getLeafColumns())
  const columnsById: Record<string, EngineColumn<T>> = {}
  for (const col of allFlatColumns) {
    columnsById[col.id] = col
  }

  // ---------------------------------------------------------------------------
  // Identity-cached column lists — avoids re-filtering when state hasn't changed.
  // Each cache stores the state snapshot it was computed from and the result.
  // ---------------------------------------------------------------------------

  let _visCache: { vis: Record<string, any>; result: EngineColumn<T>[] } | null = null
  const getVisibleLeafColumns = (): EngineColumn<T>[] => {
    const vis = state.columnVisibility()
    if (_visCache && shallowEqual(_visCache.vis, vis)) return _visCache.result
    const result = allLeafColumns.filter((c) => c.getIsVisible())
    _visCache = { vis: snapshotState(vis), result }
    return result
  }

  let _leftCache: {
    pin: Record<string, any>
    vis: Record<string, any>
    result: EngineColumn<T>[]
  } | null = null
  const getLeftVisibleLeafColumns = (): EngineColumn<T>[] => {
    const pin = state.columnPinning()
    const vis = state.columnVisibility()
    if (_leftCache && shallowEqual(_leftCache.pin, pin) && shallowEqual(_leftCache.vis, vis))
      return _leftCache.result
    const { left } = pin
    if (!left?.length) {
      _leftCache = { pin: snapshotState(pin), vis: snapshotState(vis), result: [] }
      return _leftCache.result
    }
    const result = getVisibleLeafColumns().filter((c) => left.includes(c.id))
    _leftCache = { pin: snapshotState(pin), vis: snapshotState(vis), result }
    return result
  }

  let _rightCache: {
    pin: Record<string, any>
    vis: Record<string, any>
    result: EngineColumn<T>[]
  } | null = null
  const getRightVisibleLeafColumns = (): EngineColumn<T>[] => {
    const pin = state.columnPinning()
    const vis = state.columnVisibility()
    if (_rightCache && shallowEqual(_rightCache.pin, pin) && shallowEqual(_rightCache.vis, vis))
      return _rightCache.result
    const { right } = pin
    if (!right?.length) {
      _rightCache = { pin: snapshotState(pin), vis: snapshotState(vis), result: [] }
      return _rightCache.result
    }
    const result = getVisibleLeafColumns().filter((c) => right.includes(c.id))
    _rightCache = { pin: snapshotState(pin), vis: snapshotState(vis), result }
    return result
  }

  let _centerCache: {
    pin: Record<string, any>
    vis: Record<string, any>
    result: EngineColumn<T>[]
  } | null = null
  const getCenterVisibleLeafColumns = (): EngineColumn<T>[] => {
    const pin = state.columnPinning()
    const vis = state.columnVisibility()
    if (_centerCache && shallowEqual(_centerCache.pin, pin) && shallowEqual(_centerCache.vis, vis))
      return _centerCache.result
    const { left, right } = pin
    const pinned = new Set([...(left ?? []), ...(right ?? [])])
    const result = getVisibleLeafColumns().filter((c) => !pinned.has(c.id))
    _centerCache = { pin: snapshotState(pin), vis: snapshotState(vis), result }
    return result
  }

  // Patch the state accessors with the column list functions
  // (These are needed by column.getStart/getAfter/getIndex but weren't available at column creation time)
  ;(state as any).getVisibleLeafColumns = getVisibleLeafColumns
  ;(state as any).getLeftVisibleLeafColumns = getLeftVisibleLeafColumns
  ;(state as any).getRightVisibleLeafColumns = getRightVisibleLeafColumns
  ;(state as any).getCenterVisibleLeafColumns = getCenterVisibleLeafColumns

  // ---------------------------------------------------------------------------
  // Identity-cached row model and header groups
  // ---------------------------------------------------------------------------

  let _headerCache: { vis: EngineColumn<T>[]; result: EngineHeaderGroup<T>[] } | null = null
  let _footerCache: { source: EngineHeaderGroup<T>[]; result: EngineHeaderGroup<T>[] } | null = null
  let _rowModelCache: {
    data: T[]
    grouping: any
    expanded: any
    result: EngineRowModel<T>
  } | null = null
  let _coreModelCache: { data: T[]; result: EngineRowModel<T> } | null = null

  // -- Build table object --
  const table: EngineTable<T> = {
    // Header groups
    getHeaderGroups(): EngineHeaderGroup<T>[] {
      const visible = getVisibleLeafColumns()
      if (_headerCache && _headerCache.vis === visible) return _headerCache.result
      const result = buildEngineHeaderGroups(allColumns, visible, table)
      _headerCache = { vis: visible, result }
      return result
    },

    getFooterGroups(): EngineHeaderGroup<T>[] {
      const source = table.getHeaderGroups()
      if (_footerCache && _footerCache.source === source) return _footerCache.result
      const result = [...source].reverse()
      _footerCache = { source, result }
      return result
    },

    // Columns
    getAllColumns: () => allColumns,
    getAllLeafColumns: () => allLeafColumns,
    getAllFlatColumns: () => allFlatColumns,
    getVisibleLeafColumns,
    getLeftLeafColumns: getLeftVisibleLeafColumns,
    getRightLeafColumns: getRightVisibleLeafColumns,

    getColumn(columnId: string): EngineColumn<T> | undefined {
      return columnsById[columnId]
    },

    // Row models
    getRowModel(): EngineRowModel<T> {
      const data = typeof options.data === 'function' ? (options.data as () => T[])() : options.data
      const grouping = state.grouping()
      const expanded = state.expanded()
      if (
        _rowModelCache &&
        _rowModelCache.data === data &&
        _rowModelCache.grouping === grouping &&
        _rowModelCache.expanded === expanded
      ) {
        return _rowModelCache.result
      }
      const coreModel = buildCoreRowModel(data, allLeafColumns, table, state)
      const result = grouping.length
        ? buildGroupedRowModel(coreModel, grouping, allLeafColumns, table, state)
        : coreModel
      _rowModelCache = { data, grouping, expanded, result }
      return result
    },

    getCoreRowModel(): EngineRowModel<T> {
      const data = typeof options.data === 'function' ? (options.data as () => T[])() : options.data
      if (_coreModelCache && _coreModelCache.data === data) return _coreModelCache.result
      const result = buildCoreRowModel(data, allLeafColumns, table, state)
      _coreModelCache = { data, result }
      return result
    },

    getFilteredRowModel(): EngineRowModel<T> {
      // NuGrid handles filtering externally — this returns the same as getRowModel
      return table.getRowModel()
    },

    getSelectedRowModel(): EngineRowModel<T> {
      const model = table.getRowModel()
      const selection = state.rowSelection()
      const selectedRows = model.flatRows.filter((r) => selection[r.id])
      const rowsById: Record<string, EngineRow<T>> = {}
      for (const row of selectedRows) {
        rowsById[row.id] = row
      }
      return { rows: selectedRows, flatRows: selectedRows, rowsById }
    },

    getFilteredSelectedRowModel(): EngineRowModel<T> {
      // NuGrid handles filtering externally — same as getSelectedRowModel
      return table.getSelectedRowModel()
    },

    getPrePaginationRowModel(): EngineRowModel<T> {
      // NuGrid handles pagination separately
      return table.getRowModel()
    },

    getRow(rowId: string, _searchAll?: boolean): EngineRow<T> | undefined {
      return table.getRowModel().rowsById[rowId]
    },

    // Row creation
    createRow(
      id: string,
      original: T,
      index: number,
      depth: number,
      subRows?: T[],
      parentId?: string,
    ): EngineRow<T> {
      return createEngineRow({
        id,
        index,
        original,
        depth,
        parentId,
        subRows,
        table,
        columns: allLeafColumns,
        state,
      })
    },

    // Selection
    toggleAllPageRowsSelected(value: boolean): void {
      const model = table.getRowModel()
      const newSelection: Record<string, boolean> = { ...state.rowSelection() }
      for (const row of model.flatRows) {
        if (row.getCanSelect()) {
          newSelection[row.id] = value
        }
      }
      // Remove false entries to keep state clean
      if (!value) {
        for (const row of model.flatRows) {
          delete newSelection[row.id]
        }
      }
      state.setRowSelection(newSelection)
    },

    toggleAllRowsSelected(value: boolean): void {
      // Same as toggleAllPageRowsSelected — NuGrid manages pagination externally
      table.toggleAllPageRowsSelected(value)
    },

    getIsAllPageRowsSelected(): boolean {
      const model = table.getRowModel()
      const selection = state.rowSelection()
      const selectableRows = model.flatRows.filter((r) => r.getCanSelect())
      if (selectableRows.length === 0) return false
      return selectableRows.every((r) => selection[r.id])
    },

    getIsSomePageRowsSelected(): boolean {
      const model = table.getRowModel()
      const selection = state.rowSelection()
      const selectableRows = model.flatRows.filter((r) => r.getCanSelect())
      if (selectableRows.length === 0) return false
      const selectedCount = selectableRows.filter((r) => selection[r.id]).length
      return selectedCount > 0 && selectedCount < selectableRows.length
    },

    // Sizing
    getTotalSize(): number {
      return getVisibleLeafColumns().reduce((sum, col) => sum + col.getSize(), 0)
    },

    // State — lazy getters so callers only create reactive deps on properties they access
    getState(): Record<string, any> {
      return {
        get columnSizing() {
          return state.columnSizing()
        },
        get columnSizingInfo() {
          return state.columnSizingInfo()
        },
        get columnPinning() {
          return state.columnPinning()
        },
        get columnVisibility() {
          return state.columnVisibility()
        },
        get columnOrder() {
          return state.columnOrder()
        },
        get sorting() {
          return state.sorting()
        },
        get grouping() {
          return state.grouping()
        },
        get rowSelection() {
          return state.rowSelection()
        },
        get expanded() {
          return state.expanded()
        },
      }
    },

    // Options
    options: {
      meta: options.meta,
      getRowId: options.getRowId,
      enableColumnResizing: options.enableColumnResizing,
      enableSorting: options.enableSorting,
      enableMultiSort: options.enableMultiSort,
      enableExpanding: options.enableExpanding,
      enableRowSelection: options.enableRowSelection,
      enableMultiRowSelection: options.enableMultiRowSelection,
      isMultiSortEvent: options.isMultiSortEvent,
      maxMultiSortColCount: options.maxMultiSortColCount,
      renderFallbackValue: options.renderFallbackValue,
    },
  }

  return table
}
