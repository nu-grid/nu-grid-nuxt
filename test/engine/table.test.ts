import { describe, expect, it } from 'vitest'

import type { StateAccessors } from '../../src/runtime/engine/types'

import { createEngineColumn } from '../../src/runtime/engine/column'
import { createNuGridTable } from '../../src/runtime/engine/table'

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

const testColumnDefs = [
  { id: 'name', accessorKey: 'name', header: 'Name' },
  { id: 'age', accessorKey: 'age', header: 'Age' },
  { id: 'email', accessorKey: 'email', header: 'Email' },
]

const testData = [
  { name: 'Alice', age: 30, email: 'alice@test.com' },
  { name: 'Bob', age: 25, email: 'bob@test.com' },
  { name: 'Charlie', age: 35, email: 'charlie@test.com' },
]

// ---------------------------------------------------------------------------
// Table creation
// ---------------------------------------------------------------------------

describe('createNuGridTable — basics', () => {
  it('should create a table with columns', () => {
    const state = createMockState()
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
    })

    expect(table.getAllLeafColumns()).toHaveLength(3)
    expect(table.getAllLeafColumns()[0].id).toBe('name')
  })

  it('should create header groups', () => {
    const state = createMockState()
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
    })

    const groups = table.getHeaderGroups()
    expect(groups).toHaveLength(1) // flat columns = 1 group
    expect(groups[0].headers).toHaveLength(3)
  })

  it('header.column.getCanResize() should return true by default', () => {
    const state = createMockState()
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
    })

    const headers = table.getHeaderGroups()[0].headers
    for (const header of headers) {
      expect(header.column.getCanResize()).toBe(true)
    }
  })

  it('should create footer groups (reversed header groups)', () => {
    const state = createMockState()
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
    })

    const footerGroups = table.getFooterGroups()
    const headerGroups = table.getHeaderGroups()
    expect(footerGroups).toHaveLength(headerGroups.length)
  })

  it('should create row model from data', () => {
    const state = createMockState()
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
    })

    const model = table.getRowModel()
    expect(model.rows).toHaveLength(3)
    expect(model.rows[0].original).toBe(testData[0])
    expect(model.rows[0].getValue('name')).toBe('Alice')
  })
})

// ---------------------------------------------------------------------------
// Boolean option defaults — Vue boolean prop casting regression guard
// ---------------------------------------------------------------------------

describe('createNuGridTable — boolean option defaults', () => {
  // Vue casts absent boolean props to `false` instead of `undefined`.
  // These tests ensure the engine treats `undefined` as "not set" and defaults
  // to enabled, matching the behavior when the option is omitted entirely.

  it('enableColumnResizing defaults to true when undefined', () => {
    const state = createMockState()
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
      enableColumnResizing: undefined,
    })
    expect(table.options.enableColumnResizing).toBeUndefined()
    for (const col of table.getAllLeafColumns()) {
      expect(col.getCanResize()).toBe(true)
    }
  })

  it('enableColumnResizing=false disables resizing', () => {
    const state = createMockState()
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
      enableColumnResizing: false,
    })
    for (const col of table.getAllLeafColumns()) {
      expect(col.getCanResize()).toBe(false)
    }
  })

  it('enableSorting defaults to true when undefined', () => {
    const state = createMockState()
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
      enableSorting: undefined,
    })
    expect(table.options.enableSorting).toBeUndefined()
    for (const col of table.getAllLeafColumns()) {
      expect(col.getCanSort()).toBe(true)
    }
  })

  it('enableSorting=false disables sorting', () => {
    const state = createMockState()
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
      enableSorting: false,
    })
    for (const col of table.getAllLeafColumns()) {
      expect(col.getCanSort()).toBe(false)
    }
  })

  it('enableMultiSort defaults to true when undefined', () => {
    const state = createMockState()
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
      enableMultiSort: undefined,
    })
    expect(table.options.enableMultiSort).toBeUndefined()
  })

  it('enableExpanding defaults to true when undefined', () => {
    const state = createMockState()
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
      enableExpanding: undefined,
    })
    expect(table.options.enableExpanding).toBeUndefined()
  })

  it('omitting boolean options entirely behaves same as undefined', () => {
    const state = createMockState()
    const withOmitted = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
    })
    const withUndefined = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
      enableColumnResizing: undefined,
      enableSorting: undefined,
      enableMultiSort: undefined,
      enableExpanding: undefined,
    })

    // Both should produce identical feature flag behavior
    for (let i = 0; i < testColumnDefs.length; i++) {
      const omittedCol = withOmitted.getAllLeafColumns()[i]
      const undefinedCol = withUndefined.getAllLeafColumns()[i]
      expect(omittedCol.getCanResize()).toBe(undefinedCol.getCanResize())
      expect(omittedCol.getCanSort()).toBe(undefinedCol.getCanSort())
    }
  })
})

// ---------------------------------------------------------------------------
// Column access
// ---------------------------------------------------------------------------

describe('createNuGridTable — column access', () => {
  it('getColumn should return column by ID', () => {
    const state = createMockState()
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
    })

    const col = table.getColumn('age')
    expect(col).toBeDefined()
    expect(col!.id).toBe('age')
  })

  it('getColumn should return undefined for non-existent ID', () => {
    const state = createMockState()
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
    })

    expect(table.getColumn('nonexistent')).toBeUndefined()
  })

  it('getAllFlatColumns should include group columns', () => {
    const state = createMockState()
    const table = createNuGridTable({
      data: testData,
      columnDefs: [
        {
          id: 'info',
          header: 'Info',
          columns: [
            { id: 'name', accessorKey: 'name', header: 'Name' },
            { id: 'age', accessorKey: 'age', header: 'Age' },
          ],
        },
      ],
      state,
    })

    // getAllFlatColumns includes group parent + leaves
    expect(table.getAllFlatColumns().length).toBe(3) // info + name + age
    expect(table.getAllLeafColumns().length).toBe(2) // name + age
  })

  it('getVisibleLeafColumns should respect visibility', () => {
    const state = createMockState({
      columnVisibility: () => ({ email: false }),
    })
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
    })

    const visible = table.getVisibleLeafColumns()
    expect(visible).toHaveLength(2)
    expect(visible.map((c) => c.id)).toEqual(['name', 'age'])
  })
})

// ---------------------------------------------------------------------------
// Row model
// ---------------------------------------------------------------------------

describe('createNuGridTable — row model', () => {
  it('getRow should find row by ID', () => {
    const state = createMockState()
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
    })

    const row = table.getRow('1')
    expect(row).toBeDefined()
    expect(row!.original).toBe(testData[1])
  })

  it('should use custom getRowId', () => {
    const state = createMockState()
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
      getRowId: (row: any) => row.name,
    })

    const row = table.getRow('Bob')
    expect(row).toBeDefined()
    expect(row!.original.name).toBe('Bob')
  })

  it('getSelectedRowModel should filter by selection', () => {
    const state = createMockState({
      rowSelection: () => ({ '1': true }),
    })
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
    })

    const selected = table.getSelectedRowModel()
    expect(selected.rows).toHaveLength(1)
    expect(selected.rows[0].id).toBe('1')
  })
})

// ---------------------------------------------------------------------------
// Sizing
// ---------------------------------------------------------------------------

describe('createNuGridTable — sizing', () => {
  it('getTotalSize should sum visible column sizes', () => {
    const state = createMockState({
      columnSizing: () => ({ name: 200, age: 100, email: 150 }),
    })
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
    })

    expect(table.getTotalSize()).toBe(450)
  })

  it('getTotalSize should use default 150 for unsized columns', () => {
    const state = createMockState()
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
    })

    // 3 columns × 150 default = 450
    expect(table.getTotalSize()).toBe(450)
  })
})

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

describe('createNuGridTable — state', () => {
  it('getState should return all state values', () => {
    const state = createMockState({
      sorting: () => [{ id: 'name', desc: false }],
    })
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
    })

    const tableState = table.getState()
    expect(tableState.sorting).toEqual([{ id: 'name', desc: false }])
  })
})

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

describe('createNuGridTable — grouping', () => {
  it('should group rows when grouping state is set', () => {
    const state = createMockState({
      grouping: () => ['age'],
    })
    const data = [
      { name: 'Alice', age: 30, email: 'a@test.com' },
      { name: 'Bob', age: 30, email: 'b@test.com' },
      { name: 'Charlie', age: 25, email: 'c@test.com' },
    ]
    const table = createNuGridTable({
      data,
      columnDefs: testColumnDefs,
      state,
    })

    const model = table.getRowModel()
    // Should have 2 group rows: age 30, age 25
    expect(model.rows).toHaveLength(2)
    expect(model.rows[0].getIsGrouped()).toBe(true)
    expect(model.rows[0].groupingValue).toBe('30')
    expect(model.rows[0].subRows).toHaveLength(2) // Alice, Bob
    expect(model.rows[1].groupingValue).toBe('25')
    expect(model.rows[1].subRows).toHaveLength(1) // Charlie
  })
})

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

describe('createNuGridTable — options', () => {
  it('should expose options with meta', () => {
    const state = createMockState()
    const table = createNuGridTable({
      data: testData,
      columnDefs: testColumnDefs,
      state,
      meta: { customProp: 'hello' },
    })

    expect(table.options.meta).toEqual({ customProp: 'hello' })
  })
})
