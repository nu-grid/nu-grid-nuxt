import type { TableData } from '@nuxt/ui'
import type { Table } from '@tanstack/vue-table'
import type { ComputedRef, Ref } from 'vue'
import type { NuGridEventEmitter, NuGridPagingOptions, NuGridProps } from '../../types'
import { getPaginationRowModel } from '@tanstack/vue-table'
import { useResizeObserver } from '@vueuse/core'
import { computed, nextTick, ref, watch } from 'vue'
import { nuGridDefaults } from '../../config/_internal'

/**
 * Paging context provided to child components
 */
export interface NuGridPagingContext {
  /** Whether paging is enabled */
  enabled: ComputedRef<boolean>
  /** Current page size (rows per page) */
  pageSize: ComputedRef<number>
  /** Current page index (0-based) */
  pageIndex: ComputedRef<number>
  /** Total number of rows (after filtering, or from server in manual mode) */
  totalRows: ComputedRef<number>
  /** Total number of pages */
  totalPages: ComputedRef<number>
  /** Page size selector options */
  pageSizeOptions: ComputedRef<number[]>
  /** Whether to show the built-in paging panel */
  showPanel: ComputedRef<boolean>
  /** Whether auto page size is enabled */
  autoPageSize: ComputedRef<boolean>
  /** Whether server-side (manual) pagination is enabled */
  manualPagination: ComputedRef<boolean>
  /** Navigate to a specific page (0-based index) */
  setPageIndex: (index: number) => void
  /** Set the page size */
  setPageSize: (size: number) => void
  /** Navigate to the first page */
  firstPage: () => void
  /** Navigate to the last page */
  lastPage: () => void
  /** Navigate to the next page */
  nextPage: () => void
  /** Navigate to the previous page */
  previousPage: () => void
  /** Check if can go to next page */
  canNextPage: ComputedRef<boolean>
  /** Check if can go to previous page */
  canPreviousPage: ComputedRef<boolean>
}

interface UseNuGridPagingOptions<T extends TableData> {
  /** NuGrid props */
  props: NuGridProps<T>
  /** TanStack table instance */
  tableApi: Table<T>
  /** Root container element for auto page size calculation */
  rootRef: Ref<HTMLElement | null>
  /** Row height for auto page size calculation */
  estimatedRowHeight?: number
  /** Header height for auto page size calculation */
  headerHeight?: number
  /** Paging panel height for auto page size calculation */
  pagingPanelHeight?: number
  /** Event emitter for paging events */
  eventEmitter?: NuGridEventEmitter<T>
}

/**
 * Resolve paging options from props
 * Handles boolean shorthand and merges with defaults
 */
export function resolvePagingOptions(
  prop: boolean | NuGridPagingOptions | undefined,
): NuGridPagingOptions {
  const defaults = nuGridDefaults.paging

  if (prop === undefined || prop === false) {
    return { ...defaults, enabled: false }
  }

  if (prop === true) {
    return { ...defaults, enabled: true }
  }

  // Merge with defaults, prop values take precedence
  return {
    enabled: prop.enabled ?? defaults.enabled,
    pageSize: prop.pageSize ?? defaults.pageSize,
    pageSizeSelector: prop.pageSizeSelector ?? defaults.pageSizeSelector,
    autoPageSize: prop.autoPageSize ?? defaults.autoPageSize,
    autoPageSizeMinimum: prop.autoPageSizeMinimum ?? defaults.autoPageSizeMinimum,
    suppressPanel: prop.suppressPanel ?? defaults.suppressPanel,
    manualPagination: prop.manualPagination ?? defaults.manualPagination,
    rowCount: prop.rowCount,
  }
}

/**
 * Get the pagination row model for TanStack table
 * Returns undefined if paging is not enabled
 */
export function getPagingRowModelIfEnabled(prop: boolean | NuGridPagingOptions | undefined) {
  const options = resolvePagingOptions(prop)
  if (options.enabled) {
    return getPaginationRowModel()
  }
  return undefined
}

/**
 * Composable for NuGrid paging
 *
 * Provides:
 * - Paging configuration from props
 * - Auto page size calculation based on container height
 * - Page navigation methods
 * - Paging context for child components
 */
export function useNuGridPaging<T extends TableData = TableData>(
  options: UseNuGridPagingOptions<T>,
): NuGridPagingContext {
  const { props, tableApi, rootRef, eventEmitter } = options

  // Resolve paging options
  const resolvedOptions = computed(() => resolvePagingOptions(props.paging))

  // Core computed values
  const enabled = computed(() => resolvedOptions.value.enabled ?? false)
  const autoPageSizeEnabled = computed(() => resolvedOptions.value.autoPageSize ?? false)
  const suppressPanel = computed(() => resolvedOptions.value.suppressPanel ?? false)
  const showPanel = computed(() => enabled.value && !suppressPanel.value)
  const manualPaginationEnabled = computed(() => resolvedOptions.value.manualPagination ?? false)

  // Page size selector options
  const pageSizeOptions = computed(() => {
    const selector = resolvedOptions.value.pageSizeSelector
    if (selector === false) {
      return []
    }
    if (Array.isArray(selector)) {
      return selector
    }
    // Default options
    return nuGridDefaults.paging.pageSizeSelector as number[]
  })

  // Calculated auto page size
  const calculatedAutoPageSize = ref<number | null>(null)

  // Auto page size minimum
  const autoPageSizeMinimum = computed(
    () => resolvedOptions.value.autoPageSizeMinimum ?? nuGridDefaults.paging.autoPageSizeMinimum,
  )

  // Calculate auto page size based on container height
  const calculateAutoPageSize = () => {
    if (!autoPageSizeEnabled.value || !rootRef.value) {
      calculatedAutoPageSize.value = null
      return
    }

    const containerHeight = rootRef.value.clientHeight
    if (containerHeight <= 0) {
      calculatedAutoPageSize.value = null
      return
    }

    // Use provided heights or sensible defaults
    const headerHeight = options.headerHeight ?? 48
    const pagingHeight = options.pagingPanelHeight ?? 56
    const rowHeight = options.estimatedRowHeight ?? 48

    const availableHeight = containerHeight - headerHeight - pagingHeight
    const minimum = autoPageSizeMinimum.value
    const calculatedSize = Math.max(minimum, Math.floor(availableHeight / rowHeight))

    calculatedAutoPageSize.value = calculatedSize

    // Update table's page size if auto page size is active
    if (autoPageSizeEnabled.value && tableApi) {
      tableApi.setPageSize(calculatedSize)
    }
  }

  // Use ResizeObserver to recalculate on container resize
  useResizeObserver(rootRef, () => {
    if (autoPageSizeEnabled.value) {
      calculateAutoPageSize()
    }
  })

  // Initialize page size from options
  watch(
    [enabled, () => resolvedOptions.value.pageSize, autoPageSizeEnabled],
    ([isEnabled, configuredPageSize]) => {
      if (isEnabled && !autoPageSizeEnabled.value && tableApi) {
        tableApi.setPageSize(configuredPageSize ?? nuGridDefaults.paging.pageSize)
      }
    },
    { immediate: true },
  )

  // Recalculate when auto page size is enabled
  watch(autoPageSizeEnabled, (isAuto) => {
    if (isAuto) {
      calculateAutoPageSize()
    }
  })

  // Computed values from table state
  const pageSize = computed(() => {
    if (autoPageSizeEnabled.value && calculatedAutoPageSize.value !== null) {
      return calculatedAutoPageSize.value
    }
    return tableApi?.getState().pagination.pageSize ?? resolvedOptions.value.pageSize ?? 20
  })

  const pageIndex = computed(() => {
    return tableApi?.getState().pagination.pageIndex ?? 0
  })

  const totalRows = computed(() => {
    // In manual pagination mode, use the rowCount from props
    if (manualPaginationEnabled.value) {
      return resolvedOptions.value.rowCount ?? 0
    }
    return tableApi?.getFilteredRowModel().rows.length ?? 0
  })

  const totalPages = computed(() => {
    // In manual pagination mode, calculate from rowCount
    if (manualPaginationEnabled.value) {
      const rows = resolvedOptions.value.rowCount ?? 0
      const size = pageSize.value
      return size > 0 ? Math.ceil(rows / size) : 0
    }
    return tableApi?.getPageCount() ?? 0
  })

  const canNextPage = computed(() => {
    // In manual pagination mode, calculate based on rowCount
    if (manualPaginationEnabled.value) {
      return pageIndex.value < totalPages.value - 1
    }
    return tableApi?.getCanNextPage() ?? false
  })

  const canPreviousPage = computed(() => {
    // In manual pagination mode, just check if not on first page
    if (manualPaginationEnabled.value) {
      return pageIndex.value > 0
    }
    return tableApi?.getCanPreviousPage() ?? false
  })

  // Helper to emit page changed event
  const emitPageChanged = () => {
    if (eventEmitter?.pageChanged) {
      const state = tableApi?.getState()
      eventEmitter.pageChanged({
        pageIndex: state?.pagination.pageIndex ?? 0,
        pageSize: state?.pagination.pageSize ?? 20,
        sorting: state?.sorting ?? [],
        columnFilters: state?.columnFilters ?? [],
        globalFilter: state?.globalFilter as string | undefined,
      })
    }
  }

  // Navigation methods - use nextTick to ensure state is updated before emitting
  const setPageIndex = async (index: number) => {
    tableApi?.setPageIndex(index)
    await nextTick()
    emitPageChanged()
  }

  const setPageSize = async (size: number) => {
    tableApi?.setPageSize(size)
    await nextTick()
    emitPageChanged()
  }

  const firstPage = async () => {
    tableApi?.firstPage()
    await nextTick()
    emitPageChanged()
  }

  const lastPage = async () => {
    tableApi?.lastPage()
    await nextTick()
    emitPageChanged()
  }

  const nextPage = async () => {
    tableApi?.nextPage()
    await nextTick()
    emitPageChanged()
  }

  const previousPage = async () => {
    tableApi?.previousPage()
    await nextTick()
    emitPageChanged()
  }

  // Watch sorting changes - reset to first page and emit pageChanged for server-side pagination
  watch(
    () => tableApi?.getState().sorting,
    async (newSorting, oldSorting) => {
      // Skip if sorting didn't actually change (deep equality check)
      if (JSON.stringify(newSorting) === JSON.stringify(oldSorting)) return
      // Only auto-reset for manual pagination (server-side)
      if (manualPaginationEnabled.value && enabled.value) {
        tableApi?.setPageIndex(0)
        await nextTick()
        emitPageChanged()
      }
    },
    { deep: true },
  )

  // Watch column filter changes - reset to first page and emit pageChanged for server-side pagination
  watch(
    () => tableApi?.getState().columnFilters,
    async (newFilters, oldFilters) => {
      // Skip if filters didn't actually change (deep equality check)
      if (JSON.stringify(newFilters) === JSON.stringify(oldFilters)) return
      // Only auto-reset for manual pagination (server-side)
      if (manualPaginationEnabled.value && enabled.value) {
        tableApi?.setPageIndex(0)
        await nextTick()
        emitPageChanged()
      }
    },
    { deep: true },
  )

  // Watch global filter changes - reset to first page and emit pageChanged for server-side pagination
  watch(
    () => tableApi?.getState().globalFilter,
    async (newFilter, oldFilter) => {
      // Skip if filter didn't actually change
      if (newFilter === oldFilter) return
      // Only auto-reset for manual pagination (server-side)
      if (manualPaginationEnabled.value && enabled.value) {
        tableApi?.setPageIndex(0)
        await nextTick()
        emitPageChanged()
      }
    },
  )

  return {
    enabled,
    pageSize,
    pageIndex,
    totalRows,
    totalPages,
    pageSizeOptions,
    showPanel,
    autoPageSize: autoPageSizeEnabled,
    manualPagination: manualPaginationEnabled,
    setPageIndex,
    setPageSize,
    firstPage,
    lastPage,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
  }
}
