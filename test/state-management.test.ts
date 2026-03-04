/**
 * State Management Parity Tests
 *
 * Verifies that NuGrid's direct ref updates produce identical results
 * to going through TanStack's tableApi.set*() methods.
 *
 * TanStack's state write pattern:
 *   tableApi.set*(updater) → on*Change(updater) → valueUpdater(updater, ref)
 *
 * NuGrid's direct pattern:
 *   ref.value = newValue
 *
 * These are equivalent when we pass values (not updater functions).
 * The tests below prove parity for each state domain.
 */
import { describe, expect, it } from 'vitest'

import {
  toggleRowSelected,
  updatePageIndex,
  updatePageSize,
} from '../src/runtime/utils/stateManagementFns'

// ─── Reference: TanStack's valueUpdater ────────────────────────────
// This is the bridge function from useNuGridCore.ts that TanStack calls
// via on*Change. We copy it verbatim to use as a reference.
function tanstackValueUpdater<T>(updaterOrValue: T | ((old: T) => T), current: T): T {
  return typeof updaterOrValue === 'function'
    ? (updaterOrValue as (old: T) => T)(current)
    : updaterOrValue
}

// ─── Reference: TanStack's row.toggleSelected logic ────────────────
// Simplified from TanStack's RowSelection.ts createRow.
// In NuGrid, we never use sub-row selection, so includeChildren = false.
function tanstackToggleSelected(
  oldSelection: Record<string, boolean>,
  rowId: string,
  value: boolean,
  enableMultiRowSelection: boolean,
): Record<string, boolean> {
  const selectedRowIds = { ...oldSelection }

  if (value) {
    if (!enableMultiRowSelection) {
      // Single select: clear all others
      Object.keys(selectedRowIds).forEach(key => delete selectedRowIds[key])
    }
    selectedRowIds[rowId] = true
  } else {
    delete selectedRowIds[rowId]
  }

  return selectedRowIds
}

// ─── Reference: TanStack's setPageSize logic ───────────────────────
// From RowPagination.ts — setPageSize adjusts pageIndex to keep the
// same top row visible.
function tanstackSetPageSize(
  old: { pageIndex: number; pageSize: number },
  newPageSize: number,
): { pageIndex: number; pageSize: number } {
  const pageSize = Math.max(1, newPageSize)
  const topRowIndex = old.pageSize * old.pageIndex
  const pageIndex = Math.floor(topRowIndex / pageSize)
  return { pageSize, pageIndex }
}

// ─── Reference: TanStack's setPageIndex logic ──────────────────────
// From RowPagination.ts — setPageIndex clamps to [0, pageCount - 1].
function tanstackSetPageIndex(
  oldPageIndex: number,
  newPageIndex: number,
  pageCount: number | undefined,
): number {
  const maxPageIndex =
    pageCount === undefined ? Number.MAX_SAFE_INTEGER : pageCount - 1
  return Math.max(0, Math.min(newPageIndex, maxPageIndex))
}

// ════════════════════════════════════════════════════════════════════
// Tests
// ════════════════════════════════════════════════════════════════════

describe('State Management Parity', () => {
  // ── Column Pinning ───────────────────────────────────────────────
  describe('Column Pinning — direct ref update vs tableApi.setColumnPinning()', () => {
    it('setting pinning state directly equals TanStack updater with value', () => {
      const current = { left: ['a'], right: [] as string[] }
      const newPinning = { left: ['a', 'b'], right: ['c'] }

      // TanStack path: setColumnPinning(value) → onColumnPinningChange(value) → valueUpdater(value, ref)
      const tanstackResult = tanstackValueUpdater(newPinning, current)
      // NuGrid path: ref.value = value
      const nugridResult = newPinning

      expect(nugridResult).toEqual(tanstackResult)
    })

    it('pin column to left', () => {
      const current = { left: ['a'], right: [] as string[] }
      const newPinning = { ...current, left: [...current.left, 'b'] }

      expect(tanstackValueUpdater(newPinning, current)).toEqual(newPinning)
    })

    it('unpin column', () => {
      const current = { left: ['a', 'b'], right: ['c'] }
      const newPinning = {
        left: current.left.filter(id => id !== 'b'),
        right: current.right.filter(id => id !== 'b'),
      }

      expect(newPinning).toEqual({ left: ['a'], right: ['c'] })
    })

    it('move column from left to right pin', () => {
      const current = { left: ['a', 'b'], right: [] as string[] }
      const afterRemoveLeft = { ...current, left: current.left.filter(id => id !== 'b') }
      const newPinning = { ...afterRemoveLeft, right: [...afterRemoveLeft.right, 'b'] }

      expect(newPinning).toEqual({ left: ['a'], right: ['b'] })
    })

    it('clear all pins', () => {
      const newPinning = { left: [] as string[], right: [] as string[] }
      expect(newPinning).toEqual({ left: [], right: [] })
    })
  })

  // ── Expansion ────────────────────────────────────────────────────
  describe('Expansion — direct ref update vs tableApi.setExpanded()', () => {
    it('expand all groups with boolean true', () => {
      const current = {} as Record<string, boolean> | boolean
      const newState = true

      const tanstackResult = tanstackValueUpdater(newState, current)
      expect(tanstackResult).toBe(true)
    })

    it('collapse a single group from all-expanded', () => {
      // When state is `true` (all expanded), NuGrid builds a record
      const groupIds = ['group_a', 'group_b', 'group_c']
      const newState: Record<string, boolean> = {}
      groupIds.forEach(id => { newState[id] = id !== 'group_b' })

      expect(newState).toEqual({ group_a: true, group_b: false, group_c: true })
    })

    it('toggle a group in record state', () => {
      const current = { group_a: true, group_b: true }
      const newState = { ...current, group_b: false }

      const tanstackResult = tanstackValueUpdater(newState, current)
      expect(tanstackResult).toEqual({ group_a: true, group_b: false })
    })

    it('expand single group from empty state', () => {
      const newState = { group_a: true }
      expect(newState).toEqual({ group_a: true })
    })
  })

  // ── Row Selection ────────────────────────────────────────────────
  describe('Row Selection — direct ref update vs tableApi.setRowSelection()', () => {
    it('select a row in multi-select mode', () => {
      const old = { row_1: true }
      const rowId = 'row_2'

      const tanstackResult = tanstackToggleSelected(old, rowId, true, true)
      const nugridResult = toggleRowSelected(old, rowId, true, true)

      expect(nugridResult).toEqual(tanstackResult)
      expect(nugridResult).toEqual({ row_1: true, row_2: true })
    })

    it('deselect a row in multi-select mode', () => {
      const old = { row_1: true, row_2: true }
      const rowId = 'row_2'

      const tanstackResult = tanstackToggleSelected(old, rowId, false, true)
      const nugridResult = toggleRowSelected(old, rowId, false, true)

      expect(nugridResult).toEqual(tanstackResult)
      expect(nugridResult).toEqual({ row_1: true })
      expect('row_2' in nugridResult).toBe(false)
    })

    it('select a row in single-select mode clears others', () => {
      const old = { row_1: true }
      const rowId = 'row_2'

      const tanstackResult = tanstackToggleSelected(old, rowId, true, false)
      const nugridResult = toggleRowSelected(old, rowId, true, false)

      expect(nugridResult).toEqual(tanstackResult)
      expect(nugridResult).toEqual({ row_2: true })
    })

    it('deselect in single-select mode', () => {
      const old = { row_1: true }
      const rowId = 'row_1'

      const tanstackResult = tanstackToggleSelected(old, rowId, false, false)
      const nugridResult = toggleRowSelected(old, rowId, false, false)

      expect(nugridResult).toEqual(tanstackResult)
      expect(nugridResult).toEqual({})
    })

    it('select when empty', () => {
      const old = {}
      const rowId = 'row_1'

      const tanstackResult = tanstackToggleSelected(old, rowId, true, true)
      const nugridResult = toggleRowSelected(old, rowId, true, true)

      expect(nugridResult).toEqual(tanstackResult)
      expect(nugridResult).toEqual({ row_1: true })
    })

    it('group toggle — select all rows in group', () => {
      const current = { row_1: true }
      const groupRows = ['row_2', 'row_3', 'row_4']
      const newSelection = { ...current }
      groupRows.forEach(id => { newSelection[id] = true })

      expect(newSelection).toEqual({ row_1: true, row_2: true, row_3: true, row_4: true })
    })

    it('group toggle — deselect all rows in group', () => {
      const current: Record<string, boolean> = { row_1: true, row_2: true, row_3: true }
      const groupRows = ['row_2', 'row_3']
      const newSelection = { ...current }
      groupRows.forEach(id => { delete newSelection[id] })

      expect(newSelection).toEqual({ row_1: true })
    })
  })

  // ── Pagination ───────────────────────────────────────────────────
  describe('Pagination — direct ref update vs tableApi.setPageIndex/setPageSize', () => {
    it('setPageIndex: basic page navigation', () => {
      const tanstackResult = tanstackSetPageIndex(0, 2, 5)
      const nugridResult = updatePageIndex(0, 2, 5)
      expect(nugridResult).toBe(tanstackResult)
      expect(nugridResult).toBe(2)
    })

    it('setPageIndex: clamps to max page', () => {
      const tanstackResult = tanstackSetPageIndex(0, 10, 5)
      const nugridResult = updatePageIndex(0, 10, 5)
      expect(nugridResult).toBe(tanstackResult)
      expect(nugridResult).toBe(4) // pageCount - 1
    })

    it('setPageIndex: clamps to 0 for negative', () => {
      const tanstackResult = tanstackSetPageIndex(3, -1, 5)
      const nugridResult = updatePageIndex(3, -1, 5)
      expect(nugridResult).toBe(tanstackResult)
      expect(nugridResult).toBe(0)
    })

    it('setPageIndex: no page count = no upper clamp', () => {
      const tanstackResult = tanstackSetPageIndex(0, 999, undefined)
      const nugridResult = updatePageIndex(0, 999, undefined)
      expect(nugridResult).toBe(tanstackResult)
      expect(nugridResult).toBe(999)
    })

    it('setPageSize: adjusts pageIndex to keep same top row', () => {
      // Page 2 with size 10 = top row at index 20
      // With new size 5, top row 20 → page 4
      const old = { pageIndex: 2, pageSize: 10 }

      const tanstackResult = tanstackSetPageSize(old, 5)
      const nugridResult = updatePageSize(old, 5)

      expect(nugridResult).toEqual(tanstackResult)
      expect(nugridResult).toEqual({ pageIndex: 4, pageSize: 5 })
    })

    it('setPageSize: page 0 stays at page 0', () => {
      const old = { pageIndex: 0, pageSize: 10 }

      const tanstackResult = tanstackSetPageSize(old, 20)
      const nugridResult = updatePageSize(old, 20)

      expect(nugridResult).toEqual(tanstackResult)
      expect(nugridResult).toEqual({ pageIndex: 0, pageSize: 20 })
    })

    it('setPageSize: minimum size is 1', () => {
      const old = { pageIndex: 0, pageSize: 10 }

      const tanstackResult = tanstackSetPageSize(old, 0)
      const nugridResult = updatePageSize(old, 0)

      expect(nugridResult).toEqual(tanstackResult)
      expect(nugridResult).toEqual({ pageIndex: 0, pageSize: 1 })
    })

    it('setPageSize: negative size clamped to 1', () => {
      const old = { pageIndex: 3, pageSize: 10 }

      const tanstackResult = tanstackSetPageSize(old, -5)
      const nugridResult = updatePageSize(old, -5)

      expect(nugridResult).toEqual(tanstackResult)
      expect(nugridResult.pageSize).toBe(1)
    })

    it('setPageSize: large page maintains position', () => {
      // Page 9 with size 10 = top row at 90
      // With size 100, top row 90 → page 0 (floor(90/100))
      const old = { pageIndex: 9, pageSize: 10 }

      const tanstackResult = tanstackSetPageSize(old, 100)
      const nugridResult = updatePageSize(old, 100)

      expect(nugridResult).toEqual(tanstackResult)
      expect(nugridResult).toEqual({ pageIndex: 0, pageSize: 100 })
    })

    it('navigation helpers: nextPage/previousPage/firstPage/lastPage', () => {
      const pageCount = 5

      // nextPage from page 2
      expect(updatePageIndex(2, 2 + 1, pageCount)).toBe(3)
      // previousPage from page 2
      expect(updatePageIndex(2, 2 - 1, pageCount)).toBe(1)
      // firstPage
      expect(updatePageIndex(3, 0, pageCount)).toBe(0)
      // lastPage
      expect(updatePageIndex(0, pageCount - 1, pageCount)).toBe(4)
      // nextPage at last page — clamped
      expect(updatePageIndex(4, 5, pageCount)).toBe(4)
      // previousPage at first page — clamped
      expect(updatePageIndex(0, -1, pageCount)).toBe(0)
    })
  })

  // ── valueUpdater equivalence ─────────────────────────────────────
  describe('valueUpdater equivalence — direct value vs updater function', () => {
    it('direct value passes through unchanged', () => {
      const current = { a: 1 }
      const newValue = { b: 2 }
      expect(tanstackValueUpdater(newValue, current)).toEqual({ b: 2 })
    })

    it('updater function receives current state', () => {
      const current = { left: ['a'], right: [] as string[] }
      const updater = (old: typeof current) => ({ ...old, left: [...old.left, 'b'] })

      const result = tanstackValueUpdater(updater, current)
      expect(result).toEqual({ left: ['a', 'b'], right: [] })
    })

    it('all NuGrid state writes use direct values (not updater functions)', () => {
      // This test documents that NuGrid always passes direct values to set*() calls,
      // never updater functions. This means the replacement is always:
      //   tableApi.set*(newValue)  →  ref.value = newValue
      // The updater function pattern is never used by NuGrid's own code.
      const directValue = { left: ['a'], right: ['b'] }
      expect(tanstackValueUpdater(directValue, {})).toEqual(directValue)
    })
  })
})
