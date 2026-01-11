import type { TableData } from '@nuxt/ui'
import type { Table } from '@tanstack/vue-table'
import type { Primitive } from 'reka-ui'
import type { ComputedRef, Ref } from 'vue'
import { useElementSize } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

export interface ScrollToCellOptions {
  /** The cell element to scroll to */
  cellElement: HTMLElement
  /** The scroll container element (used for vertical scrolling) */
  scrollContainer: HTMLElement
  /** Optional separate container for horizontal scrolling (if different from scrollContainer) */
  horizontalScrollContainer?: HTMLElement
  /** The table element (for finding headers) */
  tableElement: HTMLElement | null
  /** The row index being scrolled to */
  rowIndex: number
  /** The column index being scrolled to */
  columnIndex: number
  /** Sticky header height (for virtualized grids) */
  virtualizedStickyHeight?: number
  /** Scroll behavior - 'instant' for immediate, 'smooth' for animated */
  behavior?: 'instant' | 'smooth'
  /** Vertical padding around the cell */
  verticalPadding?: number
  /** Whether to look for headers above when scrolling */
  includeHeadersAbove?: boolean
  /** Whether to skip horizontal scrolling (useful for row focus mode) */
  skipHorizontalScroll?: boolean
  /** Whether this is vertical-only navigation (up/down keys) - enables extra optimizations */
  verticalOnly?: boolean
}

/**
 * Scroll manager for NuGrid with performance optimizations
 * Uses requestAnimationFrame for better timing and cancellation support
 */
export class NuGridScrollManager {
  private pendingScrollFrame: number | null = null
  private pendingResolve: (() => void) | null = null
  private isProcessing = false
  private tableApi: Table<any>
  private pinnedLeftWidth: ComputedRef<number>
  private pinnedRightWidth: ComputedRef<number>
  private visibleColumns: ComputedRef<any[]>
  private cumulativeWidthsFromRight: ComputedRef<number[]>

  // Cache for sticky header detection to avoid expensive DOM queries
  private cachedTableElement: HTMLElement | null = null
  private cachedHeaderElement: HTMLElement | null = null
  private isHeaderSticky = false

  // Dimension cache - reuse container/header measurements during rapid scrolling
  private dimensionCache: {
    containerRect: DOMRect | null
    stickyHeaderHeight: number
    visibleTop: number
    visibleBottom: number
    visibleLeft: number
    visibleRight: number
    timestamp: number
  } = {
    containerRect: null,
    stickyHeaderHeight: 0,
    visibleTop: 0,
    visibleBottom: 0,
    visibleLeft: 0,
    visibleRight: 0,
    timestamp: 0,
  }

  constructor(
    tableApi: Table<any>,
    pinnedLeftWidth: ComputedRef<number>,
    pinnedRightWidth: ComputedRef<number>,
    visibleColumns: ComputedRef<any[]>,
    cumulativeWidthsFromRight: ComputedRef<number[]>,
  ) {
    this.tableApi = tableApi
    this.pinnedLeftWidth = pinnedLeftWidth
    this.pinnedRightWidth = pinnedRightWidth
    this.visibleColumns = visibleColumns
    this.cumulativeWidthsFromRight = cumulativeWidthsFromRight
  }

  /**
   * Cancel any pending scroll operation
   */
  cancelPending(clearProcessing = true): void {
    if (this.pendingScrollFrame !== null) {
      cancelAnimationFrame(this.pendingScrollFrame)
      this.pendingScrollFrame = null
    }

    if (this.pendingResolve) {
      this.pendingResolve()
      this.pendingResolve = null
    }

    if (clearProcessing) {
      this.isProcessing = false
    }
  }

  /**
   * Check if a scroll operation is currently being processed
   */
  get isProcessingScroll(): boolean {
    return this.isProcessing
  }

  /**
   * Set the processing state
   */
  setProcessing(value: boolean): void {
    this.isProcessing = value
  }

  /**
   * Invalidate the sticky header cache
   * Call this if the table structure changes (e.g., headers added/removed)
   */
  invalidateHeaderCache(): void {
    this.cachedTableElement = null
    this.cachedHeaderElement = null
    this.isHeaderSticky = false
  }

  /**
   * Invalidate dimension cache
   * Call this when container size might have changed
   */
  invalidateDimensionCache(): void {
    this.dimensionCache.timestamp = 0
  }

  /**
   * Get or compute container dimensions with caching
   * Cache is valid for 30000ms (30 seconds) - invalidated manually on keyup
   */
  private getCachedDimensions(
    scrollContainer: HTMLElement,
    tableElement: HTMLElement | null,
    virtualizedStickyHeight?: number,
  ): {
    containerRect: DOMRect
    stickyHeaderHeight: number
    visibleTop: number
    visibleBottom: number
    visibleLeft: number
    visibleRight: number
  } {
    const now = Date.now()
    const cacheAge = now - this.dimensionCache.timestamp

    // Use cache if less than 30000ms old (invalidated manually on keyup)
    if (cacheAge < 30000 && this.dimensionCache.containerRect) {
      return {
        containerRect: this.dimensionCache.containerRect,
        stickyHeaderHeight: this.dimensionCache.stickyHeaderHeight,
        visibleTop: this.dimensionCache.visibleTop,
        visibleBottom: this.dimensionCache.visibleBottom,
        visibleLeft: this.dimensionCache.visibleLeft,
        visibleRight: this.dimensionCache.visibleRight,
      }
    }

    // Recompute dimensions
    const containerRect = scrollContainer.getBoundingClientRect()

    // Calculate sticky header height
    let stickyHeaderHeight = 0
    const multiRowHeaders = tableElement?.querySelector(
      '[data-multi-row-headers="true"][data-sticky-header]',
    ) as HTMLElement | null
    if (multiRowHeaders) {
      stickyHeaderHeight = multiRowHeaders.offsetHeight
    } else {
      stickyHeaderHeight = this.getStickyHeaderHeight(tableElement, virtualizedStickyHeight)
    }

    const visibleTop = containerRect.top + stickyHeaderHeight
    const hasSticky = stickyHeaderHeight > 0
    const visibleBottom = hasSticky
      ? containerRect.top + scrollContainer.clientHeight
      : containerRect.bottom

    const leftPinnedWidth = this.pinnedLeftWidth.value
    const rightPinnedWidth = this.pinnedRightWidth.value
    const visibleLeft = containerRect.left + leftPinnedWidth
    const visibleRight = containerRect.right - rightPinnedWidth

    // Update cache
    this.dimensionCache = {
      containerRect,
      stickyHeaderHeight,
      visibleTop,
      visibleBottom,
      visibleLeft,
      visibleRight,
      timestamp: now,
    }

    return {
      containerRect,
      stickyHeaderHeight,
      visibleTop,
      visibleBottom,
      visibleLeft,
      visibleRight,
    }
  }

  /**
   * Update cached sticky header information if table element changed
   * This avoids expensive querySelector and getComputedStyle calls on every scroll
   */
  private updateStickyHeaderCache(tableElement: HTMLElement | null): void {
    // Update cached header element if table changed
    if (tableElement !== this.cachedTableElement) {
      this.cachedTableElement = tableElement
      this.cachedHeaderElement =
        (tableElement?.querySelector('[data-sticky-header]') as HTMLElement) || null
    }

    // Always re-check sticky state since it can change without table element changing
    // (e.g., when user toggles sticky prop)
    this.isHeaderSticky = this.cachedHeaderElement
      ? window.getComputedStyle(this.cachedHeaderElement).position === 'sticky'
      : false
  }

  /**
   * Return the sticky header height, reusing cached lookups when possible
   */
  getStickyHeaderHeight(
    tableElement: HTMLElement | null,
    virtualizedStickyHeight?: number,
  ): number {
    if (typeof virtualizedStickyHeight === 'number') {
      return virtualizedStickyHeight
    }

    this.updateStickyHeaderCache(tableElement)
    if (this.isHeaderSticky) {
      return this.cachedHeaderElement?.offsetHeight || 0
    }

    return 0
  }

  /**
   * Scroll horizontally to the start/end of the scroll container
   */
  scrollToHorizontalEdge(
    scrollContainer: HTMLElement,
    direction: 'start' | 'end',
    behavior: ScrollBehavior = 'instant',
  ): Promise<void> {
    this.cancelPending()

    return new Promise((resolve) => {
      this.pendingResolve = resolve
      this.pendingScrollFrame = requestAnimationFrame(() => {
        this.pendingScrollFrame = null
        this.pendingResolve = null

        const maxScrollLeft = Math.max(0, scrollContainer.scrollWidth - scrollContainer.clientWidth)
        let targetLeft = direction === 'start' ? 0 : maxScrollLeft

        if (direction === 'end') {
          const rightPinnedWidth = this.pinnedRightWidth.value
          if (rightPinnedWidth > 0) {
            targetLeft = Math.min(maxScrollLeft, targetLeft + rightPinnedWidth)
          }
        }

        scrollContainer.scrollTo({ left: targetLeft, behavior })
        resolve()
      })
    })
  }

  /**
   * Scroll vertically to the top/bottom of the scroll container
   */
  scrollToVerticalEdge(
    scrollContainer: HTMLElement,
    direction: 'start' | 'end',
    behavior: ScrollBehavior = 'instant',
  ): Promise<void> {
    this.cancelPending()

    return new Promise((resolve) => {
      this.pendingResolve = resolve
      this.pendingScrollFrame = requestAnimationFrame(() => {
        this.pendingScrollFrame = null
        this.pendingResolve = null

        const maxScrollTop = Math.max(
          0,
          scrollContainer.scrollHeight - scrollContainer.clientHeight,
        )
        const targetTop = direction === 'start' ? 0 : maxScrollTop

        scrollContainer.scrollTo({ top: targetTop, behavior })
        resolve()
      })
    })
  }

  /**
   * Scroll to make a cell visible with performance optimizations
   * Returns a promise that resolves when scrolling is complete
   */
  scrollToCell(options: ScrollToCellOptions): Promise<void> {
    const {
      cellElement,
      scrollContainer,
      horizontalScrollContainer,
      tableElement,
      rowIndex,
      columnIndex,
      virtualizedStickyHeight,
      behavior = 'instant',
      verticalPadding = 15,
      includeHeadersAbove = false,
      skipHorizontalScroll = false,
      verticalOnly = false,
    } = options

    // Use separate container for horizontal scrolling if provided, otherwise use the same container
    const hScrollContainer = horizontalScrollContainer ?? scrollContainer

    // Cancel any pending scroll to avoid conflicts
    // Don't clear processing state - caller controls when to release the lock
    this.cancelPending(false)

    return new Promise((resolve) => {
      this.pendingResolve = resolve
      // Use requestAnimationFrame for better timing and to batch DOM reads
      this.pendingScrollFrame = requestAnimationFrame(() => {
        this.pendingScrollFrame = null
        this.pendingResolve = null

        // Use cached dimensions for container/headers
        // For vertical-only navigation, we only need vertical measurements from cellRect
        const cellRect = cellElement.getBoundingClientRect()
        let cellTop: number
        let cellBottom: number
        let cellLeft: number
        let cellRight: number
        let cellWidth: number
        let cellHeight: number

        if (verticalOnly) {
          // Optimize: only extract vertical properties when moving up/down
          cellTop = cellRect.top
          cellBottom = cellRect.bottom
          cellHeight = cellRect.height
          // Set dummy values for horizontal (won't be used)
          cellLeft = 0
          cellRight = 0
          cellWidth = 0
        } else {
          // Extract all properties for full navigation
          ;({
            top: cellTop,
            bottom: cellBottom,
            left: cellLeft,
            right: cellRight,
            width: cellWidth,
            height: cellHeight,
          } = cellRect)
        }

        const cachedDims = this.getCachedDimensions(
          scrollContainer,
          tableElement,
          virtualizedStickyHeight,
        )
        const { stickyHeaderHeight, visibleTop, visibleBottom, visibleLeft, visibleRight } =
          cachedDims

        const visibleHeight = visibleBottom - visibleTop

        // For multi-row mode, check once and cache the result
        // Skip this expensive check if we're in vertical-only navigation (simple up/down)
        let effectiveTop = cellTop
        let effectiveBottom = cellBottom
        let effectiveCellHeight = cellHeight

        if (!verticalOnly) {
          const multiRowContainer = (cellElement.closest('[data-multi-row="true"]')
            || cellElement.closest('.nugrid-multi-row-container')) as HTMLElement | null

          if (multiRowContainer) {
            const multiRowRect = multiRowContainer.getBoundingClientRect()
            effectiveTop = multiRowRect.top
            effectiveBottom = multiRowRect.bottom
            effectiveCellHeight = multiRowRect.height
          }
        }

        let verticalScrollAdjustment = 0
        // Reduce padding when sticky headers are present to minimize gap
        const effectiveVerticalPadding = stickyHeaderHeight > 0 ? 0 : verticalPadding

        // Special handling for first row: ALWAYS ensure headers are visible
        if (rowIndex === 0 && scrollContainer.scrollTop > 0) {
          verticalScrollAdjustment = -scrollContainer.scrollTop
        }

        // If not handled by row 0 special case, check normal cell visibility
        // Use effectiveTop/effectiveBottom which account for multi-row containers
        if (verticalScrollAdjustment === 0 && effectiveCellHeight <= visibleHeight) {
          const scrollMargin = 2
          const isCutOffTop = effectiveTop < visibleTop - scrollMargin
          const isCutOffBottom = effectiveBottom > visibleBottom + scrollMargin

          if (isCutOffTop) {
            // For multi-row, scroll to show the container's top, not just the cell's top
            let targetTop = effectiveTop - effectiveVerticalPadding

            // When headers aren't sticky and includeHeadersAbove is true, look for headers above
            if (includeHeadersAbove && !virtualizedStickyHeight) {
              const rowElement = cellElement.closest('[data-row-id]') as HTMLElement
              if (rowElement) {
                let sibling = rowElement.previousElementSibling as HTMLElement
                const headersToReveal: HTMLElement[] = []

                // Collect headers immediately above (no data rows in between)
                while (sibling) {
                  const isColumnHeader =
                    sibling.hasAttribute('data-sticky-header')
                    || sibling.querySelector('[data-sticky-header]')
                  const isGroupHeader = sibling.hasAttribute('data-group-header')

                  if (isColumnHeader || isGroupHeader) {
                    headersToReveal.unshift(sibling)
                    sibling = sibling.previousElementSibling as HTMLElement
                  } else if (sibling.hasAttribute('data-row-id')) {
                    break
                  } else {
                    sibling = sibling.previousElementSibling as HTMLElement
                  }
                }

                // If headers found, adjust target to show the topmost one
                if (headersToReveal.length > 0) {
                  const topHeaderRect = headersToReveal[0]!.getBoundingClientRect()
                  targetTop = Math.min(targetTop, topHeaderRect.top - 10)
                }
              }
            }

            verticalScrollAdjustment = targetTop - visibleTop

            // Clamp scroll distance for smoother reveal when including headers
            if (includeHeadersAbove) {
              const maxScrollPerAction = 150
              if (verticalScrollAdjustment < -maxScrollPerAction) {
                verticalScrollAdjustment = -maxScrollPerAction
              }
            }
          } else if (isCutOffBottom) {
            // For multi-row, scroll to show the container's bottom, not just the cell's bottom
            verticalScrollAdjustment = effectiveBottom - visibleBottom + effectiveVerticalPadding

            // Prevent scrolling past the absolute bottom
            const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight
            const currentScroll = scrollContainer.scrollTop
            const newScroll = currentScroll + verticalScrollAdjustment

            if (newScroll > maxScroll) {
              verticalScrollAdjustment = maxScroll - currentScroll
            }
          }
        } else if (effectiveCellHeight > visibleHeight) {
          // Row is too tall to fit - prioritize showing the top edge
          // Use effectiveTop to account for multi-row containers
          if (effectiveTop < visibleTop) {
            verticalScrollAdjustment = effectiveTop - visibleTop - effectiveVerticalPadding
          }
        }

        let horizontalScrollAdjustment = 0

        // Skip horizontal scrolling if requested (e.g., in row focus mode) or if vertical-only navigation
        if (!skipHorizontalScroll && !verticalOnly) {
          // Check if this cell is pinned - will skip horizontal scrolling
          const isPinnedLeft = cellElement.getAttribute('data-pinned') === 'left'
          const isPinnedRight = cellElement.getAttribute('data-pinned') === 'right'
          const isPinned = isPinnedLeft || isPinnedRight

          if (!isPinned) {
            // Use cached visible area (includes pinned column calculations)
            // Add padding to the cached values
            const paddedVisibleLeft = visibleLeft + 10
            const paddedVisibleRight = visibleRight - 10
            const visibleWidth = paddedVisibleRight - paddedVisibleLeft

            if (cellWidth <= visibleWidth) {
              // Cell fits - ensure it's fully visible
              if (cellLeft < paddedVisibleLeft) {
                horizontalScrollAdjustment = cellLeft - paddedVisibleLeft - 4
              } else if (cellRight > paddedVisibleRight) {
                // Check if focused column and all columns to its right can fit
                // Use pre-computed cumulative widths for O(1) lookup instead of O(n) slice + reduce
                const totalWidthToRight = this.cumulativeWidthsFromRight.value[columnIndex] || 0
                const rightPinnedWidth = this.pinnedRightWidth.value

                // If all remaining columns fit, add extra padding to reveal we're at the end
                if (totalWidthToRight <= visibleWidth + rightPinnedWidth) {
                  horizontalScrollAdjustment = cellRight - paddedVisibleRight + 40
                } else {
                  horizontalScrollAdjustment = cellRight - paddedVisibleRight + 8
                }
              }
            } else {
              // Cell is too wide to fit - prioritize showing the left edge
              if (cellLeft < paddedVisibleLeft) {
                horizontalScrollAdjustment = cellLeft - paddedVisibleLeft - 4
              }
            }
          }
        }

        // Perform the scroll if needed
        // Use separate containers for vertical and horizontal scrolling if they differ
        if (verticalScrollAdjustment !== 0) {
          scrollContainer.scrollBy({
            top: verticalScrollAdjustment,
            behavior,
          })
        }
        if (horizontalScrollAdjustment !== 0) {
          hScrollContainer.scrollBy({
            left: horizontalScrollAdjustment,
            behavior,
          })
        }

        resolve()
      })
    })
  }
}

/**
 * Check if an element is scrollable for a specific axis.
 * Only checks the element itself - does NOT traverse up the DOM tree
 * to avoid accidentally scrolling parent containers outside the grid.
 */
function findScrollContainer(
  element: HTMLElement | null,
  axis: 'vertical' | 'horizontal',
): HTMLElement | null {
  if (!element) return null

  const style = window.getComputedStyle(element)

  if (axis === 'vertical') {
    const overflowY = style.overflowY
    const hasOverflow = overflowY === 'auto' || overflowY === 'scroll'
    const hasScrollableContent = element.scrollHeight > element.clientHeight

    if (hasOverflow && hasScrollableContent) {
      return element
    }
  } else {
    const overflowX = style.overflowX
    const hasOverflow = overflowX === 'auto' || overflowX === 'scroll'
    const hasScrollableContent = element.scrollWidth > element.clientWidth

    if (hasOverflow && hasScrollableContent) {
      return element
    }
  }

  // Always return the root element as the scroll container
  // Never traverse up past the grid boundary
  return element
}

/**
 * Composable for managing scroll operations with performance optimizations
 */
export function useNuGridScroll<T extends TableData>(
  tableApi: Table<T>,
  rootRef?: Ref<InstanceType<typeof Primitive> | null | undefined> | null,
) {
  // Performance optimization: Memoize pinned column widths
  const pinnedLeftWidth = computed(() => {
    return tableApi
      .getLeftLeafColumns()
      .filter((col) => col.getIsPinned() === 'left')
      .reduce((sum, col) => sum + col.getSize(), 0)
  })

  const pinnedRightWidth = computed(() => {
    return tableApi
      .getRightLeafColumns()
      .filter((col) => col.getIsPinned() === 'right')
      .reduce((sum, col) => sum + col.getSize(), 0)
  })

  // Performance optimization: Memoize visible columns
  const visibleColumns = computed(() => {
    return tableApi.getAllLeafColumns().filter((col) => col.getIsVisible())
  })

  // Performance optimization: Pre-compute cumulative widths from right to left
  // This allows O(1) lookup instead of O(n) slice + reduce operations during scroll
  const cumulativeWidthsFromRight = computed(() => {
    const cols = visibleColumns.value
    const widths: number[] = Array.from({ length: cols.length })
    let cumulative = 0

    // Build array from right to left
    for (let i = cols.length - 1; i >= 0; i--) {
      const col = cols[i]
      if (col) {
        cumulative += col.getSize()
      }
      widths[i] = cumulative
    }

    return widths
  })

  const scrollManager = new NuGridScrollManager(
    tableApi,
    pinnedLeftWidth,
    pinnedRightWidth,
    visibleColumns,
    cumulativeWidthsFromRight,
  )

  const rootElement = computed<HTMLElement | null>(() => {
    if (!rootRef?.value) {
      return null
    }
    return (rootRef.value.$el as HTMLElement) ?? null
  })

  // Cache for scroll containers - avoid expensive DOM traversal on every scroll
  const scrollContainerCache = ref<{
    vertical: HTMLElement | null
    horizontal: HTMLElement | null
    rootElement: HTMLElement | null
  }>({
    vertical: null,
    horizontal: null,
    rootElement: null,
  })

  /**
   * Update the scroll container cache.
   * Called when root element changes or on resize.
   */
  function updateScrollContainerCache() {
    const root = rootElement.value
    scrollContainerCache.value = {
      vertical: findScrollContainer(root, 'vertical'),
      horizontal: findScrollContainer(root, 'horizontal'),
      rootElement: root,
    }
  }

  /**
   * Get the effective vertical scroll container (cached).
   */
  const verticalScrollContainer = computed<HTMLElement | null>(() => {
    const root = rootElement.value
    // Invalidate cache if root element changed
    if (scrollContainerCache.value.rootElement !== root) {
      updateScrollContainerCache()
    }
    return scrollContainerCache.value.vertical
  })

  /**
   * Get the effective horizontal scroll container (cached).
   */
  const horizontalScrollContainer = computed<HTMLElement | null>(() => {
    const root = rootElement.value
    // Invalidate cache if root element changed
    if (scrollContainerCache.value.rootElement !== root) {
      updateScrollContainerCache()
    }
    return scrollContainerCache.value.horizontal
  })

  // Watch for size changes to invalidate scroll container cache
  // (overflow state may change when content size changes)
  const { height: observedHeight } = useElementSize(rootElement, undefined, { box: 'border-box' })

  watch(observedHeight, () => {
    // Invalidate scroll container cache on resize - overflow state may have changed
    updateScrollContainerCache()
  })

  return {
    scrollManager,
    pinnedLeftWidth,
    pinnedRightWidth,
    visibleColumns,
    // Scroll containers
    verticalScrollContainer,
    horizontalScrollContainer,
    updateScrollContainerCache,
  }
}
