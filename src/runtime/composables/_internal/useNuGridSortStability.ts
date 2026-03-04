import type { TableData } from '../../types/table-data'
import type { Row, SortingState } from '../../engine'
import type { Ref, ShallowRef } from 'vue'

import { usePreferredReducedMotion } from '@vueuse/core'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import type { NuGridFocus } from '../../types/_internal'

/**
 * Sort stability composable — manages row order after cell edits or external
 * data mutations in sorted columns. Includes FLIP animation for smooth
 * row transitions when re-sorting.
 *
 * When mode is 'maintain': captures a snapshot of row IDs before a change,
 * then reorders the engine's re-sorted rows to match the snapshot. Tracks which
 * columns have stale sort state so the header can show an indicator.
 *
 * When mode is 'resort': forces the engine to re-sort after changes by writing a
 * new reference to sortingState, which invalidates the sorted row model memo.
 */
export function useNuGridSortStability<T extends TableData>(
  sortingState: Ref<SortingState>,
  tableRows: Ref<Row<T>[]>,
  mode: Ref<'maintain' | 'resort'>,
  data: Ref<T[]>,
  rootRef: Ref<{ $el?: HTMLElement } | null | undefined>,
  focusFnsRef: ShallowRef<NuGridFocus<T> | null>,
  focusedRowId: Ref<string | null>,
  sortDebounce: Ref<number>,
  notifyEditedRow: (rowId: string) => void,
) {
  // Ordered row IDs captured just before a change mutates data
  const rowOrderSnapshot = ref<string[] | null>(null) as Ref<string[] | null>

  // Column IDs where the sort is stale (edited after sort)
  const staleColumns = ref<Set<string>>(new Set()) as Ref<Set<string>>

  // Track whether a resort is pending (for resort mode)
  let pendingResortColumnId: string | null = null

  // Debounce timer for resort mode — batches rapid edits into a single re-sort
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // Flag: when true, the next data change was caused by cell editing (not external)
  let cellEditCausedChange = false

  // Skip data changes during initial setup (async data load, settings hydration, etc.)
  // Uses onMounted + delay to wait for all initial watchers and reactivity to settle.
  let isSettled = false
  onMounted(() => {
    setTimeout(() => {
      isSettled = true
    }, 250)
  })

  // Last settled row order — updated inside displayRows computed when in passthrough
  // mode. Because computeds are lazy (only evaluate during render), watch(data)
  // (pre-flush, fires before render) always reads the PREVIOUS render's order.
  let lastSettledOrder: string[] = tableRows.value.map((r) => r.id)

  // ---------------------------------------------------------------------------
  // FLIP animation — rows smoothly slide to new positions on re-sort
  // ---------------------------------------------------------------------------
  const prefersReducedMotion = usePreferredReducedMotion()
  const flipPositions = new Map<string, number>()
  let flipCleanupTimer: ReturnType<typeof setTimeout> | null = null

  function getRootEl(): HTMLElement | null {
    return (rootRef.value as any)?.$el ?? null
  }

  /**
   * Capture current Y positions of all visible row elements.
   * Must be called BEFORE the DOM re-renders with new row order.
   */
  function captureRowPositions() {
    flipPositions.clear()
    if (flipCleanupTimer) {
      clearTimeout(flipCleanupTimer)
      flipCleanupTimer = null
    }
    const root = getRootEl()
    if (!root || prefersReducedMotion.value === 'reduce') return
    // Skip FLIP for virtualized grids (rows use absolute positioning + transforms)
    const firstRow = root.querySelector('[data-row-id]') as HTMLElement | null
    if (firstRow?.dataset.index !== undefined) return
    for (const el of root.querySelectorAll('[data-row-id]')) {
      const rowId = (el as HTMLElement).dataset.rowId
      if (rowId) flipPositions.set(rowId, el.getBoundingClientRect().top)
    }
  }

  /**
   * After Vue re-renders, calculate position deltas and animate rows
   * from their old positions to their new positions (FLIP technique).
   */
  function playFlipAnimation() {
    if (flipPositions.size === 0) return
    nextTick(() => {
      const root = getRootEl()
      if (!root) {
        flipPositions.clear()
        return
      }

      requestAnimationFrame(() => {
        const rowEls = root.querySelectorAll('[data-row-id]')
        // Invert: offset each row to its old visual position
        for (const el of rowEls) {
          const htmlEl = el as HTMLElement
          const oldTop = flipPositions.get(htmlEl.dataset.rowId ?? '')
          if (oldTop === undefined) continue
          const deltaY = oldTop - htmlEl.getBoundingClientRect().top
          if (Math.abs(deltaY) < 1) continue
          htmlEl.style.transform = `translateY(${deltaY}px)`
          htmlEl.style.transition = 'none'
        }
        // Play: animate to final positions
        requestAnimationFrame(() => {
          for (const el of rowEls) {
            const htmlEl = el as HTMLElement
            htmlEl.style.transition = 'transform 300ms cubic-bezier(0.25, 0.1, 0.25, 1)'
            htmlEl.style.transform = ''
          }
        })
        // Cleanup inline styles after animation completes
        flipCleanupTimer = setTimeout(() => {
          for (const el of rowEls) {
            const htmlEl = el as HTMLElement
            htmlEl.style.transition = ''
            htmlEl.style.transform = ''
          }
          flipPositions.clear()
          flipCleanupTimer = null
        }, 350)
      })
    })
  }

  // ---------------------------------------------------------------------------
  // Focus preservation — restore focused row after reorder
  // ---------------------------------------------------------------------------
  let savedFocusRowId: string | null = null

  function saveFocus() {
    // Prefer focusedRowId model, but fall back to looking up from focusedCell.
    // focusedRowIdModel may be null when focusRowById() was used (it skips model sync
    // to avoid circular updates), so we resolve the ID from the cell's row index.
    //
    // Use lastSettledOrder (previous render's row IDs) for the fallback — NOT tableRows,
    // because the sync data watcher in useNuGridCore has already updated the engine with
    // the new data by the time this pre-flush watcher runs, so tableRows already reflects
    // the new sort order, not the previous visual order.
    savedFocusRowId = focusedRowId.value
    if (!savedFocusRowId && focusFnsRef.value?.focusedCell.value) {
      const rowIndex = focusFnsRef.value.focusedCell.value.rowIndex
      savedFocusRowId = lastSettledOrder[rowIndex] ?? null
    }
  }

  function restoreFocus() {
    if (!savedFocusRowId) return
    const rowId = savedFocusRowId
    savedFocusRowId = null
    nextTick(() => {
      if (focusFnsRef.value?.gridHasFocus.value) {
        // Grid has focus — full restore with scroll and DOM focus
        focusFnsRef.value?.focusRowById(rowId, { align: 'nearest' })
      } else {
        // Grid doesn't have focus — update internal state only so the
        // highlight tracks the row's new position without stealing focus
        const rowIndex = tableRows.value.findIndex((r) => r.id === rowId)
        if (rowIndex >= 0) {
          const currentCol = focusFnsRef.value?.focusedCell.value?.columnIndex ?? 0
          focusFnsRef.value?.setFocusedCell({ rowIndex, columnIndex: currentCol })
          // Scroll row into view without stealing DOM focus
          nextTick(() => {
            focusFnsRef.value?.scrollRowIntoView(rowId)
          })
        }
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Sort stability core logic
  // ---------------------------------------------------------------------------

  /**
   * Called BEFORE cell value mutation.
   * - maintain mode: captures row order snapshot and marks column as stale
   * - resort mode: records that a sorted column was edited (resort happens after mutation)
   * - signals the sorting composable for incremental re-sort
   */
  function onBeforeSortedCellEdit(columnId: string, rowId: string) {
    // Mark that cell editing is responsible for the upcoming data change,
    // so the data watcher doesn't treat it as an external mutation.
    cellEditCausedChange = true

    // Signal the sorting composable so it can attempt incremental re-sort
    notifyEditedRow(rowId)

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
      // Resort mode with debounce: freeze order during rapid edits, release when paused
      const delay = sortDebounce.value
      if (delay > 0) {
        // First edit in a debounce window — capture snapshot to freeze visual order
        if (!debounceTimer) {
          rowOrderSnapshot.value = tableRows.value.map((r) => r.id)
          saveFocus()
          captureRowPositions()
        }
        // Reset the debounce timer
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          debounceTimer = null
          // Release: clear snapshot so the sort computed's natural order shows through
          rowOrderSnapshot.value = null
          playFlipAnimation()
          restoreFocus()
        }, delay)
        pendingResortColumnId = null // suppress immediate animation in onAfterSortedCellEdit
      } else {
        // No debounce: immediate resort with animation
        pendingResortColumnId = columnId
        saveFocus()
        captureRowPositions()
      }
    }
  }

  /**
   * Called AFTER cell value mutation and data reactivity trigger.
   * In resort mode, the sort computed re-evaluates automatically when data
   * changes — just play the animation and restore focus.
   */
  function onAfterSortedCellEdit() {
    if (pendingResortColumnId && mode.value === 'resort') {
      nextTick(() => {
        playFlipAnimation()
        restoreFocus()
      })
    }
    pendingResortColumnId = null
  }

  /**
   * Clear stale state and snapshot (e.g. when user clicks the amber dot)
   * Includes FLIP animation so rows slide to their re-sorted positions.
   */
  function clearStale() {
    if (rowOrderSnapshot.value) {
      saveFocus()
      captureRowPositions()
    }
    rowOrderSnapshot.value = null
    staleColumns.value = new Set()
    playFlipAnimation()
    restoreFocus()
  }

  // When sorting state changes (user clicks sort header), clear the snapshot
  // and preserve focus on the same row at its new position.
  watch(sortingState, () => {
    saveFocus()
    rowOrderSnapshot.value = null
    staleColumns.value = new Set()
    restoreFocus()
  })

  /**
   * Detect external data mutations (not caused by cell editing).
   * In maintain mode: freeze the current visual row order.
   * In resort mode: force the engine to re-sort with FLIP animation.
   */
  watch(data, () => {
    if (cellEditCausedChange) {
      cellEditCausedChange = false
      return
    }

    // Skip initial data load (e.g. async fetch during mount)
    if (!isSettled) return

    // No active sort — nothing to stabilize
    if (sortingState.value.length === 0) return

    if (mode.value === 'maintain' && !rowOrderSnapshot.value) {
      // Only freeze if the engine's new sort order actually differs from the displayed order.
      // This avoids false stale indicators when data changes don't affect sort (e.g. filter changes).
      if (lastSettledOrder.length > 0) {
        const newOrder = tableRows.value.map((r) => r.id)
        const orderChanged =
          newOrder.length !== lastSettledOrder.length ||
          newOrder.some((id, i) => id !== lastSettledOrder[i])
        if (orderChanged) {
          rowOrderSnapshot.value = [...lastSettledOrder]
          staleColumns.value = new Set(sortingState.value.map((s) => s.id))
        }
      }
    }

    if (mode.value === 'resort') {
      // Sort computed re-evaluates automatically when data changes.
      // Just capture positions for FLIP animation and restore focus.
      saveFocus()
      captureRowPositions()
      nextTick(() => {
        playFlipAnimation()
        restoreFocus()
      })
    }
  })

  /**
   * Display rows: when a snapshot exists, reorder the engine's rows to match
   * the frozen order. New rows (not in snapshot) are appended at the end.
   * When no snapshot, pass through tableRows directly.
   */
  const displayRows = computed<Row<T>[]>(() => {
    const snapshot = rowOrderSnapshot.value
    if (!snapshot) {
      const rows = tableRows.value
      // Track settled order for external mutation detection.
      // Safe as a side effect because computeds are lazy — this only runs
      // during render, after all pre-flush watchers (including watch(data))
      // have already read the previous value.
      lastSettledOrder = rows.map((r) => r.id)
      return rows
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
