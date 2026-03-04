import type { TableData } from '../../table-data'
import type { Cell, ColumnPinningState, ExpandedState, PaginationState, Row, RowSelectionState, Table } from '../../../engine'
import type { Primitive } from 'reka-ui'
import type { ComputedRef, Ref } from 'vue'

import type { NuGridUISlots } from '../../../composables/_internal/useNuGridUI'
import type { NuGridConfig } from '../../config'

/**
 * Core context - essential table API and UI
 * Always needed by all components
 */
export interface NuGridCoreContext<T extends TableData = TableData> {
  tableRef: Ref<HTMLDivElement | null>
  rootRef: Ref<InstanceType<typeof Primitive> | null | undefined>
  tableApi: Table<T>
  ui: ComputedRef<NuGridUISlots>
  propsUi: ComputedRef<NuGridConfig['slots'] | undefined>
  hasFooter: ComputedRef<boolean>
  rows: ComputedRef<Row<T>[]>
  /** Custom row slot for replacing default cell rendering */
  rowSlot?: (props: { row: Row<T>; cells: Cell<T>[] }) => any
  /** NuGrid-owned state refs — direct updates bypass the engine */
  columnPinningState: Ref<ColumnPinningState>
  expandedState: Ref<ExpandedState>
  rowSelectionState: Ref<RowSelectionState>
  paginationState: Ref<PaginationState>
}
