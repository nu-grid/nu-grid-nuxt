import type { TableData } from '@nuxt/ui'
import type { ColumnSizingState } from '@tanstack/vue-table'
import type { Ref } from 'vue'

import type { NuGridColumnResize } from '../../resize'

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
