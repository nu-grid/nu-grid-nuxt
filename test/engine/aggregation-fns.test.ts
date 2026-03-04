import { describe, expect, it } from 'vitest'

import { builtinAggregationFns } from '../../src/runtime/engine/aggregation-fns'
import { createEngineColumn } from '../../src/runtime/engine/column'
import { buildCoreRowModel } from '../../src/runtime/engine/core-row-model'
import type { EngineColumn, EngineRow, EngineTable, StateAccessors } from '../../src/runtime/engine/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockState(): StateAccessors {
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
  }
}

function createMockTable(columns: EngineColumn<any>[]): EngineTable<any> {
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
  }
}

/** Create leaf rows from test data for aggregation function testing */
function createLeafRows(data: any[]): EngineRow<any>[] {
  const state = createMockState()
  const columns = [
    createEngineColumn({ id: 'value', accessorKey: 'value' }, 0, undefined, state),
    createEngineColumn({ id: 'status', accessorKey: 'status' }, 0, undefined, state),
  ]
  const table = createMockTable(columns)
  return buildCoreRowModel(data, columns, table, state).rows
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('builtinAggregationFns', () => {
  describe('sum', () => {
    it('should sum numeric values', () => {
      const rows = createLeafRows([{ value: 10 }, { value: 20 }, { value: 30 }])
      expect(builtinAggregationFns.sum('value', rows, [])).toBe(60)
    })

    it('should treat NaN as 0', () => {
      const rows = createLeafRows([{ value: 10 }, { value: 'abc' }, { value: 20 }])
      expect(builtinAggregationFns.sum('value', rows, [])).toBe(30)
    })

    it('should return 0 for empty rows', () => {
      expect(builtinAggregationFns.sum('value', [], [])).toBe(0)
    })
  })

  describe('min', () => {
    it('should return minimum value', () => {
      const rows = createLeafRows([{ value: 30 }, { value: 10 }, { value: 20 }])
      expect(builtinAggregationFns.min('value', rows, [])).toBe(10)
    })

    it('should skip NaN values', () => {
      const rows = createLeafRows([{ value: 'abc' }, { value: 30 }, { value: 10 }])
      expect(builtinAggregationFns.min('value', rows, [])).toBe(10)
    })

    it('should return 0 for empty rows', () => {
      expect(builtinAggregationFns.min('value', [], [])).toBe(0)
    })
  })

  describe('max', () => {
    it('should return maximum value', () => {
      const rows = createLeafRows([{ value: 10 }, { value: 30 }, { value: 20 }])
      expect(builtinAggregationFns.max('value', rows, [])).toBe(30)
    })

    it('should skip NaN values', () => {
      const rows = createLeafRows([{ value: 'abc' }, { value: 10 }, { value: 30 }])
      expect(builtinAggregationFns.max('value', rows, [])).toBe(30)
    })

    it('should return 0 for empty rows', () => {
      expect(builtinAggregationFns.max('value', [], [])).toBe(0)
    })
  })

  describe('count', () => {
    it('should return number of rows', () => {
      const rows = createLeafRows([{ value: 1 }, { value: 2 }, { value: 3 }])
      expect(builtinAggregationFns.count('value', rows, [])).toBe(3)
    })

    it('should return 0 for empty rows', () => {
      expect(builtinAggregationFns.count('value', [], [])).toBe(0)
    })
  })

  describe('extent', () => {
    it('should return [min, max] tuple', () => {
      const rows = createLeafRows([{ value: 30 }, { value: 10 }, { value: 20 }])
      expect(builtinAggregationFns.extent('value', rows, [])).toEqual([10, 30])
    })

    it('should return [0, 0] for empty rows', () => {
      expect(builtinAggregationFns.extent('value', [], [])).toEqual([0, 0])
    })
  })

  describe('mean', () => {
    it('should return average of values', () => {
      const rows = createLeafRows([{ value: 10 }, { value: 20 }, { value: 30 }])
      expect(builtinAggregationFns.mean('value', rows, [])).toBe(20)
    })

    it('should return 0 for empty rows', () => {
      expect(builtinAggregationFns.mean('value', [], [])).toBe(0)
    })
  })

  describe('median', () => {
    it('should return median for odd count', () => {
      const rows = createLeafRows([{ value: 10 }, { value: 30 }, { value: 20 }])
      expect(builtinAggregationFns.median('value', rows, [])).toBe(20)
    })

    it('should return median for even count', () => {
      const rows = createLeafRows([{ value: 10 }, { value: 20 }, { value: 30 }, { value: 40 }])
      expect(builtinAggregationFns.median('value', rows, [])).toBe(25)
    })

    it('should return 0 for empty rows', () => {
      expect(builtinAggregationFns.median('value', [], [])).toBe(0)
    })
  })

  describe('unique', () => {
    it('should return unique values', () => {
      const rows = createLeafRows([
        { value: 1, status: 'active' },
        { value: 2, status: 'active' },
        { value: 3, status: 'inactive' },
      ])
      const result = builtinAggregationFns.unique('status', rows, [])
      expect(result).toEqual(['active', 'inactive'])
    })

    it('should return empty array for empty rows', () => {
      expect(builtinAggregationFns.unique('value', [], [])).toEqual([])
    })
  })

  describe('uniqueCount', () => {
    it('should return count of unique values', () => {
      const rows = createLeafRows([
        { value: 1, status: 'active' },
        { value: 2, status: 'active' },
        { value: 3, status: 'inactive' },
      ])
      expect(builtinAggregationFns.uniqueCount('status', rows, [])).toBe(2)
    })

    it('should return 0 for empty rows', () => {
      expect(builtinAggregationFns.uniqueCount('value', [], [])).toBe(0)
    })
  })
})
