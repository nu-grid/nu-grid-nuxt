import type { ComputedRef } from 'vue'
import type { NuGridColumnSummary } from '../../column'
import type { NuGridGrandTotalsConfig } from '../../option-groups'

/**
 * Summary context
 * Provides calculated aggregate values for group summaries and grand totals
 */
export interface NuGridSummaryContext {
  /** Whether any column has summary configuration */
  hasSummaries: ComputedRef<boolean>

  /** Whether group summaries are enabled */
  groupSummariesEnabled: ComputedRef<boolean>

  /** Grand totals configuration (or undefined if disabled) */
  grandTotalsConfig: ComputedRef<NuGridGrandTotalsConfig | undefined>

  /** Grand totals across all data: { [columnId]: value } */
  grandTotals: ComputedRef<Record<string, unknown>>

  /** Per-group totals: { [groupId]: { [columnId]: value } } */
  groupTotals: ComputedRef<Record<string, Record<string, unknown>>>

  /** Columns that have summary configuration */
  summaryColumns: ComputedRef<{ accessorKey: string; summary: NuGridColumnSummary }[]>

  /**
   * Get the formatted summary value for a column in a group
   * @param groupId The group ID
   * @param columnId The column ID (accessorKey)
   * @returns Formatted string or undefined if no summary config
   */
  getGroupSummaryValue: (groupId: string, columnId: string) => string | undefined

  /**
   * Get the formatted grand total value for a column
   * @param columnId The column ID (accessorKey)
   * @returns Formatted string or undefined if no summary config
   */
  getGrandTotalValue: (columnId: string) => string | undefined
}
