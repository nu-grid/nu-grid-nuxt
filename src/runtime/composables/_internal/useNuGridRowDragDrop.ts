import type { TableData } from '@nuxt/ui'
import type { Row, Table } from '@tanstack/vue-table'
import type { Ref } from 'vue'

import type { NuGridEventEmitter } from '../../types'
import type { RowDragEvent } from '../../types/drag-drop'

import { markRaw, ref, toRaw, toRef } from 'vue'

// Re-export for backwards compatibility
export type { RowDragEvent } from '../../types/drag-drop'

export interface RowDragOptions {
  /**
   * Enable row dragging
   * @defaultValue false
   */
  enabled?: boolean

  /**
   * Field name to update with new sort order after drag
   * @defaultValue undefined
   */
  sortOrderField?: string

  /**
   * Allow dragging rows between groups
   * @defaultValue false
   */
  allowCrossGroup?: boolean

  /**
   * Allow dragging rows between different grid instances
   * @defaultValue false
   */
  allowCrossGrid?: boolean

  /**
   * Grid instance ID for cross-grid dragging
   * @defaultValue undefined
   */
  gridId?: string
}

interface NuGridRowDragDrop<T extends TableData = TableData> {
  draggedRowId: Ref<string | null>
  draggedRowData: Ref<any>
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

/**
 * Row drag and drop functionality
 */
export function useNuGridRowDragDrop<T extends TableData>(
  tableApi: Table<T>,
  data: Ref<T[]>,
  options: Ref<RowDragOptions>,
  tableRef: Ref<HTMLDivElement | null>,
  emit?: (event: string, ...args: any[]) => void,
  eventEmitter?: NuGridEventEmitter<T>,
) {
  const draggedRowId = ref<string | null>(null)
  const draggedRowData = ref<any>(null)
  const dropTargetRowId = ref<string | null>(null)
  const dropPosition = ref<'before' | 'after'>('after')
  const dragSourceGridId = ref<string | null>(null)
  const isDraggingOutside = ref(false)

  function isRowDraggable(_row: Row<T>): boolean {
    if (!options.value.enabled) return false

    // Disable dragging if table is sorted
    const sortingState = tableApi.getState().sorting
    if (sortingState && sortingState.length > 0) {
      return false
    }

    return true
  }

  function handleRowDragStart(e: DragEvent, row: Row<T>) {
    if (!isRowDraggable(row)) return

    // Set cursor immediately before any other operations
    document.body.classList.add('is-dragging-row')

    // Use original data ID, not row model ID (important for grouped tables)
    const dataId = (row.original as any).id
    draggedRowId.value = dataId
    draggedRowData.value = row.original
    dragSourceGridId.value = options.value.gridId || null
    isDraggingOutside.value = false

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'

      // Get the row's index in the current data
      const rows = tableApi.getRowModel().rows
      const rowIndex = rows.findIndex((r) => r.id === row.id)

      const dragData = {
        rowId: dataId, // Use data ID, not row model ID
        rowData: row.original,
        gridId: options.value.gridId,
        originalIndex: rowIndex,
      }
      e.dataTransfer.setData('application/json', JSON.stringify(dragData))

      // Set custom drag image using the visible portion of the row
      const target = e.target as HTMLElement
      const rowElement = target.closest('[data-row-id]') as HTMLElement
      if (rowElement) {
        // Find the scroll container to get the visible width
        const scrollContainer = rowElement.closest('[data-nugrid-scroll]') || tableRef.value
        const containerRect = scrollContainer?.getBoundingClientRect()
        const rowRect = rowElement.getBoundingClientRect()

        // Calculate visible width (clip to container bounds)
        const visibleLeft = Math.max(rowRect.left, containerRect?.left ?? rowRect.left)
        const visibleRight = Math.min(rowRect.right, containerRect?.right ?? rowRect.right)
        const visibleWidth = visibleRight - visibleLeft
        const scrollOffset = visibleLeft - rowRect.left

        // Create a wrapper that clips to visible area
        const wrapper = document.createElement('div')
        wrapper.style.position = 'absolute'
        wrapper.style.top = '-9999px'
        wrapper.style.left = '-9999px'
        wrapper.style.width = `${visibleWidth}px`
        wrapper.style.height = `${rowRect.height}px`
        wrapper.style.overflow = 'hidden'
        wrapper.style.opacity = '0.9'
        wrapper.style.backgroundColor = 'var(--color-elevated)'
        wrapper.style.borderRadius = '6px'
        wrapper.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'

        // Clone the row and offset it to show the visible portion
        const clone = rowElement.cloneNode(true) as HTMLElement
        clone.style.position = 'relative'
        clone.style.left = `-${scrollOffset}px`
        clone.style.width = `${rowElement.offsetWidth}px`
        clone.style.margin = '0'

        wrapper.appendChild(clone)
        document.body.appendChild(wrapper)

        // Set the drag image with offset relative to visible area
        const offsetX = e.clientX - visibleLeft
        const offsetY = e.clientY - rowRect.top
        e.dataTransfer.setDragImage(wrapper, offsetX, offsetY)

        // Remove the wrapper after a short delay (after drag image is captured)
        requestAnimationFrame(() => {
          setTimeout(() => {
            wrapper.remove()
          }, 0)
        })
      }
    }
  }

  function handleRowDragOver(e: DragEvent, row: Row<T>) {
    // Check if we have drag data (supports cross-grid dragging)
    // Use Array.from for DOMStringList compatibility (DOMStringList has contains, not includes)
    const types = e.dataTransfer?.types
    const typesArray = types ? Array.from(types) : []
    const hasDragData = typesArray.includes('application/json')

    if (!hasDragData && !draggedRowId.value) {
      return
    }

    // Use original data ID, not row model ID (important for grouped tables)
    const dataId = (row.original as any).id

    // Don't allow dropping on the same row
    if (draggedRowId.value === dataId) {
      return
    }

    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }

    // Calculate if we should drop before or after based on mouse position
    const target = e.currentTarget as HTMLElement
    if (target) {
      const rect = target.getBoundingClientRect()
      const mouseY = e.clientY
      const rowMiddle = rect.top + rect.height / 2

      // If mouse is in top half, drop before; otherwise drop after
      dropPosition.value = mouseY < rowMiddle ? 'before' : 'after'
    }

    dropTargetRowId.value = dataId
    isDraggingOutside.value = false
  }

  function handleRowDrop(e: DragEvent, row: Row<T>) {
    e.preventDefault()

    try {
      const dragDataStr = e.dataTransfer?.getData('application/json')
      if (!dragDataStr) {
        return
      }

      const dragData = JSON.parse(dragDataStr)
      const sourceGridId = dragData.gridId
      const targetGridId = options.value.gridId
      const draggedRowIdFromData = dragData.rowId

      // Check if cross-grid drag is allowed
      if (sourceGridId !== targetGridId && !options.value.allowCrossGrid) {
        handleRowDragEnd()
        return
      }

      const rows = tableApi.getRowModel().rows

      // Use data ID to find target row (important for grouped tables where row.id differs from data ID)
      const targetDataId = (row.original as any)?.id
      const targetIndex = rows.findIndex((r) => (r.original as any).id === targetDataId)

      // Check if this is a cross-grid drag
      const isCrossGrid = sourceGridId !== targetGridId

      if (isCrossGrid) {
        // For cross-grid dragging, just emit the event with the drag data
        // The parent component will handle the data transfer
        if (targetIndex !== -1 && emit) {
          // Calculate insert index based on drop position
          let insertIndex = targetIndex
          if (dropPosition.value === 'after') {
            insertIndex = targetIndex + 1
          }

          const event: RowDragEvent<T> = {
            row: dragData.rowData,
            originalIndex: dragData.originalIndex,
            newIndex: insertIndex,
            sourceGridId,
            targetGridId,
            positionChange: insertIndex - dragData.originalIndex,
            groupChanged: false, // Cross-grid doesn't track groups
            gridChanged: true,
            dropPosition: dropPosition.value,
          }

          // Use event emitter (preferred) or fallback to emit callback
          if (eventEmitter?.rowDragged) {
            eventEmitter.rowDragged(event)
          }
          emit?.('rowDragged', event)
        }
      } else {
        // Same-grid reordering
        const effectiveDraggedRowId = draggedRowId.value || draggedRowIdFromData

        // For grouped tables, rows might not be in visible row model
        // Work directly with data array using IDs
        const targetRow = row
        const targetDataId = (targetRow.original as any)?.id
        let groupingField = ''

        // Get grouping information if available
        const groupingState = tableApi.getState().grouping
        let sourceGroup: string | undefined
        let targetGroup: string | undefined

        if (groupingState && groupingState.length > 0) {
          // Get the first grouping column
          groupingField = groupingState[0] as string
        }

        // Find the actual indices in the data array by ID
        const newData = [...data.value]

        // Find dragged item by ID (works even if not in visible row model)
        const draggedDataIndex = newData.findIndex((item: any) => item.id === effectiveDraggedRowId)

        // Find target item by ID (works even if not in visible row model)
        const targetDataIndex = newData.findIndex((item: any) => item.id === targetDataId)

        if (draggedDataIndex !== -1 && targetDataIndex !== -1) {
          const movedItem = newData[draggedDataIndex]

          // CRITICAL: Capture a deep copy of the item IMMEDIATELY before any mutations
          // Vue Proxies can become stale after array splicing
          const movedItemPayload = toRaw(newData[draggedDataIndex]!) as T

          // Get source group from the item itself
          if (groupingField && movedItem) {
            sourceGroup = String((movedItem as any)[groupingField] ?? '')
          }

          // Get target group from target row
          if (groupingField && targetRow?.original) {
            targetGroup = String((targetRow.original as any)[groupingField] ?? '')
          }

          // Remove from source position
          newData.splice(draggedDataIndex, 1)

          if (movedItem) {
            // Adjust target index based on drop position
            let insertIndex = targetDataIndex
            if (dropPosition.value === 'after') {
              // If dropping after, and the dragged item was before target, don't adjust
              // If dropping after, and the dragged item was after target, add 1
              if (draggedDataIndex >= targetDataIndex) {
                insertIndex = targetDataIndex + 1
              } else {
                insertIndex = targetDataIndex
              }
            } else {
              // If dropping before, adjust based on relative positions
              if (draggedDataIndex < targetDataIndex) {
                insertIndex = targetDataIndex - 1
              } else {
                insertIndex = targetDataIndex
              }
            }

            newData.splice(insertIndex, 0, movedItem)

            // If moved to a different group and cross-group is allowed, update the group field
            if (groupingField && sourceGroup !== targetGroup && options.value.allowCrossGroup) {
              ;(movedItem as any)[groupingField] = targetGroup
            }

            // Update sort order field if specified
            if (options.value.sortOrderField) {
              newData.forEach((item, index) => {
                ;(item as any)[options.value.sortOrderField!] = index
              })
            }

            // IMPORTANT: Use the snapshot captured before any mutations
            // movedItem reference is now stale/incorrect after splicing

            data.value = newData

            // Emit row-dragged event
            const event: RowDragEvent<T> = {
              row: movedItemPayload, // Use snapshot, not stale reference
              originalIndex: draggedDataIndex,
              newIndex: insertIndex,
              sourceGridId,
              targetGridId,
              sourceGroup,
              targetGroup,
              positionChange: insertIndex - draggedDataIndex,
              groupChanged: sourceGroup !== targetGroup,
              gridChanged: sourceGridId !== targetGridId,
              dropPosition: dropPosition.value,
            }

            // Use event emitter (preferred) or fallback to emit callback
            if (eventEmitter?.rowDragged) {
              eventEmitter.rowDragged(event)
            }
            emit?.('rowDragged', event)
          }
        }
      }
    } catch (error) {
      console.error('Error handling row drop:', error)
    }

    handleRowDragEnd()
  }

  function handleRowDragEnd() {
    draggedRowId.value = null
    draggedRowData.value = null
    dropTargetRowId.value = null
    dropPosition.value = 'after'
    dragSourceGridId.value = null
    isDraggingOutside.value = false
    document.body.classList.remove('is-dragging-row')
    document.body.classList.remove('is-dragging-row-outside')
  }

  function handleRowDragLeave(e: DragEvent) {
    const relatedTarget = e.relatedTarget
    if (
      !relatedTarget
      || !(relatedTarget instanceof HTMLElement)
      || !tableRef.value?.contains(relatedTarget)
    ) {
      isDraggingOutside.value = true
      dropTargetRowId.value = null
      document.body.classList.add('is-dragging-row-outside')
      document.body.classList.remove('is-dragging-row')
    }
  }

  function handleRowDragEnter() {
    // Check body class directly for cross-grid compatibility
    // When dragging between grids, the source grid sets 'is-dragging-row-outside'
    // but this grid's local state doesn't know about it
    if (document.body.classList.contains('is-dragging-row-outside')) {
      document.body.classList.remove('is-dragging-row-outside')
      document.body.classList.add('is-dragging-row')
    }
    isDraggingOutside.value = false
  }

  function rowDragProps(row: Row<T>) {
    // Use original data ID, not row model ID (important for grouped tables)
    const dataId = (row.original as any).id
    const isDragging = draggedRowId.value === dataId
    const isDropTarget = dropTargetRowId.value === dataId
    const isDropBefore = isDropTarget && dropPosition.value === 'before'
    const isDropAfter = isDropTarget && dropPosition.value === 'after'

    return {
      'data-dragging': isDragging ? 'true' : 'false',
      'data-drop-target': isDropTarget ? 'true' : 'false',
      'data-drop-position': isDropTarget ? dropPosition.value : undefined,
      'class': [
        isDragging && 'opacity-60',
        isDropBefore
          && 'border-t-[3px] border-t-blue-500/80 bg-blue-500/[0.08] transition-all duration-200',
        isDropAfter
          && 'border-b-[3px] border-b-blue-500/80 bg-blue-500/[0.08] transition-all duration-200',
      ]
        .filter(Boolean)
        .join(' '),
      'onDragover': (e: DragEvent) => handleRowDragOver(e, row),
      'onDrop': (e: DragEvent) => handleRowDrop(e, row),
      'onDragend': handleRowDragEnd,
      'onDragleave': handleRowDragLeave,
      'onDragenter': handleRowDragEnter,
    }
  }

  function rowDragHandleProps(row: Row<T>) {
    const draggable = isRowDraggable(row)
    return {
      draggable,
      class: draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed opacity-30',
      onDragstart: (e: DragEvent) => draggable && handleRowDragStart(e, row),
    }
  }

  // Use markRaw for the static handler functions to prevent unnecessary reactivity overhead
  return toRef<NuGridRowDragDrop<T>>({
    draggedRowId,
    draggedRowData,
    dropTargetRowId,
    dropPosition,
    dragSourceGridId,
    isDraggingOutside,
    ...markRaw({
      handleRowDragStart,
      handleRowDragOver,
      handleRowDrop,
      handleRowDragEnd,
      handleRowDragLeave,
      handleRowDragEnter,
      isRowDraggable,
      rowDragHandleProps,
      rowDragProps,
    }),
  })
}
