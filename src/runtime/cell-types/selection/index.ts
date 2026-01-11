import type { NuGridSelectionColumnMeta } from '../../types/_internal'
import type { NuGridCellType, NuGridCellTypeContext } from '../../types/cells'
import SelectionEditor from './SelectionEditor.vue'
import SelectionRenderer from './SelectionRenderer.vue'

/**
 * Check if a row can be selected based on column meta
 */
function canRowBeSelected(context: NuGridCellTypeContext): boolean {
  const meta = context.columnDef?.meta as NuGridSelectionColumnMeta | undefined

  // Check global enabled state
  const globalEnabled = meta?.enabledRef?.value ?? meta?.selectionEnabled ?? true
  if (!globalEnabled) {
    return false
  }

  // Check per-row selection function
  const rowSelectionEnabledFn = meta?.rowSelectionEnabledRef?.value
  if (!rowSelectionEnabledFn) {
    return true // Default to enabled if no function is provided
  }
  return rowSelectionEnabledFn(context.row)
}

/**
 * Selection cell type
 * Selection checkbox with special keyboard handling:
 * - Space: Toggle the selection state directly without entering edit mode
 * - Enter: Prevent entering edit mode (do nothing)
 */
export const selectionCellType: NuGridCellType = {
  name: 'selection',
  displayName: 'Selection',
  description: 'Row selection checkbox column',
  editor: SelectionEditor,
  renderer: SelectionRenderer,
  keyboardHandler: (event: KeyboardEvent, context: NuGridCellTypeContext) => {
    const { isFocused, row } = context

    // Space toggles the selection state directly without entering edit mode
    // Only if selection is enabled for this row
    if (isFocused && event.key === ' ') {
      // Check if this row can be selected
      if (!canRowBeSelected(context)) {
        return { handled: true, preventDefault: true, stopPropagation: true }
      }

      // Toggle the row selection
      const currentValue = row.getIsSelected()
      row.toggleSelected(!currentValue)

      return { handled: true, preventDefault: true, stopPropagation: true }
    }

    // Enter does nothing - just prevent entering edit mode
    if (isFocused && event.key === 'Enter') {
      return { handled: true, preventDefault: true, stopPropagation: true }
    }

    return { handled: false }
  },
}
