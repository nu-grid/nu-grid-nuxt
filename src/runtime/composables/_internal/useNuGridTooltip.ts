import type { TableData } from '@nuxt/ui'
import type { Row, Table } from '@tanstack/vue-table'
import type { ComputedRef, Ref } from 'vue'
import type { NuGridProps } from '../../types'
import type {
  NuGridHoverContext,
  NuGridHoverHandler,
  NuGridPointerHandler,
} from '../../types/_internal'
import type { NuGridColumn } from '../../types/column'
import { onUnmounted, ref } from 'vue'
import { usePropWithDefault } from '../../config/_internal'

// Interface for the router - only the methods we need
interface TooltipRouterInterface {
  registerHoverHandler: (handler: NuGridHoverHandler) => () => void
  registerGlobalPointerHandler: (handler: NuGridPointerHandler) => () => void
}

export interface TooltipState {
  text: string
  x: number
  y: number
}

// Shared tooltip state - single instance for the entire grid
const tooltipState = ref<TooltipState | null>(null)
let showTimeout: ReturnType<typeof setTimeout> | null = null
let hideTimeout: ReturnType<typeof setTimeout> | null = null
let currentHoveredCell: HTMLElement | null = null
let lastMouseX = 0
let lastMouseY = 0

/**
 * Lightweight shared tooltip for NuGrid
 * Uses the interaction router for all mouse events
 * Works for cells, headers, and any element with truncated text
 */
export function useNuGridTooltip() {
  return {
    tooltipState,
  }
}

interface TooltipHandlerOptions<T extends TableData = TableData> {
  tableApi?: Ref<Table<T> | undefined>
  columns?: ComputedRef<NuGridColumn<T>[] | undefined>
}

/**
 * Register tooltip hover handling with the interaction router
 * Call this once from NuGrid.vue
 */
export function useNuGridTooltipHandler<T extends TableData = TableData>(
  props: NuGridProps<T>,
  interactionRouter: TooltipRouterInterface,
  handlerOptions?: TooltipHandlerOptions<T>,
) {
  // Use computed refs to access tooltip options reactively (same pattern as cell editing)
  const truncatedOnly = usePropWithDefault(props, 'tooltip', 'truncatedOnly')
  const showDelay = usePropWithDefault(props, 'tooltip', 'showDelay')
  const switchDelay = usePropWithDefault(props, 'tooltip', 'switchDelay')
  const hideDelay = usePropWithDefault(props, 'tooltip', 'hideDelay')
  const mouseFollow = usePropWithDefault(props, 'tooltip', 'mouseFollow')

  // Track when tooltip was last visible for switch delay logic
  let lastTooltipVisibleTime = 0
  const SWITCH_DELAY_WINDOW = 1000 // Use switch delay if tooltip was visible within 1 second

  // Check if tooltips are disabled
  const getOptions = () => {
    if (props.tooltip === false) return null
    return {
      truncatedOnly: truncatedOnly.value,
      showDelay: showDelay.value,
      switchDelay: switchDelay.value,
      hideDelay: hideDelay.value,
      mouseFollow: mouseFollow.value,
    }
  }

  // Get column definition by ID
  const getColumnDef = (columnId: string): NuGridColumn<T> | undefined => {
    const cols = handlerOptions?.columns?.value
    if (!cols) return undefined
    return cols.find((col) => {
      // Handle both accessorKey and id patterns
      const colId = (col as any).accessorKey || (col as any).id
      return colId === columnId
    })
  }

  // Get row data by row ID
  const getRowData = (rowId: string): T | undefined => {
    const tableApi = handlerOptions?.tableApi?.value
    if (!tableApi) return undefined
    const rows = tableApi.getRowModel().rows
    const row = rows.find((r: Row<T>) => r.id === rowId)
    return row?.original
  }

  function scheduleShowTooltip(text: string) {
    const opts = getOptions()
    if (!opts) return

    // Clear any pending hide
    if (hideTimeout) {
      clearTimeout(hideTimeout)
      hideTimeout = null
    }
    // Clear any pending show
    if (showTimeout) {
      clearTimeout(showTimeout)
      showTimeout = null
    }

    // Check if tooltip was recently visible (use shorter switch delay)
    const wasRecentlyVisible = tooltipState.value !== null
      || (Date.now() - lastTooltipVisibleTime) < SWITCH_DELAY_WINDOW
    const delay = wasRecentlyVisible ? opts.switchDelay : opts.showDelay

    // Hide any existing tooltip first, then show with delay
    // This prevents the tooltip from immediately appearing on new cells
    if (tooltipState.value) {
      lastTooltipVisibleTime = Date.now()
      tooltipState.value = null
    }

    // Delay before showing tooltip
    showTimeout = setTimeout(() => {
      tooltipState.value = {
        text,
        x: lastMouseX,
        y: lastMouseY,
      }
      showTimeout = null
    }, delay)
  }

  function hideTooltip() {
    const opts = getOptions()
    if (!opts) {
      hideTooltipImmediate()
      return
    }

    // Clear any pending show
    if (showTimeout) {
      clearTimeout(showTimeout)
      showTimeout = null
    }
    currentHoveredCell = null
    // Small delay to prevent flicker when moving between cells
    hideTimeout = setTimeout(() => {
      if (tooltipState.value) {
        lastTooltipVisibleTime = Date.now()
      }
      tooltipState.value = null
    }, opts.hideDelay)
  }

  function hideTooltipImmediate() {
    if (showTimeout) {
      clearTimeout(showTimeout)
      showTimeout = null
    }
    if (hideTimeout) {
      clearTimeout(hideTimeout)
      hideTimeout = null
    }
    if (tooltipState.value) {
      lastTooltipVisibleTime = Date.now()
    }
    tooltipState.value = null
    currentHoveredCell = null
  }

  /**
   * Find the cell element from the event target
   * Returns null if element is being edited
   */
  function findCellElement(target: HTMLElement): HTMLElement | null {
    let el: HTMLElement | null = target

    // Walk up the DOM looking for cell elements
    while (el) {
      // Skip if this cell is being edited
      if (el.hasAttribute('data-editing')) {
        return null
      }
      // Check for cell element (has data-column-id attribute, indicating it's a cell)
      if (el.hasAttribute('data-column-id') && el.hasAttribute('data-cell-index')) {
        return el
      }
      // Stop at grid boundary
      if (el.hasAttribute('data-nugrid') || el.tagName === 'BODY') {
        break
      }
      el = el.parentElement
    }

    return null
  }

  /**
   * Find the header element from the event target
   */
  function findHeaderElement(target: HTMLElement): HTMLElement | null {
    let el: HTMLElement | null = target

    // Walk up the DOM looking for header elements
    while (el) {
      // Check for header element (has data-column-id but NOT data-cell-index)
      if (el.hasAttribute('data-column-id') && !el.hasAttribute('data-cell-index')) {
        // Make sure it's NOT in a data row (headers don't have data-row-id in their ancestry)
        // Headers are in divs that are NOT inside a row element
        if (!el.closest('[data-row-id]')) {
          return el
        }
      }
      // Stop at grid boundary
      if (el.hasAttribute('data-nugrid') || el.tagName === 'BODY') {
        break
      }
      el = el.parentElement
    }

    return null
  }

  /**
   * Find truncatable content within a cell
   */
  function findTruncatableContent(cell: HTMLElement): HTMLElement | null {
    return cell.querySelector('.truncate') as HTMLElement | null
  }

  /**
   * Check if an element has truncated text
   */
  function isTruncated(element: HTMLElement): boolean {
    return element.scrollWidth > element.clientWidth
  }

  /**
   * Get the text content for tooltip
   */
  function getTooltipText(element: HTMLElement): string | null {
    const text = element.textContent?.trim()
    return text || null
  }

  /**
   * Get tooltip text for a cell, considering column configuration
   */
  function getCellTooltipText(cell: HTMLElement): { text: string | null; forceShow: boolean } {
    const columnId = cell.getAttribute('data-column-id')
    if (!columnId) return { text: null, forceShow: false }

    const columnDef = getColumnDef(columnId)

    // Check for tooltipValue function first (highest priority)
    if (columnDef?.tooltipValue) {
      // Find the row element to get row ID
      const rowElement = cell.closest('[data-row-id]')
      const rowId = rowElement?.getAttribute('data-row-id')
      if (rowId) {
        const rowData = getRowData(rowId)
        if (rowData) {
          try {
            const text = columnDef.tooltipValue(rowData)
            if (text) {
              return { text, forceShow: true }
            }
          } catch {
            // Ignore errors in tooltipValue function
          }
        }
      }
    }

    // Check for tooltipField (second priority)
    if (columnDef?.tooltipField) {
      const rowElement = cell.closest('[data-row-id]')
      const rowId = rowElement?.getAttribute('data-row-id')
      if (rowId) {
        const rowData = getRowData(rowId)
        if (rowData) {
          const fieldValue = (rowData as any)[columnDef.tooltipField]
          if (fieldValue != null) {
            return { text: String(fieldValue), forceShow: true }
          }
        }
      }
    }

    // Default: get text from truncatable content
    const truncatableContent = findTruncatableContent(cell)
    if (truncatableContent) {
      return { text: getTooltipText(truncatableContent), forceShow: false }
    }

    return { text: null, forceShow: false }
  }

  /**
   * Get tooltip text for a header, considering column configuration
   */
  function getHeaderTooltipText(header: HTMLElement): { text: string | null; forceShow: boolean } {
    const columnId = header.getAttribute('data-column-id')
    if (!columnId) return { text: null, forceShow: false }

    const columnDef = getColumnDef(columnId)

    // Check for tooltipHeaderValue function first
    if (columnDef?.tooltipHeaderValue) {
      try {
        const text = columnDef.tooltipHeaderValue()
        if (text) {
          return { text, forceShow: true }
        }
      } catch {
        // Ignore errors in tooltipHeaderValue function
      }
    }

    // Check for tooltipHeader flag
    if (columnDef?.tooltipHeader) {
      // Get header text from truncatable content
      const truncatableContent = findTruncatableContent(header)
      if (truncatableContent) {
        const text = getTooltipText(truncatableContent)
        if (text) {
          return { text, forceShow: false }
        }
      }
      // Fallback to any text content in the header
      const text = header.textContent?.trim()
      if (text) {
        return { text, forceShow: false }
      }
    }

    // Default: check for truncated header text
    const truncatableContent = findTruncatableContent(header)
    if (truncatableContent) {
      return { text: getTooltipText(truncatableContent), forceShow: false }
    }

    return { text: null, forceShow: false }
  }

  function handleHover(context: NuGridHoverContext) {
    const opts = getOptions()
    if (!opts) return // Tooltips disabled

    const { target, type, event } = context

    // Always track mouse position
    lastMouseX = event.clientX
    lastMouseY = event.clientY

    // Move events update position if mouse follow is enabled
    if (type === 'move') {
      if (opts.mouseFollow && tooltipState.value) {
        tooltipState.value = {
          ...tooltipState.value,
          x: lastMouseX,
          y: lastMouseY,
        }
      }
      return
    }

    if (type === 'leave') {
      const relatedTarget = event.relatedTarget as HTMLElement | null
      // Only hide if leaving to outside or to a different cell
      if (!relatedTarget) {
        hideTooltip()
        return
      }
      const newCell = findCellElement(relatedTarget)
      const newHeader = findHeaderElement(relatedTarget)
      if (!newCell && !newHeader) {
        hideTooltip()
      } else if (newCell && newCell !== currentHoveredCell) {
        hideTooltip()
      } else if (newHeader && newHeader !== currentHoveredCell) {
        hideTooltip()
      }
      return
    }

    // type === 'enter'
    // Check for header first
    const header = findHeaderElement(target)
    if (header && header !== currentHoveredCell) {
      currentHoveredCell = header
      const { text, forceShow } = getHeaderTooltipText(header)

      if (text) {
        const truncatableContent = findTruncatableContent(header)
        const shouldShow =
          forceShow
          || (truncatableContent && (!opts.truncatedOnly || isTruncated(truncatableContent)))

        if (shouldShow) {
          scheduleShowTooltip(text)
        } else if (tooltipState.value) {
          hideTooltip()
        }
      } else if (tooltipState.value) {
        hideTooltip()
      }
      return
    }

    // Check for cell
    const cell = findCellElement(target)
    if (cell && cell !== currentHoveredCell) {
      currentHoveredCell = cell
      const { text, forceShow } = getCellTooltipText(cell)

      if (text) {
        const truncatableContent = findTruncatableContent(cell)
        const shouldShow =
          forceShow
          || (truncatableContent && (!opts.truncatedOnly || isTruncated(truncatableContent)))

        if (shouldShow) {
          scheduleShowTooltip(text)
        } else if (tooltipState.value) {
          hideTooltip()
        }
      } else if (tooltipState.value) {
        hideTooltip()
      }
    } else if (!cell && !header && currentHoveredCell) {
      // Moved away from cell/header
      hideTooltip()
    }
  }

  // Register hover handler (handles enter, leave, and move events)
  const unregisterHover = interactionRouter.registerHoverHandler({
    id: 'nugrid-tooltip',
    priority: 100, // Low priority - run after other handlers
    handle: handleHover,
  })

  // Register pointer handler to hide tooltip on any click
  const unregisterPointer = interactionRouter.registerGlobalPointerHandler({
    id: 'nugrid-tooltip-pointer',
    priority: 100,
    handle: () => {
      hideTooltipImmediate()
    },
  })

  // Cleanup on unmount
  onUnmounted(() => {
    unregisterHover()
    unregisterPointer()
    if (showTimeout) {
      clearTimeout(showTimeout)
    }
    if (hideTimeout) {
      clearTimeout(hideTimeout)
    }
    tooltipState.value = null
    currentHoveredCell = null
  })
}
