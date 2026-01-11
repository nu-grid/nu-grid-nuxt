import type { TableData } from '@nuxt/ui'
import type { Header, Table } from '@tanstack/vue-table'
import type { Ref } from 'vue'
import type { NuGridColumnDragDrop } from '../../types/_internal'
import { markRaw, ref } from 'vue'
/**
 * Column drag and drop functionality
 */
export function useNuGridColumnDragDrop<T extends TableData>(
  tableApi: Table<T>,
  columnOrderState: Ref<string[]>,
  tableRef: Ref<HTMLDivElement | null>,
) {
  const draggedColumnId = ref<string | null>(null)
  const dropTargetColumnId = ref<string | null>(null)
  const dropPosition = ref<'left' | 'right'>('right')
  const isDraggingOutside = ref(false)

  function handleColumnDragStart(e: DragEvent, columnId: string) {
    draggedColumnId.value = columnId
    isDraggingOutside.value = false
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', columnId)
    }
    document.body.classList.add('is-dragging-column')
  }

  function handleColumnDragOver(e: DragEvent, columnId: string) {
    // Check if the target column allows reordering
    const targetColumn = tableApi.getColumn(columnId)
    if (targetColumn && (targetColumn.columnDef as any).enableReordering === false) {
      return
    }
    if (!draggedColumnId.value || draggedColumnId.value === columnId) {
      return
    }
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }

    // Calculate if mouse is in left or right half of the target column
    const target = e.currentTarget as HTMLElement
    if (target) {
      const rect = target.getBoundingClientRect()
      const mouseX = e.clientX
      const columnMidpoint = rect.left + rect.width / 2

      dropPosition.value = mouseX < columnMidpoint ? 'left' : 'right'
    }

    dropTargetColumnId.value = columnId
    isDraggingOutside.value = false
  }

  function handleColumnDrop(e: DragEvent, columnId: string) {
    e.preventDefault()
    // Check if the target column allows reordering
    const targetColumn = tableApi.getColumn(columnId)
    if (targetColumn && (targetColumn.columnDef as any).enableReordering === false) {
      return
    }
    if (!draggedColumnId.value || draggedColumnId.value === columnId) {
      return
    }

    // Check if the dragged column is pinned and unpin it
    const currentPinning = tableApi.getState().columnPinning
    const draggedColId = draggedColumnId.value
    const isPinnedLeft = currentPinning.left?.includes(draggedColId)
    const isPinnedRight = currentPinning.right?.includes(draggedColId)

    if (isPinnedLeft || isPinnedRight) {
      // Unpin the column before reordering
      const newPinning = {
        left: currentPinning.left?.filter((id) => id !== draggedColId) || [],
        right: currentPinning.right?.filter((id) => id !== draggedColId) || [],
      }
      tableApi.setColumnPinning(newPinning)
    }

    const allColumns = tableApi.getAllLeafColumns()
    const draggedIndex = allColumns.findIndex((col) => col.id === draggedColumnId.value)
    const targetIndex = allColumns.findIndex((col) => col.id === columnId)

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newColumnOrder = allColumns
        .map((col) => col.id)
        .filter((id): id is string => id !== undefined)
      const [removed] = newColumnOrder.splice(draggedIndex, 1)
      if (removed) {
        // Calculate the actual insert position based on drop position
        let insertIndex = targetIndex

        // If dropping to the right, we want to insert after the target
        if (dropPosition.value === 'right') {
          insertIndex = targetIndex + 1
        }

        // Adjust if we're moving from before the target (indices shift)
        if (draggedIndex < targetIndex) {
          insertIndex -= 1
        }

        newColumnOrder.splice(insertIndex, 0, removed)
        columnOrderState.value = newColumnOrder
      }
    }

    draggedColumnId.value = null
    dropTargetColumnId.value = null
    isDraggingOutside.value = false
  }

  function handleColumnDragEnd() {
    draggedColumnId.value = null
    dropTargetColumnId.value = null
    isDraggingOutside.value = false
    document.body.classList.remove('is-dragging-column')
    document.body.classList.remove('is-dragging-column-outside')
  }

  function handleColumnDragLeave(e: DragEvent) {
    const relatedTarget = e.relatedTarget
    if (
      !relatedTarget
      || !(relatedTarget instanceof HTMLElement)
      || !tableRef.value?.contains(relatedTarget)
    ) {
      isDraggingOutside.value = true
      dropTargetColumnId.value = null
      document.body.classList.add('is-dragging-column-outside')
      document.body.classList.remove('is-dragging-column')
    }
  }

  function handleColumnDragEnter() {
    if (isDraggingOutside.value) {
      isDraggingOutside.value = false
      document.body.classList.remove('is-dragging-column-outside')
      document.body.classList.add('is-dragging-column')
    }
  }

  function isHeaderDraggable(header: Header<T, any>): boolean {
    const columnId = header.column.id
    // Check if the column allows reordering
    const enableReordering = (header.column.columnDef as any).enableReordering
    if (enableReordering === false) {
      return false
    }
    return !header.isPlaceholder && header.colSpan === 1 && !!columnId
  }

  function headerDragProps(header: Header<T, any>) {
    return {
      'data-dragging': draggedColumnId.value === header.column.id ? 'true' : 'false',
      'data-drop-target': dropTargetColumnId.value === header.column.id ? 'true' : 'false',
      'data-drop-position':
        dropTargetColumnId.value === header.column.id ? dropPosition.value : undefined,
      'onDragover': (e: DragEvent) =>
        isHeaderDraggable(header) && handleColumnDragOver(e, header.column.id),
      'onDrop': (e: DragEvent) =>
        isHeaderDraggable(header) && handleColumnDrop(e, header.column.id),
      'onDragend': handleColumnDragEnd,
      'onDragleave': handleColumnDragLeave,
      'onDragenter': handleColumnDragEnter,
    }
  }

  function headerDragHandleProps(header: Header<T, any>) {
    return {
      draggable: isHeaderDraggable(header),
      class: isHeaderDraggable(header) ? 'cursor-move' : '',
      onDragstart: (e: DragEvent) =>
        isHeaderDraggable(header) && handleColumnDragStart(e, header.column.id),
    }
  }

  // Use markRaw for the static handler functions to prevent unnecessary reactivity overhead
  const dragFns: NuGridColumnDragDrop<T> = {
    draggedColumnId,
    dropTargetColumnId,
    dropPosition,
    isDraggingOutside,
    ...markRaw({
      handleColumnDragStart,
      handleColumnDragOver,
      handleColumnDrop,
      handleColumnDragEnd,
      handleColumnDragLeave,
      handleColumnDragEnter,
      isHeaderDraggable,
      headerDragHandleProps,
      headerDragProps,
    }),
  }

  return dragFns
}
