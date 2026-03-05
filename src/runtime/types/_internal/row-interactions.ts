/**
 * @internal
 */

import type { Row } from '../../engine'
import type { TableData } from '../table-data'

/**
 * Type for nugrid-rowinteractions injection
 * Provides row interaction handlers
 * @internal
 */
export interface NuGridRowInteractions<T extends TableData = TableData> {
  onRowSelect: (e: Event, row: Row<T>) => void
  onRowHover: (e: Event, row: Row<T> | null) => void
  onRowContextmenu: (e: Event, row: Row<T>) => void
}
