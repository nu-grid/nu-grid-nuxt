import type { Table } from '@tanstack/vue-table'
import type { Ref } from 'vue'

export interface ColumnPinningControls {
  pinColumn: (columnId: string, side: 'left' | 'right') => void
  unpinColumn: (columnId: string) => void
  isPinned: (columnId: string) => 'left' | 'right' | false
  getPinnedColumns: () => { left: string[]; right: string[] }
}

/**
 * Composable for managing column pinning state
 */
export function useNuGridColumnPinning<T>(tableApi: Ref<Table<T>>): ColumnPinningControls {
  const pinColumn = (columnId: string, side: 'left' | 'right') => {
    const currentPinning = tableApi.value.getState().columnPinning
    const newPinning = { ...currentPinning }

    // Remove from opposite side if present
    const oppositeSide = side === 'left' ? 'right' : 'left'
    if (newPinning[oppositeSide]) {
      newPinning[oppositeSide] = newPinning[oppositeSide].filter((id) => id !== columnId)
    }

    // Add to the desired side if not already there
    if (!newPinning[side]) {
      newPinning[side] = []
    }
    if (!newPinning[side].includes(columnId)) {
      newPinning[side] = [...newPinning[side], columnId]
    }

    tableApi.value.setColumnPinning(newPinning)
  }

  const unpinColumn = (columnId: string) => {
    const currentPinning = tableApi.value.getState().columnPinning
    const newPinning = {
      left: currentPinning.left?.filter((id) => id !== columnId) || [],
      right: currentPinning.right?.filter((id) => id !== columnId) || [],
    }

    tableApi.value.setColumnPinning(newPinning)
  }

  const isPinned = (columnId: string): 'left' | 'right' | false => {
    const pinning = tableApi.value.getState().columnPinning
    if (pinning.left?.includes(columnId)) return 'left'
    if (pinning.right?.includes(columnId)) return 'right'
    return false
  }

  const getPinnedColumns = () => {
    const pinning = tableApi.value.getState().columnPinning
    return {
      left: pinning.left || [],
      right: pinning.right || [],
    }
  }

  return {
    pinColumn,
    unpinColumn,
    isPinned,
    getPinnedColumns,
  }
}
