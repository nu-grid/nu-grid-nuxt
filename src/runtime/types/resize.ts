import type { Ref } from 'vue'

import type { Header } from '../engine'
import type { TableData } from './table-data'

/**
 * Type for nugrid-resizefns injection
 * Provides column resize functionality
 */
export interface NuGridColumnResize<T extends TableData = TableData> {
  handleResizeStart: (event: MouseEvent | TouchEvent, header: Header<T>) => void
  handleGroupResizeStart: (event: MouseEvent | TouchEvent, header: Header<T>) => void
  handleResizeEnd: () => void
  resizingGroupId: Ref<string | null>
  resizingColumnId: Ref<string | null>
  /** Set of column IDs that have been manually resized by the user */
  manuallyResizedColumns: Ref<Set<string>>
}
