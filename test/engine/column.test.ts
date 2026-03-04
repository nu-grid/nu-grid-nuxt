import { describe, expect, it } from 'vitest'

import { createEngineColumn } from '../../src/runtime/engine/column'
import type { EngineColumn, StateAccessors } from '../../src/runtime/engine/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** TanStack's default column sizing constants */
const TS_DEFAULT_SIZE = 150
const TS_DEFAULT_MIN = 20
const TS_DEFAULT_MAX = Number.MAX_SAFE_INTEGER

/**
 * TanStack's exact getSize() formula (from ColumnSizing.ts lines 262-272)
 */
function tanstackGetSize(
  columnId: string,
  columnSizing: Record<string, number>,
  columnDef: { size?: number; minSize?: number; maxSize?: number },
): number {
  const columnSize = columnSizing[columnId]
  return Math.min(
    Math.max(
      columnDef.minSize ?? TS_DEFAULT_MIN,
      columnSize ?? columnDef.size ?? TS_DEFAULT_SIZE,
    ),
    columnDef.maxSize ?? TS_DEFAULT_MAX,
  )
}

/**
 * TanStack's exact getCanResize() formula (from ColumnSizing.ts lines 305-310)
 */
function tanstackGetCanResize(
  columnDef: { enableResizing?: boolean },
  tableEnableResizing?: boolean,
): boolean {
  return (
    (columnDef.enableResizing ?? true)
    && (tableEnableResizing ?? true)
  )
}

function createMockStateAccessors(overrides?: Partial<StateAccessors>): StateAccessors {
  const columns: EngineColumn<any>[] = []
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
    getVisibleLeafColumns: () => columns,
    getLeftVisibleLeafColumns: () => [],
    getRightVisibleLeafColumns: () => [],
    getCenterVisibleLeafColumns: () => columns,
    ...overrides,
  }
}

function createTestColumn(
  id: string,
  def: Record<string, any> = {},
  stateAccessors?: StateAccessors,
): EngineColumn<any> {
  const fullDef = {
    id,
    accessorKey: id,
    header: id,
    ...def,
  }
  return createEngineColumn(
    fullDef,
    0,
    undefined,
    stateAccessors ?? createMockStateAccessors(),
  )
}

// ---------------------------------------------------------------------------
// getSize
// ---------------------------------------------------------------------------

describe('column.getSize()', () => {
  it('should return sizing override from state', () => {
    const state = createMockStateAccessors({
      columnSizing: () => ({ name: 200 }),
    })
    const col = createTestColumn('name', {}, state)
    expect(col.getSize()).toBe(200)
    expect(col.getSize()).toBe(tanstackGetSize('name', { name: 200 }, {}))
  })

  it('should fall back to columnDef.size', () => {
    const col = createTestColumn('name', { size: 300 })
    expect(col.getSize()).toBe(300)
    expect(col.getSize()).toBe(tanstackGetSize('name', {}, { size: 300 }))
  })

  it('should fall back to default 150', () => {
    const col = createTestColumn('name')
    expect(col.getSize()).toBe(150)
    expect(col.getSize()).toBe(tanstackGetSize('name', {}, {}))
  })

  it('should clamp to minSize', () => {
    const state = createMockStateAccessors({
      columnSizing: () => ({ name: 5 }),
    })
    const col = createTestColumn('name', { minSize: 50 }, state)
    expect(col.getSize()).toBe(50)
    expect(col.getSize()).toBe(tanstackGetSize('name', { name: 5 }, { minSize: 50 }))
  })

  it('should clamp to maxSize', () => {
    const state = createMockStateAccessors({
      columnSizing: () => ({ name: 500 }),
    })
    const col = createTestColumn('name', { maxSize: 300 }, state)
    expect(col.getSize()).toBe(300)
    expect(col.getSize()).toBe(tanstackGetSize('name', { name: 500 }, { maxSize: 300 }))
  })

  it('should use default minSize of 20', () => {
    const state = createMockStateAccessors({
      columnSizing: () => ({ name: 10 }),
    })
    const col = createTestColumn('name', {}, state)
    expect(col.getSize()).toBe(20)
    expect(col.getSize()).toBe(tanstackGetSize('name', { name: 10 }, {}))
  })

  it('should match TanStack for various scenarios', () => {
    const scenarios = [
      { sizing: {}, def: {}, expected: 150 },
      { sizing: { x: 100 }, def: {}, expected: 100 },
      { sizing: {}, def: { size: 200 }, expected: 200 },
      { sizing: { x: 0 }, def: { minSize: 50 }, expected: 50 },
      { sizing: { x: 999 }, def: { maxSize: 400 }, expected: 400 },
      { sizing: {}, def: { size: 10, minSize: 50 }, expected: 50 },
    ]

    for (const { sizing, def, expected } of scenarios) {
      const state = createMockStateAccessors({ columnSizing: () => sizing })
      const col = createTestColumn('x', def, state)
      expect(col.getSize()).toBe(expected)
      expect(col.getSize()).toBe(tanstackGetSize('x', sizing, def))
    }
  })
})

// ---------------------------------------------------------------------------
// getCanResize
// ---------------------------------------------------------------------------

describe('column.getCanResize()', () => {
  it('should return true by default', () => {
    const col = createTestColumn('name')
    expect(col.getCanResize()).toBe(true)
    expect(col.getCanResize()).toBe(tanstackGetCanResize({}))
  })

  it('should return false when column disables resizing', () => {
    const col = createTestColumn('name', { enableResizing: false })
    expect(col.getCanResize()).toBe(false)
    expect(col.getCanResize()).toBe(tanstackGetCanResize({ enableResizing: false }))
  })

  it('should return false when table disables resizing', () => {
    const state = createMockStateAccessors()
    // Table-level option passed via engine options, not state
    const col = createEngineColumn(
      { id: 'name', accessorKey: 'name', header: 'name' },
      0,
      undefined,
      state,
      { enableColumnResizing: false },
    )
    expect(col.getCanResize()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getIsResizing
// ---------------------------------------------------------------------------

describe('column.getIsResizing()', () => {
  it('should return false when not resizing', () => {
    const col = createTestColumn('name')
    expect(col.getIsResizing()).toBe(false)
  })

  it('should return true when this column is resizing', () => {
    const state = createMockStateAccessors({
      columnSizingInfo: () => ({
        columnSizingStart: [],
        deltaOffset: null,
        deltaPercentage: null,
        isResizingColumn: 'name',
        startOffset: null,
        startSize: null,
      }),
    })
    const col = createTestColumn('name', {}, state)
    expect(col.getIsResizing()).toBe(true)
  })

  it('should return false when a different column is resizing', () => {
    const state = createMockStateAccessors({
      columnSizingInfo: () => ({
        columnSizingStart: [],
        deltaOffset: null,
        deltaPercentage: null,
        isResizingColumn: 'other',
        startOffset: null,
        startSize: null,
      }),
    })
    const col = createTestColumn('name', {}, state)
    expect(col.getIsResizing()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getIsVisible
// ---------------------------------------------------------------------------

describe('column.getIsVisible()', () => {
  it('should return true by default', () => {
    const col = createTestColumn('name')
    expect(col.getIsVisible()).toBe(true)
  })

  it('should return false when hidden in visibility state', () => {
    const state = createMockStateAccessors({
      columnVisibility: () => ({ name: false }),
    })
    const col = createTestColumn('name', {}, state)
    expect(col.getIsVisible()).toBe(false)
  })

  it('should return true when explicitly visible', () => {
    const state = createMockStateAccessors({
      columnVisibility: () => ({ name: true }),
    })
    const col = createTestColumn('name', {}, state)
    expect(col.getIsVisible()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getIsPinned / getPinnedIndex
// ---------------------------------------------------------------------------

describe('column.getIsPinned()', () => {
  it('should return false by default', () => {
    const col = createTestColumn('name')
    expect(col.getIsPinned()).toBe(false)
  })

  it('should return "left" when pinned left', () => {
    const state = createMockStateAccessors({
      columnPinning: () => ({ left: ['name'], right: [] }),
    })
    const col = createTestColumn('name', {}, state)
    expect(col.getIsPinned()).toBe('left')
  })

  it('should return "right" when pinned right', () => {
    const state = createMockStateAccessors({
      columnPinning: () => ({ left: [], right: ['name'] }),
    })
    const col = createTestColumn('name', {}, state)
    expect(col.getIsPinned()).toBe('right')
  })
})

describe('column.getPinnedIndex()', () => {
  it('should return 0 when not pinned', () => {
    const col = createTestColumn('name')
    expect(col.getPinnedIndex()).toBe(0)
  })

  it('should return index within pinned section', () => {
    const state = createMockStateAccessors({
      columnPinning: () => ({ left: ['a', 'name', 'b'], right: [] }),
    })
    const col = createTestColumn('name', {}, state)
    expect(col.getPinnedIndex()).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// getStart / getAfter
// ---------------------------------------------------------------------------

describe('column.getStart() / column.getAfter()', () => {
  it('should return 0 for first column', () => {
    const colA = createTestColumn('a', { size: 100 })
    const colB = createTestColumn('b', { size: 200 })
    const state = createMockStateAccessors({
      getVisibleLeafColumns: () => [colA, colB],
      getCenterVisibleLeafColumns: () => [colA, colB],
    })
    // Recreate with state that includes the column list
    const a = createTestColumn('a', { size: 100 }, state)
    const b = createTestColumn('b', { size: 200 }, state)
    // Update the returned columns to use the new instances
    state.getVisibleLeafColumns = () => [a, b]
    state.getCenterVisibleLeafColumns = () => [a, b]

    expect(a.getStart()).toBe(0)
    expect(a.getAfter()).toBe(200)
    expect(b.getStart()).toBe(100)
    expect(b.getAfter()).toBe(0)
  })

  it('should work with pinned columns (left position)', () => {
    const state = createMockStateAccessors({
      columnPinning: () => ({ left: ['a', 'b'], right: [] }),
    })
    const a = createTestColumn('a', { size: 100 }, state)
    const b = createTestColumn('b', { size: 150 }, state)
    state.getLeftVisibleLeafColumns = () => [a, b]

    expect(a.getStart('left')).toBe(0)
    expect(b.getStart('left')).toBe(100)
    expect(a.getAfter('left')).toBe(150)
    expect(b.getAfter('left')).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// getCanSort / getIsSorted / getSortIndex
// ---------------------------------------------------------------------------

describe('column.getCanSort()', () => {
  it('should return true for column with accessor', () => {
    const col = createTestColumn('name', { accessorKey: 'name' })
    expect(col.getCanSort()).toBe(true)
  })

  it('should return false for display column (no accessor)', () => {
    const col = createEngineColumn(
      { id: 'actions', header: 'Actions' },
      0,
      undefined,
      createMockStateAccessors(),
    )
    expect(col.getCanSort()).toBe(false)
  })

  it('should return false when enableSorting is false', () => {
    const col = createTestColumn('name', { enableSorting: false })
    expect(col.getCanSort()).toBe(false)
  })
})

describe('column.getIsSorted()', () => {
  it('should return false when not sorted', () => {
    const col = createTestColumn('name')
    expect(col.getIsSorted()).toBe(false)
  })

  it('should return "asc" for ascending sort', () => {
    const state = createMockStateAccessors({
      sorting: () => [{ id: 'name', desc: false }],
    })
    const col = createTestColumn('name', {}, state)
    expect(col.getIsSorted()).toBe('asc')
  })

  it('should return "desc" for descending sort', () => {
    const state = createMockStateAccessors({
      sorting: () => [{ id: 'name', desc: true }],
    })
    const col = createTestColumn('name', {}, state)
    expect(col.getIsSorted()).toBe('desc')
  })
})

describe('column.getSortIndex()', () => {
  it('should return -1 when not sorted', () => {
    const col = createTestColumn('name')
    expect(col.getSortIndex()).toBe(-1)
  })

  it('should return index in multi-sort', () => {
    const state = createMockStateAccessors({
      sorting: () => [
        { id: 'a', desc: false },
        { id: 'name', desc: true },
        { id: 'b', desc: false },
      ],
    })
    const col = createTestColumn('name', {}, state)
    expect(col.getSortIndex()).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// getIsGrouped / getGroupedIndex
// ---------------------------------------------------------------------------

describe('column.getIsGrouped()', () => {
  it('should return false when not grouped', () => {
    const col = createTestColumn('name')
    expect(col.getIsGrouped()).toBe(false)
  })

  it('should return true when column is in grouping state', () => {
    const state = createMockStateAccessors({
      grouping: () => ['status', 'name'],
    })
    const col = createTestColumn('name', {}, state)
    expect(col.getIsGrouped()).toBe(true)
  })
})

describe('column.getGroupedIndex()', () => {
  it('should return -1 when not grouped', () => {
    const col = createTestColumn('name')
    expect(col.getGroupedIndex()).toBe(-1)
  })

  it('should return index in grouping state', () => {
    const state = createMockStateAccessors({
      grouping: () => ['status', 'name', 'dept'],
    })
    const col = createTestColumn('name', {}, state)
    expect(col.getGroupedIndex()).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// toggleSorting / getToggleSortingHandler
// ---------------------------------------------------------------------------

describe('column.toggleSorting()', () => {
  it('should add ascending sort when not sorted', () => {
    let currentSorting: any[] = []
    const state = createMockStateAccessors({
      sorting: () => currentSorting,
      setSorting: (updater) => {
        currentSorting = typeof updater === 'function' ? updater(currentSorting) : updater
      },
    })
    const col = createTestColumn('name', {}, state)

    col.toggleSorting()
    expect(currentSorting).toEqual([{ id: 'name', desc: false }])
  })

  it('should toggle to desc when already asc', () => {
    let currentSorting = [{ id: 'name', desc: false }]
    const state = createMockStateAccessors({
      sorting: () => currentSorting,
      setSorting: (updater) => {
        currentSorting = typeof updater === 'function' ? updater(currentSorting) : updater
      },
    })
    const col = createTestColumn('name', {}, state)

    col.toggleSorting()
    expect(currentSorting).toEqual([{ id: 'name', desc: true }])
  })

  it('should remove sort when already desc', () => {
    let currentSorting = [{ id: 'name', desc: true }]
    const state = createMockStateAccessors({
      sorting: () => currentSorting,
      setSorting: (updater) => {
        currentSorting = typeof updater === 'function' ? updater(currentSorting) : updater
      },
    })
    const col = createTestColumn('name', {}, state)

    col.toggleSorting()
    expect(currentSorting).toEqual([])
  })

  it('should set explicit desc value', () => {
    let currentSorting: any[] = []
    const state = createMockStateAccessors({
      sorting: () => currentSorting,
      setSorting: (updater) => {
        currentSorting = typeof updater === 'function' ? updater(currentSorting) : updater
      },
    })
    const col = createTestColumn('name', {}, state)

    col.toggleSorting(true)
    expect(currentSorting).toEqual([{ id: 'name', desc: true }])
  })
})

// ---------------------------------------------------------------------------
// getFlatColumns / getLeafColumns
// ---------------------------------------------------------------------------

describe('column.getFlatColumns()', () => {
  it('should return self for leaf column', () => {
    const col = createTestColumn('name')
    expect(col.getFlatColumns().map(c => c.id)).toEqual(['name'])
  })
})

describe('column.getLeafColumns()', () => {
  it('should return self for leaf column', () => {
    const col = createTestColumn('name')
    expect(col.getLeafColumns().map(c => c.id)).toEqual(['name'])
  })
})

// ---------------------------------------------------------------------------
// getIndex
// ---------------------------------------------------------------------------

describe('column.getIndex()', () => {
  it('should return index in visible columns', () => {
    const state = createMockStateAccessors()
    const a = createTestColumn('a', {}, state)
    const b = createTestColumn('b', {}, state)
    const c = createTestColumn('c', {}, state)
    state.getVisibleLeafColumns = () => [a, b, c]
    state.getCenterVisibleLeafColumns = () => [a, b, c]

    expect(a.getIndex()).toBe(0)
    expect(b.getIndex()).toBe(1)
    expect(c.getIndex()).toBe(2)
  })

  it('should return -1 when not in visible columns', () => {
    const state = createMockStateAccessors({
      getVisibleLeafColumns: () => [],
      getCenterVisibleLeafColumns: () => [],
    })
    const col = createTestColumn('name', {}, state)
    expect(col.getIndex()).toBe(-1)
  })
})

// ---------------------------------------------------------------------------
// accessorFn
// ---------------------------------------------------------------------------

describe('column.accessorFn', () => {
  it('should create accessorFn from accessorKey', () => {
    const col = createTestColumn('name')
    expect(col.accessorFn!({ name: 'John' } as any, 0)).toBe('John')
  })

  it('should support deep accessor keys', () => {
    const col = createTestColumn('address', { accessorKey: 'address.city' })
    expect(col.accessorFn!({ address: { city: 'NYC' } } as any, 0)).toBe('NYC')
  })

  it('should use explicit accessorFn', () => {
    const fn = (row: any) => row.first + ' ' + row.last
    const col = createTestColumn('fullName', { accessorFn: fn })
    expect(col.accessorFn!({ first: 'John', last: 'Doe' } as any, 0)).toBe('John Doe')
  })

  it('should be undefined for display columns', () => {
    const col = createEngineColumn(
      { id: 'actions', header: 'Actions' },
      0,
      undefined,
      createMockStateAccessors(),
    )
    expect(col.accessorFn).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// getCanFilter / getFilterValue / setFilterValue
// ---------------------------------------------------------------------------

describe('column.getCanFilter()', () => {
  it('should return true for column with accessor', () => {
    const col = createTestColumn('name', { accessorKey: 'name' })
    expect(col.getCanFilter()).toBe(true)
  })

  it('should return false for display column (no accessor)', () => {
    const col = createEngineColumn(
      { id: 'actions', header: 'Actions' },
      0,
      undefined,
      createMockStateAccessors(),
    )
    expect(col.getCanFilter()).toBe(false)
  })

  it('should return false when enableColumnFilter is false', () => {
    const col = createTestColumn('name', { enableColumnFilter: false })
    expect(col.getCanFilter()).toBe(false)
  })

  it('should return false when enableFiltering is false', () => {
    const col = createTestColumn('name', { enableFiltering: false })
    expect(col.getCanFilter()).toBe(false)
  })

  it('should prefer enableColumnFilter over enableFiltering', () => {
    const col = createTestColumn('name', { enableColumnFilter: true, enableFiltering: false })
    expect(col.getCanFilter()).toBe(true)
  })
})

describe('column.getFilterValue()', () => {
  it('should return undefined when no filter is set', () => {
    const col = createTestColumn('name')
    expect(col.getFilterValue()).toBeUndefined()
  })

  it('should return the filter value for this column', () => {
    const state = createMockStateAccessors({
      columnFilters: () => [{ id: 'name', value: 'John' }],
    })
    const col = createTestColumn('name', {}, state)
    expect(col.getFilterValue()).toBe('John')
  })

  it('should return undefined when other columns have filters but not this one', () => {
    const state = createMockStateAccessors({
      columnFilters: () => [{ id: 'status', value: 'active' }],
    })
    const col = createTestColumn('name', {}, state)
    expect(col.getFilterValue()).toBeUndefined()
  })

  it('should work with array filter values', () => {
    const state = createMockStateAccessors({
      columnFilters: () => [{ id: 'status', value: ['active', 'pending'] }],
    })
    const col = createTestColumn('status', {}, state)
    expect(col.getFilterValue()).toEqual(['active', 'pending'])
  })
})

describe('column.setFilterValue()', () => {
  it('should add a new filter', () => {
    let currentFilters: any[] = []
    const state = createMockStateAccessors({
      columnFilters: () => currentFilters,
      setColumnFilters: (updater) => {
        currentFilters = typeof updater === 'function' ? updater(currentFilters) : updater
      },
    })
    const col = createTestColumn('name', {}, state)

    col.setFilterValue('John')
    expect(currentFilters).toEqual([{ id: 'name', value: 'John' }])
  })

  it('should update an existing filter', () => {
    let currentFilters = [{ id: 'name', value: 'John' }]
    const state = createMockStateAccessors({
      columnFilters: () => currentFilters,
      setColumnFilters: (updater) => {
        currentFilters = typeof updater === 'function' ? updater(currentFilters) : updater
      },
    })
    const col = createTestColumn('name', {}, state)

    col.setFilterValue('Jane')
    expect(currentFilters).toEqual([{ id: 'name', value: 'Jane' }])
  })

  it('should remove filter when value is undefined', () => {
    let currentFilters = [{ id: 'name', value: 'John' }]
    const state = createMockStateAccessors({
      columnFilters: () => currentFilters,
      setColumnFilters: (updater) => {
        currentFilters = typeof updater === 'function' ? updater(currentFilters) : updater
      },
    })
    const col = createTestColumn('name', {}, state)

    col.setFilterValue(undefined)
    expect(currentFilters).toEqual([])
  })

  it('should remove filter when value is null', () => {
    let currentFilters = [{ id: 'name', value: 'John' }]
    const state = createMockStateAccessors({
      columnFilters: () => currentFilters,
      setColumnFilters: (updater) => {
        currentFilters = typeof updater === 'function' ? updater(currentFilters) : updater
      },
    })
    const col = createTestColumn('name', {}, state)

    col.setFilterValue(null)
    expect(currentFilters).toEqual([])
  })

  it('should remove filter when value is empty string', () => {
    let currentFilters = [{ id: 'name', value: 'John' }]
    const state = createMockStateAccessors({
      columnFilters: () => currentFilters,
      setColumnFilters: (updater) => {
        currentFilters = typeof updater === 'function' ? updater(currentFilters) : updater
      },
    })
    const col = createTestColumn('name', {}, state)

    col.setFilterValue('')
    expect(currentFilters).toEqual([])
  })

  it('should not affect other column filters', () => {
    let currentFilters = [{ id: 'status', value: 'active' }]
    const state = createMockStateAccessors({
      columnFilters: () => currentFilters,
      setColumnFilters: (updater) => {
        currentFilters = typeof updater === 'function' ? updater(currentFilters) : updater
      },
    })
    const col = createTestColumn('name', {}, state)

    col.setFilterValue('John')
    expect(currentFilters).toEqual([
      { id: 'status', value: 'active' },
      { id: 'name', value: 'John' },
    ])
  })
})
