import type { TableData } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import type { Virtualizer, VirtualizerOptions } from '@tanstack/vue-virtual'
import type { ComputedRef } from 'vue'

/**
 * Configuration for virtual row heights in grouped grid mode.
 * These heights are used by useNuGridGrouping for virtualization calculations.
 */
export interface GroupingVirtualRowHeights {
  /**
   * Height of group header rows (in pixels)
   * @defaultValue 50
   */
  groupHeader?: number
  /**
   * Height of a single column header row (in pixels)
   * @defaultValue 50
   */
  columnHeader?: number
  /**
   * Height of data rows (in pixels)
   * @defaultValue 80
   */
  dataRow?: number
  /**
   * Height of footer rows (in pixels)
   * @defaultValue 45
   */
  footer?: number
}

/**
 * Type of virtual row in grouped grid mode
 */
export type GroupVirtualRowType = 'group-header' | 'column-headers' | 'data' | 'footer'

/**
 * Virtual row item for grouped grid virtualization
 */
export interface GroupVirtualRowItem<T extends TableData = TableData> {
  type: GroupVirtualRowType
  height: number
  groupId?: string
  groupRow?: Row<T>
  dataRow?: Row<T>
  index: number
  depth?: number // Nesting depth for nested groups (0 = top-level)
}

/**
 * Keys to omit from base VirtualizerOptions as they are managed internally.
 */
type OmittedVirtualizerKeys = 'getScrollElement' | 'count' | 'estimateSize' | 'overscan'

export type OverscanSetting = number | Record<string, number>

/**
 * Extended virtualization options for NuGrid.
 * Includes standard TanStack Virtual options plus NuGrid-specific row heights.
 */
export type NuGridVirtualizerOptions = Partial<
  Omit<VirtualizerOptions<Element, Element>, OmittedVirtualizerKeys>
> & {
  /**
   * Toggle virtualization. If omitted, treated as enabled when the object is provided.
   */
  enabled?: boolean
  /**
   * Number of items rendered outside the visible area
   * - number: uniform overscan
   * - record: overscan per breakpoint key (uses `default` when no match)
   * @defaultValue 12 (with breakpoint defaults stored in nuGridDefaults)
   */
  overscan?: OverscanSetting
  /**
   * Explicit map for breakpoint-based overscan overrides. Takes precedence over `overscan` when set.
   */
  overscanByBreakpoint?: Record<string, number>
  /**
   * Estimated size (in px) of each item
   * @defaultValue 65
   */
  estimateSize?: number
  /**
   * Custom heights for virtual row types used in grouped grid mode.
   * Only applicable when grouped layouts are active.
   */
  rowHeights?: GroupingVirtualRowHeights
  /**
   * Enable dynamic row height measurement. See docs for default behavior.
   */
  dynamicRowHeights?: boolean
}

export type ResolvedNuGridVirtualizeOptions = Omit<
  NuGridVirtualizerOptions,
  'enabled' | 'overscan' | 'estimateSize' | 'dynamicRowHeights' | 'rowHeights'
> & {
  enabled: boolean
  overscan: number
  overscanByBreakpoint?: Record<string, number>
  estimateSize: number
  dynamicRowHeights: boolean
  rowHeights: Required<GroupingVirtualRowHeights>
}

export interface NuGridVirtualizer<
  TScrollElement extends Element = Element,
  TItemElement extends Element = Element,
> extends Virtualizer<TScrollElement, TItemElement> {
  props: ComputedRef<ResolvedNuGridVirtualizeOptions>
  dynamicRowHeightsEnabled: ComputedRef<boolean>
}

/**
 * CSS style object for virtualized grid items.
 * Used by getVirtualItemStyle functions in NuGridBase, NuGridGroup, and NuGridSplitGroup.
 */
export type NuGridVirtualItemStyle = {
  position: 'sticky' | 'absolute'
  top: string | number
  width: string | number
  left?: number
  zIndex?: number
  height?: string
  transform?: string
  backgroundColor?: string
  boxShadow?: string
} & Record<string, string | number | undefined>
