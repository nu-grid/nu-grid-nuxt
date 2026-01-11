import type { TableData } from '@nuxt/ui'
import type { NuGridGroupingFns } from '../grouping'

/**
 * Grouping context
 * Row grouping functionality (optional)
 */
export interface NuGridGroupingContext<T extends TableData = TableData> {
  groupingFns: NuGridGroupingFns<T> | null
}
