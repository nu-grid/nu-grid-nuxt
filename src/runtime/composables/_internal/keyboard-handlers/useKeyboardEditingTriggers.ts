import type { TableData } from '@nuxt/ui'
import type { NuGridKeyboardHandler } from '../../../types/_internal'
import { ROUTER_PRIORITIES } from '../../../types/_internal'

export type StartKeyOption = 'enter' | 'f2' | 'bs' | 'alpha' | 'numeric'
export type StartKeysConfig = 'all' | 'minimal' | 'none' | StartKeyOption[]

export interface EditingTriggersOptions {
  getStartKeys: () => StartKeysConfig
}

/**
 * Parses the startKeys config into an array of enabled key types
 */
function parseStartKeys(config: StartKeysConfig): StartKeyOption[] {
  if (config === 'all') {
    return ['enter', 'f2', 'bs', 'alpha', 'numeric']
  }
  if (config === 'minimal') {
    return ['enter', 'f2']
  }
  if (config === 'none') {
    return []
  }
  return config
}

/**
 * Creates a keyboard handler for editing triggers (F2, Enter, Backspace, alphanumeric)
 * Priority 20 - runs after cell type handlers
 */
export function createEditingTriggersHandler<T extends TableData>(
  options: EditingTriggersOptions,
): NuGridKeyboardHandler<T> {
  return {
    id: 'keyboard-editing-triggers',
    priority: ROUTER_PRIORITIES.KEYBOARD_EDITING_TRIGGERS,

    when: (ctx) => {
      // Only run when not editing, editing is enabled, and we have a focused cell
      if (ctx.isEditing || !ctx.editingEnabled) return false
      if (!ctx.cell || !ctx.focusedRow) return false
      return ctx.cellEditingFns.isCellEditable(ctx.focusedRow, ctx.cell)
    },

    handle: (ctx) => {
      const { event, cell, focusedRow: row, cellEditingFns } = ctx
      if (!cell || !row) return { handled: false }

      const enabledKeys = parseStartKeys(options.getStartKeys())
      if (enabledKeys.length === 0) {
        return { handled: false }
      }

      // F2 - Start editing with current value
      if (event.key === 'F2' && enabledKeys.includes('f2')) {
        cellEditingFns.startEditing(row, cell)
        return { handled: true, preventDefault: true, stopPropagation: true }
      }

      // Backspace/Delete - Start editing with empty value
      if ((event.key === 'Backspace' || event.key === 'Delete') && enabledKeys.includes('bs')) {
        cellEditingFns.startEditing(row, cell, '')
        return { handled: true, preventDefault: true, stopPropagation: true }
      }

      // Enter - Start editing
      if (event.key === 'Enter' && enabledKeys.includes('enter')) {
        cellEditingFns.startEditing(row, cell)
        return { handled: true, preventDefault: true, stopPropagation: true }
      }

      // Printable character - Start editing with that character
      if (
        event.key.length === 1
        && !event.ctrlKey
        && !event.metaKey
        && !event.altKey
        && event.key !== ' ' // Exclude space to avoid conflicts with shortcuts
      ) {
        const isAlpha = /[a-z]/i.test(event.key)
        const isNumeric = /\d/.test(event.key)

        if (
          (isAlpha && enabledKeys.includes('alpha'))
          || (isNumeric && enabledKeys.includes('numeric'))
        ) {
          cellEditingFns.startEditing(row, cell, event.key)
          return { handled: true, preventDefault: true, stopPropagation: true }
        }
      }

      return { handled: false }
    },
  }
}
