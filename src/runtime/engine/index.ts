/**
 * NuGrid Table Engine — barrel export.
 */

export { createEngineColumn } from './column'
export { createEngineCell } from './cell'
export { createEngineRow } from './row'
export { buildEngineHeaderGroups } from './headers'
export { buildCoreRowModel } from './core-row-model'
export { buildGroupedRowModel } from './grouped-row-model'
export { createNuGridTable } from './table'
export type { CreateNuGridTableOptions } from './table'
export type { CreateEngineRowOptions } from './row'
export type {
  ColumnPinningPosition,
  EngineCell,
  EngineColumn,
  EngineColumnDef,
  EngineHeader,
  EngineHeaderGroup,
  EngineRow,
  EngineRowModel,
  EngineTable,
  FilterFn,
  StateAccessors,
} from './types'

// ---------------------------------------------------------------------------
// Short type aliases
// ---------------------------------------------------------------------------

export type { EngineRow as Row } from './types'
export type { EngineColumn as Column } from './types'
export type { EngineTable as Table } from './types'
export type { EngineCell as Cell } from './types'
export type { EngineHeader as Header } from './types'
export type { EngineHeaderGroup as HeaderGroup } from './types'

// Re-export all state types so callers have a single import source
export type {
  ColumnFilter,
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingInfoState,
  ColumnSizingState,
  ColumnSort,
  ExpandedState,
  GroupingState,
  PaginationState,
  RowPinningState,
  RowSelectionState,
  SortDirection,
  SortingState,
  Updater,
  VisibilityState,
} from '../types/state-types'

