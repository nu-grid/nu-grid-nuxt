import type { TableData } from '@nuxt/ui'
import type { NuGridKeyboardHandler, NuGridPagingContext } from '../../../types/_internal'
import { nextTick } from 'vue'
import { ROUTER_PRIORITIES } from '../../../types/_internal'

/**
 * Creates a keyboard handler for paging navigation
 * Priority 25 - runs before regular navigation handler
 *
 * When paging is enabled:
 * - PageUp/PageDown: Navigate to previous/next page
 * - Cmd/Ctrl + Up/Down: Navigate to previous/next page
 */
export function createPagingKeyboardHandler<T extends TableData>(
  pagingContext: NuGridPagingContext,
): NuGridKeyboardHandler<T> {
  return {
    id: 'keyboard-paging',
    priority: ROUTER_PRIORITIES.KEYBOARD_PAGING,

    when: (ctx) => {
      // Only run when paging is enabled (don't require focused cell - grid just needs keyboard focus)
      if (!pagingContext.enabled.value) return false
      if (ctx.isEditing) return false

      const { event } = ctx
      const key = event.key

      // Check for paging keys
      if (key === 'PageUp' || key === 'PageDown') {
        return true
      }

      // Cmd/Ctrl + Arrow Up/Down
      if ((event.metaKey || event.ctrlKey) && (key === 'ArrowUp' || key === 'ArrowDown')) {
        return true
      }

      return false
    },

    handle: (ctx) => {
      const { event, focusFns, focusedCell } = ctx
      const key = event.key

      // Determine direction
      let direction: 'prev' | 'next' | null = null

      if (key === 'PageUp' || ((event.metaKey || event.ctrlKey) && key === 'ArrowUp')) {
        direction = 'prev'
      } else if (key === 'PageDown' || ((event.metaKey || event.ctrlKey) && key === 'ArrowDown')) {
        direction = 'next'
      }

      if (!direction) {
        return { handled: false }
      }

      // Navigate pages
      const currentPage = pagingContext.pageIndex.value
      const totalPages = pagingContext.totalPages.value

      // Remember current position for focus restoration
      const currentRowIndex = focusedCell?.rowIndex ?? 0
      const currentColumnIndex = focusedCell?.columnIndex ?? 0

      // Helper to restore focus after page change
      const restoreFocus = () => {
        nextTick(() => {
          // Set the internal focused cell state
          focusFns.focusedCell.value = {
            rowIndex: currentRowIndex,
            columnIndex: currentColumnIndex,
          }
          // Also focus the actual DOM element to maintain keyboard focus in the grid
          nextTick(() => {
            const rows = ctx.tableApi.getRowModel().rows
            const targetRow = rows[currentRowIndex]
            if (targetRow) {
              const cellElement = focusFns.getCellElement(targetRow.id, currentColumnIndex)
              if (cellElement) {
                cellElement.focus()
              }
            }
          })
        })
      }

      if (direction === 'prev' && currentPage > 0) {
        pagingContext.setPageIndex(currentPage - 1)
        restoreFocus()
        return { handled: true, preventDefault: true, stopPropagation: true }
      }

      if (direction === 'next' && currentPage < totalPages - 1) {
        pagingContext.setPageIndex(currentPage + 1)
        restoreFocus()
        return { handled: true, preventDefault: true, stopPropagation: true }
      }

      // Already at first/last page - still consume the event to prevent navigation handler
      return { handled: true, preventDefault: true }
    },
  }
}
