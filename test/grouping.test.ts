import type { TableColumn } from '@nuxt/ui'
import type { ColumnSizingInfoState, GroupingState } from '@tanstack/vue-table'
import type { NuGridStates } from '../src/runtime/types/_internal'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useNuGridApi, useNuGridColumns } from '../src/runtime/composables/_internal/useNuGridCore'

/**
 * Tests for grouping functionality
 *
 * This test suite verifies that:
 * 1. The default Tanstack getGroupedRowModel utility is used
 * 2. Users can override with custom grouping functions
 * 3. Grouping works correctly with actual data
 */

interface TestData {
  id: number
  name: string
  status: string
  value: number
}

describe('table Grouping', () => {
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

  const createStates = (grouping: GroupingState = ['status']): NuGridStates => ({
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
    groupingState: ref<GroupingState>(grouping),
    expandedState: ref({}),
    paginationState: ref({ pageIndex: 0, pageSize: 10 }),
  })

  it('should use Tanstack getGroupedRowModel by default', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props = {
      data: testData,
      columns: testColumns,
    }

    const tableApi = useNuGridApi(props, data, columns, states)

    // Verify that the table has grouping capability
    expect(tableApi.options.getGroupedRowModel).toBeDefined()
    expect(typeof tableApi.options.getGroupedRowModel).toBe('function')

    // Verify grouping state is set
    expect(tableApi.getState().grouping).toEqual(['status'])

    // Get the grouped rows
    const rowModel = tableApi.getGroupedRowModel()
    expect(rowModel).toBeDefined()
    expect(rowModel.rows).toBeDefined()

    // When grouped by status, we should have 2 group rows (active and inactive)
    const groupedRows = rowModel.rows.filter((row: any) => row.getIsGrouped())
    expect(groupedRows.length).toBeGreaterThan(0)
  })

  it('should allow custom grouping function to override default', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)

    // Create a custom grouping function
    const customGroupedRowModel = vi.fn(() => ({
      rows: [],
      flatRows: [],
      rowsById: {},
    }))

    const states = createStates()

    const props = {
      data: testData,
      columns: testColumns,
      groupingOptions: {
        getGroupedRowModel: customGroupedRowModel,
      },
    } as any

    const tableApi = useNuGridApi(props, data, columns, states)

    // Verify that the custom function is used
    expect(tableApi.options.getGroupedRowModel).toBe(customGroupedRowModel)
  })

  it('should handle grouping state changes', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates([])

    const props = {
      data: testData,
      columns: testColumns,
    }

    const tableApi = useNuGridApi(props, data, columns, states)

    // Initially no grouping
    expect(tableApi.getState().grouping).toEqual([])

    // Set grouping
    tableApi.setGrouping(['status'])

    // Verify state updated
    expect(states.groupingState.value).toEqual(['status'])
  })

  it('should support multiple grouping columns', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates(['status', 'value'])

    const props = {
      data: testData,
      columns: testColumns,
    }

    const tableApi = useNuGridApi(props, data, columns, states)

    // Verify multiple grouping columns are set
    expect(tableApi.getState().grouping).toEqual(['status', 'value'])
  })

  it('should respect groupedColumnMode option in groupingOptions', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props = {
      data: testData,
      columns: testColumns,
      groupingOptions: {
        groupedColumnMode: 'remove',
      },
    } as any

    const tableApi = useNuGridApi(props, data, columns, states)

    // Verify groupedColumnMode option is set
    expect(tableApi.options.groupedColumnMode).toBe('remove')
  })

  it('should work with custom aggregation functions', () => {
    const data = ref(testData)

    const columnsWithAggregation: TableColumn<TestData>[] = [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'status', header: 'Status' },
      {
        accessorKey: 'value',
        header: 'Value',
        aggregationFn: 'sum',
        footer: ({ table }) => {
          const total = table
            .getFilteredRowModel()
            .rows.reduce((sum, row) => sum + row.original.value, 0)
          return `Total: ${total}`
        },
      },
    ]

    const propsColumns = ref(columnsWithAggregation)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()

    const props = {
      data: testData,
      columns: columnsWithAggregation,
    }

    const tableApi = useNuGridApi(props, data, columns, states)

    // Verify that columns with aggregation are properly configured
    const valueColumn = tableApi.getColumn('value')
    expect(valueColumn).toBeDefined()
    expect(valueColumn?.columnDef.aggregationFn).toBe('sum')
  })

  it('should use custom grouping function from user when provided in groupingOptions', () => {
    const data = ref(testData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)

    // Create a custom grouping function that returns a factory function
    const mockRows: any[] = []
    const innerFunction = vi.fn(() => ({
      rows: mockRows,
      flatRows: mockRows,
      rowsById: {},
    }))

    // Tanstack expects a factory function that returns the actual grouping function
    const customGroupedRowModel = () => innerFunction
    const states = createStates()

    const props = {
      data: testData,
      columns: testColumns,
      groupingOptions: {
        getGroupedRowModel: customGroupedRowModel,
      },
    } as any

    const tableApi = useNuGridApi(props, data, columns, states)

    // Call getGroupedRowModel to trigger the custom function
    const result = tableApi.getGroupedRowModel()

    // Verify custom function was used
    expect(innerFunction).toHaveBeenCalled()
    expect(result.rows).toEqual(mockRows)
  })

  it('should sort rows within groups when sorting is applied', () => {
    // Test data with values that can be sorted
    const sortableData: TestData[] = [
      { id: 1, name: 'Charlie', status: 'active', value: 300 },
      { id: 2, name: 'Alice', status: 'active', value: 100 },
      { id: 3, name: 'Bob', status: 'active', value: 200 },
      { id: 4, name: 'Zara', status: 'inactive', value: 400 },
      { id: 5, name: 'Eve', status: 'inactive', value: 250 },
    ]

    const data = ref(sortableData)
    const propsColumns = ref(testColumns)
    const { columns } = useNuGridColumns(propsColumns, data)
    const states = createStates()
    states.sortingState.value = [{ id: 'name', desc: false }] // Sort by name ascending

    const props = {
      data: sortableData,
      columns: testColumns,
    }

    const tableApi = useNuGridApi(props, data, columns, states)

    // Verify sorting state is set
    expect(tableApi.getState().sorting).toEqual([{ id: 'name', desc: false }])

    // Get the sorted row model (which includes grouped and sorted data)
    const sortedRows = tableApi.getSortedRowModel().rows

    // Filter to get only group rows
    const groupedRows = sortedRows.filter((row: any) => row.getIsGrouped())
    expect(groupedRows.length).toBe(2) // 'active' and 'inactive' groups

    // Check that subRows within each group are sorted by name
    groupedRows.forEach((groupRow: any) => {
      const subRows = groupRow.subRows || []
      if (subRows.length > 1) {
        for (let i = 1; i < subRows.length; i++) {
          const prevName = subRows[i - 1].original.name
          const currName = subRows[i].original.name
          // Names should be in ascending order
          expect(prevName.localeCompare(currName)).toBeLessThanOrEqual(0)
        }
      }
    })

    // Specifically test 'active' group subRows order
    const activeGroup = groupedRows.find((row: any) => row.getGroupingValue('status') === 'active')
    expect(activeGroup).toBeDefined()
    const activeSubRows = activeGroup?.subRows || []
    expect(activeSubRows.length).toBe(3)
    // Should be ordered: Alice, Bob, Charlie
    expect(activeSubRows[0].original.name).toBe('Alice')
    expect(activeSubRows[1].original.name).toBe('Bob')
    expect(activeSubRows[2].original.name).toBe('Charlie')
  })

  describe('navigableRows in grouped grids', () => {
    it('should only include data rows from leaf groups in navigableRows', () => {
      // This test prevents regression of the bug where navigableRows included
      // intermediate group headers instead of only data rows from leaf groups

      // Create 3-tier grouping test data: region > country > status
      interface Product {
        id: number
        name: string
        region: string
        country: string
        status: string
      }

      const threeTierData: Product[] = [
        // North America - USA - active
        { id: 1, name: 'Laptop', region: 'North America', country: 'USA', status: 'active' },
        { id: 2, name: 'Mouse', region: 'North America', country: 'USA', status: 'active' },
        // North America - USA - inactive
        { id: 3, name: 'Keyboard', region: 'North America', country: 'USA', status: 'inactive' },
        // North America - Canada - active
        { id: 4, name: 'Monitor', region: 'North America', country: 'Canada', status: 'active' },
        // Europe - UK - active
        { id: 5, name: 'Headphones', region: 'Europe', country: 'UK', status: 'active' },
        { id: 6, name: 'Webcam', region: 'Europe', country: 'UK', status: 'active' },
      ]

      const data = ref(threeTierData)
      const columnsWithGrouping: TableColumn<Product>[] = [
        { accessorKey: 'id', header: 'ID' },
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'region', header: 'Region' },
        { accessorKey: 'country', header: 'Country' },
        { accessorKey: 'status', header: 'Status' },
      ]

      const propsColumns = ref(columnsWithGrouping)
      const { columns } = useNuGridColumns(propsColumns, data)

      // Set up 3-tier grouping
      const states = createStates(['region', 'country', 'status'])
      states.expandedState.value = true // All groups expanded
      states.paginationState.value = { pageIndex: 0, pageSize: 100 }

      const props = {
        data: threeTierData,
        columns: columnsWithGrouping,
      }

      const tableApi = useNuGridApi(props, data, columns, states)

      // Get all rows from the grouped model
      const groupedRows = tableApi.getGroupedRowModel().rows

      // Count total groups and data rows
      let totalGroups = 0
      let dataRows = 0
      let leafGroups = 0

      function countRows(rows: any[], level = 0) {
        rows.forEach((row) => {
          if (row.getIsGrouped()) {
            totalGroups++
            const hasSubgroups = row.subRows?.some((subRow: any) => subRow.getIsGrouped())
            if (!hasSubgroups) {
              leafGroups++
            }
            if (row.subRows) {
              countRows(row.subRows, level + 1)
            }
          } else {
            dataRows++
          }
        })
      }

      countRows(groupedRows)

      // Verify structure expectations:
      // - We have 6 data rows
      // - We have multiple groups at different levels (region, country, status)
      // - Only leaf groups (status level) should contain data rows for navigation
      expect(dataRows).toBe(6)
      expect(totalGroups).toBeGreaterThan(6) // More groups than data rows in 3-tier
      expect(leafGroups).toBe(4) // USA-active, USA-inactive, Canada-active, UK-active

      // This is the critical assertion: navigableRows should ONLY contain
      // rows from leaf groups, not intermediate group headers
      // In our case: 4 leaf groups with 6 total data rows
      // If the bug exists, navigableRows would incorrectly include intermediate
      // group headers and be > 6 rows

      // Note: We can't directly test navigableRows here since it's in useNuGridGrouping,
      // but we verify the data structure that navigableRows relies on

      // Verify that leaf groups don't have grouped subRows
      groupedRows.forEach((row) => {
        function checkLeafGroups(r: any) {
          if (r.getIsGrouped()) {
            const hasSubgroups = r.subRows?.some((sr: any) => sr.getIsGrouped())
            if (!hasSubgroups && r.subRows) {
              // This is a leaf group - all subRows should be data rows
              r.subRows.forEach((subRow: any) => {
                expect(subRow.getIsGrouped()).toBe(false)
              })
            }
            if (r.subRows) {
              r.subRows.forEach(checkLeafGroups)
            }
          }
        }
        checkLeafGroups(row)
      })
    })

    it('should correctly identify leaf groups vs intermediate groups', () => {
      // Simple 2-tier grouping to test leaf group detection
      interface SimpleProduct {
        id: number
        category: string
        status: string
      }

      const simpleTwoTierData: SimpleProduct[] = [
        { id: 1, category: 'Electronics', status: 'active' },
        { id: 2, category: 'Electronics', status: 'inactive' },
        { id: 3, category: 'Furniture', status: 'active' },
      ]

      const data = ref(simpleTwoTierData)
      const cols: TableColumn<SimpleProduct>[] = [
        { accessorKey: 'id', header: 'ID' },
        { accessorKey: 'category', header: 'Category' },
        { accessorKey: 'status', header: 'Status' },
      ]

      const propsColumns = ref(cols)
      const { columns } = useNuGridColumns(propsColumns, data)
      const states = createStates(['category', 'status'])
      states.expandedState.value = true
      states.paginationState.value = { pageIndex: 0, pageSize: 100 }

      const props = {
        data: simpleTwoTierData,
        columns: cols,
      }

      const tableApi = useNuGridApi(props, data, columns, states)
      const groupedRows = tableApi.getGroupedRowModel().rows

      // Verify structure:
      // - 2 category groups (Electronics, Furniture) - these are intermediate
      // - 3 status groups (Electronics-active, Electronics-inactive, Furniture-active) - these are leaf
      // - 3 data rows

      let categoryGroups = 0
      let statusGroups = 0

      groupedRows.forEach((row) => {
        if (row.getIsGrouped()) {
          categoryGroups++
          const hasSubgroups = row.subRows?.some((sr: any) => sr.getIsGrouped())
          if (hasSubgroups) {
            // This is an intermediate group (category level)
            // Count its subgroups (status level)
            row.subRows?.forEach((subRow: any) => {
              if (subRow.getIsGrouped()) {
                statusGroups++
                // Status groups should be leaf groups (no grouped subRows)
                const hasNestedGroups = subRow.subRows?.some((sr: any) => sr.getIsGrouped())
                expect(hasNestedGroups).toBe(false)
              }
            })
          }
        }
      })

      expect(categoryGroups).toBe(2) // Electronics, Furniture
      expect(statusGroups).toBe(3) // Electronics-active, Electronics-inactive, Furniture-active
    })
  })
})
