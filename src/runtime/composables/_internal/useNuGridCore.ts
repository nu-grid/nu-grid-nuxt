import type { ComponentPublicInstance, PropType, Ref } from 'vue'

import { createReusableTemplate } from '@vueuse/core'
import { upperFirst } from 'scule'
import { computed, nextTick, ref, shallowRef, watch } from 'vue'

import type { Row } from '../../engine'
import type { StateAccessors } from '../../engine/types'
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
import type { NuGridCellType } from '../../types/cells'
import type { Updater, VisibilityState } from '../../types/state-types'
import type { TableData } from '../../types/table-data'

import { nuGridDefaults } from '../../config/_internal'
import { createNuGridTable } from '../../engine/table'
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
  customCellTypes?: Ref<NuGridCellType<T>[] | undefined>,
): UseNuGridColumnsReturn<T> {
  // Use the row selection composable
  const rowSelection = rowSelectionMode
    ? useNuGridRowSelection<T>(rowSelectionMode, columnVisibilityState)
    : null

  // Use the action menu composable
  const actionMenu = actionMenuOptions
    ? useNuGridActionMenu<T>(actionMenuOptions, columnVisibilityState)
    : null

  // Build a map of custom cell types for O(1) lookup
  const customTypeMap = computed(() => {
    if (!customCellTypes?.value) return null
    return new Map(customCellTypes.value.map((t) => [t.name, t]))
  })

  // Cache plugin lookups per cellDataType to avoid repeated lookups during column processing
  const pluginCache = new Map<string, ReturnType<typeof nuGridCellTypeRegistry.get> | undefined>()

  const columns = computed<NuGridColumn<T>[]>(() => {
    // Access dataTypeInference.value directly to establish reactive dependency
    // (processColumns accesses it, but Vue needs to see it in the computed callback)
    const inferenceEnabled = dataTypeInference?.value !== false

    // Clear plugin cache when columns recompute (custom cell types may have changed)
    pluginCache.clear()

    const cols =
      propsColumns.value ??
      Object.keys(data.value[0] ?? {}).map((accessorKey: string) => ({
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

  function processColumns(
    columns: NuGridColumn<T>[],
    inferenceEnabled: boolean,
  ): NuGridColumn<T>[] {
    return columns.map((column) => {
      const col = { ...column } as NuGridColumn<T>

      if ('columns' in col && col.columns) {
        col.columns = processColumns(col.columns as NuGridColumn<T>[], inferenceEnabled)
      }

      // Apply lockSize shorthand: sets size, minSize, and maxSize to the same value
      if (col.lockSize != null) {
        col.size = col.lockSize
        col.minSize = col.lockSize
        col.maxSize = col.lockSize
      }

      // Apply default minSize if not explicitly set (engine defaults to 20px which is too small)
      if (col.minSize == null) {
        col.minSize = nuGridDefaults.columnDefaults.minSize
      }

      // Infer cellDataType from data if not explicitly set
      // Skip inference if:
      // - dataTypeInference is false (globally disabled)
      // - cellDataType is explicitly set (including false to opt-out)
      // - column has no accessorKey (display columns, computed columns)
      const accessorKey = col.accessorKey
      if (
        inferenceEnabled &&
        col.cellDataType === undefined &&
        accessorKey &&
        data.value.length > 0
      ) {
        const values = extractColumnValues(data.value, accessorKey)
        const inferredType = inferCellDataType(values, accessorKey)
        if (inferredType) {
          col.cellDataType = inferredType
        }
      }

      // Apply plugin defaults if column has a cellDataType (skip if false = opt-out)
      const cellDataType = col.cellDataType
      if (cellDataType) {
        // Use cache to avoid repeated plugin lookups
        // Check custom cell types first, then fall back to global registry
        let plugin = pluginCache.get(cellDataType)
        if (plugin === undefined) {
          plugin =
            (customTypeMap.value?.get(cellDataType) as ReturnType<
              typeof nuGridCellTypeRegistry.get
            >) ?? nuGridCellTypeRegistry.get(cellDataType)
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
    row: Row<T>
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
  props: NuGridProps<T>,
  data: Ref<T[]>,
  columns: Ref<NuGridColumn<T>[]>,
  states: NuGridStates,
  rowSelectionMode?: Ref<NuGridRowSelectionMode<T>>,
  eventEmitter?: NuGridEventEmitter<T>,
) {
  // Use the row selection composable to get enableMultiRowSelection
  const rowSelection = rowSelectionMode ? useNuGridRowSelection<T>(rowSelectionMode) : null

  // Build StateAccessors — the bridge between NuGrid state refs and the engine
  const stateAccessors: StateAccessors = {
    columnSizing: () => states.columnSizingState.value,
    columnSizingInfo: () => states.columnSizingInfoState.value,
    columnPinning: () => states.columnPinningState.value,
    columnVisibility: () => states.columnVisibilityState.value,
    columnOrder: () => states.columnOrderState.value,
    sorting: () => states.sortingState.value,
    grouping: () => states.groupingState.value,
    rowSelection: () => states.rowSelectionState.value,
    expanded: () => states.expandedState.value,
    columnFilters: () => states.columnFiltersState.value,

    // Mutators — update refs and emit events
    setSorting: (updater) => {
      states.sortingState.value =
        typeof updater === 'function' ? updater(states.sortingState.value) : updater
      if (eventEmitter?.sortChanged) {
        eventEmitter.sortChanged({ sorting: states.sortingState.value })
      }
    },
    setRowSelection: (updater) => {
      states.rowSelectionState.value =
        typeof updater === 'function' ? updater(states.rowSelectionState.value) : updater
    },
    setExpanded: (updater) => {
      states.expandedState.value =
        typeof updater === 'function' ? updater(states.expandedState.value) : updater
    },
    setColumnFilters: (updater) => {
      states.columnFiltersState.value =
        typeof updater === 'function' ? updater(states.columnFiltersState.value) : updater
    },
    setColumnVisibility: (updater) => {
      states.columnVisibilityState.value =
        typeof updater === 'function' ? updater(states.columnVisibilityState.value) : updater
    },

    // Column list accessors — patched by the engine at creation time
    getVisibleLeafColumns: () => [],
    getLeftVisibleLeafColumns: () => [],
    getRightVisibleLeafColumns: () => [],
    getCenterVisibleLeafColumns: () => [],
  }

  // Build the getRowId function
  const getRowId = (originalRow: T, index: number) => {
    const rowIdProp = (props as NuGridProps<T>).rowId ?? nuGridDefaults.rowId
    if (typeof rowIdProp === 'function') {
      return rowIdProp(originalRow as T)
    }
    const id = originalRow[rowIdProp]
    return id !== undefined ? String(id) : String(index)
  }

  // Create engine table — columns are built from defs, data is a reactive getter
  const buildEngine = () =>
    createNuGridTable<T>({
      data: () => data.value, // reactive getter — row model reads fresh data each time
      columnDefs: columns.value,
      state: stateAccessors,
      getRowId,
      meta: props.meta ?? {},
      enableColumnResizing: props.enableColumnResizing,
      enableSorting: props.enableSorting,
      enableMultiSort: props.enableMultiSort,
      enableExpanding: props.enableExpanding,
      enableRowSelection: rowSelection?.enableRowSelection.value ?? true,
      enableMultiRowSelection: rowSelection?.enableMultiRowSelection.value ?? true,
      isMultiSortEvent: props.isMultiSortEvent,
      maxMultiSortColCount: props.maxMultiSortColCount,
      renderFallbackValue: props.renderFallbackValue,
    })

  // Engine is held in a shallowRef — rebuilt when columns change
  const engine = shallowRef(buildEngine())

  // Create a stable wrapper that delegates to the current engine.
  // Includes table-level state setters for compatibility with existing code.
  const tableApi = {
    // -- Read methods (delegate to engine) --
    getHeaderGroups: () => engine.value.getHeaderGroups(),
    getFooterGroups: () => engine.value.getFooterGroups(),
    getAllColumns: () => engine.value.getAllColumns(),
    getAllLeafColumns: () => engine.value.getAllLeafColumns(),
    getAllFlatColumns: () => engine.value.getAllFlatColumns(),
    getVisibleLeafColumns: () => engine.value.getVisibleLeafColumns(),
    getLeftLeafColumns: () => engine.value.getLeftLeafColumns(),
    getRightLeafColumns: () => engine.value.getRightLeafColumns(),
    getColumn: (id: string) => engine.value.getColumn(id),
    getRowModel: () => engine.value.getRowModel(),
    getCoreRowModel: () => engine.value.getCoreRowModel(),
    getFilteredRowModel: () => engine.value.getFilteredRowModel(),
    getGroupedRowModel: () => engine.value.getRowModel(),
    getSelectedRowModel: () => engine.value.getSelectedRowModel(),
    getPrePaginationRowModel: () => engine.value.getPrePaginationRowModel(),
    getRow: (id: string, searchAll?: boolean) => engine.value.getRow(id, searchAll),
    createRow: (
      id: string,
      original: any,
      index: number,
      depth: number,
      subRows?: any[],
      parentId?: string,
    ) => engine.value.createRow(id, original, index, depth, subRows, parentId),
    toggleAllPageRowsSelected: (value: boolean) => engine.value.toggleAllPageRowsSelected(value),
    toggleAllRowsSelected: (value: boolean) => engine.value.toggleAllRowsSelected(value),
    getTotalSize: () => engine.value.getTotalSize(),
    getState: () => ({
      ...engine.value.getState(),
      globalFilter: states.globalFilterState.value,
      columnFilters: states.columnFiltersState.value,
      pagination: states.paginationState.value,
      rowPinning: states.rowPinningState.value,
    }),
    get options() {
      return {
        ...engine.value.options,
        manualFiltering: true,
        manualSorting: true,
      }
    },

    // -- Table-level state setters (write directly to NuGrid refs) --
    setSorting: (updater: any) => valueUpdater(updater, states.sortingState),
    setRowSelection: (updater: any) => valueUpdater(updater, states.rowSelectionState),
    setGlobalFilter: (updater: any) => valueUpdater(updater, states.globalFilterState),
    setColumnFilters: (updater: any) => valueUpdater(updater, states.columnFiltersState),
    setColumnVisibility: (updater: any) => valueUpdater(updater, states.columnVisibilityState),
    setColumnPinning: (updater: any) => valueUpdater(updater, states.columnPinningState),
    setColumnOrder: (updater: any) => valueUpdater(updater, states.columnOrderState),
    setColumnSizing: (updater: any) => valueUpdater(updater, states.columnSizingState),
    setColumnSizingInfo: (updater: any) => valueUpdater(updater, states.columnSizingInfoState),
    setExpanded: (updater: any) => valueUpdater(updater, states.expandedState),
    setGrouping: (updater: any) => valueUpdater(updater, states.groupingState),
    setPagination: (updater: any) => valueUpdater(updater, states.paginationState),
  } as any // tableApi is a superset of EngineTable<T> — includes state setters not on the interface

  // Signal that gets incremented after columns are updated in the table
  const columnsUpdatedSignal = ref(0)

  // Watch for column changes — rebuild engine with new column defs
  watch(columns, async () => {
    engine.value = buildEngine()
    // Wait for Vue to process the update, then signal that columns were updated
    await nextTick()
    columnsUpdatedSignal.value++
  })

  // No data watch needed — the engine reads data via a reactive getter.
  // Vue's dependency tracking automatically re-runs computeds when data.value changes.

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
      data.value = props.data ?? []
    },
    props.watchOptions,
  )
}
