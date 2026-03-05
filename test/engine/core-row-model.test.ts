import { describe, expect, it } from 'vitest'

import type { EngineColumn, EngineTable, StateAccessors } from '../../src/runtime/engine/types'

import { createEngineColumn } from '../../src/runtime/engine/column'
import { buildCoreRowModel } from '../../src/runtime/engine/core-row-model'

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

// ---------------------------------------------------------------------------
// Basic row model creation
// ---------------------------------------------------------------------------

describe('buildCoreRowModel — basics', () => {
  it('should create rows from flat data', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable(columns)
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
      { name: 'Charlie', age: 35 },
    ]

    const model = buildCoreRowModel(data, columns, table, state)

    expect(model.rows).toHaveLength(3)
    expect(model.flatRows).toHaveLength(3)
    expect(Object.keys(model.rowsById)).toHaveLength(3)
  })

  it('should set correct row properties', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable(columns)
    const data = [{ name: 'Alice', age: 30 }]

    const model = buildCoreRowModel(data, columns, table, state)
    const row = model.rows[0]

    expect(row.id).toBe('0')
    expect(row.index).toBe(0)
    expect(row.original).toBe(data[0])
    expect(row.depth).toBe(0)
    expect(row.subRows).toEqual([])
  })

  it('should use index as default row ID', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable(columns)
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]

    const model = buildCoreRowModel(data, columns, table, state)

    expect(model.rows[0].id).toBe('0')
    expect(model.rows[1].id).toBe('1')
  })

  it('should use custom getRowId function', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable(columns, {
      options: {
        getRowId: (row: any) => row.name,
      },
    })
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]

    const model = buildCoreRowModel(data, columns, table, state)

    expect(model.rows[0].id).toBe('Alice')
    expect(model.rows[1].id).toBe('Bob')
    expect(model.rowsById.Alice).toBeDefined()
    expect(model.rowsById.Bob).toBeDefined()
  })

  it('should populate rowsById lookup', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable(columns)
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]

    const model = buildCoreRowModel(data, columns, table, state)

    expect(model.rowsById['0']).toBe(model.rows[0])
    expect(model.rowsById['1']).toBe(model.rows[1])
  })
})

// ---------------------------------------------------------------------------
// Row value access
// ---------------------------------------------------------------------------

describe('buildCoreRowModel — value access', () => {
  it('rows should resolve values via column accessors', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable(columns)
    const data = [{ name: 'Alice', age: 30 }]

    const model = buildCoreRowModel(data, columns, table, state)
    const row = model.rows[0]

    expect(row.getValue('name')).toBe('Alice')
    expect(row.getValue('age')).toBe(30)
  })
})

// ---------------------------------------------------------------------------
// Empty data
// ---------------------------------------------------------------------------

describe('buildCoreRowModel — edge cases', () => {
  it('should handle empty data array', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable(columns)

    const model = buildCoreRowModel([], columns, table, state)

    expect(model.rows).toHaveLength(0)
    expect(model.flatRows).toHaveLength(0)
    expect(Object.keys(model.rowsById)).toHaveLength(0)
  })

  it('should handle empty columns', () => {
    const state = createMockState()
    const table = createMockTable([])
    const data = [{ name: 'Alice', age: 30 }]

    const model = buildCoreRowModel(data, [], table, state)

    expect(model.rows).toHaveLength(1)
    expect(model.rows[0].original).toBe(data[0])
  })
})
