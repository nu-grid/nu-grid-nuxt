/**
 * @internal
 */

import type { TableData } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import type { Ref } from 'vue'

/**
 * Focused cell position
 * @internal
 */
export interface NuGridFocusedCell {
  rowIndex: number
  columnIndex: number
  groupId?: string
  suppressOutline?: boolean
}

/**
 * Type for nugrid-focusfns injection
 * Provides cell and row focus management
 * @internal
 */
export interface NuGridFocus<T extends TableData = TableData> {
  focusedCell: Ref<NuGridFocusedCell | null>
  gridHasFocus: Ref<boolean>
  onCellClick: (e: Event, row: Row<T>, columnIndex: number) => void
  onCellKeyDown: (e: KeyboardEvent) => void
  onCellKeyUp: (e: KeyboardEvent) => void
  getRowTabIndex: (row: Row<T>) => number
  shouldRowHandleKeydown: (row: Row<T>) => boolean
  getCellTabIndex: (row: Row<T>, cellIndex: number) => number
  shouldCellHandleKeydown: (row: Row<T>, cellIndex: number) => boolean
  isActiveRow: (row: Row<T>) => boolean
  isFocusedRow: (row: Row<T>) => boolean
  isFocusedCell: (row: Row<T>, cellIndex: number) => boolean
  rowFocusProps: (row: Row<T>) => Record<string, unknown>
  cellFocusProps: (row: Row<T>, cellIndex: number) => Record<string, unknown>
  focusCell: (targetRow: Row<T>, newRowIndex: number, newColumnIndex: number) => void
  findFirstFocusableColumn: (row: Row<T>) => number
  /** Get a cell element by row ID and column index (uses internal cache for performance) */
  getCellElement: (rowId: string, columnIndex: number) => HTMLElement | null
  /** Ensure footer rows are visible when scrolling to bottom of grid */
  ensureFootersVisible: (scrollContainer: HTMLElement) => void
  /** Scroll to a cell and focus it, with proper scroll management */
  scrollToCellAndFocus: (options: {
    cellElement: HTMLElement
    rowId: string
    rowIndex: number
    columnIndex: number
    behavior?: 'instant' | 'smooth'
    skipHorizontalScroll?: boolean
    onComplete?: () => void
  }) => void
  /** Update focused cell and emit focus events */
  setFocusedCell: (
    newValue: NuGridFocusedCell | null,
    options?: { suppressEvents?: boolean },
  ) => void
  /**
   * Focus a row by its ID, scrolling to make it visible
   * @param rowId - The ID of the row to focus, or null to clear focus
   * @param options - Optional settings for focus behavior
   * @returns true if row was found and focused, false if row ID not found
   */
  focusRowById: (
    rowId: string | null,
    options?: {
      columnIndex?: number
      /** Scroll alignment: 'nearest' just makes visible, 'top' scrolls row to top, 'center' centers the row */
      align?: 'nearest' | 'top' | 'center'
    },
  ) => boolean
}
