import type { NuGridCellType, NuGridCellTypeContext } from '../../types/cells'
import { ref } from 'vue'
import ActionMenuRenderer from './ActionMenuRenderer.vue'

/**
 * Action menu cell type
 * Action menu with special keyboard handling:
 * - Space or Enter: Open the action menu (only opens, doesn't toggle - closing is done via Escape or clicking outside)
 * - Escape: Close the action menu (handled by UDropdownMenu component)
 */
export const actionMenuCellType: NuGridCellType = {
  name: 'action-menu',
  displayName: 'Action Menu',
  description: 'Action menu column with row-specific actions',
  // No editor for action menu - it's not tied to data
  renderer: ActionMenuRenderer,
  keyboardHandler: (event: KeyboardEvent, context: NuGridCellTypeContext) => {
    const { isFocused, row, cell } = context

    // Space or Enter opens the action menu (only when cell is focused, only opens - not toggle)
    if (isFocused && (event.key === ' ' || event.key === 'Enter')) {
      // Get the menuOpenStates map from column meta
      const meta = cell.column.columnDef.meta as
        | { menuOpenStates?: Map<string, Ref<boolean>> }
        | undefined
      const menuOpenStates = meta?.menuOpenStates
      if (menuOpenStates) {
        const rowId = String(row.id)
        // Get or create the ref for this row
        if (!menuOpenStates.has(rowId)) {
          menuOpenStates.set(rowId, ref(false))
        }
        const menuOpenRef = menuOpenStates.get(rowId)!
        // Only open the menu, don't toggle (user closes with Escape or clicking outside)
        if (!menuOpenRef.value) {
          menuOpenRef.value = true
        }
        return { handled: true, preventDefault: true, stopPropagation: true }
      }
    }

    // Let other keys pass through
    return { handled: false }
  },
}
