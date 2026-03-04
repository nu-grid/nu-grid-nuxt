import type { Row, RowSelectionState } from '@tanstack/vue-table'

import { describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

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

function createRowSelectionState(currentSelection: RowSelectionState = {}) {
  return ref<RowSelectionState>({ ...currentSelection })
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

      const rowSelectionState = createRowSelectionState()
      const { areAllGroupRowsSelected } = useNuGridGroupSelection(rowSelectionState, groupedRows)

      expect(areAllGroupRowsSelected('group1')).toBe(true)
    })

    it('should return false when some group rows are not selected', () => {
      const row1 = createMockRow(1, true)
      const row2 = createMockRow(2, false)
      const row3 = createMockRow(3, true)

      const groupedRows = computed(() => ({
        group1: [row1, row2, row3],
      }))

      const rowSelectionState = createRowSelectionState()
      const { areAllGroupRowsSelected } = useNuGridGroupSelection(rowSelectionState, groupedRows)

      expect(areAllGroupRowsSelected('group1')).toBe(false)
    })

    it('should return false when no group rows are selected', () => {
      const row1 = createMockRow(1, false)
      const row2 = createMockRow(2, false)

      const groupedRows = computed(() => ({
        group1: [row1, row2],
      }))

      const rowSelectionState = createRowSelectionState()
      const { areAllGroupRowsSelected } = useNuGridGroupSelection(rowSelectionState, groupedRows)

      expect(areAllGroupRowsSelected('group1')).toBe(false)
    })

    it('should return false for empty group', () => {
      const groupedRows = computed(() => ({
        group1: [],
      }))

      const rowSelectionState = createRowSelectionState()
      const { areAllGroupRowsSelected } = useNuGridGroupSelection(rowSelectionState, groupedRows)

      expect(areAllGroupRowsSelected('group1')).toBe(false)
    })

    it('should return false for non-existent group', () => {
      const groupedRows = computed(() => ({
        group1: [createMockRow(1, true)],
      }))

      const rowSelectionState = createRowSelectionState()
      const { areAllGroupRowsSelected } = useNuGridGroupSelection(rowSelectionState, groupedRows)

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

      const rowSelectionState = createRowSelectionState()
      const { areSomeGroupRowsSelected } = useNuGridGroupSelection(rowSelectionState, groupedRows)

      expect(areSomeGroupRowsSelected('group1')).toBe(true)
    })

    it('should return false when all rows are selected', () => {
      const row1 = createMockRow(1, true)
      const row2 = createMockRow(2, true)

      const groupedRows = computed(() => ({
        group1: [row1, row2],
      }))

      const rowSelectionState = createRowSelectionState()
      const { areSomeGroupRowsSelected } = useNuGridGroupSelection(rowSelectionState, groupedRows)

      expect(areSomeGroupRowsSelected('group1')).toBe(false)
    })

    it('should return false when no rows are selected', () => {
      const row1 = createMockRow(1, false)
      const row2 = createMockRow(2, false)

      const groupedRows = computed(() => ({
        group1: [row1, row2],
      }))

      const rowSelectionState = createRowSelectionState()
      const { areSomeGroupRowsSelected } = useNuGridGroupSelection(rowSelectionState, groupedRows)

      expect(areSomeGroupRowsSelected('group1')).toBe(false)
    })

    it('should return false for empty group', () => {
      const groupedRows = computed(() => ({
        group1: [],
      }))

      const rowSelectionState = createRowSelectionState()
      const { areSomeGroupRowsSelected } = useNuGridGroupSelection(rowSelectionState, groupedRows)

      expect(areSomeGroupRowsSelected('group1')).toBe(false)
    })

    it('should return false for non-existent group', () => {
      const groupedRows = computed(() => ({
        group1: [createMockRow(1, true)],
      }))

      const rowSelectionState = createRowSelectionState()
      const { areSomeGroupRowsSelected } = useNuGridGroupSelection(rowSelectionState, groupedRows)

      expect(areSomeGroupRowsSelected('nonexistent')).toBe(false)
    })

    it('should return true when only first row is selected', () => {
      const row1 = createMockRow(1, true)
      const row2 = createMockRow(2, false)
      const row3 = createMockRow(3, false)

      const groupedRows = computed(() => ({
        group1: [row1, row2, row3],
      }))

      const rowSelectionState = createRowSelectionState()
      const { areSomeGroupRowsSelected } = useNuGridGroupSelection(rowSelectionState, groupedRows)

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

      const rowSelectionState = createRowSelectionState()
      const { toggleAllGroupRows } = useNuGridGroupSelection(rowSelectionState, groupedRows)

      toggleAllGroupRows('group1', true)

      expect(rowSelectionState.value['1']).toBe(true)
      expect(rowSelectionState.value['2']).toBe(true)
      expect(rowSelectionState.value['3']).toBe(true)
    })

    it('should deselect all rows in the group when selected is false', () => {
      const row1 = createMockRow(1, true)
      const row2 = createMockRow(2, true)
      const row3 = createMockRow(3, true)

      const groupedRows = computed(() => ({
        group1: [row1, row2, row3],
      }))

      const rowSelectionState = createRowSelectionState({ '1': true, '2': true, '3': true })
      const { toggleAllGroupRows } = useNuGridGroupSelection(rowSelectionState, groupedRows)

      toggleAllGroupRows('group1', false)

      expect(rowSelectionState.value['1']).toBeUndefined()
      expect(rowSelectionState.value['2']).toBeUndefined()
      expect(rowSelectionState.value['3']).toBeUndefined()
    })

    it('should preserve selection of rows in other groups', () => {
      const row1 = createMockRow(1, false)
      const row2 = createMockRow(2, false)

      const groupedRows = computed(() => ({
        group1: [row1, row2],
      }))

      // Simulate another row (ID 99) being selected
      const rowSelectionState = createRowSelectionState({ '99': true })
      const { toggleAllGroupRows } = useNuGridGroupSelection(rowSelectionState, groupedRows)

      toggleAllGroupRows('group1', true)

      expect(rowSelectionState.value['99']).toBe(true) // Preserved
      expect(rowSelectionState.value['1']).toBe(true) // Added
      expect(rowSelectionState.value['2']).toBe(true) // Added
    })

    it('should handle non-existent group gracefully', () => {
      const groupedRows = computed(() => ({
        group1: [createMockRow(1, false)],
      }))

      const rowSelectionState = createRowSelectionState()
      const { toggleAllGroupRows } = useNuGridGroupSelection(rowSelectionState, groupedRows)

      // Should not throw
      toggleAllGroupRows('nonexistent', true)

      // ref should still be updated (with empty changes)
      expect(rowSelectionState.value).toBeDefined()
    })
  })

  describe('getGroupCheckboxState', () => {
    it('should return true when all rows are selected', () => {
      const row1 = createMockRow(1, true)
      const row2 = createMockRow(2, true)

      const groupedRows = computed(() => ({
        group1: [row1, row2],
      }))

      const rowSelectionState = createRowSelectionState()
      const { getGroupCheckboxState } = useNuGridGroupSelection(rowSelectionState, groupedRows)

      expect(getGroupCheckboxState('group1')).toBe(true)
    })

    it('should return false when no rows are selected', () => {
      const row1 = createMockRow(1, false)
      const row2 = createMockRow(2, false)

      const groupedRows = computed(() => ({
        group1: [row1, row2],
      }))

      const rowSelectionState = createRowSelectionState()
      const { getGroupCheckboxState } = useNuGridGroupSelection(rowSelectionState, groupedRows)

      expect(getGroupCheckboxState('group1')).toBe(false)
    })

    it('should return "indeterminate" when some rows are selected', () => {
      const row1 = createMockRow(1, true)
      const row2 = createMockRow(2, false)
      const row3 = createMockRow(3, true)

      const groupedRows = computed(() => ({
        group1: [row1, row2, row3],
      }))

      const rowSelectionState = createRowSelectionState()
      const { getGroupCheckboxState } = useNuGridGroupSelection(rowSelectionState, groupedRows)

      expect(getGroupCheckboxState('group1')).toBe('indeterminate')
    })

    it('should return false for empty group', () => {
      const groupedRows = computed(() => ({
        group1: [],
      }))

      const rowSelectionState = createRowSelectionState()
      const { getGroupCheckboxState } = useNuGridGroupSelection(rowSelectionState, groupedRows)

      expect(getGroupCheckboxState('group1')).toBe(false)
    })

    it('should return false for non-existent group', () => {
      const groupedRows = computed(() => ({
        group1: [createMockRow(1, true)],
      }))

      const rowSelectionState = createRowSelectionState()
      const { getGroupCheckboxState } = useNuGridGroupSelection(rowSelectionState, groupedRows)

      expect(getGroupCheckboxState('nonexistent')).toBe(false)
    })
  })

  describe('integration', () => {
    it('should return all four functions', () => {
      const groupedRows = computed(() => ({}))
      const rowSelectionState = createRowSelectionState()

      const selection = useNuGridGroupSelection(rowSelectionState, groupedRows)

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

      const rowSelectionState = createRowSelectionState()
      const { areAllGroupRowsSelected, areSomeGroupRowsSelected } = useNuGridGroupSelection(
        rowSelectionState,
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
