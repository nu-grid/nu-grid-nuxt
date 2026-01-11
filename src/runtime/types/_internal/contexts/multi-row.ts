import type { Column } from '@tanstack/vue-table'
import type { ComputedRef } from 'vue'

/**
 * Information about a row 0 column slot for aligned mode
 */
export interface Row0ColumnSlot {
  /** Column ID */
  id: string
  /** Column width */
  width: number
  /** Column minimum width */
  minWidth: number
  /** Whether this column is pinned */
  pinned: 'left' | 'right' | false
  /** The column reference for pinning calculations */
  column: Column<any, unknown>
}

/**
 * Multi-row context
 * Provides multi-row configuration to child components
 */
export interface NuGridMultiRowContext {
  /**
   * Whether multi-row mode is enabled
   */
  enabled: ComputedRef<boolean>

  /**
   * Number of visual rows per data item
   */
  rowCount: ComputedRef<number>

  /**
   * Whether columns should align with row 0 columns
   */
  alignColumns: ComputedRef<boolean>

  /**
   * Row 0 column slots for aligned mode
   * Contains width and pinning info for each column in row 0
   */
  row0Columns: ComputedRef<Row0ColumnSlot[]>
}
