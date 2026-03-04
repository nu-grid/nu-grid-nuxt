import type { TableData } from '../../table-data'
import type { Cell, Column, HeaderGroup, Row } from '../../../engine'
import type { ComputedRef } from 'vue'

/**
 * Performance context
 * Cached table API results and helper functions
 */
export interface NuGridPerformanceContext<T extends TableData = TableData> {
  headerGroups: ComputedRef<HeaderGroup<T>[]>
  headerGroupsLength: ComputedRef<number>
  footerGroups: ComputedRef<HeaderGroup<T>[]>
  allLeafColumns: ComputedRef<Column<T>[]>
  getVisibleCells: (row: Row<T>) => Cell<T>[]
  shouldHaveBorder: (row: Row<T>, cellIndex: number, side: 'left' | 'right') => boolean
}
