import type { NuGridStateSnapshot } from '../src/runtime/composables/_internal/useNuGridStatePersistence'
import type { NuGridStates } from '../src/runtime/types/_internal'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useNuGridStatePersistence } from '../src/runtime/composables/_internal/useNuGridStatePersistence'

// Mock #imports (Nuxt auto-imports)
vi.mock('#imports', () => ({
  useCookie: vi.fn((key: string, options?: any) => {
    const value = ref(options?.default?.() ?? null)
    return value
  }),
}))

// Mock @vueuse/core
const mockStorageValue = ref<NuGridStateSnapshot | null>(null)
vi.mock('@vueuse/core', () => ({
  useStorage: vi.fn(() => mockStorageValue),
  StorageSerializers: {
    object: {},
  },
}))

/**
 * Helper to create mock NuGridStates
 * By default creates empty states that won't be included in getState()
 */
function createMockStates(): NuGridStates {
  return {
    globalFilterState: ref(''),
    columnFiltersState: ref([]),
    columnOrderState: ref([]),
    columnVisibilityState: ref({}),
    columnPinningState: ref({}),
    columnSizingState: ref({}),
    columnSizingInfoState: ref({}),
    rowSelectionState: ref({}),
    rowPinningState: ref({ top: [], bottom: [] }),
    sortingState: ref([]),
    groupingState: ref([]),
    expandedState: ref({}),
    paginationState: ref({}), // Empty by default so it won't be included in getState()
  } as unknown as NuGridStates
}

describe('useNuGridStatePersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStorageValue.value = null
  })

  describe('disabled state', () => {
    it('should return noop functions when disabled', () => {
      const states = createMockStates()
      const result = useNuGridStatePersistence(states, false, 'test-id')

      expect(result.getState()).toEqual({})
      result.setState({ globalFilter: 'test' })
      expect(states.globalFilterState.value).toBe('') // Should not change
    })

    it('should return noop functions when storageId is undefined', () => {
      const states = createMockStates()
      const result = useNuGridStatePersistence(states, true, undefined)

      expect(result.getState()).toEqual({})
    })
  })

  describe('getState', () => {
    it('should return empty object when no state values are set', () => {
      const states = createMockStates()
      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect(result.getState()).toEqual({})
    })

    it('should include globalFilter when set', () => {
      const states = createMockStates()
      states.globalFilterState.value = 'search term'
      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect(result.getState()).toEqual({ globalFilter: 'search term' })
    })

    it('should include columnFilters when non-empty array', () => {
      const states = createMockStates()
      states.columnFiltersState.value = [{ id: 'name', value: 'John' }]
      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect((result.getState() as NuGridStateSnapshot).columnFilters).toEqual([
        { id: 'name', value: 'John' },
      ])
    })

    it('should not include columnFilters when empty array', () => {
      const states = createMockStates()
      states.columnFiltersState.value = []
      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect((result.getState() as NuGridStateSnapshot).columnFilters).toBeUndefined()
    })

    it('should include columnOrder when non-empty array', () => {
      const states = createMockStates()
      states.columnOrderState.value = ['col1', 'col2', 'col3']
      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect((result.getState() as NuGridStateSnapshot).columnOrder).toEqual([
        'col1',
        'col2',
        'col3',
      ])
    })

    it('should include columnVisibility when has keys', () => {
      const states = createMockStates()
      states.columnVisibilityState.value = { email: false, name: true }
      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect((result.getState() as NuGridStateSnapshot).columnVisibility).toEqual({
        email: false,
        name: true,
      })
    })

    it('should not include columnVisibility when empty object', () => {
      const states = createMockStates()
      states.columnVisibilityState.value = {}
      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect((result.getState() as NuGridStateSnapshot).columnVisibility).toBeUndefined()
    })

    it('should include columnPinning when has keys', () => {
      const states = createMockStates()
      states.columnPinningState.value = { left: ['id'], right: ['actions'] }
      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect((result.getState() as NuGridStateSnapshot).columnPinning).toEqual({
        left: ['id'],
        right: ['actions'],
      })
    })

    it('should include columnSizing when has keys', () => {
      const states = createMockStates()
      states.columnSizingState.value = { name: 200, email: 150 }
      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect((result.getState() as NuGridStateSnapshot).columnSizing).toEqual({
        name: 200,
        email: 150,
      })
    })

    it('should include rowSelection when has keys', () => {
      const states = createMockStates()
      states.rowSelectionState.value = { row1: true, row2: true }
      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect((result.getState() as NuGridStateSnapshot).rowSelection).toEqual({
        row1: true,
        row2: true,
      })
    })

    it('should include rowPinning when has pinned rows', () => {
      const states = createMockStates()
      states.rowPinningState.value = { top: ['row1'], bottom: [] }
      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect((result.getState() as NuGridStateSnapshot).rowPinning).toEqual({
        top: ['row1'],
        bottom: [],
      })
    })

    it('should not include rowPinning when no pinned rows', () => {
      const states = createMockStates()
      states.rowPinningState.value = { top: [], bottom: [] }
      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect((result.getState() as NuGridStateSnapshot).rowPinning).toBeUndefined()
    })

    it('should include sorting when non-empty array', () => {
      const states = createMockStates()
      states.sortingState.value = [{ id: 'name', desc: true }]
      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect((result.getState() as NuGridStateSnapshot).sorting).toEqual([
        { id: 'name', desc: true },
      ])
    })

    it('should include grouping when non-empty array', () => {
      const states = createMockStates()
      states.groupingState.value = ['category']
      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect((result.getState() as NuGridStateSnapshot).grouping).toEqual(['category'])
    })

    it('should include expanded when true', () => {
      const states = createMockStates()
      states.expandedState.value = true
      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect((result.getState() as NuGridStateSnapshot).expanded).toBe(true)
    })

    it('should include expanded when has keys', () => {
      const states = createMockStates()
      states.expandedState.value = { 'group-1': true }
      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect((result.getState() as NuGridStateSnapshot).expanded).toEqual({ 'group-1': true })
    })

    it('should not include expanded when empty object', () => {
      const states = createMockStates()
      states.expandedState.value = {}
      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect((result.getState() as NuGridStateSnapshot).expanded).toBeUndefined()
    })

    it('should include pagination when has keys', () => {
      const states = createMockStates()
      states.paginationState.value = { pageIndex: 2, pageSize: 25 }
      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect((result.getState() as NuGridStateSnapshot).pagination).toEqual({
        pageIndex: 2,
        pageSize: 25,
      })
    })

    it('should return multiple state values', () => {
      const states = createMockStates()
      states.globalFilterState.value = 'test'
      states.sortingState.value = [{ id: 'name', desc: false }]
      states.columnVisibilityState.value = { hidden: false }

      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect(result.getState()).toEqual({
        globalFilter: 'test',
        sorting: [{ id: 'name', desc: false }],
        columnVisibility: { hidden: false },
      })
    })
  })

  describe('setState', () => {
    it('should apply globalFilter from snapshot', async () => {
      const states = createMockStates()
      const result = useNuGridStatePersistence(states, true, 'test-id')

      result.setState({ globalFilter: 'search term' })
      await nextTick()

      expect(states.globalFilterState.value).toBe('search term')
    })

    it('should apply columnFilters from snapshot', async () => {
      const states = createMockStates()
      const result = useNuGridStatePersistence(states, true, 'test-id')

      result.setState({ columnFilters: [{ id: 'name', value: 'John' }] })
      await nextTick()

      expect(states.columnFiltersState.value).toEqual([{ id: 'name', value: 'John' }])
    })

    it('should apply columnOrder from snapshot', async () => {
      const states = createMockStates()
      const result = useNuGridStatePersistence(states, true, 'test-id')

      result.setState({ columnOrder: ['col1', 'col2'] })
      await nextTick()

      expect(states.columnOrderState.value).toEqual(['col1', 'col2'])
    })

    it('should apply columnVisibility from snapshot', async () => {
      const states = createMockStates()
      const result = useNuGridStatePersistence(states, true, 'test-id')

      result.setState({ columnVisibility: { email: false } })
      await nextTick()

      expect(states.columnVisibilityState.value).toEqual({ email: false })
    })

    it('should apply columnPinning from snapshot', async () => {
      const states = createMockStates()
      const result = useNuGridStatePersistence(states, true, 'test-id')

      result.setState({ columnPinning: { left: ['id'] } })
      await nextTick()

      expect(states.columnPinningState.value).toEqual({ left: ['id'] })
    })

    it('should apply columnSizing from snapshot', async () => {
      const states = createMockStates()
      const result = useNuGridStatePersistence(states, true, 'test-id')

      result.setState({ columnSizing: { name: 200 } })
      await nextTick()

      expect(states.columnSizingState.value).toEqual({ name: 200 })
    })

    it('should apply rowSelection from snapshot', async () => {
      const states = createMockStates()
      const result = useNuGridStatePersistence(states, true, 'test-id')

      result.setState({ rowSelection: { row1: true } })
      await nextTick()

      expect(states.rowSelectionState.value).toEqual({ row1: true })
    })

    it('should apply rowPinning from snapshot', async () => {
      const states = createMockStates()
      const result = useNuGridStatePersistence(states, true, 'test-id')

      result.setState({ rowPinning: { top: ['row1'], bottom: [] } })
      await nextTick()

      expect(states.rowPinningState.value).toEqual({ top: ['row1'], bottom: [] })
    })

    it('should apply sorting from snapshot', async () => {
      const states = createMockStates()
      const result = useNuGridStatePersistence(states, true, 'test-id')

      result.setState({ sorting: [{ id: 'name', desc: true }] })
      await nextTick()

      expect(states.sortingState.value).toEqual([{ id: 'name', desc: true }])
    })

    it('should apply grouping from snapshot', async () => {
      const states = createMockStates()
      const result = useNuGridStatePersistence(states, true, 'test-id')

      result.setState({ grouping: ['category'] })
      await nextTick()

      expect(states.groupingState.value).toEqual(['category'])
    })

    it('should apply expanded from snapshot', async () => {
      const states = createMockStates()
      const result = useNuGridStatePersistence(states, true, 'test-id')

      result.setState({ expanded: { 'group-1': true } })
      await nextTick()

      expect(states.expandedState.value).toEqual({ 'group-1': true })
    })

    it('should apply pagination from snapshot', async () => {
      const states = createMockStates()
      const result = useNuGridStatePersistence(states, true, 'test-id')

      result.setState({ pagination: { pageIndex: 5, pageSize: 50 } })
      await nextTick()

      expect(states.paginationState.value).toEqual({ pageIndex: 5, pageSize: 50 })
    })

    it('should apply multiple state values', async () => {
      const states = createMockStates()
      const result = useNuGridStatePersistence(states, true, 'test-id')

      result.setState({
        globalFilter: 'test',
        sorting: [{ id: 'name', desc: false }],
        columnVisibility: { hidden: false },
      })
      await nextTick()

      expect(states.globalFilterState.value).toBe('test')
      expect(states.sortingState.value).toEqual([{ id: 'name', desc: false }])
      expect(states.columnVisibilityState.value).toEqual({ hidden: false })
    })

    it('should not overwrite unspecified state values', async () => {
      const states = createMockStates()
      states.globalFilterState.value = 'existing'
      states.sortingState.value = [{ id: 'name', desc: true }]

      const result = useNuGridStatePersistence(states, true, 'test-id')

      // Only set columnVisibility, leave others unchanged
      result.setState({ columnVisibility: { email: false } })
      await nextTick()

      expect(states.globalFilterState.value).toBe('existing')
      expect(states.sortingState.value).toEqual([{ id: 'name', desc: true }])
      expect(states.columnVisibilityState.value).toEqual({ email: false })
    })

    it('should call onStateChanged callback', async () => {
      const states = createMockStates()
      const onStateChanged = vi.fn()
      const result = useNuGridStatePersistence(states, true, 'test-id', onStateChanged)

      result.setState({ globalFilter: 'test' })
      await nextTick()

      expect(onStateChanged).toHaveBeenCalledWith(expect.objectContaining({ globalFilter: 'test' }))
    })
  })

  describe('storage key generation', () => {
    it('should use storageId to generate key', () => {
      const states = createMockStates()
      // When enabled with a storageId, it should not throw and should return functions
      const result = useNuGridStatePersistence(states, true, 'my-grid')

      expect(typeof result.getState).toBe('function')
      expect(typeof result.setState).toBe('function')
      // The composable should be functional
      expect(result.getState()).toBeDefined()
    })

    it('should return noop when disabled', () => {
      const states = createMockStates()
      states.globalFilterState.value = 'test'

      const result = useNuGridStatePersistence(states, false, 'my-grid')

      // Should return empty even though state has values (because disabled)
      expect(result.getState()).toEqual({})
    })
  })

  describe('helper functions', () => {
    describe('hasArray', () => {
      it('should return true for non-empty array', () => {
        const states = createMockStates()
        states.columnFiltersState.value = [{ id: 'test', value: 'val' }]
        const result = useNuGridStatePersistence(states, true, 'test-id')

        expect((result.getState() as NuGridStateSnapshot).columnFilters).toBeDefined()
      })

      it('should return false for empty array', () => {
        const states = createMockStates()
        states.columnFiltersState.value = []
        const result = useNuGridStatePersistence(states, true, 'test-id')

        expect((result.getState() as NuGridStateSnapshot).columnFilters).toBeUndefined()
      })
    })

    describe('hasKeys', () => {
      it('should return true for object with keys', () => {
        const states = createMockStates()
        states.columnSizingState.value = { col1: 100 }
        const result = useNuGridStatePersistence(states, true, 'test-id')

        expect((result.getState() as NuGridStateSnapshot).columnSizing).toBeDefined()
      })

      it('should return false for empty object', () => {
        const states = createMockStates()
        states.columnSizingState.value = {}
        const result = useNuGridStatePersistence(states, true, 'test-id')

        expect((result.getState() as NuGridStateSnapshot).columnSizing).toBeUndefined()
      })
    })

    describe('hasRowPinning', () => {
      it('should return true when top has items', () => {
        const states = createMockStates()
        states.rowPinningState.value = { top: ['row1'], bottom: [] }
        const result = useNuGridStatePersistence(states, true, 'test-id')

        expect((result.getState() as NuGridStateSnapshot).rowPinning).toBeDefined()
      })

      it('should return true when bottom has items', () => {
        const states = createMockStates()
        states.rowPinningState.value = { top: [], bottom: ['row1'] }
        const result = useNuGridStatePersistence(states, true, 'test-id')

        expect((result.getState() as NuGridStateSnapshot).rowPinning).toBeDefined()
      })

      it('should return false when both are empty', () => {
        const states = createMockStates()
        states.rowPinningState.value = { top: [], bottom: [] }
        const result = useNuGridStatePersistence(states, true, 'test-id')

        expect((result.getState() as NuGridStateSnapshot).rowPinning).toBeUndefined()
      })
    })

    describe('hasExpanded', () => {
      it('should return true for true value', () => {
        const states = createMockStates()
        states.expandedState.value = true
        const result = useNuGridStatePersistence(states, true, 'test-id')

        expect((result.getState() as NuGridStateSnapshot).expanded).toBe(true)
      })

      it('should return true for object with keys', () => {
        const states = createMockStates()
        states.expandedState.value = { 'group-1': true }
        const result = useNuGridStatePersistence(states, true, 'test-id')

        expect((result.getState() as NuGridStateSnapshot).expanded).toEqual({ 'group-1': true })
      })

      it('should return false for empty object', () => {
        const states = createMockStates()
        states.expandedState.value = {}
        const result = useNuGridStatePersistence(states, true, 'test-id')

        expect((result.getState() as NuGridStateSnapshot).expanded).toBeUndefined()
      })

      it('should return false for null', () => {
        const states = createMockStates()
        states.expandedState.value = null as any
        const result = useNuGridStatePersistence(states, true, 'test-id')

        expect((result.getState() as NuGridStateSnapshot).expanded).toBeUndefined()
      })

      it('should return false for undefined', () => {
        const states = createMockStates()
        states.expandedState.value = undefined as any
        const result = useNuGridStatePersistence(states, true, 'test-id')

        expect((result.getState() as NuGridStateSnapshot).expanded).toBeUndefined()
      })
    })
  })

  describe('return value structure', () => {
    it('should return getState and setState functions', () => {
      const states = createMockStates()
      const result = useNuGridStatePersistence(states, true, 'test-id')

      expect(typeof result.getState).toBe('function')
      expect(typeof result.setState).toBe('function')
    })

    it('should return noop getState and setState when disabled', () => {
      const states = createMockStates()
      const result = useNuGridStatePersistence(states, false, 'test-id')

      expect(typeof result.getState).toBe('function')
      expect(typeof result.setState).toBe('function')
      expect(result.getState()).toEqual({})
    })
  })
})
