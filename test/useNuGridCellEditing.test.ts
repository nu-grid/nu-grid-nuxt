import type { Cell, Column, Row, Table } from '@tanstack/vue-table'
import type { ComponentPublicInstance, Ref } from 'vue'
import type { NuGridProps } from '../src/runtime/types'
import type { NuGridEditingCell, NuGridFocus } from '../src/runtime/types/_internal'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useNuGridCellEditing } from '../src/runtime/composables/_internal/useNuGridCellEditing'
import { ROUTER_PRIORITIES } from '../src/runtime/types/_internal'
import {
  createMockCell as createRouterMockCell,
  createMockRow as createRouterMockRow,
  createTestRouter,
} from './utils/router-test-utils'

// Store mock implementations that can be updated per test
let mockEditingEnabled = true
let mockStartClicks: 'single' | 'double' = 'double'
let mockStartKeys: 'all' | 'minimal' | 'none' | string[] = 'all'

// Mock dependencies
vi.mock('../src/runtime/composables/useNuGridCellTypeRegistry', () => ({
  useNuGridCellTypeRegistry: vi.fn(() => ({
    getCellType: vi.fn(() => null),
    getDefaultEditor: vi.fn(() => null),
    getKeyboardHandler: vi.fn(() => null),
  })),
}))

vi.mock('../src/runtime/composables/useNuGridScroll', () => ({
  useNuGridScroll: vi.fn(() => ({
    scrollManager: {
      scrollToCell: vi.fn(() => Promise.resolve()),
    },
  })),
}))

vi.mock('../src/runtime/config/_internal', () => ({
  getDefaults: vi.fn((key: string) => {
    if (key === 'validation') {
      return {
        validateOn: 'submit',
        showErrors: true,
        icon: 'i-lucide-alert-circle',
        onInvalid: 'block',
        validateOnAddRow: true,
      }
    }
    return {}
  }),
  usePropWithDefault: vi.fn((_props: any, category: string, key: string) => {
    if (category === 'editing') {
      if (key === 'enabled') return ref(mockEditingEnabled)
      if (key === 'startClicks') return ref(mockStartClicks)
      if (key === 'startKeys') return ref(mockStartKeys)
    }
    return ref(undefined)
  }),
}))

/**
 * Helper to create mock cell for this test file
 * Note: router-test-utils provides a simpler version for router tests
 */
function createMockCell(
  overrides: Omit<Partial<Cell<any, any>>, 'getValue'> & { getValue?: () => any } = {},
): Cell<any, any> {
  const columnId = overrides.column?.id ?? 'col1'
  const { getValue: getValueOverride, ...restOverrides } = overrides
  return {
    id: `row1_${columnId}`,
    getValue: getValueOverride ?? (() => 'test value'),
    getContext: vi.fn(() => ({})),
    column: {
      id: columnId,
      columnDef: {
        cellDataType: 'text',
        ...overrides.column?.columnDef,
      },
      ...overrides.column,
    } as Column<any, any>,
    row: restOverrides.row ?? createMockRow(),
    ...restOverrides,
  } as Cell<any, any>
}

/**
 * Helper to create mock row for this test file
 * Note: router-test-utils provides a simpler version for router tests
 */
function createMockRow(overrides: Partial<Row<any>> = {}): Row<any> {
  const rowId = overrides.id ?? 'row1'
  return {
    id: rowId,
    original: { id: rowId, name: 'Test', email: 'test@test.com', ...overrides.original },
    getValue: vi.fn((key: string) => (overrides.original as any)?.[key] ?? 'test'),
    getAllCells: vi.fn(() => [createMockCell()]),
    getVisibleCells: vi.fn(() => [createMockCell()]),
    ...overrides,
  } as Row<any>
}

/**
 * Helper to create mock table API
 */
function createMockTableApi(): Table<any> {
  return {
    getState: vi.fn(() => ({ grouping: [] })),
    options: {
      getRowId: vi.fn((row: any) => row.id),
    },
  } as unknown as Table<any>
}

/**
 * Helper to create mock focus functions
 */
function createMockFocusFns(): NuGridFocus<any> {
  return {
    focusedCell: ref(null),
    focusCell: vi.fn(),
    shouldCellHandleKeydown: vi.fn(() => true),
    onCellKeyDown: vi.fn(),
    getCellElement: vi.fn(() => null),
    scrollToCellAndFocus: vi.fn(({ onComplete }) => onComplete?.()),
  } as unknown as NuGridFocus<any>
}

/**
 * Helper to create mock props
 */
function createMockProps(overrides: Partial<NuGridProps<any>> = {}): NuGridProps<any> {
  return {
    columns: [],
    data: [],
    editing: {
      enabled: true,
      startClicks: 'double',
      startKeys: 'all',
      ...overrides.editing,
    },
    ...overrides,
  } as NuGridProps<any>
}

describe('useNuGridCellEditing', () => {
  let tableApi: Table<any>
  let data: Ref<any[]>
  let rows: Ref<Row<any>[]>
  let tableRef: Ref<HTMLElement | null>
  let rootRef: Ref<HTMLElement | ComponentPublicInstance | null | undefined>
  let focusFns: NuGridFocus<any>
  let routerUtils: ReturnType<typeof createTestRouter>
  let interactionRouter: ReturnType<typeof createTestRouter>['router']
  let emit: (payload: {
    row: Row<any>
    column: Column<any, any>
    oldValue: any
    newValue: any
  }) => void

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock values to defaults
    mockEditingEnabled = true
    mockStartClicks = 'double'
    mockStartKeys = 'all'

    tableApi = createMockTableApi()
    data = ref([{ id: 'row1', name: 'Test', email: 'test@test.com' }])
    rows = ref([createMockRow()])
    tableRef = ref(null)
    rootRef = ref(null)
    focusFns = createMockFocusFns()
    routerUtils = createTestRouter()
    interactionRouter = routerUtils.router
    emit = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      expect(result.editingCell.value).toBeNull()
      expect(result.editingValue.value).toBeNull()
      expect(result.isNavigating.value).toBe(false)
      expect(result.shouldFocusEditor.value).toBe(false)
      expect(result.validationError.value).toBeNull()
    })

    it('should register interaction handlers when router provided', () => {
      const props = createMockProps()
      useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const handlers = routerUtils.getRegisteredHandlers()
      expect(handlers.cellClick.length).toBeGreaterThan(0)
      expect(handlers.globalPointer.length).toBeGreaterThan(0)
    })

    it('should use external editing cell ref when provided', () => {
      const props = createMockProps()
      const externalEditingCell = ref<NuGridEditingCell | null>({ rowId: 'row1', columnId: 'col1' })

      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
        undefined,
        externalEditingCell,
      )

      expect(result.editingCell.value).toEqual({ rowId: 'row1', columnId: 'col1' })
    })
  })

  describe('isCellEditable', () => {
    it('should return true for editable cells by default', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow()
      const cell = createMockCell({ row })

      expect(result.isCellEditable(row, cell)).toBe(true)
    })

    it('should return false when editing is disabled globally', () => {
      mockEditingEnabled = false

      const props = createMockProps({ editing: { enabled: false } })
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow()
      const cell = createMockCell({ row })

      expect(result.isCellEditable(row, cell)).toBe(false)
    })

    it('should return false when column enableEditing is false', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow()
      const cell = createMockCell({
        row,
        column: {
          id: 'col1',
          columnDef: { enableEditing: false },
        } as Column<any, any>,
      })

      expect(result.isCellEditable(row, cell)).toBe(false)
    })

    it('should evaluate function-based enableEditing', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const enableEditingFn = vi.fn((r: Row<any>) => r.id === 'row1')
      const cell = createMockCell({
        row,
        column: {
          id: 'col1',
          columnDef: { enableEditing: enableEditingFn },
        } as unknown as Column<any, any>,
      })

      expect(result.isCellEditable(row, cell)).toBe(true)
      expect(enableEditingFn).toHaveBeenCalledWith(row)
    })

    it('should return false when function-based enableEditing returns false', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row2' })
      const enableEditingFn = vi.fn((r: Row<any>) => r.id === 'row1') // returns false for row2
      const cell = createMockCell({
        row,
        column: {
          id: 'col1',
          columnDef: { enableEditing: enableEditingFn },
        } as unknown as Column<any, any>,
      })

      expect(result.isCellEditable(row, cell)).toBe(false)
    })
  })

  describe('isEditingCell', () => {
    it('should return true when editing the specified cell', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      result.editingCell.value = { rowId: 'row1', columnId: 'col1' }

      const row = createMockRow({ id: 'row1' })
      expect(result.isEditingCell(row, 'col1')).toBe(true)
    })

    it('should return false when editing a different cell', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      result.editingCell.value = { rowId: 'row1', columnId: 'col1' }

      const row = createMockRow({ id: 'row2' })
      expect(result.isEditingCell(row, 'col1')).toBe(false)
    })

    it('should return false when not editing', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      expect(result.isEditingCell(row, 'col1')).toBe(false)
    })
  })

  describe('startEditing', () => {
    it('should set editing cell and value', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({
        row,
        getValue: () => 'cell value',
      })

      result.startEditing(row, cell)

      expect(result.editingCell.value).toEqual({ rowId: 'row1', columnId: 'col1' })
      expect(result.editingValue.value).toBe('cell value')
    })

    it('should use provided initial value', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({
        row,
        getValue: () => 'original value',
      })

      result.startEditing(row, cell, 'initial value')

      expect(result.editingValue.value).toBe('initial value')
    })

    it('should not restart editing same cell without initial value', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({
        row,
        getValue: () => 'original',
      })

      result.startEditing(row, cell)
      result.editingValue.value = 'modified'

      // Try to restart without initial value - should be ignored
      result.startEditing(row, cell)

      expect(result.editingValue.value).toBe('modified')
    })

    it('should restart editing same cell with new initial value', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({
        row,
        getValue: () => 'original',
      })

      result.startEditing(row, cell)
      result.editingValue.value = 'modified'

      // Restart with new initial value
      result.startEditing(row, cell, 'new initial')

      expect(result.editingValue.value).toBe('new initial')
    })

    it('should clear validation state when starting editing new cell', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      // Set some validation state
      result.validationError.value = 'Some error'

      const row = createMockRow({ id: 'row2' }) // Different row
      const cell = createMockCell({ row })

      result.startEditing(row, cell)

      expect(result.validationError.value).toBeNull()
    })

    it('should not start editing non-editable cell', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({
        row,
        column: {
          id: 'col1',
          columnDef: { enableEditing: false },
        } as Column<any, any>,
      })

      result.startEditing(row, cell)

      expect(result.editingCell.value).toBeNull()
    })
  })

  describe('stopEditing', () => {
    it('should emit change when value changed', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({
        row,
        getValue: () => 'old value',
        column: {
          id: 'col1',
          columnDef: { accessorKey: 'name' },
        } as Column<any, any>,
      })
      ;(row.getVisibleCells as ReturnType<typeof vi.fn>).mockReturnValue([cell])

      result.startEditing(row, cell)
      result.stopEditing(row, cell, 'new value')

      expect(emit).toHaveBeenCalledWith({
        row,
        column: cell.column,
        oldValue: 'old value',
        newValue: 'new value',
      })
    })

    it('should not emit change when value unchanged', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({
        row,
        getValue: () => 'same value',
      })
      ;(row.getVisibleCells as ReturnType<typeof vi.fn>).mockReturnValue([cell])

      result.startEditing(row, cell)
      result.stopEditing(row, cell, 'same value')

      expect(emit).not.toHaveBeenCalled()
    })

    it('should coerce string to number when original was number', () => {
      const props = createMockProps()
      data.value = [{ id: 'row1', count: 42 }]
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1', original: { id: 'row1', count: 42 } })
      const cell = createMockCell({
        row,
        getValue: () => 42,
        column: {
          id: 'count',
          columnDef: { accessorKey: 'count' },
        } as Column<any, any>,
      })
      ;(row.getVisibleCells as ReturnType<typeof vi.fn>).mockReturnValue([cell])

      result.startEditing(row, cell)
      result.stopEditing(row, cell, '100')

      expect(emit).toHaveBeenCalledWith(
        expect.objectContaining({
          newValue: 100, // Coerced to number
        }),
      )
    })

    it('should coerce string to boolean when original was boolean', () => {
      const props = createMockProps()
      data.value = [{ id: 'row1', active: true }]
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1', original: { id: 'row1', active: true } })
      const cell = createMockCell({
        row,
        getValue: () => true,
        column: {
          id: 'active',
          columnDef: { accessorKey: 'active' },
        } as Column<any, any>,
      })
      ;(row.getVisibleCells as ReturnType<typeof vi.fn>).mockReturnValue([cell])

      result.startEditing(row, cell)
      result.stopEditing(row, cell, 'false')

      expect(emit).toHaveBeenCalledWith(
        expect.objectContaining({
          newValue: false, // Coerced to boolean
        }),
      )
    })

    it('should clear editing state after stopping', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({
        row,
        getValue: () => 'value',
      })
      ;(row.getVisibleCells as ReturnType<typeof vi.fn>).mockReturnValue([cell])

      result.startEditing(row, cell)
      result.stopEditing(row, cell, 'value')

      expect(result.editingCell.value).toBeNull()
      expect(result.editingValue.value).toBeNull()
    })
  })

  describe('row validation errors', () => {
    it('should set row validation error', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      expect(result.hasRowValidationError('row1')).toBe(false)

      result.rowValidationErrors.value = new Map([
        ['row1', { message: 'Error', failedFields: ['name'] }],
      ])

      expect(result.hasRowValidationError('row1')).toBe(true)
      expect(result.getRowValidationError('row1')).toBe('Error')
    })

    it('should check cell validation error', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      result.rowValidationErrors.value = new Map([
        ['row1', { message: 'Error', failedFields: ['name'] }],
      ])

      expect(result.hasCellValidationError('row1', 'name')).toBe(true)
      expect(result.hasCellValidationError('row1', 'email')).toBe(false)
    })

    it('should treat all cells as failed when failedFields is empty', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      result.rowValidationErrors.value = new Map([['row1', { message: 'Error', failedFields: [] }]])

      expect(result.hasCellValidationError('row1', 'name')).toBe(true)
      expect(result.hasCellValidationError('row1', 'email')).toBe(true)
    })
  })

  describe('click handlers', () => {
    it('should start editing on single click when startClicks is single', () => {
      mockStartClicks = 'single'

      const props = createMockProps({ editing: { startClicks: 'single' } })
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({ row })
      const event = new MouseEvent('click')
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation')

      result.onCellClick(event, row, cell)

      expect(stopPropagationSpy).toHaveBeenCalled()
      expect(result.editingCell.value).toEqual({ rowId: 'row1', columnId: 'col1' })
    })

    it('should not start editing on single click when startClicks is double', () => {
      mockStartClicks = 'double'

      const props = createMockProps({ editing: { startClicks: 'double' } })
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({ row })
      const event = new MouseEvent('click')

      result.onCellClick(event, row, cell)

      expect(result.editingCell.value).toBeNull()
    })

    it('should start editing on double click when startClicks is double', () => {
      mockStartClicks = 'double'

      const props = createMockProps({ editing: { startClicks: 'double' } })
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({ row })
      const event = new MouseEvent('dblclick')
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation')

      result.onCellDoubleClick(event, row, cell)

      expect(stopPropagationSpy).toHaveBeenCalled()
      expect(result.editingCell.value).toEqual({ rowId: 'row1', columnId: 'col1' })
    })
  })

  describe('keyboard handling', () => {
    it('should start editing on Enter key when focused and editable', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({ row })
      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation')

      result.onCellKeyDown(event, row, cell, 0)

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(stopPropagationSpy).toHaveBeenCalled()
      expect(result.editingCell.value).toEqual({ rowId: 'row1', columnId: 'col1' })
    })

    it('should start editing on F2 key', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({ row })
      const event = new KeyboardEvent('keydown', { key: 'F2' })

      result.onCellKeyDown(event, row, cell, 0)

      expect(result.editingCell.value).toEqual({ rowId: 'row1', columnId: 'col1' })
    })

    it('should start editing with empty value on Backspace', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({
        row,
        getValue: () => 'existing value',
      })
      const event = new KeyboardEvent('keydown', { key: 'Backspace' })

      result.onCellKeyDown(event, row, cell, 0)

      expect(result.editingCell.value).toEqual({ rowId: 'row1', columnId: 'col1' })
      expect(result.editingValue.value).toBe('')
    })

    it('should start editing with empty value on Delete', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({ row })
      const event = new KeyboardEvent('keydown', { key: 'Delete' })

      result.onCellKeyDown(event, row, cell, 0)

      expect(result.editingValue.value).toBe('')
    })

    it('should start editing with typed character on alphanumeric key', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({ row })
      const event = new KeyboardEvent('keydown', { key: 'a' })

      result.onCellKeyDown(event, row, cell, 0)

      expect(result.editingCell.value).toEqual({ rowId: 'row1', columnId: 'col1' })
      expect(result.editingValue.value).toBe('a')
    })

    it('should start editing with typed number on numeric key', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({ row })
      const event = new KeyboardEvent('keydown', { key: '5' })

      result.onCellKeyDown(event, row, cell, 0)

      expect(result.editingValue.value).toBe('5')
    })

    it('should not start editing on key when cell is not focused', () => {
      const props = createMockProps()
      ;(focusFns.shouldCellHandleKeydown as ReturnType<typeof vi.fn>).mockReturnValue(false)

      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({ row })
      const event = new KeyboardEvent('keydown', { key: 'Enter' })

      result.onCellKeyDown(event, row, cell, 0)

      expect(result.editingCell.value).toBeNull()
    })

    it('should not start editing on key with modifier (Ctrl)', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({ row })
      const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true })

      result.onCellKeyDown(event, row, cell, 0)

      expect(result.editingCell.value).toBeNull()
    })

    it('should not start editing on space key (reserved for shortcuts)', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({ row })
      const event = new KeyboardEvent('keydown', { key: ' ' })

      result.onCellKeyDown(event, row, cell, 0)

      expect(result.editingCell.value).toBeNull()
    })

    it('should stop propagation when cell is editing', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({ row })

      // Start editing first
      result.editingCell.value = { rowId: 'row1', columnId: 'col1' }

      const event = new KeyboardEvent('keydown', { key: 'a' })
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation')

      result.onCellKeyDown(event, row, cell, 0)

      expect(stopPropagationSpy).toHaveBeenCalled()
    })
  })

  describe('startKeys configuration', () => {
    it('should respect minimal key configuration', () => {
      mockStartKeys = 'minimal'

      const props = createMockProps({ editing: { startKeys: 'minimal' } })
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({ row })

      // F2 should work
      const f2Event = new KeyboardEvent('keydown', { key: 'F2' })
      result.onCellKeyDown(f2Event, row, cell, 0)
      expect(result.editingCell.value).toEqual({ rowId: 'row1', columnId: 'col1' })

      // Reset
      result.editingCell.value = null

      // Enter should work
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      result.onCellKeyDown(enterEvent, row, cell, 0)
      expect(result.editingCell.value).toEqual({ rowId: 'row1', columnId: 'col1' })

      // Reset
      result.editingCell.value = null

      // Backspace should NOT work in minimal mode
      const bsEvent = new KeyboardEvent('keydown', { key: 'Backspace' })
      result.onCellKeyDown(bsEvent, row, cell, 0)
      expect(result.editingCell.value).toBeNull()
    })

    it('should disable all keyboard shortcuts when startKeys is none', () => {
      mockStartKeys = 'none'

      const props = createMockProps({ editing: { startKeys: 'none' } })
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({ row })

      // F2 should NOT work
      const f2Event = new KeyboardEvent('keydown', { key: 'F2' })
      result.onCellKeyDown(f2Event, row, cell, 0)
      expect(result.editingCell.value).toBeNull()

      // Enter should NOT work
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      result.onCellKeyDown(enterEvent, row, cell, 0)
      expect(result.editingCell.value).toBeNull()
    })
  })

  describe('validation showErrors', () => {
    it('should expose showValidationErrors computed', () => {
      const props = createMockProps({
        validation: {
          schema: undefined,
          showErrors: 'always',
        },
      })
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      expect(result.showValidationErrors.value).toBe('always')
    })

    it('should expose validationIcon computed', () => {
      const props = createMockProps({
        validation: {
          schema: undefined,
          icon: 'custom-icon',
        },
      })
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      expect(result.validationIcon.value).toBe('custom-icon')
    })
  })

  describe('return value structure', () => {
    it('should return all expected properties and functions', () => {
      const props = createMockProps()
      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        interactionRouter,
        emit,
      )

      // Refs
      expect(result).toHaveProperty('editingCell')
      expect(result).toHaveProperty('editingValue')
      expect(result).toHaveProperty('isNavigating')
      expect(result).toHaveProperty('shouldFocusEditor')
      expect(result).toHaveProperty('validationError')
      expect(result).toHaveProperty('showValidationErrors')
      expect(result).toHaveProperty('validationIcon')
      expect(result).toHaveProperty('rowValidationErrors')

      // Row validation functions
      expect(typeof result.hasRowValidationError).toBe('function')
      expect(typeof result.hasCellValidationError).toBe('function')
      expect(typeof result.getRowValidationError).toBe('function')

      // Cell editing functions
      expect(typeof result.isEditingCell).toBe('function')
      expect(typeof result.isCellEditable).toBe('function')
      expect(typeof result.startEditing).toBe('function')
      expect(typeof result.stopEditing).toBe('function')
      expect(typeof result.createDefaultEditor).toBe('function')
      expect(typeof result.renderCellContent).toBe('function')
      expect(typeof result.onCellClick).toBe('function')
      expect(typeof result.onCellDoubleClick).toBe('function')
      expect(typeof result.onCellKeyDown).toBe('function')
    })
  })

  describe('router integration', () => {
    it('should register handlers on initialization', () => {
      const props = createMockProps()
      const { router, getRegisteredHandlers } = createTestRouter()

      useNuGridCellEditing(props, tableApi, data, rows, tableRef, rootRef, focusFns, router, emit)

      const handlers = getRegisteredHandlers()

      // Should register cell click handler
      expect(handlers.cellClick.length).toBeGreaterThan(0)
      expect(handlers.cellClick).toContainEqual(expect.objectContaining({ id: 'cell-editing' }))

      // Should register global pointer handler
      expect(handlers.globalPointer.length).toBeGreaterThan(0)
      expect(handlers.globalPointer).toContainEqual(
        expect.objectContaining({ id: 'cell-editing-outside' }),
      )
    })

    it('should use correct priorities', () => {
      const props = createMockProps()
      const { router, getRegisteredHandlers } = createTestRouter()

      useNuGridCellEditing(props, tableApi, data, rows, tableRef, rootRef, focusFns, router, emit)

      const handlers = getRegisteredHandlers()

      // Cell click should use EDITING priority
      const cellClickHandler = handlers.cellClick.find((h) => h.id === 'cell-editing')
      expect(cellClickHandler?.priority).toBe(ROUTER_PRIORITIES.EDITING)

      // Outside click should use EDITING_OUTSIDE priority
      const outsideHandler = handlers.globalPointer.find((h) => h.id === 'cell-editing-outside')
      expect(outsideHandler?.priority).toBe(ROUTER_PRIORITIES.EDITING_OUTSIDE)
    })

    it('should start editing when click handler executed', () => {
      mockStartClicks = 'single'
      const props = createMockProps({ editing: { startClicks: 'single' } })
      const { router, simulateCellClick } = createTestRouter()

      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        tableRef,
        rootRef,
        focusFns,
        router,
        emit,
      )

      const row = createRouterMockRow({ id: 'row1', name: 'Test' }, { id: 'row1' })
      const cell = createRouterMockCell(row, 'name', 'Test')

      simulateCellClick(row as Row<any>, cell as Cell<any, any>)

      expect(result.editingCell.value).toEqual({
        rowId: 'row1',
        columnId: 'name',
      })
    })

    it('should handle outside clicks via global pointer handler', () => {
      const props = createMockProps()
      const { router } = createTestRouter()

      // Create a realistic mock DOM structure with proper data attributes
      const mockTableRoot = document.createElement('div')
      const mockRow = document.createElement('div')
      mockRow.setAttribute('data-row-id', 'row1')
      const mockCell = document.createElement('div')
      mockCell.setAttribute('data-cell-index', '0')
      mockRow.appendChild(mockCell)
      mockTableRoot.appendChild(mockRow)
      document.body.appendChild(mockTableRoot)

      // Set up refs with actual DOM elements
      const localRootRef = ref(mockTableRoot)
      const localTableRef = ref(mockTableRoot)

      const result = useNuGridCellEditing(
        props,
        tableApi,
        data,
        rows,
        localTableRef,
        localRootRef,
        focusFns,
        router,
        emit,
      )

      // Start editing
      const row = createMockRow({ id: 'row1' })
      const cell = createMockCell({ row })
      result.startEditing(row, cell)
      expect(result.editingCell.value).not.toBeNull()

      // Click outside the table
      const outsideElement = document.createElement('div')
      document.body.appendChild(outsideElement)

      const clickEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
      })
      Object.defineProperty(clickEvent, 'target', {
        value: outsideElement,
        enumerable: true,
      })
      document.dispatchEvent(clickEvent)

      // Should stop editing
      expect(result.editingCell.value).toBeNull()

      // Cleanup
      document.body.removeChild(mockTableRoot)
      document.body.removeChild(outsideElement)
    })
  })
})
