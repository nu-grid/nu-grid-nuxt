import type { Row } from '@tanstack/vue-table'
import type { NuGridActionMenuButton, NuGridActionMenuColumnDef } from './_internal'

/**
 * Action menu item type - compatible with UDropdownMenu items
 */
export type NuGridActionMenuItem =
  | {
      type?: 'label' | 'separator'
      label?: string
    }
  | {
      label: string
      icon?: string
      color?: 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'
      disabled?: boolean
      onSelect?: (event?: Event) => void
    }

/**
 * Action menu options for configuring the action menu column
 */
export interface NuGridActionMenuOptions<T = any> {
  /**
   * Whether actions column is enabled
   * @default false
   */
  enabled?: boolean
  /**
   * Function that returns menu items for a specific row
   * @param row - The row data
   * @returns Array of menu items
   */
  getActions?: (row: Row<T>) => NuGridActionMenuItem[]
  /**
   * Function that determines if the action menu is enabled for a specific row
   * @param row - The row data
   * @returns Whether the action menu should be enabled
   * @default () => true
   */
  isRowEnabled?: (row: Row<T>) => boolean
  /**
   * Button configuration for the action menu trigger
   * @default { icon: 'i-lucide-ellipsis-vertical', color: 'neutral', variant: 'ghost', class: 'ml-auto' }
   */
  button?: NuGridActionMenuButton
  /**
   * Whether the action menu column should be hidden (but still in columns collection)
   * @default false
   */
  hidden?: boolean
  /**
   * Column definition overrides for the action menu column
   * Allows customizing properties like size, enableResizing, enableReordering, etc.
   * @example
   * // Allow resizing and reordering the action menu column
   * columnDef: {
   *   enableResizing: true,
   *   enableReordering: true,
   *   size: 80,
   *   minSize: 50,
   *   maxSize: 120
   * }
   */
  columnDef?: NuGridActionMenuColumnDef
}
