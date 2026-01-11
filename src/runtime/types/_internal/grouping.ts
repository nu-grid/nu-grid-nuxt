/**
 * @internal
 */

import type { TableData } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import type { ComputedRef, Ref } from 'vue'
import type {
  GroupingVirtualRowHeights,
  GroupVirtualRowItem,
  NuGridVirtualizer,
} from './virtualization'

/**
 * Type for grouping functions returned by useNuGridGrouping
 * Provides group management and virtualization for grouped tables
 * @internal
 */
export interface NuGridGroupingFns<T extends TableData = TableData> {
  /** All rows from the table (grouped or ungrouped) */
  rows: ComputedRef<Row<T>[]>
  /** Group header rows only */
  groupRows: ComputedRef<Row<T>[]>
  /** Rows organized by group ID */
  groupedRows: ComputedRef<Record<string, Row<T>[]>>
  /** Group expansion state */
  groupExpanded: Ref<Record<string, boolean>>
  /** Toggle a group's expanded state */
  toggleGroup: (groupId: string) => void
  /** Check if a group is expanded */
  isGroupExpanded: (groupId: string) => boolean
  /** Virtual row items for virtualization */
  virtualRowItems: ComputedRef<GroupVirtualRowItem<T>[]>
  /** Virtualizer instance */
  virtualizer: Ref<NuGridVirtualizer> | null
  /** Whether virtualization is enabled */
  virtualizationEnabled: ComputedRef<boolean>
  /** Flattened list of navigable rows for keyboard navigation */
  navigableRows: ComputedRef<Row<T>[]>
  /** Row heights configuration for grouping */
  groupingRowHeights: ComputedRef<Required<GroupingVirtualRowHeights>>
  /** Number of header groups */
  headerGroupCount: ComputedRef<number>
  /** Active sticky row indexes */
  activeStickyIndexes: Ref<number[]>
  /** Total height of active sticky elements */
  activeStickyHeight: ComputedRef<number>
  /** Measured virtual item sizes for dynamic heights */
  measuredVirtualSizes: ComputedRef<Map<number, number> | null>
  /** Get height for a virtual item (measured or fallback) */
  getVirtualItemHeight: (index: number) => number
  /** Cumulative top offsets for sticky headers */
  stickyOffsets: ComputedRef<Map<number, number>>
}
