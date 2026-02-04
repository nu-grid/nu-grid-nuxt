import type { TableData } from '@nuxt/ui'
import type { Cell, Column, ColumnFiltersState, Row, SortingState } from '@tanstack/vue-table'

import type { NuGridStateSnapshot } from '../composables/_internal/useNuGridStatePersistence'

import type { RowDragEvent } from './drag-drop'

// ============================================================================
// CELL CLICK EVENTS
// ============================================================================

/**
 * Event payload for cell click events
 */
export interface NuGridCellClickEvent<T extends TableData = TableData> {
  /** The row containing the clicked cell */
  row: Row<T>
  /** The column definition of the clicked cell */
  column: Column<T, unknown>
  /** The cell that was clicked */
  cell: Cell<T, unknown>
  /** The current value of the cell */
  value: unknown
  /** The original mouse event */
  event: MouseEvent
}

/**
 * Event payload for row click events
 */
export interface NuGridRowClickEvent<T extends TableData = TableData> {
  /** The row that was clicked */
  row: Row<T>
  /** The original mouse event */
  event: MouseEvent
}

// ============================================================================
// FOCUS EVENTS
// ============================================================================

/**
 * Event payload for focused cell changed events
 */
export interface NuGridFocusedCellChangedEvent<T extends TableData = TableData> {
  /** Current row ID (null if no cell focused) */
  rowId: string | null
  /** Current column ID (null if no cell focused) */
  columnId: string | null
  /** Current row index (-1 if no cell focused) */
  rowIndex: number
  /** Current column index (-1 if no cell focused) */
  columnIndex: number
  /** The currently focused row (null if no cell focused) */
  row: Row<T> | null
  /** The currently focused column (null if no cell focused) */
  column: Column<T, unknown> | null
  /** Previous row index (null if no previous focus) */
  previousRowIndex: number | null
  /** Previous column index (null if no previous focus) */
  previousColumnIndex: number | null
}

/**
 * Event payload for focused row changed events
 */
export interface NuGridFocusedRowChangedEvent<T extends TableData = TableData> {
  /** Current row ID (null if no row focused) */
  rowId: string | null
  /** Current row index (-1 if no row focused) */
  rowIndex: number
  /** The currently focused row (null if no row focused) */
  row: Row<T> | null
  /** Previous row index (null if no previous focus) */
  previousRowIndex: number | null
  /** The previously focused row (null if no previous focus) */
  previousRow: Row<T> | null
}

/**
 * Event payload for keydown events.
 * Fires before NuGrid's internal handlers, allowing custom keyboard shortcuts.
 * Set `handled = true` to prevent NuGrid's default handling.
 */
export interface NuGridKeydownEvent<T extends TableData = TableData> {
  /** The keyboard event */
  event: KeyboardEvent
  /** The currently focused row (null if no row focused) */
  row: Row<T> | null
  /** The original row data for convenience (same as row.original) */
  rowData: T | null
  /** Current row ID (null if no row focused) */
  rowId: string | null
  /** Current row index (-1 if no row focused) */
  rowIndex: number
  /** The currently focused column (null if no cell focused, or focus mode is 'row') */
  column: Column<T, unknown> | null
  /** Current column ID (null if no cell focused, or focus mode is 'row') */
  columnId: string | null
  /** The column header name (null if no cell focused, or focus mode is 'row') */
  columnName: string | null
  /** Current column index (-1 if no cell focused, or focus mode is 'row') */
  columnIndex: number
  /** The currently focused cell (null if no cell focused, or focus mode is 'row') */
  cell: Cell<T, unknown> | null
  /** The current cell value (null if no cell focused, or focus mode is 'row') */
  value: unknown
  /** Set to true to prevent NuGrid's internal handling of this key */
  handled: boolean
}

// ============================================================================
// EDITING LIFECYCLE EVENTS
// ============================================================================

/**
 * Event payload for cell editing started events
 */
export interface NuGridCellEditingStartedEvent<T extends TableData = TableData> {
  /** The row being edited */
  row: Row<T>
  /** The column being edited */
  column: Column<T, unknown>
  /** The initial value when editing started */
  value: unknown
}

/**
 * Event payload for cell editing cancelled events
 */
export interface NuGridCellEditingCancelledEvent<T extends TableData = TableData> {
  /** The row that was being edited */
  row: Row<T>
  /** The column that was being edited */
  column: Column<T, unknown>
  /** The value when editing was cancelled */
  value: unknown
}

/**
 * Event payload for cell value changed events
 */
export interface NuGridCellValueChangedEvent<T extends TableData = TableData> {
  /** The row that was modified */
  row: Row<T>
  /** The column that was modified */
  column: Column<T, unknown>
  /** The previous value before the change */
  oldValue: unknown
  /** The new value after the change */
  newValue: unknown
}

// ============================================================================
// STATE CHANGE EVENTS
// ============================================================================

/**
 * Event payload for sort changed events
 */
export interface NuGridSortChangedEvent {
  /** The current sorting state */
  sorting: SortingState
}

/**
 * Event payload for filter changed events
 */
export interface NuGridFilterChangedEvent {
  /** The current column filters state */
  columnFilters: ColumnFiltersState
}

/**
 * Event payload for page changed events (server-side pagination)
 * Emitted when the page index or page size changes, allowing the parent
 * to fetch new data from the server.
 */
export interface NuGridPageChangedEvent {
  /** The new page index (0-based) */
  pageIndex: number
  /** The current page size */
  pageSize: number
  /** Current sorting state (for server-side sorting) */
  sorting: SortingState
  /** Current column filters (for server-side filtering) */
  columnFilters: ColumnFiltersState
  /** Current global filter/search query (for server-side search) */
  globalFilter: string | undefined
}

// ============================================================================
// CENTRALIZED EVENT EMITTER
// ============================================================================

/**
 * Centralized event emitter interface for NuGrid events.
 * This is provided at the grid level and injected into composables
 * to emit events without threading callbacks through parameters.
 *
 * @example
 * ```typescript
 * // In NuGrid.vue
 * const eventEmitter: NuGridEventEmitter<T> = {
 *   cellClicked: (e) => emit('cellClicked', e),
 *   // ... other events
 * }
 * provide('nugrid-events', eventEmitter)
 *
 * // In composables
 * const eventEmitter = inject<NuGridEventEmitter<T>>('nugrid-events')
 * eventEmitter?.cellClicked?.(event)
 * ```
 */
export interface NuGridEventEmitter<T extends TableData = TableData> {
  // Click events
  /** Emit when a cell is clicked */
  cellClicked?: (event: NuGridCellClickEvent<T>) => void
  /** Emit when a cell is double-clicked */
  cellDoubleClicked?: (event: NuGridCellClickEvent<T>) => void
  /** Emit when a row is clicked */
  rowClicked?: (event: NuGridRowClickEvent<T>) => void
  /** Emit when a row is double-clicked */
  rowDoubleClicked?: (event: NuGridRowClickEvent<T>) => void

  // Focus events
  /** Emit when the focused cell changes */
  focusedCellChanged?: (event: NuGridFocusedCellChangedEvent<T>) => void
  /** Emit when the focused row changes */
  focusedRowChanged?: (event: NuGridFocusedRowChangedEvent<T>) => void

  // Keyboard events
  /** Emit when a keydown event wasn't handled by internal handlers */
  keydown?: (event: NuGridKeydownEvent<T>) => void

  // Editing lifecycle events
  /** Emit when cell editing starts */
  cellEditingStarted?: (event: NuGridCellEditingStartedEvent<T>) => void
  /** Emit when cell editing is cancelled */
  cellEditingCancelled?: (event: NuGridCellEditingCancelledEvent<T>) => void
  /** Emit when a cell value is changed */
  cellValueChanged?: (event: NuGridCellValueChangedEvent<T>) => void

  // State change events
  /** Emit when sorting changes */
  sortChanged?: (event: NuGridSortChangedEvent) => void
  /** Emit when column filters change */
  filterChanged?: (event: NuGridFilterChangedEvent) => void
  /** Emit when the page changes (for server-side pagination) */
  pageChanged?: (event: NuGridPageChangedEvent) => void

  // Migrated existing events
  /** Emit when a row is dragged and dropped */
  rowDragged?: (event: RowDragEvent<T>) => void
  /** Emit when grid state changes (for persistence) */
  stateChanged?: (state: NuGridStateSnapshot) => void
}

/**
 * Injection key for the event emitter
 */
export const NUGRID_EVENTS_KEY = 'nugrid-events' as const
