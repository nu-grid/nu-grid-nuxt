/**
 * NuGrid Table Engine — Type definitions.
 *
 * Core interfaces for NuGrid's Column, Header, Row, Cell, and Table objects.
 */

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingInfoState,
  ColumnSizingState,
  ExpandedState,
  GroupingState,
  RowSelectionState,
  SortingState,
  Updater,
  VisibilityState,
} from '../types/state-types'

// ---------------------------------------------------------------------------
// State Accessors — read-only interface to NuGrid state refs
// ---------------------------------------------------------------------------

/**
 * Read-only accessor for all NuGrid state.
 * Column/Row/Cell factories close over this to implement their methods.
 * Each getter reads from the underlying Vue ref.
 */
export interface StateAccessors {
  columnSizing: () => ColumnSizingState
  columnSizingInfo: () => ColumnSizingInfoState
  columnPinning: () => ColumnPinningState
  columnVisibility: () => VisibilityState
  columnOrder: () => ColumnOrderState
  sorting: () => SortingState
  grouping: () => GroupingState
  rowSelection: () => RowSelectionState
  expanded: () => ExpandedState
  columnFilters: () => ColumnFiltersState

  // Mutators (for toggleSelected, toggleSorting, etc.)
  setSorting: (updater: Updater<SortingState>) => void
  setRowSelection: (updater: Updater<RowSelectionState>) => void
  setExpanded: (updater: Updater<ExpandedState>) => void
  setColumnFilters: (updater: Updater<ColumnFiltersState>) => void
  setColumnVisibility: (updater: Updater<VisibilityState>) => void

  // Column lists (needed for getStart/getAfter/getIndex)
  getVisibleLeafColumns: () => EngineColumn<any>[]
  getLeftVisibleLeafColumns: () => EngineColumn<any>[]
  getRightVisibleLeafColumns: () => EngineColumn<any>[]
  getCenterVisibleLeafColumns: () => EngineColumn<any>[]
}

// ---------------------------------------------------------------------------
// Column Definition — base properties the engine reads from column defs
// ---------------------------------------------------------------------------

/**
 * Base column definition interface.
 * Contains the properties the engine reads, plus an index signature
 * so NuGrid-specific extensions (cellDataType, enableReordering, etc.)
 * are accessible without casts.
 *
 * NuGridColumn<T> is structurally assignable to this.
 */
export interface EngineColumnDef<T = any> {
  id?: string
  accessorKey?: string
  accessorFn?: (row: T, index: number) => any
  header?: string | ((props: any) => any)
  cell?: string | ((props: any) => any)
  footer?: string | ((props: any) => any)
  columns?: EngineColumnDef<T>[]
  meta?: Record<string, any>
  size?: number
  minSize?: number
  maxSize?: number
  enableResizing?: boolean
  enableSorting?: boolean
  enableHiding?: boolean
  enableColumnFilter?: boolean
  enableGlobalFilter?: boolean
  enableGrouping?: boolean
  enableMultiSort?: boolean
  enablePinning?: boolean
  sortDescFirst?: boolean
  sortUndefined?: false | -1 | 1 | 'first' | 'last'
  [key: string]: any
}

// ---------------------------------------------------------------------------
// Column
// ---------------------------------------------------------------------------

export type ColumnPinningPosition = false | 'left' | 'right'

export interface EngineColumn<T = any> {
  id: string
  accessorFn?: (row: T, index: number) => any
  columnDef: EngineColumnDef<T>
  depth: number
  parent?: EngineColumn<T>
  columns: EngineColumn<T>[]

  // Tree traversal
  getFlatColumns: () => EngineColumn<T>[]
  getLeafColumns: () => EngineColumn<T>[]

  // Visibility
  getIsVisible: () => boolean
  getCanHide: () => boolean
  toggleVisibility: (value?: boolean) => void

  // Pinning
  getIsPinned: () => ColumnPinningPosition
  getPinnedIndex: () => number
  getStart: (position?: ColumnPinningPosition | 'center') => number
  getAfter: (position?: ColumnPinningPosition | 'center') => number

  // Sizing
  getSize: () => number
  getCanResize: () => boolean
  getIsResizing: () => boolean

  // Sorting
  getCanSort: () => boolean
  getIsSorted: () => false | 'asc' | 'desc'
  getSortIndex: () => number
  toggleSorting: (desc?: boolean, isMulti?: boolean) => void
  clearSorting: () => void
  getToggleSortingHandler: () => (event: unknown) => void
  getCanMultiSort: () => boolean

  // Filtering
  getCanFilter: () => boolean
  getFilterValue: () => unknown
  setFilterValue: (value: unknown) => void

  // Grouping
  getIsGrouped: () => boolean
  getGroupedIndex: () => number

  // Ordering
  getIndex: (position?: ColumnPinningPosition | 'center') => number
}

// ---------------------------------------------------------------------------
// Header / HeaderGroup
// ---------------------------------------------------------------------------

export interface EngineHeaderGroup<T = any> {
  id: string
  depth: number
  headers: EngineHeader<T>[]
}

export interface EngineHeader<T = any> {
  id: string
  column: EngineColumn<T>
  index: number
  depth: number
  isPlaceholder: boolean
  placeholderId?: string
  colSpan: number
  rowSpan: number
  subHeaders: EngineHeader<T>[]
  headerGroup: EngineHeaderGroup<T>

  getLeafHeaders: () => EngineHeader<T>[]
  getContext: () => { table: EngineTable<T>; header: EngineHeader<T>; column: EngineColumn<T> }
  getSize: () => number
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

export interface EngineRow<T = any> {
  id: string
  index: number
  original: T
  depth: number
  parentId?: string
  subRows: EngineRow<T>[]

  // Value access
  getValue: <TValue = unknown>(columnId: string) => TValue
  renderValue: <TValue = unknown>(columnId: string) => TValue
  _valuesCache: Record<string, unknown>
  _groupingValuesCache: Record<string, unknown>

  // Cells
  getAllCells: () => EngineCell<T>[]
  getVisibleCells: () => EngineCell<T>[]

  // Selection
  getIsSelected: () => boolean
  toggleSelected: (value?: boolean) => void
  getCanSelect: () => boolean
  getCanMultiSelect: () => boolean

  // Expansion
  getIsExpanded: () => boolean
  toggleExpanded: (expanded?: boolean) => void
  getCanExpand: () => boolean

  // Grouping
  getIsGrouped: () => boolean
  groupingColumnId?: string
  groupingValue?: unknown
  leafRows?: EngineRow<T>[]
  getGroupingValue: (columnId: string) => unknown

  // Navigation
  getLeafRows: () => EngineRow<T>[]
  getParentRow: () => EngineRow<T> | undefined
  getParentRows: () => EngineRow<T>[]
}

// ---------------------------------------------------------------------------
// Cell
// ---------------------------------------------------------------------------

export interface EngineCell<T = any> {
  id: string
  row: EngineRow<T>
  column: EngineColumn<T>

  getValue: <TValue = unknown>() => TValue
  renderValue: <TValue = unknown>() => TValue | null
  getContext: () => {
    table: EngineTable<T>
    column: EngineColumn<T>
    row: EngineRow<T>
    cell: EngineCell<T>
    getValue: <TValue = unknown>() => TValue
    renderValue: <TValue = unknown>() => TValue | null
  }

  // Grouping
  getIsGrouped: () => boolean
  getIsAggregated: () => boolean
  getIsPlaceholder: () => boolean
}

// ---------------------------------------------------------------------------
// Row Model
// ---------------------------------------------------------------------------

export interface EngineRowModel<T = any> {
  rows: EngineRow<T>[]
  flatRows: EngineRow<T>[]
  rowsById: Record<string, EngineRow<T>>
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export interface EngineTable<T = any> {
  // Header groups
  getHeaderGroups: () => EngineHeaderGroup<T>[]
  getFooterGroups: () => EngineHeaderGroup<T>[]

  // Columns
  getAllColumns: () => EngineColumn<T>[]
  getAllLeafColumns: () => EngineColumn<T>[]
  getAllFlatColumns: () => EngineColumn<T>[]
  getVisibleLeafColumns: () => EngineColumn<T>[]
  getLeftLeafColumns: () => EngineColumn<T>[]
  getRightLeafColumns: () => EngineColumn<T>[]
  getColumn: (columnId: string) => EngineColumn<T> | undefined

  // Row models
  getRowModel: () => EngineRowModel<T>
  getCoreRowModel: () => EngineRowModel<T>
  getFilteredRowModel: () => EngineRowModel<T>
  getSelectedRowModel: () => EngineRowModel<T>
  getPrePaginationRowModel: () => EngineRowModel<T>
  getRow: (rowId: string, searchAll?: boolean) => EngineRow<T> | undefined

  // Row creation
  createRow: (id: string, original: T, index: number, depth: number, subRows?: T[], parentId?: string) => EngineRow<T>

  // Selection
  toggleAllPageRowsSelected: (value: boolean) => void
  toggleAllRowsSelected: (value: boolean) => void

  // Sizing
  getTotalSize: () => number

  // State
  getState: () => Record<string, any>

  // Options
  options: {
    meta?: Record<string, any>
    getRowId?: (row: T, index: number, parent?: EngineRow<T>) => string
    enableColumnResizing?: boolean
    enableSorting?: boolean
    enableMultiSort?: boolean
    isMultiSortEvent?: (event: unknown) => boolean
    maxMultiSortColCount?: number
    renderFallbackValue?: any
    [key: string]: any
  }
}

// ---------------------------------------------------------------------------
// Filter
// ---------------------------------------------------------------------------

/** Filter function interface */
export interface FilterFn<T> {
  (row: EngineRow<T>, columnId: string, filterValue: any, addMeta: (meta: any) => void): boolean
  resolveFilterValue?: (val: any) => any
  autoRemove?: (val: any) => boolean
}
