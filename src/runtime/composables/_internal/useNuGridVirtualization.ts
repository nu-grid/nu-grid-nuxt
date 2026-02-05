import type { TableData } from '@nuxt/ui'
import type { Row, Table } from '@tanstack/vue-table'
import type { VirtualItem, Virtualizer } from '@tanstack/vue-virtual'
import type { Primitive } from 'reka-ui'
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { NuGridProps } from '../../types'
import type {
  GroupingVirtualRowHeights,
  GroupVirtualRowItem,
  GroupVirtualRowType,
  NuGridVirtualizer,
  NuGridVirtualizerOptions,
  OverscanSetting,
  ResolvedNuGridVirtualizeOptions,
} from '../../types/_internal'
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/vue-virtual'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { computed, ref, toValue, watch } from 'vue'
import { nuGridDefaults } from '../../config/_internal'

// Re-export types for convenience
export type { GroupVirtualRowItem, GroupVirtualRowType }

function resolveOverscanForBreakpoint(
  overscan: OverscanSetting | undefined,
  currentBreakpoint: string | undefined,
  fallback: number,
): number {
  if (overscan === undefined) {
    return fallback
  }

  if (typeof overscan === 'number') {
    return overscan
  }

  if (currentBreakpoint && overscan[currentBreakpoint] !== undefined) {
    return overscan[currentBreakpoint] as number
  }

  if (overscan.default !== undefined) {
    return overscan.default
  }

  const firstValue = Object.values(overscan).find((value) => typeof value === 'number')
  return typeof firstValue === 'number' ? firstValue : fallback
}

function useNuGridBreakpointKey() {
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const current = breakpoints.current()
  return computed(() => {
    const value = current.value
    if (Array.isArray(value)) {
      return value[0]
    }
    return value ?? undefined
  })
}

/**
 * Resolve virtualization options using centralized defaults.
 * Handles boolean toggles, explicit enable/disable, breakpoint-aware overscan, and dynamic row height heuristics.
 */
export function resolveVirtualizationOptions(
  virtualization: boolean | NuGridVirtualizerOptions | undefined,
  defaultEstimateSize = nuGridDefaults.virtualization.estimateSize,
  currentBreakpoint?: string,
): ResolvedNuGridVirtualizeOptions {
  const defaults = nuGridDefaults.virtualization as ResolvedNuGridVirtualizeOptions
  const options =
    typeof virtualization === 'object' && virtualization !== null ? virtualization : undefined

  const enabled =
    virtualization === true
    || (typeof virtualization === 'object' && virtualization !== null
      ? options?.enabled !== false
      : false)

  const rowHeights = resolveRowHeights(
    options?.rowHeights,
    (defaults.rowHeights ?? {}) as Required<GroupingVirtualRowHeights>,
  )

  const estimateSize = options?.estimateSize ?? defaultEstimateSize ?? defaults.estimateSize

  const overscanSetting =
    options?.overscanByBreakpoint
    ?? options?.overscan
    ?? defaults.overscanByBreakpoint
    ?? defaults.overscan

  const overscan = resolveOverscanForBreakpoint(
    overscanSetting,
    currentBreakpoint,
    defaults.overscan ?? defaultEstimateSize ?? 12,
  )

  const overscanByBreakpoint =
    options?.overscanByBreakpoint
    ?? (typeof options?.overscan === 'object' && options.overscan !== null
      ? options.overscan
      : defaults.overscanByBreakpoint)

  const dynamicRowHeights =
    typeof options?.dynamicRowHeights === 'boolean'
      ? options.dynamicRowHeights
      : options?.rowHeights
        ? false
        : defaults.dynamicRowHeights

  return {
    ...options,
    enabled,
    estimateSize,
    overscan,
    overscanByBreakpoint,
    dynamicRowHeights,
    rowHeights,
  }
}

function resolveRowHeights(
  rowHeights: GroupingVirtualRowHeights | undefined,
  defaults: Required<GroupingVirtualRowHeights>,
): Required<GroupingVirtualRowHeights> {
  return {
    groupHeader: rowHeights?.groupHeader ?? defaults.groupHeader,
    columnHeader: rowHeights?.columnHeader ?? defaults.columnHeader,
    dataRow: rowHeights?.dataRow ?? defaults.dataRow,
    footer: rowHeights?.footer ?? defaults.footer,
  }
}

interface StickyContext<T extends TableData = TableData> {
  range: { startIndex: number; endIndex: number }
  items: GroupVirtualRowItem<T>[]
}

interface SharedVirtualizerResult<T extends TableData = TableData> {
  virtualizer: Ref<NuGridVirtualizer> | null
  virtualizationEnabled: ComputedRef<boolean>
  activeStickyIndexes: Ref<number[]>
  activeStickyHeight: ComputedRef<number>
  virtualRowItems: ComputedRef<GroupVirtualRowItem<T>[]>
  measuredVirtualSizes: ComputedRef<Map<number, number> | null>
  getVirtualItemHeight: (index: number) => number
  stickyOffsets: ComputedRef<Map<number, number>>
}

interface SharedVirtualizerOptions<T extends TableData = TableData> {
  virtualization: ComputedRef<ResolvedNuGridVirtualizeOptions>
  rootRef: Ref<InstanceType<typeof Primitive> | null | undefined>
  stickyEnabled?: Ref<boolean>
  virtualRowItems: ComputedRef<GroupVirtualRowItem<T>[]>
  resolveStickyIndexes?: (context: StickyContext<T>) => number[]
}

export interface UseNuGridGroupVirtualizationOptions<T extends TableData> {
  props: MaybeRefOrGetter<NuGridProps<T>>
  tableApi: Table<T>
  rootRef: Ref<InstanceType<typeof Primitive> | null | undefined>
  stickyEnabled?: Ref<boolean>
  groupRows: ComputedRef<Row<T>[]>
  groupedRows: ComputedRef<Record<string, Row<T>[]>>
  isGroupExpanded: (groupId: string) => boolean
  topLevelRows: ComputedRef<Row<T>[]>
  addRowOptions?: {
    addRowPosition: Ref<'top' | 'bottom' | 'none'>
    getAddRowForGroup?: (groupId: string) => Row<T> | null
  }
}

export function useNuGridGroupVirtualization<T extends TableData>(
  options: UseNuGridGroupVirtualizationOptions<T>,
) {
  const props = computed(() => toValue(options.props))
  const currentBreakpoint = useNuGridBreakpointKey()

  const virtualization = computed(() =>
    resolveVirtualizationOptions(props.value.virtualization, 80, currentBreakpoint.value),
  )

  const groupingRowHeights = computed(() => virtualization.value.rowHeights)

  const headerGroupCount = computed(() => options.tableApi.getHeaderGroups().length)

  const getColumnHeadersHeight = (expanded: boolean) => {
    const columnHeaderHeight = groupingRowHeights.value.columnHeader
    if (!expanded) {
      return columnHeaderHeight
    }
    return headerGroupCount.value * columnHeaderHeight
  }

  // Helper to recursively process groups and their nested subgroups
  function processGroupRecursively(
    groupRow: Row<T>,
    items: GroupVirtualRowItem<T>[],
    indexRef: { value: number },
    heights: Required<GroupingVirtualRowHeights>,
    parentExpanded: boolean = true,
    depth: number = 0,
  ): void {
    const groupId = groupRow.id
    const expanded = options.isGroupExpanded(groupId)

    // Only process if parent is expanded (or this is a top-level group)
    if (!parentExpanded) {
      return
    }

    // Add group header
    items.push({
      type: 'group-header',
      height: heights.groupHeader,
      groupId,
      groupRow,
      index: indexRef.value++,
      depth,
    })

    if (!expanded) {
      items.push({
        type: 'column-headers',
        height: getColumnHeadersHeight(false),
        groupId,
        index: indexRef.value++,
      })

      items.push({
        type: 'footer',
        height: heights.footer,
        groupId,
        index: indexRef.value++,
      })
    } else {
      items.push({
        type: 'column-headers',
        height: getColumnHeadersHeight(true),
        groupId,
        index: indexRef.value++,
      })

      const addRowPosition = options.addRowOptions?.addRowPosition.value ?? 'none'
      const addRowRow = options.addRowOptions?.getAddRowForGroup?.(groupId) || null

      if (addRowRow && addRowPosition === 'top') {
        items.push({
          type: 'data',
          height: heights.dataRow,
          groupId,
          dataRow: addRowRow,
          index: indexRef.value++,
          depth,
        })
      }

      // Process subRows - they can be subgroups or data rows
      if (groupRow.subRows && groupRow.subRows.length > 0) {
        groupRow.subRows.forEach((subRow) => {
          if (subRow.getIsGrouped()) {
            processGroupRecursively(subRow, items, indexRef, heights, expanded, depth + 1)
          } else {
            items.push({
              type: 'data',
              height: heights.dataRow,
              groupId,
              dataRow: subRow,
              index: indexRef.value++,
              depth,
            })
          }
        })
      }

      if (addRowRow && addRowPosition === 'bottom') {
        items.push({
          type: 'data',
          height: heights.dataRow,
          groupId,
          dataRow: addRowRow,
          index: indexRef.value++,
          depth,
        })
      }

      items.push({
        type: 'footer',
        height: heights.footer,
        groupId,
        index: indexRef.value++,
      })
    }
  }

  const virtualRowItems = computed<GroupVirtualRowItem<T>[]>(() => {
    const items: GroupVirtualRowItem<T>[] = []
    const index = 0
    const heights = groupingRowHeights.value
    const indexRef = { value: index }

    // Process top-level groups (from rows.value which contains top-level groups)
    options.topLevelRows.value.forEach((row) => {
      if (row.getIsGrouped()) {
        processGroupRecursively(row, items, indexRef, heights, true, 0)
      }
    })

    return items
  })

  const {
    virtualizer,
    virtualizationEnabled,
    activeStickyIndexes,
    activeStickyHeight,
    measuredVirtualSizes,
    getVirtualItemHeight,
    stickyOffsets,
  } = useSharedVirtualizer({
    virtualization,
    rootRef: options.rootRef,
    stickyEnabled: options.stickyEnabled,
    virtualRowItems,
    resolveStickyIndexes: ({ range, items }) => resolveGroupStickyIndexes(range, items),
  })

  return {
    groupingRowHeights,
    headerGroupCount,
    virtualRowItems,
    virtualizer,
    virtualizationEnabled,
    activeStickyIndexes,
    activeStickyHeight,
    measuredVirtualSizes,
    getVirtualItemHeight,
    stickyOffsets,
  }
}

/**
 * Virtualization for large datasets (non-grouped grids)
 */
export interface UseNuGridVirtualizationOptions<T extends TableData> {
  props: MaybeRefOrGetter<NuGridProps<T>>
  rows: ComputedRef<Row<T>[]>
  tableApi: Table<T>
  rootRef: Ref<InstanceType<typeof Primitive> | null | undefined>
  stickyEnabled?: Ref<boolean>
  hasFooter?: MaybeRefOrGetter<boolean>
}

export function useNuGridVirtualization<T extends TableData>(
  options: UseNuGridVirtualizationOptions<T>,
) {
  const props = computed(() => toValue(options.props))
  const rows = computed(() => options.rows.value)
  const headerGroupCount = computed(() => options.tableApi.getHeaderGroups().length)
  const hasFooter = computed(() => toValue(options.hasFooter ?? false))
  const currentBreakpoint = useNuGridBreakpointKey()

  const virtualization = computed(() =>
    resolveVirtualizationOptions(props.value.virtualization, 65, currentBreakpoint.value),
  )

  const rowHeights = computed(() => virtualization.value.rowHeights)

  const virtualRowItems = computed<GroupVirtualRowItem<T>[]>(() => {
    const items: GroupVirtualRowItem<T>[] = []
    let index = 0

    // Column headers virtual item (always first)
    items.push({
      type: 'column-headers',
      height: rowHeights.value.columnHeader * Math.max(headerGroupCount.value, 1),
      index: index++,
    })

    rows.value.forEach((row) => {
      items.push({
        type: 'data',
        height: rowHeights.value.dataRow,
        dataRow: row,
        index: index++,
      })
    })

    if (hasFooter.value) {
      items.push({
        type: 'footer',
        height: rowHeights.value.footer,
        index: index++,
      })
    }

    return items
  })

  const shared = useSharedVirtualizer({
    virtualization,
    rootRef: options.rootRef,
    stickyEnabled: options.stickyEnabled,
    virtualRowItems,
    resolveStickyIndexes: () => {
      if (!options.stickyEnabled?.value) {
        return []
      }
      return [0]
    },
  })

  return shared
}

function useSharedVirtualizer<T extends TableData>(
  options: SharedVirtualizerOptions<T>,
): SharedVirtualizerResult<T> {
  const virtualizerProps = computed(() => {
    const {
      enabled: _enabled,
      rowHeights: _rowHeights,
      dynamicRowHeights: _dyn,
      overscanByBreakpoint: _overscanMap,
      ...rest
    } = options.virtualization.value
    return rest
  })
  const virtualizationEnabled = computed(() => options.virtualization.value.enabled)
  const activeStickyIndexes = ref<number[]>([])

  // For non-virtualized case, provide simplified helpers
  if (!virtualizationEnabled.value) {
    const measuredVirtualSizes = computed(() => null)
    const getVirtualItemHeight = (index: number) =>
      options.virtualRowItems.value[index]?.height ?? 0
    const stickyOffsets = computed(() => new Map<number, number>())
    const activeStickyHeight = computed(() => {
      let total = 0
      for (const index of activeStickyIndexes.value) {
        total += getVirtualItemHeight(index)
      }
      return total
    })

    return {
      virtualizer: null,
      virtualizationEnabled,
      activeStickyIndexes,
      activeStickyHeight,
      virtualRowItems: options.virtualRowItems,
      measuredVirtualSizes,
      getVirtualItemHeight,
      stickyOffsets,
    }
  }

  const baseVirtualizer = useVirtualizer({
    ...virtualizerProps.value,
    get count() {
      return options.virtualRowItems.value.length
    },
    getScrollElement: () => options.rootRef.value?.$el,
    estimateSize: (index: number) => {
      const item = options.virtualRowItems.value[index]
      return item?.height ?? virtualizerProps.value.estimateSize
    },
    rangeExtractor: (range) => {
      if (!options.stickyEnabled?.value || !options.resolveStickyIndexes) {
        activeStickyIndexes.value = []
        return defaultRangeExtractor(range)
      }
      const sticky = options.resolveStickyIndexes({ range, items: options.virtualRowItems.value })
      activeStickyIndexes.value = sticky
      if (!sticky.length) {
        return defaultRangeExtractor(range)
      }
      const merged = new Set([...sticky, ...defaultRangeExtractor(range)])
      return [...merged]
    },
  }) as Ref<Virtualizer<Element, Element>>

  const virtualizer = baseVirtualizer as unknown as Ref<NuGridVirtualizer>
  const dynamicRowHeightsEnabled = computed(() => options.virtualization.value.dynamicRowHeights)
  virtualizer.value.props = options.virtualization
  virtualizer.value.dynamicRowHeightsEnabled = dynamicRowHeightsEnabled

  if (options.stickyEnabled) {
    watch(options.stickyEnabled, () => {
      virtualizer.value?.measure()
    })
  }

  // Measured virtual sizes for dynamic heights
  const measuredVirtualSizes = computed<Map<number, number> | null>(() => {
    if (!dynamicRowHeightsEnabled.value) {
      return null
    }

    const map = new Map<number, number>()
    virtualizer.value.getVirtualItems().forEach((virtualItem: VirtualItem) => {
      map.set(virtualItem.index, virtualItem.size)
    })
    return map
  })

  // Helper function to get virtual item height (measured or fallback)
  const getVirtualItemHeight = (index: number) => {
    const fallbackHeight = options.virtualRowItems.value[index]?.height ?? 0
    if (!dynamicRowHeightsEnabled.value) {
      return fallbackHeight
    }
    return measuredVirtualSizes.value?.get(index) ?? fallbackHeight
  }

  // Sticky offsets for stacked sticky headers
  const stickyOffsets = computed(() => {
    if (!options.stickyEnabled?.value || !activeStickyIndexes.value.length) {
      return new Map<number, number>()
    }

    const offsets = new Map<number, number>()
    let topOffset = 0

    activeStickyIndexes.value.forEach((stickyIndex) => {
      offsets.set(stickyIndex, topOffset)
      topOffset += getVirtualItemHeight(stickyIndex)
    })

    return offsets
  })

  // Calculate active sticky height using measured heights when available
  const activeStickyHeight = computed(() => {
    let total = 0
    for (const index of activeStickyIndexes.value) {
      total += getVirtualItemHeight(index)
    }
    return total
  })

  return {
    virtualizer,
    virtualizationEnabled,
    activeStickyIndexes,
    activeStickyHeight,
    virtualRowItems: options.virtualRowItems,
    measuredVirtualSizes,
    getVirtualItemHeight,
    stickyOffsets,
  }
}

function resolveGroupStickyIndexes<T extends TableData>(
  range: { startIndex: number; endIndex: number },
  items: GroupVirtualRowItem<T>[],
) {
  const activeStickySet = new Set<number>()
  const groupHeaderIndexes = items
    .map((item, index) => (item.type === 'group-header' ? index : -1))
    .filter((index) => index !== -1)

  let activeGroupHeaderIndex: number | undefined

  for (let i = groupHeaderIndexes.length - 1; i >= 0; i--) {
    const headerIndex = groupHeaderIndexes[i]
    if (headerIndex !== undefined && headerIndex <= range.startIndex) {
      activeGroupHeaderIndex = headerIndex
      break
    }
  }

  if (activeGroupHeaderIndex === undefined && groupHeaderIndexes.length > 0) {
    activeGroupHeaderIndex = groupHeaderIndexes[0]
  }

  if (activeGroupHeaderIndex !== undefined) {
    activeStickySet.add(activeGroupHeaderIndex)

    let nextIndex = activeGroupHeaderIndex + 1
    while (nextIndex < items.length) {
      const item = items[nextIndex]
      if (item?.type === 'column-headers') {
        activeStickySet.add(nextIndex)
        break
      } else if (item?.type === 'group-header') {
        break
      }
      nextIndex++
    }
  }

  return Array.from(activeStickySet)
}

/**
 * Virtualization for standard group mode (column headers once at top, group subheaders between rows)
 */
export function useNuGridStandardGroupVirtualization<T extends TableData>(
  options: UseNuGridGroupVirtualizationOptions<T>,
) {
  const props = computed(() => toValue(options.props))
  const currentBreakpoint = useNuGridBreakpointKey()

  const virtualization = computed(() =>
    resolveVirtualizationOptions(props.value.virtualization, 80, currentBreakpoint.value),
  )

  const groupingRowHeights = computed(() => virtualization.value.rowHeights)

  const headerGroupCount = computed(() => options.tableApi.getHeaderGroups().length)

  const getColumnHeadersHeight = () => {
    const columnHeaderHeight = groupingRowHeights.value.columnHeader
    return headerGroupCount.value * columnHeaderHeight
  }

  // Helper to recursively process groups and their nested subgroups
  function processGroupRecursively(
    groupRow: Row<T>,
    items: GroupVirtualRowItem<T>[],
    indexRef: { value: number },
    heights: Required<GroupingVirtualRowHeights>,
    parentExpanded: boolean = true,
    depth: number = 0,
  ): void {
    const groupId = groupRow.id
    const expanded = options.isGroupExpanded(groupId)

    // Only process if parent is expanded (or this is a top-level group)
    if (!parentExpanded) {
      return
    }

    // Group subheader
    items.push({
      type: 'group-header',
      height: heights.groupHeader,
      groupId,
      groupRow,
      index: indexRef.value++,
      depth,
    })

    // Data rows (only if expanded)
    if (expanded) {
      const addRowPosition = options.addRowOptions?.addRowPosition.value ?? 'none'
      const addRowRow = options.addRowOptions?.getAddRowForGroup?.(groupId) || null

      if (addRowRow && addRowPosition === 'top') {
        items.push({
          type: 'data',
          height: heights.dataRow,
          groupId,
          dataRow: addRowRow,
          index: indexRef.value++,
          depth,
        })
      }

      // Process subRows - they can be subgroups or data rows
      if (groupRow.subRows && groupRow.subRows.length > 0) {
        groupRow.subRows.forEach((subRow) => {
          if (subRow.getIsGrouped()) {
            processGroupRecursively(subRow, items, indexRef, heights, expanded, depth + 1)
          } else {
            items.push({
              type: 'data',
              height: heights.dataRow,
              groupId,
              dataRow: subRow,
              index: indexRef.value++,
              depth,
            })
          }
        })
      }

      if (addRowRow && addRowPosition === 'bottom') {
        items.push({
          type: 'data',
          height: heights.dataRow,
          groupId,
          dataRow: addRowRow,
          index: indexRef.value++,
          depth,
        })
      }

      // Add footer for this group (for group summaries)
      items.push({
        type: 'footer',
        height: heights.footer,
        groupId,
        index: indexRef.value++,
        depth,
      })
    }
  }

  const virtualRowItems = computed<GroupVirtualRowItem<T>[]>(() => {
    const items: GroupVirtualRowItem<T>[] = []
    const index = 0
    const heights = groupingRowHeights.value
    const indexRef = { value: index }

    // Column headers first (only once at the top)
    items.push({
      type: 'column-headers',
      height: getColumnHeadersHeight(),
      index: indexRef.value++,
    })

    // Then groups with their subheaders and data (process top-level groups recursively)
    options.topLevelRows.value.forEach((row) => {
      if (row.getIsGrouped()) {
        processGroupRecursively(row, items, indexRef, heights, true, 0)
      }
    })

    // Footer at the end
    items.push({
      type: 'footer',
      height: heights.footer,
      index: indexRef.value++,
    })

    return items
  })

  const {
    virtualizer,
    virtualizationEnabled,
    activeStickyIndexes,
    activeStickyHeight,
    measuredVirtualSizes,
    getVirtualItemHeight,
    stickyOffsets,
  } = useSharedVirtualizer({
    virtualization,
    rootRef: options.rootRef,
    stickyEnabled: options.stickyEnabled,
    virtualRowItems,
    resolveStickyIndexes: ({ range, items }) => resolveStandardGroupStickyIndexes(range, items),
  })

  return {
    groupingRowHeights,
    headerGroupCount,
    virtualRowItems,
    virtualizer,
    virtualizationEnabled,
    activeStickyIndexes,
    activeStickyHeight,
    measuredVirtualSizes,
    getVirtualItemHeight,
    stickyOffsets,
  }
}

/**
 * Sticky index resolver for standard group mode
 * Column headers are always sticky (index 0), plus the current active group header
 */
function resolveStandardGroupStickyIndexes<T extends TableData>(
  range: { startIndex: number; endIndex: number },
  items: GroupVirtualRowItem<T>[],
) {
  const activeStickySet = new Set<number>()

  // Column headers are always sticky (index 0)
  if (items[0]?.type === 'column-headers') {
    activeStickySet.add(0)
  }

  // Find the active group header (the one that should be sticky below column headers)
  const groupHeaderIndexes = items
    .map((item, index) => (item.type === 'group-header' ? index : -1))
    .filter((index) => index !== -1)

  let activeGroupHeaderIndex: number | undefined

  for (let i = groupHeaderIndexes.length - 1; i >= 0; i--) {
    const headerIndex = groupHeaderIndexes[i]
    if (headerIndex !== undefined && headerIndex <= range.startIndex) {
      activeGroupHeaderIndex = headerIndex
      break
    }
  }

  // If we're before all group headers, use the first one
  if (activeGroupHeaderIndex === undefined && groupHeaderIndexes.length > 0) {
    activeGroupHeaderIndex = groupHeaderIndexes[0]
  }

  if (activeGroupHeaderIndex !== undefined) {
    activeStickySet.add(activeGroupHeaderIndex)
  }

  return Array.from(activeStickySet).sort((a, b) => a - b)
}
