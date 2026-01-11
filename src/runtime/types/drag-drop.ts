import type { TableData } from '@nuxt/ui'
import type { Header, Row } from '@tanstack/vue-table'
import type { MaybeRef, Ref } from 'vue'

/**
 * Event payload for row drag events
 */
export interface RowDragEvent<T extends TableData = TableData> {
  /**
   * The row data that was dragged
   */
  row: T

  /**
   * Original index in the data array before drag
   */
  originalIndex: number

  /**
   * New index in the data array after drop
   */
  newIndex: number

  /**
   * Grid ID where the drag originated (for cross-grid dragging)
   */
  sourceGridId?: string

  /**
   * Grid ID where the item was dropped (for cross-grid dragging)
   */
  targetGridId?: string

  /**
   * Group value where the drag originated (for grouped tables)
   */
  sourceGroup?: string

  /**
   * Group value where the item was dropped (for grouped tables)
   */
  targetGroup?: string

  /**
   * Position change: positive means moved down, negative means moved up
   */
  positionChange: number

  /**
   * Whether the row was moved to a different group
   */
  groupChanged: boolean

  /**
   * Whether the row was moved to a different grid
   */
  gridChanged: boolean

  /**
   * The drop position relative to target ('before' or 'after')
   */
  dropPosition: 'before' | 'after'
}

/**
 * Type for nugrid-dragfns injection
 * Provides column drag and drop functionality
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
