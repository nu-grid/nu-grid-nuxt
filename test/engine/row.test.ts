import { describe, expect, it, vi } from 'vitest'

import type {
  EngineColumn,
  EngineRow,
  EngineTable,
  StateAccessors,
} from '../../src/runtime/engine/types'

import { createEngineColumn } from '../../src/runtime/engine/column'
import { createEngineRow } from '../../src/runtime/engine/row'

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
    createEngineColumn({ id: 'email', accessorKey: 'email', header: 'Email' }, 0, undefined, s),
  ]
}

function createMockTable(overrides?: Partial<EngineTable<any>>): EngineTable<any> {
  return {
    getHeaderGroups: () => [],
    getFooterGroups: () => [],
    getAllColumns: () => [],
    getAllLeafColumns: () => [],
    getAllFlatColumns: () => [],
    getVisibleLeafColumns: () => [],
    getColumn: () => undefined,
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
// getValue
// ---------------------------------------------------------------------------

describe('EngineRow — getValue', () => {
  it('should resolve value via accessorKey', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: '0',
      index: 0,
      original: { name: 'Alice', age: 30, email: 'alice@test.com' },
      depth: 0,
      table,
      columns,
      state,
    })

    expect(row.getValue('name')).toBe('Alice')
    expect(row.getValue('age')).toBe(30)
    expect(row.getValue('email')).toBe('alice@test.com')
  })

  it('should cache values', () => {
    const state = createMockState()
    const accessorFn = vi.fn((row: any) => row.name)
    const columns = [
      createEngineColumn({ id: 'name', accessorFn, header: 'Name' }, 0, undefined, state),
    ]
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: '0',
      index: 0,
      original: { name: 'Alice' },
      depth: 0,
      table,
      columns,
      state,
    })

    row.getValue('name')
    row.getValue('name')
    expect(accessorFn).toHaveBeenCalledTimes(1)
  })

  it('should support deep accessorKey', () => {
    const state = createMockState()
    const columns = [
      createEngineColumn(
        { id: 'address_city', accessorKey: 'address.city', header: 'City' },
        0,
        undefined,
        state,
      ),
    ]
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: '0',
      index: 0,
      original: { address: { city: 'NYC' } },
      depth: 0,
      table,
      columns,
      state,
    })

    expect(row.getValue('address_city')).toBe('NYC')
  })

  it('should return undefined for column without accessorFn', () => {
    const state = createMockState()
    const columns = [createEngineColumn({ id: 'actions', header: 'Actions' }, 0, undefined, state)]
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: '0',
      index: 0,
      original: { name: 'Alice' },
      depth: 0,
      table,
      columns,
      state,
    })

    expect(row.getValue('actions')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// renderValue
// ---------------------------------------------------------------------------

describe('EngineRow — renderValue', () => {
  it('should return getValue result', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: '0',
      index: 0,
      original: { name: 'Alice', age: 30, email: 'alice@test.com' },
      depth: 0,
      table,
      columns,
      state,
    })

    expect(row.renderValue('name')).toBe('Alice')
  })

  it('should return renderFallbackValue when value is nullish', () => {
    const state = createMockState()
    const columns = [
      createEngineColumn({ id: 'name', accessorKey: 'name', header: 'Name' }, 0, undefined, state),
    ]
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
      options: { renderFallbackValue: '—' },
    })

    const row = createEngineRow({
      id: '0',
      index: 0,
      original: { name: null },
      depth: 0,
      table,
      columns,
      state,
    })

    expect(row.renderValue('name')).toBe('—')
  })
})

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

describe('EngineRow — selection', () => {
  it('should return false when not selected', () => {
    const state = createMockState({ rowSelection: () => ({}) })
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: '0',
      index: 0,
      original: { name: 'Alice', age: 30, email: 'a@b.c' },
      depth: 0,
      table,
      columns,
      state,
    })

    expect(row.getIsSelected()).toBe(false)
  })

  it('should return true when selected', () => {
    const state = createMockState({ rowSelection: () => ({ '0': true }) })
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: '0',
      index: 0,
      original: { name: 'Alice', age: 30, email: 'a@b.c' },
      depth: 0,
      table,
      columns,
      state,
    })

    expect(row.getIsSelected()).toBe(true)
  })

  it('should toggle selection on', () => {
    let selection: Record<string, boolean> = {}
    const state = createMockState({
      rowSelection: () => selection,
      setRowSelection: (updater: any) => {
        selection = typeof updater === 'function' ? updater(selection) : updater
      },
    })
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: 'r1',
      index: 0,
      original: { name: 'Alice', age: 30, email: 'a@b.c' },
      depth: 0,
      table,
      columns,
      state,
    })

    row.toggleSelected(true)
    expect(selection).toEqual({ r1: true })
  })

  it('should toggle selection off', () => {
    let selection: Record<string, boolean> = { r1: true }
    const state = createMockState({
      rowSelection: () => selection,
      setRowSelection: (updater: any) => {
        selection = typeof updater === 'function' ? updater(selection) : updater
      },
    })
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: 'r1',
      index: 0,
      original: { name: 'Alice', age: 30, email: 'a@b.c' },
      depth: 0,
      table,
      columns,
      state,
    })

    row.toggleSelected(false)
    expect(selection.r1).toBeUndefined()
  })

  it('should toggle when no explicit value passed', () => {
    let selection: Record<string, boolean> = {}
    const state = createMockState({
      rowSelection: () => selection,
      setRowSelection: (updater: any) => {
        selection = typeof updater === 'function' ? updater(selection) : updater
      },
    })
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: 'r1',
      index: 0,
      original: { name: 'Alice', age: 30, email: 'a@b.c' },
      depth: 0,
      table,
      columns,
      state,
    })

    row.toggleSelected()
    expect(selection).toEqual({ r1: true })

    row.toggleSelected()
    expect(selection.r1).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Expansion
// ---------------------------------------------------------------------------

describe('EngineRow — expansion', () => {
  it('should return false when not expanded', () => {
    const state = createMockState({ expanded: () => ({}) })
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: '0',
      index: 0,
      original: { name: 'Alice', age: 30, email: 'a@b.c' },
      depth: 0,
      table,
      columns,
      state,
    })

    expect(row.getIsExpanded()).toBe(false)
  })

  it('should return true when expanded is true (expand all)', () => {
    const state = createMockState({ expanded: () => true })
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: '0',
      index: 0,
      original: { name: 'Alice', age: 30, email: 'a@b.c' },
      depth: 0,
      table,
      columns,
      state,
    })

    expect(row.getIsExpanded()).toBe(true)
  })

  it('should return true when row ID is in expanded state', () => {
    const state = createMockState({ expanded: () => ({ r1: true }) })
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: 'r1',
      index: 0,
      original: { name: 'Alice', age: 30, email: 'a@b.c' },
      depth: 0,
      table,
      columns,
      state,
    })

    expect(row.getIsExpanded()).toBe(true)
  })

  it('should toggle expansion', () => {
    let expanded: Record<string, boolean> | true = {}
    const state = createMockState({
      expanded: () => expanded,
      setExpanded: (updater: any) => {
        expanded = typeof updater === 'function' ? updater(expanded) : updater
      },
    })
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: 'r1',
      index: 0,
      original: { name: 'Alice', age: 30, email: 'a@b.c' },
      depth: 0,
      table,
      columns,
      state,
    })
    // Simulate group row with subRows (set after creation, like core row model does)
    const childRow = createEngineRow({
      id: 'c1',
      index: 0,
      original: { name: 'Sub', age: 1, email: 's@b.c' },
      depth: 1,
      parentId: 'r1',
      table,
      columns,
      state,
    })
    row.subRows = [childRow]

    row.toggleExpanded()
    expect(expanded).toEqual({ r1: true })

    row.toggleExpanded()
    expect((expanded as Record<string, boolean>).r1).toBeUndefined()
  })

  it('getCanExpand should be true when row has subRows', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const rowWithSubs = createEngineRow({
      id: 'r1',
      index: 0,
      original: { name: 'Alice', age: 30, email: 'a@b.c' },
      depth: 0,
      table,
      columns,
      state,
    })
    // Assign subRows after creation (as core row model would)
    const child = createEngineRow({
      id: 'c1',
      index: 0,
      original: { name: 'Sub', age: 1, email: 's@b.c' },
      depth: 1,
      parentId: 'r1',
      table,
      columns,
      state,
    })
    rowWithSubs.subRows = [child]
    expect(rowWithSubs.getCanExpand()).toBe(true)

    const rowWithoutSubs = createEngineRow({
      id: 'r2',
      index: 1,
      original: { name: 'Bob', age: 25, email: 'b@b.c' },
      depth: 0,
      table,
      columns,
      state,
    })
    expect(rowWithoutSubs.getCanExpand()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

describe('EngineRow — grouping', () => {
  it('should not be grouped by default', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: '0',
      index: 0,
      original: { name: 'Alice', age: 30, email: 'a@b.c' },
      depth: 0,
      table,
      columns,
      state,
    })

    expect(row.getIsGrouped()).toBe(false)
  })

  it('should be grouped when groupingColumnId is set', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: '0',
      index: 0,
      original: { name: 'Alice', age: 30, email: 'a@b.c' },
      depth: 0,
      groupingColumnId: 'name',
      groupingValue: 'Alice',
      table,
      columns,
      state,
    })

    expect(row.getIsGrouped()).toBe(true)
    expect(row.groupingColumnId).toBe('name')
    expect(row.groupingValue).toBe('Alice')
  })

  it('should return grouping value via getGroupingValue', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: '0',
      index: 0,
      original: { name: 'Alice', age: 30, email: 'a@b.c' },
      depth: 0,
      table,
      columns,
      state,
    })

    // Pre-populate grouping values cache
    row._groupingValuesCache.name = 'Alice'

    expect(row.getGroupingValue('name')).toBe('Alice')
  })
})

// ---------------------------------------------------------------------------
// Cells
// ---------------------------------------------------------------------------

describe('EngineRow — cells', () => {
  it('getAllCells should return a cell for each column', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: '0',
      index: 0,
      original: { name: 'Alice', age: 30, email: 'alice@test.com' },
      depth: 0,
      table,
      columns,
      state,
    })

    const cells = row.getAllCells()
    expect(cells).toHaveLength(3)
    expect(cells.map((c) => c.column.id)).toEqual(['name', 'age', 'email'])
  })

  it('getVisibleCells should filter by visibility', () => {
    const state = createMockState({
      columnVisibility: () => ({ email: false }),
    })
    const columns = createTestColumns(state)
    const visibleColumns = columns.filter((c) => c.getIsVisible())
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => visibleColumns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: '0',
      index: 0,
      original: { name: 'Alice', age: 30, email: 'alice@test.com' },
      depth: 0,
      table,
      columns,
      state,
    })

    const cells = row.getVisibleCells()
    expect(cells).toHaveLength(2)
    expect(cells.map((c) => c.column.id)).toEqual(['name', 'age'])
  })

  it('cell IDs should be formatted as rowId_columnId', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: 'r5',
      index: 5,
      original: { name: 'Alice', age: 30, email: 'alice@test.com' },
      depth: 0,
      table,
      columns,
      state,
    })

    const cells = row.getAllCells()
    expect(cells[0].id).toBe('r5_name')
    expect(cells[1].id).toBe('r5_age')
    expect(cells[2].id).toBe('r5_email')
  })
})

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

describe('EngineRow — navigation', () => {
  it('getLeafRows should flatten subRows', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const child1 = createEngineRow({
      id: 'c1',
      index: 0,
      original: { name: 'Child1', age: 5, email: 'c1@b.c' },
      depth: 1,
      parentId: 'p1',
      table,
      columns,
      state,
    })
    const child2 = createEngineRow({
      id: 'c2',
      index: 1,
      original: { name: 'Child2', age: 6, email: 'c2@b.c' },
      depth: 1,
      parentId: 'p1',
      table,
      columns,
      state,
    })

    const parent = createEngineRow({
      id: 'p1',
      index: 0,
      original: { name: 'Parent', age: 35, email: 'p@b.c' },
      depth: 0,
      table,
      columns,
      state,
    })
    parent.subRows = [child1, child2]

    expect(parent.getLeafRows().map((r) => r.id)).toEqual(['c1', 'c2'])
  })

  it('getParentRow should return parent via table.getRow', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const parentRow = createEngineRow({
      id: 'p1',
      index: 0,
      original: { name: 'Parent', age: 35, email: 'p@b.c' },
      depth: 0,
      table: null as any, // will set below
      columns,
      state,
    })

    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
      getRow: (id: string) => (id === 'p1' ? parentRow : undefined),
    })

    const child = createEngineRow({
      id: 'c1',
      index: 0,
      original: { name: 'Child', age: 5, email: 'c@b.c' },
      depth: 1,
      parentId: 'p1',
      table,
      columns,
      state,
    })

    expect(child.getParentRow()).toBe(parentRow)
  })

  it('getParentRow should return undefined when no parent', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: '0',
      index: 0,
      original: { name: 'Alice', age: 30, email: 'a@b.c' },
      depth: 0,
      table,
      columns,
      state,
    })

    expect(row.getParentRow()).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// SubRows handling
// ---------------------------------------------------------------------------

describe('EngineRow — subRows', () => {
  it('should default to empty subRows', () => {
    const state = createMockState()
    const columns = createTestColumns(state)
    const table = createMockTable({
      getAllLeafColumns: () => columns,
      getVisibleLeafColumns: () => columns,
      getColumn: (id: string) => columns.find((c) => c.id === id),
    })

    const row = createEngineRow({
      id: '0',
      index: 0,
      original: { name: 'Alice', age: 30, email: 'a@b.c' },
      depth: 0,
      table,
      columns,
      state,
    })

    expect(row.subRows).toEqual([])
  })
})
