import type { NuGridCellTypeContext } from '../src/runtime/types'
import type { NuGridKeyboardContext } from '../src/runtime/types/_internal'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { lookupCellType } from '../src/runtime/cell-types/lookup'
import LookupEditor from '../src/runtime/cell-types/lookup/LookupEditor.vue'
import LookupRenderer from '../src/runtime/cell-types/lookup/LookupRenderer.vue'

/**
 * Helper to create a minimal keyboard context for testing editor handlers
 * Document-level handlers receive minimal context - they use their own props for state
 */
function createMinimalKeyboardContext(event: KeyboardEvent): NuGridKeyboardContext<any> {
  return {
    event,
    focusedCell: null,
    focusedRow: null,
    cell: null,
    cellIndex: 0,
    isEditing: true,
    focusMode: 'cell',
    editingEnabled: true,
    tableApi: null as any,
    focusFns: null as any,
    cellEditingFns: null as any,
  }
}

/**
 * Helper to create a mock NuGridCellTypeContext for testing
 */
function createMockContext(overrides = {}) {
  return {
    cell: {},
    row: { id: 'row-1', original: { id: 1, status: 'active' } },
    columnDef: {
      accessorKey: 'status',
      lookup: {
        items: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'draft', label: 'Draft' },
        ],
        valueKey: 'value',
        labelKey: 'label',
      },
    },
    column: {},
    getValue: () => 'active',
    isFocused: true,
    canEdit: true,
    data: [{ id: 1, status: 'active' }],
    tableApi: {
      options: {
        getRowId: (r: any) => `row-${r.id}`,
      },
    } as any,
    startEditing: vi.fn(),
    stopEditing: vi.fn(),
    emitChange: vi.fn(),
    ...overrides,
  } as unknown as NuGridCellTypeContext
}

describe('lookupCellType', () => {
  describe('metadata', () => {
    it('should have correct type metadata', () => {
      expect(lookupCellType.name).toBe('lookup')
      expect(lookupCellType.displayName).toBe('Lookup')
      expect(lookupCellType.description).toBe('Dropdown selection with search support')
    })

    it('should have default column settings', () => {
      expect(lookupCellType.defaultColumnDef).toEqual({ size: 150 })
    })

    it('should have editor and renderer components', () => {
      expect(lookupCellType.editor).toBeDefined()
      expect(lookupCellType.renderer).toBeDefined()
    })
  })

  describe('formatter', () => {
    it('should return empty string for null value', () => {
      const context = createMockContext({ getValue: () => null })
      const result = lookupCellType.formatter!(null, context)
      expect(result).toBe('')
    })

    it('should return empty string for undefined value', () => {
      const context = createMockContext({ getValue: () => undefined })
      const result = lookupCellType.formatter!(undefined, context)
      expect(result).toBe('')
    })

    it('should return label for matching value', () => {
      const context = createMockContext({ getValue: () => 'active' })
      const result = lookupCellType.formatter!('active', context)
      expect(result).toBe('Active')
    })

    it('should return raw value for non-matching value', () => {
      const context = createMockContext({ getValue: () => 'unknown' })
      const result = lookupCellType.formatter!('unknown', context)
      expect(result).toBe('unknown')
    })

    it('should return raw value when no lookup config', () => {
      const context = createMockContext({ columnDef: {} })
      const result = lookupCellType.formatter!('test', context)
      expect(result).toBe('test')
    })

    it('should handle custom valueKey and labelKey', () => {
      const context = createMockContext({
        columnDef: {
          lookup: {
            items: [
              { id: 1, name: 'First' },
              { id: 2, name: 'Second' },
            ],
            valueKey: 'id',
            labelKey: 'name',
          },
        },
      })
      const result = lookupCellType.formatter!(1, context)
      expect(result).toBe('First')
    })

    it('should return raw value for empty items array', () => {
      const context = createMockContext({
        columnDef: {
          lookup: { items: [] },
        },
      })
      const result = lookupCellType.formatter!('test', context)
      expect(result).toBe('test')
    })

    it('should return raw value for async items (cannot resolve)', () => {
      const context = createMockContext({
        columnDef: {
          lookup: {
            items: async () => [{ value: 'test', label: 'Test' }],
          },
        },
      })
      const result = lookupCellType.formatter!('test', context)
      expect(result).toBe('test')
    })

    it('should resolve reactive ref items', () => {
      const items = ref([
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ])
      const context = createMockContext({
        columnDef: {
          lookup: { items },
        },
      })
      const result = lookupCellType.formatter!('active', context)
      expect(result).toBe('Active')
    })
  })

  describe('keyboardHandler', () => {
    it('should handle Space key to start editing', () => {
      const context = createMockContext()
      const event = new KeyboardEvent('keydown', { key: ' ' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      const result = lookupCellType.keyboardHandler!(event, context)

      expect(result.handled).toBe(true)
      expect(result.preventDefault).toBe(true)
      expect(result.stopPropagation).toBe(true)
      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(context.startEditing).toHaveBeenCalled()
    })

    it('should not handle Space if not focused', () => {
      const context = createMockContext({ isFocused: false })
      const event = new KeyboardEvent('keydown', { key: ' ' })

      const result = lookupCellType.keyboardHandler!(event, context)

      expect(result.handled).toBe(false)
      expect(context.startEditing).not.toHaveBeenCalled()
    })

    it('should not handle Space if not editable', () => {
      const context = createMockContext({ canEdit: false })
      const event = new KeyboardEvent('keydown', { key: ' ' })

      const result = lookupCellType.keyboardHandler!(event, context)

      expect(result.handled).toBe(false)
      expect(context.startEditing).not.toHaveBeenCalled()
    })

    it('should not handle Enter (let default behavior)', () => {
      const context = createMockContext()
      const event = new KeyboardEvent('keydown', { key: 'Enter' })

      const result = lookupCellType.keyboardHandler!(event, context)

      expect(result.handled).toBe(false)
    })

    it('should not handle other keys', () => {
      const context = createMockContext()
      const event = new KeyboardEvent('keydown', { key: 'a' })

      const result = lookupCellType.keyboardHandler!(event, context)

      expect(result.handled).toBe(false)
    })
  })
})

describe('lookupEditor', () => {
  // Mock querySelector for finding trigger elements
  let querySelectorMock: any

  beforeEach(() => {
    querySelectorMock = vi.fn()
    document.querySelector = querySelectorMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockCell = (overrides = {}) => ({
    column: {
      columnDef: {
        lookup: {
          items: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ],
          valueKey: 'value',
          labelKey: 'label',
        },
        ...overrides,
      },
    },
  })

  const createDefaultProps = (overrides = {}) =>
    ({
      modelValue: 'active',
      cell: createMockCell(),
      row: { id: 1, original: { status: 'active' } },
      shouldFocus: false,
      isNavigating: false,
      ...overrides,
    }) as any

  describe('props and initialization', () => {
    it('should accept required props', () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps(),
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('should resolve static items', async () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps(),
        global: {
          stubs: { Teleport: true },
        },
      })

      await nextTick()

      // Check that items were resolved
      const vm = wrapper.vm as any
      expect(vm.resolvedItems).toHaveLength(2)
      expect(vm.resolvedItems[0].value).toBe('active')
    })

    it('should resolve reactive ref items', async () => {
      const items = ref([
        { value: 'test1', label: 'Test 1' },
        { value: 'test2', label: 'Test 2' },
      ])

      const wrapper = mount(LookupEditor, {
        props: createDefaultProps({
          modelValue: 'test1',
          cell: createMockCell({ lookup: { items } }),
        }),
        global: {
          stubs: { Teleport: true },
        },
      })

      await nextTick()

      const vm = wrapper.vm as any
      expect(vm.resolvedItems).toHaveLength(2)
      expect(vm.resolvedItems[0].value).toBe('test1')
    })

    it('should handle async items', async () => {
      const asyncItems = vi.fn(async () => {
        return [
          { value: 'async1', label: 'Async 1' },
          { value: 'async2', label: 'Async 2' },
        ]
      })

      const wrapper = mount(LookupEditor, {
        props: createDefaultProps({
          modelValue: 'async1',
          cell: createMockCell({ lookup: { items: asyncItems } }),
        }),
        global: {
          stubs: { Teleport: true },
        },
      })

      const vm = wrapper.vm as any
      expect(vm.isLoading).toBe(true)

      await nextTick()
      await nextTick()

      expect(asyncItems).toHaveBeenCalled()
      expect(vm.isLoading).toBe(false)
      expect(vm.resolvedItems).toHaveLength(2)
    })

    it('should handle async item loading errors', async () => {
      const asyncItems = vi.fn(async () => {
        throw new Error('Failed to load items')
      })

      const wrapper = mount(LookupEditor, {
        props: createDefaultProps({
          modelValue: 'test',
          cell: createMockCell({ lookup: { items: asyncItems } }),
        }),
        global: {
          stubs: { Teleport: true },
        },
      })

      await nextTick()
      await nextTick()

      const vm = wrapper.vm as any
      expect(vm.loadError).toBe('Failed to load items')
      expect(vm.resolvedItems).toHaveLength(0)
    })
  })

  describe('value change handling', () => {
    it('should emit update:modelValue when value changes', async () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps(),
        global: {
          stubs: { Teleport: true },
        },
      })

      const vm = wrapper.vm as any
      vm.handleValueChange('inactive')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0]).toEqual(['inactive'])
    })

    it('should set valueJustChanged flag on value change', async () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps(),
        global: {
          stubs: { Teleport: true },
        },
      })

      const vm = wrapper.vm as any
      expect(vm.valueJustChanged).toBe(false)

      vm.handleValueChange('inactive')

      expect(vm.valueJustChanged).toBe(true)
    })
  })

  describe('menu close handling', () => {
    it('should not exit edit mode when valueJustChanged flag is set', () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps(),
        global: {
          stubs: { Teleport: true },
        },
      })

      const vm = wrapper.vm as any
      vm.valueJustChanged = true

      vm.handleMenuClose(false)

      expect(wrapper.emitted('stop-editing')).toBeFalsy()
    })

    it('should not exit edit mode when navigatingViaTab flag is set', () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps(),
        global: {
          stubs: { Teleport: true },
        },
      })

      const vm = wrapper.vm as any
      vm.navigatingViaTab = true

      vm.handleMenuClose(false)

      expect(wrapper.emitted('stop-editing')).toBeFalsy()
    })

    it('should not exit edit mode when escapingMenu flag is set', () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps(),
        global: {
          stubs: { Teleport: true },
        },
      })

      const vm = wrapper.vm as any
      vm.escapingMenu = true

      vm.handleMenuClose(false)

      expect(wrapper.emitted('stop-editing')).toBeFalsy()
    })

    it('should exit edit mode when Enter was last key pressed', async () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps(),
        global: {
          stubs: { Teleport: true },
        },
      })

      const vm = wrapper.vm as any
      vm.lastKeyPressed = 'Enter'

      vm.handleMenuClose(false)

      // Wait for setTimeout
      await new Promise((resolve) => setTimeout(resolve, 150))

      expect(wrapper.emitted('stop-editing')).toBeTruthy()
    })
  })

  describe('keyboard handling - Tab key', () => {
    it('should navigate to next cell on Tab when menu is open', async () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps(),
        global: {
          stubs: { Teleport: true },
        },
      })

      const vm = wrapper.vm as any
      vm.isOpen = true

      // Mock trigger element with aria-controls
      const mockTrigger = document.createElement('button')
      mockTrigger.setAttribute('aria-haspopup', 'listbox')
      mockTrigger.setAttribute('aria-controls', 'test-listbox-id')

      // Mock listbox element with matching ID
      const mockListbox = document.createElement('div')
      mockListbox.id = 'test-listbox-id'
      mockListbox.setAttribute('role', 'listbox')
      document.body.appendChild(mockListbox)

      // Mock querySelector to return the trigger
      const containerMock = { querySelector: vi.fn(() => mockTrigger) }
      vm.containerRef = containerMock

      const dispatchEventSpy = vi.spyOn(mockListbox, 'dispatchEvent')

      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      const ctx = createMinimalKeyboardContext(event)

      const result = vm.handleKeydown(ctx)

      expect(result.preventDefault).toBe(true)
      expect(result.stopPropagation).toBe(true)
      expect(vm.navigatingViaTab).toBe(true)
      expect(dispatchEventSpy).toHaveBeenCalled()

      // Cleanup
      document.body.removeChild(mockListbox)

      // Wait for setTimeout
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(wrapper.emitted('stop-editing')).toBeTruthy()
      expect(wrapper.emitted('stop-editing')![0]).toEqual(['next'])
    })

    it('should navigate to previous cell on Shift+Tab when menu is open', async () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps(),
        global: {
          stubs: { Teleport: true },
        },
      })

      const vm = wrapper.vm as any
      vm.isOpen = true

      // Mock trigger element with aria-controls
      const mockTrigger = document.createElement('button')
      mockTrigger.setAttribute('aria-haspopup', 'listbox')
      mockTrigger.setAttribute('aria-controls', 'test-listbox-id-2')

      // Mock listbox element with matching ID
      const mockListbox = document.createElement('div')
      mockListbox.id = 'test-listbox-id-2'
      mockListbox.setAttribute('role', 'listbox')
      document.body.appendChild(mockListbox)

      // Mock querySelector to return the trigger
      const containerMock = { querySelector: vi.fn(() => mockTrigger) }
      vm.containerRef = containerMock

      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true })
      vm.handleKeydown(createMinimalKeyboardContext(event))

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(wrapper.emitted('stop-editing')![0]).toEqual(['previous'])

      // Cleanup
      document.body.removeChild(mockListbox)
    })

    it('should navigate immediately when menu is closed', () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps(),
        global: {
          stubs: { Teleport: true },
        },
      })

      const vm = wrapper.vm as any
      vm.isOpen = false

      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      vm.handleKeydown(createMinimalKeyboardContext(event))

      expect(wrapper.emitted('stop-editing')).toBeTruthy()
      expect(wrapper.emitted('stop-editing')![0]).toEqual(['next'])
    })
  })

  describe('keyboard handling - Escape key', () => {
    it('should close menu on first Escape and stay in edit mode', () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps(),
        global: {
          stubs: { Teleport: true },
        },
      })

      const vm = wrapper.vm as any
      vm.isOpen = true

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      const ctx = createMinimalKeyboardContext(event)

      const result = vm.handleKeydown(ctx)

      expect(vm.isOpen).toBe(false)
      expect(vm.escapingMenu).toBe(true)
      expect(result.preventDefault).toBe(true)
      expect(result.stopPropagation).toBe(true)
      expect(wrapper.emitted('cancel-editing')).toBeFalsy()
    })

    it('should cancel editing on second Escape', () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps(),
        global: {
          stubs: { Teleport: true },
        },
      })

      const vm = wrapper.vm as any
      vm.isOpen = false

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      vm.handleKeydown(createMinimalKeyboardContext(event))

      expect(wrapper.emitted('cancel-editing')).toBeTruthy()
    })
  })

  describe('keyboard handling - Space key', () => {
    it('should open menu when closed', () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps(),
        global: {
          stubs: { Teleport: true },
        },
      })

      const vm = wrapper.vm as any
      vm.isOpen = false

      const mockTrigger = { click: vi.fn() }
      const mockContainer = { querySelector: vi.fn(() => mockTrigger) }
      vm.containerRef = mockContainer

      const event = new KeyboardEvent('keydown', { key: ' ' })
      const ctx = createMinimalKeyboardContext(event)

      const result = vm.handleKeydown(ctx)

      expect(result.preventDefault).toBe(true)
      expect(result.stopPropagation).toBe(true)
      expect(mockTrigger.click).toHaveBeenCalled()
    })

    it('should set valueJustChanged flag when menu is open', () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps(),
        global: {
          stubs: { Teleport: true },
        },
      })

      const vm = wrapper.vm as any
      vm.isOpen = true

      const event = new KeyboardEvent('keydown', { key: ' ' })
      vm.handleKeydown(createMinimalKeyboardContext(event))

      expect(vm.valueJustChanged).toBe(true)
    })
  })

  describe('keyboard handling - Arrow keys', () => {
    it('should open menu on ArrowDown when closed', () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps(),
        global: {
          stubs: { Teleport: true },
        },
      })

      const vm = wrapper.vm as any
      vm.isOpen = false

      const mockTrigger = { click: vi.fn() }
      const mockContainer = { querySelector: vi.fn(() => mockTrigger) }
      vm.containerRef = mockContainer

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      const ctx = createMinimalKeyboardContext(event)

      const result = vm.handleKeydown(ctx)

      expect(result.preventDefault).toBe(true)
      expect(result.stopPropagation).toBe(true)
      expect(mockTrigger.click).toHaveBeenCalled()
    })

    it('should open menu on ArrowUp when closed', () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps(),
        global: {
          stubs: { Teleport: true },
        },
      })

      const vm = wrapper.vm as any
      vm.isOpen = false

      const mockTrigger = { click: vi.fn() }
      const mockContainer = { querySelector: vi.fn(() => mockTrigger) }
      vm.containerRef = mockContainer

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' })
      vm.handleKeydown(createMinimalKeyboardContext(event))

      expect(mockTrigger.click).toHaveBeenCalled()
    })
  })

  describe('keyboard handling - Enter key', () => {
    it('should let USelectMenu handle Enter when menu is open', () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps(),
        global: {
          stubs: { Teleport: true },
        },
      })

      const vm = wrapper.vm as any
      vm.isOpen = true

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      const ctx = createMinimalKeyboardContext(event)

      const result = vm.handleKeydown(ctx)

      // Should NOT prevent default when menu is open (handled: false)
      expect(result.handled).toBe(false)
      expect(vm.lastKeyPressed).toBe('Enter')
    })

    it('should exit edit mode when menu is closed', () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps(),
        global: {
          stubs: { Teleport: true },
        },
      })

      const vm = wrapper.vm as any
      vm.isOpen = false

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      const ctx = createMinimalKeyboardContext(event)

      const result = vm.handleKeydown(ctx)

      expect(result.preventDefault).toBe(true)
      expect(wrapper.emitted('stop-editing')).toBeTruthy()
    })
  })

  describe('auto-open functionality', () => {
    it('should auto-open menu for static items when autoOpen is true', async () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps({
          cell: createMockCell({
            lookup: {
              items: [{ value: 'test', label: 'Test' }],
              autoOpen: true,
            },
          }),
        }),
        global: {
          stubs: { Teleport: true },
        },
      })

      await nextTick()
      await nextTick()

      const vm = wrapper.vm as any
      expect(vm.isOpen).toBe(true)
    })

    it('should not auto-open menu when autoOpen is false', async () => {
      const wrapper = mount(LookupEditor, {
        props: createDefaultProps({
          cell: createMockCell({
            lookup: {
              items: [{ value: 'test', label: 'Test' }],
              autoOpen: false,
            },
          }),
        }),
        global: {
          stubs: { Teleport: true },
        },
      })

      await nextTick()
      await nextTick()

      const vm = wrapper.vm as any
      expect(vm.isOpen).toBe(false)
    })
  })
})

describe('lookupRenderer', () => {
  const createMockCell = (overrides = {}) => ({
    column: {
      columnDef: {
        lookup: {
          items: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ],
          valueKey: 'value',
          labelKey: 'label',
        },
        ...overrides,
      },
    },
  })

  it('should render label for matching value', async () => {
    const wrapper = mount(LookupRenderer, {
      props: {
        value: 'active',
        cell: createMockCell(),
      },
    })

    await nextTick()
    expect(wrapper.text()).toBe('Active')
  })

  it('should render empty string for null value', async () => {
    const wrapper = mount(LookupRenderer, {
      props: {
        value: null,
        cell: createMockCell(),
      },
    })

    await nextTick()
    expect(wrapper.text()).toBe('')
  })

  it('should render empty string for undefined value', async () => {
    const wrapper = mount(LookupRenderer, {
      props: {
        value: undefined,
        cell: createMockCell(),
      },
    })

    await nextTick()
    expect(wrapper.text()).toBe('')
  })

  it('should render raw value for non-matching value', async () => {
    const wrapper = mount(LookupRenderer, {
      props: {
        value: 'unknown',
        cell: createMockCell(),
      },
    })

    await nextTick()
    expect(wrapper.text()).toBe('unknown')
  })

  it('should handle custom valueKey and labelKey', async () => {
    const wrapper = mount(LookupRenderer, {
      props: {
        value: 1,
        cell: createMockCell({
          lookup: {
            items: [
              { id: 1, name: 'First' },
              { id: 2, name: 'Second' },
            ],
            valueKey: 'id',
            labelKey: 'name',
          },
        }),
      },
    })

    await nextTick()
    expect(wrapper.text()).toBe('First')
  })

  it('should render raw value for empty items', async () => {
    const wrapper = mount(LookupRenderer, {
      props: {
        value: 'test',
        cell: createMockCell({ lookup: { items: [] } }),
      },
    })

    await nextTick()
    expect(wrapper.text()).toBe('test')
  })

  it('should handle reactive ref items', async () => {
    const items = ref([
      { value: 'test1', label: 'Test 1' },
      { value: 'test2', label: 'Test 2' },
    ])

    const wrapper = mount(LookupRenderer, {
      props: {
        value: 'test1',
        cell: createMockCell({ lookup: { items } }),
      },
    })

    await nextTick()

    expect(wrapper.text()).toBe('Test 1')

    // Update items
    items.value = [
      { value: 'test1', label: 'Updated Test 1' },
      { value: 'test2', label: 'Test 2' },
    ]

    await nextTick()

    expect(wrapper.text()).toBe('Updated Test 1')
  })

  it('should render raw value for async items', async () => {
    const wrapper = mount(LookupRenderer, {
      props: {
        value: 'test',
        cell: createMockCell({
          lookup: {
            items: async () => [{ value: 'test', label: 'Test' }],
          },
        }),
      },
    })

    await nextTick()
    // Async items cannot be resolved synchronously in renderer
    expect(wrapper.text()).toBe('test')
  })
})
