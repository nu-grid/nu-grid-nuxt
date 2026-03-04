import { describe, expect, it } from 'vitest'

import { createEngineColumn } from '../../src/runtime/engine/column'
import { createEngineCell } from '../../src/runtime/engine/cell'
import { createEngineRow } from '../../src/runtime/engine/row'
import type { EngineColumn, EngineTable, StateAccessors } from '../../src/runtime/engine/types'

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

function createTestSetup(data: Record<string, any> = { name: 'Alice', age: 30 }) {
  const state = createMockState()
  const columns = [
    createEngineColumn({ id: 'name', accessorKey: 'name', header: 'Name' }, 0, undefined, state),
    createEngineColumn({ id: 'age', accessorKey: 'age', header: 'Age' }, 0, undefined, state),
  ]
  const table = createMockTable(columns)
  const row = createEngineRow({
    id: 'r0',
    index: 0,
    original: data,
    depth: 0,
    table,
    columns,
    state,
  })
  return { state, columns, table, row }
}

function createMockTable(columns: EngineColumn<any>[], overrides?: Partial<EngineTable<any>>): EngineTable<any> {
  return {
    getHeaderGroups: () => [],
    getFooterGroups: () => [],
    getAllColumns: () => columns,
    getAllLeafColumns: () => columns,
    getAllFlatColumns: () => columns,
    getVisibleLeafColumns: () => columns,
    getColumn: (id: string) => columns.find(c => c.id === id),
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
// Cell creation
// ---------------------------------------------------------------------------

describe('EngineCell — basics', () => {
  it('should create cell with correct id', () => {
    const { row, columns, table } = createTestSetup()
    const cell = createEngineCell(row, columns[0], table)

    expect(cell.id).toBe('r0_name')
  })

  it('should reference row and column', () => {
    const { row, columns, table } = createTestSetup()
    const cell = createEngineCell(row, columns[0], table)

    expect(cell.row).toBe(row)
    expect(cell.column).toBe(columns[0])
  })
})

// ---------------------------------------------------------------------------
// getValue / renderValue
// ---------------------------------------------------------------------------

describe('EngineCell — getValue / renderValue', () => {
  it('should delegate getValue to row.getValue', () => {
    const { row, columns, table } = createTestSetup()
    const cell = createEngineCell(row, columns[0], table)

    expect(cell.getValue()).toBe('Alice')
  })

  it('should delegate renderValue to row.renderValue', () => {
    const { row, columns, table } = createTestSetup({ name: 'Bob', age: 25 })
    const cell = createEngineCell(row, columns[1], table)

    expect(cell.renderValue()).toBe(25)
  })

  it('renderValue should use fallback when null', () => {
    const state = createMockState()
    const columns = [
      createEngineColumn({ id: 'name', accessorKey: 'name', header: 'Name' }, 0, undefined, state),
    ]
    const table = createMockTable(columns, {
      options: { renderFallbackValue: 'N/A' },
    })
    const row = createEngineRow({
      id: 'r0',
      index: 0,
      original: { name: null },
      depth: 0,
      table,
      columns,
      state,
    })
    const cell = createEngineCell(row, columns[0], table)

    expect(cell.renderValue()).toBe('N/A')
  })
})

// ---------------------------------------------------------------------------
// getContext
// ---------------------------------------------------------------------------

describe('EngineCell — getContext', () => {
  it('should return full context object', () => {
    const { row, columns, table } = createTestSetup()
    const cell = createEngineCell(row, columns[0], table)
    const ctx = cell.getContext()

    expect(ctx.table).toBe(table)
    expect(ctx.column).toBe(columns[0])
    expect(ctx.row).toBe(row)
    expect(ctx.cell).toBe(cell)
    expect(typeof ctx.getValue).toBe('function')
    expect(typeof ctx.renderValue).toBe('function')
    expect(ctx.getValue()).toBe('Alice')
  })
})

// ---------------------------------------------------------------------------
// Grouping cells
// ---------------------------------------------------------------------------

describe('EngineCell — grouping', () => {
  it('getIsGrouped should return true for the grouping column cell', () => {
    const state = createMockState({ grouping: () => ['name'] })
    const columns = [
      createEngineColumn({ id: 'name', accessorKey: 'name', header: 'Name' }, 0, undefined, state),
      createEngineColumn({ id: 'age', accessorKey: 'age', header: 'Age' }, 0, undefined, state),
    ]
    const table = createMockTable(columns)
    const row = createEngineRow({
      id: 'r0',
      index: 0,
      original: { name: 'Alice', age: 30 },
      depth: 0,
      groupingColumnId: 'name',
      groupingValue: 'Alice',
      table,
      columns,
      state,
    })

    const nameCell = createEngineCell(row, columns[0], table)
    const ageCell = createEngineCell(row, columns[1], table)

    expect(nameCell.getIsGrouped()).toBe(true)
    expect(ageCell.getIsGrouped()).toBe(false)
  })

  it('getIsPlaceholder should return true for non-grouping cells of a grouped column', () => {
    const state = createMockState({ grouping: () => ['name'] })
    const columns = [
      createEngineColumn({ id: 'name', accessorKey: 'name', header: 'Name' }, 0, undefined, state),
      createEngineColumn({ id: 'age', accessorKey: 'age', header: 'Age' }, 0, undefined, state),
    ]
    const table = createMockTable(columns)

    // Data row under a group — not the group row itself
    const dataRow = createEngineRow({
      id: 'r1',
      index: 1,
      original: { name: 'Alice', age: 30 },
      depth: 1,
      table,
      columns,
      state,
    })

    const nameCell = createEngineCell(dataRow, columns[0], table)
    const ageCell = createEngineCell(dataRow, columns[1], table)

    // name column is grouped but this is a data row (no groupingColumnId)
    // so name cell should be a placeholder
    expect(nameCell.getIsPlaceholder()).toBe(true)
    expect(ageCell.getIsPlaceholder()).toBe(false)
  })

  it('getIsAggregated should return true for non-grouping non-placeholder cells with subRows', () => {
    const state = createMockState({ grouping: () => ['name'] })
    const columns = [
      createEngineColumn({ id: 'name', accessorKey: 'name', header: 'Name' }, 0, undefined, state),
      createEngineColumn({ id: 'age', accessorKey: 'age', header: 'Age' }, 0, undefined, state),
    ]
    const table = createMockTable(columns)

    // Group row
    const groupRow = createEngineRow({
      id: 'name:Alice',
      index: 0,
      original: { name: 'Alice', age: 30 },
      depth: 0,
      groupingColumnId: 'name',
      groupingValue: 'Alice',
      table,
      columns,
      state,
    })
    // Assign EngineRow subRows (as grouped row model would)
    const child1 = createEngineRow({
      id: '0', index: 0, original: { name: 'Alice', age: 30 }, depth: 1,
      parentId: 'name:Alice', table, columns, state,
    })
    const child2 = createEngineRow({
      id: '1', index: 1, original: { name: 'Alice', age: 31 }, depth: 1,
      parentId: 'name:Alice', table, columns, state,
    })
    groupRow.subRows = [child1, child2]

    const nameCell = createEngineCell(groupRow, columns[0], table)
    const ageCell = createEngineCell(groupRow, columns[1], table)

    // name cell: getIsGrouped=true, so NOT aggregated
    expect(nameCell.getIsAggregated()).toBe(false)

    // age cell: not grouped, not placeholder, has subRows → aggregated
    expect(ageCell.getIsAggregated()).toBe(true)
  })

  it('getIsAggregated should return false for rows without subRows', () => {
    const state = createMockState({ grouping: () => [] })
    const columns = [
      createEngineColumn({ id: 'age', accessorKey: 'age', header: 'Age' }, 0, undefined, state),
    ]
    const table = createMockTable(columns)
    const row = createEngineRow({
      id: 'r0',
      index: 0,
      original: { age: 30 },
      depth: 0,
      table,
      columns,
      state,
    })

    const cell = createEngineCell(row, columns[0], table)
    expect(cell.getIsAggregated()).toBe(false)
  })
})
