import type { TableData, TableProps, TableRow } from '@nuxt/ui'
import type { Updater, VisibilityState } from '@tanstack/vue-table'
import type { ComponentPublicInstance, PropType, Ref } from 'vue'
import type {
  NuGridActionMenuOptions,
  NuGridColumn,
  NuGridEventEmitter,
  NuGridProps,
} from '../../types'
import type {
  NuGridRowSelectionMode,
  NuGridStates,
  PinnableHeader,
  UseNuGridColumnsReturn,
} from '../../types/_internal'
import {
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { createReusableTemplate, reactiveOmit } from '@vueuse/core'
import { upperFirst } from 'scule'
import { computed, nextTick, ref, watch } from 'vue'
import { nuGridDefaults } from '../../config/_internal'
import { extractColumnValues, inferCellDataType } from '../../utils/inferCellDataType'
import { nuGridCellTypeRegistry } from '../useNuGridCellTypeRegistry'
import { useNuGridActionMenu } from './useNuGridActionMenu'
import { useNuGridRowSelection } from './useNuGridRowSelection'

/**
 * Shared logic for processing columns with default cell renderers
 */
export function useNuGridColumns<T extends TableData>(
  propsColumns: Ref<NuGridColumn<T>[] | undefined>,
  data: Ref<T[]>,
  rowSelectionMode?: Ref<NuGridRowSelectionMode<T>>,
  actionMenuOptions?: Ref<NuGridActionMenuOptions<T> | undefined | false>,
  columnVisibilityState?: Ref<VisibilityState>,
  dataTypeInference?: Ref<boolean>,
): UseNuGridColumnsReturn<T> {
  // Use the row selection composable
  const rowSelection = rowSelectionMode
    ? useNuGridRowSelection<T>(rowSelectionMode, columnVisibilityState)
    : null

  // Use the action menu composable
  const actionMenu = actionMenuOptions
    ? useNuGridActionMenu<T>(actionMenuOptions, columnVisibilityState)
    : null

  const columns = computed<NuGridColumn<T>[]>(() => {
    // Access dataTypeInference.value directly to establish reactive dependency
    // (processColumns accesses it, but Vue needs to see it in the computed callback)
    const inferenceEnabled = dataTypeInference?.value !== false

    const cols =
      propsColumns.value
      ?? Object.keys(data.value[0] ?? {}).map((accessorKey: string) => ({
        accessorKey,
        header: upperFirst(accessorKey),
      }))

    let processedCols = processColumns(cols, inferenceEnabled)

    // Use the row selection composable to prepend selection column
    if (rowSelection) {
      processedCols = rowSelection.prependSelectionColumn(processedCols)
    }

    // Use the action menu composable to append action menu column
    if (actionMenu) {
      processedCols = actionMenu.appendActionMenuColumn(processedCols)
    }

    return processedCols
  })

  // Cache plugin lookups per cellDataType to avoid repeated lookups during column processing
  // This cache persists across column recomputations, improving performance
  const pluginCache = new Map<string, ReturnType<typeof nuGridCellTypeRegistry.get> | undefined>()

  function processColumns(
    columns: NuGridColumn<T>[],
    inferenceEnabled: boolean,
  ): NuGridColumn<T>[] {
    return columns.map((column) => {
      const col = { ...column } as NuGridColumn<T>

      if ('columns' in col && col.columns) {
        col.columns = processColumns(col.columns as NuGridColumn<T>[], inferenceEnabled)
      }

      // Infer cellDataType from data if not explicitly set
      // Skip inference if:
      // - dataTypeInference is false (globally disabled)
      // - cellDataType is explicitly set (including false to opt-out)
      // - column has no accessorKey (display columns, computed columns)
      const accessorKey = (col as any).accessorKey
      if (
        inferenceEnabled
        && (col as any).cellDataType === undefined
        && accessorKey
        && data.value.length > 0
      ) {
        const values = extractColumnValues(data.value, accessorKey)
        const inferredType = inferCellDataType(values, accessorKey)
        if (inferredType) {
          ;(col as any).cellDataType = inferredType
        }
      }

      // Apply plugin defaults if column has a cellDataType (skip if false = opt-out)
      const cellDataType = (col as any).cellDataType
      if (cellDataType && cellDataType !== false) {
        // Use cache to avoid repeated plugin lookups
        let plugin = pluginCache.get(cellDataType)
        if (plugin === undefined) {
          plugin = nuGridCellTypeRegistry.get(cellDataType)
          pluginCache.set(cellDataType, plugin)
        }

        if (plugin?.defaultColumnDef) {
          // Merge plugin defaults with column definition
          // Column definition takes precedence
          Object.assign(col, plugin.defaultColumnDef, col)
        }

        // Use plugin default cell renderer if no cell renderer is provided
        if (!col.cell && plugin?.defaultCellRenderer) {
          col.cell = ({ getValue, row, column: colColumn, table }) => {
            const context: any = {
              cell: { getValue, column: colColumn },
              row,
              getValue,
              column: colColumn,
              table,
            }
            return plugin.defaultCellRenderer!(context)
          }
        }

        // Apply plugin formatter if no custom cell renderer and plugin provides formatter
        if (!col.cell && plugin?.formatter) {
          col.cell = ({ getValue, row, column: colColumn, table }) => {
            const rawValue = getValue()
            // Create plugin context for formatter
            const pluginContext: any = {
              cell: { getValue: () => rawValue, column: colColumn },
              row,
              columnDef: colColumn.columnDef,
              column: colColumn,
              getValue: () => rawValue,
              isFocused: false,
              canEdit: true,
              data: data.value,
              tableApi: table,
              startEditing: () => {},
              stopEditing: () => {},
              emitChange: () => {},
            }
            const formattedValue = plugin.formatter!(rawValue, pluginContext)
            if (formattedValue === '' || formattedValue === null || formattedValue === undefined) {
              return '\u00A0'
            }
            return formattedValue
          }
        }
      }

      // Default cell renderer if still no cell renderer
      if (!col.cell) {
        col.cell = ({ getValue }) => {
          const value = getValue()
          if (value === '' || value === null || value === undefined) {
            return '\u00A0'
          }
          return String(value)
        }
      }

      return col
    })
  }

  return { columns, rowSelection, actionMenu }
}

/**
 * Helper function to update state values
 */
export function valueUpdater<T extends Updater<any>>(updaterOrValue: T, ref: Ref) {
  ref.value = typeof updaterOrValue === 'function' ? updaterOrValue(ref.value) : updaterOrValue
}

/**
 * Resolve value or function
 */
export function resolveValue<T, A = undefined>(prop: T | ((arg: A) => T), arg?: A): T | undefined {
  if (typeof prop === 'function') {
    // @ts-expect-error: TS can't know if prop is a function here
    return prop(arg)
  }
  return prop
}

/**
 * Resolve style object from string or function
 */
export function resolveStyleObject<T>(
  prop: string | Record<string, string> | ((arg: T) => string | Record<string, string>) | undefined,
  arg?: T,
): Record<string, string> {
  const resolved = resolveValue(prop, arg)
  if (!resolved) return {}
  if (typeof resolved === 'string') return {}
  return resolved
}

/**
 * Determine the effective pinning state for a header.
 * For regular columns (colSpan <= 1), returns the column's pinning state.
 * For column groups (colSpan > 1), returns the pinning state only if ALL leaf columns
 * share the same pinning state. Returns false for mixed pinning.
 *
 * This should be used for BOTH the CSS class and the inline style to ensure consistency.
 */
export function getHeaderEffectivePinning(header: PinnableHeader): false | 'left' | 'right' {
  const pinned = header.column.getIsPinned()

  if (!pinned) {
    return false
  }

  // For regular columns, use the column's own pinning state
  if (header.colSpan <= 1) {
    return pinned
  }

  // For column groups, check if all leaf columns share the same pinning state
  const leafHeaders = header.getLeafHeaders()

  if (leafHeaders.length === 0) {
    return false
  }

  const allSamePinning = leafHeaders.every((leaf) => leaf.column.getIsPinned() === pinned)

  if (!allSamePinning) {
    // Mixed pinning - treat as not pinned
    return false
  }

  return pinned
}

/**
 * Calculate pinning style for a header cell.
 * Handles both regular columns (colSpan === 1) and column group headers (colSpan > 1).
 *
 * For column groups, the position is calculated based on the leaf headers:
 * - Left-pinned groups: use the first leaf header's left position
 * - Right-pinned groups: use the last leaf header's right position
 */
export function getHeaderPinningStyle(
  header: PinnableHeader,
  options: { zIndex?: number; includeZIndex?: boolean } = {},
): Record<string, string | number> {
  const { zIndex = 20, includeZIndex = true } = options

  // Use effective pinning which handles mixed pinning for groups
  const effectivePinned = getHeaderEffectivePinning(header)

  if (!effectivePinned) {
    return {}
  }

  // Helper to build the result with optional zIndex
  const buildResult = (positionStyle: Record<string, string>) => {
    if (includeZIndex && zIndex !== undefined) {
      return { ...positionStyle, zIndex }
    }
    return positionStyle
  }

  // For regular columns (colSpan <= 1), use the column's own position
  if (header.colSpan <= 1) {
    if (effectivePinned === 'left') {
      return buildResult({ left: `${header.column.getStart('left')}px` })
    }
    if (effectivePinned === 'right') {
      return buildResult({ right: `${header.column.getAfter('right')}px` })
    }
    return {}
  }

  // For column groups (colSpan > 1), calculate position from leaf headers
  const leafHeaders = header.getLeafHeaders()

  if (leafHeaders.length === 0) {
    return {}
  }

  if (effectivePinned === 'left') {
    // For left-pinned groups, use the first leaf column's start position
    const firstLeaf = leafHeaders[0]
    if (!firstLeaf) return {}
    return buildResult({ left: `${firstLeaf.column.getStart('left')}px` })
  }

  if (effectivePinned === 'right') {
    // For right-pinned groups, use the last leaf column's after position
    const lastLeaf = leafHeaders[leafHeaders.length - 1]
    if (!lastLeaf) return {}
    return buildResult({ right: `${lastLeaf.column.getAfter('right')}px` })
  }

  return {}
}

export function createRowReusableTemplate<T>() {
  return createReusableTemplate<{
    row: TableRow<T>
    style?: Record<string, string>
    dataIndex?: number
    measureRef?: (el: Element | ComponentPublicInstance | null) => void
  }>({
    inheritAttrs: false,
    props: {
      row: {
        type: Object,
        required: true,
      },
      style: {
        type: Object,
        required: false,
      },
      dataIndex: {
        type: Number,
        required: false,
      },
      measureRef: {
        type: Function as PropType<(el: Element | ComponentPublicInstance | null) => void>,
        required: false,
      },
    },
  })
}
/**
 * Create table API instance with all features configured
 */
export function useNuGridApi<T extends TableData>(
  props: NuGridProps<T> | TableProps<T>,
  data: Ref<T[]>,
  columns: Ref<NuGridColumn<T>[]>,
  states: NuGridStates,
  rowSelectionMode?: Ref<NuGridRowSelectionMode<T>>,
  eventEmitter?: NuGridEventEmitter<T>,
) {
  const meta = computed(() => props.meta ?? {})

  // Use the row selection composable to get enableMultiRowSelection
  const rowSelection = rowSelectionMode ? useNuGridRowSelection<T>(rowSelectionMode) : null

  // Filter out props that are not part of TableProps by using reactive omit
  const filteredProps = reactiveOmit(
    props as any,
    'as',
    'data',
    'columns',
    'virtualization',
    'caption',
    'sticky',
    'loading',
    'loadingColor',
    'loadingAnimation',
    'class',
    'ui',
  )

  // Custom global filter function that respects column.enableSearching property
  const globalFilterFn = (row: any, columnId: string, filterValue: string) => {
    if (!filterValue || filterValue.length === 0) return true

    const searchLower = filterValue.toLowerCase()

    // Get all columns and filter to only those with enableSearching !== false
    const searchableColumns = columns.value.filter((col) => {
      // Skip columns without accessor keys (display columns, etc.)
      if (!('accessorKey' in col) && !('id' in col)) return false
      // Check enableSearching property (defaults to true)
      return col.enableSearching !== false
    })

    // Search across all searchable columns
    for (const col of searchableColumns) {
      const key = ('accessorKey' in col ? col.accessorKey : col.id) as string
      if (!key) continue

      const cellValue = row.getValue(key)
      if (cellValue == null) continue

      const stringValue = String(cellValue).toLowerCase()
      if (stringValue.includes(searchLower)) {
        return true
      }
    }

    return false
  }

  const tableApi = useVueTable({
    ...filteredProps,
    data,
    get columns() {
      return columns.value
    },
    get meta() {
      return meta.value
    },
    // Use rowId prop for stable row identity (required for animations)
    // Falls back to index if the specified field is not present
    getRowId: (originalRow, index) => {
      const rowIdProp = (props as NuGridProps<T>).rowId ?? nuGridDefaults.rowId
      if (typeof rowIdProp === 'function') {
        return rowIdProp(originalRow as T)
      }
      const id = (originalRow as any)[rowIdProp]
      return id !== undefined ? String(id) : String(index)
    },
    getCoreRowModel: getCoreRowModel(),
    ...(props.globalFilterOptions || {}),
    // Use custom global filter that respects enableSearching column property
    globalFilterFn,
    onGlobalFilterChange: (updaterOrValue) =>
      valueUpdater(updaterOrValue, states.globalFilterState),
    ...(props.columnFiltersOptions || {}),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: (updaterOrValue) => {
      valueUpdater(updaterOrValue, states.columnFiltersState)
      if (eventEmitter?.filterChanged) {
        eventEmitter.filterChanged({ columnFilters: states.columnFiltersState.value })
      }
    },
    onColumnOrderChange: (updaterOrValue) => valueUpdater(updaterOrValue, states.columnOrderState),
    ...(props.visibilityOptions || {}),
    onColumnVisibilityChange: (updaterOrValue) =>
      valueUpdater(updaterOrValue, states.columnVisibilityState),
    ...(props.columnPinningOptions || {}),
    onColumnPinningChange: (updaterOrValue) =>
      valueUpdater(updaterOrValue, states.columnPinningState),
    ...(props.columnSizingOptions || {}),
    onColumnSizingChange: (updaterOrValue) =>
      valueUpdater(updaterOrValue, states.columnSizingState),
    onColumnSizingInfoChange: (updaterOrValue) =>
      valueUpdater(updaterOrValue, states.columnSizingInfoState),
    columnResizeMode: props.columnSizingOptions?.columnResizeMode ?? 'onChange',
    ...(props.rowSelectionOptions || {}),
    get enableMultiRowSelection() {
      return rowSelection?.enableMultiRowSelection.value ?? true
    },
    get enableRowSelection() {
      return rowSelection?.enableRowSelection.value ?? true
    },
    onRowSelectionChange: (updaterOrValue) =>
      valueUpdater(updaterOrValue, states.rowSelectionState),
    ...(props.rowPinningOptions || {}),
    onRowPinningChange: (updaterOrValue) => valueUpdater(updaterOrValue, states.rowPinningState),
    ...(props.sortingOptions || {}),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updaterOrValue) => {
      valueUpdater(updaterOrValue, states.sortingState)
      if (eventEmitter?.sortChanged) {
        eventEmitter.sortChanged({ sorting: states.sortingState.value })
      }
    },
    // Use Tanstack's default grouping utility, can be overridden by user's groupingOptions
    getGroupedRowModel: getGroupedRowModel(),
    ...(props.groupingOptions || {}),
    onGroupingChange: (updaterOrValue) => valueUpdater(updaterOrValue, states.groupingState),
    ...(props.expandedOptions || {}),
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: (updaterOrValue) => valueUpdater(updaterOrValue, states.expandedState),
    ...(props.paginationOptions || {}),
    // Conditionally include pagination row model when paging is enabled
    ...(() => {
      const pagingProp = (props as NuGridProps<T>).paging
      const isPaginationEnabled =
        pagingProp === true || (typeof pagingProp === 'object' && pagingProp?.enabled !== false)
      // Always include getPaginationRowModel when paging is enabled (even for manual pagination)
      return isPaginationEnabled ? { getPaginationRowModel: getPaginationRowModel() } : {}
    })(),
    // Enable manual pagination mode in TanStack Table when configured
    ...(() => {
      const pagingProp = (props as NuGridProps<T>).paging
      const isManualPagination =
        typeof pagingProp === 'object' && pagingProp?.manualPagination === true
      // When manualPagination is true, TanStack won't auto-slice data
      // Our paging composable handles pageCount/totalPages calculation using rowCount prop
      return isManualPagination ? { manualPagination: true } : {}
    })(),
    onPaginationChange: (updaterOrValue) => valueUpdater(updaterOrValue, states.paginationState),
    ...(props.facetedOptions || {}),
    state: {
      get globalFilter() {
        return states.globalFilterState.value
      },
      get columnFilters() {
        return states.columnFiltersState.value
      },
      get columnOrder() {
        return states.columnOrderState.value
      },
      get columnVisibility() {
        return states.columnVisibilityState.value
      },
      get columnPinning() {
        return states.columnPinningState.value
      },
      get expanded() {
        return states.expandedState.value
      },
      get rowSelection() {
        return states.rowSelectionState.value
      },
      get sorting() {
        return states.sortingState.value
      },
      get grouping() {
        return states.groupingState.value
      },
      get rowPinning() {
        return states.rowPinningState.value
      },
      get columnSizing() {
        return states.columnSizingState.value
      },
      get columnSizingInfo() {
        return states.columnSizingInfoState.value
      },
      get pagination() {
        return states.paginationState.value
      },
    },
  })

  // Signal that gets incremented after columns are updated in the table
  // This allows components to react AFTER setOptions has been called
  const columnsUpdatedSignal = ref(0)

  // Watch for column changes and update the table
  watch(columns, async (newColumns) => {
    tableApi.setOptions((prev) => ({
      ...prev,
      columns: newColumns,
    }))
    // Wait for Vue to process the table update, then signal that columns were updated
    await nextTick()
    columnsUpdatedSignal.value++
  })

  return { tableApi, columnsUpdatedSignal }
}

/**
 * Check if table has footer columns
 */
export function useNuGridFooter<T extends TableData>(columns: Ref<NuGridColumn<T>[]>) {
  const hasFooter = computed(() => {
    function hasFooterRecursive(columns: NuGridColumn<T>[]): boolean {
      for (const column of columns) {
        if ('footer' in column && column.footer != null) {
          return true
        }
        if ('columns' in column && hasFooterRecursive(column.columns as NuGridColumn<T>[])) {
          return true
        }
      }
      return false
    }

    return hasFooterRecursive(columns.value)
  })

  return { hasFooter }
}

/**
 * Watch for data changes
 */
export function useNuGridDataWatch<T extends TableData>(props: NuGridProps<T>, data: Ref<T[]>) {
  watch(
    () => props.data,
    () => {
      data.value = props.data ? [...props.data] : []
    },
    props.watchOptions,
  )
}
