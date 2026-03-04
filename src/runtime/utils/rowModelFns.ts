/**
 * Pure functions for row model transformations — replaces TanStack's
 * getPaginationRowModel and getExpandedRowModel.
 *
 * These run inside NuGrid's pipeline (after TanStack creates Row objects)
 * and produce the same results as TanStack's row model factories.
 */

/**
 * Row-like object that can be expanded.
 * Compatible with TanStack Row objects (has .id and .subRows).
 */
interface ExpandableRow {
  id: string
  subRows?: ExpandableRow[]
}

/**
 * Expand grouped rows based on expanded state.
 * Replaces `getExpandedRowModel()` — mirrors TanStack's expandRows logic.
 *
 * Recursively flattens the row tree: for each row, includes it in the output,
 * then if it has subRows AND is expanded, recursively includes its children.
 *
 * @param rows - Top-level rows (may have nested subRows from grouping)
 * @param expandedState - `true` to expand all, or Record<string, boolean> for selective
 * @returns Flat array of visible rows
 */
export function expandRows<T extends ExpandableRow>(
  rows: T[],
  expandedState: true | Record<string, boolean>,
): T[] {
  const result: T[] = []

  const handleRow = (row: T) => {
    result.push(row)

    if (row.subRows?.length) {
      const isExpanded = expandedState === true || (expandedState as Record<string, boolean>)[row.id]
      if (isExpanded) {
        (row.subRows as T[]).forEach(handleRow)
      }
    }
  }

  rows.forEach(handleRow)
  return result
}

/**
 * Paginate rows by slicing to the requested page.
 * Replaces `getPaginationRowModel()` — mirrors TanStack's slice logic.
 *
 * @param rows - All rows to paginate
 * @param pageIndex - 0-based page index
 * @param pageSize - Number of rows per page
 * @returns Slice of rows for the requested page
 */
export function paginateRows<T>(
  rows: T[],
  pageIndex: number,
  pageSize: number,
): T[] {
  const pageStart = pageSize * pageIndex
  const pageEnd = pageStart + pageSize
  return rows.slice(pageStart, pageEnd)
}
