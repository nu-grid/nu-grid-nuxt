import type { NuGridCellType, NuGridCellTypeContext } from '../../types/cells'
import BooleanEditor from './BooleanEditor.vue'
import BooleanFilter from './BooleanFilter.vue'
import BooleanRenderer from './BooleanRenderer.vue'

/**
 * Boolean cell type
 * Checkbox input with special keyboard handling:
 * - Space: Toggle the boolean value directly without entering edit mode
 * - Enter: Enter edit mode (standard behavior)
 */
export const booleanCellType: NuGridCellType = {
  name: 'boolean',
  displayName: 'Boolean',
  description: 'Checkbox column with toggle on Space key',
  editor: BooleanEditor,
  renderer: BooleanRenderer,
  filter: {
    component: BooleanFilter,
  },
  enableFiltering: true,
  keyboardHandler: (event: KeyboardEvent, context: NuGridCellTypeContext) => {
    const { isFocused, canEdit, getValue, row, columnDef, data, tableApi, emitChange } = context

    // Space toggles the value directly without entering edit mode
    if (isFocused && canEdit && event.key === ' ') {
      // Toggle the boolean value
      const currentValue = getValue()
      const newValue = !currentValue

      // Update the data directly
      const rowIndex = data.findIndex((r: any, index: number) => {
        return tableApi.options.getRowId?.(r, index) === row.id || r === row.original
      })

      if (rowIndex !== -1 && columnDef.accessorKey) {
        const key = columnDef.accessorKey as string
        ;(data[rowIndex] as any)[key] = newValue

        // Emit change event
        emitChange(currentValue, newValue)
      }

      return { handled: true, preventDefault: true, stopPropagation: true }
    }

    // Enter enters edit mode for boolean cells (let default behavior handle it)
    // Don't handle Enter here - let the default startEditing behavior take over
    return { handled: false }
  },
}
