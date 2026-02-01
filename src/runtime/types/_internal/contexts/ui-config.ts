import type { TableData } from '@nuxt/ui'
import type { ComputedRef, Ref } from 'vue'
import type { NuGridUIReturn } from '../../../composables/_internal/useNuGridUI'
import type { NuGridColumnMenuItemsCallback } from '../../column'
import type {
  NuGridAutoSizeStrategy,
  NuGridColumnMenuButton,
  NuGridResizeMode,
} from '../../option-groups'
import type { NuGridScrollbars } from '../../props'
import type { NuGridSortIcon } from '../../sort-icon'

/**
 * UI Configuration context
 * Styling, scrollbars, column menu, and sort icons
 */
export interface NuGridUIConfigContext<T extends TableData = TableData> {
  sortIcons: ComputedRef<NuGridSortIcon | undefined>
  scrollbarClass: ComputedRef<string>
  scrollbarThemeClass: ComputedRef<string>
  scrollbarAttr: ComputedRef<NuGridScrollbars>
  getColumnMenuItems?: ComputedRef<NuGridColumnMenuItemsCallback<T> | undefined>
  showColumnVisibility: ComputedRef<boolean>
  columnMenuButton: ComputedRef<NuGridColumnMenuButton | undefined>
  checkboxTheme: NuGridUIReturn['checkboxTheme']
  autoSizeMode?: Ref<NuGridAutoSizeStrategy>
  resizeMode?: Ref<NuGridResizeMode>
}
