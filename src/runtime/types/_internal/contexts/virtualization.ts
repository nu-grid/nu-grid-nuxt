import type { TableData } from '@nuxt/ui'
import type { ComputedRef, Ref } from 'vue'
import type { GroupVirtualRowItem, NuGridVirtualizer } from '../virtualization'

/**
 * Virtualization context
 * Virtual scrolling and sticky positioning
 */
export interface NuGridVirtualizationContext<T extends TableData = TableData> {
  virtualizer: Ref<NuGridVirtualizer> | null
  virtualizationEnabled: ComputedRef<boolean>
  virtualRowItems: ComputedRef<GroupVirtualRowItem<T>[]>
  measuredVirtualSizes: ComputedRef<Map<number, number> | null>
  getVirtualItemHeight: (index: number) => number
  stickyOffsets: ComputedRef<Map<number, number>>
  stickyEnabled: ComputedRef<boolean>
  showHeaders: ComputedRef<boolean>
}
