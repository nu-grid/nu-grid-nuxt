import type { TableData } from '@nuxt/ui'
import type { NuGridEventEmitter } from '../../types'
import type {
  NuGridCellClickContext,
  NuGridHoverHandler,
  NuGridInteractionHandler,
  NuGridInteractionRouter,
  NuGridKeyboardConfig,
  NuGridKeyboardContext,
  NuGridKeyboardHandler,
  NuGridPointerHandler,
  NuGridWheelContext,
  NuGridWheelHandler,
} from '../../types/_internal'
import { ref } from 'vue'

interface RouterOptions<T extends TableData = TableData> {
  debug?: boolean
  eventEmitter?: NuGridEventEmitter<T>
}

interface GenericHandler {
  id: string
  priority: number
  when?: (context: any) => boolean
  handle: (context: any) => any
}

/**
 * Compare two handlers for sorting
 * Returns: negative if a < b, positive if a > b, 0 if equal
 */
function compareHandlers(a: GenericHandler, b: GenericHandler): number {
  if (a.priority !== b.priority) {
    return a.priority - b.priority
  }
  return a.id.localeCompare(b.id)
}

/**
 * Insert handler at correct position using binary search
 * O(log n) complexity - faster than re-sorting entire array
 */
function insertHandler(handlers: GenericHandler[], newHandler: GenericHandler): void {
  let left = 0
  let right = handlers.length

  // Binary search to find insertion point
  while (left < right) {
    const mid = Math.floor((left + right) / 2)
    const comparison = compareHandlers(handlers[mid]!, newHandler)

    if (comparison < 0) {
      left = mid + 1
    } else {
      right = mid
    }
  }

  // Insert at the correct position
  handlers.splice(left, 0, newHandler)
}

/** Generic dispatch function for all handler types */
function dispatchHandlers(
  handlers: GenericHandler[],
  context: { event: Event; [key: string]: any },
  debug = false,
): { handlerId: string | null; stopped: boolean } {
  if (debug && handlers.length > 0) {
    console.log(
      `[Router] 📋 Dispatching ${context.event.type} to ${handlers.length} handler(s):`,
      handlers.map((h) => `${h.id}(p:${h.priority})`).join(', '),
    )
  }

  for (const handler of handlers) {
    if (handler.when && !handler.when(context)) {
      if (debug) console.log(`[Router] ⏭️  Skipped: ${handler.id} (when returned false)`)
      continue
    }

    if (debug) console.log(`[Router] ▶️  Executing: ${handler.id}`)
    const result = handler.handle(context) || {}

    if (result.preventDefault) {
      context.event.preventDefault()
      if (debug) console.log(`[Router] 🛑 ${handler.id} called preventDefault()`)
    }

    if (result.stopPropagation) {
      context.event.stopPropagation()
      if (debug) console.log(`[Router] 🛑 ${handler.id} called stopPropagation()`)
    }

    const shouldStop = Boolean(
      result.stop
      || result.handled
      || context.event.defaultPrevented
      || (context.event as any).cancelBubble,
    )

    if (shouldStop) {
      if (debug) {
        const reason = result.stop
          ? 'stop: true'
          : result.handled
            ? 'handled: true'
            : context.event.defaultPrevented
              ? 'defaultPrevented'
              : 'cancelBubble'
        console.log(`[Router] ✋ Claimed by: ${handler.id} (${reason})`)
      }
      return { handlerId: handler.id, stopped: true }
    }
  }

  if (debug) console.log('[Router] ℹ️  Event unclaimed - passed through all handlers')
  return { handlerId: null, stopped: false }
}

export function useNuGridInteractionRouter<T extends TableData>(
  options: RouterOptions<T> = {},
): NuGridInteractionRouter<T> {
  const { debug = false, eventEmitter } = options
  const cellClickHandlers = ref<NuGridInteractionHandler<T>[]>([])
  const cellDoubleClickHandlers = ref<NuGridInteractionHandler<T>[]>([])
  const contextMenuHandlers = ref<NuGridInteractionHandler<T>[]>([])
  const wheelHandlers = ref<NuGridWheelHandler<T>[]>([])
  const globalPointerHandlers = ref<NuGridPointerHandler[]>([])
  const hoverHandlers = ref<NuGridHoverHandler[]>([])
  const keyboardHandlers = ref<NuGridKeyboardHandler<T>[]>([])
  const registeredIds = new Set<string>()
  let removePointerListener: (() => void) | null = null
  let removeHoverListeners: (() => void) | null = null
  let removeKeyboardListener: (() => void) | null = null
  let removeKeyupListener: (() => void) | null = null
  let removeDocumentKeyboardListener: (() => void) | null = null
  const documentLevelHandlerIds = new Set<string>()
  let keyboardConfig: NuGridKeyboardConfig<T> | null = null
  let gridRoot: HTMLElement | null = null

  function registerCellClickHandler(handler: NuGridInteractionHandler<T>) {
    if (registeredIds.has(handler.id)) {
      throw new Error(`[Router] Handler with id "${handler.id}" already registered`)
    }

    registeredIds.add(handler.id)
    insertHandler(cellClickHandlers.value as GenericHandler[], handler)

    return () => {
      registeredIds.delete(handler.id)
      const index = cellClickHandlers.value.findIndex((item) => item.id === handler.id)
      if (index !== -1) {
        cellClickHandlers.value.splice(index, 1)
      }
    }
  }

  function routeCellClick(context: NuGridCellClickContext<T>) {
    dispatchHandlers(cellClickHandlers.value as GenericHandler[], context, debug)

    // Emit click events after handlers have processed
    // Check each handler exists before computing payload to avoid overhead when no listeners
    if (eventEmitter?.cellClicked) {
      const { row, cell, event } = context
      eventEmitter.cellClicked({ row, column: cell.column, cell, value: cell.getValue(), event })
    }
    if (eventEmitter?.rowClicked) {
      const { row, event } = context
      eventEmitter.rowClicked({ row, event })
    }
  }

  function registerCellDoubleClickHandler(handler: NuGridInteractionHandler<T>) {
    if (registeredIds.has(handler.id)) {
      throw new Error(`[Router] Handler with id "${handler.id}" already registered`)
    }

    registeredIds.add(handler.id)
    insertHandler(cellDoubleClickHandlers.value as GenericHandler[], handler)

    return () => {
      registeredIds.delete(handler.id)
      const index = cellDoubleClickHandlers.value.findIndex((item) => item.id === handler.id)
      if (index !== -1) {
        cellDoubleClickHandlers.value.splice(index, 1)
      }
    }
  }

  function routeCellDoubleClick(context: NuGridCellClickContext<T>) {
    dispatchHandlers(cellDoubleClickHandlers.value as GenericHandler[], context, debug)

    // Emit double-click events after handlers have processed
    // Check each handler exists before computing payload to avoid overhead when no listeners
    if (eventEmitter?.cellDoubleClicked) {
      const { row, cell, event } = context
      eventEmitter.cellDoubleClicked({
        row,
        column: cell.column,
        cell,
        value: cell.getValue(),
        event,
      })
    }
    if (eventEmitter?.rowDoubleClicked) {
      const { row, event } = context
      eventEmitter.rowDoubleClicked({ row, event })
    }
  }

  function registerContextMenuHandler(handler: NuGridInteractionHandler<T>) {
    if (registeredIds.has(handler.id)) {
      throw new Error(`[Router] Handler with id "${handler.id}" already registered`)
    }

    registeredIds.add(handler.id)
    insertHandler(contextMenuHandlers.value as GenericHandler[], handler)

    return () => {
      registeredIds.delete(handler.id)
      const index = contextMenuHandlers.value.findIndex((item) => item.id === handler.id)
      if (index !== -1) {
        contextMenuHandlers.value.splice(index, 1)
      }
    }
  }

  function routeContextMenu(context: NuGridCellClickContext<T>) {
    dispatchHandlers(contextMenuHandlers.value as GenericHandler[], context, debug)
  }

  function registerWheelHandler(handler: NuGridWheelHandler<T>) {
    if (registeredIds.has(handler.id)) {
      throw new Error(`[Router] Handler with id "${handler.id}" already registered`)
    }

    registeredIds.add(handler.id)
    insertHandler(wheelHandlers.value as GenericHandler[], handler)

    return () => {
      registeredIds.delete(handler.id)
      const index = wheelHandlers.value.findIndex((item) => item.id === handler.id)
      if (index !== -1) {
        wheelHandlers.value.splice(index, 1)
      }
    }
  }

  function routeWheel(context: NuGridWheelContext<T>) {
    dispatchHandlers(wheelHandlers.value as GenericHandler[], context, debug)
  }

  function ensurePointerListener() {
    if (removePointerListener || typeof document === 'undefined') {
      return
    }

    const listener = (event: PointerEvent) => {
      if (!globalPointerHandlers.value.length) {
        return
      }
      dispatchHandlers(globalPointerHandlers.value as GenericHandler[], { event }, debug)
    }

    document.addEventListener('pointerdown', listener, true)
    removePointerListener = () => {
      document.removeEventListener('pointerdown', listener, true)
      removePointerListener = null
    }
  }

  function registerGlobalPointerHandler(handler: NuGridPointerHandler) {
    if (registeredIds.has(handler.id)) {
      throw new Error(`[Router] Handler with id "${handler.id}" already registered`)
    }

    registeredIds.add(handler.id)
    insertHandler(globalPointerHandlers.value as GenericHandler[], handler)
    ensurePointerListener()

    return () => {
      registeredIds.delete(handler.id)
      const index = globalPointerHandlers.value.findIndex((item) => item.id === handler.id)
      if (index !== -1) {
        globalPointerHandlers.value.splice(index, 1)
      }

      if (!globalPointerHandlers.value.length && removePointerListener) {
        removePointerListener()
      }
    }
  }

  function handleMouseOver(event: MouseEvent) {
    if (!hoverHandlers.value.length) return
    const target = event.target as HTMLElement
    dispatchHandlers(
      hoverHandlers.value as GenericHandler[],
      { event, target, type: 'enter' },
      debug,
    )
  }

  function handleMouseOut(event: MouseEvent) {
    if (!hoverHandlers.value.length) return
    const target = event.target as HTMLElement
    dispatchHandlers(
      hoverHandlers.value as GenericHandler[],
      { event, target, type: 'leave' },
      debug,
    )
  }

  // RAF-throttled mousemove handling
  let pendingMoveEvent: MouseEvent | null = null
  let moveRafId: number | null = null

  function handleMouseMove(event: MouseEvent) {
    if (!hoverHandlers.value.length) return

    pendingMoveEvent = event

    if (moveRafId === null) {
      moveRafId = requestAnimationFrame(() => {
        if (pendingMoveEvent) {
          const target = pendingMoveEvent.target as HTMLElement
          dispatchHandlers(
            hoverHandlers.value as GenericHandler[],
            { event: pendingMoveEvent, target, type: 'move' },
            debug,
          )
          pendingMoveEvent = null
        }
        moveRafId = null
      })
    }
  }

  function ensureHoverListeners() {
    if (removeHoverListeners || !gridRoot) return

    gridRoot.addEventListener('mouseover', handleMouseOver)
    gridRoot.addEventListener('mouseout', handleMouseOut)
    gridRoot.addEventListener('mousemove', handleMouseMove, { passive: true })

    removeHoverListeners = () => {
      if (gridRoot) {
        gridRoot.removeEventListener('mouseover', handleMouseOver)
        gridRoot.removeEventListener('mouseout', handleMouseOut)
        gridRoot.removeEventListener('mousemove', handleMouseMove)
      }
      // Cancel any pending RAF
      if (moveRafId !== null) {
        cancelAnimationFrame(moveRafId)
        moveRafId = null
      }
      pendingMoveEvent = null
      removeHoverListeners = null
    }
  }

  function setGridRoot(el: HTMLElement | null) {
    // Clean up old listeners
    if (removeHoverListeners) {
      removeHoverListeners()
    }
    if (removeKeyboardListener) {
      removeKeyboardListener()
    }
    if (removeDocumentKeyboardListener) {
      removeDocumentKeyboardListener()
    }

    gridRoot = el

    // Set up new listeners if we have handlers
    if (gridRoot && hoverHandlers.value.length) {
      ensureHoverListeners()
    }
    if (gridRoot && keyboardHandlers.value.length && keyboardConfig) {
      ensureKeyboardListener()
    }
    if (gridRoot && documentLevelHandlerIds.size > 0 && keyboardConfig) {
      ensureDocumentKeyboardListener()
    }
  }

  function registerHoverHandler(handler: NuGridHoverHandler) {
    if (registeredIds.has(handler.id)) {
      throw new Error(`[Router] Handler with id "${handler.id}" already registered`)
    }

    registeredIds.add(handler.id)
    insertHandler(hoverHandlers.value as GenericHandler[], handler)

    // Ensure listeners are set up if we have a grid root
    if (gridRoot) {
      ensureHoverListeners()
    }

    return () => {
      registeredIds.delete(handler.id)
      const index = hoverHandlers.value.findIndex((item) => item.id === handler.id)
      if (index !== -1) {
        hoverHandlers.value.splice(index, 1)
      }

      // Clean up listeners if no more handlers
      if (!hoverHandlers.value.length && removeHoverListeners) {
        removeHoverListeners()
      }
    }
  }

  // Cache document-level handlers to avoid filtering on every keydown
  let cachedDocumentLevelHandlers: NuGridKeyboardHandler<T>[] = []

  function updateDocumentLevelHandlersCache() {
    cachedDocumentLevelHandlers = keyboardHandlers.value.filter((h) => h.documentLevel)
  }

  /**
   * Handle keydown for document-level handlers (e.g., editor dropdowns)
   * Uses the same context builder as regular handlers
   */
  function handleDocumentKeyDown(event: KeyboardEvent) {
    if (!keyboardConfig || cachedDocumentLevelHandlers.length === 0) {
      return
    }

    const context = keyboardConfig.buildContext(event)
    if (!context) return

    dispatchHandlers(cachedDocumentLevelHandlers as GenericHandler[], context, debug)
  }

  function ensureDocumentKeyboardListener() {
    if (removeDocumentKeyboardListener || !keyboardConfig || typeof document === 'undefined') {
      return
    }

    const listener = handleDocumentKeyDown as EventListener
    document.addEventListener('keydown', listener, true) // capture phase
    removeDocumentKeyboardListener = () => {
      document.removeEventListener('keydown', listener, true)
      removeDocumentKeyboardListener = null
    }
  }

  function registerKeyboardHandler(handler: NuGridKeyboardHandler<T>) {
    if (registeredIds.has(handler.id)) {
      throw new Error(`[Router] Handler with id "${handler.id}" already registered`)
    }

    registeredIds.add(handler.id)
    insertHandler(keyboardHandlers.value as GenericHandler[], handler)

    // Update handler caches
    if (handler.documentLevel) {
      documentLevelHandlerIds.add(handler.id)
      updateDocumentLevelHandlersCache()
      ensureDocumentKeyboardListener()
    } else {
      updateNonDocumentHandlersCache()
    }

    // Ensure keyboard listener is active
    ensureKeyboardListener()

    return () => {
      registeredIds.delete(handler.id)
      const index = keyboardHandlers.value.findIndex((item) => item.id === handler.id)
      if (index !== -1) {
        keyboardHandlers.value.splice(index, 1)
      }

      // Update caches and clean up listeners
      if (handler.documentLevel) {
        documentLevelHandlerIds.delete(handler.id)
        updateDocumentLevelHandlersCache()
        if (documentLevelHandlerIds.size === 0 && removeDocumentKeyboardListener) {
          removeDocumentKeyboardListener()
        }
      } else {
        updateNonDocumentHandlersCache()
      }

      if (!keyboardHandlers.value.length && removeKeyboardListener) {
        removeKeyboardListener()
      }
    }
  }

  function routeKeyboard(context: NuGridKeyboardContext<T>) {
    dispatchHandlers(keyboardHandlers.value as GenericHandler[], context, debug)
  }

  // Cache non-document-level handlers to avoid filtering on every keydown
  let cachedNonDocumentHandlers: NuGridKeyboardHandler<T>[] = []

  function updateNonDocumentHandlersCache() {
    cachedNonDocumentHandlers = keyboardHandlers.value.filter((h) => !h.documentLevel)
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!keyboardConfig) {
      return
    }

    // Build context using the provided builder
    const context = keyboardConfig.buildContext(event)
    if (!context) {
      return // Context builder returned null, skip routing
    }

    // Emit keydown event FIRST so consumers can intercept before internal handling
    // Consumer can set handled = true to prevent NuGrid's internal handling
    if (eventEmitter?.keydown) {
      const { focusedCell, focusedRow, cell } = context
      const column = cell?.column ?? null
      // Get column header - could be string or function
      const columnDef = column?.columnDef
      const columnName = columnDef
        ? typeof columnDef.header === 'string'
          ? columnDef.header
          : column?.id ?? null
        : null
      const keydownEvent = {
        event,
        row: focusedRow,
        rowData: focusedRow?.original ?? null,
        rowId: focusedRow?.id ?? null,
        rowIndex: focusedCell?.rowIndex ?? -1,
        column,
        columnId: column?.id ?? null,
        columnName,
        columnIndex: focusedCell?.columnIndex ?? -1,
        cell: cell ?? null,
        value: cell?.getValue() ?? null,
        handled: false,
      }
      eventEmitter.keydown(keydownEvent)

      // If consumer marked the event as handled, skip internal handling
      if (keydownEvent.handled) {
        return
      }
    }

    // Only dispatch to non-document-level handlers
    // Document-level handlers are dispatched separately via handleDocumentKeyDown
    if (cachedNonDocumentHandlers.length > 0) {
      dispatchHandlers(cachedNonDocumentHandlers as GenericHandler[], context, debug)
    }
  }

  function ensureKeyboardListener() {
    if (removeKeyboardListener || !keyboardConfig || !gridRoot) {
      return
    }

    // Attach to document or grid root based on retainFocus
    const target = keyboardConfig.retainFocus ? document : gridRoot
    const listener = handleKeyDown as EventListener

    target.addEventListener('keydown', listener, true) // capture phase
    removeKeyboardListener = () => {
      target.removeEventListener('keydown', listener, true)
      removeKeyboardListener = null
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    // Build context using the provided builder
    const context = keyboardConfig?.buildContext(event)
    if (!context) {
      return // Context builder returned null, skip routing
    }

    // Call onCellKeyUp from focusFns if available
    context.focusFns.onCellKeyUp(event)
  }

  function ensureKeyupListener() {
    if (removeKeyupListener || !keyboardConfig || !gridRoot) {
      return
    }

    // Attach to document or grid root based on retainFocus
    const target = keyboardConfig.retainFocus ? document : gridRoot
    const listener = handleKeyUp as EventListener

    target.addEventListener('keyup', listener, true) // capture phase
    removeKeyupListener = () => {
      target.removeEventListener('keyup', listener, true)
      removeKeyupListener = null
    }
  }

  function setKeyboardConfig(config: NuGridKeyboardConfig<T> | null) {
    // Clean up old listener
    if (removeKeyboardListener) {
      removeKeyboardListener()
    }
    if (removeKeyupListener) {
      removeKeyupListener()
    }
    if (removeDocumentKeyboardListener) {
      removeDocumentKeyboardListener()
    }

    keyboardConfig = config

    // Set up new listener if we have handlers and config
    if (keyboardConfig && gridRoot && keyboardHandlers.value.length) {
      ensureKeyboardListener()
      ensureKeyupListener()
    }
    if (keyboardConfig && documentLevelHandlerIds.size > 0) {
      ensureDocumentKeyboardListener()
    }
  }

  return {
    registerCellClickHandler,
    routeCellClick,
    registerCellDoubleClickHandler,
    routeCellDoubleClick,
    registerContextMenuHandler,
    routeContextMenu,
    registerWheelHandler,
    routeWheel,
    registerGlobalPointerHandler,
    registerHoverHandler,
    registerKeyboardHandler,
    routeKeyboard,
    setKeyboardConfig,
    setGridRoot,
  }
}
