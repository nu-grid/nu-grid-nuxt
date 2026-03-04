/**
 * NuGrid Table Engine.
 *
 * Creates a reactive table that builds columns, headers, and row models on demand.
 * All state is read from NuGrid state refs via StateAccessors.
 */

import { createEngineColumn } from './column'
import { buildCoreRowModel } from './core-row-model'
import { buildGroupedRowModel } from './grouped-row-model'
import { buildEngineHeaderGroups } from './headers'
import { createEngineRow } from './row'
import type {
  EngineColumn,
  EngineColumnDef,
  EngineHeaderGroup,
  EngineRow,
  EngineRowModel,
  EngineTable,
  StateAccessors,
} from './types'

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
// Factory
// ---------------------------------------------------------------------------

export function createNuGridTable<T>(options: CreateNuGridTableOptions<T>): EngineTable<T> {
  const { state } = options

  // -- Build columns from defs --
  const allColumns: EngineColumn<T>[] = options.columnDefs.map(def =>
    createEngineColumn<T>(def, 0, undefined, state, options),
  )

  // -- Column lookups --
  const allFlatColumns: EngineColumn<T>[] = allColumns.flatMap(c => c.getFlatColumns())
  const allLeafColumns: EngineColumn<T>[] = allColumns.flatMap(c => c.getLeafColumns())
  const columnsById: Record<string, EngineColumn<T>> = {}
  for (const col of allFlatColumns) {
    columnsById[col.id] = col
  }

  // Wire up state accessors for column lists (these are needed by column.getStart/getAfter/getIndex)
  const getVisibleLeafColumns = () => allLeafColumns.filter(c => c.getIsVisible())
  const getLeftVisibleLeafColumns = () => {
    const { left } = state.columnPinning()
    if (!left?.length) return []
    return getVisibleLeafColumns().filter(c => left.includes(c.id))
  }
  const getRightVisibleLeafColumns = () => {
    const { right } = state.columnPinning()
    if (!right?.length) return []
    return getVisibleLeafColumns().filter(c => right.includes(c.id))
  }
  const getCenterVisibleLeafColumns = () => {
    const { left, right } = state.columnPinning()
    const pinned = new Set([...(left ?? []), ...(right ?? [])])
    return getVisibleLeafColumns().filter(c => !pinned.has(c.id))
  }

  // Patch the state accessors with the column list functions
  // (These are needed by column.getStart/getAfter/getIndex but weren't available at column creation time)
  ;(state as any).getVisibleLeafColumns = getVisibleLeafColumns
  ;(state as any).getLeftVisibleLeafColumns = getLeftVisibleLeafColumns
  ;(state as any).getRightVisibleLeafColumns = getRightVisibleLeafColumns
  ;(state as any).getCenterVisibleLeafColumns = getCenterVisibleLeafColumns

  // -- Build table object --
  const table: EngineTable<T> = {
    // Header groups
    getHeaderGroups(): EngineHeaderGroup<T>[] {
      const visible = getVisibleLeafColumns()
      return buildEngineHeaderGroups(allColumns, visible, table)
    },

    getFooterGroups(): EngineHeaderGroup<T>[] {
      return [...table.getHeaderGroups()].reverse()
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
      const coreModel = buildCoreRowModel(data, allLeafColumns, table, state)
      const grouping = state.grouping()

      if (grouping.length) {
        return buildGroupedRowModel(coreModel, grouping, allLeafColumns, table, state)
      }

      return coreModel
    },

    getCoreRowModel(): EngineRowModel<T> {
      // Returns rows without grouping applied (NuGrid owns filtering externally)
      const data = typeof options.data === 'function' ? (options.data as () => T[])() : options.data
      return buildCoreRowModel(data, allLeafColumns, table, state)
    },

    getFilteredRowModel(): EngineRowModel<T> {
      // NuGrid handles filtering externally — this returns the same as getRowModel
      return table.getRowModel()
    },

    getSelectedRowModel(): EngineRowModel<T> {
      const model = table.getRowModel()
      const selection = state.rowSelection()
      const selectedRows = model.flatRows.filter(r => selection[r.id])
      const rowsById: Record<string, EngineRow<T>> = {}
      for (const row of selectedRows) {
        rowsById[row.id] = row
      }
      return { rows: selectedRows, flatRows: selectedRows, rowsById }
    },

    getPrePaginationRowModel(): EngineRowModel<T> {
      // NuGrid handles pagination separately
      return table.getRowModel()
    },

    getRow(rowId: string, _searchAll?: boolean): EngineRow<T> | undefined {
      return table.getRowModel().rowsById[rowId]
    },

    // Row creation
    createRow(id: string, original: T, index: number, depth: number, subRows?: T[], parentId?: string): EngineRow<T> {
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

    // Sizing
    getTotalSize(): number {
      return getVisibleLeafColumns().reduce((sum, col) => sum + col.getSize(), 0)
    },

    // State
    getState(): Record<string, any> {
      return {
        columnSizing: state.columnSizing(),
        columnSizingInfo: state.columnSizingInfo(),
        columnPinning: state.columnPinning(),
        columnVisibility: state.columnVisibility(),
        columnOrder: state.columnOrder(),
        sorting: state.sorting(),
        grouping: state.grouping(),
        rowSelection: state.rowSelection(),
        expanded: state.expanded(),
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
