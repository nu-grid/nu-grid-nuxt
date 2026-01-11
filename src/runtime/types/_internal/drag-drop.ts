/**
 * @internal
 */

import type { TableData } from '@nuxt/ui'
import type { Header, Row } from '@tanstack/vue-table'
import type { MaybeRef, Ref } from 'vue'

/**
 * Type for nugrid-dragfns injection
 * Provides column drag and drop functionality
 * @internal
 */
export interface NuGridColumnDragDrop<T extends TableData = TableData> {
  draggedColumnId: MaybeRef<string | null>
  dropTargetColumnId: MaybeRef<string | null>
  dropPosition: MaybeRef<'left' | 'right'>
  isDraggingOutside: Ref<boolean>
  handleColumnDragStart: (e: DragEvent, columnId: string) => void
  handleColumnDragOver: (e: DragEvent, columnId: string) => void
  handleColumnDrop: (e: DragEvent, columnId: string) => void
  handleColumnDragEnd: () => void
  handleColumnDragLeave: (e: DragEvent) => void
  handleColumnDragEnter: () => void
  isHeaderDraggable: (header: Header<T, any>) => boolean
  headerDragHandleProps: (header: Header<T, any>) => Record<string, unknown>
  headerDragProps: (header: Header<T, any>) => Record<string, unknown>
}

/**
 * Type for nugrid-rowdragfns injection
 * Provides row drag and drop functionality
 * @internal
 */
export interface NuGridRowDragDrop<T extends TableData = TableData> {
  draggedRowId: Ref<string | null>
  draggedRowData: Ref<T | null>
  dropTargetRowId: Ref<string | null>
  dropPosition: Ref<'before' | 'after'>
  dragSourceGridId: Ref<string | null>
  isDraggingOutside: Ref<boolean>
  handleRowDragStart: (e: DragEvent, row: Row<T>) => void
  handleRowDragOver: (e: DragEvent, row: Row<T>) => void
  handleRowDrop: (e: DragEvent, row: Row<T>) => void
  handleRowDragEnd: () => void
  handleRowDragLeave: (e: DragEvent) => void
  handleRowDragEnter: () => void
  isRowDraggable: (row: Row<T>) => boolean
  rowDragHandleProps: (row: Row<T>) => Record<string, unknown>
  rowDragProps: (row: Row<T>) => Record<string, unknown>
}
