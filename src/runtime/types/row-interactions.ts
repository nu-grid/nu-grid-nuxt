import type { TableData } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'

/**
 * Type for nugrid-rowinteractions injection
 * Provides row interaction handlers
 */
export interface NuGridRowInteractions<T extends TableData = TableData> {
  onRowSelect: (e: Event, row: Row<T>) => void
  onRowHover: (e: Event, row: Row<T> | null) => void
  onRowContextmenu: (e: Event, row: Row<T>) => void
}
