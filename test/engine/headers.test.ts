import { describe, expect, it } from 'vitest'

import { createEngineColumn } from '../../src/runtime/engine/column'
import { buildEngineHeaderGroups } from '../../src/runtime/engine/headers'
import type { EngineColumn, StateAccessors } from '../../src/runtime/engine/types'

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

function makeColumns(defs: any[], state?: StateAccessors): EngineColumn<any>[] {
  const s = state ?? createMockState()
  return defs.map(def => createEngineColumn(def, 0, undefined, s))
}

// ---------------------------------------------------------------------------
// Flat columns (no column groups)
// ---------------------------------------------------------------------------

describe('buildEngineHeaderGroups — flat columns', () => {
  it('should create a single header group for flat columns', () => {
    const state = createMockState()
    const cols = makeColumns([
      { id: 'name', accessorKey: 'name', header: 'Name' },
      { id: 'age', accessorKey: 'age', header: 'Age' },
    ], state)

    const groups = buildEngineHeaderGroups(cols, cols, null as any)

    expect(groups).toHaveLength(1)
    expect(groups[0].headers).toHaveLength(2)
    expect(groups[0].headers[0].id).toBe('name')
    expect(groups[0].headers[1].id).toBe('age')
    expect(groups[0].depth).toBe(0)
  })

  it('should set correct colSpan for leaf headers', () => {
    const cols = makeColumns([
      { id: 'a', accessorKey: 'a', header: 'A' },
      { id: 'b', accessorKey: 'b', header: 'B' },
    ])

    const groups = buildEngineHeaderGroups(cols, cols, null as any)

    expect(groups[0].headers[0].colSpan).toBe(1)
    expect(groups[0].headers[1].colSpan).toBe(1)
  })

  it('should mark headers as not placeholder', () => {
    const cols = makeColumns([
      { id: 'a', accessorKey: 'a', header: 'A' },
    ])

    const groups = buildEngineHeaderGroups(cols, cols, null as any)

    expect(groups[0].headers[0].isPlaceholder).toBe(false)
  })

  it('should set headerGroup back-reference', () => {
    const cols = makeColumns([
      { id: 'a', accessorKey: 'a', header: 'A' },
    ])

    const groups = buildEngineHeaderGroups(cols, cols, null as any)

    expect(groups[0].headers[0].headerGroup).toBe(groups[0])
  })
})

// ---------------------------------------------------------------------------
// Nested column groups
// ---------------------------------------------------------------------------

describe('buildEngineHeaderGroups — nested column groups', () => {
  it('should create multiple header groups for nested columns', () => {
    const state = createMockState()
    const parentDef = {
      id: 'info',
      header: 'Info',
      columns: [
        { id: 'name', accessorKey: 'name', header: 'Name' },
        { id: 'age', accessorKey: 'age', header: 'Age' },
      ],
    }
    // Build the parent column (which builds children internally)
    const allColumns = [createEngineColumn(parentDef, 0, undefined, state)]
    const leafColumns = allColumns[0].getLeafColumns()

    const groups = buildEngineHeaderGroups(allColumns, leafColumns, null as any)

    // Should have 2 header groups: top-level (group header) and leaf level
    expect(groups).toHaveLength(2)

    // Top group header should have colSpan = 2
    const topGroup = groups[0]
    expect(topGroup.headers).toHaveLength(1)
    expect(topGroup.headers[0].colSpan).toBe(2)
    expect(topGroup.headers[0].column.id).toBe('info')

    // Bottom group should have 2 leaf headers
    const bottomGroup = groups[1]
    expect(bottomGroup.headers).toHaveLength(2)
    expect(bottomGroup.headers[0].column.id).toBe('name')
    expect(bottomGroup.headers[1].column.id).toBe('age')
  })

  it('should create placeholder headers for uneven nesting', () => {
    const state = createMockState()
    const cols = [
      createEngineColumn({
        id: 'info',
        header: 'Info',
        columns: [
          { id: 'name', accessorKey: 'name', header: 'Name' },
          { id: 'age', accessorKey: 'age', header: 'Age' },
        ],
      }, 0, undefined, state),
      createEngineColumn(
        { id: 'status', accessorKey: 'status', header: 'Status' },
        0, undefined, state,
      ),
    ]
    const leafColumns = cols.flatMap(c => c.getLeafColumns())

    const groups = buildEngineHeaderGroups(cols, leafColumns, null as any)

    // Should have 2 header groups
    expect(groups).toHaveLength(2)

    // Top row: "Info" (colSpan=2) + "Status" placeholder
    const topHeaders = groups[0].headers
    expect(topHeaders).toHaveLength(2)
    expect(topHeaders[0].column.id).toBe('info')
    expect(topHeaders[0].isPlaceholder).toBe(false)
    expect(topHeaders[1].column.id).toBe('status')
    expect(topHeaders[1].isPlaceholder).toBe(true)

    // Bottom row: "Name", "Age", "Status"
    const bottomHeaders = groups[1].headers
    expect(bottomHeaders).toHaveLength(3)
    expect(bottomHeaders[0].column.id).toBe('name')
    expect(bottomHeaders[1].column.id).toBe('age')
    expect(bottomHeaders[2].column.id).toBe('status')
  })
})

// ---------------------------------------------------------------------------
// getLeafHeaders
// ---------------------------------------------------------------------------

describe('header.getLeafHeaders()', () => {
  it('should return self for leaf header', () => {
    const cols = makeColumns([
      { id: 'a', accessorKey: 'a', header: 'A' },
    ])
    const groups = buildEngineHeaderGroups(cols, cols, null as any)
    const header = groups[0].headers[0]

    expect(header.getLeafHeaders().map(h => h.column.id)).toEqual(['a'])
  })

  it('should return leaf headers for group header', () => {
    const state = createMockState()
    const cols = [createEngineColumn({
      id: 'info',
      header: 'Info',
      columns: [
        { id: 'name', accessorKey: 'name', header: 'Name' },
        { id: 'age', accessorKey: 'age', header: 'Age' },
      ],
    }, 0, undefined, state)]
    const leafColumns = cols[0].getLeafColumns()

    const groups = buildEngineHeaderGroups(cols, leafColumns, null as any)
    const groupHeader = groups[0].headers[0]

    // TanStack's getLeafHeaders uses DFS post-order: children first, then self
    expect(groupHeader.getLeafHeaders().map(h => h.column.id)).toEqual(['name', 'age', 'info'])
  })
})

// ---------------------------------------------------------------------------
// getContext
// ---------------------------------------------------------------------------

describe('header.getContext()', () => {
  it('should return context with header and column', () => {
    const cols = makeColumns([
      { id: 'a', accessorKey: 'a', header: 'A' },
    ])
    const mockTable = { mock: true } as any
    const groups = buildEngineHeaderGroups(cols, cols, mockTable)
    const header = groups[0].headers[0]
    const ctx = header.getContext()

    expect(ctx.header).toBe(header)
    expect(ctx.column).toBe(header.column)
    expect(ctx.table).toBe(mockTable)
  })
})

// ---------------------------------------------------------------------------
// getSize
// ---------------------------------------------------------------------------

describe('header.getSize()', () => {
  it('should delegate to column.getSize() for leaf headers', () => {
    const state = createMockState({
      columnSizing: () => ({ a: 200 }),
    })
    const cols = makeColumns([
      { id: 'a', accessorKey: 'a', header: 'A' },
    ], state)
    const groups = buildEngineHeaderGroups(cols, cols, null as any)

    expect(groups[0].headers[0].getSize()).toBe(200)
  })

  it('should sum child sizes for group headers', () => {
    const state = createMockState({
      columnSizing: () => ({ name: 100, age: 200 }),
    })
    const cols = [createEngineColumn({
      id: 'info',
      header: 'Info',
      columns: [
        { id: 'name', accessorKey: 'name', header: 'Name' },
        { id: 'age', accessorKey: 'age', header: 'Age' },
      ],
    }, 0, undefined, state)]
    const leafColumns = cols[0].getLeafColumns()

    const groups = buildEngineHeaderGroups(cols, leafColumns, null as any)
    const groupHeader = groups[0].headers[0]

    // Group header size = sum of visible leaf header sizes
    expect(groupHeader.getSize()).toBe(300)
  })
})

// ---------------------------------------------------------------------------
// Footer groups
// ---------------------------------------------------------------------------

describe('footer groups', () => {
  it('should be reversed header groups', () => {
    const state = createMockState()
    const cols = [createEngineColumn({
      id: 'info',
      header: 'Info',
      columns: [
        { id: 'name', accessorKey: 'name', header: 'Name' },
        { id: 'age', accessorKey: 'age', header: 'Age' },
      ],
    }, 0, undefined, state)]
    const leafColumns = cols[0].getLeafColumns()

    const headerGroups = buildEngineHeaderGroups(cols, leafColumns, null as any)
    // Footer groups are just reversed
    const footerGroups = [...headerGroups].reverse()

    expect(footerGroups[0].depth).toBe(headerGroups[headerGroups.length - 1].depth)
    expect(footerGroups[footerGroups.length - 1].depth).toBe(headerGroups[0].depth)
  })
})
