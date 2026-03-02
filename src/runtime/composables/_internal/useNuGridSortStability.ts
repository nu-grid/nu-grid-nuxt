import type { Row, SortingState } from '@tanstack/vue-table'
import type { Ref } from 'vue'

import { computed, nextTick, ref, watch } from 'vue'

/**
 * Sort stability composable — manages row order after cell edits or external
 * data mutations in sorted columns.
 *
 * When mode is 'maintain': captures a snapshot of row IDs before a change,
 * then reorders TanStack's re-sorted rows to match the snapshot. Tracks which
 * columns have stale sort state so the header can show an indicator.
 *
 * When mode is 'resort': forces TanStack to re-sort after changes by writing a
 * new reference to sortingState, which invalidates the sorted row model memo.
 */
export function useNuGridSortStability<T>(
  sortingState: Ref<SortingState>,
  tableRows: Ref<Row<T>[]>,
  mode: Ref<'maintain' | 'resort'>,
  data: Ref<T[]>,
) {
  // Ordered row IDs captured just before a change mutates data
  const rowOrderSnapshot = ref<string[] | null>(null) as Ref<string[] | null>

  // Column IDs where the sort is stale (edited after sort)
  const staleColumns = ref<Set<string>>(new Set()) as Ref<Set<string>>

  // Track whether a resort is pending (for resort mode)
  let pendingResortColumnId: string | null = null

  // Flag: when true, the next data change was caused by cell editing (not external)
  let cellEditCausedChange = false

  // Last settled row order — captured whenever displayRows is in passthrough mode.
  // Used to restore the pre-change order when an external mutation is detected.
  let lastSettledOrder: string[] = tableRows.value.map((r) => r.id)

  // Keep lastSettledOrder in sync whenever we're in passthrough mode
  watch(tableRows, (rows) => {
    if (!rowOrderSnapshot.value) {
      lastSettledOrder = rows.map((r) => r.id)
    }
  })

  /**
   * Called BEFORE cell value mutation.
   * - maintain mode: captures row order snapshot and marks column as stale
   * - resort mode: records that a sorted column was edited (resort happens after mutation)
   */
  function onBeforeSortedCellEdit(columnId: string) {
    // Mark that cell editing is responsible for the upcoming data change,
    // so the data watcher doesn't treat it as an external mutation.
    cellEditCausedChange = true

    // Only act on sorted columns
    const isSorted = sortingState.value.some((s) => s.id === columnId)
    if (!isSorted) return

    if (mode.value === 'maintain') {
      // Capture current visual row order (only if we don't already have a snapshot)
      if (!rowOrderSnapshot.value) {
        rowOrderSnapshot.value = tableRows.value.map((r) => r.id)
      }

      // Mark this column as stale
      const next = new Set(staleColumns.value)
      next.add(columnId)
      staleColumns.value = next
    } else {
      // Resort mode: flag for post-mutation re-sort
      pendingResortColumnId = columnId
    }
  }

  /**
   * Called AFTER cell value mutation and data reactivity trigger.
   * In resort mode, forces TanStack to re-sort by writing a new sorting state reference.
   */
  function onAfterSortedCellEdit() {
    if (pendingResortColumnId && mode.value === 'resort') {
      // Force TanStack's getSortedRowModel memo to invalidate by writing
      // a new array reference to sortingState (same values, new identity)
      nextTick(() => {
        sortingState.value = [...sortingState.value]
      })
    }
    pendingResortColumnId = null
  }

  /**
   * Clear stale state and snapshot (e.g. when user re-sorts)
   */
  function clearStale() {
    rowOrderSnapshot.value = null
    staleColumns.value = new Set()
  }

  // When sorting state changes (user clicks sort header), clear the snapshot
  watch(sortingState, () => {
    clearStale()
  })

  /**
   * Detect external data mutations (not caused by cell editing).
   * In maintain mode: freeze the current visual row order.
   * In resort mode: force TanStack to re-sort.
   */
  watch(data, () => {
    if (cellEditCausedChange) {
      cellEditCausedChange = false
      return
    }

    // No active sort — nothing to stabilize
    if (sortingState.value.length === 0) return

    if (mode.value === 'maintain' && !rowOrderSnapshot.value) {
      // Freeze the pre-change row order
      if (lastSettledOrder.length > 0) {
        rowOrderSnapshot.value = [...lastSettledOrder]
        // Mark all sorted columns as stale (we don't know which columns were affected)
        staleColumns.value = new Set(sortingState.value.map((s) => s.id))
      }
    }

    if (mode.value === 'resort') {
      nextTick(() => {
        sortingState.value = [...sortingState.value]
      })
    }
  })

  /**
   * Display rows: when a snapshot exists, reorder TanStack's rows to match
   * the frozen order. New rows (not in snapshot) are appended at the end.
   * When no snapshot, pass through tableRows directly.
   */
  const displayRows = computed<Row<T>[]>(() => {
    const snapshot = rowOrderSnapshot.value
    if (!snapshot) {
      return tableRows.value
    }

    const rowMap = new Map<string, Row<T>>()
    for (const row of tableRows.value) {
      rowMap.set(row.id, row)
    }

    // Reorder to match snapshot
    const ordered: Row<T>[] = []
    for (const id of snapshot) {
      const row = rowMap.get(id)
      if (row) {
        ordered.push(row)
        rowMap.delete(id)
      }
    }

    // Append any new rows that weren't in the snapshot
    for (const row of rowMap.values()) {
      ordered.push(row)
    }

    return ordered
  })

  return {
    displayRows,
    onBeforeSortedCellEdit,
    onAfterSortedCellEdit,
    staleColumns,
    clearStale,
  }
}
