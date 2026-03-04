import type { TableData } from './table-data'
import type { Row } from '../engine'

/**
 * Type for nugrid-rowinteractions injection
 * Provides row interaction handlers
 */
export interface NuGridRowInteractions<T extends TableData = TableData> {
  onRowSelect: (e: Event, row: Row<T>) => void
  onRowHover: (e: Event, row: Row<T> | null) => void
  onRowContextmenu: (e: Event, row: Row<T>) => void
}
