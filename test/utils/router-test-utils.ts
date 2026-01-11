import type { TableData } from '@nuxt/ui'
import type { Cell, Row } from '@tanstack/vue-table'
import type {
  NuGridCellClickContext,
  NuGridInteractionRouter,
} from '../../src/runtime/types/_internal'
import { vi } from 'vitest'
import { useNuGridInteractionRouter } from '../../src/runtime/composables/_internal/useNuGridInteractionRouter'

/**
 * Test utilities for NuGrid interaction router
 * Makes it easy to test features that use the router
 */

export interface RouterTestUtils<T extends TableData = TableData> {
  /** The interaction router instance */
  router: NuGridInteractionRouter<T>

  /** Spy that tracks all dispatched events */
  dispatchSpy: ReturnType<typeof vi.fn>

  /** Get currently registered handlers by type */
  getRegisteredHandlers: () => {
    cellClick: Array<{ id: string; priority: number }>
    cellDoubleClick: Array<{ id: string; priority: number }>
    contextMenu: Array<{ id: string; priority: number }>
    wheel: Array<{ id: string; priority: number }>
    globalPointer: Array<{ id: string; priority: number }>
    hover: Array<{ id: string; priority: number }>
  }

  /** Simulate a cell click event */
  simulateCellClick: (
    row: Row<T>,
    cell: Cell<T, any>,
    cellIndex?: number,
    event?: Partial<MouseEvent>,
  ) => void

  /** Simulate a cell double-click event */
  simulateCellDoubleClick: (
    row: Row<T>,
    cell: Cell<T, any>,
    cellIndex?: number,
    event?: Partial<MouseEvent>,
  ) => void

  /** Simulate a context menu event */
  simulateContextMenu: (
    row: Row<T>,
    cell: Cell<T, any>,
    cellIndex?: number,
    event?: Partial<MouseEvent>,
  ) => void

  /** Simulate a wheel event */
  simulateWheel: (
    row: Row<T>,
    cell: Cell<T, any>,
    cellIndex?: number,
    event?: Partial<WheelEvent>,
  ) => void

  /** Simulate a global pointer down event */
  simulatePointerDown: (event?: Partial<PointerEvent>) => void

  /** Simulate a hover event */
  simulateHover: (
    target: HTMLElement,
    type: 'enter' | 'leave' | 'move',
    event?: Partial<MouseEvent>,
  ) => void

  /** Get the last event that was dispatched */
  getLastDispatch: () => {
    type: 'cellClick' | 'cellDoubleClick' | 'contextMenu' | 'wheel' | 'pointerDown' | 'hover' | null
    context: any
  } | null

  /** Clear dispatch history */
  clearDispatchHistory: () => void

  /** Enable debug mode */
  enableDebug: () => void

  /** Disable debug mode */
  disableDebug: () => void
}

/**
 * Create a test router with spies and utilities
 */
export function createTestRouter<T extends TableData = TableData>(
  options: { debug?: boolean } = {},
): RouterTestUtils<T> {
  const router = useNuGridInteractionRouter<T>(options)
  const dispatchSpy = vi.fn()
  let lastDispatch: {
    type: 'cellClick' | 'cellDoubleClick' | 'contextMenu' | 'wheel' | 'pointerDown' | 'hover' | null
    context: any
  } | null = null

  // Wrap routeCellClick to track calls
  const originalRouteCellClick = router.routeCellClick
  router.routeCellClick = (context: NuGridCellClickContext<T>) => {
    dispatchSpy('cellClick', context)
    lastDispatch = { type: 'cellClick', context }
    return originalRouteCellClick(context)
  }

  // Wrap routeCellDoubleClick to track calls
  const originalRouteCellDoubleClick = router.routeCellDoubleClick
  router.routeCellDoubleClick = (context: NuGridCellClickContext<T>) => {
    dispatchSpy('cellDoubleClick', context)
    lastDispatch = { type: 'cellDoubleClick', context }
    return originalRouteCellDoubleClick(context)
  }

  // Wrap routeContextMenu to track calls
  const originalRouteContextMenu = router.routeContextMenu
  router.routeContextMenu = (context: NuGridCellClickContext<T>) => {
    dispatchSpy('contextMenu', context)
    lastDispatch = { type: 'contextMenu', context }
    return originalRouteContextMenu(context)
  }

  // Wrap routeWheel to track calls
  const originalRouteWheel = router.routeWheel
  router.routeWheel = (context) => {
    dispatchSpy('wheel', context)
    lastDispatch = { type: 'wheel', context }
    return originalRouteWheel(context)
  }

  // Helper to simulate cell click
  function simulateCellClick(
    row: Row<T>,
    cell: Cell<T, any>,
    cellIndex = 0,
    event?: Partial<MouseEvent>,
  ) {
    const clickEvent =
      (event as MouseEvent)
      || new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      })

    router.routeCellClick({
      event: clickEvent,
      row,
      cell,
      cellIndex,
    })
  }

  // Helper to simulate cell double-click
  function simulateCellDoubleClick(
    row: Row<T>,
    cell: Cell<T, any>,
    cellIndex = 0,
    event?: Partial<MouseEvent>,
  ) {
    const dblClickEvent =
      (event as MouseEvent)
      || new MouseEvent('dblclick', {
        bubbles: true,
        cancelable: true,
      })

    router.routeCellDoubleClick({
      event: dblClickEvent,
      row,
      cell,
      cellIndex,
    })
  }

  // Helper to simulate context menu
  function simulateContextMenu(
    row: Row<T>,
    cell: Cell<T, any>,
    cellIndex = 0,
    event?: Partial<MouseEvent>,
  ) {
    const contextMenuEvent =
      (event as MouseEvent)
      || new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
      })

    router.routeContextMenu({
      event: contextMenuEvent,
      row,
      cell,
      cellIndex,
    })
  }

  // Helper to simulate wheel
  function simulateWheel(
    row: Row<T>,
    cell: Cell<T, any>,
    cellIndex = 0,
    eventOptions?: Partial<WheelEvent>,
  ) {
    const wheelEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      ...eventOptions,
    })

    router.routeWheel({
      event: wheelEvent,
      row,
      cell,
      cellIndex,
    })
  }

  // Helper to simulate pointer down
  function simulatePointerDown(eventOptions: Partial<PointerEvent> = {}) {
    const event = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      ...eventOptions,
    })

    dispatchSpy('pointerDown', { event })
    lastDispatch = { type: 'pointerDown', context: { event } }

    // Trigger document listener
    document.dispatchEvent(event)
  }

  // Helper to simulate hover
  function simulateHover(
    target: HTMLElement,
    type: 'enter' | 'leave' | 'move',
    eventOptions: Partial<MouseEvent> = {},
  ) {
    const eventType = type === 'enter' ? 'mouseover' : type === 'leave' ? 'mouseout' : 'mousemove'
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      ...eventOptions,
    })

    Object.defineProperty(event, 'target', { value: target, enumerable: true })

    dispatchSpy('hover', { event, target, type })
    lastDispatch = { type: 'hover', context: { event, target, type } }

    // Note: Hover events require grid root to be set
    // Users should call router.setGridRoot() in their tests
  }

  // Get registered handlers (we track this ourselves since router internals are private)
  const registeredHandlers = {
    cellClick: new Map<string, { id: string; priority: number }>(),
    cellDoubleClick: new Map<string, { id: string; priority: number }>(),
    contextMenu: new Map<string, { id: string; priority: number }>(),
    wheel: new Map<string, { id: string; priority: number }>(),
    globalPointer: new Map<string, { id: string; priority: number }>(),
    hover: new Map<string, { id: string; priority: number }>(),
  }

  // Wrap registration methods to track handlers
  const originalRegisterCellClick = router.registerCellClickHandler
  router.registerCellClickHandler = (handler) => {
    registeredHandlers.cellClick.set(handler.id, { id: handler.id, priority: handler.priority })
    const unregister = originalRegisterCellClick(handler)
    return () => {
      registeredHandlers.cellClick.delete(handler.id)
      return unregister()
    }
  }

  const originalRegisterCellDoubleClick = router.registerCellDoubleClickHandler
  router.registerCellDoubleClickHandler = (handler) => {
    registeredHandlers.cellDoubleClick.set(handler.id, {
      id: handler.id,
      priority: handler.priority,
    })
    const unregister = originalRegisterCellDoubleClick(handler)
    return () => {
      registeredHandlers.cellDoubleClick.delete(handler.id)
      return unregister()
    }
  }

  const originalRegisterContextMenu = router.registerContextMenuHandler
  router.registerContextMenuHandler = (handler) => {
    registeredHandlers.contextMenu.set(handler.id, { id: handler.id, priority: handler.priority })
    const unregister = originalRegisterContextMenu(handler)
    return () => {
      registeredHandlers.contextMenu.delete(handler.id)
      return unregister()
    }
  }

  const originalRegisterWheel = router.registerWheelHandler
  router.registerWheelHandler = (handler) => {
    registeredHandlers.wheel.set(handler.id, { id: handler.id, priority: handler.priority })
    const unregister = originalRegisterWheel(handler)
    return () => {
      registeredHandlers.wheel.delete(handler.id)
      return unregister()
    }
  }

  const originalRegisterGlobalPointer = router.registerGlobalPointerHandler
  router.registerGlobalPointerHandler = (handler) => {
    registeredHandlers.globalPointer.set(handler.id, { id: handler.id, priority: handler.priority })
    const unregister = originalRegisterGlobalPointer(handler)
    return () => {
      registeredHandlers.globalPointer.delete(handler.id)
      return unregister()
    }
  }

  const originalRegisterHover = router.registerHoverHandler
  router.registerHoverHandler = (handler) => {
    registeredHandlers.hover.set(handler.id, { id: handler.id, priority: handler.priority })
    const unregister = originalRegisterHover(handler)
    return () => {
      registeredHandlers.hover.delete(handler.id)
      return unregister()
    }
  }

  function getRegisteredHandlers() {
    return {
      cellClick: Array.from(registeredHandlers.cellClick.values()),
      cellDoubleClick: Array.from(registeredHandlers.cellDoubleClick.values()),
      contextMenu: Array.from(registeredHandlers.contextMenu.values()),
      wheel: Array.from(registeredHandlers.wheel.values()),
      globalPointer: Array.from(registeredHandlers.globalPointer.values()),
      hover: Array.from(registeredHandlers.hover.values()),
    }
  }

  function getLastDispatch() {
    return lastDispatch
  }

  function clearDispatchHistory() {
    dispatchSpy.mockClear()
    lastDispatch = null
  }

  function enableDebug() {
    // Note: Debug mode is set at construction time
    // This is a no-op but could be extended if needed
    console.warn('[Router Test Utils] Debug mode must be set during router creation')
  }

  function disableDebug() {
    // Note: Debug mode is set at construction time
    console.warn('[Router Test Utils] Debug mode must be set during router creation')
  }

  return {
    router,
    dispatchSpy,
    getRegisteredHandlers,
    simulateCellClick,
    simulateCellDoubleClick,
    simulateContextMenu,
    simulateWheel,
    simulatePointerDown,
    simulateHover,
    getLastDispatch,
    clearDispatchHistory,
    enableDebug,
    disableDebug,
  }
}

/**
 * Create a mock Row for testing
 */
export function createMockRow<T extends TableData>(
  data: T,
  options: {
    id?: string
    index?: number
    depth?: number
    subRows?: Row<T>[]
  } = {},
): Row<T> {
  const { id = 'row-0', index = 0, depth = 0, subRows = [] } = options

  // Create mock cells for this row
  const mockCells = Object.keys(data as object).map((columnId) =>
    createMockCell<T>(
      { id, index, depth, original: data } as Row<T>,
      columnId,
      (data as any)[columnId],
    ),
  )

  return {
    id,
    index,
    depth,
    original: data,
    getValue: (columnId: string) => (data as any)[columnId],
    getIsSelected: () => false,
    getIsGrouped: () => false,
    getIsExpanded: () => false,
    getCanExpand: () => subRows.length > 0,
    getVisibleCells: () => mockCells,
    getAllCells: () => mockCells,
    subRows,
    // Add other required Row properties as needed
  } as Row<T>
}

/**
 * Create a mock Cell for testing
 */
export function createMockCell<T extends TableData>(
  row: Row<T>,
  columnId: string,
  value?: any,
): Cell<T, any> {
  return {
    id: `${row.id}-${columnId}`,
    row,
    column: {
      id: columnId,
      columnDef: {
        id: columnId,
        accessorKey: columnId,
      },
    } as any,
    getValue: () => value ?? row.getValue(columnId),
    getContext: () => ({ row, column: { id: columnId } as any, cell: null as any }),
  } as Cell<T, any>
}

/**
 * Wait for next animation frame (useful for RAF-throttled events)
 */
export function waitForAnimationFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

/**
 * Wait for multiple animation frames
 */
export async function waitForAnimationFrames(count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await waitForAnimationFrame()
  }
}
