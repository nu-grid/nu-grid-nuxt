/**
 * NuGrid state type definitions.
 */

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

export interface ColumnSort {
  id: string
  desc: boolean
}

export type SortingState = ColumnSort[]

export type SortDirection = 'asc' | 'desc'

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

export interface ColumnFilter {
  id: string
  value: unknown
}

export type ColumnFiltersState = ColumnFilter[]

// ---------------------------------------------------------------------------
// Column Pinning
// ---------------------------------------------------------------------------

export interface ColumnPinningState {
  left?: string[]
  right?: string[]
}

// ---------------------------------------------------------------------------
// Row Selection
// ---------------------------------------------------------------------------

export type RowSelectionState = Record<string, boolean>

// ---------------------------------------------------------------------------
// Visibility
// ---------------------------------------------------------------------------

export type VisibilityState = Record<string, boolean>

// ---------------------------------------------------------------------------
// Column Order
// ---------------------------------------------------------------------------

export type ColumnOrderState = string[]

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

export type GroupingState = string[]

// ---------------------------------------------------------------------------
// Expansion
// ---------------------------------------------------------------------------

export type ExpandedState = true | Record<string, boolean>

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface PaginationState {
  pageIndex: number
  pageSize: number
}

// ---------------------------------------------------------------------------
// Column Sizing
// ---------------------------------------------------------------------------

export type ColumnSizingState = Record<string, number>

export interface ColumnSizingInfoState {
  columnSizingStart: [string, number][]
  deltaOffset: null | number
  deltaPercentage: null | number
  isResizingColumn: false | string
  startOffset: null | number
  startSize: null | number
}

// ---------------------------------------------------------------------------
// Row Pinning
// ---------------------------------------------------------------------------

export interface RowPinningState {
  bottom?: string[]
  top?: string[]
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

export type Updater<T> = T | ((old: T) => T)
