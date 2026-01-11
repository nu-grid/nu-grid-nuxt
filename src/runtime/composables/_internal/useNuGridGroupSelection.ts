import type { TableData } from '@nuxt/ui'
import type { Row, Table } from '@tanstack/vue-table'
import type { ComputedRef } from 'vue'

/**
 * Composable for managing row selection within groups in a grouped table.
 * Provides utilities to check and toggle selection state for rows within a specific group.
 */
export function useNuGridGroupSelection<T extends TableData>(
  tableApi: Table<T>,
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

    const currentSelection = tableApi.getState().rowSelection
    const newSelection = { ...currentSelection }

    rows.forEach((row) => {
      if (selected) {
        newSelection[row.id] = true
      } else {
        delete newSelection[row.id]
      }
    })

    tableApi.setRowSelection(newSelection)
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
