import type { TableData } from '@nuxt/ui'
import type { NuGridCellEditing } from '../cell-editing'
import type { NuGridFocus } from '../focus'

/**
 * Focus & Editing context
 * Cell focus navigation and editing
 */
export interface NuGridFocusContext<T extends TableData = TableData> {
  focusFns: NuGridFocus<T>
  cellEditingFns: NuGridCellEditing<T>
}
