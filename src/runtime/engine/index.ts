/**
 * NuGrid Table Engine — barrel export.
 */

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
export { builtinAggregationFns } from './aggregation-fns'
export { createEngineCell } from './cell'
export { createEngineColumn } from './column'
export { buildCoreRowModel } from './core-row-model'
export { buildGroupedRowModel } from './grouped-row-model'
export { buildEngineHeaderGroups } from './headers'
export { createEngineRow } from './row'
export type { CreateEngineRowOptions } from './row'
export { createNuGridTable } from './table'
export type { CreateNuGridTableOptions } from './table'

// ---------------------------------------------------------------------------
// Short type aliases
// ---------------------------------------------------------------------------

export type {
  AggregationFn,
  BuiltinAggregationFn,
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
export type { EngineRow as Row } from './types'
export type { EngineColumn as Column } from './types'
export type { EngineTable as Table } from './types'
export type { EngineCell as Cell } from './types'
export type { EngineHeader as Header } from './types'

export type { EngineHeaderGroup as HeaderGroup } from './types'
