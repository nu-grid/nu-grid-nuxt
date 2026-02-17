import type { TableData } from '@nuxt/ui'
import type { Column, Row, Table } from '@tanstack/vue-table'
import type { Primitive } from 'reka-ui'
import type { Ref } from 'vue'
import type { NuGridEventEmitter, NuGridProps, NuGridRowSelectOptions } from '../../types'
import type {
  NuGridEditingCell,
  NuGridFocus,
  NuGridFocusedCell,
  NuGridInteractionRouter,
  NuGridVirtualizer,
} from '../../types/_internal'
import { useElementSize } from '@vueuse/core'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { usePropWithDefault } from '../../config/_internal'
import { useNuGridKeyboardNavigation } from './useNuGridKeyboardNavigation'
import { useNuGridScroll } from './useNuGridScroll'

/**
 * Cell and row focus management with keyboard navigation
 */
export function useNuGridFocus<T extends TableData>(
  props: NuGridProps<T>,
  tableApi: Table<T>,
  rows: Ref<Row<T>[]>,
  navigableRows: Ref<Row<T>[]> | null | undefined,
  tableRef: Ref<HTMLDivElement | null>,
  rootRef: Ref<InstanceType<typeof Primitive> | null | undefined> | null,
  virtualizedStickyHeight?: Ref<number>,
  virtualizer?: Ref<NuGridVirtualizer> | false,
  editingCell?: Ref<NuGridEditingCell | null>,
  interactionRouter?: NuGridInteractionRouter<T>,
  eventEmitter?: NuGridEventEmitter<T>,
  focusedRowIdModel?: Ref<string | null>,
): NuGridFocus<T> {
  // Extract values from grouped props using helpers (defaults from nuGridDefaults)
  const focusMode = usePropWithDefault(props, 'focus', 'mode')
  const cmdArrows = usePropWithDefault(props, 'focus', 'cmdArrows')
  const alignOnModel = usePropWithDefault(props, 'focus', 'alignOnModel')
  const maintainFocusOnFilter = usePropWithDefault(props, 'focus', 'maintainFocusOnFilter')
  const enableEditing = usePropWithDefault(props, 'editing', 'enabled')
  const rowSelectionMode = computed(() => props.rowSelection ?? false)

  const focusedCell = ref<NuGridFocusedCell | null>(null)
  const gridHasFocus = ref(false)
  let pointerDownInsideGrid = false

  // Flags to prevent infinite sync loops between internal focus and external model
  let isUpdatingFromModel = false
  let isUpdatingToModel = false

  // Resolved rows - prefer navigableRows if available (for grouped grids)
  const resolvedRows = computed(() => navigableRows?.value ?? rows.value)

  /**
   * Helper to update focused cell and emit focus events
   */
  function setFocusedCell(
    newValue: NuGridFocusedCell | null,
    options?: { suppressEvents?: boolean },
  ) {
    const oldValue = focusedCell.value
    focusedCell.value = newValue

    // Sync focused row ID to external model if not already updating from model
    if (focusedRowIdModel && !isUpdatingFromModel) {
      const currentRows = resolvedRows.value
      const newRowIndex = newValue?.rowIndex ?? null
      const row =
        newRowIndex !== null && newRowIndex >= 0 ? (currentRows[newRowIndex] ?? null) : null
      const newRowId = row?.id ?? null

      if (focusedRowIdModel.value !== newRowId) {
        isUpdatingToModel = true
        focusedRowIdModel.value = newRowId
        // Keep the guard true until watchers have flushed
        nextTick(() => {
          isUpdatingToModel = false
        })
      }
    }

    // Skip event emission if requested (e.g., during initialization)
    if (options?.suppressEvents) return

    const oldRowIndex = oldValue?.rowIndex ?? null
    const newRowIndex = newValue?.rowIndex ?? null
    const oldColumnIndex = oldValue?.columnIndex ?? null
    const newColumnIndex = newValue?.columnIndex ?? null

    // Emit focusedCellChanged when cell position changes
    // Check handler exists first to avoid computing payload when no listeners attached
    if (
      eventEmitter?.focusedCellChanged
      && (oldRowIndex !== newRowIndex || oldColumnIndex !== newColumnIndex)
    ) {
      const currentRows = resolvedRows.value
      const columns = tableApi.getAllLeafColumns()
      const row =
        newRowIndex !== null && newRowIndex >= 0 ? (currentRows[newRowIndex] ?? null) : null
      const column: Column<T, unknown> | null =
        newColumnIndex !== null && newColumnIndex >= 0 ? (columns[newColumnIndex] ?? null) : null

      eventEmitter.focusedCellChanged({
        rowId: row?.id ?? null,
        columnId: column?.id ?? null,
        rowIndex: newRowIndex ?? -1,
        columnIndex: newColumnIndex ?? -1,
        row,
        column,
        previousRowIndex: oldRowIndex,
        previousColumnIndex: oldColumnIndex,
      })
    }

    // Emit focusedRowChanged only when row changes
    // Check handler exists first to avoid computing payload when no listeners attached
    if (eventEmitter?.focusedRowChanged && oldRowIndex !== newRowIndex) {
      const currentRows = resolvedRows.value
      const row =
        newRowIndex !== null && newRowIndex >= 0 ? (currentRows[newRowIndex] ?? null) : null
      const previousRow =
        oldRowIndex !== null && oldRowIndex >= 0 ? (currentRows[oldRowIndex] ?? null) : null

      eventEmitter.focusedRowChanged({
        rowId: row?.id ?? null,
        rowIndex: newRowIndex ?? -1,
        row,
        previousRowIndex: oldRowIndex,
        previousRow,
      })
    }
  }

  const cellSelector = '[data-row-id="$ID"] [data-cell-index="$COL"]'
  const rowSelector = '[data-row-id="$ID"]'

  const rowHeightEstimate = ref(80)
  const containerHeight = ref(0)
  let unregisterInteraction: (() => void) | null = null
  // Lightweight DOM caches so repeated focus changes do not pay for fresh querySelector calls
  const rowElementCache = new Map<string, HTMLElement>()
  const cellElementCache = new Map<string, Map<number, HTMLElement>>()

  // Short-lived processing lock to prevent key-repeat serialization
  let processingTimer: ReturnType<typeof setTimeout> | null = null

  function clearElementCaches() {
    rowElementCache.clear()
    cellElementCache.clear()
  }

  const rootElement = computed<HTMLElement | null>(() => {
    if (!rootRef?.value) {
      return null
    }
    return (rootRef.value.$el as HTMLElement) ?? null
  })

  // Use shared scrolling utility with performance optimizations
  // Pass rootRef so scroll composable can detect actual scroll containers
  // Must be called early since scroll containers are used by viewportRowsPerPage and observedHeight watch
  const {
    scrollManager,
    visibleColumns,
    verticalScrollContainer,
    horizontalScrollContainer,
    updateScrollContainerCache,
  } = useNuGridScroll(tableApi, rootRef)

  const { height: observedHeight } = useElementSize(rootElement, undefined, { box: 'border-box' })

  watch(observedHeight, (height) => {
    if (typeof height === 'number' && !Number.isNaN(height)) {
      containerHeight.value = height
      // Invalidate scroll container cache on resize - overflow state may have changed
      updateScrollContainerCache()
    }
  })

  const resolveStickyHeight = (tableElement?: HTMLElement | null) => {
    const virtualHeight = virtualizedStickyHeight?.value
    if (typeof virtualHeight === 'number' && virtualHeight > 0) {
      return virtualHeight
    }

    const targetTable = tableElement ?? tableRef.value
    if (!targetTable) {
      return 0
    }

    return scrollManager.getStickyHeaderHeight(targetTable)
  }

  const viewportRowsPerPage = computed(() => {
    const estimatedHeight = Math.max(rowHeightEstimate.value, 1)
    // Account for sticky header height to get accurate visible rows count
    const stickyHeight = resolveStickyHeight()

    // Use the vertical scroll container's clientHeight for accurate visible area calculation
    // This is important when NuGrid is placed inside a smaller scrollable container
    const vScrollContainer = verticalScrollContainer.value
    const effectiveHeight = vScrollContainer?.clientHeight ?? containerHeight.value

    if (effectiveHeight > 0) {
      const visibleHeight = Math.max(0, effectiveHeight - stickyHeight)
      return Math.max(1, Math.round(visibleHeight / estimatedHeight))
    }

    // Fallback when the container has not been measured yet
    return Math.max(1, Math.round(600 / estimatedHeight))
  })

  if (virtualizer) {
    watch(
      () => virtualizer.value?.props.value.estimateSize,
      (estimate) => {
        if (typeof estimate === 'number' && estimate > 0) {
          rowHeightEstimate.value = estimate
        }
      },
      { immediate: true },
    )
  }

  // Track all physical rows (including add-row placeholders) for focus metadata
  const allRows = computed(() => rows.value)

  // Processing lock functions - must be after scrollManager is created
  function startProcessingLock(duration = 200) {
    scrollManager.setProcessing(true)
    if (processingTimer) clearTimeout(processingTimer)
    processingTimer = setTimeout(() => {
      scrollManager.setProcessing(false)
      processingTimer = null
    }, duration)
  }

  function stopProcessingLock() {
    if (processingTimer) {
      clearTimeout(processingTimer)
      processingTimer = null
    }
    scrollManager.setProcessing(false)
  }

  // Use shared keyboard navigation for multi-row support
  const keyboardNav = useNuGridKeyboardNavigation(props, tableApi)
  const {
    multiRowEnabled,
    multiRowCount,
    getVisualRowForColumn,
    getColumnsInVisualRow,
    findColumnInVisualRow,
  } = keyboardNav

  function isWithinAriaHidden(element: HTMLElement): boolean {
    return Boolean(element.closest('[aria-hidden="true"]'))
  }

  // Watch for aria-hidden changes on #__nuxt to handle overlay focus management
  let ariaHiddenObserver: MutationObserver | null = null

  onMounted(() => {
    const nuxtEl = document.getElementById('__nuxt')
    if (nuxtEl && typeof MutationObserver !== 'undefined') {
      ariaHiddenObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
            const isHidden = nuxtEl.getAttribute('aria-hidden') === 'true'
            if (isHidden && document.activeElement) {
              // Blur any focused element when main content is hidden from screen readers
              const activeEl = document.activeElement as HTMLElement
              if (activeEl && typeof activeEl.blur === 'function') {
                activeEl.blur()
              }
            }
          }
        }
      })

      ariaHiddenObserver.observe(nuxtEl, {
        attributes: true,
        attributeFilter: ['aria-hidden'],
      })
    }
  })

  onUnmounted(() => {
    if (ariaHiddenObserver) {
      ariaHiddenObserver.disconnect()
      ariaHiddenObserver = null
    }

    if (unregisterInteraction) {
      unregisterInteraction()
      unregisterInteraction = null
    }

    gridHasFocus.value = false
    clearElementCaches()
  })

  watch(
    () => tableRef.value,
    () => {
      clearElementCaches()
    },
  )

  function getRootElement(): HTMLElement | null {
    return rootElement.value
  }

  function handleRootFocusIn(event: FocusEvent) {
    if (pointerDownInsideGrid) {
      return
    }
    // Only set gridHasFocus when focus enters a cell or row, not header elements
    const target = event.target as Element | null
    if (isGridCellOrRow(target)) {
      gridHasFocus.value = true
    }
  }

  /**
   * Check if an element is a focusable grid cell or row
   * Cells have data-cell-index, rows have data-row-id
   */
  function isGridCellOrRow(element: Element | null): boolean {
    if (!element) return false
    // Check if the element is a cell (has data-cell-index)
    if (element.closest('[data-cell-index]') !== null) {
      return true
    }
    // Check if the element is a row (has data-row-id)
    // Rows with any tabindex value can receive focus
    if (element.closest('[data-row-id]') !== null) {
      return true
    }
    return false
  }

  function handleRootFocusOut(event: FocusEvent) {
    // Don't clear focus during a pointer interaction (prevents flash when clicking between cells)
    if (pointerDownInsideGrid) {
      return
    }

    const rootEl = getRootElement()
    if (!rootEl) {
      gridHasFocus.value = false
      return
    }

    const nextTarget = event.relatedTarget as Element | null

    // If focus moves outside the grid entirely, clear gridHasFocus
    if (!nextTarget || !rootEl.contains(nextTarget)) {
      // Delay clearing gridHasFocus to allow click events to land first
      // This prevents flash when clicking between cells (focusout fires before click)
      requestAnimationFrame(() => {
        // Re-check if we're still outside after the frame
        if (!pointerDownInsideGrid && !rootEl.contains(document.activeElement)) {
          gridHasFocus.value = false
        }
      })
      return
    }

    // Focus moved to something inside the grid - check if it's a cell or row
    // If focus moved to a non-cell element (like header buttons), clear gridHasFocus
    // so cells show "unfocused" styling while header elements have focus
    if (!isGridCellOrRow(nextTarget)) {
      gridHasFocus.value = false
    }
  }

  function handlePointerDownInside() {
    pointerDownInsideGrid = true
  }

  function handlePointerUpOutside() {
    pointerDownInsideGrid = false
  }

  watch(
    () => rootRef?.value,
    (primitive, _, onCleanup) => {
      const rootEl = primitive?.$el as HTMLElement | undefined
      if (!rootEl) {
        gridHasFocus.value = false
        return
      }

      rootEl.addEventListener('focusin', handleRootFocusIn)
      rootEl.addEventListener('focusout', handleRootFocusOut)
      // Use capture phase so pointerdown fires before focusout during click transitions
      rootEl.addEventListener('pointerdown', handlePointerDownInside, true)

      if (typeof window !== 'undefined') {
        window.addEventListener('pointerup', handlePointerUpOutside)
        window.addEventListener('pointercancel', handlePointerUpOutside)
      }

      onCleanup(() => {
        rootEl.removeEventListener('focusin', handleRootFocusIn)
        rootEl.removeEventListener('focusout', handleRootFocusOut)
        rootEl.removeEventListener('pointerdown', handlePointerDownInside, true)
        if (typeof window !== 'undefined') {
          window.removeEventListener('pointerup', handlePointerUpOutside)
          window.removeEventListener('pointercancel', handlePointerUpOutside)
        }
      })
    },
    { immediate: true },
  )

  // Performance optimization: Create a Map for O(1) row ID to index lookups
  // This eliminates expensive findIndex() calls on every focus operation
  const rowIdToIndexMap = ref<Map<string, number>>(new Map())

  // Track previous rows to resolve focused row ID when the row set changes
  let previousResolvedRows: Row<T>[] | null = null

  // Update the map whenever navigableRows changes
  watch(
    [resolvedRows, allRows],
    ([currentRows, fullRows]) => {
      const map = rowIdToIndexMap.value
      map.clear()

      // In grouped grids, navigableRows contains the actual data rows while rows contains
      // group placeholder rows. We need to use navigableRows for focus navigation.
      // In non-grouped grids with add-row, rows contains data + add-row placeholders,
      // so we prefer fullRows to include add-row placeholders for focus metadata.
      const isGroupedGrid = currentRows !== fullRows
      const sourceRows = isGroupedGrid ? currentRows : fullRows?.length ? fullRows : currentRows

      sourceRows?.forEach((row, arrayIndex) => {
        // Skip group header rows - they shouldn't be in the focus map
        // (Note: in grouped grids, navigableRows already filters these out, but we check for safety)
        if ((row as any).getIsGrouped?.()) {
          return
        }
        // Map data row ID to its array index in visibleRows
        map.set(row.id, arrayIndex)
      })

      for (const rowId of [...rowElementCache.keys()]) {
        if (!map.has(rowId)) {
          rowElementCache.delete(rowId)
        }
      }

      for (const rowId of [...cellElementCache.keys()]) {
        if (!map.has(rowId)) {
          cellElementCache.delete(rowId)
        }
      }

      // When the row set changes (e.g., filter applied/cleared), re-resolve and scroll
      // to the focused row so it stays visible at its new index position
      if (maintainFocusOnFilter.value && focusedCell.value) {
        // Find the currently focused row's ID from the old index
        const oldIndex = focusedCell.value.rowIndex
        const oldRows = previousResolvedRows
        const focusedRowId = oldRows?.[oldIndex]?.id ?? focusedRowIdModel?.value
        if (focusedRowId && map.has(focusedRowId)) {
          const newIndex = map.get(focusedRowId)!
          if (newIndex !== oldIndex) {
            // Row index changed - update internal state and scroll after DOM updates
            focusedCell.value = {
              rowIndex: newIndex,
              columnIndex: focusedCell.value.columnIndex,
            }
          }
          nextTick(() => {
            focusRowById(focusedRowId, { align: alignOnModel.value ?? 'nearest' })
          })
        }
      }

      // Track previous rows for the next change
      previousResolvedRows = sourceRows ?? null
    },
    { immediate: true },
  )

  function getRowIndex(row: Row<T>): number {
    const index = rowIdToIndexMap.value.get(row.id)
    return index !== undefined ? index : -1
  }

  function getRowIndexById(rowId: string | null | undefined): number {
    if (!rowId) return -1
    const index = rowIdToIndexMap.value.get(rowId)
    return index !== undefined ? index : -1
  }

  function cacheRowElement(rowId: string, element: HTMLElement | null) {
    if (!element || !element.isConnected) {
      rowElementCache.delete(rowId)
      return
    }
    rowElementCache.set(rowId, element)
  }

  function cacheCellElement(rowId: string, columnIndex: number, element: HTMLElement | null) {
    if (!element || !element.isConnected) {
      const rowMap = cellElementCache.get(rowId)
      if (rowMap) {
        rowMap.delete(columnIndex)
        if (rowMap.size === 0) {
          cellElementCache.delete(rowId)
        }
      }
      return
    }

    let rowMap = cellElementCache.get(rowId)
    if (!rowMap) {
      rowMap = new Map<number, HTMLElement>()
      cellElementCache.set(rowId, rowMap)
    }
    rowMap.set(columnIndex, element)
  }

  function resolveCellSelector(rowId: string, columnIndex: number): string {
    return cellSelector.replace('$COL', String(columnIndex)).replace('$ID', rowId)
  }

  function resolveRowSelector(rowId: string): string {
    return rowSelector.replace('$ID', rowId)
  }

  function getRowElement(rowId: string): HTMLElement | null {
    const cached = rowElementCache.get(rowId)
    if (cached?.isConnected) {
      return cached
    }

    const element = tableRef.value?.querySelector(resolveRowSelector(rowId)) as HTMLElement | null
    cacheRowElement(rowId, element)
    return element
  }

  function getCellElement(rowId: string, columnIndex: number): HTMLElement | null {
    const rowMap = cellElementCache.get(rowId)
    const cached = rowMap?.get(columnIndex)
    if (cached?.isConnected) {
      return cached
    }

    // Optimization: Try to find the row element first, then search within it
    // This is faster than searching the entire table for a specific cell
    const rowElement = getRowElement(rowId)
    if (rowElement) {
      const cellElement = rowElement.querySelector(
        `[data-cell-index="${columnIndex}"]`,
      ) as HTMLElement | null
      cacheCellElement(rowId, columnIndex, cellElement)
      return cellElement
    }

    const element = tableRef.value?.querySelector(
      resolveCellSelector(rowId, columnIndex),
    ) as HTMLElement | null
    cacheCellElement(rowId, columnIndex, element)
    return element
  }

  /**
   * Ensures footers are visible when navigating to the bottom of the table
   * @param scrollContainer - The scrollable container element
   * @param useDoubleRAF - Whether to use double requestAnimationFrame (for async scroll completion)
   */
  function ensureFootersVisible(scrollContainer: HTMLElement, useDoubleRAF = false) {
    const footerGroups = tableApi.getFooterGroups()
    const tableElement = tableRef.value
    if (footerGroups.length === 0 || !tableElement) return

    const checkFooters = () => {
      const footerElements = tableElement.querySelectorAll<HTMLElement>('[class*="tfoot"]')

      if (footerElements.length === 0) {
        // Fallback: scroll to absolute maximum to ensure any content at the bottom is visible
        const absoluteMaxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight
        if (scrollContainer.scrollTop < absoluteMaxScroll - 1) {
          scrollContainer.scrollTop = absoluteMaxScroll
        }
        return
      }

      // Find the last footer element (there might be multiple footer rows)
      const lastFooter = Array.from(footerElements).reduce(
        (latest, footer) => {
          const latestRect = latest?.getBoundingClientRect()
          const footerRect = footer.getBoundingClientRect()
          return !latestRect || footerRect.bottom > latestRect.bottom ? footer : latest
        },
        null as HTMLElement | null,
      )

      if (lastFooter) {
        const containerRect = scrollContainer.getBoundingClientRect()
        const footerRect = lastFooter.getBoundingClientRect()
        const containerBottom = containerRect.bottom
        const footerBottom = footerRect.bottom
        const padding = 15

        // If footer is not fully visible, scroll to show it
        if (footerBottom > containerBottom - padding) {
          const adjustment = footerBottom - containerBottom + padding
          scrollContainer.scrollTop += adjustment
        }
      }
    }

    if (useDoubleRAF) {
      requestAnimationFrame(() => {
        requestAnimationFrame(checkFooters)
      })
    } else {
      requestAnimationFrame(checkFooters)
    }
  }

  /**
   * Scroll to a cell and focus it with proper scroll management
   * Shared helper used by both focus mode and edit mode navigation
   */
  function scrollToCellAndFocus(options: {
    cellElement: HTMLElement
    rowId: string
    rowIndex: number
    columnIndex: number
    behavior?: 'instant' | 'smooth'
    skipHorizontalScroll?: boolean
    verticalOnly?: boolean
    /** If true, scroll to show any non-focusable columns at the left edge */
    isFirstFocusableColumn?: boolean
    /** If true, scroll to show any non-focusable columns at the right edge */
    isLastFocusableColumn?: boolean
    onComplete?: () => void
  }) {
    const {
      cellElement,
      rowId,
      rowIndex,
      columnIndex,
      behavior = 'instant',
      skipHorizontalScroll = false,
      verticalOnly = false,
      isFirstFocusableColumn = false,
      isLastFocusableColumn = false,
      onComplete,
    } = options

    const effectiveScrollContainer = verticalScrollContainer.value
    const effectiveHScrollContainer = horizontalScrollContainer.value
    const tableElement = tableRef.value

    if (!effectiveScrollContainer || !tableElement) {
      onComplete?.()
      return
    }

    // Check if we're focusing on the last row (for footer visibility)
    const resolvedRows = navigableRows?.value ?? rows.value
    const isLastRow = resolvedRows.length > 0 && rowId === resolvedRows[resolvedRows.length - 1]?.id

    // Focus cell first with preventScroll to prevent browser scroll interference
    cellElement.focus({ preventScroll: true })

    // Scroll to make cell visible
    scrollManager
      .scrollToCell({
        cellElement,
        scrollContainer: effectiveScrollContainer,
        horizontalScrollContainer: effectiveHScrollContainer ?? undefined,
        tableElement,
        rowIndex,
        columnIndex,
        virtualizedStickyHeight: resolveStickyHeight(tableElement),
        behavior,
        verticalPadding: 15,
        includeHeadersAbove: false,
        skipHorizontalScroll,
        verticalOnly,
      })
      .then(() => {
        // If we're on the last row, ensure footers are visible
        if (isLastRow) {
          ensureFootersVisible(effectiveScrollContainer)
        }

        // If at the first focusable column, scroll to show non-focusable columns at left edge
        // (similar to how we scroll to show headers when at first row)
        if (isFirstFocusableColumn && effectiveHScrollContainer) {
          scrollManager.scrollToHorizontalEdge(effectiveHScrollContainer, 'start')
        }

        // If at the last focusable column, scroll to show non-focusable columns at right edge
        if (isLastFocusableColumn && effectiveHScrollContainer) {
          scrollManager.scrollToHorizontalEdge(effectiveHScrollContainer, 'end')
        }
      })
      .finally(() => {
        onComplete?.()
      })
  }

  function isColumnFocusable(columnIndex: number, row: Row<T>): boolean {
    const cols = visibleColumns.value
    if (columnIndex < 0 || columnIndex >= cols.length) return false

    const column = cols[columnIndex]
    if (!column) return false
    const columnDef = column.columnDef as any

    // Default to true if enableFocusing is not specified
    if (columnDef.enableFocusing === undefined) return true

    // If it's a function, call it with the row
    if (typeof columnDef.enableFocusing === 'function') {
      return columnDef.enableFocusing(row)
    }

    // Otherwise it's a boolean
    return columnDef.enableFocusing
  }

  function findNextFocusableColumn(startIndex: number, row: Row<T>): number {
    const cols = visibleColumns.value
    for (let i = startIndex + 1; i < cols.length; i++) {
      if (isColumnFocusable(i, row)) return i
    }
    return startIndex
  }

  function findPreviousFocusableColumn(startIndex: number, row: Row<T>): number {
    for (let i = startIndex - 1; i >= 0; i--) {
      if (isColumnFocusable(i, row)) return i
    }
    return startIndex
  }

  function findFirstFocusableColumn(row: Row<T>): number {
    const cols = visibleColumns.value
    for (let i = 0; i < cols.length; i++) {
      if (isColumnFocusable(i, row)) return i
    }
    return 0
  }

  function findLastFocusableColumn(row: Row<T>): number {
    const cols = visibleColumns.value
    for (let i = cols.length - 1; i >= 0; i--) {
      if (isColumnFocusable(i, row)) return i
    }
    return cols.length - 1
  }

  // Find first focusable column within a specific visual row (using shared nav with focusable predicate)
  function findFirstFocusableColumnInVisualRow(visualRow: number, row: Row<T>): number {
    return (
      keyboardNav.findFirstInVisualRow(visualRow, row, isColumnFocusable)
      ?? getColumnsInVisualRow(visualRow)[0]
      ?? 0
    )
  }

  // Find last focusable column within a specific visual row
  function findLastFocusableColumnInVisualRow(visualRow: number, row: Row<T>): number {
    const cols = getColumnsInVisualRow(visualRow)
    return (
      keyboardNav.findLastInVisualRow(visualRow, row, isColumnFocusable)
      ?? cols[cols.length - 1]
      ?? 0
    )
  }

  // Find next focusable column within the same visual row
  function findNextFocusableColumnInVisualRow(
    startIndex: number,
    visualRow: number,
    row: Row<T>,
  ): number | null {
    return keyboardNav.findNextInVisualRow(startIndex, visualRow, row, isColumnFocusable)
  }

  // Find previous focusable column within the same visual row
  function findPreviousFocusableColumnInVisualRow(
    startIndex: number,
    visualRow: number,
    row: Row<T>,
  ): number | null {
    return keyboardNav.findPreviousInVisualRow(startIndex, visualRow, row, isColumnFocusable)
  }

  function onCellClick(e: Event, row: Row<T>, columnIndex: number) {
    const target = e.target as HTMLElement

    // Prevent focus if within an aria-hidden container
    if (isWithinAriaHidden(target)) {
      return
    }

    const isInteractive =
      target.closest('button')
      || target.closest('a')
      || target.closest('input')
      || target.closest('select')
    if (isInteractive) {
      return
    }

    // Check if the column can receive focus
    if (!isColumnFocusable(columnIndex, row)) {
      return
    }

    // Use O(1) Map lookup instead of expensive findIndex
    const rowIndex = getRowIndex(row)
    if (rowIndex === -1) {
      return
    }

    gridHasFocus.value = true
    pointerDownInsideGrid = false
    // Preserve suppressOutline if it's currently set (e.g., during add-row transitions)
    // Read before focusCell to be future-proof in case focusCell ever modifies focusedCell
    const currentSuppressOutline = focusedCell.value?.suppressOutline
    focusCell(row, rowIndex, columnIndex)
    if (focusMode.value === 'cell') {
      setFocusedCell({
        rowIndex,
        columnIndex,
        ...(currentSuppressOutline && { suppressOutline: true }),
      })
    } else if (focusMode.value === 'row') {
      setFocusedCell({
        rowIndex,
        columnIndex: 0,
        ...(currentSuppressOutline && { suppressOutline: true }),
      })
    }
  }

  // Register with the interaction router when provided so focus claims clicks before others
  if (interactionRouter) {
    unregisterInteraction = interactionRouter.registerCellClickHandler({
      id: 'focus',
      priority: 10,
      handle: ({ event, row, cellIndex }) => {
        if (typeof cellIndex !== 'number') return

        // Skip focusing if addrow is being finalized (prevents focusing removed addrow)
        // Check for the finalizing flag set by the pointer handler
        if ((event as any).__addRowFinalizing) {
          return { handled: true, stop: true }
        }

        // Skip focusing if addrow uneditable click handler is handling it
        // This ensures correct focus for grouped addrows when clicking uneditable areas
        if ((event as any).__addRowUneditableClick) {
          return { handled: true, stop: true }
        }

        onCellClick(event, row, cellIndex)
        return { handled: event.defaultPrevented || event.cancelBubble }
      },
    })
  }

  function onCellKeyDown(e: KeyboardEvent) {
    if (focusMode.value === 'none') {
      // In none mode, prevent default behavior for navigation keys to avoid focus indicators
      if (
        [
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'Home',
          'End',
          'PageUp',
          'PageDown',
        ].includes(e.key)
      ) {
        e.preventDefault()
      }
      return
    }

    if (!focusedCell.value) return

    // Throttle navigation to prevent freeze when holding down keys
    // Skip processing if we're already handling a navigation event
    if (
      scrollManager.isProcessingScroll
      && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(e.key)
    ) {
      e.preventDefault()
      return
    }

    const { rowIndex, columnIndex } = focusedCell.value
    const visibleRows = resolvedRows.value
    const pageJump = viewportRowsPerPage.value

    let newRowIndex = rowIndex
    let newColumnIndex = columnIndex
    let isPageScroll = false
    let skipFinalFocus = false
    let isVerticalOnly = false // Track if navigation is purely vertical (ArrowUp/Down without column change)

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        // Cmd+Up or Ctrl+Up behavior depends on cmdArrows setting
        if (e.metaKey || e.ctrlKey) {
          if (cmdArrows.value === 'paging') {
            // Page up behavior
            newRowIndex = Math.max(0, rowIndex - pageJump)
            isPageScroll = true
          } else {
            // Jump to first row in grid (keep same column)
            newRowIndex = 0
          }
        } else if (focusMode.value === 'cell' && multiRowEnabled.value && multiRowCount.value > 1) {
          // Multi-row cell focus mode: navigate between visual rows
          const currentVisualRow = getVisualRowForColumn(columnIndex)
          const currentRow = visibleRows[rowIndex]
          if (currentVisualRow > 0 && currentRow) {
            // Move to previous visual row within same data row
            newColumnIndex = findColumnInVisualRow(columnIndex, currentVisualRow - 1, currentRow)
          } else {
            // At top visual row - move to previous data row's last visual row
            newRowIndex = Math.max(0, rowIndex - 1)
            const targetRow = visibleRows[newRowIndex]
            if (targetRow && newRowIndex !== rowIndex) {
              const lastVisualRow = multiRowCount.value - 1
              newColumnIndex = findColumnInVisualRow(columnIndex, lastVisualRow, targetRow)
            }
          }
        } else {
          newRowIndex = Math.max(0, rowIndex - 1)
          // Simple vertical navigation - column stays same
          isVerticalOnly = true
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        // Cmd+Down or Ctrl+Down behavior depends on cmdArrows setting
        if (e.metaKey || e.ctrlKey) {
          if (cmdArrows.value === 'paging') {
            // Page down behavior
            newRowIndex = Math.min(visibleRows.length - 1, rowIndex + pageJump)
            isPageScroll = true
          } else {
            // Jump to last row in grid (keep same column)
            newRowIndex = visibleRows.length - 1
          }
        } else if (focusMode.value === 'cell' && multiRowEnabled.value && multiRowCount.value > 1) {
          // Multi-row cell focus mode: navigate between visual rows
          const currentVisualRow = getVisualRowForColumn(columnIndex)
          const lastVisualRow = multiRowCount.value - 1
          const currentRow = visibleRows[rowIndex]
          if (currentVisualRow < lastVisualRow && currentRow) {
            // Move to next visual row within same data row
            newColumnIndex = findColumnInVisualRow(columnIndex, currentVisualRow + 1, currentRow)
          } else {
            // At bottom visual row - move to next data row's first visual row
            newRowIndex = Math.min(visibleRows.length - 1, rowIndex + 1)
            const targetRow = visibleRows[newRowIndex]
            if (targetRow && newRowIndex !== rowIndex) {
              newColumnIndex = findColumnInVisualRow(columnIndex, 0, targetRow)
            }
          }
        } else {
          newRowIndex = Math.min(visibleRows.length - 1, rowIndex + 1)
          // Simple vertical navigation - column stays same
          isVerticalOnly = true
        }
        break
      case 'PageUp':
        e.preventDefault()
        newRowIndex = Math.max(0, rowIndex - pageJump)
        isPageScroll = true
        break
      case 'PageDown':
        e.preventDefault()
        newRowIndex = Math.min(visibleRows.length - 1, rowIndex + pageJump)
        isPageScroll = true
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (focusMode.value === 'cell') {
          const targetRow = visibleRows[rowIndex]
          if (targetRow) {
            // Cmd+Left (Mac) or Ctrl+Left jumps to first column
            if (e.metaKey || e.ctrlKey) {
              newColumnIndex = findFirstFocusableColumn(targetRow)
            } else if (multiRowEnabled.value && multiRowCount.value > 1) {
              // Multi-row mode: wrap to previous visual row when at start
              const currentVisualRow = getVisualRowForColumn(columnIndex)
              const prevCol = findPreviousFocusableColumnInVisualRow(
                columnIndex,
                currentVisualRow,
                targetRow,
              )
              if (prevCol !== null) {
                newColumnIndex = prevCol
              } else if (currentVisualRow > 0) {
                // Move to last column of previous visual row
                newColumnIndex = findLastFocusableColumnInVisualRow(currentVisualRow - 1, targetRow)
              } else {
                // At first visual row - move to previous data row's last visual row
                if (rowIndex > 0) {
                  newRowIndex = rowIndex - 1
                  const prevDataRow = visibleRows[newRowIndex]
                  if (prevDataRow) {
                    const lastVisualRow = multiRowCount.value - 1
                    newColumnIndex = findLastFocusableColumnInVisualRow(lastVisualRow, prevDataRow)
                  }
                }
              }
            } else {
              newColumnIndex = findPreviousFocusableColumn(columnIndex, targetRow)
            }
          }
        }
        break
      case 'ArrowRight':
        e.preventDefault()
        if (focusMode.value === 'cell') {
          const targetRow = visibleRows[rowIndex]
          if (targetRow) {
            // Cmd+Right (Mac) or Ctrl+Right jumps to last column
            if (e.metaKey || e.ctrlKey) {
              newColumnIndex = findLastFocusableColumn(targetRow)
            } else if (multiRowEnabled.value && multiRowCount.value > 1) {
              // Multi-row mode: wrap to next visual row when at end
              const currentVisualRow = getVisualRowForColumn(columnIndex)
              const nextCol = findNextFocusableColumnInVisualRow(
                columnIndex,
                currentVisualRow,
                targetRow,
              )
              if (nextCol !== null) {
                newColumnIndex = nextCol
              } else if (currentVisualRow < multiRowCount.value - 1) {
                // Move to first column of next visual row
                newColumnIndex = findFirstFocusableColumnInVisualRow(
                  currentVisualRow + 1,
                  targetRow,
                )
              } else {
                // At last visual row - move to next data row's first visual row
                if (rowIndex < visibleRows.length - 1) {
                  newRowIndex = rowIndex + 1
                  const nextDataRow = visibleRows[newRowIndex]
                  if (nextDataRow) {
                    newColumnIndex = findFirstFocusableColumnInVisualRow(0, nextDataRow)
                  }
                }
              }
            } else {
              newColumnIndex = findNextFocusableColumn(columnIndex, targetRow)
            }
          }
        }
        break
      case 'Tab':
        // Tab navigation: move between cells but let browser handle Tab at grid boundaries
        if (focusMode.value === 'cell') {
          const direction = e.shiftKey ? 'previous' : 'next'
          const target = keyboardNav.navigateTab(
            direction,
            rowIndex,
            columnIndex,
            visibleRows,
            isColumnFocusable,
          )

          if (target) {
            // Valid target found - prevent default and navigate
            e.preventDefault()
            newRowIndex = target.rowIndex
            newColumnIndex = target.columnIndex
          } else {
            // At boundary - skip final focus so browser can handle Tab
            skipFinalFocus = true
          }
        }
        break
      case 'Home':
        e.preventDefault()
        if (focusMode.value === 'cell') {
          const targetRow = visibleRows[rowIndex]
          if (targetRow) {
            newColumnIndex = findFirstFocusableColumn(targetRow)
          }
        }
        break
      case 'End':
        e.preventDefault()
        if (focusMode.value === 'cell') {
          const targetRow = visibleRows[rowIndex]
          if (targetRow) {
            newColumnIndex = findLastFocusableColumn(targetRow)
          }
        }
        break
      case ' ':
        {
          // Check if the target is an interactive element (checkbox, input, button, etc.)
          const target = e.target as HTMLElement
          const isInteractive =
            target.closest('input')
            || target.closest('button')
            || target.closest('select')
            || target.closest('textarea')

          // If it's an interactive element, let it handle the space key naturally
          if (isInteractive) {
            return
          }

          // Always prevent default to avoid page scrolling when in grid navigation
          e.preventDefault()

          // Determine if row selection should be toggled with space bar
          const isRowSelectionEnabled =
            rowSelectionMode.value !== undefined && rowSelectionMode.value !== false
          const isInEditMode = editingCell?.value !== null && editingCell?.value !== undefined
          const isEditingDisabled = enableEditing.value === false

          // Check if focused cell is on the selection column
          const row = visibleRows[rowIndex]
          // In row focus mode, we always want to allow space bar to toggle selection
          // In cell focus mode, only prevent if the focus is specifically on the selection column
          const isOnSelectionColumn =
            focusMode.value === 'cell'
            && row
            && columnIndex >= 0
            && row.getVisibleCells()[columnIndex]?.column.id === '__selection'

          // Check if this specific row can be selected (via rowSelectionEnabled function)
          const canRowBeSelected = (() => {
            if (!row) return false
            const mode = rowSelectionMode.value
            if (typeof mode === 'object' && mode !== null) {
              const options = mode as NuGridRowSelectOptions<T>
              // First check global enabled state
              if (options.enabled === false) {
                return false
              }
              // Then check per-row selection function
              if (options.rowSelectionEnabled) {
                return options.rowSelectionEnabled(row)
              }
            }
            return true // Default to enabled if no function is provided
          })()

          // Toggle row selection if:
          // 1. Row selection is enabled
          // 2. NOT currently in edit mode OR editing is globally disabled
          // 3. In row focus mode OR (in cell focus mode AND focus is NOT on the selection column)
          // 4. The specific row can be selected (rowSelectionEnabled returns true)
          if (
            isRowSelectionEnabled
            && (!isInEditMode || isEditingDisabled)
            && !isOnSelectionColumn
            && row
            && canRowBeSelected
          ) {
            // Toggle the row selection using TanStack Table's API
            row.toggleSelected(!row.getIsSelected())
            return
          }

          // Fallback to custom onSelect handler if provided
          if (props.onSelect && (focusMode.value === 'cell' || focusMode.value === 'row')) {
            if (row) {
              props.onSelect(e, row)
            }
          }
        }
        return
      default:
        return
    }

    // Handle jumping to first column (Home or Cmd+Left) - scroll all the way left
    const isJumpToFirstColumn =
      focusMode.value === 'cell'
      && (e.key === 'Home' || (e.key === 'ArrowLeft' && (e.metaKey || e.ctrlKey)))
      && newColumnIndex !== columnIndex // Actually moving to a different column

    if (isJumpToFirstColumn) {
      // Jump to first column - scroll all the way to the left
      const hScrollContainer = horizontalScrollContainer.value
      if (!hScrollContainer) return

      const targetRow = visibleRows[newRowIndex]
      if (!targetRow) return

      // Update focus state
      setFocusedCell({ rowIndex: newRowIndex, columnIndex: newColumnIndex })

      scrollManager.scrollToHorizontalEdge(hScrollContainer, 'start').then(() => {
        // Wait for scroll to settle before focusing - this solves losing focus
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const targetElement = getCellElement(targetRow.id, newColumnIndex)

            if (targetElement && !isWithinAriaHidden(targetElement)) {
              targetElement.focus({ preventScroll: true })
            }
          })
        })
      })
      return
    }

    // Handle jumping to last column (End or Cmd+Right) - scroll all the way right
    const isJumpToLastColumn =
      focusMode.value === 'cell'
      && (e.key === 'End' || (e.key === 'ArrowRight' && (e.metaKey || e.ctrlKey)))
      && newColumnIndex !== columnIndex // Actually moving to a different column

    if (isJumpToLastColumn) {
      // Jump to last column - scroll all the way to the right
      const hScrollContainer = horizontalScrollContainer.value
      if (!hScrollContainer) return

      const targetRow = visibleRows[newRowIndex]
      if (!targetRow) return

      // Update focus state
      setFocusedCell({ rowIndex: newRowIndex, columnIndex: newColumnIndex })

      scrollManager.scrollToHorizontalEdge(hScrollContainer, 'end').then(() => {
        // Wait for scroll to settle before focusing -  - this solves losing focus
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const targetElement = getCellElement(targetRow.id, newColumnIndex)

            if (targetElement && !isWithinAriaHidden(targetElement)) {
              targetElement.focus({ preventScroll: true })
            }
          })
        })
      })
      return
    }

    // Handle jumping to first/last row when cmdArrows is 'firstlast'
    const isJumpToFirstOrLast =
      (e.key === 'ArrowUp' || e.key === 'ArrowDown')
      && (e.metaKey || e.ctrlKey)
      && cmdArrows.value === 'firstlast'

    if (isJumpToFirstOrLast) {
      // Jump to first or last row - scroll to top or bottom and focus
      const effectiveScrollContainer = verticalScrollContainer.value
      if (!effectiveScrollContainer) return

      const targetRowIndex = newRowIndex
      const targetRow = visibleRows[targetRowIndex]
      if (!targetRow) return

      const edgeDirection = e.key === 'ArrowUp' ? 'start' : 'end'

      scrollManager.scrollToVerticalEdge(effectiveScrollContainer, edgeDirection).then(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() =>
            focusTargetRowAfterEdgeScroll(targetRow, newColumnIndex, e.key),
          )
        })
      })

      // Update focus state
      setFocusedCell({ rowIndex: targetRowIndex, columnIndex: newColumnIndex })
    } else if (isPageScroll) {
      // Handle page scrolling differently - scroll viewport and maintain visual position
      // Throttle to prevent issues when holding down keys
      if (scrollManager.isProcessingScroll) {
        e.preventDefault()
        return
      }

      startProcessingLock()

      const effectiveScrollContainer = verticalScrollContainer.value
      const tableElement = tableRef.value
      if (!effectiveScrollContainer || !tableElement) {
        stopProcessingLock()
        return
      }

      const lastRowIndex = visibleRows.length - 1

      // Don't do anything if we're already at the target row (boundary condition)
      if (newRowIndex === rowIndex) {
        stopProcessingLock()
        return
      }

      const scrollDirection = newRowIndex > rowIndex ? 1 : -1
      const currentScrollTop = effectiveScrollContainer.scrollTop
      const maxScrollTop =
        effectiveScrollContainer.scrollHeight - effectiveScrollContainer.clientHeight

      // Check if we're at the boundaries - but only stop if actually at first/last ROW

      // If at first row and trying to go up, ensure headers visible and stop
      if (scrollDirection < 0 && rowIndex === 0) {
        if (currentScrollTop > 0) {
          effectiveScrollContainer.scrollTop = 0
        }
        stopProcessingLock()
        return
      }

      // If scrolling up and we're close enough to the top that the first row is visible
      // (scrollTop less than one row height), check if we should focus first row
      const oneRowHeight = rowHeightEstimate.value
      if (scrollDirection < 0 && currentScrollTop > 0 && currentScrollTop <= oneRowHeight) {
        // Headers are partially visible - scroll to show them fully
        effectiveScrollContainer.scrollTop = 0

        // Calculate how many rows fit in the first page (with headers visible)
        // Use the scroll container's clientHeight for accurate visible area
        const viewportHeightForCheck = effectiveScrollContainer.clientHeight
        const visibleRowCount = Math.floor(viewportHeightForCheck / oneRowHeight)

        // If current row is within the first page, focus first row directly
        // If current row is beyond the first page, keep focus (two-step behavior)
        if (rowIndex < visibleRowCount) {
          // Row is in the first page - focus first row
          const firstRow = visibleRows[0]
          if (firstRow) {
            setFocusedCell({ rowIndex: 0, columnIndex: newColumnIndex })
            const targetElement =
              focusMode.value === 'cell'
                ? getCellElement(firstRow.id, newColumnIndex)
                : getRowElement(firstRow.id)

            if (targetElement && !isWithinAriaHidden(targetElement)) {
              targetElement.focus({ preventScroll: true })
            }
          }
        }
        // If row is beyond first page, keep current focus (two-step: first scroll, then focus)

        stopProcessingLock()
        return
      }

      // If already at scrollTop 0 and trying to go up, focus first row
      if (scrollDirection < 0 && currentScrollTop === 0 && rowIndex > 0) {
        const firstRow = visibleRows[0]
        if (firstRow) {
          setFocusedCell({ rowIndex: 0, columnIndex: newColumnIndex })
          const targetElement =
            focusMode.value === 'cell'
              ? getCellElement(firstRow.id, newColumnIndex)
              : getRowElement(firstRow.id)

          if (targetElement && !isWithinAriaHidden(targetElement)) {
            targetElement.focus({ preventScroll: true })
          }
        }
        stopProcessingLock()
        return
      }

      // If already on last row and trying to go down, stop
      if (scrollDirection > 0 && rowIndex >= lastRowIndex) {
        stopProcessingLock()
        return
      }

      // If at or very near the bottom (with generous tolerance), focus on last row and stop
      if (scrollDirection > 0 && currentScrollTop >= maxScrollTop - 10) {
        if (lastRowIndex >= 0 && rowIndex < lastRowIndex) {
          const lastRow = visibleRows[lastRowIndex]
          if (lastRow) {
            setFocusedCell({ rowIndex: lastRowIndex, columnIndex: newColumnIndex })
            const targetElement =
              focusMode.value === 'cell'
                ? getCellElement(lastRow.id, newColumnIndex)
                : getRowElement(lastRow.id)

            if (targetElement && !isWithinAriaHidden(targetElement)) {
              targetElement.focus({ preventScroll: true })
            }
          }
        }
        stopProcessingLock()
        return
      }

      // Get the current focused element's position BEFORE scrolling
      const currentRow = visibleRows[rowIndex]
      let currentFocusedElement: HTMLElement | null = null
      if (currentRow) {
        if (focusMode.value === 'cell') {
          currentFocusedElement = getCellElement(currentRow.id, columnIndex)
        } else {
          currentFocusedElement = getRowElement(currentRow.id)
        }
      }

      // Account for sticky headers when measuring position
      // Round to prevent floating-point accumulation
      const stickyHeaderHeight = Math.round(resolveStickyHeight(tableElement))

      // Measure once before mutating scrollTop to avoid repeated layout thrash
      const containerRectTop = effectiveScrollContainer.getBoundingClientRect().top
      const visibleTop = Math.round(containerRectTop + stickyHeaderHeight)
      const currentFocusedTop = currentFocusedElement?.getBoundingClientRect().top ?? 0
      const targetVisualTop = currentFocusedElement ? Math.round(currentFocusedTop - visibleTop) : 0

      // Scroll by exactly the visible area height (viewport minus sticky headers)
      // Use the scroll container's clientHeight for accurate visible area
      const viewportHeight = Math.round(effectiveScrollContainer.clientHeight - stickyHeaderHeight)

      // Scroll by visible area height minus a small overlap to ensure partial rows are caught
      // This prevents skipping rows that are only partially visible at the edge of the viewport
      const overlap = Math.round(Math.max(1, rowHeightEstimate.value) * 0.3)
      const effectiveScrollAmount = Math.max(1, viewportHeight - overlap)

      const scrollAmount = scrollDirection * effectiveScrollAmount
      const newScrollTop = Math.max(0, Math.min(maxScrollTop, currentScrollTop + scrollAmount))
      effectiveScrollContainer.scrollTop = newScrollTop

      const targetScreenY = Math.round(visibleTop + targetVisualTop)

      // Wait for scroll to complete and find which row is now at the target position
      requestAnimationFrame(() => {
        // Check if we hit the bottom after scrolling
        const currentScrollAfter = effectiveScrollContainer.scrollTop
        const maxScrollAfter =
          effectiveScrollContainer.scrollHeight - effectiveScrollContainer.clientHeight

        if (scrollDirection > 0 && currentScrollAfter >= maxScrollAfter - 10) {
          // Hit the bottom - focus on last row
          const lastRowIndex = visibleRows.length - 1
          if (lastRowIndex >= 0) {
            const lastRow = visibleRows[lastRowIndex]
            if (lastRow) {
              setFocusedCell({ rowIndex: lastRowIndex, columnIndex: newColumnIndex })
              const targetElement =
                focusMode.value === 'cell'
                  ? getCellElement(lastRow.id, newColumnIndex)
                  : getRowElement(lastRow.id)

              if (targetElement && !isWithinAriaHidden(targetElement)) {
                targetElement.focus({ preventScroll: true })
              }
            }
          }

          // Ensure footers are visible when we reach the bottom
          ensureFootersVisible(effectiveScrollContainer, true)

          stopProcessingLock()
          return
        }

        // Find which row is at the target position by querying visible elements
        let closestRow: Row<T> | null = null
        let closestRowIndex = -1
        let closestDistance = Infinity

        // Query all visible row elements in the DOM
        const rowElements = tableElement.querySelectorAll<HTMLElement>('[data-row-id]')

        for (const rowElement of rowElements) {
          const rowId = rowElement.getAttribute('data-row-id')
          if (rowId) {
            cacheRowElement(rowId, rowElement)
          }
          const rowIdx = getRowIndexById(rowId)
          if (rowIdx === -1) {
            continue
          }

          const row = visibleRows[rowIdx]
          if (!row) {
            continue
          }

          const rowRect = rowElement.getBoundingClientRect()
          // Use row's top edge for distance calculation to match how targetScreenY was calculated
          // (from element's getBoundingClientRect().top, not center)
          // Round to prevent floating-point drift
          const distance = Math.abs(Math.round(rowRect.top) - targetScreenY)

          if (distance < closestDistance) {
            closestDistance = distance
            closestRow = row
            closestRowIndex = rowIdx
          }
        }

        if (closestRow && closestRowIndex !== -1) {
          // Update focus to the row that's now at the target position
          setFocusedCell({ rowIndex: closestRowIndex, columnIndex: newColumnIndex })

          const targetElement =
            focusMode.value === 'cell'
              ? getCellElement(closestRow.id, newColumnIndex)
              : getRowElement(closestRow.id)

          if (targetElement && !isWithinAriaHidden(targetElement)) {
            targetElement.focus({ preventScroll: true })

            // Fine-tune scroll position to maintain exact visual position
            const actualVisualTop = targetElement.getBoundingClientRect().top - visibleTop
            const adjustment = actualVisualTop - targetVisualTop

            if (Math.abs(adjustment) > 0.5) {
              effectiveScrollContainer.scrollTop += adjustment
            }

            // When landing on the first row via PageUp, ensure column headers become visible
            if (closestRowIndex === 0 && effectiveScrollContainer.scrollTop > 0) {
              effectiveScrollContainer.scrollTop = 0
            }
          }
        }

        stopProcessingLock()
      })
    } else if (!skipFinalFocus) {
      // Normal arrow key navigation - use existing scroll-to-cell behavior
      setFocusedCell({ rowIndex: newRowIndex, columnIndex: newColumnIndex })

      const targetRow = visibleRows[newRowIndex]
      if (!targetRow) return

      focusCell(targetRow, newRowIndex, newColumnIndex, isVerticalOnly)
    }
  }

  /**
   * Handle keyup events to invalidate dimension cache when navigation keys are released
   */
  function onCellKeyUp(e: KeyboardEvent) {
    // Clear dimension cache when navigation keys are released
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(e.key)) {
      scrollManager.invalidateDimensionCache()
    }
  }

  function focusCell(
    targetRow: Row<T>,
    newRowIndex: number,
    newColumnIndex: number,
    verticalOnly = false,
    onScrollComplete?: () => void,
  ) {
    startProcessingLock()

    const finalize = () => {
      stopProcessingLock()
      onScrollComplete?.()
    }

    if (focusMode.value === 'cell') {
      const cellElement = getCellElement(targetRow.id, newColumnIndex)

      if (cellElement) {
        if (isWithinAriaHidden(cellElement)) {
          finalize()
          return
        }

        // Check if we're at the first or last focusable column
        // to scroll edge non-focusable columns into view
        const firstFocusableCol = findFirstFocusableColumn(targetRow)
        const lastFocusableCol = findLastFocusableColumn(targetRow)
        const isFirstFocusableColumn = newColumnIndex === firstFocusableCol && firstFocusableCol > 0
        const isLastFocusableColumn =
          newColumnIndex === lastFocusableCol && lastFocusableCol < visibleColumns.value.length - 1

        // Use shared scroll-and-focus helper
        scrollToCellAndFocus({
          cellElement,
          rowId: targetRow.id,
          rowIndex: newRowIndex,
          columnIndex: newColumnIndex,
          behavior: 'instant',
          verticalOnly,
          isFirstFocusableColumn,
          isLastFocusableColumn,
          onComplete: finalize,
        })
      } else {
        finalize()
      }
    } else if (focusMode.value === 'row') {
      const rowElement = getRowElement(targetRow.id)

      if (rowElement) {
        if (isWithinAriaHidden(rowElement)) {
          finalize()
          return
        }

        // Use shared scroll-and-focus helper with skipHorizontalScroll for row mode
        scrollToCellAndFocus({
          cellElement: rowElement,
          rowId: targetRow.id,
          rowIndex: newRowIndex,
          columnIndex: 0,
          behavior: 'instant',
          skipHorizontalScroll: true,
          verticalOnly,
          onComplete: finalize,
        })
      } else {
        finalize()
      }
    } else {
      finalize()
    }
  }

  function focusTargetRowAfterEdgeScroll(row: Row<T>, columnIndex: number, directionKey: string) {
    const effectiveScrollContainer = verticalScrollContainer.value
    if (!effectiveScrollContainer) return

    const targetElement =
      focusMode.value === 'cell' ? getCellElement(row.id, columnIndex) : getRowElement(row.id)

    if (targetElement && !isWithinAriaHidden(targetElement)) {
      targetElement.focus({ preventScroll: true })

      if (directionKey === 'ArrowDown') {
        const containerRect = effectiveScrollContainer.getBoundingClientRect()
        const elementRect = targetElement.getBoundingClientRect()
        const containerBottom = containerRect.bottom
        const elementBottom = elementRect.bottom
        const padding = 15

        if (elementBottom > containerBottom - padding) {
          const adjustment = elementBottom - containerBottom + padding
          effectiveScrollContainer.scrollTop += adjustment
        }

        // If we're on the last row, ensure footers are visible
        const resolvedRows = navigableRows?.value ?? rows.value
        const isLastRow =
          resolvedRows.length > 0 && row.id === resolvedRows[resolvedRows.length - 1]?.id

        if (isLastRow) {
          ensureFootersVisible(effectiveScrollContainer)
        }
      }
    }
  }

  function getRowTabIndex(row: Row<T>): number {
    if (focusMode.value === 'row') {
      const rowIndex = getRowIndex(row)
      if (rowIndex !== -1 && focusedCell.value?.rowIndex === rowIndex) {
        return 0
      }
    }
    if (props.onSelect && focusMode.value === 'none') {
      return 0
    }
    return -1
  }

  // Helper function to determine if row should handle keydown
  function shouldRowHandleKeydown(row: Row<T>): boolean {
    if (focusMode.value === 'none' && props.onSelect) {
      return true
    }

    if (focusMode.value === 'row') {
      const rowIndex = getRowIndex(row)
      return rowIndex !== -1 && focusedCell.value?.rowIndex === rowIndex
    }

    return false
  }

  // Helper function to determine tabindex for a cell
  function getCellTabIndex(row: Row<T>, cellIndex: number): number {
    if (focusMode.value === 'cell') {
      const rowIndex = getRowIndex(row)
      if (
        rowIndex !== -1
        && focusedCell.value?.rowIndex === rowIndex
        && focusedCell.value?.columnIndex === cellIndex
      ) {
        return 0
      }
    }
    return -1
  }

  // Helper function to determine if cell should handle keydown
  function shouldCellHandleKeydown(row: Row<T>, cellIndex: number): boolean {
    // In none mode with onSelect, handle keydown to prevent default navigation
    if (focusMode.value === 'none' && props.onSelect) {
      return true
    }
    if (focusMode.value === 'cell') {
      const rowIndex = getRowIndex(row)
      return (
        rowIndex !== -1
        && focusedCell.value?.rowIndex === rowIndex
        && focusedCell.value?.columnIndex === cellIndex
      )
    }
    return false
  }

  // Helper function to check if a row is the active row (for highlighting)
  function isActiveRow(row: Row<T>): boolean {
    // Early return for most common case - no focus mode or no focused cell
    if (focusMode.value === 'none' || !focusedCell.value) return false

    const rowIndex = getRowIndex(row)
    return rowIndex !== -1 && focusedCell.value.rowIndex === rowIndex
  }

  // Helper function to check if a row is the focused row (for row focus mode)
  function isFocusedRow(row: Row<T>): boolean {
    // Early return for non-row focus modes
    if (focusMode.value !== 'row' || !focusedCell.value) return false

    const rowIndex = getRowIndex(row)
    return rowIndex !== -1 && focusedCell.value.rowIndex === rowIndex
  }

  // Helper function to check if a cell is focused (for cell focus mode)
  function isFocusedCell(row: Row<T>, cellIndex: number): boolean {
    // Early return for non-cell focus modes
    if (focusMode.value !== 'cell' || !focusedCell.value) return false

    const rowIndex = getRowIndex(row)
    if (
      rowIndex !== -1
      && focusedCell.value.rowIndex === rowIndex
      && focusedCell.value.columnIndex === cellIndex
    ) {
      return !focusedCell.value.suppressOutline
    }
    return false
  }

  function rowFocusProps(row: Row<T>) {
    return {
      'data-active-row': isActiveRow(row),
      'data-focused-row': isFocusedRow(row),
      'tabindex': getRowTabIndex(row),
    }
  }

  function cellFocusProps(row: Row<T>, cellIndex: number) {
    const isFocused = isFocusedCell(row, cellIndex)
    return {
      'data-focused': isFocused,
      'tabindex': getCellTabIndex(row, cellIndex),
      'class': isFocused ? 'focused-cell' : '',
      'onClick': (e: Event) => onCellClick(e, row, cellIndex),
    }
  }

  /**
   * Focus a row by its ID, scrolling to make it visible
   * @param rowId - The ID of the row to focus, or null to clear focus
   * @param options - Optional settings for focus behavior
   * @param options.columnIndex - Optional column index to focus when the row is found
   * @param options.align - Optional scroll alignment; defaults to model-driven align
   * @returns true if row was found and focused, false if row ID not found
   */
  function focusRowById(
    rowId: string | null,
    options?: {
      columnIndex?: number
      /** Scroll alignment: 'nearest' just makes visible, 'top' scrolls row to top, 'center' centers the row */
      align?: 'nearest' | 'top' | 'center'
    },
  ): boolean {
    // Handle clearing focus
    if (rowId === null) {
      setFocusedCell(null)
      return true
    }

    // Look up row index from ID using the O(1) map
    const rowIndex = rowIdToIndexMap.value.get(rowId)
    if (rowIndex === undefined) {
      // Invalid row ID - don't change focus, log warning
      console.warn(`[NuGrid] focusRowById: Row ID "${rowId}" not found in grid`)
      return false
    }

    const currentRows = resolvedRows.value
    const targetRow = currentRows[rowIndex]
    if (!targetRow) {
      return false
    }

    // Determine column to focus
    const columnIndex = options?.columnIndex ?? findFirstFocusableColumn(targetRow)
    const align = options?.align ?? alignOnModel.value ?? 'nearest'

    // Update focus state
    isUpdatingFromModel = true
    setFocusedCell({ rowIndex, columnIndex })
    isUpdatingFromModel = false

    // Focus and scroll to the cell/row
    // Pass alignment callback so it runs after scroll completes (not via nextTick which fires too early)
    focusCell(targetRow, rowIndex, columnIndex, false, () => {
      const scrollContainer = verticalScrollContainer.value
      const rowElement = getRowElement(targetRow.id)
      const tableElement = tableRef.value

      if (scrollContainer && rowElement) {
        const containerRect = scrollContainer.getBoundingClientRect()
        const rowRect = rowElement.getBoundingClientRect()
        // Use scrollManager to get accurate sticky height (works for both virtualized and non-virtualized)
        const stickyHeight = resolveStickyHeight(tableElement)

        // Calculate visible area accounting for sticky headers
        const visibleTop = containerRect.top + stickyHeight
        const visibleHeight = containerRect.height - stickyHeight
        const visibleBottom = visibleTop + visibleHeight

        if (align === 'top') {
          // Scroll to position row at the top of the visible area
          const targetScrollTop = scrollContainer.scrollTop + (rowRect.top - visibleTop)
          scrollContainer.scrollTop = Math.max(0, targetScrollTop)
        } else if (align === 'center') {
          // Scroll to center the row in the visible area
          const rowCenter = rowRect.top + rowRect.height / 2
          const visibleCenter = visibleTop + visibleHeight / 2
          const offset = rowCenter - visibleCenter
          scrollContainer.scrollTop = Math.max(0, scrollContainer.scrollTop + offset)
        } else if (align === 'nearest') {
          // For 'nearest', ensure the row is fully visible with adequate padding
          // The initial scroll only ensures the cell is barely visible - we need to ensure the whole row is visible
          const minVisiblePadding = 10 // Minimum padding to ensure row is comfortably visible

          // Check if row top is cut off (above visible area)
          if (rowRect.top < visibleTop + minVisiblePadding) {
            const adjustment = rowRect.top - visibleTop - minVisiblePadding
            scrollContainer.scrollTop = Math.max(0, scrollContainer.scrollTop + adjustment)
          }
          // Check if row bottom is cut off (below visible area)
          else if (rowRect.bottom > visibleBottom - minVisiblePadding) {
            const adjustment = rowRect.bottom - visibleBottom + minVisiblePadding
            const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight
            scrollContainer.scrollTop = Math.min(maxScroll, scrollContainer.scrollTop + adjustment)
          }
        }
      }
    })

    return true
  }

  // Watch for external changes to focusedRowIdModel
  if (focusedRowIdModel) {
    watch(
      focusedRowIdModel,
      (newRowId, oldRowId) => {
        // Skip if we're the ones updating the model
        if (isUpdatingToModel) return

        // Skip if value hasn't actually changed
        if (newRowId === oldRowId) return

        // Handle null (clear focus)
        if (newRowId === null) {
          isUpdatingFromModel = true
          setFocusedCell(null)
          isUpdatingFromModel = false
          return
        }

        // Focus the row by ID
        const success = focusRowById(newRowId)

        // If row not found, revert model to previous value
        if (!success && oldRowId !== undefined) {
          isUpdatingToModel = true
          focusedRowIdModel.value = oldRowId
          isUpdatingToModel = false
        }
      },
      { immediate: false }, // Don't run on mount - let normal focus init happen
    )
  }

  return {
    focusedCell,
    gridHasFocus,
    onCellClick,
    onCellKeyDown,
    onCellKeyUp,
    getRowTabIndex,
    shouldRowHandleKeydown,
    getCellTabIndex,
    shouldCellHandleKeydown,
    isActiveRow,
    isFocusedRow,
    isFocusedCell,
    rowFocusProps,
    cellFocusProps,
    focusCell,
    findFirstFocusableColumn,
    getCellElement,
    ensureFootersVisible,
    scrollToCellAndFocus,
    setFocusedCell,
    focusRowById,
  }
}

/**
 * Initialize focus on first row/cell when data loads (for keyboard navigation)
 * Should be called after creating the focus composable
 */
export function useNuGridFocusInit<T extends TableData>(
  props: NuGridProps<T>,
  focusFns: NuGridFocus<T>,
  rows: Ref<Row<T>[]>,
) {
  const focusMode = usePropWithDefault(props, 'focus', 'mode')
  const autoFocus = usePropWithDefault(props, 'focus', 'autoFocus')

  watch(
    [focusMode, autoFocus, rows],
    ([mode, autoFocusEnabled, rowList]) => {
      // Only auto-focus if enabled and we have rows and no current focus
      if (!autoFocusEnabled || !rowList || rowList.length === 0 || focusFns.focusedCell.value) {
        return
      }

      if (mode === 'cell' || mode === 'row') {
        nextTick(() => {
          const firstRow = rowList[0]
          if (firstRow) {
            const columnIndex = mode === 'cell' ? focusFns.findFirstFocusableColumn(firstRow) : 0
            focusFns.setFocusedCell({ rowIndex: 0, columnIndex })
            focusFns.focusCell(firstRow, 0, columnIndex)
          }
        })
      }
    },
    { immediate: true },
  )
}
