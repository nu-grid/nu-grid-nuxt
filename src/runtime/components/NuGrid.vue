<script setup lang="ts" generic="T extends TableData">
import type { TableData, TableSlots } from '@nuxt/ui'
import type {
  Cell,
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingInfoState,
  ColumnSizingState,
  ExpandedState,
  GroupingState,
  PaginationState,
  Row,
  RowPinningState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
import type { Primitive } from 'reka-ui'

import type { NuGridStateSnapshot } from '../composables/_internal/useNuGridStatePersistence'

import type {
  NuGridAddRowState,
  NuGridCellClickEvent,
  NuGridCellEditingCancelledEvent,
  NuGridCellEditingStartedEvent,
  NuGridCellValueChangedEvent,
  NuGridEventEmitter,
  NuGridExcelExportOptions,
  NuGridFilterChangedEvent,
  NuGridFocusedCellChangedEvent,
  NuGridFocusedRowChangedEvent,
  NuGridProps,
  NuGridRowClickEvent,
  NuGridSortChangedEvent,
} from '../types'
import type {
  NuGridAddRowContext,
  NuGridCellEditing,
  NuGridEditingCell,
  NuGridFocus,
  NuGridGroupingFns,
} from '../types/_internal'
import type { RowDragEvent } from '../types/drag-drop'
import { computed, nextTick, onMounted, provide, ref, shallowRef, watch } from 'vue'
import {
  useNuGridAddRow,
  useNuGridAnimation,
  useNuGridApi,
  useNuGridAutosize,
  useNuGridCellEditing,
  useNuGridColumnDragDrop,
  useNuGridColumnResize,
  useNuGridColumns,
  useNuGridDataWatch,
  useNuGridFocus,
  useNuGridFocusInit,
  useNuGridFooter,
  useNuGridGrouping,
  useNuGridInteractionRouter,
  useNuGridPaging,
  useNuGridRowDragDrop,
  useNuGridRowInteractions,
  useNuGridScrollbars,
  useNuGridScrollState,
  useNuGridStatePersistence,
  useNuGridTooltipHandler,
  useNuGridUI,
  useNuGridVirtualization,
  useNuGridWheelSmoothing,
} from '../composables/_internal'
import {
  createPagingKeyboardHandler,
  useKeyboardSetup,
} from '../composables/_internal/keyboard-handlers'
import { resolvePagingOptions } from '../composables/_internal/useNuGridPaging'

import { nuGridDefaults, usePropWithDefault } from '../config/_internal'
import { NUGRID_EVENTS_KEY } from '../types/events'

import NuGridBase from './_internal/NuGridBase.vue'
import NuGridGroup from './_internal/NuGridGroup.vue'
import NuGridPaging from './_internal/NuGridPaging.vue'
import NuGridSplitGroup from './_internal/NuGridSplitGroup.vue'
import NuGridTooltip from './_internal/NuGridTooltip.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<NuGridProps<T>>(), {
  watchOptions: () => ({
    deep: true,
  }),
})

const emit = defineEmits<{
  // Existing events
  rowDragged: [event: RowDragEvent<T>]
  cellValueChanged: [event: NuGridCellValueChangedEvent<T>]
  rowSelectionChanged: [event: RowSelectionState]
  stateChanged: [state: NuGridStateSnapshot]
  ready: []
  rowAddRequested: [row: T]
  addRowStateChanged: [state: NuGridAddRowState]
  // New click events
  cellClicked: [event: NuGridCellClickEvent<T>]
  cellDoubleClicked: [event: NuGridCellClickEvent<T>]
  rowClicked: [event: NuGridRowClickEvent<T>]
  rowDoubleClicked: [event: NuGridRowClickEvent<T>]
  // New focus events
  focusedCellChanged: [event: NuGridFocusedCellChangedEvent<T>]
  focusedRowChanged: [event: NuGridFocusedRowChangedEvent<T>]
  // New editing lifecycle events
  cellEditingStarted: [event: NuGridCellEditingStartedEvent<T>]
  cellEditingCancelled: [event: NuGridCellEditingCancelledEvent<T>]
  // New state change events
  sortChanged: [event: NuGridSortChangedEvent]
  filterChanged: [event: NuGridFilterChangedEvent]
}>()

const slots = defineSlots<TableSlots<T>>()

// Centralized event emitter for all grid events
// Created early so it can be passed to composables that need it
const eventEmitter: NuGridEventEmitter<T> = {
  // Click events
  cellClicked: (e) => emit('cellClicked', e),
  cellDoubleClicked: (e) => emit('cellDoubleClicked', e),
  rowClicked: (e) => emit('rowClicked', e),
  rowDoubleClicked: (e) => emit('rowDoubleClicked', e),
  // Focus events
  focusedCellChanged: (e) => emit('focusedCellChanged', e),
  focusedRowChanged: (e) => emit('focusedRowChanged', e),
  // Editing lifecycle events
  cellEditingStarted: (e) => emit('cellEditingStarted', e),
  cellEditingCancelled: (e) => emit('cellEditingCancelled', e),
  cellValueChanged: (e) => emit('cellValueChanged', e),
  // State change events
  sortChanged: (e) => emit('sortChanged', e),
  filterChanged: (e) => emit('filterChanged', e),
  // Migrated existing events
  rowDragged: (e) => emit('rowDragged', e),
  stateChanged: (e) => emit('stateChanged', e),
}

const hasRowSlot = computed(() => !!(slots as any).row)

const data = ref(props.data ?? []) as Ref<T[]>

const propsColumns = computed(() => props.columns)

useNuGridDataWatch(props, data)

const rootRef = ref<InstanceType<typeof Primitive>>()
const tableRef = ref<HTMLDivElement | null>(null)

const globalFilterState = defineModel<string>('globalFilter', { default: undefined })
const columnFiltersState = defineModel<ColumnFiltersState>('columnFilters', { default: [] })
const columnOrderState = defineModel<ColumnOrderState>('columnOrder', { default: [] })
const columnVisibilityState = defineModel<VisibilityState>('columnVisibility', { default: {} })
const columnPinningState = defineModel<ColumnPinningState>('columnPinning', { default: {} })
const columnSizingState = defineModel<ColumnSizingState>('columnSizing', { default: {} })
const columnSizingInfoState = defineModel<ColumnSizingInfoState>('columnSizingInfo', {
  default: {},
})
const rowSelectionState = defineModel<RowSelectionState>('rowSelection', { default: {} })
const rowPinningState = defineModel<RowPinningState>('rowPinning', { default: {} })
const sortingState = defineModel<SortingState>('sorting', { default: [] })
const groupingState = defineModel<GroupingState>('grouping', { default: [] })
const expandedState = defineModel<ExpandedState>('expanded', { default: {} })
const paginationState = defineModel<PaginationState>('pagination', { default: {} })
const focusedRowIdState = defineModel<string | null>('focusedRowId', { default: null })

// Initialize pagination state when paging is enabled
const initPaginationState = () => {
  const pagingOptions = resolvePagingOptions(props.paging)
  if (
    pagingOptions.enabled
    && (!paginationState.value.pageSize || paginationState.value.pageSize === 0)
  ) {
    paginationState.value = {
      pageIndex: paginationState.value.pageIndex ?? 0,
      pageSize: pagingOptions.pageSize ?? nuGridDefaults.paging.pageSize,
    }
  }
}
initPaginationState()

// Create row selection mode ref and columns with visibility integration
// Disable selection when row slot is provided (no checkbox column available)
const rowSelectionModeRef = computed(() => (hasRowSlot.value ? false : (props.selection ?? false)))
const actionMenuRef = computed(() => props.actions ?? false)
const { columns } = useNuGridColumns(
  propsColumns,
  data,
  rowSelectionModeRef,
  actionMenuRef,
  columnVisibilityState,
)

const { ui, checkboxTheme } = useNuGridUI(props as any)
const { hasFooter } = useNuGridFooter(columns)

watch(
  rowSelectionState,
  (val) => {
    emit('rowSelectionChanged', val)
  },
  { deep: true },
)

const states = {
  globalFilterState,
  columnFiltersState,
  columnOrderState,
  columnVisibilityState,
  columnPinningState,
  columnSizingState,
  columnSizingInfoState,
  rowSelectionState,
  rowPinningState,
  sortingState,
  groupingState,
  expandedState,
  paginationState,
}

const editingCellRef = ref<NuGridEditingCell | null>(null)
const focusFnsRef = shallowRef<NuGridFocus<T> | null>(null)
const groupingFnsRef = shallowRef<NuGridGroupingFns<T> | null>(null)
const interactionRouter = useNuGridInteractionRouter<T>({ eventEmitter })
let groupingFns: NuGridGroupingFns<T> | null = null

const statePersistence = useNuGridStatePersistence(
  states,
  !!(typeof props.state === 'object' && props.state),
  typeof props.state === 'object' && props.state ? props.state.key : undefined,
  (state) => emit('stateChanged', state),
  eventEmitter,
)

const tableApi = useNuGridApi(props, data, columns, states, rowSelectionModeRef, eventEmitter)

const tableRows = computed(() => tableApi.getRowModel().rows)
// Row interactions
const rowInteractions = useNuGridRowInteractions(props)

// Add new row (cellEditingFns will be set after it's created)
const cellEditingFnsRef = shallowRef<NuGridCellEditing<T> | null>(null)
const {
  showAddNewRow,
  addRowPosition,
  addNewText,
  refreshAddRows,
  isAddRowRow,
  orderedRows,
  getGroupAddRow,
  finalizeAddRow,
  resetAddRow,
  addRowState,
  isFinalizing: addRowIsFinalizing,
  finalizingRowId: addRowFinalizingRowId,
} = useNuGridAddRow({
  props,
  data,
  table: tableApi,
  rows: tableRows,
  columns,
  groupingState,
  editingCell: editingCellRef,
  focusFns: focusFnsRef,
  cellEditingFns: cellEditingFnsRef,
  groupingFns: groupingFnsRef,
  interactionRouter,
  onAddRowStateChange: (state) => emit('addRowStateChanged', state),
  onAddRowRequested: (row) => {
    const nextRow = { ...(row as any) }
    emit('rowAddRequested', nextRow)
    return { success: true, row: nextRow }
  },
})

watch(
  [() => props.addNewRow, groupingState, () => props.data],
  () => {
    refreshAddRows()
  },
  { deep: true, immediate: true },
)

const rows = orderedRows

// Sticky headers
const stickyEnabled = computed(() => props.layout?.stickyHeaders ?? false)

// Resize mode for column sizing behavior
const resizeMode = computed(() => props.layout?.resizeMode ?? 'shift')

const {
  virtualizer,
  virtualizationEnabled,
  virtualRowItems,
  activeStickyHeight: baseStickyHeight,
  measuredVirtualSizes,
  getVirtualItemHeight,
  stickyOffsets,
} = useNuGridVirtualization({
  props: () => props,
  rows,
  tableApi,
  rootRef,
  stickyEnabled,
  hasFooter,
})

// Column resize
const {
  handleResizeStart,
  handleGroupResizeStart,
  resizingGroupId,
  resizingColumnId,
  manuallyResizedColumns,
} = useNuGridColumnResize(props, tableApi, tableRef)

// Column drag and drop
const dragFns = useNuGridColumnDragDrop(tableApi, states.columnOrderState, tableRef)

// Row drag and drop
const rowDragOptions = computed(() => props.rowDragOptions || { enabled: false })

const rowDragFns = useNuGridRowDragDrop(
  tableApi,
  data,
  rowDragOptions,
  tableRef,
  (event: string, payload: any) => {
    if (event === 'rowDragged') {
      emit('rowDragged', payload)
    }
  },
  eventEmitter,
)

// Group-aware rows for focus navigation (only used when gridMode is 'group' or 'splitgroup')
// Force synchronous evaluation of props.layout.mode to ensure proper initialization timing
const gridMode = props.layout?.mode ?? 'div'
groupingFns =
  gridMode === 'group' || gridMode === 'splitgroup'
    ? useNuGridGrouping(props, tableApi, rootRef, stickyEnabled, gridMode, {
        addRowPosition,
        isAddRowRow,
        getAddRowForGroup: getGroupAddRow,
      })
    : null
groupingFnsRef.value = groupingFns

// Cell/row focus navigation
const focusFns = useNuGridFocus(
  props,
  tableApi,
  rows,
  groupingFns?.navigableRows,
  tableRef,
  rootRef,
  groupingFns?.activeStickyHeight ?? baseStickyHeight,
  groupingFns?.virtualizer ?? virtualizer ?? false,
  editingCellRef,
  interactionRouter,
  eventEmitter,
  focusedRowIdState,
)
focusFnsRef.value = focusFns

// Cell editing
const cellEditingFns = useNuGridCellEditing(
  props,
  tableApi,
  data,
  rows,
  tableRef,
  rootRef,
  focusFns,
  interactionRouter,
  (payload) => emit('cellValueChanged', payload),
  groupingFns?.navigableRows,
  editingCellRef,
  {
    showAddNewRow,
    addRowPosition,
    addRowState,
    addNewText,
    isAddRowRow,
    finalizeAddRow,
    resetAddRow,
  },
)
cellEditingFnsRef.value = cellEditingFns

// Row slot guards: force row focus mode and disable editing when row slot is provided
const effectiveFocusMode = computed(() => {
  const mode = usePropWithDefault(props, 'focus', 'mode').value
  // Cell focus doesn't make sense when row slot replaces cell content
  if (hasRowSlot.value && mode === 'cell') return 'row'
  return mode
})
const effectiveEditingEnabled = computed(() => {
  // Editing doesn't make sense when row slot replaces cell content
  if (hasRowSlot.value) return false
  return usePropWithDefault(props, 'editing', 'enabled').value
})

// Keyboard handling - set up config and register handlers
useKeyboardSetup<T>({
  interactionRouter,
  focusFns,
  cellEditingFns,
  tableApi,
  resolvedRows: computed(() => groupingFns?.navigableRows?.value ?? rows.value),
  rootRef,
  focusModeRef: effectiveFocusMode,
  retainFocusRef: usePropWithDefault(props, 'focus', 'retain'),
  editingEnabledRef: effectiveEditingEnabled,
  startKeysRef: usePropWithDefault(props, 'editing', 'startKeys'),
  cellTypes: props.cellTypes ? computed(() => props.cellTypes) : undefined,
  data,
  emitCellValueChanged: (payload) => emit('cellValueChanged', payload),
})

// Autosize
const autosizeFns = useNuGridAutosize(props, tableApi, tableRef)

// Performance optimization: Cache frequently accessed TanStack Table API results
// These computed properties prevent redundant API calls in templates
// Column visibility changes via row selection hidden property will trigger reactivity through columnVisibilityState
const headerGroups = computed(() => tableApi.getHeaderGroups())
const headerGroupsLength = computed(() => headerGroups.value.length)
const footerGroups = computed(() => tableApi.getFooterGroups())
const allLeafColumns = computed(() => tableApi.getAllLeafColumns())

// Performance optimization #1: Cache visible cells for each row
// This prevents multiple calls to row.getVisibleCells() during rendering
const visibleCellsCache = computed(() => {
  const cache = new Map<string, Cell<T, unknown>[]>()
  rows.value.forEach((row) => {
    cache.set(row.id, row.getVisibleCells() as Cell<T, unknown>[])
  })
  return cache
})

// Helper function to get visible cells from cache (fallback to direct call)
function getVisibleCells(row: Row<T>): Cell<T, unknown>[] {
  return visibleCellsCache.value.get(row.id) ?? (row.getVisibleCells() as Cell<T, unknown>[])
}

// Helper function to determine if cells should have borders for focus outline
function shouldHaveBorder(row: Row<T>, cellIndex: number, side: 'left' | 'right'): boolean {
  const cells = getVisibleCells(row)
  const cell = cells[cellIndex]
  const pinPosition = side
  const isFirst = side === 'left'

  // Check if cell is pinned to this side
  if (cell?.column.getIsPinned() === pinPosition) {
    // For left: find first pinned cell; for right: find last pinned cell
    if (isFirst) {
      return cells.findIndex((c) => c.column.getIsPinned() === pinPosition) === cellIndex
    } else {
      for (let i = cells.length - 1; i >= 0; i--) {
        if (cells[i]?.column.getIsPinned() === pinPosition) {
          return i === cellIndex
        }
      }
    }
  }

  // If no pinned columns exist on this side, first/last visible cell gets border
  const hasPinned = cells.some((c) => c.column.getIsPinned() === pinPosition)
  return !hasPinned && (isFirst ? cellIndex === 0 : cellIndex === cells.length - 1)
}

// Scrollbar styling - centralized here to avoid duplication in child components
const rootElement = computed(() => rootRef.value?.$el as HTMLElement | null)
const scrollbarTheme = computed(() => props.ui?.scrollbar ?? ui.value.scrollbar?.())
const { scrollbarClass, scrollbarThemeClass, scrollbarAttr } = useNuGridScrollbars({
  props,
  containerRef: rootElement,
  themeClass: scrollbarTheme,
})

// Scroll state tracking for LazyCell components
const scrollState = useNuGridScrollState({
  containerRef: rootElement,
  settleDelay: 150,
})

// Smooth out bursty mouse-wheel scrolling to reduce scroll handler churn
// Separate velocity caps for touchpad (faster, smoother) vs mouse wheel
useNuGridWheelSmoothing(rootElement, {
  threshold: 2,
  maxVelocityPxPerSec: 6000, // Mouse wheel cap
  maxVelocityPxPerSecTouchpad: 9000, // Touchpad cap (higher for smoother feel)
  touchpadDeltaThreshold: 20, // Deltas < 20px = touchpad, >= 20px = mouse wheel
  smoothingFactor: 0.35,
})

// Set grid root for interaction router hover events
watch(
  rootElement,
  (el) => {
    interactionRouter.setGridRoot(el)
  },
  { immediate: true },
)

// Register tooltip handler with the interaction router
useNuGridTooltipHandler(props, interactionRouter, {
  tableApi: computed(() => tableApi),
  columns: propsColumns,
})

// Split contexts - feature-based injection points
provide('nugrid-core', {
  tableRef,
  rootRef,
  tableApi,
  ui,
  propsUi: computed(() => props.ui),
  hasFooter,
  rows,
  rowSlot: (slots as any).row,
})

provide('nugrid-drag', {
  dragFns,
  rowDragFns,
  rowDragOptions,
})

provide('nugrid-focus', {
  focusFns,
  cellEditingFns,
})

provide('nugrid-resize', {
  handleResizeStart,
  handleGroupResizeStart,
  resizingGroupId,
  resizingColumnId,
  manuallyResizedColumns,
})

provide('nugrid-virtualization', {
  virtualizer,
  virtualizationEnabled,
  virtualRowItems,
  measuredVirtualSizes,
  getVirtualItemHeight,
  stickyOffsets,
  stickyEnabled,
})

provide('nugrid-grouping', {
  groupingFns,
})

provide('nugrid-performance', {
  headerGroups,
  headerGroupsLength,
  footerGroups,
  allLeafColumns,
  getVisibleCells,
  shouldHaveBorder,
})

provide('nugrid-ui-config', {
  sortIcons: computed(() => props.columnDefaults?.sortIcons),
  scrollbarClass,
  scrollbarThemeClass,
  scrollbarAttr,
  getColumnMenuItems: computed(() => props.columnDefaults?.menu?.items),
  showColumnVisibility: computed(() => props.columnDefaults?.menu?.visibilityToggle ?? true),
  columnMenuButton: computed(() => props.columnDefaults?.menu?.button),
  wrapText: computed(() => props.columnDefaults?.wrapText ?? false),
  checkboxTheme,
  autoSizeMode: autosizeFns.autoSizeMode,
  resizeMode,
})

provide('nugrid-validation', {
  // Expose validation error display settings so editors can inject without prop wiring
  showErrors: computed(() => cellEditingFns.showValidationErrors.value),
  icon: computed(() => cellEditingFns.validationIcon.value),
})

provide('nugrid-row-interactions', {
  rowInteractions,
  rowSelectionMode: rowSelectionModeRef,
})

provide('nugrid-interaction-router', {
  interactionRouter,
})

// Provide cell slots for NuGridCellContent to use
// Filter slots to only include those ending with '-cell'
const cellSlots = Object.fromEntries(
  Object.entries(slots).filter(([name]) => name.endsWith('-cell')),
)
provide('nugrid-cell-slots', cellSlots)

// Provide the centralized event emitter (created earlier so composables can use it)
provide(NUGRID_EVENTS_KEY, eventEmitter)

provide('nugrid-multi-row', {
  enabled: computed(() => {
    if (props.multiRow === false) return false
    return props.multiRow?.enabled ?? false
  }),
  rowCount: computed(() => {
    if (props.multiRow === false) return 1
    return props.multiRow?.rowCount ?? 1
  }),
  alignColumns: computed(() => {
    if (props.multiRow === false) return false
    return props.multiRow?.alignColumns ?? false
  }),
  row0Columns: computed(() => {
    // Get all visible columns that belong to row 0
    const allColumns = tableApi.getAllLeafColumns().filter((col) => col.getIsVisible())
    return allColumns
      .filter((col) => (col.columnDef.row ?? 0) === 0)
      .map((col) => ({
        id: col.id,
        width: col.getSize(),
        minWidth: col.columnDef.minSize ?? 50,
        pinned: col.getIsPinned() || false,
        column: col,
      }))
  }),
})

const addRowContext: NuGridAddRowContext<T> = {
  showAddNewRow,
  addRowPosition,
  addRowState,
  addNewText,
  indicatorSlot: slots['add-row-indicator'] as NuGridAddRowContext<T>['indicatorSlot'],
  isAddRowRow,
  finalizeAddRow,
  resetAddRow,
  isFinalizing: addRowIsFinalizing,
  finalizingRowId: addRowFinalizingRowId,
}

provide('nugrid-add-row', addRowContext)

// Animation (handles both config and row animation execution)
// Watch `rows` (sorted/filtered output) not `data` (raw input) so sorting triggers animation
const animationContext = useNuGridAnimation(props, {
  rootRef: rootElement,
  rows,
  animationClass: computed(() => ui.value.rowAnimation()),
})
provide('nugrid-animation', animationContext)

// Paging
const pagingContext = useNuGridPaging({
  props,
  tableApi,
  rootRef: rootElement,
})
provide('nugrid-paging', pagingContext)

// Register paging keyboard handler
const pagingKeyboardHandler = createPagingKeyboardHandler<T>(pagingContext)
interactionRouter.registerKeyboardHandler(pagingKeyboardHandler)

// Scroll state for LazyCell components
provide('nugrid-scroll-state', {
  ...scrollState,
  containerRef: rootElement,
})

// Initialize focus on first cell when data loads (for keyboard navigation)
useNuGridFocusInit(props, focusFns, groupingFns?.navigableRows ?? rows)

// Emit ready event after grid is fully initialized
onMounted(() => {
  nextTick(() => {
    emit('ready')
  })
})

// Excel export method
// Can be called as: excelExport(), excelExport('filename'), excelExport('filename', 'sheetName'), or excelExport(options)
const excelExport = async (
  filenameOrOptions?: string | NuGridExcelExportOptions,
  sheetName?: string,
): Promise<void> => {
  // Build options from arguments
  const options: NuGridExcelExportOptions =
    typeof filenameOrOptions === 'string'
      ? { filename: filenameOrOptions, ...(sheetName ? { sheetName } : {}) }
      : (filenameOrOptions ?? {})

  const isGrouped = tableApi.getState().grouping?.length > 0
  const columnsToExport = props.columns ?? []

  // Dynamic import to avoid SSR issues with write-excel-file
  const { exportGroupedToExcel, exportToExcel } = await import('../utils/excelExport')

  if (isGrouped) {
    await exportGroupedToExcel(tableApi, columnsToExport, options)
  } else {
    await exportToExcel(tableApi, columnsToExport, options)
  }
}

/**
 * Get the original data objects of all selected rows
 */
function getSelectedRows<TRow = T>(): TRow[] {
  if (!tableApi) return []
  return tableApi.getSelectedRowModel().rows.map((row) => row.original as unknown as TRow)
}

// Column pinning helper methods
const pinColumn = (columnId: string, side: 'left' | 'right') => {
  const currentPinning = tableApi.getState().columnPinning
  const newPinning = { ...currentPinning }

  // Remove from opposite side if present
  const oppositeSide = side === 'left' ? 'right' : 'left'
  if (newPinning[oppositeSide]) {
    newPinning[oppositeSide] = newPinning[oppositeSide].filter((id) => id !== columnId)
  }

  // Add to the desired side if not already there
  if (!newPinning[side]) {
    newPinning[side] = []
  }
  if (!newPinning[side].includes(columnId)) {
    newPinning[side] = [...newPinning[side], columnId]
  }

  tableApi.setColumnPinning(newPinning)
}

const unpinColumn = (columnId: string) => {
  const currentPinning = tableApi.getState().columnPinning
  const newPinning = {
    left: currentPinning.left?.filter((id) => id !== columnId) || [],
    right: currentPinning.right?.filter((id) => id !== columnId) || [],
  }

  tableApi.setColumnPinning(newPinning)
}

const isPinned = (columnId: string): 'left' | 'right' | false => {
  const pinning = tableApi.getState().columnPinning
  if (pinning.left?.includes(columnId)) return 'left'
  if (pinning.right?.includes(columnId)) return 'right'
  return false
}

const getPinnedColumns = () => {
  const pinning = tableApi.getState().columnPinning
  return {
    left: pinning.left || [],
    right: pinning.right || [],
  }
}

defineExpose({
  get $el() {
    return rootRef.value?.$el
  },
  tableRef,
  tableApi,
  autoSizeColumns: autosizeFns.autoSizeColumns,
  autoSizeColumn: autosizeFns.autoSizeColumn,
  autosizeReady: autosizeFns.autosizeReady,
  getState: statePersistence.getState,
  setState: statePersistence.setState,
  addRowState,
  excelExport,
  getSelectedRows,
  // Paging methods
  pagingGoToPage: (page: number) => pagingContext.setPageIndex(page),
  pagingGetCurrentPage: () => pagingContext.pageIndex.value,
  pagingGetPageSize: () => pagingContext.pageSize.value,
  pagingGetTotalPages: () => pagingContext.totalPages.value,
  // Column pinning methods
  pinColumn,
  unpinColumn,
  isPinned,
  getPinnedColumns,
  // Focus methods
  focusRowById: focusFns.focusRowById,
})

const childGrid = computed(() => {
  if (gridMode === 'splitgroup') return NuGridSplitGroup
  if (gridMode === 'group') return NuGridGroup
  return NuGridBase
})
</script>

<template>
  <div class="nugrid-wrapper flex flex-col h-full w-full">
    <div class="nugrid-grid-container grow shrink min-h-0">
      <component :is="childGrid">
        <template v-for="(_, name) in $slots" #[name]="slotProps" :key="name">
          <slot :name="name" v-bind="slotProps as any" />
        </template>
      </component>
    </div>
    <!-- Paging panel (outside scrolling area) -->
    <NuGridPaging v-if="pagingContext.showPanel.value" class="shrink-0" />
  </div>
  <!-- Single shared tooltip instance for all cells -->
  <NuGridTooltip />
</template>

<style>
/* Global cursor styles during resize/drag operations */
body.is-resizing-column {
  cursor: col-resize !important;
  user-select: none !important;
}

body.is-resizing-column * {
  cursor: col-resize !important;
  user-select: none !important;
}

/* Ensure cursor is visible - use a dark cursor for light backgrounds */
body.is-resizing-column {
  cursor:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23000000' d='M11 2v20h2V2h-2zm-2 4H5v12h4V6zm10 0h-4v12h4V6z'/%3E%3C/svg%3E")
      12 12,
    col-resize !important;
}

@media (prefers-color-scheme: dark) {
  body.is-resizing-column {
    cursor:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M11 2v20h2V2h-2zm-2 4H5v12h4V6zm10 0h-4v12h4V6z'/%3E%3C/svg%3E")
        12 12,
      col-resize !important;
  }
}

body.is-dragging-column {
  cursor: move !important;
  user-select: none !important;
}

body.is-dragging-column-outside,
body.is-dragging-row-outside {
  cursor: no-drop !important;
  user-select: none !important;
}

body.is-dragging-row {
  cursor: grabbing !important;
  user-select: none !important;
}

/* Visual indicators when dragging outside table (no-drop zone) */
body.is-dragging-column-outside div[data-dragging='true'],
body.is-dragging-row-outside [data-tbody] > div[data-dragging='true'] {
  opacity: 0.3;
  background-color: rgba(239, 68, 68, 0.2);
  outline: 2px dashed rgba(239, 68, 68, 0.6);
  outline-offset: -2px;
  cursor: no-drop !important;
}
</style>
