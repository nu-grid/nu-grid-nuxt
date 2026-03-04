/**
 * Built-in aggregation functions for grouped rows.
 *
 * Signature: (columnId, leafRows, childRows) => aggregatedValue
 * - columnId: the column being aggregated
 * - leafRows: all leaf (data) rows under the group, flattened
 * - childRows: direct child rows (may be sub-groups in multi-level grouping)
 */

import type { AggregationFn } from './types'

export const builtinAggregationFns: Record<string, AggregationFn> = {
  sum(columnId, leafRows) {
    return leafRows.reduce(
      (sum, row) => sum + (Number(row.getValue(columnId)) || 0),
      0,
    )
  },

  min(columnId, leafRows) {
    let min: number | undefined
    for (const row of leafRows) {
      const num = Number(row.getValue(columnId))
      if (!Number.isNaN(num) && (min === undefined || num < min)) {
        min = num
      }
    }
    return min ?? 0
  },

  max(columnId, leafRows) {
    let max: number | undefined
    for (const row of leafRows) {
      const num = Number(row.getValue(columnId))
      if (!Number.isNaN(num) && (max === undefined || num > max)) {
        max = num
      }
    }
    return max ?? 0
  },

  count(_columnId, leafRows) {
    return leafRows.length
  },

  extent(columnId, leafRows) {
    let min: number | undefined
    let max: number | undefined
    for (const row of leafRows) {
      const num = Number(row.getValue(columnId))
      if (!Number.isNaN(num)) {
        if (min === undefined || num < min) min = num
        if (max === undefined || num > max) max = num
      }
    }
    return [min ?? 0, max ?? 0]
  },

  mean(columnId, leafRows) {
    if (leafRows.length === 0) return 0
    const sum = leafRows.reduce(
      (s, row) => s + (Number(row.getValue(columnId)) || 0),
      0,
    )
    return sum / leafRows.length
  },

  median(columnId, leafRows) {
    if (leafRows.length === 0) return 0
    const values = leafRows
      .map(row => Number(row.getValue(columnId)))
      .filter(n => !Number.isNaN(n))
      .sort((a, b) => a - b)
    if (values.length === 0) return 0
    const mid = Math.floor(values.length / 2)
    return values.length % 2 !== 0
      ? values[mid]!
      : (values[mid - 1]! + values[mid]!) / 2
  },

  unique(columnId, leafRows) {
    return [...new Set(leafRows.map(row => row.getValue(columnId)))]
  },

  uniqueCount(columnId, leafRows) {
    return new Set(leafRows.map(row => row.getValue(columnId))).size
  },
}
