import type { TableColumn } from '@nuxt/ui'
import type { ColumnSizingInfoState, GroupingState, VisibilityState } from '@tanstack/vue-table'
import type { NuGridSelectionOptions } from '../src/runtime/types'
import type { NuGridRowSelectionMode, NuGridStates } from '../src/runtime/types/_internal'
import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useNuGridApi, useNuGridColumns } from '../src/runtime/composables/_internal/useNuGridCore'
import { useNuGridRowSelection } from '../src/runtime/composables/_internal/useNuGridRowSelection'

/**
 * Tests for row selection mode in NuGrid
 *
 * This test suite verifies:
 * 1. Selection column is added when rowSelectionMode is enabled
 * 2. Selection column is NOT added when rowSelectionMode is false/undefined
 * 3. Multi-selection mode allows multiple rows to be selected
 * 4. Single-selection mode restricts to one row at a time
 * 5. Selection column has correct properties
 */

interface TestData {
  id: number
  name: string
  status: string
}

/**
 * Extended column type for selection column properties
 */
type SelectionColumn<T> = TableColumn<T> & {
  enableResizing?: boolean
  enableSorting?: boolean
  enableEditing?: boolean
  enableFocusing?: boolean
}

const testData: TestData[] = [
  { id: 1, name: 'Item 1', status: 'active' },
  { id: 2, name: 'Item 2', status: 'inactive' },
  { id: 3, name: 'Item 3', status: 'active' },
]

const testColumns: TableColumn<TestData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status' },
]

const createStates = (): NuGridStates => ({
  globalFilterState: ref(''),
  columnFiltersState: ref([]),
  columnOrderState: ref([]),
  columnVisibilityState: ref({}),
  columnPinningState: ref({ left: [], right: [] }),
  columnSizingState: ref({}),
  columnSizingInfoState: ref({
    startOffset: null,
    startSize: null,
    deltaOffset: null,
    deltaPercentage: null,
    isResizingColumn: false,
    columnSizingStart: [],
  } as ColumnSizingInfoState),
  rowSelectionState: ref({}),
  rowPinningState: ref({ top: [], bottom: [] }),
  sortingState: ref([]),
  groupingState: ref<GroupingState>([]),
  expandedState: ref({}),
  paginationState: ref({ pageIndex: 0, pageSize: 10 }),
})

describe('row Selection Mode - Column Injection', () => {
  it('should NOT add selection column when rowSelectionMode is undefined', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>(undefined)

    const { columns } = useNuGridColumns(propsColumns, data, rowSelectionMode)

    expect(columns.value.length).toBe(3)
    expect(columns.value[0].id).not.toBe('__selection')
  })

  it('should NOT add selection column when rowSelectionMode is false', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>(false)

    const { columns } = useNuGridColumns(propsColumns, data, rowSelectionMode)

    expect(columns.value.length).toBe(3)
    expect(columns.value[0].id).not.toBe('__selection')
  })

  it('should add selection column when rowSelectionMode is "multi"', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>('multi')

    const { columns } = useNuGridColumns(propsColumns, data, rowSelectionMode)

    expect(columns.value.length).toBe(4)
    expect(columns.value[0].id).toBe('__selection')
  })

  it('should add selection column when rowSelectionMode is "single"', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>('single')

    const { columns } = useNuGridColumns(propsColumns, data, rowSelectionMode)

    expect(columns.value.length).toBe(4)
    expect(columns.value[0].id).toBe('__selection')
  })

  it('should add selection column when rowSelectionMode is true (same as multi)', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>(true)

    const { columns } = useNuGridColumns(propsColumns, data, rowSelectionMode)

    expect(columns.value.length).toBe(4)
    expect(columns.value[0].id).toBe('__selection')
  })

  it('should throw error when enabling rowSelectionMode after instantiation without it', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>(false)

    useNuGridColumns(propsColumns, data, rowSelectionMode)

    // Initially no selection column - this is fine
    // But trying to enable selection after instantiation should throw
    expect(() => {
      rowSelectionMode.value = 'multi'
    }).toThrow('Cannot enable row selection after grid instantiation')
  })

  it('should hide column (not remove) when rowSelectionMode changes from enabled to disabled', async () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<NuGridRowSelectionMode>({ mode: 'multi', hidden: false })
    const columnVisibility = ref<VisibilityState>({})

    const { columns } = useNuGridColumns(
      propsColumns as any,
      data,
      rowSelectionMode,
      undefined,
      columnVisibility,
    )

    // Initially selection column exists and is visible
    expect(columns.value.length).toBe(4)
    expect(columns.value[0].id).toBe('__selection')
    expect(columnVisibility.value.__selection).toBe(true)

    // Disable selection - column should still exist but be hidden
    rowSelectionMode.value = false
    await nextTick()
    expect(columns.value.length).toBe(4) // Column still exists
    expect(columns.value[0].id).toBe('__selection')
    expect(columnVisibility.value.__selection).toBe(false) // But is hidden
  })

  it('should allow re-enabling selection after it was disabled (column still exists)', async () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<NuGridRowSelectionMode>({ mode: 'multi', hidden: false })
    const columnVisibility = ref<VisibilityState>({})

    const { columns } = useNuGridColumns(
      propsColumns as any,
      data,
      rowSelectionMode,
      undefined,
      columnVisibility,
    )

    // Initially visible
    expect(columnVisibility.value.__selection).toBe(true)

    // Disable - hidden
    rowSelectionMode.value = false
    await nextTick()
    expect(columnVisibility.value.__selection).toBe(false)

    // Re-enable - visible again (this should NOT throw because column was created at instantiation)
    rowSelectionMode.value = { mode: 'single', hidden: false }
    await nextTick()
    expect(columnVisibility.value.__selection).toBe(true)
    expect(columns.value.length).toBe(4)
  })
})

describe('row Selection Mode - Column Properties', () => {
  it('should have correct size properties on selection column', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>('multi')

    const { columns } = useNuGridColumns(propsColumns, data, rowSelectionMode)

    const selectionColumn = columns.value[0]
    expect(selectionColumn.size).toBe(48)
    expect(selectionColumn.minSize).toBe(48)
    expect(selectionColumn.maxSize).toBe(48)
  })

  it('should disable resizing on selection column', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>('multi')

    const { columns } = useNuGridColumns(propsColumns, data, rowSelectionMode)

    const selectionColumn = columns.value[0] as SelectionColumn<TestData>
    expect(selectionColumn.enableResizing).toBe(false)
  })

  it('should disable sorting on selection column', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>('multi')

    const { columns } = useNuGridColumns(propsColumns, data, rowSelectionMode)

    const selectionColumn = columns.value[0] as SelectionColumn<TestData>
    expect(selectionColumn.enableSorting).toBe(false)
  })

  it('should enable editing on selection column', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>('multi')

    const { columns } = useNuGridColumns(propsColumns, data, rowSelectionMode)

    const selectionColumn = columns.value[0] as SelectionColumn<TestData>
    expect(selectionColumn.enableEditing).toBe(true)
  })

  it('should enable focusing on selection column', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>('multi')

    const { columns } = useNuGridColumns(propsColumns, data, rowSelectionMode)

    const selectionColumn = columns.value[0] as SelectionColumn<TestData>
    expect(selectionColumn.enableFocusing).toBe(true)
  })

  it('should have cellDataType selection defined', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>('multi')

    const { columns } = useNuGridColumns(propsColumns, data, rowSelectionMode)

    const selectionColumn = columns.value[0] as SelectionColumn<TestData> & {
      cellDataType?: string
    }
    expect(selectionColumn.cellDataType).toBe('selection')
  })

  it('should have header renderer defined for multi mode', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>('multi')

    const { columns } = useNuGridColumns(propsColumns, data, rowSelectionMode)

    const selectionColumn = columns.value[0]
    expect(selectionColumn.header).toBeDefined()
    expect(typeof selectionColumn.header).toBe('function')
  })

  it('should have header function for single mode (renders empty in single mode)', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>('single')

    const { columns } = useNuGridColumns(propsColumns, data, rowSelectionMode)

    const selectionColumn = columns.value[0]
    // Header is now always a function that checks mode internally
    expect(typeof selectionColumn.header).toBe('function')
  })
})

describe('row Selection Mode - Single Selection Behavior', () => {
  it('should configure enableMultiRowSelection as false for single mode', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>('single')
    const { columns } = useNuGridColumns(propsColumns, data, rowSelectionMode)
    const states = createStates()

    const props = {
      data: testData,
      columns: testColumns,
    }

    const tableApi = useNuGridApi(props, data, columns, states, rowSelectionMode)

    // In single mode, enableMultiRowSelection should be false
    expect(tableApi.options.enableMultiRowSelection).toBe(false)
  })

  it('should configure enableMultiRowSelection as true for multi mode', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>('multi')
    const { columns } = useNuGridColumns(propsColumns, data, rowSelectionMode)
    const states = createStates()

    const props = {
      data: testData,
      columns: testColumns,
    }

    const tableApi = useNuGridApi(props, data, columns, states, rowSelectionMode)

    // In multi mode, enableMultiRowSelection should be true
    expect(tableApi.options.enableMultiRowSelection).toBe(true)
  })

  it('should configure enableMultiRowSelection as true when mode is undefined', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>(undefined)
    const { columns } = useNuGridColumns(propsColumns, data, rowSelectionMode)
    const states = createStates()

    const props = {
      data: testData,
      columns: testColumns,
    }

    const tableApi = useNuGridApi(props, data, columns, states, rowSelectionMode)

    // When undefined, should default to multi-selection enabled
    expect(tableApi.options.enableMultiRowSelection).toBe(true)
  })
})

describe('row Selection Mode - Selection State', () => {
  it('should allow selecting rows in multi mode', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>('multi')
    const { columns } = useNuGridColumns(propsColumns, data, rowSelectionMode)
    const states = createStates()

    const props = {
      data: testData,
      columns: testColumns,
    }

    const tableApi = useNuGridApi(props, data, columns, states, rowSelectionMode)

    // Select multiple rows (use '1' and '2' since row IDs come from data.id field)
    tableApi.setRowSelection({ '1': true, '2': true })

    expect(states.rowSelectionState.value).toEqual({ '1': true, '2': true })
    expect(tableApi.getSelectedRowModel().rows.length).toBe(2)
  })

  it('should clear selection when changing selection state', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>('multi')
    const { columns } = useNuGridColumns(propsColumns, data, rowSelectionMode)
    const states = createStates()

    const props = {
      data: testData,
      columns: testColumns,
    }

    const tableApi = useNuGridApi(props, data, columns, states, rowSelectionMode)

    // Select rows (use '1' and '2' since row IDs come from data.id field)
    tableApi.setRowSelection({ '1': true, '2': true })
    expect(tableApi.getSelectedRowModel().rows.length).toBe(2)

    // Clear selection
    tableApi.setRowSelection({})
    expect(tableApi.getSelectedRowModel().rows.length).toBe(0)
  })

  it('should provide correct selected row data', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(testColumns)
    const rowSelectionMode = ref<boolean | 'single' | 'multi' | undefined>('multi')
    const { columns } = useNuGridColumns(propsColumns, data, rowSelectionMode)
    const states = createStates()

    const props = {
      data: testData,
      columns: testColumns,
    }

    const tableApi = useNuGridApi(props, data, columns, states, rowSelectionMode)

    // Select first row (use '1' since row IDs come from data.id field)
    tableApi.setRowSelection({ '1': true })

    const selectedRows = tableApi.getSelectedRowModel().rows
    expect(selectedRows.length).toBe(1)
    expect(selectedRows[0].original).toEqual(testData[0])
  })
})

describe('useNuGridRowSelection composable', () => {
  it('should return isEnabled as false when mode is false', () => {
    const mode = ref<boolean | 'single' | 'multi' | undefined>(false)
    const { isEnabled } = useNuGridRowSelection<TestData>(mode as any)
    expect(isEnabled.value).toBe(false)
  })

  it('should return isEnabled as false when mode is undefined', () => {
    const mode = ref<boolean | 'single' | 'multi' | undefined>(undefined)
    const { isEnabled } = useNuGridRowSelection<TestData>(mode as any)
    expect(isEnabled.value).toBe(false)
  })

  it('should return isEnabled as true when mode is "multi"', () => {
    const mode = ref<boolean | 'single' | 'multi' | undefined>('multi')
    const { isEnabled } = useNuGridRowSelection<TestData>(mode as any)
    expect(isEnabled.value).toBe(true)
  })

  it('should return isEnabled as true when mode is "single"', () => {
    const mode = ref<boolean | 'single' | 'multi' | undefined>('single')
    const { isEnabled } = useNuGridRowSelection<TestData>(mode as any)
    expect(isEnabled.value).toBe(true)
  })

  it('should return isEnabled as true when mode is true', () => {
    const mode = ref<boolean | 'single' | 'multi' | undefined>(true)
    const { isEnabled } = useNuGridRowSelection<TestData>(mode as any)
    expect(isEnabled.value).toBe(true)
  })

  it('should return normalizedMode as "multi" when mode is true', () => {
    const mode = ref<boolean | 'single' | 'multi' | undefined>(true)
    const { normalizedMode } = useNuGridRowSelection<TestData>(mode as any)
    expect(normalizedMode.value).toBe('multi')
  })

  it('should return normalizedMode as "single" when mode is "single"', () => {
    const mode = ref<boolean | 'single' | 'multi' | undefined>('single')
    const { normalizedMode } = useNuGridRowSelection<TestData>(mode as any)
    expect(normalizedMode.value).toBe('single')
  })

  it('should return enableMultiRowSelection as false for single mode', () => {
    const mode = ref<boolean | 'single' | 'multi' | undefined>('single')
    const { enableMultiRowSelection } = useNuGridRowSelection<TestData>(mode as any)
    expect(enableMultiRowSelection.value).toBe(false)
  })

  it('should return enableMultiRowSelection as true for multi mode', () => {
    const mode = ref<boolean | 'single' | 'multi' | undefined>('multi')
    const { enableMultiRowSelection } = useNuGridRowSelection<TestData>(mode as any)
    expect(enableMultiRowSelection.value).toBe(true)
  })

  it('should return selectionColumn as null when mode is false', () => {
    const mode = ref<boolean | 'single' | 'multi' | undefined>(false)
    const { selectionColumn } = useNuGridRowSelection<TestData>(mode as any)
    expect(selectionColumn).toBeNull()
  })

  it('should return selectionColumn with id "__selection" when mode is enabled', () => {
    const mode = ref<boolean | 'single' | 'multi' | undefined>('multi')
    const { selectionColumn } = useNuGridRowSelection<TestData>(mode as any)
    expect(selectionColumn?.id).toBe('__selection')
  })

  it('should prepend selection column when mode is enabled', () => {
    const mode = ref<boolean | 'single' | 'multi' | undefined>('multi')
    const { prependSelectionColumn } = useNuGridRowSelection<TestData>(mode as any)
    const result = prependSelectionColumn(testColumns)
    expect(result.length).toBe(4) // 1 selection + 3 original
    expect(result[0].id).toBe('__selection')
  })

  it('should not prepend selection column when mode is disabled', () => {
    const mode = ref<boolean | 'single' | 'multi' | undefined>(false)
    const { prependSelectionColumn } = useNuGridRowSelection<TestData>(mode as any)
    const result = prependSelectionColumn(testColumns)
    expect(result.length).toBe(3) // just original columns
  })
})

describe('enhanced NuGridSelectionOptions', () => {
  describe('options object parsing', () => {
    it('should accept options object with mode property', () => {
      const options: NuGridSelectionOptions = { mode: 'multi' }
      const mode = ref<NuGridRowSelectionMode>(options)
      const { normalizedMode, isEnabled } = useNuGridRowSelection<TestData>(mode as any)
      expect(isEnabled.value).toBe(true)
      expect(normalizedMode.value).toBe('multi')
    })

    it('should accept options object with single mode', () => {
      const options: NuGridSelectionOptions = { mode: 'single' }
      const mode = ref<NuGridRowSelectionMode>(options)
      const { normalizedMode, enableMultiRowSelection } = useNuGridRowSelection<TestData>(
        mode as any,
      )
      expect(normalizedMode.value).toBe('single')
      expect(enableMultiRowSelection.value).toBe(false)
    })

    it('should default mode to multi when not specified in options', () => {
      const options: NuGridSelectionOptions = {}
      const mode = ref<NuGridRowSelectionMode>(options)
      const { normalizedMode } = useNuGridRowSelection<TestData>(mode as any)
      expect(normalizedMode.value).toBe('multi')
    })
  })

  describe('hidden property', () => {
    it('should default hidden to false', () => {
      const options: NuGridSelectionOptions = { mode: 'multi' }
      const mode = ref<NuGridRowSelectionMode>(options)
      const { isHidden } = useNuGridRowSelection<TestData>(mode as any)
      expect(isHidden.value).toBe(false)
    })

    it('should respect hidden: true option', () => {
      const options: NuGridSelectionOptions = { mode: 'multi', hidden: true }
      const mode = ref<NuGridRowSelectionMode>(options)
      const { isHidden } = useNuGridRowSelection<TestData>(mode as any)
      expect(isHidden.value).toBe(true)
    })

    it('should respect hidden: false option', () => {
      const options: NuGridSelectionOptions = { mode: 'multi', hidden: false }
      const mode = ref<NuGridRowSelectionMode>(options)
      const { isHidden } = useNuGridRowSelection<TestData>(mode as any)
      expect(isHidden.value).toBe(false)
    })

    it('should update column visibility when hidden changes', async () => {
      const options: NuGridSelectionOptions = { mode: 'multi', hidden: false }
      const mode = ref<NuGridRowSelectionMode>(options)
      const columnVisibility = ref<VisibilityState>({})
      useNuGridRowSelection<TestData>(mode as any, columnVisibility)

      // Initially visible
      expect(columnVisibility.value.__selection).toBe(true)

      // Change to hidden
      mode.value = { mode: 'multi', hidden: true }
      await nextTick()
      expect(columnVisibility.value.__selection).toBe(false)

      // Change back to visible
      mode.value = { mode: 'multi', hidden: false }
      await nextTick()
      expect(columnVisibility.value.__selection).toBe(true)
    })
  })

  describe('enabled property', () => {
    it('should default enabled to true', () => {
      const options: NuGridSelectionOptions = { mode: 'multi' }
      const mode = ref<NuGridRowSelectionMode>(options)
      const { isInteractive } = useNuGridRowSelection<TestData>(mode as any)
      expect(isInteractive.value).toBe(true)
    })

    it('should respect enabled: false option', () => {
      const options: NuGridSelectionOptions = { mode: 'multi', enabled: false }
      const mode = ref<NuGridRowSelectionMode>(options)
      const { isInteractive } = useNuGridRowSelection<TestData>(mode as any)
      expect(isInteractive.value).toBe(false)
    })

    it('should respect enabled: true option', () => {
      const options: NuGridSelectionOptions = { mode: 'multi', enabled: true }
      const mode = ref<NuGridRowSelectionMode>(options)
      const { isInteractive } = useNuGridRowSelection<TestData>(mode as any)
      expect(isInteractive.value).toBe(true)
    })

    it('should store enabledRef in column meta', () => {
      const options: NuGridSelectionOptions = { mode: 'multi', enabled: false }
      const mode = ref<NuGridRowSelectionMode>(options)
      const { selectionColumn, isInteractive } = useNuGridRowSelection<TestData>(mode as any)
      // The meta stores the enabledRef which can be used reactively
      expect((selectionColumn?.meta as any)?.enabledRef).toBeDefined()
      expect(isInteractive.value).toBe(false)
    })

    it('should update isInteractive when enabled changes', () => {
      const mode = ref<NuGridRowSelectionMode>({ mode: 'multi', enabled: true })
      const { isInteractive } = useNuGridRowSelection<TestData>(mode as any)
      expect(isInteractive.value).toBe(true)

      mode.value = { mode: 'multi', enabled: false }
      expect(isInteractive.value).toBe(false)
    })
  })

  describe('reactivity', () => {
    it('should react to mode changes in options', () => {
      const mode = ref<NuGridRowSelectionMode>({ mode: 'multi' })
      const { normalizedMode, enableMultiRowSelection } = useNuGridRowSelection<TestData>(
        mode as any,
      )

      expect(normalizedMode.value).toBe('multi')
      expect(enableMultiRowSelection.value).toBe(true)

      mode.value = { mode: 'single' }
      expect(normalizedMode.value).toBe('single')
      expect(enableMultiRowSelection.value).toBe(false)
    })

    it('should react to hidden changes in options', () => {
      const mode = ref<NuGridRowSelectionMode>({ mode: 'multi', hidden: false })
      const { isHidden } = useNuGridRowSelection<TestData>(mode as any)

      expect(isHidden.value).toBe(false)

      mode.value = { mode: 'multi', hidden: true }
      expect(isHidden.value).toBe(true)
    })

    it('should react to enabled changes in options', () => {
      const mode = ref<NuGridRowSelectionMode>({ mode: 'multi', enabled: true })
      const { isInteractive } = useNuGridRowSelection<TestData>(mode as any)

      expect(isInteractive.value).toBe(true)

      mode.value = { mode: 'multi', enabled: false }
      expect(isInteractive.value).toBe(false)
    })
  })

  describe('backward compatibility', () => {
    it('should still accept boolean true', () => {
      const mode = ref<NuGridRowSelectionMode>(true)
      const { isEnabled, normalizedMode, isHidden, isInteractive } =
        useNuGridRowSelection<TestData>(mode as any)
      expect(isEnabled.value).toBe(true)
      expect(normalizedMode.value).toBe('multi')
      expect(isHidden.value).toBe(false)
      expect(isInteractive.value).toBe(true)
    })

    it('should still accept boolean false', () => {
      const mode = ref<NuGridRowSelectionMode>(false)
      const { isEnabled } = useNuGridRowSelection<TestData>(mode as any)
      expect(isEnabled.value).toBe(false)
    })

    it('should still accept string "single"', () => {
      const mode = ref<NuGridRowSelectionMode>('single')
      const { isEnabled, normalizedMode, isHidden, isInteractive } =
        useNuGridRowSelection<TestData>(mode as any)
      expect(isEnabled.value).toBe(true)
      expect(normalizedMode.value).toBe('single')
      expect(isHidden.value).toBe(false)
      expect(isInteractive.value).toBe(true)
    })

    it('should still accept string "multi"', () => {
      const mode = ref<NuGridRowSelectionMode>('multi')
      const { isEnabled, normalizedMode, isHidden, isInteractive } =
        useNuGridRowSelection<TestData>(mode as any)
      expect(isEnabled.value).toBe(true)
      expect(normalizedMode.value).toBe('multi')
      expect(isHidden.value).toBe(false)
      expect(isInteractive.value).toBe(true)
    })

    it('should still accept undefined', () => {
      const mode = ref<NuGridRowSelectionMode>(undefined)
      const { isEnabled } = useNuGridRowSelection<TestData>(mode as any)
      expect(isEnabled.value).toBe(false)
    })
  })
})
