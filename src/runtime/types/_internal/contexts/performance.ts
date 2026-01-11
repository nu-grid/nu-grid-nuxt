import type { TableData } from '@nuxt/ui'
import type { Cell, Column, HeaderGroup, Row } from '@tanstack/vue-table'
import type { ComputedRef } from 'vue'

/**
 * Performance context
 * Cached TanStack Table API results and helper functions
 */
export interface NuGridPerformanceContext<T extends TableData = TableData> {
  headerGroups: ComputedRef<HeaderGroup<T>[]>
  headerGroupsLength: ComputedRef<number>
  footerGroups: ComputedRef<HeaderGroup<T>[]>
  allLeafColumns: ComputedRef<Column<T, unknown>[]>
  getVisibleCells: (row: Row<T>) => Cell<T, unknown>[]
  shouldHaveBorder: (row: Row<T>, cellIndex: number, side: 'left' | 'right') => boolean
}
