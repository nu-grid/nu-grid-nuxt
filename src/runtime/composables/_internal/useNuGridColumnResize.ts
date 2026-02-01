import type { TableData } from '@nuxt/ui'
import type { Header, Table } from '@tanstack/vue-table'
import type { NuGridProps } from '../../types'
import { onUnmounted, ref } from 'vue'

function isTouchStartEvent(e: unknown): e is TouchEvent {
  return (e as TouchEvent).type === 'touchstart'
}

/**
 * Column resize functionality with cursor locking
 */
export function useNuGridColumnResize<T extends TableData>(
  props: NuGridProps<T>,
  tableApi: Table<T>,
) {
  // Track which group is currently being resized (for visual feedback)
  const resizingGroupId = ref<string | null>(null)
  const resizingColumnId = ref<string | null>(null)

  // Track columns that have been manually resized by the user
  // Used to switch from CSS flex to fixed width after user resize
  const manuallyResizedColumns = ref<Set<string>>(new Set())

  // Store initial sizes when resize starts to detect actual size changes
  const resizeStartSizes = new Map<string, number>()

  function getResizeHandler(header: any) {
    if (props.layout?.resizeMode === 'shift') {
      return createShiftResizeHandler(header, tableApi, manuallyResizedColumns)
    }
    return header.getResizeHandler()
  }

  function handleResizeStart(event: MouseEvent | TouchEvent, header: Header<T, any>) {
    const resizeHandler = getResizeHandler(header)

    if (resizeHandler) {
      event.stopPropagation()
      document.body.classList.add('is-resizing-column')
      resizingColumnId.value = header.column.id

      // Record initial size to detect actual changes
      // Note: For fill mode, syncFlexColumnWidths() should have already
      // set the actual rendered width in columnSizing after first render
      resizeStartSizes.set(header.column.id, header.column.getSize())

      // For fill mode, immediately add to manuallyResizedColumns so CSS
      // switches from flex to fixed width and responds to size changes during drag
      if (
        props.layout?.autoSize === 'fill'
        && !manuallyResizedColumns.value.has(header.column.id)
      ) {
        manuallyResizedColumns.value = new Set([...manuallyResizedColumns.value, header.column.id])
      }

      // For shift resize mode, also track the next column since it will be affected
      if (props.layout?.resizeMode === 'shift') {
        const allColumns = tableApi.getVisibleLeafColumns()
        const currentIndex = allColumns.findIndex((col) => col.id === header.column.id)
        if (currentIndex >= 0 && currentIndex < allColumns.length - 1) {
          const nextColumn = allColumns[currentIndex + 1]
          if (nextColumn) {
            resizeStartSizes.set(nextColumn.id, nextColumn.getSize())
          }
        }
      }

      resizeHandler(event)
    }
  }

  function handleGroupResizeStart(event: MouseEvent | TouchEvent, header: Header<T, any>) {
    // Only handle group headers (colSpan > 1)
    if (header.colSpan <= 1) {
      return handleResizeStart(event, header)
    }

    event.stopPropagation()
    document.body.classList.add('is-resizing-column')
    resizingColumnId.value = null
    resizingGroupId.value = header.id

    // Record initial sizes for all leaf columns in the group
    const leafHeaders = header.getLeafHeaders()
    for (const leafHeader of leafHeaders) {
      resizeStartSizes.set(leafHeader.column.id, leafHeader.column.getSize())
    }

    const resizeHandler = createGroupResizeHandler(header, tableApi, manuallyResizedColumns)
    resizeHandler(event)
  }

  function handleResizeEnd() {
    document.body.classList.remove('is-resizing-column')

    // Check if any columns actually changed size and mark them as manually resized
    for (const [columnId, startSize] of resizeStartSizes) {
      const column = tableApi.getColumn(columnId)
      if (column) {
        const currentSize = column.getSize()
        // Only mark as manually resized if size actually changed (with small tolerance)
        if (Math.abs(currentSize - startSize) > 1) {
          manuallyResizedColumns.value = new Set([...manuallyResizedColumns.value, columnId])
        }
      }
    }
    resizeStartSizes.clear()

    resizingColumnId.value = null
    resizingGroupId.value = null
  }

  // Add global event listeners for mouseup and touchend to remove cursor lock
  if (typeof document !== 'undefined') {
    document.addEventListener('mouseup', handleResizeEnd)
    document.addEventListener('touchend', handleResizeEnd)
  }

  onUnmounted(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('mouseup', handleResizeEnd)
      document.removeEventListener('touchend', handleResizeEnd)
    }
  })

  return {
    handleResizeStart,
    handleGroupResizeStart,
    handleResizeEnd,
    resizingGroupId,
    resizingColumnId,
    manuallyResizedColumns,
  }
}

/**
 * Shift resize handler - redistributes size changes to adjacent columns
 * to maintain the total table width
 */
export function createShiftResizeHandler<TData>(
  header: Header<TData, any>,
  table: Table<TData>,
  _manuallyResizedColumns?: { value: Set<string> },
): (event: MouseEvent | TouchEvent) => void {
  return (e: MouseEvent | TouchEvent) => {
    const column = table.getColumn(header.column.id)
    const canResize = column?.getCanResize()

    if (!column || !canResize) {
      return
    }

    ;(e as any).persist?.()

    if (isTouchStartEvent(e)) {
      // Don't respond to multiple touches
      if (e.touches && e.touches.length > 1) {
        return
      }
    }

    const startSize = header.getSize()

    const allColumns = table.getVisibleLeafColumns()
    const currentColumnIndex = allColumns.findIndex((col) => col.id === column.id)

    const followingColumns = allColumns.slice(currentColumnIndex + 1)

    const columnSizingStart: [string, number][] = [
      [column.id, column.getSize()],
      ...followingColumns.map((col) => [col.id, col.getSize()] as [string, number]),
    ]

    const clientX = isTouchStartEvent(e)
      ? Math.round(e.touches[0]!.clientX)
      : (e as MouseEvent).clientX

    const updateOffset = (eventType: 'move' | 'end', clientXPos?: number) => {
      if (typeof clientXPos !== 'number') {
        return
      }

      const deltaDirection = table.options.columnResizeDirection === 'rtl' ? -1 : 1
      const deltaOffset = (clientXPos - clientX) * deltaDirection

      const currentSize = column.getSize()

      const desiredSize = Math.max(
        column.columnDef.minSize ?? 20,
        Math.min(startSize + deltaOffset, column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER),
      )

      // Calculate the delta from current size to desired size
      const deltaFromCurrent = desiredSize - currentSize

      // Shift resizing: only the immediately following column is resized
      // This maintains table width by adjusting the next column in the opposite direction
      let constrainedNewSize = desiredSize
      if (followingColumns.length > 0 && deltaFromCurrent !== 0) {
        // Get the immediately following column (the next one)
        const nextColumn = followingColumns[0]

        // Safety check: if nextColumn is null/undefined, don't allow resize
        if (!nextColumn) {
          constrainedNewSize = currentSize
        } else {
          // Check if the next column is resizable
          const nextColumnResizable = nextColumn.columnDef.enableResizing !== false

          if (!nextColumnResizable) {
            // Next column cannot be resized, so don't allow this resize
            constrainedNewSize = currentSize
          } else {
            const nextColumnSize = nextColumn.getSize()
            const nextMinSize = nextColumn.columnDef.minSize ?? 20
            const nextMaxSize = nextColumn.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER

            // When growing the resized column (positive delta), next column must shrink
            if (deltaFromCurrent > 0) {
              // Maximum we can grow is limited by how much the next column can shrink
              const maxNextCanShrink = Math.max(0, nextColumnSize - nextMinSize)

              // Add epsilon check for floating point precision
              if (maxNextCanShrink < 1) {
                // Next column is at or near its minimum, don't allow growth
                constrainedNewSize = currentSize
              } else {
                // Constrain growth to what the next column can provide
                constrainedNewSize = Math.min(desiredSize, currentSize + maxNextCanShrink)
              }
            } else if (deltaFromCurrent < 0) {
              // When shrinking the resized column (negative delta), next column must grow
              const maxNextCanGrow = Math.max(0, nextMaxSize - nextColumnSize)

              // Add epsilon check for floating point precision
              if (maxNextCanGrow < 1) {
                // Next column is at or near its maximum, don't allow shrinking
                constrainedNewSize = currentSize
              } else {
                // Constrain shrinking to what the next column can accommodate
                constrainedNewSize = Math.max(desiredSize, currentSize - maxNextCanGrow)
              }
            }
          }
        }
      }

      // Calculate final actual delta from current size
      const actualDelta = constrainedNewSize - currentSize

      // Apply shift resizing: adjust only the immediately following column
      if (followingColumns.length > 0 && actualDelta !== 0) {
        const resizeMode = table.options.columnResizeMode ?? 'onChange'
        const newColumnSizing: Record<string, number> = {}
        newColumnSizing[column.id] = constrainedNewSize

        // Only adjust the immediately following column (shift resizing behavior)
        const nextColumn = followingColumns[0]
        // Safety check: if nextColumn is null/undefined, don't allow resize
        if (nextColumn) {
          const nextColumnCurrentSize = nextColumn.getSize()

          // The next column changes by exactly the opposite amount
          // No additional constraints here - we already constrained actualDelta above
          const nextColumnNewSize = nextColumnCurrentSize - actualDelta

          newColumnSizing[nextColumn.id] = nextColumnNewSize
        }

        table.setColumnSizingInfo((old) => ({
          ...old,
          startOffset: clientX,
          startSize,
          deltaOffset: constrainedNewSize - startSize, // Store cumulative delta from start
          deltaPercentage: (constrainedNewSize - startSize) / startSize,
          isResizingColumn: column.id,
          columnSizingStart,
        }))

        if (resizeMode !== 'onEnd' || eventType === 'end') {
          table.setColumnSizing((old) => ({
            ...old,
            ...newColumnSizing,
          }))
        }
      }
    }

    const onMove = (clientXPos?: number) => updateOffset('move', clientXPos)

    const onEnd = (clientXPos?: number) => {
      updateOffset('end', clientXPos)

      table.setColumnSizingInfo((old) => ({
        ...old,
        isResizingColumn: false,
        startOffset: null,
        startSize: null,
        deltaOffset: null,
        deltaPercentage: null,
        columnSizingStart: [],
      }))
    }

    const contextDocument = typeof document !== 'undefined' ? document : undefined

    const mouseEvents = {
      moveHandler: (e: MouseEvent) => onMove(e.clientX),
      upHandler: (e: MouseEvent) => {
        contextDocument?.removeEventListener('mousemove', mouseEvents.moveHandler)
        contextDocument?.removeEventListener('mouseup', mouseEvents.upHandler)
        onEnd(e.clientX)
      },
    }

    const touchEvents = {
      moveHandler: (e: TouchEvent) => {
        if (e.cancelable) {
          e.preventDefault()
          e.stopPropagation()
        }
        onMove(e.touches[0]!.clientX)
        return false
      },
      upHandler: (e: TouchEvent) => {
        contextDocument?.removeEventListener('touchmove', touchEvents.moveHandler)
        contextDocument?.removeEventListener('touchend', touchEvents.upHandler)
        if (e.cancelable) {
          e.preventDefault()
          e.stopPropagation()
        }
        onEnd(e.touches[0]?.clientX)
      },
    }

    const passiveIfSupported = { passive: false }

    if (isTouchStartEvent(e)) {
      contextDocument?.addEventListener('touchmove', touchEvents.moveHandler, passiveIfSupported)
      contextDocument?.addEventListener('touchend', touchEvents.upHandler, passiveIfSupported)
    } else {
      contextDocument?.addEventListener('mousemove', mouseEvents.moveHandler, passiveIfSupported)
      contextDocument?.addEventListener('mouseup', mouseEvents.upHandler, passiveIfSupported)
    }

    table.setColumnSizingInfo((old) => ({
      ...old,
      startOffset: clientX,
      startSize,
      deltaOffset: 0,
      deltaPercentage: 0,
      isResizingColumn: column.id,
      columnSizingStart,
    }))
  }
}

/**
 * Custom resize handler for column groups that resizes all leaf columns proportionately
 */
export function createGroupResizeHandler<TData>(
  header: Header<TData, any>,
  table: Table<TData>,
  _manuallyResizedColumns?: { value: Set<string> },
): (event: MouseEvent | TouchEvent) => void {
  return (e: MouseEvent | TouchEvent) => {
    ;(e as any).persist?.()

    if (isTouchStartEvent(e)) {
      // Don't respond to multiple touches
      if (e.touches && e.touches.length > 1) {
        return
      }
    }

    // Get all leaf headers under this group header
    const leafHeaders = header.getLeafHeaders()

    // Filter to only resizable columns and collect their initial sizes
    const resizableLeafColumns: Array<{
      id: string
      initialSize: number
      minSize: number
      maxSize: number
      proportion: number
    }> = []

    let totalInitialSize = 0

    for (const leafHeader of leafHeaders) {
      const column = table.getColumn(leafHeader.column.id)
      if (!column || column.columnDef.enableResizing === false) {
        continue
      }

      const size = leafHeader.getSize()
      totalInitialSize += size

      resizableLeafColumns.push({
        id: column.id,
        initialSize: size,
        minSize: column.columnDef.minSize ?? 20,
        maxSize: column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER,
        proportion: 0, // Will be calculated after we know the total
      })
    }

    // If no resizable columns, nothing to do
    if (resizableLeafColumns.length === 0 || totalInitialSize === 0) {
      return
    }

    // Calculate proportions
    for (const col of resizableLeafColumns) {
      col.proportion = col.initialSize / totalInitialSize
    }

    const startGroupSize = totalInitialSize

    const clientX = isTouchStartEvent(e)
      ? Math.round(e.touches[0]!.clientX)
      : (e as MouseEvent).clientX

    const columnSizingStart: [string, number][] = resizableLeafColumns.map((col) => [
      col.id,
      col.initialSize,
    ])

    const updateOffset = (eventType: 'move' | 'end', clientXPos?: number) => {
      if (typeof clientXPos !== 'number') {
        return
      }

      const deltaDirection = table.options.columnResizeDirection === 'rtl' ? -1 : 1
      const deltaOffset = (clientXPos - clientX) * deltaDirection

      // Calculate desired new group size
      const desiredGroupSize = startGroupSize + deltaOffset

      // Calculate the minimum and maximum possible group size based on column constraints
      let minGroupSize = 0
      let maxGroupSize = 0
      for (const col of resizableLeafColumns) {
        minGroupSize += col.minSize
        maxGroupSize += col.maxSize
      }

      // Constrain the group size
      const constrainedGroupSize = Math.max(minGroupSize, Math.min(desiredGroupSize, maxGroupSize))

      // Calculate the actual delta from the start
      const actualDelta = constrainedGroupSize - startGroupSize

      if (actualDelta === 0 && eventType === 'move') {
        return
      }

      // Distribute the delta proportionately to all columns
      const newColumnSizing: Record<string, number> = {}

      // First pass: calculate ideal sizes
      const idealSizes: number[] = []
      for (const col of resizableLeafColumns) {
        const idealSize = col.initialSize + actualDelta * col.proportion
        idealSizes.push(idealSize)
      }

      // Second pass: constrain sizes and track any overflow/underflow
      let overflow = 0
      const constrainedSizes: number[] = []

      for (let i = 0; i < resizableLeafColumns.length; i++) {
        const col = resizableLeafColumns[i]!
        const idealSize = idealSizes[i]!

        if (idealSize < col.minSize) {
          constrainedSizes.push(col.minSize)
          overflow += idealSize - col.minSize
        } else if (idealSize > col.maxSize) {
          constrainedSizes.push(col.maxSize)
          overflow += idealSize - col.maxSize
        } else {
          constrainedSizes.push(idealSize)
        }
      }

      // Third pass: redistribute any overflow to columns that can still adjust
      // This handles cases where some columns hit their min/max constraints
      if (Math.abs(overflow) > 0.5) {
        // Find columns that can still adjust
        for (let iteration = 0; iteration < 3 && Math.abs(overflow) > 0.5; iteration++) {
          const adjustableColumns: number[] = []
          let adjustableTotal = 0

          for (let i = 0; i < resizableLeafColumns.length; i++) {
            const col = resizableLeafColumns[i]!
            const currentSize = constrainedSizes[i]!

            if (overflow < 0) {
              // Need to shrink: can this column shrink more?
              if (currentSize > col.minSize) {
                adjustableColumns.push(i)
                adjustableTotal += col.proportion
              }
            } else {
              // Need to grow: can this column grow more?
              if (currentSize < col.maxSize) {
                adjustableColumns.push(i)
                adjustableTotal += col.proportion
              }
            }
          }

          if (adjustableColumns.length === 0 || adjustableTotal === 0) {
            break
          }

          // Distribute overflow proportionately among adjustable columns
          for (const idx of adjustableColumns) {
            const col = resizableLeafColumns[idx]!
            const share = (col.proportion / adjustableTotal) * overflow

            const newSize = constrainedSizes[idx]! + share

            if (newSize < col.minSize) {
              overflow += newSize - col.minSize
              constrainedSizes[idx] = col.minSize
            } else if (newSize > col.maxSize) {
              overflow += newSize - col.maxSize
              constrainedSizes[idx] = col.maxSize
            } else {
              constrainedSizes[idx] = newSize
              overflow -= share
            }
          }
        }
      }

      // Apply the constrained sizes
      for (let i = 0; i < resizableLeafColumns.length; i++) {
        const col = resizableLeafColumns[i]!
        newColumnSizing[col.id] = Math.round(constrainedSizes[i]!)
      }

      const resizeMode = table.options.columnResizeMode ?? 'onChange'

      // Update column sizing info (using the first column's id as the "resizing" column for UI purposes)
      table.setColumnSizingInfo((old) => ({
        ...old,
        startOffset: clientX,
        startSize: startGroupSize,
        deltaOffset: actualDelta,
        deltaPercentage: actualDelta / startGroupSize,
        isResizingColumn: header.id, // Use header.id for group identification
        columnSizingStart,
      }))

      if (resizeMode !== 'onEnd' || eventType === 'end') {
        table.setColumnSizing((old) => ({
          ...old,
          ...newColumnSizing,
        }))
      }
    }

    // Use requestAnimationFrame to batch updates for smoother dragging
    let rafId: number | null = null
    let pendingClientX: number | null = null

    const onMove = (clientXPos?: number) => {
      if (typeof clientXPos !== 'number') return

      pendingClientX = clientXPos

      // Cancel any pending RAF to avoid stacking updates
      if (rafId !== null) return

      rafId = requestAnimationFrame(() => {
        rafId = null
        if (pendingClientX !== null) {
          updateOffset('move', pendingClientX)
        }
      })
    }

    const onEnd = (clientXPos?: number) => {
      // Cancel any pending animation frame
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }

      // Apply final position immediately
      updateOffset('end', clientXPos ?? pendingClientX ?? undefined)

      table.setColumnSizingInfo((old) => ({
        ...old,
        isResizingColumn: false,
        startOffset: null,
        startSize: null,
        deltaOffset: null,
        deltaPercentage: null,
        columnSizingStart: [],
      }))
    }

    const contextDocument = typeof document !== 'undefined' ? document : undefined

    const mouseEvents = {
      moveHandler: (e: MouseEvent) => onMove(e.clientX),
      upHandler: (e: MouseEvent) => {
        contextDocument?.removeEventListener('mousemove', mouseEvents.moveHandler)
        contextDocument?.removeEventListener('mouseup', mouseEvents.upHandler)
        onEnd(e.clientX)
      },
    }

    const touchEvents = {
      moveHandler: (e: TouchEvent) => {
        if (e.cancelable) {
          e.preventDefault()
          e.stopPropagation()
        }
        onMove(e.touches[0]!.clientX)
        return false
      },
      upHandler: (e: TouchEvent) => {
        contextDocument?.removeEventListener('touchmove', touchEvents.moveHandler)
        contextDocument?.removeEventListener('touchend', touchEvents.upHandler)
        if (e.cancelable) {
          e.preventDefault()
          e.stopPropagation()
        }
        onEnd(e.touches[0]?.clientX)
      },
    }

    const passiveIfSupported = { passive: false }

    if (isTouchStartEvent(e)) {
      contextDocument?.addEventListener('touchmove', touchEvents.moveHandler, passiveIfSupported)
      contextDocument?.addEventListener('touchend', touchEvents.upHandler, passiveIfSupported)
    } else {
      contextDocument?.addEventListener('mousemove', mouseEvents.moveHandler, passiveIfSupported)
      contextDocument?.addEventListener('mouseup', mouseEvents.upHandler, passiveIfSupported)
    }

    // Initial sizing info setup
    table.setColumnSizingInfo((old) => ({
      ...old,
      startOffset: clientX,
      startSize: startGroupSize,
      deltaOffset: 0,
      deltaPercentage: 0,
      isResizingColumn: header.id,
      columnSizingStart,
    }))
  }
}
