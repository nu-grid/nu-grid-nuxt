import { describe, expect, it } from 'vitest'

import type { EngineColumn, EngineTable, StateAccessors } from '../../src/runtime/engine/types'

import { createEngineColumn } from '../../src/runtime/engine/column'
import { buildCoreRowModel } from '../../src/runtime/engine/core-row-model'
import { buildGroupedRowModel } from '../../src/runtime/engine/grouped-row-model'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockState(overrides?: Partial<StateAccessors>): StateAccessors {
  return {
    columnSizing: () => ({}),
    columnSizingInfo: () => ({
      columnSizingStart: [],
      deltaOffset: null,
      deltaPercentage: null,
      isResizingColumn: false as const,
      startOffset: null,
      startSize: null,
    }),
    columnPinning: () => ({ left: [], right: [] }),
    columnVisibility: () => ({}),
    columnOrder: () => [],
    sorting: () => [],
    grouping: () => [],
    rowSelection: () => ({}),
    expanded: () => ({}),
    columnFilters: () => [],
    setColumnFilters: () => {},
    setColumnVisibility: () => {},
    setSorting: () => {},
    setRowSelection: () => {},
    setExpanded: () => {},
    getVisibleLeafColumns: () => [],
    getLeftVisibleLeafColumns: () => [],
    getRightVisibleLeafColumns: () => [],
    getCenterVisibleLeafColumns: () => [],
    ...overrides,
  }
}

function createTestColumns(state?: StateAccessors): EngineColumn<any>[] {
  const s = state ?? createMockState()
  return [
    createEngineColumn({ id: 'dept', accessorKey: 'dept', header: 'Dept' }, 0, undefined, s),
    createEngineColumn({ id: 'name', accessorKey: 'name', header: 'Name' }, 0, undefined, s),
    createEngineColumn({ id: 'age', accessorKey: 'age', header: 'Age' }, 0, undefined, s),
  ]
}

function createMockTable(
  columns: EngineColumn<any>[],
  overrides?: Partial<EngineTable<any>>,
): EngineTable<any> {
  return {
    getHeaderGroups: () => [],
    getFooterGroups: () => [],
    getAllColumns: () => columns,
    getAllLeafColumns: () => columns,
    getAllFlatColumns: () => columns,
    getVisibleLeafColumns: () => columns,
    getColumn: (id: string) => columns.find((c) => c.id === id),
    getRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
    getSelectedRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
    getPrePaginationRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
    getRow: () => undefined,
    getTotalSize: () => 0,
    getState: () => ({}),
    options: {},
    ...overrides,
  }
}

const testData = [
  { dept: 'eng', name: 'Alice', age: 30 },
  { dept: 'eng', name: 'Bob', age: 25 },
  { dept: 'sales', name: 'Charlie', age: 35 },
  { dept: 'sales', name: 'Diana', age: 28 },
  { dept: 'eng', name: 'Eve', age: 32 },
]

// ---------------------------------------------------------------------------
// No grouping
// ---------------------------------------------------------------------------

describe('buildGroupedRowModel — no grouping', () => {
  it('should return core rows as-is when grouping is empty', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel(testData, columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, [], columns, table, state)

    expect(groupedModel.rows).toHaveLength(5)
    expect(groupedModel.rows[0].depth).toBe(0)
    expect(groupedModel.rows[0].parentId).toBeUndefined()
    expect(groupedModel.rows[0].original).toBe(testData[0])
  })
})

// ---------------------------------------------------------------------------
// Single-level grouping
// ---------------------------------------------------------------------------

describe('buildGroupedRowModel — single-level grouping', () => {
  it('should group rows by a single column', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel(testData, columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, ['dept'], columns, table, state)

    // Should have 2 group rows at the top level
    expect(groupedModel.rows).toHaveLength(2)

    // First group: eng
    const engGroup = groupedModel.rows[0]
    expect(engGroup.groupingColumnId).toBe('dept')
    expect(engGroup.groupingValue).toBe('eng')
    expect(engGroup.subRows).toHaveLength(3) // Alice, Bob, Eve
    expect(engGroup.depth).toBe(0)

    // Second group: sales
    const salesGroup = groupedModel.rows[1]
    expect(salesGroup.groupingColumnId).toBe('dept')
    expect(salesGroup.groupingValue).toBe('sales')
    expect(salesGroup.subRows).toHaveLength(2) // Charlie, Diana
  })

  it('should set correct group row IDs', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel(testData, columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, ['dept'], columns, table, state)

    expect(groupedModel.rows[0].id).toBe('dept:eng')
    expect(groupedModel.rows[1].id).toBe('dept:sales')
  })

  it('should set parentId on child rows', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel(testData, columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, ['dept'], columns, table, state)

    const engGroup = groupedModel.rows[0]
    engGroup.subRows.forEach((subRow) => {
      expect(subRow.parentId).toBe('dept:eng')
    })
  })

  it('child rows should have depth 1', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel(testData, columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, ['dept'], columns, table, state)

    groupedModel.rows[0].subRows.forEach((subRow) => {
      expect(subRow.depth).toBe(1)
    })
  })

  it('group row getIsGrouped should return true', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel(testData, columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, ['dept'], columns, table, state)

    expect(groupedModel.rows[0].getIsGrouped()).toBe(true)
    expect(groupedModel.rows[0].subRows[0].getIsGrouped()).toBe(false)
  })

  it('group row getValue should return grouping value for the grouping column', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel(testData, columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, ['dept'], columns, table, state)

    expect(groupedModel.rows[0].getValue('dept')).toBe('eng')
    expect(groupedModel.rows[1].getValue('dept')).toBe('sales')
  })

  it('should set leafRows on group rows', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel(testData, columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, ['dept'], columns, table, state)

    expect(groupedModel.rows[0].leafRows).toHaveLength(3)
    expect(groupedModel.rows[1].leafRows).toHaveLength(2)
  })

  it('flatRows should include all rows', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel(testData, columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, ['dept'], columns, table, state)

    // TanStack's flatRows includes rows at each recursion level:
    // 5 leaf rows (depth branch) + 5 subRow refs + 2 top-level group rows = 12
    expect(groupedModel.flatRows).toHaveLength(12)
  })
})

// ---------------------------------------------------------------------------
// Multi-level grouping
// ---------------------------------------------------------------------------

describe('buildGroupedRowModel — multi-level grouping', () => {
  const multiData = [
    { dept: 'eng', team: 'frontend', name: 'Alice', age: 30 },
    { dept: 'eng', team: 'frontend', name: 'Bob', age: 25 },
    { dept: 'eng', team: 'backend', name: 'Charlie', age: 35 },
    { dept: 'sales', team: 'east', name: 'Diana', age: 28 },
  ]

  function createMultiColumns(state: StateAccessors) {
    return [
      createEngineColumn({ id: 'dept', accessorKey: 'dept', header: 'Dept' }, 0, undefined, state),
      createEngineColumn({ id: 'team', accessorKey: 'team', header: 'Team' }, 0, undefined, state),
      createEngineColumn({ id: 'name', accessorKey: 'name', header: 'Name' }, 0, undefined, state),
      createEngineColumn({ id: 'age', accessorKey: 'age', header: 'Age' }, 0, undefined, state),
    ]
  }

  it('should group by multiple levels', () => {
    const state = createMockState()
    const columns = createMultiColumns(state)
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel(multiData, columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, ['dept', 'team'], columns, table, state)

    // Top level: eng, sales
    expect(groupedModel.rows).toHaveLength(2)

    const engGroup = groupedModel.rows[0]
    expect(engGroup.groupingColumnId).toBe('dept')
    expect(engGroup.groupingValue).toBe('eng')

    // eng has 2 sub-groups: frontend, backend
    expect(engGroup.subRows).toHaveLength(2)
    expect(engGroup.subRows[0].groupingColumnId).toBe('team')
    expect(engGroup.subRows[0].groupingValue).toBe('frontend')
    expect(engGroup.subRows[0].subRows).toHaveLength(2) // Alice, Bob

    expect(engGroup.subRows[1].groupingColumnId).toBe('team')
    expect(engGroup.subRows[1].groupingValue).toBe('backend')
    expect(engGroup.subRows[1].subRows).toHaveLength(1) // Charlie

    // sales has 1 sub-group: east
    const salesGroup = groupedModel.rows[1]
    expect(salesGroup.subRows).toHaveLength(1)
    expect(salesGroup.subRows[0].groupingValue).toBe('east')
  })

  it('should set nested group IDs following TanStack convention', () => {
    const state = createMockState()
    const columns = createMultiColumns(state)
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel(multiData, columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, ['dept', 'team'], columns, table, state)

    expect(groupedModel.rows[0].id).toBe('dept:eng')
    expect(groupedModel.rows[0].subRows[0].id).toBe('dept:eng>team:frontend')
    expect(groupedModel.rows[0].subRows[1].id).toBe('dept:eng>team:backend')
    expect(groupedModel.rows[1].subRows[0].id).toBe('dept:sales>team:east')
  })

  it('leaf rows should have correct depth', () => {
    const state = createMockState()
    const columns = createMultiColumns(state)
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel(multiData, columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, ['dept', 'team'], columns, table, state)

    // Leaf data rows should be at depth 2
    const leafRow = groupedModel.rows[0].subRows[0].subRows[0]
    expect(leafRow.depth).toBe(2)
    expect(leafRow.getIsGrouped()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('buildGroupedRowModel — edge cases', () => {
  it('should handle empty data', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel([], columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, ['dept'], columns, table, state)

    expect(groupedModel.rows).toHaveLength(0)
  })

  it('should skip non-existent grouping columns', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel(testData, columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, ['nonexistent'], columns, table, state)

    // Should return rows ungrouped since column doesn't exist
    expect(groupedModel.rows).toHaveLength(5)
  })
})

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

describe('buildGroupedRowModel — aggregation', () => {
  it('should populate _groupingValuesCache with sum aggregation', () => {
    const state = createMockState()
    const columns = [
      createEngineColumn({ id: 'dept', accessorKey: 'dept' }, 0, undefined, state),
      createEngineColumn(
        { id: 'age', accessorKey: 'age', aggregationFn: 'sum' },
        0,
        undefined,
        state,
      ),
      createEngineColumn({ id: 'name', accessorKey: 'name' }, 0, undefined, state),
    ]
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel(testData, columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, ['dept'], columns, table, state)

    // eng group: 30 + 25 + 32 = 87
    expect(groupedModel.rows[0].getValue('age')).toBe(87)
    // sales group: 35 + 28 = 63
    expect(groupedModel.rows[1].getValue('age')).toBe(63)
  })

  it('should populate _groupingValuesCache with count aggregation', () => {
    const state = createMockState()
    const columns = [
      createEngineColumn({ id: 'dept', accessorKey: 'dept' }, 0, undefined, state),
      createEngineColumn(
        { id: 'name', accessorKey: 'name', aggregationFn: 'count' },
        0,
        undefined,
        state,
      ),
    ]
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel(testData, columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, ['dept'], columns, table, state)

    expect(groupedModel.rows[0].getValue('name')).toBe(3) // eng has 3
    expect(groupedModel.rows[1].getValue('name')).toBe(2) // sales has 2
  })

  it('should populate _groupingValuesCache with unique aggregation', () => {
    const state = createMockState()
    const columns = [
      createEngineColumn({ id: 'dept', accessorKey: 'dept' }, 0, undefined, state),
      createEngineColumn(
        { id: 'name', accessorKey: 'name', aggregationFn: 'unique' },
        0,
        undefined,
        state,
      ),
    ]
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel(testData, columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, ['dept'], columns, table, state)

    const engNames = groupedModel.rows[0].getValue<string[]>('name')
    expect(engNames).toEqual(['Alice', 'Bob', 'Eve'])
  })

  it('should support custom aggregation functions', () => {
    const state = createMockState()
    const customFn = (columnId: string, leafRows: any[]) => {
      return leafRows.map((r: any) => r.getValue(columnId)).join(', ')
    }
    const columns = [
      createEngineColumn({ id: 'dept', accessorKey: 'dept' }, 0, undefined, state),
      createEngineColumn(
        { id: 'name', accessorKey: 'name', aggregationFn: customFn },
        0,
        undefined,
        state,
      ),
    ]
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel(testData, columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, ['dept'], columns, table, state)

    expect(groupedModel.rows[0].getValue('name')).toBe('Alice, Bob, Eve')
  })

  it('should not aggregate columns without aggregationFn', () => {
    const state = createMockState()
    const columns = [
      createEngineColumn({ id: 'dept', accessorKey: 'dept' }, 0, undefined, state),
      createEngineColumn(
        { id: 'age', accessorKey: 'age', aggregationFn: 'sum' },
        0,
        undefined,
        state,
      ),
      createEngineColumn({ id: 'name', accessorKey: 'name' }, 0, undefined, state),
    ]
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel(testData, columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, ['dept'], columns, table, state)

    // age is aggregated
    expect(groupedModel.rows[0]._groupingValuesCache).toHaveProperty('age')
    // name is NOT aggregated — falls back to first row's value
    expect(groupedModel.rows[0]._groupingValuesCache).not.toHaveProperty('name')
    expect(groupedModel.rows[0].getValue('name')).toBe('Alice')
  })

  it('should aggregate correctly with multi-level grouping', () => {
    const multiData = [
      { dept: 'eng', team: 'frontend', age: 30 },
      { dept: 'eng', team: 'frontend', age: 25 },
      { dept: 'eng', team: 'backend', age: 35 },
      { dept: 'sales', team: 'east', age: 28 },
    ]
    const state = createMockState()
    const columns = [
      createEngineColumn({ id: 'dept', accessorKey: 'dept' }, 0, undefined, state),
      createEngineColumn({ id: 'team', accessorKey: 'team' }, 0, undefined, state),
      createEngineColumn(
        { id: 'age', accessorKey: 'age', aggregationFn: 'sum' },
        0,
        undefined,
        state,
      ),
    ]
    const table = createMockTable(columns)
    const coreModel = buildCoreRowModel(multiData, columns, table, state)

    const groupedModel = buildGroupedRowModel(coreModel, ['dept', 'team'], columns, table, state)

    // Top-level eng group: 30 + 25 + 35 = 90
    expect(groupedModel.rows[0].getValue('age')).toBe(90)
    // eng > frontend: 30 + 25 = 55
    expect(groupedModel.rows[0].subRows[0].getValue('age')).toBe(55)
    // eng > backend: 35
    expect(groupedModel.rows[0].subRows[1].getValue('age')).toBe(35)
    // sales: 28
    expect(groupedModel.rows[1].getValue('age')).toBe(28)
  })
})
