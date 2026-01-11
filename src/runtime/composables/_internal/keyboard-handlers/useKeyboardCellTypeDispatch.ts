import type { TableData } from '@nuxt/ui'
import type { Ref } from 'vue'
import type { NuGridKeyboardHandler } from '../../../types/_internal'
import { ROUTER_PRIORITIES } from '../../../types/_internal'
import { useNuGridCellTypeRegistry } from '../../useNuGridCellTypeRegistry'

export interface CellTypeDispatchOptions<T extends TableData> {
  cellTypes?: Ref<any[] | undefined>
  data: Ref<T[]>
  emit: (payload: { row: any; column: any; oldValue: any; newValue: any }) => void
}

/**
 * Creates a keyboard handler that dispatches to cell type keyboard handlers
 * Priority 15 - runs before editing triggers
 */
export function createCellTypeDispatchHandler<T extends TableData>(
  options: CellTypeDispatchOptions<T>,
): NuGridKeyboardHandler<T> {
  const typeRegistry = useNuGridCellTypeRegistry<T>(options.cellTypes)

  return {
    id: 'keyboard-cell-type-dispatch',
    priority: ROUTER_PRIORITIES.KEYBOARD_CELL_TYPE,

    when: (ctx) => {
      // Only run when not editing and we have a focused cell
      return !ctx.isEditing && ctx.cell !== null && ctx.focusedCell !== null
    },

    handle: (ctx) => {
      const { cell, focusedRow: row, event, cellEditingFns, tableApi, focusFns, cellIndex } = ctx
      if (!cell || !row) return { handled: false }

      const columnDef = cell.column.columnDef
      const cellDataType = (columnDef as any).cellDataType || 'text'

      const keyboardHandler = typeRegistry.getKeyboardHandler(cellDataType)
      if (!keyboardHandler) {
        return { handled: false }
      }

      const isFocused = focusFns.shouldCellHandleKeydown(row, cellIndex)
      const canEdit = cellEditingFns.isCellEditable(row, cell)

      // Create cell type context
      const pluginContext = {
        cell,
        row,
        columnDef,
        column: cell.column,
        getValue: () => cell.getValue(),
        isFocused,
        canEdit,
        data: options.data.value,
        tableApi,
        startEditing: (initialValue?: any) => cellEditingFns.startEditing(row, cell, initialValue),
        stopEditing: (newValue: any, moveDirection?: 'up' | 'down' | 'next' | 'previous') => {
          cellEditingFns.stopEditing(row, cell, newValue, moveDirection)
        },
        emitChange: (oldValue: any, newValue: any) => {
          options.emit({
            row,
            column: cell.column,
            oldValue,
            newValue,
          })
        },
      }

      const result = keyboardHandler(event, pluginContext)
      return {
        handled: result.handled,
        preventDefault: result.preventDefault,
        stopPropagation: result.stopPropagation,
      }
    },
  }
}
