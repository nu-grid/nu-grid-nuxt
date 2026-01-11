import type { TableColumn } from '@nuxt/ui'
import type { ColumnSizingInfoState, GroupingState } from '@tanstack/vue-table'
import type { NuGridStates } from '../src/runtime/types/_internal'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import {
  resolveStyleObject,
  resolveValue,
  useNuGridApi,
  useNuGridColumns,
  useNuGridDataWatch,
  useNuGridFooter,
  valueUpdater,
} from '../src/runtime/composables/_internal/useNuGridCore'

/**
 * Tests for the core utility functions in useNuGridCore composable
 *
 * This test suite verifies:
 * 1. valueUpdater works with both direct values and updater functions
 * 2. resolveValue handles both static values and functions
 * 3. resolveStyleObject properly resolves style objects
 * 4. useNuGridFooter correctly detects columns with footers
 * 5. useNuGridColumns properly processes columns
 * 6. useNuGridDataWatch handles data synchronization
 */

interface TestData {
  id: number
  name: string
  status: string
  value: number
}

describe('valueUpdater', () => {
  it('should update ref with direct value', () => {
    const testRef = ref(10)
    valueUpdater(20, testRef)
    expect(testRef.value).toBe(20)
  })

  it('should update ref with updater function', () => {
    const testRef = ref(10)
    valueUpdater((prev: number) => prev + 5, testRef)
    expect(testRef.value).toBe(15)
  })

  it('should handle string values', () => {
    const testRef = ref('hello')
    valueUpdater('world', testRef)
    expect(testRef.value).toBe('world')
  })

  it('should handle object values', () => {
    const testRef = ref({ a: 1 })
    valueUpdater({ b: 2 }, testRef)
    expect(testRef.value).toEqual({ b: 2 })
  })

  it('should handle array values', () => {
    const testRef = ref([1, 2, 3])
    valueUpdater([4, 5, 6], testRef)
    expect(testRef.value).toEqual([4, 5, 6])
  })

  it('should handle updater function returning modified object', () => {
    const testRef = ref({ count: 1 })
    valueUpdater((prev: { count: number }) => ({ count: prev.count + 1 }), testRef)
    expect(testRef.value).toEqual({ count: 2 })
  })
})

describe('resolveValue', () => {
  it('should return direct value when not a function', () => {
    const result = resolveValue(42)
    expect(result).toBe(42)
  })

  it('should return string value directly', () => {
    const result = resolveValue('test string')
    expect(result).toBe('test string')
  })

  it('should return object value directly', () => {
    const obj = { key: 'value' }
    const result = resolveValue(obj)
    expect(result).toEqual(obj)
  })

  it('should call function and return result', () => {
    const fn = () => 'function result'
    const result = resolveValue(fn)
    expect(result).toBe('function result')
  })

  it('should pass argument to function', () => {
    const fn = (arg: number) => arg * 2
    const result = resolveValue(fn, 5)
    expect(result).toBe(10)
  })

  it('should handle undefined value', () => {
    const result = resolveValue(undefined)
    expect(result).toBeUndefined()
  })

  it('should handle null value', () => {
    const result = resolveValue(null)
    expect(result).toBeNull()
  })
})

describe('resolveStyleObject', () => {
  it('should return empty object for undefined', () => {
    const result = resolveStyleObject(undefined)
    expect(result).toEqual({})
  })

  it('should return empty object for string', () => {
    const result = resolveStyleObject('some-class')
    expect(result).toEqual({})
  })

  it('should return style object directly', () => {
    const style = { color: 'red', fontSize: '14px' }
    const result = resolveStyleObject(style)
    expect(result).toEqual(style)
  })

  it('should resolve function that returns style object', () => {
    const styleFn = () => ({ backgroundColor: 'blue' })
    const result = resolveStyleObject(styleFn)
    expect(result).toEqual({ backgroundColor: 'blue' })
  })

  it('should pass argument to function', () => {
    const styleFn = (arg: { active: boolean }) => ({
      color: arg.active ? 'green' : 'gray',
    })
    const result = resolveStyleObject(styleFn, { active: true })
    expect(result).toEqual({ color: 'green' })
  })

  it('should return empty object for function returning string', () => {
    const styleFn = () => 'class-name'
    const result = resolveStyleObject(styleFn)
    expect(result).toEqual({})
  })
})

describe('useNuGridFooter', () => {
  it('should detect columns with footer property', () => {
    const columns = ref<TableColumn<TestData>[]>([
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Name', footer: 'Total' },
    ])

    const { hasFooter } = useNuGridFooter(columns)

    expect(hasFooter.value).toBe(true)
  })

  it('should return false when no columns have footer', () => {
    const columns = ref<TableColumn<TestData>[]>([
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Name' },
    ])

    const { hasFooter } = useNuGridFooter(columns)

    expect(hasFooter.value).toBe(false)
  })

  it('should detect footer in nested columns', () => {
    const columns = ref<TableColumn<TestData>[]>([
      { accessorKey: 'id', header: 'ID' },
      {
        id: 'group',
        header: 'Group',
        columns: [{ accessorKey: 'name', header: 'Name', footer: 'Sum' }],
      },
    ])

    const { hasFooter } = useNuGridFooter(columns)

    expect(hasFooter.value).toBe(true)
  })

  it('should handle empty columns array', () => {
    const columns = ref<TableColumn<TestData>[]>([])

    const { hasFooter } = useNuGridFooter(columns)

    expect(hasFooter.value).toBe(false)
  })

  it('should react to column changes', () => {
    const columns = ref<TableColumn<TestData>[]>([{ accessorKey: 'id', header: 'ID' }])

    const { hasFooter } = useNuGridFooter(columns)
    expect(hasFooter.value).toBe(false)

    columns.value = [{ accessorKey: 'id', header: 'ID', footer: 'Count' }]

    expect(hasFooter.value).toBe(true)
  })
})

describe('useNuGridColumns', () => {
  const testData: TestData[] = [{ id: 1, name: 'Item 1', status: 'active', value: 100 }]

  it('should auto-generate columns from data keys when not provided', () => {
    const data = ref(testData)
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(undefined)

    const { columns } = useNuGridColumns(propsColumns, data)

    expect(columns.value.length).toBe(4)
    expect(columns.value.map((c) => (c as any).accessorKey)).toEqual([
      'id',
      'name',
      'status',
      'value',
    ])
  })

  it('should use provided columns when available', () => {
    const data = ref(testData)
    const customColumns: TableColumn<TestData>[] = [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Name' },
    ]
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(customColumns)

    const { columns } = useNuGridColumns(propsColumns, data)

    expect(columns.value.length).toBe(2)
  })

  it('should add default cell renderer for columns without one', () => {
    const data = ref(testData)
    const customColumns: TableColumn<TestData>[] = [{ accessorKey: 'name', header: 'Name' }]
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(customColumns)

    const { columns } = useNuGridColumns(propsColumns, data)

    expect(columns.value[0].cell).toBeDefined()
    expect(typeof columns.value[0].cell).toBe('function')
  })

  it('should preserve existing cell renderer', () => {
    const data = ref(testData)
    const customCell = vi.fn().mockReturnValue('custom')
    const customColumns: TableColumn<TestData>[] = [
      { accessorKey: 'name', header: 'Name', cell: customCell },
    ]
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(customColumns)

    const { columns } = useNuGridColumns(propsColumns, data)

    expect(columns.value[0].cell).toBe(customCell)
  })

  it('should process nested columns', () => {
    const data = ref(testData)
    const customColumns: TableColumn<TestData>[] = [
      {
        id: 'group',
        header: 'Group',
        columns: [
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'status', header: 'Status' },
        ],
      },
    ]
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(customColumns)

    const { columns } = useNuGridColumns(propsColumns, data)

    const groupColumn = columns.value[0]
    expect((groupColumn as any).columns).toBeDefined()
    expect((groupColumn as any).columns.length).toBe(2)
  })

  it('should handle empty data array', () => {
    const data = ref<TestData[]>([])
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(undefined)

    const { columns } = useNuGridColumns(propsColumns, data)

    expect(columns.value.length).toBe(0)
  })

  it('should handle null and undefined values in cells', () => {
    const data = ref(testData)
    const customColumns: TableColumn<TestData>[] = [{ accessorKey: 'name', header: 'Name' }]
    const propsColumns = ref<TableColumn<TestData>[] | undefined>(customColumns)

    const { columns } = useNuGridColumns(propsColumns, data)
    const cellFn = columns.value[0].cell as any

    // Test with empty string
    expect(cellFn({ getValue: () => '' })).toBe('\u00A0')

    // Test with null
    expect(cellFn({ getValue: () => null })).toBe('\u00A0')

    // Test with undefined
    expect(cellFn({ getValue: () => undefined })).toBe('\u00A0')

    // Test with actual value
    expect(cellFn({ getValue: () => 'test' })).toBe('test')
  })
})

describe('useNuGridDataWatch', () => {
  const testData: TestData[] = [{ id: 1, name: 'Item 1', status: 'active', value: 100 }]

  it('should sync data from props to internal ref', async () => {
    const data = ref<TestData[]>([])
    const props = {
      data: testData,
      watchOptions: { immediate: true },
    }

    useNuGridDataWatch(props, data)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(data.value).toEqual(testData)
  })

  it('should handle null/undefined props.data', async () => {
    const data = ref<TestData[]>(testData)
    const props: any = {
      data: null,
      watchOptions: { immediate: true },
    }

    useNuGridDataWatch(props, data)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(data.value).toEqual([])
  })
})

describe('useNuGridApi', () => {
  const testData: TestData[] = [
    { id: 1, name: 'Item 1', status: 'active', value: 100 },
    { id: 2, name: 'Item 2', status: 'inactive', value: 200 },
  ]

  const testColumns: TableColumn<TestData>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'value', header: 'Value' },
  ]

  const createStates = (): NuGridStates => ({
    globalFilterState: ref(''),
    columnFiltersState: ref([]),
    columnOrderState: ref([]),
    columnVisibilityState: ref({}),
    columnPinningState: ref({ left: [], right: [] }),
    columnSizingState: ref({}),
    columnSizingInfoState: ref<ColumnSizingInfoState>({
      startOffset: null,
      startSize: null,
      deltaOffset: null,
      deltaPercentage: null,
      isResizingColumn: false,
      columnSizingStart: [],
    }),
    rowSelectionState: ref({}),
    rowPinningState: ref({ top: [], bottom: [] }),
    sortingState: ref([]),
    groupingState: ref<GroupingState>([]),
    expandedState: ref({}),
    paginationState: ref({ pageIndex: 0, pageSize: 10 }),
  })

  it('should create table API with correct row count', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props = {
      data: testData,
      columns: testColumns,
    }

    const tableApi = useNuGridApi(props, data, columns, states)

    expect(tableApi.getRowModel().rows.length).toBe(2)
  })

  it('should handle sorting state changes', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props = {
      data: testData,
      columns: testColumns,
    }

    const tableApi = useNuGridApi(props, data, columns, states)

    tableApi.setSorting([{ id: 'name', desc: false }])

    expect(states.sortingState.value).toEqual([{ id: 'name', desc: false }])
  })

  it('should handle row selection state changes', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props = {
      data: testData,
      columns: testColumns,
    }

    const tableApi = useNuGridApi(props, data, columns, states)

    tableApi.setRowSelection({ '0': true })

    expect(states.rowSelectionState.value).toEqual({ '0': true })
  })

  it('should handle global filter changes', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props = {
      data: testData,
      columns: testColumns,
    }

    const tableApi = useNuGridApi(props, data, columns, states)

    tableApi.setGlobalFilter('search term')

    expect(states.globalFilterState.value).toBe('search term')
  })

  it('should handle column visibility changes', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props = {
      data: testData,
      columns: testColumns,
    }

    const tableApi = useNuGridApi(props, data, columns, states)

    tableApi.setColumnVisibility({ status: false })

    expect(states.columnVisibilityState.value).toEqual({ status: false })
  })

  it('should handle pagination state changes', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props = {
      data: testData,
      columns: testColumns,
    }

    const tableApi = useNuGridApi(props, data, columns, states)

    tableApi.setPagination({ pageIndex: 1, pageSize: 20 })

    expect(states.paginationState.value).toEqual({ pageIndex: 1, pageSize: 20 })
  })

  it('should handle column pinning changes', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props = {
      data: testData,
      columns: testColumns,
    }

    const tableApi = useNuGridApi(props, data, columns, states)

    tableApi.setColumnPinning({ left: ['id'], right: [] })

    expect(states.columnPinningState.value).toEqual({ left: ['id'], right: [] })
  })

  it('should have proper filtering model', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props = {
      data: testData,
      columns: testColumns,
    }

    const tableApi = useNuGridApi(props, data, columns, states)

    expect(tableApi.options.getFilteredRowModel).toBeDefined()
    expect(typeof tableApi.options.getFilteredRowModel).toBe('function')
  })

  it('should have proper sorting model', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props = {
      data: testData,
      columns: testColumns,
    }

    const tableApi = useNuGridApi(props, data, columns, states)

    expect(tableApi.options.getSortedRowModel).toBeDefined()
    expect(typeof tableApi.options.getSortedRowModel).toBe('function')
  })
})
