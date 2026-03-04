/**
 * NuGrid Grouped Row Model.
 *
 * Groups rows by column values.
 * Creates synthetic group rows with groupingColumnId, groupingValue, subRows, leafRows.
 */

import { builtinAggregationFns } from './aggregation-fns'
import { createEngineRow } from './row'
import type {
  AggregationFn,
  EngineColumn,
  EngineRow,
  EngineRowModel,
  EngineTable,
  StateAccessors,
} from './types'

// ---------------------------------------------------------------------------
// Utility: flatten subRows recursively
// ---------------------------------------------------------------------------

function flattenBy<T>(arr: T[], getChildren: (item: T) => T[]): T[] {
  const result: T[] = []
  const recurse = (items: T[]) => {
    for (const item of items) {
      result.push(item)
      const children = getChildren(item)
      if (children?.length) {
        recurse(children)
      }
    }
  }
  recurse(arr)
  return result
}

// ---------------------------------------------------------------------------
// Utility: group rows by a column value
// ---------------------------------------------------------------------------

function groupBy<T>(rows: EngineRow<T>[], columnId: string): Map<string, EngineRow<T>[]> {
  const groupMap = new Map<string, EngineRow<T>[]>()

  for (const row of rows) {
    const key = `${row.getGroupingValue(columnId) ?? row.getValue(columnId)}`
    const existing = groupMap.get(key)
    if (existing) {
      existing.push(row)
    }
    else {
      groupMap.set(key, [row])
    }
  }

  return groupMap
}

// ---------------------------------------------------------------------------
// Build grouped row model
// ---------------------------------------------------------------------------

export function buildGroupedRowModel<T>(
  coreModel: EngineRowModel<T>,
  grouping: string[],
  columns: EngineColumn<T>[],
  table: EngineTable<T>,
  state: StateAccessors,
): EngineRowModel<T> {
  // No grouping or no rows — return core model with depth reset
  if (!coreModel.rows.length || !grouping.length) {
    coreModel.rows.forEach((row) => {
      row.depth = 0
      row.parentId = undefined
    })
    return coreModel
  }

  // Filter grouping to columns that actually exist
  const existingGrouping = grouping.filter(columnId =>
    columns.some(c => c.id === columnId),
  )

  if (!existingGrouping.length) {
    coreModel.rows.forEach((row) => {
      row.depth = 0
      row.parentId = undefined
    })
    return coreModel
  }

  const existingGroupingSet = new Set(existingGrouping)
  const groupedFlatRows: EngineRow<T>[] = []
  const groupedRowsById: Record<string, EngineRow<T>> = {}

  // Recursively group the data
  const groupUpRecursively = (
    rows: EngineRow<T>[],
    depth = 0,
    parentId?: string,
  ): EngineRow<T>[] => {
    // Grouping depth has been met — stop grouping, rewrite depth/parentId
    if (depth >= existingGrouping.length) {
      return rows.map((row) => {
        row.depth = depth

        groupedFlatRows.push(row)
        groupedRowsById[row.id] = row

        if (row.subRows.length) {
          row.subRows = groupUpRecursively(row.subRows, depth + 1, row.id)
        }

        return row
      })
    }

    const columnId = existingGrouping[depth]!

    // Group the rows together for this level
    const rowGroupsMap = groupBy(rows, columnId)

    // Create group rows
    const aggregatedGroupedRows = Array.from(rowGroupsMap.entries()).map(
      ([groupingValue, groupedRows], index) => {
        let id = `${columnId}:${groupingValue}`
        if (parentId) id = `${parentId}>${id}`

        // Recurse to group sub rows
        const subRows = groupUpRecursively(groupedRows, depth + 1, id)

        subRows.forEach((subRow) => {
          subRow.parentId = id
        })

        // Flatten the leaf rows
        const leafRows = depth
          ? flattenBy(groupedRows, row => row.subRows)
          : groupedRows

        // Create the group row
        const row = createEngineRow<T>({
          id,
          index,
          original: leafRows[0]!.original,
          depth,
          parentId,
          groupingColumnId: columnId,
          groupingValue,
          leafRows,
          table,
          columns,
          state,
        })

        row.subRows = subRows

        // Populate _groupingValuesCache with aggregated values
        for (const col of columns) {
          if (existingGroupingSet.has(col.id)) continue

          const aggFn = col.columnDef.aggregationFn
          if (aggFn == null) continue

          let resolvedFn: AggregationFn | undefined
          if (typeof aggFn === 'function') {
            resolvedFn = aggFn
          }
          else if (typeof aggFn === 'string') {
            resolvedFn = builtinAggregationFns[aggFn]
          }

          if (resolvedFn) {
            row._groupingValuesCache[col.id] = resolvedFn(col.id, leafRows, subRows)
          }
        }

        // Override getValue for group rows:
        // - For grouping columns: return the first row's value
        // - For other columns: return from _groupingValuesCache (aggregation)
        const originalGetValue = row.getValue.bind(row)
        row.getValue = <TValue = unknown>(colId: string): TValue => {
          // Grouping columns: return the value from the first grouped row
          if (existingGrouping.includes(colId)) {
            if (row._valuesCache.hasOwnProperty(colId)) {
              return row._valuesCache[colId] as TValue
            }
            if (groupedRows[0]) {
              row._valuesCache[colId] = groupedRows[0].getValue(colId)
            }
            return row._valuesCache[colId] as TValue
          }

          // Non-grouping columns: check grouping values cache
          if (row._groupingValuesCache.hasOwnProperty(colId)) {
            return row._groupingValuesCache[colId] as TValue
          }

          // Fall back to normal accessor
          return originalGetValue(colId)
        }

        // Add subRows to flat list
        subRows.forEach((subRow) => {
          groupedFlatRows.push(subRow)
          groupedRowsById[subRow.id] = subRow
        })

        return row
      },
    )

    return aggregatedGroupedRows
  }

  const groupedRows = groupUpRecursively(coreModel.rows, 0)

  // Add top-level group rows to flat list
  groupedRows.forEach((subRow) => {
    groupedFlatRows.push(subRow)
    groupedRowsById[subRow.id] = subRow
  })

  return {
    rows: groupedRows,
    flatRows: groupedFlatRows,
    rowsById: groupedRowsById,
  }
}
