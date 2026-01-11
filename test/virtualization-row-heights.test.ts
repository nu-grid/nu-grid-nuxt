import type { TableColumn } from '@nuxt/ui'
import type { ColumnSizingInfoState, GroupingState } from '@tanstack/vue-table'
import type { NuGridProps } from '../src/runtime/types'
import type { GroupingVirtualRowHeights } from '../src/runtime/types/_internal'
import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useNuGridApi, useNuGridColumns } from '../src/runtime/composables/_internal/useNuGridCore'
import { useNuGridGrouping } from '../src/runtime/composables/_internal/useNuGridGrouping'

/**
 * Tests for virtualization row heights configuration
 *
 * This test suite verifies that:
 * 1. Default row heights are used when rowHeights is not provided in virtualization
 * 2. Custom row heights override defaults when provided via virtualization.rowHeights
 * 3. Partial custom heights are merged with defaults
 */

interface TestData {
  id: number
  name: string
  status: string
  value: number
}

describe('virtualization Row Heights Configuration', () => {
  const testData: TestData[] = [
    { id: 1, name: 'Item 1', status: 'active', value: 100 },
    { id: 2, name: 'Item 2', status: 'active', value: 200 },
    { id: 3, name: 'Item 3', status: 'inactive', value: 150 },
    { id: 4, name: 'Item 4', status: 'inactive', value: 250 },
  ]

  const testColumns: TableColumn<TestData>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'value', header: 'Value' },
  ]

  const createStates = () => ({
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
    groupingState: ref<GroupingState>(['status']),
    expandedState: ref({}),
    paginationState: ref({ pageIndex: 0, pageSize: 10 }),
  })

  it('should use default row heights when virtualization is boolean true', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props: NuGridProps<TestData> = {
      data: testData,
      columns: testColumns,
      virtualization: true,
      layout: { mode: 'group' },
    }

    const tableApi = useNuGridApi(props, data, columns, states)
    const rootRef = ref(null)

    const grouping = useNuGridGrouping(props, tableApi, rootRef)

    // Verify default heights are used
    expect(grouping.groupingRowHeights.value).toEqual({
      groupHeader: 50,
      columnHeader: 50,
      dataRow: 80,
      footer: 45,
    })
  })

  it('should use custom row heights when virtualization.rowHeights is fully provided', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const customHeights: GroupingVirtualRowHeights = {
      groupHeader: 60,
      columnHeader: 45,
      dataRow: 100,
      footer: 50,
    }

    const props: NuGridProps<TestData> = {
      data: testData,
      columns: testColumns,
      virtualization: {
        rowHeights: customHeights,
      },
      layout: { mode: 'group' },
    }

    const tableApi = useNuGridApi(props, data, columns, states)
    const rootRef = ref(null)

    const grouping = useNuGridGrouping(props, tableApi, rootRef)

    // Verify custom heights are used
    expect(grouping.groupingRowHeights.value).toEqual({
      groupHeader: 60,
      columnHeader: 45,
      dataRow: 100,
      footer: 50,
    })
  })

  it('should merge partial custom heights with defaults', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    // Only specify some heights
    const partialHeights: GroupingVirtualRowHeights = {
      dataRow: 120,
      footer: 60,
    }

    const props: NuGridProps<TestData> = {
      data: testData,
      columns: testColumns,
      virtualization: {
        rowHeights: partialHeights,
      },
      layout: { mode: 'group' },
    }

    const tableApi = useNuGridApi(props, data, columns, states)
    const rootRef = ref(null)

    const grouping = useNuGridGrouping(props, tableApi, rootRef)

    // Verify partial heights are merged with defaults
    expect(grouping.groupingRowHeights.value).toEqual({
      groupHeader: 50, // Default
      columnHeader: 50, // Default
      dataRow: 120, // Custom
      footer: 60, // Custom
    })
  })

  it('should apply custom heights to virtualRowItems', async () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const customHeights: GroupingVirtualRowHeights = {
      groupHeader: 70,
      columnHeader: 55,
      dataRow: 90,
      footer: 40,
    }

    const props: NuGridProps<TestData> = {
      data: testData,
      columns: testColumns,
      virtualization: {
        rowHeights: customHeights,
      },
      layout: { mode: 'group' },
    }

    const tableApi = useNuGridApi(props, data, columns, states)
    const rootRef = ref(null)

    const grouping = useNuGridGrouping(props, tableApi, rootRef)

    // Wait for computed values to update
    await nextTick()

    // Find items of each type and verify heights
    const groupHeaderItem = grouping.virtualRowItems.value.find(
      (item) => item.type === 'group-header',
    )
    const dataItem = grouping.virtualRowItems.value.find((item) => item.type === 'data')
    const footerItem = grouping.virtualRowItems.value.find((item) => item.type === 'footer')

    expect(groupHeaderItem?.height).toBe(70)
    expect(dataItem?.height).toBe(90)
    expect(footerItem?.height).toBe(40)
  })

  it('should handle virtualization object without rowHeights', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props: NuGridProps<TestData> = {
      data: testData,
      columns: testColumns,
      virtualization: {
        estimateSize: 100,
        overscan: 20,
      },
      layout: { mode: 'group' },
    }

    const tableApi = useNuGridApi(props, data, columns, states)
    const rootRef = ref(null)

    const grouping = useNuGridGrouping(props, tableApi, rootRef)

    // Verify all defaults are used
    expect(grouping.groupingRowHeights.value).toEqual({
      groupHeader: 50,
      columnHeader: 50,
      dataRow: 80,
      footer: 45,
    })
  })

  it('should handle empty rowHeights object', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props: NuGridProps<TestData> = {
      data: testData,
      columns: testColumns,
      virtualization: {
        rowHeights: {}, // Empty object
      },
      layout: { mode: 'group' },
    }

    const tableApi = useNuGridApi(props, data, columns, states)
    const rootRef = ref(null)

    const grouping = useNuGridGrouping(props, tableApi, rootRef)

    // Verify all defaults are used
    expect(grouping.groupingRowHeights.value).toEqual({
      groupHeader: 50,
      columnHeader: 50,
      dataRow: 80,
      footer: 45,
    })
  })
})

describe('dynamic Row Heights Configuration', () => {
  const testData: TestData[] = [
    { id: 1, name: 'Item 1', status: 'active', value: 100 },
    { id: 2, name: 'Item 2', status: 'active', value: 200 },
    { id: 3, name: 'Item 3', status: 'inactive', value: 150 },
    { id: 4, name: 'Item 4', status: 'inactive', value: 250 },
  ]

  const testColumns: TableColumn<TestData>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'value', header: 'Value' },
  ]

  const createStates = () => ({
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
    groupingState: ref<GroupingState>(['status']),
    expandedState: ref({}),
    paginationState: ref({ pageIndex: 0, pageSize: 10 }),
  })

  it('should have dynamicRowHeightsEnabled true by default when virtualization is boolean true', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props: NuGridProps<TestData> = {
      data: testData,
      columns: testColumns,
      virtualization: true,
      layout: { mode: 'group' },
    }

    const tableApi = useNuGridApi(props, data, columns, states)
    const rootRef = ref(null)

    const grouping = useNuGridGrouping(props, tableApi, rootRef)
    const dynamicRowHeightsEnabled = grouping.virtualizer
      ? grouping.virtualizer.value.dynamicRowHeightsEnabled.value
      : false

    expect(dynamicRowHeightsEnabled).toBe(true)
  })

  it('should have dynamicRowHeightsEnabled true when virtualization.dynamicRowHeights is true', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props: NuGridProps<TestData> = {
      data: testData,
      columns: testColumns,
      virtualization: {
        dynamicRowHeights: true,
      },
      layout: { mode: 'group' },
    }

    const tableApi = useNuGridApi(props, data, columns, states)
    const rootRef = ref(null)

    const grouping = useNuGridGrouping(props, tableApi, rootRef)

    const dynamicRowHeightsEnabled = grouping.virtualizer
      ? grouping.virtualizer.value.dynamicRowHeightsEnabled.value
      : false

    expect(dynamicRowHeightsEnabled).toBe(true)
  })

  it('should have dynamicRowHeightsEnabled false when virtualization.dynamicRowHeights is false', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props: NuGridProps<TestData> = {
      data: testData,
      columns: testColumns,
      virtualization: {
        dynamicRowHeights: false,
      },
      layout: { mode: 'group' },
    }

    const tableApi = useNuGridApi(props, data, columns, states)
    const rootRef = ref(null)

    const grouping = useNuGridGrouping(props, tableApi, rootRef)

    const dynamicRowHeightsEnabled = grouping.virtualizer
      ? grouping.virtualizer.value.dynamicRowHeightsEnabled.value
      : false

    expect(dynamicRowHeightsEnabled).toBe(false)
  })

  it('should have dynamicRowHeightsEnabled false when rowHeights is provided without explicit dynamicRowHeights', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props: NuGridProps<TestData> = {
      data: testData,
      columns: testColumns,
      virtualization: {
        rowHeights: { dataRow: 100 },
      },
      layout: { mode: 'group' },
    }

    const tableApi = useNuGridApi(props, data, columns, states)
    const rootRef = ref(null)

    const grouping = useNuGridGrouping(props, tableApi, rootRef)

    const dynamicRowHeightsEnabled = grouping.virtualizer
      ? grouping.virtualizer.value.dynamicRowHeightsEnabled.value
      : false

    expect(dynamicRowHeightsEnabled).toBe(false)
  })

  it('should have dynamicRowHeightsEnabled true when rowHeights is provided with explicit dynamicRowHeights: true', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props: NuGridProps<TestData> = {
      data: testData,
      columns: testColumns,
      virtualization: {
        rowHeights: { dataRow: 100 },
        dynamicRowHeights: true,
      },
      layout: { mode: 'group' },
    }

    const tableApi = useNuGridApi(props, data, columns, states)
    const rootRef = ref(null)

    const grouping = useNuGridGrouping(props, tableApi, rootRef)

    const dynamicRowHeightsEnabled = grouping.virtualizer
      ? grouping.virtualizer.value.dynamicRowHeightsEnabled.value
      : false

    expect(dynamicRowHeightsEnabled).toBe(true)
  })

  it('should allow combining dynamicRowHeights with estimateSize', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props: NuGridProps<TestData> = {
      data: testData,
      columns: testColumns,
      virtualization: {
        dynamicRowHeights: true,
        estimateSize: 100,
      },
      layout: { mode: 'group' },
    }

    const tableApi = useNuGridApi(props, data, columns, states)
    const rootRef = ref(null)

    const grouping = useNuGridGrouping(props, tableApi, rootRef)

    const dynamicRowHeightsEnabled = grouping.virtualizer
      ? grouping.virtualizer.value.dynamicRowHeightsEnabled.value
      : false

    expect(dynamicRowHeightsEnabled).toBe(true)
    const estimateSize = grouping.virtualizer
      ? grouping.virtualizer.value.props.value.estimateSize
      : undefined

    expect(estimateSize).toBe(100)
  })

  it('should allow combining dynamicRowHeights with rowHeights as initial estimates', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props: NuGridProps<TestData> = {
      data: testData,
      columns: testColumns,
      virtualization: {
        dynamicRowHeights: true,
        rowHeights: {
          groupHeader: 60,
          dataRow: 90,
        },
      },
      layout: { mode: 'group' },
    }

    const tableApi = useNuGridApi(props, data, columns, states)
    const rootRef = ref(null)

    const grouping = useNuGridGrouping(props, tableApi, rootRef)

    const dynamicRowHeightsEnabled = grouping.virtualizer
      ? grouping.virtualizer.value.dynamicRowHeightsEnabled.value
      : false

    expect(dynamicRowHeightsEnabled).toBe(true)
    // Row heights are still used as initial estimates
    expect(grouping.groupingRowHeights.value).toEqual({
      groupHeader: 60,
      columnHeader: 50, // Default
      dataRow: 90,
      footer: 45, // Default
    })
  })
})
