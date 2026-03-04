/**
 * Pure functions for state management — replaces TanStack's set*() methods.
 *
 * Each function mirrors TanStack's internal logic so NuGrid can manage
 * state directly via refs instead of going through tableApi.set*().
 */

/**
 * Toggle a row's selection state.
 * Replaces `row.toggleSelected()` — mirrors TanStack's mutateRowIsSelected logic.
 *
 * In multi-select mode, adds/removes the row from the selection.
 * In single-select mode, clears all other selections when selecting.
 */
export function toggleRowSelected(
  oldSelection: Record<string, boolean>,
  rowId: string,
  value: boolean,
  multiSelect: boolean,
): Record<string, boolean> {
  const next = { ...oldSelection }

  if (value) {
    if (!multiSelect) {
      Object.keys(next).forEach(key => delete next[key])
    }
    next[rowId] = true
  } else {
    delete next[rowId]
  }

  return next
}

/**
 * Update pagination page size.
 * Replaces `tableApi.setPageSize()` — mirrors TanStack's RowPagination logic.
 *
 * Adjusts pageIndex to keep the same top row visible after page size changes.
 */
export function updatePageSize(
  old: { pageIndex: number; pageSize: number },
  newPageSize: number,
): { pageIndex: number; pageSize: number } {
  const pageSize = Math.max(1, newPageSize)
  const topRowIndex = old.pageSize * old.pageIndex
  const pageIndex = Math.floor(topRowIndex / pageSize)
  return { pageSize, pageIndex }
}

/**
 * Update pagination page index.
 * Replaces `tableApi.setPageIndex()` — mirrors TanStack's RowPagination logic.
 *
 * Clamps to [0, pageCount - 1]. If pageCount is undefined, no upper clamp.
 */
export function updatePageIndex(
  _oldPageIndex: number,
  newPageIndex: number,
  pageCount: number | undefined,
): number {
  const maxPageIndex =
    pageCount === undefined ? Number.MAX_SAFE_INTEGER : pageCount - 1
  return Math.max(0, Math.min(newPageIndex, maxPageIndex))
}
