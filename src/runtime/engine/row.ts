/**
 * NuGrid Row factory.
 *
 * Creates Row objects
 * backed by NuGrid state refs via StateAccessors.
 */

import type { EngineCell, EngineColumn, EngineRow, EngineTable, StateAccessors } from './types'

import { createEngineCell } from './cell'

// ---------------------------------------------------------------------------
// Utility: flatten subRows recursively
// ---------------------------------------------------------------------------

function flattenBy<T>(arr: T[], getChildren: (item: T) => T[]): T[] {
  const result: T[] = []
  const recurse = (items: T[]) => {
    for (const item of items) {
      result.push(item)
      const children = getChildren(item)
      if (children?.length) {
        recurse(children)
      }
    }
  }
  recurse(arr)
  return result
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export interface CreateEngineRowOptions<T> {
  id: string
  index: number
  original: T
  depth: number
  parentId?: string
  subRows?: T[]
  groupingColumnId?: string
  groupingValue?: unknown
  leafRows?: EngineRow<T>[]
  table: EngineTable<T>
  columns: EngineColumn<T>[]
  state: StateAccessors
}

export function createEngineRow<T>(options: CreateEngineRowOptions<T>): EngineRow<T> {
  const {
    id,
    index,
    original,
    depth,
    parentId,
    groupingColumnId,
    groupingValue,
    table,
    columns,
    state,
  } = options

  // Caches
  let _allCells: EngineCell<T>[] | undefined
  let _allCellsByColumnId: Record<string, EngineCell<T>> | undefined
  let _visibleCellsCache: { cols: EngineColumn<T>[]; result: EngineCell<T>[] } | null = null

  const row: EngineRow<T> = {
    id,
    index,
    original,
    depth,
    parentId,
    subRows: [],

    // Grouping properties
    groupingColumnId,
    groupingValue,
    leafRows: options.leafRows,

    // Value caches
    _valuesCache: {},
    _groupingValuesCache: {},

    // -- Value access --

    getValue<TValue = unknown>(columnId: string): TValue {
      if (Object.prototype.hasOwnProperty.call(row._valuesCache, columnId)) {
        return row._valuesCache[columnId] as TValue
      }

      const column = table.getColumn(columnId)
      if (!column?.accessorFn) {
        return undefined as TValue
      }

      const value = column.accessorFn(row.original, row.index)
      row._valuesCache[columnId] = value
      return value as TValue
    },

    renderValue<TValue = unknown>(columnId: string): TValue {
      return row.getValue<TValue>(columnId) ?? table.options.renderFallbackValue
    },

    // -- Cells --

    getAllCells(): EngineCell<T>[] {
      if (_allCells) return _allCells
      _allCells = table.getAllLeafColumns().map((column) => createEngineCell(row, column, table))
      return _allCells
    },

    getVisibleCells(): EngineCell<T>[] {
      const visibleCols = table.getVisibleLeafColumns()
      // Return cached result if visible columns list hasn't changed (identity check)
      if (_visibleCellsCache && _visibleCellsCache.cols === visibleCols) {
        return _visibleCellsCache.result
      }
      // Build lookup from all cells, return only visible ones
      if (!_allCellsByColumnId) {
        _allCellsByColumnId = {}
        for (const cell of row.getAllCells()) {
          _allCellsByColumnId[cell.column.id] = cell
        }
      }
      const result: EngineCell<T>[] = []
      for (const col of visibleCols) {
        const cell = _allCellsByColumnId[col.id]
        if (cell) result.push(cell)
      }
      _visibleCellsCache = { cols: visibleCols, result }
      return result
    },

    // -- Selection --

    getIsSelected(): boolean {
      return state.rowSelection()[row.id] ?? false
    },

    toggleSelected(value?: boolean): void {
      const isSelected = row.getIsSelected()
      const newValue = value ?? !isSelected

      state.setRowSelection((old) => {
        const next = { ...old }
        if (newValue) {
          next[row.id] = true
        } else {
          delete next[row.id]
        }
        return next
      })
    },

    getCanSelect(): boolean {
      const opt = table.options.enableRowSelection
      if (typeof opt === 'function') return (opt as any)(row)
      return opt ?? true
    },

    getCanMultiSelect(): boolean {
      const opt = table.options.enableMultiRowSelection
      if (typeof opt === 'function') return (opt as any)(row)
      return opt ?? true
    },

    // -- Expansion --

    getIsExpanded(): boolean {
      const expanded = state.expanded()
      if (expanded === true) return true
      return !!(expanded as Record<string, boolean>)?.[row.id]
    },

    toggleExpanded(expanded?: boolean): void {
      state.setExpanded((old) => {
        const isCurrentlyExpanded =
          old === true ? true : !!(old as Record<string, boolean>)?.[row.id]
        const newValue = expanded ?? !isCurrentlyExpanded

        // Convert `true` (expand all) to explicit object
        let oldObj: Record<string, boolean>
        if (old === true) {
          // When all expanded, we can't enumerate all row IDs, so just create with this row
          oldObj = { [row.id]: true }
        } else {
          oldObj = (old as Record<string, boolean>) ?? {}
        }

        if (newValue) {
          return { ...oldObj, [row.id]: true }
        } else {
          const { [row.id]: _, ...rest } = oldObj
          return rest
        }
      })
    },

    getCanExpand(): boolean {
      const opt = table.options.getRowCanExpand
      if (typeof opt === 'function') return opt(row)
      return (table.options.enableExpanding ?? true) && !!row.subRows?.length
    },

    // -- Grouping --

    getIsGrouped(): boolean {
      return !!row.groupingColumnId
    },

    getGroupingValue(columnId: string): unknown {
      if (Object.prototype.hasOwnProperty.call(row._groupingValuesCache, columnId)) {
        return row._groupingValuesCache[columnId]
      }
      // Lazily compute and cache grouping values
      const column = table.getColumn(columnId)
      if (!column) return undefined
      const value = column.columnDef.getGroupingValue?.(row.original) ?? row.getValue(columnId)
      row._groupingValuesCache[columnId] = value
      return value
    },

    // -- Navigation --

    getLeafRows(): EngineRow<T>[] {
      return flattenBy(row.subRows, (r) => r.subRows)
    },

    getParentRow(): EngineRow<T> | undefined {
      if (!row.parentId) return undefined
      return table.getRow(row.parentId, true)
    },

    getParentRows(): EngineRow<T>[] {
      const parents: EngineRow<T>[] = []
      let current: EngineRow<T> | undefined = row

      while ((current = current.getParentRow())) {
        parents.push(current)
      }
      return parents.reverse()
    },
  }

  return row
}
