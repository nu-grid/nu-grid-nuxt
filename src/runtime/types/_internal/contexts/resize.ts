import type { TableData } from '@nuxt/ui'
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
}
