import type { TableData } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import type { NuGridSelectionColumnDef } from './_internal'

/**
 * Row selection options object type for advanced configuration
 */
export interface NuGridRowSelectOptions<T extends TableData = TableData> {
  /**
   * Selection mode: 'single' or 'multi'
   * @default 'multi'
   */
  mode?: 'single' | 'multi'
  /**
   * Whether the selection column should be hidden (but still in columns collection)
   * @default false
   */
  hidden?: boolean
  /**
   * Whether the checkboxes should be clickable
   * @default true
   */
  enabled?: boolean
  /**
   * Function to determine if a specific row can be selected
   * When returns false, the row's checkbox is disabled and spacebar/clicks won't toggle selection
   * @param row - The TanStack Table Row object
   * @returns boolean - true if row can be selected, false otherwise
   * @default () => true
   * @example
   * // Disable selection for inactive employees
   * rowSelectionEnabled: (row) => row.original.status !== 'inactive'
   */
  rowSelectionEnabled?: (row: Row<T>) => boolean
  /**
   * Column definition overrides for the selection column
   * Allows customizing properties like size, enableResizing, enableReordering, etc.
   * @example
   * // Allow resizing and reordering the selection column
   * columnDef: {
   *   enableResizing: true,
   *   enableReordering: true,
   *   size: 60,
   *   minSize: 40,
   *   maxSize: 80
   * }
   */
  columnDef?: NuGridSelectionColumnDef
}
