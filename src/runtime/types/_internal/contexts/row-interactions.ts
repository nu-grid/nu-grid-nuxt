import type { TableData } from '@nuxt/ui'
import type { ComputedRef } from 'vue'
import type { NuGridRowInteractions } from '../../row-interactions'
import type { NuGridRowSelectOptions } from '../../row-selection'

/**
 * Row Interactions context
 * Row selection and interaction handlers
 */
export interface NuGridRowInteractionsContext<T extends TableData = TableData> {
  rowInteractions: NuGridRowInteractions<T>
  rowSelectionMode: ComputedRef<boolean | 'single' | 'multi' | NuGridRowSelectOptions | undefined>
}
