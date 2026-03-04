import type { TableData } from '../../types/table-data'
import type { ColumnFiltersState, FilterFn } from '../../engine'
import type { Ref } from 'vue'

import { computed } from 'vue'

import type { NuGridColumn } from '../../types/column'
import { filterFns, resolveFilterFn } from '../../utils/filteringFns'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ResolvedColumnFilter {
  /** Column ID (matches ColumnFilter.id) */
  id: string
  /** Accessor key to read value from raw data item */
  accessorKey: string
  /** Resolved filter function (FilterFn signature) */
  filterFn: FilterFn<any>
  /** Resolved filter value (after resolveFilterValue transform) */
  resolvedValue: unknown
}

/** Unresolved column filter — stored by filterConfig (no data dependency) */
interface ColumnFilterEntry {
  id: string
  accessorKey: string
  /** Raw filterFn from column definition (string name, function, or undefined) */
  rawFilterFn: string | FilterFn<any> | undefined
  /** Raw filter value from ColumnFiltersState */
  rawValue: unknown
}

interface FilterConfig {
  columnFilters: ColumnFilterEntry[]
  /** Lowercased search string (null when no global filter) */
  globalSearchLower: string | null
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

/**
 * NuGrid-owned filtering composable.
 *
 * Replaces TanStack's `getFilteredRowModel()` with a pre-filter on the raw
 * data array. Multi-level computed with optimizations:
 *
 * - Level 1: `filterConfig` — collects column filter entries and global
 *   search value. Only rebuilds when column filter state, global filter,
 *   or columns change. Does NOT depend on data.
 *
 * - Level 1b: `searchableKeys` — searchable column accessor keys.
 *   Only rebuilds when columns change.
 *
 * - Level 1c: `searchIndex` — pre-computed concatenated lowercased string
 *   per row for global filter. Rebuilds when data or searchable keys
 *   change, but NOT when the search value changes.
 *
 * - Level 2: `filteredData` — resolves filter functions (using first data
 *   item for auto-detection) and filters the raw data array.
 *
 * Optimizations:
 * - **Incremental cell edit**: When a cell is edited in a column that doesn't
 *   affect any active filter, returns the previous result (O(1), zero
 *   downstream recomputation).
 * - **Concatenated search index**: Global filter searches a single
 *   pre-lowercased concatenated string per row (one `includes()` call
 *   instead of N per-column calls).
 * - **Single-filter fast path**: When only one column filter is active and
 *   no global filter, uses a tighter loop with no inner iteration.
 */
export function useNuGridFiltering<T extends TableData>(
  data: Ref<T[]>,
  columns: Ref<NuGridColumn<T>[]>,
  globalFilter: Ref<string | undefined>,
  columnFilters: Ref<ColumnFiltersState>,
) {
  // -------------------------------------------------------------------------
  // Incremental cell edit tracking
  // -------------------------------------------------------------------------
  let pendingEditColumnId: string | null = null
  let lastResult: T[] | null = null

  /**
   * Signal that a cell edit is about to happen. Called BEFORE the data
   * mutation so the next `filteredData` evaluation can take the fast path.
   */
  function notifyEditedCell(columnId: string) {
    pendingEditColumnId = columnId
  }

  // -------------------------------------------------------------------------
  // Level 1: collect column filter config (depends on columnFilters + columns)
  // Does NOT access data — filter function resolution deferred to Level 2.
  // -------------------------------------------------------------------------
  const filterConfig = computed<FilterConfig | null>(() => {
    const colFilters = columnFilters.value
    const gFilter = globalFilter.value
    const cols = columns.value

    const hasColumnFilters = colFilters.length > 0
    const hasGlobalFilter = !!gFilter && gFilter.length > 0

    if (!hasColumnFilters && !hasGlobalFilter) return null

    // Build column accessor key map for quick lookup
    const columnMap = new Map<string, { accessorKey: string, filterFn?: FilterFn<any> | string }>()
    for (const col of cols) {
      const colAny = col as any
      const id = colAny.accessorKey ?? colAny.id
      if (!id) continue
      const accessorKey = colAny.accessorKey ?? id
      columnMap.set(id, { accessorKey, filterFn: colAny.filterFn })
    }

    // Collect column filter entries (unresolved — no data access)
    const columnFilterEntries: ColumnFilterEntry[] = []

    if (hasColumnFilters) {
      for (const cf of colFilters) {
        const colInfo = columnMap.get(cf.id)
        if (!colInfo) continue

        columnFilterEntries.push({
          id: cf.id,
          accessorKey: colInfo.accessorKey,
          rawFilterFn: colInfo.filterFn as string | FilterFn<any> | undefined,
          rawValue: cf.value,
        })
      }
    }

    const globalSearchLower = hasGlobalFilter ? gFilter!.toLowerCase() : null

    if (columnFilterEntries.length === 0 && !globalSearchLower) return null

    return {
      columnFilters: columnFilterEntries,
      globalSearchLower,
    }
  })

  // -------------------------------------------------------------------------
  // Level 1b: searchable column keys (depends on columns only)
  // -------------------------------------------------------------------------
  const searchableKeys = computed<string[]>(() => {
    const keys: string[] = []
    for (const col of columns.value) {
      if (!col.accessorKey && !col.id) continue
      if (col.enableSearching === false) continue
      const key = col.accessorKey ?? col.id
      if (key) keys.push(key)
    }
    return keys
  })

  // -------------------------------------------------------------------------
  // Level 1c: concatenated search index (depends on data + searchableKeys)
  // Each entry is all searchable column values for one row, lowercased and
  // joined with \0. Rebuilds when data changes, but NOT when search value
  // changes. Global filter uses a single includes() per row.
  // -------------------------------------------------------------------------
  const searchIndex = computed<string[] | null>(() => {
    const keys = searchableKeys.value
    if (keys.length === 0) return null

    const items = data.value
    const index: string[] = Array.from<string>({ length: items.length })

    for (let i = 0; i < items.length; i++) {
      const item = items[i]!
      let concat = ''
      for (let k = 0; k < keys.length; k++) {
        const val = item[keys[k]!]
        if (val != null) {
          if (concat) concat += '\0'
          concat += String(val).toLowerCase()
        }
      }
      index[i] = concat
    }

    return index
  })

  // -------------------------------------------------------------------------
  // Level 2: filter data (depends on data + filterConfig + searchIndex)
  // Resolves filter functions here (using first data item for auto-detect)
  // so filterConfig doesn't depend on data.
  // -------------------------------------------------------------------------
  const filteredData = computed<T[]>(() => {
    const config = filterConfig.value
    if (!config) {
      lastResult = null
      pendingEditColumnId = null
      return data.value
    }

    const items = data.value
    if (items.length === 0) {
      lastResult = null
      pendingEditColumnId = null
      return items
    }

    const { columnFilters: cfEntries, globalSearchLower } = config
    const hasGlobalFilter = globalSearchLower !== null

    // -----------------------------------------------------------------
    // Resolve filter functions (deferred from filterConfig to avoid
    // data dependency). Uses first data item for auto-detection.
    // -----------------------------------------------------------------
    const colFilters: ResolvedColumnFilter[] = []

    if (cfEntries.length > 0) {
      const firstItem = items[0]

      for (const entry of cfEntries) {
        const fn = resolveFilterFn(
          entry.rawFilterFn,
          firstItem ? firstItem[entry.accessorKey] : undefined,
        )

        if (fn.autoRemove?.(entry.rawValue)) continue

        const resolvedValue = fn.resolveFilterValue
          ? fn.resolveFilterValue(entry.rawValue)
          : entry.rawValue

        colFilters.push({
          id: entry.id,
          accessorKey: entry.accessorKey,
          filterFn: fn,
          resolvedValue,
        })
      }
    }

    const hasColFilters = colFilters.length > 0

    // If all column filters were autoRemoved and no global filter, pass through
    if (!hasColFilters && !hasGlobalFilter) {
      lastResult = null
      pendingEditColumnId = null
      return data.value
    }

    // -----------------------------------------------------------------
    // Incremental cell edit: if edited column doesn't affect any active
    // filter, return previous result (O(1))
    // -----------------------------------------------------------------
    if (pendingEditColumnId && lastResult) {
      const editCol = pendingEditColumnId
      pendingEditColumnId = null

      const affectsColumnFilter = hasColFilters && colFilters.some(cf => cf.id === editCol)
      const affectsGlobalFilter = hasGlobalFilter && searchableKeys.value.includes(editCol)

      if (!affectsColumnFilter && !affectsGlobalFilter) {
        return lastResult
      }
    }
    pendingEditColumnId = null

    // -----------------------------------------------------------------
    // Read search index for global filter
    // -----------------------------------------------------------------
    const sIdx = hasGlobalFilter ? searchIndex.value : null

    // -----------------------------------------------------------------
    // Single column filter fast path — tighter loop, no inner iteration
    // -----------------------------------------------------------------
    if (colFilters.length === 1 && !hasGlobalFilter) {
      const cf = colFilters[0]!
      const result: T[] = []

      // Inlined fast path for includesString (most common filter)
      if (cf.filterFn === filterFns.includesString) {
        const search = (cf.resolvedValue as string)?.toString()?.toLowerCase()
        const key = cf.accessorKey
        for (const item of items) {
          const val = item[key]
          if (val != null && String(val).toLowerCase().includes(search)) {
            result.push(item)
          }
        }
      } else {
        // Generic single-filter path — still avoids inner loop
        for (const item of items) {
          if (cf.filterFn(createRowShim(item) as any, cf.id, cf.resolvedValue, noopAddMeta)) {
            result.push(item)
          }
        }
      }

      // All rows passed — return original reference to avoid downstream recomputation
      if (result.length === items.length) {
        lastResult = null
        return items
      }
      lastResult = result
      return result
    }

    // -----------------------------------------------------------------
    // General path: multiple column filters and/or global filter
    // -----------------------------------------------------------------
    const result: T[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]!
      // Test column filters (AND logic — all must pass)
      if (hasColFilters) {
        const rowShim = createRowShim(item) as any
        let passedAll = true
        for (const cf of colFilters) {
          if (!cf.filterFn(rowShim, cf.id, cf.resolvedValue, noopAddMeta)) {
            passedAll = false
            break
          }
        }
        if (!passedAll) continue
      }

      // Test global filter using concatenated search index
      if (hasGlobalFilter && sIdx) {
        const s = sIdx[i]
        if (!s || !s.includes(globalSearchLower!)) {
          continue
        }
      }

      result.push(item)
    }

    // All rows passed — return original reference to avoid downstream recomputation
    if (result.length === items.length) {
      lastResult = null
      return items
    }
    lastResult = result
    return result
  })

  return { filteredData, notifyEditedCell }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function noopAddMeta(_meta: any) {}

/**
 * Create a minimal row shim that provides `getValue()` for FilterFn
 * compatibility. Reads values directly from the raw data item.
 */
function createRowShim(item: any) {
  return {
    getValue: (colId: string) => item[colId],
    original: item,
  }
}
