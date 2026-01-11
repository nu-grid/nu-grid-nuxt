import type { Header, Table } from '@tanstack/vue-table'
import { describe, expect, it, vi } from 'vitest'
import { ref, toValue } from 'vue'
import { useNuGridColumnDragDrop } from '../src/runtime/composables/_internal/useNuGridColumnDragDrop'

/**
 * Tests for useNuGridColumnDragDrop composable
 *
 * This test suite verifies:
 * 1. Drag state management (dragged column, drop target)
 * 2. isHeaderDraggable correctly identifies draggable headers
 * 3. headerDragProps and headerDragHandleProps return correct props
 */

interface TestData {
  id: number
  name: string
}

function createMockTableApi(): Table<TestData> {
  return {
    getState: vi.fn().mockReturnValue({
      columnPinning: { left: [], right: [] },
    }),
    setColumnPinning: vi.fn(),
    getAllLeafColumns: vi.fn().mockReturnValue([{ id: 'col1' }, { id: 'col2' }, { id: 'col3' }]),
  } as unknown as Table<TestData>
}

function createMockHeader(
  columnId: string,
  options: { isPlaceholder?: boolean; colSpan?: number; enableReordering?: boolean } = {},
): Header<TestData, unknown> {
  return {
    column: {
      id: columnId,
      columnDef: { enableReordering: options.enableReordering ?? true },
    },
    isPlaceholder: options.isPlaceholder ?? false,
    colSpan: options.colSpan ?? 1,
  } as unknown as Header<TestData, unknown>
}

describe('useNuGridColumnDragDrop', () => {
  describe('initial state', () => {
    it('should have null draggedColumnId initially', () => {
      const tableApi = createMockTableApi()
      const columnOrderState = ref<string[]>([])
      const tableRef = ref(null)

      const dragFns = useNuGridColumnDragDrop(tableApi, columnOrderState, tableRef)

      expect(toValue(dragFns.draggedColumnId)).toBeNull()
    })

    it('should have null dropTargetColumnId initially', () => {
      const tableApi = createMockTableApi()
      const columnOrderState = ref<string[]>([])
      const tableRef = ref(null)

      const dragFns = useNuGridColumnDragDrop(tableApi, columnOrderState, tableRef)

      expect(toValue(dragFns.dropTargetColumnId)).toBeNull()
    })

    it('should have false isDraggingOutside initially', () => {
      const tableApi = createMockTableApi()
      const columnOrderState = ref<string[]>([])
      const tableRef = ref(null)

      const dragFns = useNuGridColumnDragDrop(tableApi, columnOrderState, tableRef)

      expect(dragFns.isDraggingOutside.value).toBe(false)
    })

    it('should have right dropPosition initially', () => {
      const tableApi = createMockTableApi()
      const columnOrderState = ref<string[]>([])
      const tableRef = ref(null)

      const dragFns = useNuGridColumnDragDrop(tableApi, columnOrderState, tableRef)

      expect(toValue(dragFns.dropPosition)).toBe('right')
    })
  })

  describe('isHeaderDraggable', () => {
    it('should return true for a regular header', () => {
      const tableApi = createMockTableApi()
      const columnOrderState = ref<string[]>([])
      const tableRef = ref(null)
      const header = createMockHeader('col1')

      const dragFns = useNuGridColumnDragDrop(tableApi, columnOrderState, tableRef)

      expect(dragFns.isHeaderDraggable(header)).toBe(true)
    })

    it('should return false for placeholder header', () => {
      const tableApi = createMockTableApi()
      const columnOrderState = ref<string[]>([])
      const tableRef = ref(null)
      const header = createMockHeader('col1', { isPlaceholder: true })

      const dragFns = useNuGridColumnDragDrop(tableApi, columnOrderState, tableRef)

      expect(dragFns.isHeaderDraggable(header)).toBe(false)
    })

    it('should return false for header with colSpan > 1', () => {
      const tableApi = createMockTableApi()
      const columnOrderState = ref<string[]>([])
      const tableRef = ref(null)
      const header = createMockHeader('col1', { colSpan: 2 })

      const dragFns = useNuGridColumnDragDrop(tableApi, columnOrderState, tableRef)

      expect(dragFns.isHeaderDraggable(header)).toBe(false)
    })

    it('should return false for header without column id', () => {
      const tableApi = createMockTableApi()
      const columnOrderState = ref<string[]>([])
      const tableRef = ref(null)
      const header = {
        column: { id: '', columnDef: { enableReordering: true } },
        isPlaceholder: false,
        colSpan: 1,
      } as unknown as Header<TestData, unknown>

      const dragFns = useNuGridColumnDragDrop(tableApi, columnOrderState, tableRef)

      expect(dragFns.isHeaderDraggable(header)).toBe(false)
    })
  })

  describe('headerDragHandleProps', () => {
    it('should return correct props for draggable header', () => {
      const tableApi = createMockTableApi()
      const columnOrderState = ref<string[]>([])
      const tableRef = ref(null)
      const header = createMockHeader('col1')

      const dragFns = useNuGridColumnDragDrop(tableApi, columnOrderState, tableRef)
      const props = dragFns.headerDragHandleProps(header)

      expect(props.draggable).toBe(true)
      expect(props.class).toContain('cursor-move')
      expect(typeof props.onDragstart).toBe('function')
    })

    it('should return correct props for non-draggable header', () => {
      const tableApi = createMockTableApi()
      const columnOrderState = ref<string[]>([])
      const tableRef = ref(null)
      const header = createMockHeader('col1', { isPlaceholder: true })

      const dragFns = useNuGridColumnDragDrop(tableApi, columnOrderState, tableRef)
      const props = dragFns.headerDragHandleProps(header)

      expect(props.draggable).toBe(false)
      expect(props.class).toBe('')
    })
  })

  describe('headerDragProps', () => {
    it('should return correct props with data attributes', () => {
      const tableApi = createMockTableApi()
      const columnOrderState = ref<string[]>([])
      const tableRef = ref(null)
      const header = createMockHeader('col1')

      const dragFns = useNuGridColumnDragDrop(tableApi, columnOrderState, tableRef)
      const props = dragFns.headerDragProps(header)

      expect(props['data-dragging']).toBe('false')
      expect(props['data-drop-target']).toBe('false')
      expect(typeof props.onDragover).toBe('function')
      expect(typeof props.onDrop).toBe('function')
      expect(typeof props.onDragend).toBe('function')
      expect(typeof props.onDragleave).toBe('function')
      expect(typeof props.onDragenter).toBe('function')
    })

    it('should show dragging state when column is being dragged', () => {
      const tableApi = createMockTableApi()
      const columnOrderState = ref<string[]>([])
      const tableRef = ref(null)
      const header = createMockHeader('col1')

      const dragFns = useNuGridColumnDragDrop(tableApi, columnOrderState, tableRef)

      // Simulate starting drag
      ;(dragFns.draggedColumnId as { value: string | null }).value = 'col1'

      const props = dragFns.headerDragProps(header)

      expect(props['data-dragging']).toBe('true')
    })

    it('should show drop target state when column is drop target', () => {
      const tableApi = createMockTableApi()
      const columnOrderState = ref<string[]>([])
      const tableRef = ref(null)
      const header = createMockHeader('col2')

      const dragFns = useNuGridColumnDragDrop(tableApi, columnOrderState, tableRef)

      // Simulate dragging over col2
      ;(dragFns.dropTargetColumnId as { value: string | null }).value = 'col2'
      ;(dragFns.dropPosition as { value: 'left' | 'right' }).value = 'left'

      const props = dragFns.headerDragProps(header)

      expect(props['data-drop-target']).toBe('true')
      expect(props['data-drop-position']).toBe('left')
    })
  })

  describe('handleColumnDragStart', () => {
    it('should set dragged column id', () => {
      const tableApi = createMockTableApi()
      const columnOrderState = ref<string[]>([])
      const tableRef = ref(null)

      const dragFns = useNuGridColumnDragDrop(tableApi, columnOrderState, tableRef)

      const mockEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
        },
      } as unknown as DragEvent

      dragFns.handleColumnDragStart(mockEvent, 'col1')

      expect(toValue(dragFns.draggedColumnId)).toBe('col1')
    })
  })

  describe('handleColumnDragEnd', () => {
    it('should reset all drag state', () => {
      const tableApi = createMockTableApi()
      const columnOrderState = ref<string[]>([])
      const tableRef = ref(null)

      const dragFns = useNuGridColumnDragDrop(tableApi, columnOrderState, tableRef)

      // Set some drag state
      ;(dragFns.draggedColumnId as { value: string | null }).value = 'col1'
      ;(dragFns.dropTargetColumnId as { value: string | null }).value = 'col2'
      dragFns.isDraggingOutside.value = true

      dragFns.handleColumnDragEnd()

      expect(toValue(dragFns.draggedColumnId)).toBeNull()
      expect(toValue(dragFns.dropTargetColumnId)).toBeNull()
      expect(dragFns.isDraggingOutside.value).toBe(false)
    })
  })

  describe('return value', () => {
    it('should return all expected properties and functions', () => {
      const tableApi = createMockTableApi()
      const columnOrderState = ref<string[]>([])
      const tableRef = ref(null)

      const dragFns = useNuGridColumnDragDrop(tableApi, columnOrderState, tableRef)

      // Check refs
      expect(dragFns.draggedColumnId).toBeDefined()
      expect(dragFns.dropTargetColumnId).toBeDefined()
      expect(dragFns.dropPosition).toBeDefined()
      expect(dragFns.isDraggingOutside).toBeDefined()

      // Check functions
      expect(typeof dragFns.handleColumnDragStart).toBe('function')
      expect(typeof dragFns.handleColumnDragOver).toBe('function')
      expect(typeof dragFns.handleColumnDrop).toBe('function')
      expect(typeof dragFns.handleColumnDragEnd).toBe('function')
      expect(typeof dragFns.handleColumnDragLeave).toBe('function')
      expect(typeof dragFns.handleColumnDragEnter).toBe('function')
      expect(typeof dragFns.isHeaderDraggable).toBe('function')
      expect(typeof dragFns.headerDragHandleProps).toBe('function')
      expect(typeof dragFns.headerDragProps).toBe('function')
    })
  })
})
