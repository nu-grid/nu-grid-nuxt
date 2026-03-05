import type { ComputedRef, Ref } from 'vue'

import type { Row, RowSelectionState } from '../../engine'
import type { TableData } from '../../types/table-data'

/**
 * Composable for managing row selection within groups in a grouped table.
 * Provides utilities to check and toggle selection state for rows within a specific group.
 */
export function useNuGridGroupSelection<T extends TableData>(
  rowSelectionState: Ref<RowSelectionState>,
  groupedRows: ComputedRef<Record<string, Row<T>[]>>,
) {
  function areAllGroupRowsSelected(groupId: string): boolean {
    const rows = groupedRows.value[groupId] || []
    if (rows.length === 0) return false
    return rows.every((row) => row.getIsSelected())
  }

  function areSomeGroupRowsSelected(groupId: string): boolean {
    const rows = groupedRows.value[groupId] || []
    if (rows.length === 0) return false
    const selectedCount = rows.filter((row) => row.getIsSelected()).length
    return selectedCount > 0 && selectedCount < rows.length
  }

  function toggleAllGroupRows(groupId: string, selected: boolean) {
    const rows = groupedRows.value[groupId] || []

    const currentSelection = rowSelectionState.value
    const newSelection = { ...currentSelection }

    rows.forEach((row) => {
      if (selected) {
        newSelection[row.id] = true
      } else {
        delete newSelection[row.id]
      }
    })

    rowSelectionState.value = newSelection
  }

  /**
   * Get the checkbox state for a group header
   * Returns true if all selected, false if none selected, 'indeterminate' if some selected
   */
  function getGroupCheckboxState(groupId: string): boolean | 'indeterminate' {
    if (areSomeGroupRowsSelected(groupId)) {
      return 'indeterminate'
    }
    return areAllGroupRowsSelected(groupId)
  }

  return {
    areAllGroupRowsSelected,
    areSomeGroupRowsSelected,
    toggleAllGroupRows,
    getGroupCheckboxState,
  }
}
