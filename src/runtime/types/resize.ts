import type { TableData } from '@nuxt/ui'
import type { Header } from '@tanstack/vue-table'
import type { Ref } from 'vue'

/**
 * Type for nugrid-resizefns injection
 * Provides column resize functionality
 */
export interface NuGridColumnResize<T extends TableData = TableData> {
  handleResizeStart: (event: MouseEvent | TouchEvent, header: Header<T, any>) => void
  handleGroupResizeStart: (event: MouseEvent | TouchEvent, header: Header<T, any>) => void
  handleResizeEnd: () => void
  resizingGroupId: Ref<string | null>
  resizingColumnId: Ref<string | null>
}
