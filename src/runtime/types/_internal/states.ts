/**
 * @internal
 */

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingInfoState,
  ColumnSizingState,
  ExpandedState,
  GroupingState,
  PaginationState,
  RowPinningState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
import type { Ref } from 'vue'

/**
 * Grid state refs container
 * @internal
 */
export interface NuGridStates {
  globalFilterState: Ref<string>
  columnFiltersState: Ref<ColumnFiltersState>
  columnOrderState: Ref<ColumnOrderState>
  columnVisibilityState: Ref<VisibilityState>
  columnPinningState: Ref<ColumnPinningState>
  columnSizingState: Ref<ColumnSizingState>
  columnSizingInfoState: Ref<ColumnSizingInfoState>
  rowSelectionState: Ref<RowSelectionState>
  rowPinningState: Ref<RowPinningState>
  sortingState: Ref<SortingState>
  groupingState: Ref<GroupingState>
  expandedState: Ref<ExpandedState>
  paginationState: Ref<PaginationState>
}
