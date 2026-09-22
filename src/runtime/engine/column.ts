/**
 * NuGrid Column factory.
 *
 * Creates Column objects backed by NuGrid state refs via StateAccessors.
 */

import type { ColumnPinningPosition, EngineColumn, EngineColumnDef, StateAccessors } from './types'

// ---------------------------------------------------------------------------
// Default sizing constants
// ---------------------------------------------------------------------------

const DEFAULT_SIZE = 150
const DEFAULT_MIN_SIZE = 20
const DEFAULT_MAX_SIZE = Number.MAX_SAFE_INTEGER

// ---------------------------------------------------------------------------
// Accessor resolution
// ---------------------------------------------------------------------------

function resolveAccessorFn<T>(
  columnDef: EngineColumnDef<T>,
): ((row: T, index: number) => any) | undefined {
  if (columnDef.accessorFn) {
    return columnDef.accessorFn
  }

  const accessorKey: string | undefined = columnDef.accessorKey
  if (!accessorKey) return undefined

  // Support deep accessor keys like "address.city"
  if (accessorKey.includes('.')) {
    const keys = accessorKey.split('.')
    return (originalRow: T) => {
      let result: any = originalRow
      for (const key of keys) {
        result = result?.[key]
      }
      return result
    }
  }

  return (originalRow: T) => (originalRow as any)[accessorKey]
}

// ---------------------------------------------------------------------------
// Column ID resolution
// ---------------------------------------------------------------------------

function resolveColumnId(columnDef: EngineColumnDef): string {
  return (
    columnDef.id ??
    (columnDef.accessorKey ? String(columnDef.accessorKey).replaceAll('.', '_') : undefined) ??
    (typeof columnDef.header === 'string' ? columnDef.header : undefined) ??
    ''
  )
}

// ---------------------------------------------------------------------------
// getVisibleLeafColumns for a position
// ---------------------------------------------------------------------------

function getVisibleLeafColumnsForPosition<T>(
  state: StateAccessors,
  position?: ColumnPinningPosition | 'center',
): EngineColumn<T>[] {
  if (!position) return state.getVisibleLeafColumns()
  if (position === 'center') return state.getCenterVisibleLeafColumns()
  if (position === 'left') return state.getLeftVisibleLeafColumns()
  return state.getRightVisibleLeafColumns()
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createEngineColumn<T>(
  columnDef: EngineColumnDef<T>,
  depth: number,
  parent: EngineColumn<T> | undefined,
  state: StateAccessors,
  tableOptions?: Record<string, any>,
): EngineColumn<T> {
  const id = resolveColumnId(columnDef)
  const accessorFn = resolveAccessorFn<T>(columnDef)
  const options = tableOptions ?? {}

  const column: EngineColumn<T> = {
    id,
    accessorFn,
    columnDef,
    depth,
    parent,
    columns: [],

    // -- Tree traversal --

    getFlatColumns() {
      return [column, ...column.columns.flatMap((c) => c.getFlatColumns())]
    },

    getLeafColumns() {
      if (column.columns.length) {
        return column.columns.flatMap((c) => c.getLeafColumns())
      }
      return [column]
    },

    // -- Visibility --

    getIsVisible() {
      if (column.columns.length) {
        return column.columns.some((c) => c.getIsVisible())
      }
      return state.columnVisibility()?.[column.id] ?? true
    },

    getCanHide() {
      return columnDef.enableHiding ?? true
    },

    toggleVisibility(value?) {
      const newValue = value ?? !column.getIsVisible()
      state.setColumnVisibility((old) => ({
        ...old,
        [column.id]: newValue,
      }))
    },

    // -- Pinning --

    getIsPinned() {
      const { left, right } = state.columnPinning()

      // Fast path for leaf columns (the common case) — no array allocations
      if (!column.columns.length) {
        if (left?.includes(column.id)) return 'left'
        if (right?.includes(column.id)) return 'right'
        return false
      }

      // Group column: check if any leaf is pinned
      const leafIds = column.getLeafColumns().map((c) => c.id)
      const isLeft = leafIds.some((id) => left?.includes(id))
      const isRight = leafIds.some((id) => right?.includes(id))
      return isLeft ? 'left' : isRight ? 'right' : false
    },

    getPinnedIndex() {
      const position = column.getIsPinned()
      if (!position) return 0
      return state.columnPinning()[position]?.indexOf(column.id) ?? -1
    },

    getStart(position?) {
      const columns = getVisibleLeafColumnsForPosition<T>(state, position)
      const idx = columns.findIndex((c) => c.id === column.id)
      if (idx <= 0) return 0
      let sum = 0
      for (let i = 0; i < idx; i++) sum += columns[i]!.getSize()
      return sum
    },

    getAfter(position?) {
      const columns = getVisibleLeafColumnsForPosition<T>(state, position)
      const idx = columns.findIndex((c) => c.id === column.id)
      if (idx < 0) return 0
      let sum = 0
      for (let i = idx + 1; i < columns.length; i++) sum += columns[i]!.getSize()
      return sum
    },

    // -- Sizing --

    getSize() {
      const sizing = state.columnSizing()
      const columnSize = sizing[column.id]
      return Math.min(
        Math.max(
          columnDef.minSize ?? DEFAULT_MIN_SIZE,
          columnSize ?? columnDef.size ?? DEFAULT_SIZE,
        ),
        columnDef.maxSize ?? DEFAULT_MAX_SIZE,
      )
    },

    getCanResize() {
      return (columnDef.enableResizing ?? true) && (options.enableColumnResizing ?? true)
    },

    getIsResizing() {
      return state.columnSizingInfo().isResizingColumn === column.id
    },

    // -- Sorting --

    getCanSort() {
      return (columnDef.enableSorting ?? true) && (options.enableSorting ?? true) && !!accessorFn
    },

    getIsSorted() {
      const sort = state.sorting().find((s) => s.id === column.id)
      if (!sort) return false
      return sort.desc ? 'desc' : 'asc'
    },

    getSortIndex() {
      return state.sorting().findIndex((s) => s.id === column.id)
    },

    getCanMultiSort() {
      return options.enableMultiSort ?? true
    },

    toggleSorting(desc?, isMulti?) {
      if (!column.getCanSort()) return

      const old = state.sorting()
      const existingIndex = old.findIndex((s) => s.id === column.id)
      const existingSorting = existingIndex >= 0 ? old[existingIndex] : undefined
      const hasManualValue = desc !== undefined

      // Determine next sorting order: asc → desc → remove
      let nextSortingOrder: false | 'desc' | 'asc'
      if (!hasManualValue) {
        if (!existingSorting) {
          nextSortingOrder = 'asc'
        } else if (existingSorting.desc) {
          nextSortingOrder = false // remove
        } else {
          nextSortingOrder = 'desc'
        }
      } else {
        nextSortingOrder = desc ? 'desc' : 'asc'
      }

      // Determine action
      const multi = isMulti && column.getCanMultiSort()

      let newSorting: typeof old
      if (multi) {
        if (existingSorting) {
          if (nextSortingOrder === false) {
            // Remove from multi-sort
            newSorting = old.filter((s) => s.id !== column.id)
          } else {
            // Toggle direction in place
            newSorting = old.map((s) =>
              s.id === column.id ? { ...s, desc: nextSortingOrder === 'desc' } : s,
            )
          }
        } else if (nextSortingOrder !== false) {
          // Add to multi-sort
          newSorting = [...old, { id: column.id, desc: nextSortingOrder === 'desc' }]
          // Enforce maxMultiSortColCount
          const max = options.maxMultiSortColCount
          if (max && newSorting.length > max) {
            newSorting = newSorting.slice(newSorting.length - max)
          }
        } else {
          newSorting = old
        }
      } else {
        // Single sort — replace all
        if (nextSortingOrder === false) {
          newSorting = []
        } else {
          newSorting = [{ id: column.id, desc: nextSortingOrder === 'desc' }]
        }
      }

      state.setSorting(newSorting)
    },

    clearSorting() {
      state.setSorting(state.sorting().filter((s) => s.id !== column.id))
    },

    getToggleSortingHandler() {
      const canSort = column.getCanSort()
      return (e: unknown) => {
        if (!canSort) return
        ;(e as any)?.persist?.()
        column.toggleSorting(
          undefined,
          column.getCanMultiSort() ? (options.isMultiSortEvent?.(e) ?? false) : false,
        )
      }
    },

    // -- Filtering --

    getCanFilter() {
      return (columnDef.enableColumnFilter ?? columnDef.enableFiltering ?? true) && !!accessorFn
    },

    getFilterValue() {
      return state.columnFilters().find((f) => f.id === column.id)?.value
    },

    setFilterValue(value: unknown) {
      state.setColumnFilters((old) => {
        const existing = old.find((f) => f.id === column.id)
        if (value === undefined || value === null || value === '') {
          return old.filter((f) => f.id !== column.id)
        }
        if (existing) {
          return old.map((f) => (f.id === column.id ? { ...f, value } : f))
        }
        return [...old, { id: column.id, value }]
      })
    },

    // -- Grouping --

    getIsGrouped() {
      return state.grouping().includes(column.id)
    },

    getGroupedIndex() {
      return state.grouping().indexOf(column.id)
    },

    // -- Ordering --

    getIndex(position?) {
      const columns = getVisibleLeafColumnsForPosition<T>(state, position)
      return columns.findIndex((c) => c.id === column.id)
    },
  }

  // Process child columns
  if (columnDef.columns) {
    column.columns = columnDef.columns.map((childDef) =>
      createEngineColumn<T>(childDef, depth + 1, column, state, options),
    )
  }

  return column
}
