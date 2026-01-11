import type { TableRow } from '@nuxt/ui'
import type { NuGridProps } from '../src/runtime/types'
import { describe, expect, it, vi } from 'vitest'
import { useNuGridRowInteractions } from '../src/runtime/composables/_internal/useNuGridInteractions'

/**
 * Tests for useNuGridRowInteractions composable
 *
 * This test suite verifies:
 * 1. Row select handler behavior
 * 2. Row hover handler behavior
 * 3. Row context menu handler behavior
 * 4. Interactive element detection
 */

interface TestData {
  id: number
  name: string
}

function createMockRow(id: number = 1): TableRow<TestData> {
  return {
    id: String(id),
    original: { id, name: `Row ${id}` },
    getValue: vi.fn(),
    index: id - 1,
    depth: 0,
    getIsGrouped: vi.fn().mockReturnValue(false),
    getIsSelected: vi.fn().mockReturnValue(false),
    getCanSelect: vi.fn().mockReturnValue(true),
    getIsExpanded: vi.fn().mockReturnValue(false),
    getCanExpand: vi.fn().mockReturnValue(false),
    toggleSelected: vi.fn(),
    toggleExpanded: vi.fn(),
    getVisibleCells: vi.fn().mockReturnValue([]),
    getAllCells: vi.fn().mockReturnValue([]),
    getLeafRows: vi.fn().mockReturnValue([]),
    parentId: undefined,
    subRows: [],
  } as unknown as TableRow<TestData>
}

function createMockEvent(target: HTMLElement = document.createElement('div')): Event {
  const event = new MouseEvent('click')
  Object.defineProperty(event, 'target', { value: target, writable: false })
  Object.defineProperty(event, 'preventDefault', { value: vi.fn(), writable: false })
  Object.defineProperty(event, 'stopPropagation', { value: vi.fn(), writable: false })
  return event
}

describe('useNuGridRowInteractions', () => {
  describe('onRowSelect', () => {
    it('should not call onSelect if props.onSelect is not defined', () => {
      const props: NuGridProps<TestData> = {
        data: [],
        columns: [],
      }

      const { onRowSelect } = useNuGridRowInteractions(props)
      const row = createMockRow()
      const event = createMockEvent()

      // Should not throw
      onRowSelect(event, row)
    })

    it('should call props.onSelect with event and row', () => {
      const onSelect = vi.fn()
      const props: NuGridProps<TestData> = {
        data: [],
        columns: [],
        onSelect,
      }

      const { onRowSelect } = useNuGridRowInteractions(props)
      const row = createMockRow()
      const event = createMockEvent()

      onRowSelect(event, row)

      expect(onSelect).toHaveBeenCalledWith(event, row)
    })

    it('should prevent default and stop propagation', () => {
      const onSelect = vi.fn()
      const props: NuGridProps<TestData> = {
        data: [],
        columns: [],
        onSelect,
      }

      const { onRowSelect } = useNuGridRowInteractions(props)
      const row = createMockRow()
      const event = createMockEvent()

      onRowSelect(event, row)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(event.stopPropagation).toHaveBeenCalled()
    })

    it('should not call onSelect when clicking on a button', () => {
      const onSelect = vi.fn()
      const props: NuGridProps<TestData> = {
        data: [],
        columns: [],
        onSelect,
      }

      const { onRowSelect } = useNuGridRowInteractions(props)
      const row = createMockRow()

      // Create a button element
      const button = document.createElement('button')
      const event = createMockEvent(button)

      onRowSelect(event, row)

      expect(onSelect).not.toHaveBeenCalled()
    })

    it('should not call onSelect when clicking on an anchor', () => {
      const onSelect = vi.fn()
      const props: NuGridProps<TestData> = {
        data: [],
        columns: [],
        onSelect,
      }

      const { onRowSelect } = useNuGridRowInteractions(props)
      const row = createMockRow()

      // Create an anchor element
      const anchor = document.createElement('a')
      const event = createMockEvent(anchor)

      onRowSelect(event, row)

      expect(onSelect).not.toHaveBeenCalled()
    })

    it('should not call onSelect when clicking inside a button', () => {
      const onSelect = vi.fn()
      const props: NuGridProps<TestData> = {
        data: [],
        columns: [],
        onSelect,
      }

      const { onRowSelect } = useNuGridRowInteractions(props)
      const row = createMockRow()

      // Create a span inside a button
      const button = document.createElement('button')
      const span = document.createElement('span')
      button.appendChild(span)
      document.body.appendChild(button)

      const event = createMockEvent(span)

      onRowSelect(event, row)

      expect(onSelect).not.toHaveBeenCalled()

      // Cleanup
      document.body.removeChild(button)
    })
  })

  describe('onRowHover', () => {
    it('should not call onHover if props.onHover is not defined', () => {
      const props: NuGridProps<TestData> = {
        data: [],
        columns: [],
      }

      const { onRowHover } = useNuGridRowInteractions(props)
      const row = createMockRow()
      const event = createMockEvent()

      // Should not throw
      onRowHover(event, row)
    })

    it('should call props.onHover with event and row', () => {
      const onHover = vi.fn()
      const props: NuGridProps<TestData> = {
        data: [],
        columns: [],
        onHover,
      }

      const { onRowHover } = useNuGridRowInteractions(props)
      const row = createMockRow()
      const event = createMockEvent()

      onRowHover(event, row)

      expect(onHover).toHaveBeenCalledWith(event, row)
    })

    it('should call props.onHover with null for mouse leave', () => {
      const onHover = vi.fn()
      const props: NuGridProps<TestData> = {
        data: [],
        columns: [],
        onHover,
      }

      const { onRowHover } = useNuGridRowInteractions(props)
      const event = createMockEvent()

      onRowHover(event, null)

      expect(onHover).toHaveBeenCalledWith(event, null)
    })
  })

  describe('onRowContextmenu', () => {
    it('should not call onContextmenu if props.onContextmenu is not defined', () => {
      const props: NuGridProps<TestData> = {
        data: [],
        columns: [],
      }

      const { onRowContextmenu } = useNuGridRowInteractions(props)
      const row = createMockRow()
      const event = createMockEvent()

      // Should not throw
      onRowContextmenu(event, row)
    })

    it('should call props.onContextmenu with event and row', () => {
      const onContextmenu = vi.fn()
      const props: NuGridProps<TestData> = {
        data: [],
        columns: [],
        onContextmenu,
      }

      const { onRowContextmenu } = useNuGridRowInteractions(props)
      const row = createMockRow()
      const event = createMockEvent()

      onRowContextmenu(event, row)

      expect(onContextmenu).toHaveBeenCalledWith(event, row)
    })

    it('should call all handlers when onContextmenu is an array', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      const props: NuGridProps<TestData> = {
        data: [],
        columns: [],
        onContextmenu: [handler1, handler2, handler3],
      }

      const { onRowContextmenu } = useNuGridRowInteractions(props)
      const row = createMockRow()
      const event = createMockEvent()

      onRowContextmenu(event, row)

      expect(handler1).toHaveBeenCalledWith(event, row)
      expect(handler2).toHaveBeenCalledWith(event, row)
      expect(handler3).toHaveBeenCalledWith(event, row)
    })

    it('should handle empty array for onContextmenu', () => {
      const props: NuGridProps<TestData> = {
        data: [],
        columns: [],
        onContextmenu: [],
      }

      const { onRowContextmenu } = useNuGridRowInteractions(props)
      const row = createMockRow()
      const event = createMockEvent()

      // Should not throw
      onRowContextmenu(event, row)
    })
  })

  describe('integration', () => {
    it('should return all three handlers', () => {
      const props: NuGridProps<TestData> = {
        data: [],
        columns: [],
      }

      const interactions = useNuGridRowInteractions(props)

      expect(typeof interactions.onRowSelect).toBe('function')
      expect(typeof interactions.onRowHover).toBe('function')
      expect(typeof interactions.onRowContextmenu).toBe('function')
    })

    it('should work with different row data', () => {
      const onSelect = vi.fn()
      const props: NuGridProps<TestData> = {
        data: [],
        columns: [],
        onSelect,
      }

      const { onRowSelect } = useNuGridRowInteractions(props)
      const event = createMockEvent()

      // Test with different row IDs
      const row1 = createMockRow(1)
      const row2 = createMockRow(2)
      const row3 = createMockRow(3)

      onRowSelect(event, row1)
      onRowSelect(event, row2)
      onRowSelect(event, row3)

      expect(onSelect).toHaveBeenCalledTimes(3)
      expect(onSelect).toHaveBeenNthCalledWith(1, event, row1)
      expect(onSelect).toHaveBeenNthCalledWith(2, event, row2)
      expect(onSelect).toHaveBeenNthCalledWith(3, event, row3)
    })
  })
})
