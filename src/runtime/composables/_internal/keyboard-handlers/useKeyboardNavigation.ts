import type { TableData } from '@nuxt/ui'
import type { NuGridKeyboardHandler } from '../../../types/_internal'
import { ROUTER_PRIORITIES } from '../../../types/_internal'

const NAVIGATION_KEYS = [
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Tab',
  ' ', // Space key for row selection toggle
]

/**
 * Creates a keyboard handler for navigation keys
 * Priority 30 - runs after cell type and editing handlers
 *
 * Delegates to the focus system's onCellKeyDown for actual navigation logic
 */
export function createNavigationHandler<T extends TableData>(): NuGridKeyboardHandler<T> {
  return {
    id: 'keyboard-navigation',
    priority: ROUTER_PRIORITIES.KEYBOARD_NAVIGATION,

    when: (ctx) => {
      // Only run when not editing and we have a focused cell
      return !ctx.isEditing && ctx.focusedCell !== null
    },

    handle: (ctx) => {
      const { event, focusFns } = ctx

      // Only handle navigation keys
      if (!NAVIGATION_KEYS.includes(event.key)) {
        return { handled: false }
      }

      // Delegate to focus system
      focusFns.onCellKeyDown(event)

      // Check if the event was handled (default prevented or propagation stopped)
      return {
        handled: event.defaultPrevented || (event as any).cancelBubble,
        preventDefault: event.defaultPrevented,
        stopPropagation: (event as any).cancelBubble,
      }
    },
  }
}
