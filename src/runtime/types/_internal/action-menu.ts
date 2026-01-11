/**
 * @internal
 */

import type { TableColumn, TableData } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import type { Ref } from 'vue'
import type { NuGridActionMenuItem } from '../action-menu'

/**
 * Button configuration for the action menu trigger
 * @internal
 */
export interface NuGridActionMenuButton {
  /**
   * Icon to display on the button
   * @default 'i-lucide-ellipsis-vertical'
   */
  icon?: string
  /**
   * Button color
   * @default 'neutral'
   */
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  /**
   * Button variant
   * @default 'ghost'
   */
  variant?: 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link'
  /**
   * Additional CSS classes for the button
   * @default 'ml-auto'
   */
  class?: string
}

/**
 * Column definition overrides for the action menu column
 * Excludes properties that are required for the action menu column to function correctly
 * @internal
 */
export type NuGridActionMenuColumnDef<T extends TableData = TableData> = Partial<
  Omit<TableColumn<T>, 'id' | 'header' | 'cell' | 'accessorFn' | 'meta' | 'cellDataType'>
>

/**
 * Meta data stored on the action menu column
 * @internal
 */
export interface NuGridActionMenuColumnMeta<T = any> {
  actionMenuEnabled: boolean
  enabledRef?: Ref<boolean>
  getActions?: (row: Row<T>) => NuGridActionMenuItem[]
  isRowEnabledFn?: (row: Row<T>) => boolean
  button: NuGridActionMenuButton
  /**
   * Map of row ID to menu open state ref
   * Used for keyboard navigation to toggle menus without DOM manipulation
   */
  menuOpenStates: Map<string, Ref<boolean>>
}
