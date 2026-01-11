import type { Row, RowSelectionState, Table } from '@tanstack/vue-table'
import { describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { useNuGridGroupSelection } from '../src/runtime/composables/_internal/useNuGridGroupSelection'

/**
 * Tests for useNuGridGroupSelection composable
 *
 * This test suite verifies:
 * 1. areAllGroupRowsSelected correctly detects all rows selected
 * 2. areSomeGroupRowsSelected correctly detects partial selection
 * 3. toggleAllGroupRows correctly toggles selection
 * 4. getGroupCheckboxState returns correct checkbox state
 */

interface TestData {
  id: number
  name: string
  group: string
}

function createMockRow(id: number, isSelected: boolean = false): Row<TestData> {
  return {
    id: String(id),
    original: { id, name: `Row ${id}`, group: 'group1' },
    getIsSelected: vi.fn().mockReturnValue(isSelected),
  } as unknown as Row<TestData>
}

function createMockTableApi(currentSelection: RowSelectionState = {}): Table<TestData> {
  let selection = { ...currentSelection }

  return {
    getState: vi.fn().mockImplementation(() => ({
      rowSelection: selection,
    })),
    setRowSelection: vi.fn().mockImplementation((newSelection: RowSelectionState) => {
      selection = newSelection
    }),
  } as unknown as Table<TestData>
}

describe('useNuGridGroupSelection', () => {
  describe('areAllGroupRowsSelected', () => {
    it('should return true when all group rows are selected', () => {
      const row1 = createMockRow(1, true)
      const row2 = createMockRow(2, true)
      const row3 = createMockRow(3, true)

      const groupedRows = computed(() => ({
        group1: [row1, row2, row3],
      }))

      const tableApi = createMockTableApi()
      const { areAllGroupRowsSelected } = useNuGridGroupSelection(tableApi, groupedRows)

      expect(areAllGroupRowsSelected('group1')).toBe(true)
    })

    it('should return false when some group rows are not selected', () => {
      const row1 = createMockRow(1, true)
      const row2 = createMockRow(2, false)
      const row3 = createMockRow(3, true)

      const groupedRows = computed(() => ({
        group1: [row1, row2, row3],
      }))

      const tableApi = createMockTableApi()
      const { areAllGroupRowsSelected } = useNuGridGroupSelection(tableApi, groupedRows)

      expect(areAllGroupRowsSelected('group1')).toBe(false)
    })

    it('should return false when no group rows are selected', () => {
      const row1 = createMockRow(1, false)
      const row2 = createMockRow(2, false)

      const groupedRows = computed(() => ({
        group1: [row1, row2],
      }))

      const tableApi = createMockTableApi()
      const { areAllGroupRowsSelected } = useNuGridGroupSelection(tableApi, groupedRows)

      expect(areAllGroupRowsSelected('group1')).toBe(false)
    })

    it('should return false for empty group', () => {
      const groupedRows = computed(() => ({
        group1: [],
      }))

      const tableApi = createMockTableApi()
      const { areAllGroupRowsSelected } = useNuGridGroupSelection(tableApi, groupedRows)

      expect(areAllGroupRowsSelected('group1')).toBe(false)
    })

    it('should return false for non-existent group', () => {
      const groupedRows = computed(() => ({
        group1: [createMockRow(1, true)],
      }))

      const tableApi = createMockTableApi()
      const { areAllGroupRowsSelected } = useNuGridGroupSelection(tableApi, groupedRows)

      expect(areAllGroupRowsSelected('nonexistent')).toBe(false)
    })
  })

  describe('areSomeGroupRowsSelected', () => {
    it('should return true when some but not all rows are selected', () => {
      const row1 = createMockRow(1, true)
      const row2 = createMockRow(2, false)
      const row3 = createMockRow(3, true)

      const groupedRows = computed(() => ({
        group1: [row1, row2, row3],
      }))

      const tableApi = createMockTableApi()
      const { areSomeGroupRowsSelected } = useNuGridGroupSelection(tableApi, groupedRows)

      expect(areSomeGroupRowsSelected('group1')).toBe(true)
    })

    it('should return false when all rows are selected', () => {
      const row1 = createMockRow(1, true)
      const row2 = createMockRow(2, true)

      const groupedRows = computed(() => ({
        group1: [row1, row2],
      }))

      const tableApi = createMockTableApi()
      const { areSomeGroupRowsSelected } = useNuGridGroupSelection(tableApi, groupedRows)

      expect(areSomeGroupRowsSelected('group1')).toBe(false)
    })

    it('should return false when no rows are selected', () => {
      const row1 = createMockRow(1, false)
      const row2 = createMockRow(2, false)

      const groupedRows = computed(() => ({
        group1: [row1, row2],
      }))

      const tableApi = createMockTableApi()
      const { areSomeGroupRowsSelected } = useNuGridGroupSelection(tableApi, groupedRows)

      expect(areSomeGroupRowsSelected('group1')).toBe(false)
    })

    it('should return false for empty group', () => {
      const groupedRows = computed(() => ({
        group1: [],
      }))

      const tableApi = createMockTableApi()
      const { areSomeGroupRowsSelected } = useNuGridGroupSelection(tableApi, groupedRows)

      expect(areSomeGroupRowsSelected('group1')).toBe(false)
    })

    it('should return false for non-existent group', () => {
      const groupedRows = computed(() => ({
        group1: [createMockRow(1, true)],
      }))

      const tableApi = createMockTableApi()
      const { areSomeGroupRowsSelected } = useNuGridGroupSelection(tableApi, groupedRows)

      expect(areSomeGroupRowsSelected('nonexistent')).toBe(false)
    })

    it('should return true when only first row is selected', () => {
      const row1 = createMockRow(1, true)
      const row2 = createMockRow(2, false)
      const row3 = createMockRow(3, false)

      const groupedRows = computed(() => ({
        group1: [row1, row2, row3],
      }))

      const tableApi = createMockTableApi()
      const { areSomeGroupRowsSelected } = useNuGridGroupSelection(tableApi, groupedRows)

      expect(areSomeGroupRowsSelected('group1')).toBe(true)
    })
  })

  describe('toggleAllGroupRows', () => {
    it('should select all rows in the group when selected is true', () => {
      const row1 = createMockRow(1, false)
      const row2 = createMockRow(2, false)
      const row3 = createMockRow(3, false)

      const groupedRows = computed(() => ({
        group1: [row1, row2, row3],
      }))

      const tableApi = createMockTableApi()
      const { toggleAllGroupRows } = useNuGridGroupSelection(tableApi, groupedRows)

      toggleAllGroupRows('group1', true)

      expect(tableApi.setRowSelection).toHaveBeenCalled()
      const newSelection = (tableApi.setRowSelection as any).mock.calls[0][0]
      expect(newSelection['1']).toBe(true)
      expect(newSelection['2']).toBe(true)
      expect(newSelection['3']).toBe(true)
    })

    it('should deselect all rows in the group when selected is false', () => {
      const row1 = createMockRow(1, true)
      const row2 = createMockRow(2, true)
      const row3 = createMockRow(3, true)

      const groupedRows = computed(() => ({
        group1: [row1, row2, row3],
      }))

      const tableApi = createMockTableApi({ '1': true, '2': true, '3': true })
      const { toggleAllGroupRows } = useNuGridGroupSelection(tableApi, groupedRows)

      toggleAllGroupRows('group1', false)

      expect(tableApi.setRowSelection).toHaveBeenCalled()
      const newSelection = (tableApi.setRowSelection as any).mock.calls[0][0]
      expect(newSelection['1']).toBeUndefined()
      expect(newSelection['2']).toBeUndefined()
      expect(newSelection['3']).toBeUndefined()
    })

    it('should preserve selection of rows in other groups', () => {
      const row1 = createMockRow(1, false)
      const row2 = createMockRow(2, false)

      const groupedRows = computed(() => ({
        group1: [row1, row2],
      }))

      // Simulate another row (ID 99) being selected
      const tableApi = createMockTableApi({ '99': true })
      const { toggleAllGroupRows } = useNuGridGroupSelection(tableApi, groupedRows)

      toggleAllGroupRows('group1', true)

      expect(tableApi.setRowSelection).toHaveBeenCalled()
      const newSelection = (tableApi.setRowSelection as any).mock.calls[0][0]
      expect(newSelection['99']).toBe(true) // Preserved
      expect(newSelection['1']).toBe(true) // Added
      expect(newSelection['2']).toBe(true) // Added
    })

    it('should handle non-existent group gracefully', () => {
      const groupedRows = computed(() => ({
        group1: [createMockRow(1, false)],
      }))

      const tableApi = createMockTableApi()
      const { toggleAllGroupRows } = useNuGridGroupSelection(tableApi, groupedRows)

      // Should not throw
      toggleAllGroupRows('nonexistent', true)

      // Should still call setRowSelection (with empty changes)
      expect(tableApi.setRowSelection).toHaveBeenCalled()
    })
  })

  describe('getGroupCheckboxState', () => {
    it('should return true when all rows are selected', () => {
      const row1 = createMockRow(1, true)
      const row2 = createMockRow(2, true)

      const groupedRows = computed(() => ({
        group1: [row1, row2],
      }))

      const tableApi = createMockTableApi()
      const { getGroupCheckboxState } = useNuGridGroupSelection(tableApi, groupedRows)

      expect(getGroupCheckboxState('group1')).toBe(true)
    })

    it('should return false when no rows are selected', () => {
      const row1 = createMockRow(1, false)
      const row2 = createMockRow(2, false)

      const groupedRows = computed(() => ({
        group1: [row1, row2],
      }))

      const tableApi = createMockTableApi()
      const { getGroupCheckboxState } = useNuGridGroupSelection(tableApi, groupedRows)

      expect(getGroupCheckboxState('group1')).toBe(false)
    })

    it('should return "indeterminate" when some rows are selected', () => {
      const row1 = createMockRow(1, true)
      const row2 = createMockRow(2, false)
      const row3 = createMockRow(3, true)

      const groupedRows = computed(() => ({
        group1: [row1, row2, row3],
      }))

      const tableApi = createMockTableApi()
      const { getGroupCheckboxState } = useNuGridGroupSelection(tableApi, groupedRows)

      expect(getGroupCheckboxState('group1')).toBe('indeterminate')
    })

    it('should return false for empty group', () => {
      const groupedRows = computed(() => ({
        group1: [],
      }))

      const tableApi = createMockTableApi()
      const { getGroupCheckboxState } = useNuGridGroupSelection(tableApi, groupedRows)

      expect(getGroupCheckboxState('group1')).toBe(false)
    })

    it('should return false for non-existent group', () => {
      const groupedRows = computed(() => ({
        group1: [createMockRow(1, true)],
      }))

      const tableApi = createMockTableApi()
      const { getGroupCheckboxState } = useNuGridGroupSelection(tableApi, groupedRows)

      expect(getGroupCheckboxState('nonexistent')).toBe(false)
    })
  })

  describe('integration', () => {
    it('should return all four functions', () => {
      const groupedRows = computed(() => ({}))
      const tableApi = createMockTableApi()

      const selection = useNuGridGroupSelection(tableApi, groupedRows)

      expect(typeof selection.areAllGroupRowsSelected).toBe('function')
      expect(typeof selection.areSomeGroupRowsSelected).toBe('function')
      expect(typeof selection.toggleAllGroupRows).toBe('function')
      expect(typeof selection.getGroupCheckboxState).toBe('function')
    })

    it('should handle multiple groups', () => {
      const group1Row1 = createMockRow(1, true)
      const group1Row2 = createMockRow(2, true)
      const group2Row1 = createMockRow(3, false)
      const group2Row2 = createMockRow(4, true)

      const groupedRows = computed(() => ({
        group1: [group1Row1, group1Row2],
        group2: [group2Row1, group2Row2],
      }))

      const tableApi = createMockTableApi()
      const { areAllGroupRowsSelected, areSomeGroupRowsSelected } = useNuGridGroupSelection(
        tableApi,
        groupedRows,
      )

      // Group 1: all selected
      expect(areAllGroupRowsSelected('group1')).toBe(true)
      expect(areSomeGroupRowsSelected('group1')).toBe(false)

      // Group 2: some selected
      expect(areAllGroupRowsSelected('group2')).toBe(false)
      expect(areSomeGroupRowsSelected('group2')).toBe(true)
    })
  })
})
