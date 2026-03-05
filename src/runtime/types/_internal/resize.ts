/**
 * @internal
 */

import type { Ref } from 'vue'

import type { Header } from '../../engine'
import type { TableData } from '../table-data'

/**
 * Type for nugrid-resizefns injection
 * Provides column resize functionality
 * @internal
 */
export interface NuGridColumnResize<T extends TableData = TableData> {
  handleResizeStart: (event: MouseEvent | TouchEvent, header: Header<T>) => void
  handleGroupResizeStart: (event: MouseEvent | TouchEvent, header: Header<T>) => void
  handleResizeEnd: () => void
  resizingGroupId: Ref<string | null>
  resizingColumnId: Ref<string | null>
}

/**
 * Header type used for pinning calculations.
 * @internal
 */
export interface PinnableHeader {
  colSpan: number
  column: {
    getIsPinned: () => false | 'left' | 'right'
    getStart: (position: 'left') => number
    getAfter: (position: 'right') => number
  }
  getLeafHeaders: () => Array<{
    column: {
      getIsPinned: () => false | 'left' | 'right'
      getStart: (position: 'left') => number
      getAfter: (position: 'right') => number
    }
  }>
}
