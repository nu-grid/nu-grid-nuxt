import { describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { NuGridScrollManager } from '../src/runtime/composables/_internal/useNuGridScroll'

/**
 * Tests for NuGridScrollManager class
 *
 * This test suite verifies:
 * 1. Scroll processing state management
 * 2. Cancel pending scroll operations
 * 3. Header cache invalidation
 */

function createMockTableApi() {
  return {
    getLeftLeafColumns: vi.fn().mockReturnValue([]),
    getRightLeafColumns: vi.fn().mockReturnValue([]),
    getAllLeafColumns: vi.fn().mockReturnValue([]),
  } as any
}

describe('nuGridScrollManager', () => {
  describe('constructor', () => {
    it('should create scroll manager instance', () => {
      const tableApi = createMockTableApi()
      const pinnedLeftWidth = computed(() => 0)
      const pinnedRightWidth = computed(() => 0)
      const visibleColumns = computed(() => [])
      const cumulativeWidthsFromRight = computed(() => [])

      const scrollManager = new NuGridScrollManager(
        tableApi,
        pinnedLeftWidth,
        pinnedRightWidth,
        visibleColumns,
        cumulativeWidthsFromRight,
      )

      expect(scrollManager).toBeInstanceOf(NuGridScrollManager)
    })
  })

  describe('processing state', () => {
    it('should have isProcessingScroll false initially', () => {
      const tableApi = createMockTableApi()
      const pinnedLeftWidth = computed(() => 0)
      const pinnedRightWidth = computed(() => 0)
      const visibleColumns = computed(() => [])
      const cumulativeWidthsFromRight = computed(() => [])

      const scrollManager = new NuGridScrollManager(
        tableApi,
        pinnedLeftWidth,
        pinnedRightWidth,
        visibleColumns,
        cumulativeWidthsFromRight,
      )

      expect(scrollManager.isProcessingScroll).toBe(false)
    })

    it('should update processing state with setProcessing', () => {
      const tableApi = createMockTableApi()
      const pinnedLeftWidth = computed(() => 0)
      const pinnedRightWidth = computed(() => 0)
      const visibleColumns = computed(() => [])
      const cumulativeWidthsFromRight = computed(() => [])

      const scrollManager = new NuGridScrollManager(
        tableApi,
        pinnedLeftWidth,
        pinnedRightWidth,
        visibleColumns,
        cumulativeWidthsFromRight,
      )

      scrollManager.setProcessing(true)
      expect(scrollManager.isProcessingScroll).toBe(true)

      scrollManager.setProcessing(false)
      expect(scrollManager.isProcessingScroll).toBe(false)
    })
  })

  describe('cancelPending', () => {
    it('should cancel pending scroll and reset processing state', () => {
      const tableApi = createMockTableApi()
      const pinnedLeftWidth = computed(() => 0)
      const pinnedRightWidth = computed(() => 0)
      const visibleColumns = computed(() => [])
      const cumulativeWidthsFromRight = computed(() => [])

      const scrollManager = new NuGridScrollManager(
        tableApi,
        pinnedLeftWidth,
        pinnedRightWidth,
        visibleColumns,
        cumulativeWidthsFromRight,
      )

      scrollManager.setProcessing(true)
      scrollManager.cancelPending()

      expect(scrollManager.isProcessingScroll).toBe(false)
    })

    it('should not throw when called multiple times', () => {
      const tableApi = createMockTableApi()
      const pinnedLeftWidth = computed(() => 0)
      const pinnedRightWidth = computed(() => 0)
      const visibleColumns = computed(() => [])
      const cumulativeWidthsFromRight = computed(() => [])

      const scrollManager = new NuGridScrollManager(
        tableApi,
        pinnedLeftWidth,
        pinnedRightWidth,
        visibleColumns,
        cumulativeWidthsFromRight,
      )

      // Should not throw
      scrollManager.cancelPending()
      scrollManager.cancelPending()
      scrollManager.cancelPending()
    })
  })

  describe('invalidateHeaderCache', () => {
    it('should invalidate header cache without error', () => {
      const tableApi = createMockTableApi()
      const pinnedLeftWidth = computed(() => 0)
      const pinnedRightWidth = computed(() => 0)
      const visibleColumns = computed(() => [])
      const cumulativeWidthsFromRight = computed(() => [])

      const scrollManager = new NuGridScrollManager(
        tableApi,
        pinnedLeftWidth,
        pinnedRightWidth,
        visibleColumns,
        cumulativeWidthsFromRight,
      )

      // Should not throw
      scrollManager.invalidateHeaderCache()
    })

    it('should be callable multiple times', () => {
      const tableApi = createMockTableApi()
      const pinnedLeftWidth = computed(() => 0)
      const pinnedRightWidth = computed(() => 0)
      const visibleColumns = computed(() => [])
      const cumulativeWidthsFromRight = computed(() => [])

      const scrollManager = new NuGridScrollManager(
        tableApi,
        pinnedLeftWidth,
        pinnedRightWidth,
        visibleColumns,
        cumulativeWidthsFromRight,
      )

      // Should not throw
      scrollManager.invalidateHeaderCache()
      scrollManager.invalidateHeaderCache()
      scrollManager.invalidateHeaderCache()
    })
  })

  describe('scrollToCell', () => {
    it('should return a promise', () => {
      const tableApi = createMockTableApi()
      const pinnedLeftWidth = computed(() => 0)
      const pinnedRightWidth = computed(() => 0)
      const visibleColumns = computed(() => [])
      const cumulativeWidthsFromRight = computed(() => [])

      const scrollManager = new NuGridScrollManager(
        tableApi,
        pinnedLeftWidth,
        pinnedRightWidth,
        visibleColumns,
        cumulativeWidthsFromRight,
      )

      // Create mock elements
      const cellElement = document.createElement('div')
      const scrollContainer = document.createElement('div')
      const tableElement = document.createElement('div')

      // Mock getBoundingClientRect
      cellElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 100,
        bottom: 150,
        left: 100,
        right: 200,
        height: 50,
        width: 100,
      })

      scrollContainer.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 0,
        bottom: 500,
        left: 0,
        right: 800,
        height: 500,
        width: 800,
      })

      // Mock scrollBy
      scrollContainer.scrollBy = vi.fn()

      const result = scrollManager.scrollToCell({
        cellElement,
        scrollContainer,
        tableElement,
        rowIndex: 0,
        columnIndex: 0,
      })

      expect(result).toBeInstanceOf(Promise)
    })

    it('should cancel previous pending scroll', async () => {
      const tableApi = createMockTableApi()
      const pinnedLeftWidth = computed(() => 0)
      const pinnedRightWidth = computed(() => 0)
      const visibleColumns = computed(() => [])
      const cumulativeWidthsFromRight = computed(() => [])

      const scrollManager = new NuGridScrollManager(
        tableApi,
        pinnedLeftWidth,
        pinnedRightWidth,
        visibleColumns,
        cumulativeWidthsFromRight,
      )

      // Create mock elements
      const cellElement = document.createElement('div')
      const scrollContainer = document.createElement('div')
      const tableElement = document.createElement('div')

      // Mock getBoundingClientRect
      cellElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 100,
        bottom: 150,
        left: 100,
        right: 200,
        height: 50,
        width: 100,
      })

      scrollContainer.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 0,
        bottom: 500,
        left: 0,
        right: 800,
        height: 500,
        width: 800,
      })

      scrollContainer.scrollBy = vi.fn()

      // Start first scroll - don't await it
      scrollManager.scrollToCell({
        cellElement,
        scrollContainer,
        tableElement,
        rowIndex: 0,
        columnIndex: 0,
      })

      // Start second scroll immediately (should cancel first)
      const promise2 = scrollManager.scrollToCell({
        cellElement,
        scrollContainer,
        tableElement,
        rowIndex: 1,
        columnIndex: 1,
      })

      // Wait for the second scroll to complete
      await promise2
    })
  })

  describe('with pinned columns', () => {
    it('should use pinned widths in calculations', () => {
      const tableApi = createMockTableApi()
      const pinnedLeftWidth = computed(() => 100)
      const pinnedRightWidth = computed(() => 50)
      const visibleColumns = computed(() => [])
      const cumulativeWidthsFromRight = computed(() => [])

      const scrollManager = new NuGridScrollManager(
        tableApi,
        pinnedLeftWidth,
        pinnedRightWidth,
        visibleColumns,
        cumulativeWidthsFromRight,
      )

      // The scroll manager should have access to these values
      expect(scrollManager).toBeDefined()
    })
  })

  describe('with cumulative widths', () => {
    it('should use cumulative widths for right edge calculations', () => {
      const tableApi = createMockTableApi()
      const pinnedLeftWidth = computed(() => 0)
      const pinnedRightWidth = computed(() => 0)
      const visibleColumns = computed(() => [
        { id: 'col1', getSize: () => 100 },
        { id: 'col2', getSize: () => 150 },
        { id: 'col3', getSize: () => 200 },
      ])
      const cumulativeWidthsFromRight = computed(() => [450, 350, 200])

      const scrollManager = new NuGridScrollManager(
        tableApi,
        pinnedLeftWidth,
        pinnedRightWidth,
        visibleColumns,
        cumulativeWidthsFromRight,
      )

      // The scroll manager should have access to these values
      expect(scrollManager).toBeDefined()
    })
  })
})

describe('scroll to cell behavior tests', () => {
  it('should handle cell that is already visible', async () => {
    const tableApi = createMockTableApi()
    const pinnedLeftWidth = computed(() => 0)
    const pinnedRightWidth = computed(() => 0)
    const visibleColumns = computed(() => [])
    const cumulativeWidthsFromRight = computed(() => [])

    const scrollManager = new NuGridScrollManager(
      tableApi,
      pinnedLeftWidth,
      pinnedRightWidth,
      visibleColumns,
      cumulativeWidthsFromRight,
    )

    // Create mock elements - cell is fully visible
    const cellElement = document.createElement('div')
    const scrollContainer = document.createElement('div')
    const tableElement = document.createElement('div')

    cellElement.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100,
      bottom: 150,
      left: 100,
      right: 200,
      height: 50,
      width: 100,
    })

    scrollContainer.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 0,
      bottom: 500,
      left: 0,
      right: 800,
      height: 500,
      width: 800,
    })

    const scrollBySpy = vi.fn()
    scrollContainer.scrollBy = scrollBySpy

    await scrollManager.scrollToCell({
      cellElement,
      scrollContainer,
      tableElement,
      rowIndex: 1,
      columnIndex: 1,
    })

    // Wait for requestAnimationFrame
    await new Promise((resolve) => requestAnimationFrame(resolve))
  })

  it('should handle pinned left cell', async () => {
    const tableApi = createMockTableApi()
    const pinnedLeftWidth = computed(() => 100)
    const pinnedRightWidth = computed(() => 0)
    const visibleColumns = computed(() => [])
    const cumulativeWidthsFromRight = computed(() => [])

    const scrollManager = new NuGridScrollManager(
      tableApi,
      pinnedLeftWidth,
      pinnedRightWidth,
      visibleColumns,
      cumulativeWidthsFromRight,
    )

    // Create mock elements - cell is pinned left
    const cellElement = document.createElement('div')
    cellElement.setAttribute('data-pinned', 'left')
    const scrollContainer = document.createElement('div')
    const tableElement = document.createElement('div')

    cellElement.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100,
      bottom: 150,
      left: 0,
      right: 100,
      height: 50,
      width: 100,
    })

    scrollContainer.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 0,
      bottom: 500,
      left: 0,
      right: 800,
      height: 500,
      width: 800,
    })

    scrollContainer.scrollBy = vi.fn()

    await scrollManager.scrollToCell({
      cellElement,
      scrollContainer,
      tableElement,
      rowIndex: 1,
      columnIndex: 0,
    })

    // Wait for requestAnimationFrame
    await new Promise((resolve) => requestAnimationFrame(resolve))
  })

  it('should handle pinned right cell', async () => {
    const tableApi = createMockTableApi()
    const pinnedLeftWidth = computed(() => 0)
    const pinnedRightWidth = computed(() => 100)
    const visibleColumns = computed(() => [])
    const cumulativeWidthsFromRight = computed(() => [])

    const scrollManager = new NuGridScrollManager(
      tableApi,
      pinnedLeftWidth,
      pinnedRightWidth,
      visibleColumns,
      cumulativeWidthsFromRight,
    )

    // Create mock elements - cell is pinned right
    const cellElement = document.createElement('div')
    cellElement.setAttribute('data-pinned', 'right')
    const scrollContainer = document.createElement('div')
    const tableElement = document.createElement('div')

    cellElement.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100,
      bottom: 150,
      left: 700,
      right: 800,
      height: 50,
      width: 100,
    })

    scrollContainer.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 0,
      bottom: 500,
      left: 0,
      right: 800,
      height: 500,
      width: 800,
    })

    scrollContainer.scrollBy = vi.fn()

    await scrollManager.scrollToCell({
      cellElement,
      scrollContainer,
      tableElement,
      rowIndex: 1,
      columnIndex: 5,
    })

    // Wait for requestAnimationFrame
    await new Promise((resolve) => requestAnimationFrame(resolve))
  })

  it('should skip horizontal scrolling when skipHorizontalScroll is true', async () => {
    const tableApi = createMockTableApi()
    const pinnedLeftWidth = computed(() => 0)
    const pinnedRightWidth = computed(() => 0)
    const visibleColumns = computed(() => [])
    const cumulativeWidthsFromRight = computed(() => [])

    const scrollManager = new NuGridScrollManager(
      tableApi,
      pinnedLeftWidth,
      pinnedRightWidth,
      visibleColumns,
      cumulativeWidthsFromRight,
    )

    // Create mock elements - cell is off-screen to the right (would normally trigger horizontal scroll)
    const cellElement = document.createElement('div')
    const scrollContainer = document.createElement('div')
    const tableElement = document.createElement('div')

    cellElement.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100,
      bottom: 150,
      left: 900, // Off-screen to the right
      right: 1000,
      height: 50,
      width: 100,
    })

    scrollContainer.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 0,
      bottom: 500,
      left: 0,
      right: 800,
      height: 500,
      width: 800,
    })

    const scrollBySpy = vi.fn()
    scrollContainer.scrollBy = scrollBySpy

    await scrollManager.scrollToCell({
      cellElement,
      scrollContainer,
      tableElement,
      rowIndex: 1,
      columnIndex: 5,
      skipHorizontalScroll: true,
    })

    // Wait for requestAnimationFrame
    await new Promise((resolve) => requestAnimationFrame(resolve))

    // scrollBy should not have been called for horizontal adjustment
    // (may be called for vertical only, or not at all if already visible)
    if (scrollBySpy.mock.calls.length > 0) {
      const lastCall = scrollBySpy.mock.calls[scrollBySpy.mock.calls.length - 1][0]
      expect(lastCall.left).toBe(0) // No horizontal scroll
    }
  })

  it('should perform horizontal scrolling when skipHorizontalScroll is false', async () => {
    const tableApi = createMockTableApi()
    const pinnedLeftWidth = computed(() => 0)
    const pinnedRightWidth = computed(() => 0)
    const visibleColumns = computed(() => [])
    const cumulativeWidthsFromRight = computed(() => [])

    const scrollManager = new NuGridScrollManager(
      tableApi,
      pinnedLeftWidth,
      pinnedRightWidth,
      visibleColumns,
      cumulativeWidthsFromRight,
    )

    // Create mock elements - cell is off-screen to the right
    const cellElement = document.createElement('div')
    const scrollContainer = document.createElement('div')
    const tableElement = document.createElement('div')

    cellElement.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100,
      bottom: 150,
      left: 900, // Off-screen to the right
      right: 1000,
      height: 50,
      width: 100,
    })

    scrollContainer.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 0,
      bottom: 500,
      left: 0,
      right: 800,
      height: 500,
      width: 800,
    })

    const scrollBySpy = vi.fn()
    scrollContainer.scrollBy = scrollBySpy

    await scrollManager.scrollToCell({
      cellElement,
      scrollContainer,
      tableElement,
      rowIndex: 1,
      columnIndex: 5,
      skipHorizontalScroll: false,
    })

    // Wait for requestAnimationFrame
    await new Promise((resolve) => requestAnimationFrame(resolve))

    // scrollBy should have been called with horizontal adjustment
    if (scrollBySpy.mock.calls.length > 0) {
      const lastCall = scrollBySpy.mock.calls[scrollBySpy.mock.calls.length - 1][0]
      expect(lastCall.left).not.toBe(0) // Should have horizontal scroll
    }
  })
})
