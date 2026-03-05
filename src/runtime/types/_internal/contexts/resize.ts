import type { Ref } from 'vue'

import type { ColumnSizingState } from '../../../engine'
import type { NuGridColumnResize } from '../../resize'
import type { TableData } from '../../table-data'

/**
 * Column Resize context
 * Column and column group resizing
 */
export interface NuGridResizeContext<T extends TableData = TableData> {
  handleResizeStart: NuGridColumnResize<T>['handleResizeStart']
  handleGroupResizeStart: NuGridColumnResize<T>['handleGroupResizeStart']
  resizingGroupId: NuGridColumnResize<T>['resizingGroupId']
  resizingColumnId: NuGridColumnResize<T>['resizingColumnId']
  manuallyResizedColumns: NuGridColumnResize<T>['manuallyResizedColumns']
  /** Column sizing state ref — NuGrid owns this directly */
  columnSizingState: Ref<ColumnSizingState>
}
