import type { TableData } from '@nuxt/ui'
import type { Row, RowPinningState, SortingState, Table } from '@tanstack/vue-table'
import type { Ref } from 'vue'

import { computed, shallowRef } from 'vue'

import { resolveComparator } from '../../utils/sortingFns'

/**
 * Per-column sort metadata resolved from column definitions.
 * Cached separately from the actual sort so it only rebuilds when
 * sortingState changes (not on every data change).
 */
export interface ColumnSortEntry {
  id: string
  desc: boolean
  sortUndefined?: false | -1 | 1 | 'first' | 'last'
  invertSorting?: boolean
  comparator: (a: unknown, b: unknown) => number
  getValue: (row: Row<any>) => unknown
}

/**
 * NuGrid-owned sorting composable.
 *
 * Replaces TanStack's `getSortedRowModel()` with a Vue computed that we fully
 * control. No memo invalidation tricks, no reference cloning — just reactive
 * dependencies that Vue tracks automatically.
 *
 * Performance optimizations:
 * - Column resolution is cached in `sortConfig` (only depends on sortingState).
 * - Pre-sorted detection: O(n) scan skips sort when order is unchanged.
 * - Single-column fast path: no Schwartzian decoration overhead for k=1.
 * - Multi-column Schwartzian transform: sort keys pre-extracted O(n×k).
 * - Incremental re-sort: single-cell edits use O(n + log n) binary insertion.
 * - movedRowIds: tracks which rows changed position for downstream consumers.
 */
export function useNuGridSorting<T extends TableData>(
  rows: Ref<Row<T>[]>,
  sortingState: Ref<SortingState>,
  table: Table<T>,
  rowPinningState?: Ref<RowPinningState>,
) {
  // Level 1: resolve sort column config (only re-evaluates when sortingState changes)
  const sortConfig = computed<ColumnSortEntry[] | null>(() => {
    const sorting = sortingState.value
    if (!sorting.length) return null

    const entries: ColumnSortEntry[] = []

    for (const sortEntry of sorting) {
      const column = table.getColumn(sortEntry.id)
      if (!column) continue
      if (column.getCanSort() === false) continue

      const def = column.columnDef
      const sortAccessor = def.sortAccessor as
        | string
        | ((row: T) => unknown)
        | undefined

      // Resolve comparator from explicit sortingFn or inferred cell type
      const sortingFn = def.sortingFn as
        | string
        | ((a: unknown, b: unknown) => number)
        | undefined
      const cellDataType = def.cellDataType as string | undefined
      const comparator = resolveComparator(sortingFn, cellDataType || undefined)

      // Build value getter based on sortAccessor
      let getValue: (row: Row<T>) => unknown
      if (typeof sortAccessor === 'function') {
        getValue = (row) => sortAccessor(row.original)
      } else if (typeof sortAccessor === 'string') {
        getValue = (row) => (row.original as Record<string, unknown>)[sortAccessor]
      } else {
        const colId = sortEntry.id
        getValue = (row) => row.getValue(colId)
      }

      entries.push({
        id: sortEntry.id,
        desc: sortEntry.desc ?? false,
        sortUndefined: def.sortUndefined,
        invertSorting: def.invertSorting,
        comparator,
        getValue,
      })
    }

    return entries.length ? entries : null
  })

  // ---------------------------------------------------------------------------
  // Incremental re-sort state (non-reactive — consumed inside computed)
  // ---------------------------------------------------------------------------
  let pendingEditRowId: string | null = null
  let lastSortedIds: string[] = []

  /**
   * Signal that a single row was edited. The next sort evaluation will
   * attempt O(n + log n) binary insertion instead of O(n log n) full sort.
   */
  function notifyEditedRow(rowId: string) {
    pendingEditRowId = rowId
  }

  // ---------------------------------------------------------------------------
  // Moved row tracking for sort-aware virtualization
  // ---------------------------------------------------------------------------
  const movedRowIds = shallowRef<ReadonlySet<string>>(new Set())

  function updateMovedIds(newIds: string[]) {
    if (lastSortedIds.length === 0 || lastSortedIds.length !== newIds.length) {
      // First sort or row count changed — all rows "moved"
      movedRowIds.value = new Set(newIds)
    } else {
      const moved = new Set<string>()
      for (let i = 0; i < newIds.length; i++) {
        if (newIds[i] !== lastSortedIds[i]) {
          moved.add(newIds[i]!)
        }
      }
      movedRowIds.value = moved
    }
    lastSortedIds = newIds
  }

  // Level 2: actual sort (re-evaluates when rows, sortConfig, or pinning changes)
  const sortedRows = computed<Row<T>[]>(() => {
    const config = sortConfig.value
    const pinning = rowPinningState?.value
    const allRows = rows.value
    if (!allRows.length) {
      lastSortedIds = []
      movedRowIds.value = new Set()
      return allRows
    }

    // Check for pinned rows
    const topIds = pinning?.top
    const bottomIds = pinning?.bottom
    const hasPinning = (topIds?.length ?? 0) > 0 || (bottomIds?.length ?? 0) > 0

    // No sort and no pinning — pass through unchanged
    if (!config && !hasPinning) {
      const ids = allRows.map((r) => r.id)
      updateMovedIds(ids)
      return allRows
    }

    // Partition pinned rows out before sorting
    let pinnedTop: Row<T>[] = []
    let pinnedBottom: Row<T>[] = []
    let unpinned: Row<T>[] = allRows

    if (hasPinning) {
      const topSet = topIds?.length ? new Set(topIds) : null
      const bottomSet = bottomIds?.length ? new Set(bottomIds) : null
      pinnedTop = []
      pinnedBottom = []
      unpinned = []
      for (const row of allRows) {
        if (topSet?.has(row.id)) pinnedTop.push(row)
        else if (bottomSet?.has(row.id)) pinnedBottom.push(row)
        else unpinned.push(row)
      }
      // Preserve pinned order as specified in the arrays
      if (topIds && pinnedTop.length > 1) {
        const order = new Map(topIds.map((id, i) => [id, i]))
        pinnedTop.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      }
      if (bottomIds && pinnedBottom.length > 1) {
        const order = new Map(bottomIds.map((id, i) => [id, i]))
        pinnedBottom.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      }
    }

    let sorted: Row<T>[]

    if (config) {
      // Try incremental sort if a single row was edited
      const editId = pendingEditRowId
      pendingEditRowId = null

      const incremental =
        editId && lastSortedIds.length === unpinned.length
          ? incrementalSort(unpinned, lastSortedIds, editId, config)
          : null

      sorted = incremental ?? sortRows(unpinned, config)
    } else {
      sorted = unpinned
    }

    const result = hasPinning ? [...pinnedTop, ...sorted, ...pinnedBottom] : sorted
    updateMovedIds(result.map((r) => r.id))
    return result
  })

  return { sortedRows, sortConfig, notifyEditedRow, movedRowIds }
}

// ---------------------------------------------------------------------------
// Incremental sort — O(n + log n) for single-row edits
//
// When a single row was edited in a sorted column, we skip the full
// O(n log n) sort. Instead: rebuild the previous order with new Row objects,
// remove the edited row, binary search for its new position, and splice in.
// ---------------------------------------------------------------------------

function incrementalSort<T extends TableData>(
  rows: Row<T>[],
  previousIds: string[],
  editedRowId: string,
  config: ColumnSortEntry[],
): Row<T>[] | null {
  // Row count must match (no adds/removes)
  if (rows.length !== previousIds.length) return null

  // Build ID → Row map
  const rowMap = new Map<string, Row<T>>()
  for (const row of rows) {
    rowMap.set(row.id, row)
  }

  // Verify all previous IDs still exist
  for (const id of previousIds) {
    if (!rowMap.has(id)) return null
  }

  // Rebuild in previous order, skipping the edited row
  const result: Row<T>[] = []
  for (const id of previousIds) {
    if (id === editedRowId) continue
    result.push(rowMap.get(id)!)
  }

  // Get the edited row
  const editedRow = rowMap.get(editedRowId)
  if (!editedRow) return null

  // Binary search for insertion point
  const insertAt = binarySearchInsert(result, editedRow, config)
  result.splice(insertAt, 0, editedRow)

  // Recursively sort sub-rows (still needed for grouped data)
  for (const row of result) {
    if (row.subRows?.length) {
      row.subRows = sortRows(row.subRows, config)
    }
  }

  return result
}

/**
 * Binary search for the correct insertion position of `newRow` in a sorted array.
 * Uses the same comparison logic as the full sort (multi-column, desc, invertSorting).
 */
function binarySearchInsert<T extends TableData>(
  sorted: Row<T>[],
  newRow: Row<T>,
  config: ColumnSortEntry[],
): number {
  let low = 0
  let high = sorted.length

  while (low < high) {
    const mid = (low + high) >>> 1
    if (compareRows(sorted[mid]!, newRow, config) <= 0) {
      low = mid + 1
    } else {
      high = mid
    }
  }

  return low
}

/**
 * Compare two rows using the full sort config (multi-column, undefined handling,
 * desc, invertSorting). Used by binary search — only O(log n) calls per sort.
 */
function compareRows<T extends TableData>(
  a: Row<T>,
  b: Row<T>,
  config: ColumnSortEntry[],
): number {
  for (const entry of config) {
    const aValue = entry.getValue(a)
    const bValue = entry.getValue(b)

    let sortInt = 0

    const sortUndefined = entry.sortUndefined
    if (sortUndefined) {
      const aUndefined = aValue === undefined
      const bUndefined = bValue === undefined
      if (aUndefined || bUndefined) {
        if (sortUndefined === 'first') return aUndefined ? -1 : 1
        if (sortUndefined === 'last') return aUndefined ? 1 : -1
        sortInt =
          aUndefined && bUndefined
            ? 0
            : aUndefined
              ? (sortUndefined as number)
              : -(sortUndefined as number)
      }
    }

    if (sortInt === 0) {
      sortInt = entry.comparator(aValue, bValue)
    }

    if (sortInt !== 0) {
      if (entry.desc) sortInt *= -1
      if (entry.invertSorting) sortInt *= -1
      return sortInt
    }
  }

  return a.index - b.index
}

// ---------------------------------------------------------------------------
// Core sort engine
//
// Three tiers, chosen automatically:
// 1. Pre-sorted detection — O(n) scan; skips sort entirely when order is unchanged
// 2. Single-column fast path — no Schwartzian decoration overhead (no keys[]
//    array per row, no inner loop in comparator, pre-computed direction flip)
// 3. Multi-column Schwartzian transform — full decoration for k ≥ 2
// ---------------------------------------------------------------------------

function sortRows<T extends TableData>(
  rows: Row<T>[],
  config: ColumnSortEntry[],
): Row<T>[] {
  if (rows.length <= 1) {
    return handleSubRows(rows, config)
  }

  // Pre-sorted detection: O(n) scan with early exit for unsorted data.
  // Avoids O(n log n) sort when data changes don't affect sort order
  // (e.g. editing a non-sorted column, external mutation of non-sorted fields).
  if (isAlreadySorted(rows, config)) {
    return handleSubRows(rows, config)
  }

  return config.length === 1
    ? sortRowsSingleColumn(rows, config[0]!, config)
    : sortRowsMultiColumn(rows, config)
}

/**
 * O(n) pre-sorted check. Returns true if rows are already in the correct
 * sort order (including stability — tied rows must be in index order).
 * Short-circuits on the first out-of-order pair, so unsorted arrays add
 * negligible overhead.
 */
function isAlreadySorted<T extends TableData>(
  rows: Row<T>[],
  config: ColumnSortEntry[],
): boolean {
  for (let i = 1; i < rows.length; i++) {
    if (compareRows(rows[i - 1]!, rows[i]!, config) > 0) {
      return false
    }
  }
  return true
}

/** Recursively sort sub-rows without re-sorting the top level. */
function handleSubRows<T extends TableData>(
  rows: Row<T>[],
  config: ColumnSortEntry[],
): Row<T>[] {
  for (const row of rows) {
    if (row.subRows?.length) {
      row.subRows = sortRows(row.subRows, config)
    }
  }
  return rows
}

// ---------------------------------------------------------------------------
// Single-column fast path
//
// When sorting by one column (the most common case), skip Schwartzian
// decoration overhead: no keys[] array per row, no inner loop in the
// comparator, and the direction flip is pre-computed once.
// ---------------------------------------------------------------------------

function sortRowsSingleColumn<T extends TableData>(
  rows: Row<T>[],
  entry: ColumnSortEntry,
  config: ColumnSortEntry[],
): Row<T>[] {
  const n = rows.length
  const { comparator, desc, invertSorting, sortUndefined } = entry

  // Decorate: extract single value per row (no keys[] array)
  const decorated: Array<{ row: Row<T>; value: unknown }> = new Array(n)
  for (let i = 0; i < n; i++) {
    const row = rows[i]!
    decorated[i] = { row, value: entry.getValue(row) }
  }

  // Pre-compute direction multiplier (desc × invertSorting)
  const flip = (desc ? -1 : 1) * (invertSorting ? -1 : 1)

  decorated.sort((a, b) => {
    const aValue = a.value
    const bValue = b.value

    if (sortUndefined) {
      const aUndefined = aValue === undefined
      const bUndefined = bValue === undefined
      if (aUndefined || bUndefined) {
        // 'first'/'last' are absolute — unaffected by sort direction
        if (sortUndefined === 'first') return aUndefined ? -1 : 1
        if (sortUndefined === 'last') return aUndefined ? 1 : -1
        // Numeric form (-1/1): direction-aware
        const sortInt =
          aUndefined && bUndefined
            ? 0
            : aUndefined
              ? (sortUndefined as number)
              : -(sortUndefined as number)
        if (sortInt !== 0) return sortInt * flip
      }
    }

    const sortInt = comparator(aValue, bValue)
    if (sortInt !== 0) return sortInt * flip
    return a.row.index - b.row.index
  })

  // Undecorate + recursively sort sub-rows
  const result = new Array<Row<T>>(n)
  for (let i = 0; i < n; i++) {
    const row = decorated[i]!.row
    if (row.subRows?.length) {
      row.subRows = sortRows(row.subRows, config)
    }
    result[i] = row
  }
  return result
}

// ---------------------------------------------------------------------------
// Multi-column Schwartzian transform
//
// Pre-extracts sort keys for every row (O(n×k) getValue calls), then sorts
// using the pre-extracted keys (comparisons are direct value lookups).
// Without this, getValue() runs inside the comparator — O(n log n × k) calls.
// For 1000 rows × 3 sort columns: 3,000 vs ~30,000 getValue() calls.
// ---------------------------------------------------------------------------

/** Row decorated with pre-extracted sort keys */
interface DecoratedRow<T extends TableData> {
  row: Row<T>
  keys: unknown[]
}

function sortRowsMultiColumn<T extends TableData>(
  rows: Row<T>[],
  config: ColumnSortEntry[],
): Row<T>[] {
  const k = config.length

  // Decorate: extract sort keys once per row (O(n × k))
  const decorated: DecoratedRow<T>[] = new Array(rows.length)
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]!
    const keys = new Array(k)
    for (let c = 0; c < k; c++) {
      keys[c] = config[c]!.getValue(row)
    }
    decorated[r] = { row, keys }
  }

  // Sort using pre-extracted keys
  decorated.sort((a, b) => {
    for (let i = 0; i < k; i++) {
      const entry = config[i]!
      const aValue = a.keys[i]
      const bValue = b.keys[i]

      let sortInt = 0

      // Handle undefined values (matches TanStack's behavior exactly)
      const sortUndefined = entry.sortUndefined
      if (sortUndefined) {
        const aUndefined = aValue === undefined
        const bUndefined = bValue === undefined

        if (aUndefined || bUndefined) {
          if (sortUndefined === 'first') return aUndefined ? -1 : 1
          if (sortUndefined === 'last') return aUndefined ? 1 : -1
          sortInt =
            aUndefined && bUndefined
              ? 0
              : aUndefined
                ? (sortUndefined as number)
                : -(sortUndefined as number)
        }
      }

      // Run comparator if not already resolved by undefined handling
      if (sortInt === 0) {
        sortInt = entry.comparator(aValue, bValue)
      }

      // Apply desc and invertSorting
      if (sortInt !== 0) {
        if (entry.desc) sortInt *= -1
        if (entry.invertSorting) sortInt *= -1
        return sortInt
      }
    }

    // Stable sort: preserve original order for ties
    return a.row.index - b.row.index
  })

  // Undecorate + recursively sort sub-rows
  const result = new Array<Row<T>>(decorated.length)
  for (let i = 0; i < decorated.length; i++) {
    const row = decorated[i]!.row
    if (row.subRows?.length) {
      row.subRows = sortRows(row.subRows, config)
    }
    result[i] = row
  }

  return result
}
