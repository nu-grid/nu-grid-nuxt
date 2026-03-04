import type { ExpandedState, Row } from '@tanstack/vue-table'

import { describe, expect, it } from 'vitest'

import { expandRows, paginateRows } from '../src/runtime/utils/rowModelFns'

/**
 * Tests for NuGrid row model pure functions
 *
 * These replace TanStack's getPaginationRowModel and getExpandedRowModel.
 * Each section includes a TanStack reference implementation to verify parity.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TestData {
  id: number
  name: string
}

/** Minimal Row-like object for testing expandRows */
function createRow(
  id: string,
  subRows: Row<TestData>[] = [],
): Row<TestData> {
  return {
    id,
    subRows,
    original: { id: Number(id), name: `Row ${id}` },
  } as unknown as Row<TestData>
}

// ---------------------------------------------------------------------------
// paginateRows — parity with TanStack's getPaginationRowModel slice logic
// ---------------------------------------------------------------------------

describe('paginateRows', () => {
  /**
   * TanStack reference (getPaginationRowModel.ts lines 22-27):
   *   const { pageSize, pageIndex } = pagination
   *   const pageStart = pageSize * pageIndex
   *   const pageEnd = pageStart + pageSize
   *   rows = rows.slice(pageStart, pageEnd)
   */
  function tanstackPaginateReference<T>(rows: T[], pageIndex: number, pageSize: number): T[] {
    const pageStart = pageSize * pageIndex
    const pageEnd = pageStart + pageSize
    return rows.slice(pageStart, pageEnd)
  }

  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  it('should return first page', () => {
    const result = paginateRows(items, 0, 3)
    expect(result).toEqual([1, 2, 3])
    expect(result).toEqual(tanstackPaginateReference(items, 0, 3))
  })

  it('should return middle page', () => {
    const result = paginateRows(items, 1, 3)
    expect(result).toEqual([4, 5, 6])
    expect(result).toEqual(tanstackPaginateReference(items, 1, 3))
  })

  it('should return partial last page', () => {
    const result = paginateRows(items, 3, 3)
    expect(result).toEqual([10])
    expect(result).toEqual(tanstackPaginateReference(items, 3, 3))
  })

  it('should return empty for page beyond range', () => {
    const result = paginateRows(items, 10, 3)
    expect(result).toEqual([])
    expect(result).toEqual(tanstackPaginateReference(items, 10, 3))
  })

  it('should return empty for empty input', () => {
    const result = paginateRows([], 0, 10)
    expect(result).toEqual([])
    expect(result).toEqual(tanstackPaginateReference([], 0, 10))
  })

  it('should return all rows when pageSize >= row count', () => {
    const result = paginateRows(items, 0, 100)
    expect(result).toEqual(items)
    expect(result).toEqual(tanstackPaginateReference(items, 0, 100))
  })

  it('should return all rows when pageSize equals row count', () => {
    const result = paginateRows(items, 0, 10)
    expect(result).toEqual(items)
    expect(result).toEqual(tanstackPaginateReference(items, 0, 10))
  })

  it('should handle pageSize of 1', () => {
    expect(paginateRows(items, 0, 1)).toEqual([1])
    expect(paginateRows(items, 4, 1)).toEqual([5])
    expect(paginateRows(items, 9, 1)).toEqual([10])
  })

  it('should match TanStack for various page sizes', () => {
    for (const pageSize of [1, 2, 3, 5, 7, 10, 20]) {
      for (let pageIndex = 0; pageIndex <= Math.ceil(items.length / pageSize); pageIndex++) {
        expect(paginateRows(items, pageIndex, pageSize))
          .toEqual(tanstackPaginateReference(items, pageIndex, pageSize))
      }
    }
  })
})

// ---------------------------------------------------------------------------
// expandRows — parity with TanStack's getExpandedRowModel expandRows logic
// ---------------------------------------------------------------------------

describe('expandRows', () => {
  /**
   * TanStack reference (getExpandedRowModel.ts lines 33-51):
   *   function expandRows(rowModel) {
   *     const expandedRows = []
   *     const handleRow = (row) => {
   *       expandedRows.push(row)
   *       if (row.subRows?.length && row.getIsExpanded()) {
   *         row.subRows.forEach(handleRow)
   *       }
   *     }
   *     rowModel.rows.forEach(handleRow)
   *     return { rows: expandedRows, ... }
   *   }
   *
   * Our implementation uses expandedState directly instead of row.getIsExpanded(),
   * since NuGrid owns expanded state and doesn't rely on TanStack's method.
   */
  function tanstackExpandReference<T>(rows: Row<T>[], expandedState: ExpandedState): Row<T>[] {
    const result: Row<T>[] = []
    const handleRow = (row: Row<T>) => {
      result.push(row)
      if (row.subRows?.length) {
        const isExpanded = expandedState === true
          || (typeof expandedState === 'object' && expandedState[row.id])
        if (isExpanded) {
          row.subRows.forEach(handleRow)
        }
      }
    }
    rows.forEach(handleRow)
    return result
  }

  describe('flat rows (no subRows)', () => {
    it('should return same rows when no subRows exist', () => {
      const rows = [createRow('0'), createRow('1'), createRow('2')]
      const result = expandRows(rows, true)
      expect(result).toEqual(rows)
    })

    it('should return same rows with empty expanded record', () => {
      const rows = [createRow('0'), createRow('1')]
      const result = expandRows(rows, {})
      expect(result).toEqual(rows)
    })
  })

  describe('expandedState = true (all expanded)', () => {
    it('should flatten one level of subRows', () => {
      const child1 = createRow('0.0')
      const child2 = createRow('0.1')
      const parent = createRow('0', [child1, child2])
      const other = createRow('1')

      const result = expandRows([parent, other], true)
      expect(result).toEqual([parent, child1, child2, other])
      expect(result).toEqual(tanstackExpandReference([parent, other], true))
    })

    it('should flatten nested subRows (3 levels deep)', () => {
      const grandchild = createRow('0.0.0')
      const child = createRow('0.0', [grandchild])
      const parent = createRow('0', [child])

      const result = expandRows([parent], true)
      expect(result).toEqual([parent, child, grandchild])
      expect(result).toEqual(tanstackExpandReference([parent], true))
    })

    it('should flatten multiple groups with children', () => {
      const g1c1 = createRow('g1.0')
      const g1c2 = createRow('g1.1')
      const group1 = createRow('g1', [g1c1, g1c2])

      const g2c1 = createRow('g2.0')
      const group2 = createRow('g2', [g2c1])

      const result = expandRows([group1, group2], true)
      expect(result).toEqual([group1, g1c1, g1c2, group2, g2c1])
      expect(result).toEqual(tanstackExpandReference([group1, group2], true))
    })
  })

  describe('expandedState = Record (selective)', () => {
    it('should only expand rows in the record', () => {
      const g1c1 = createRow('g1.0')
      const group1 = createRow('g1', [g1c1])

      const g2c1 = createRow('g2.0')
      const group2 = createRow('g2', [g2c1])

      const expanded: ExpandedState = { g1: true }

      const result = expandRows([group1, group2], expanded)
      expect(result).toEqual([group1, g1c1, group2])
      expect(result).toEqual(tanstackExpandReference([group1, group2], expanded))
    })

    it('should not expand rows not in the record', () => {
      const child = createRow('0.0')
      const parent = createRow('0', [child])

      const result = expandRows([parent], {})
      expect(result).toEqual([parent])
      expect(result).toEqual(tanstackExpandReference([parent], {}))
    })

    it('should not expand rows with false in the record', () => {
      const child = createRow('0.0')
      const parent = createRow('0', [child])

      const result = expandRows([parent], { '0': false })
      expect(result).toEqual([parent])
      expect(result).toEqual(tanstackExpandReference([parent], { '0': false }))
    })

    it('should expand nested rows selectively', () => {
      const grandchild = createRow('0.0.0')
      const child = createRow('0.0', [grandchild])
      const parent = createRow('0', [child])

      // Expand parent but not child
      const result1 = expandRows([parent], { '0': true })
      expect(result1).toEqual([parent, child])

      // Expand both parent and child
      const result2 = expandRows([parent], { '0': true, '0.0': true })
      expect(result2).toEqual([parent, child, grandchild])
    })
  })

  describe('empty input', () => {
    it('should return empty array for empty rows', () => {
      expect(expandRows([], true)).toEqual([])
      expect(expandRows([], {})).toEqual([])
    })
  })

  describe('parity with TanStack across scenarios', () => {
    it('should match TanStack for mixed expanded/collapsed groups', () => {
      const g1c1 = createRow('g1.0')
      const g1c2 = createRow('g1.1')
      const group1 = createRow('g1', [g1c1, g1c2])

      const g2c1 = createRow('g2.0')
      const group2 = createRow('g2', [g2c1])

      const g3c1 = createRow('g3.0')
      const g3c2 = createRow('g3.1')
      const g3c3 = createRow('g3.2')
      const group3 = createRow('g3', [g3c1, g3c2, g3c3])

      const rows = [group1, group2, group3]

      // Only group2 expanded
      const expanded: ExpandedState = { g2: true }
      const result = expandRows(rows, expanded)
      const reference = tanstackExpandReference(rows, expanded)
      expect(result).toEqual(reference)
      expect(result).toEqual([group1, group2, g2c1, group3])
    })

    it('should match TanStack for deeply nested structure', () => {
      const leaf1 = createRow('a.b.c')
      const leaf2 = createRow('a.b.d')
      const mid = createRow('a.b', [leaf1, leaf2])
      const root = createRow('a', [mid])

      const scenarios: ExpandedState[] = [
        true,
        {},
        { a: true },
        { a: true, 'a.b': true },
        { 'a.b': true }, // mid not reachable unless parent expanded
      ]

      for (const expanded of scenarios) {
        expect(expandRows([root], expanded))
          .toEqual(tanstackExpandReference([root], expanded))
      }
    })
  })
})
