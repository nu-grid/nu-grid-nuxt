import type { TableData } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import type { ComputedRef, Ref } from 'vue'
import type { NuGridColumn, NuGridColumnSummary } from '../../types'
import { computed } from 'vue'
import { isEmptyGroupPlaceholder } from './useNuGridEmptyGroups'

/**
 * Built-in aggregate types
 */
export type AggregateType = 'sum' | 'avg' | 'count' | 'min' | 'max'

/**
 * Custom aggregate function signature
 */
export type AggregateFunction<T, R = unknown> = (rows: T[]) => R

/**
 * Built-in aggregate functions
 */
export const aggregateFunctions = {
  sum: (values: number[]): number => {
    return values.reduce((acc, val) => acc + (Number(val) || 0), 0)
  },

  avg: (values: number[]): number => {
    if (values.length === 0) return 0
    const sum = values.reduce((acc, val) => acc + (Number(val) || 0), 0)
    return sum / values.length
  },

  count: (values: unknown[]): number => {
    return values.length
  },

  min: (values: number[]): number => {
    if (values.length === 0) return 0
    const numbers = values.map((v) => Number(v)).filter((n) => !Number.isNaN(n))
    return numbers.length > 0 ? Math.min(...numbers) : 0
  },

  max: (values: number[]): number => {
    if (values.length === 0) return 0
    const numbers = values.map((v) => Number(v)).filter((n) => !Number.isNaN(n))
    return numbers.length > 0 ? Math.max(...numbers) : 0
  },
} as const

/**
 * Context passed to format functions
 */
export interface AggregateFormatContext {
  groupId?: string
  isGrandTotal?: boolean
}

/**
 * Get the summary config from a column definition
 */
export function getColumnSummary<T extends TableData>(
  column: NuGridColumn<T>,
): NuGridColumnSummary | undefined {
  // Check direct property (added via TanStack augmentation)
  if ('summary' in column && column.summary) {
    return column.summary as NuGridColumnSummary
  }
  // Check meta (fallback for programmatic assignment)
  const meta = column.meta as Record<string, unknown> | undefined
  if (meta?.summary) {
    return meta.summary as NuGridColumnSummary
  }
  return undefined
}

/**
 * Check if a column has summary configuration
 */
export function hasSummaryConfig<T extends TableData>(column: NuGridColumn<T>): boolean {
  return !!getColumnSummary(column)
}

/**
 * Calculate aggregate value for a set of rows and a specific column
 */
export function calculateAggregate<T extends TableData>(
  rows: T[],
  accessorKey: string,
  aggregate: AggregateType | AggregateFunction<T>,
): unknown {
  // Filter out empty group placeholders
  const dataRows = rows.filter((row) => !isEmptyGroupPlaceholder(row))

  if (typeof aggregate === 'function') {
    return aggregate(dataRows)
  }

  // Extract values for the column
  const values = dataRows.map((row) => (row as Record<string, unknown>)[accessorKey])

  // Apply built-in aggregate
  const aggregateFn = aggregateFunctions[aggregate]
  if (aggregateFn) {
    return aggregateFn(values as number[])
  }

  return null
}

/**
 * Format an aggregate value using column's format function or default formatting
 */
export function formatAggregateValue(
  value: unknown,
  summary: NuGridColumnSummary,
  context: AggregateFormatContext = {},
): string {
  if (summary.format) {
    return summary.format(value, context)
  }

  // Default formatting based on value type
  if (typeof value === 'number') {
    // Format numbers with reasonable precision
    if (Number.isInteger(value)) {
      return value.toLocaleString()
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }

  return String(value ?? '')
}

export interface UseNuGridAggregatesOptions<T extends TableData> {
  /** All data rows (for grand totals) */
  data: Ref<T[]>
  /** Column definitions */
  columns: Ref<NuGridColumn<T>[]>
  /** Grouped rows by group ID (for group summaries) */
  groupedRows?: ComputedRef<Record<string, Row<T>[]>>
}

export interface UseNuGridAggregatesReturn {
  /** Grand totals across all data */
  grandTotals: ComputedRef<Record<string, unknown>>
  /** Per-group totals: { [groupId]: { [columnId]: value } } */
  groupTotals: ComputedRef<Record<string, Record<string, unknown>>>
  /** Columns that have summary config */
  summaryColumns: ComputedRef<{ accessorKey: string; summary: NuGridColumnSummary }[]>
  /** Check if any column has summary config */
  hasSummaries: ComputedRef<boolean>
}

/**
 * Composable to calculate aggregate values for columns with summary configuration
 */
export function useNuGridAggregates<T extends TableData>(
  options: UseNuGridAggregatesOptions<T>,
): UseNuGridAggregatesReturn {
  const { data, columns, groupedRows } = options

  /**
   * Extract columns with summary configuration (recursive for column groups)
   */
  const summaryColumns = computed(() => {
    const result: { accessorKey: string; summary: NuGridColumnSummary }[] = []

    function collectSummaryColumns(cols: NuGridColumn<T>[]) {
      for (const col of cols) {
        // Check for nested columns (column groups)
        if ('columns' in col && Array.isArray(col.columns)) {
          collectSummaryColumns(col.columns as NuGridColumn<T>[])
          continue
        }

        const summary = getColumnSummary(col)
        if (summary) {
          const accessorKey = ('accessorKey' in col ? col.accessorKey : col.id) as string
          if (accessorKey) {
            result.push({ accessorKey, summary })
          }
        }
      }
    }

    collectSummaryColumns(columns.value)
    return result
  })

  /**
   * Whether any columns have summary configuration
   */
  const hasSummaries = computed(() => summaryColumns.value.length > 0)

  /**
   * Calculate grand totals across all data
   */
  const grandTotals = computed<Record<string, unknown>>(() => {
    const totals: Record<string, unknown> = {}

    for (const { accessorKey, summary } of summaryColumns.value) {
      totals[accessorKey] = calculateAggregate(data.value, accessorKey, summary.aggregate)
    }

    return totals
  })

  /**
   * Calculate per-group totals
   */
  const groupTotals = computed<Record<string, Record<string, unknown>>>(() => {
    if (!groupedRows) {
      return {}
    }

    const result: Record<string, Record<string, unknown>> = {}

    for (const [groupId, rows] of Object.entries(groupedRows.value)) {
      const groupData: Record<string, unknown> = {}

      // Extract original data from Row objects
      const rowData = rows
        .filter((row) => !isEmptyGroupPlaceholder(row.original))
        .map((row) => row.original)

      for (const { accessorKey, summary } of summaryColumns.value) {
        groupData[accessorKey] = calculateAggregate(rowData, accessorKey, summary.aggregate)
      }

      result[groupId] = groupData
    }

    return result
  })

  return {
    grandTotals,
    groupTotals,
    summaryColumns,
    hasSummaries,
  }
}
