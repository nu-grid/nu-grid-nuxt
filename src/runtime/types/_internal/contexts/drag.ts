import type { TableData } from '@nuxt/ui'
import type { ComputedRef } from 'vue'
import type { RowDragOptions } from '../../../composables/_internal/useNuGridRowDragDrop'
import type { NuGridColumnDragDrop, NuGridRowDragDrop } from '../../drag-drop'

/**
 * Drag & Drop context
 * Column and row drag operations
 */
export interface NuGridDragContext<T extends TableData = TableData> {
  dragFns: NuGridColumnDragDrop<T>
  rowDragFns: NuGridRowDragDrop<T>
  rowDragOptions: ComputedRef<RowDragOptions>
}
