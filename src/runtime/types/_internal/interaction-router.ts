import type { TableData } from '@nuxt/ui'
import type { Cell, Row, Table } from '@tanstack/vue-table'
import type { NuGridCellEditing } from './cell-editing'
import type { NuGridFocus, NuGridFocusedCell } from './focus'

/**
 * Priority ranges for interaction router handlers
 * Lower numbers execute first
 */
export const ROUTER_PRIORITIES = {
  /** Guards - veto events early (0-9) */
  GUARD_MIN: 0,
  GUARD_MAX: 9,

  /** Focus management (10-19) */
  FOCUS_MIN: 10,
  FOCUS: 10,
  FOCUS_MAX: 19,

  /** Editing (20-29) */
  EDITING_MIN: 20,
  EDITING: 20,
  EDITING_OUTSIDE: 25,
  EDITING_MAX: 29,

  /** Actions (30-99) */
  ACTION_MIN: 30,
  ACTION_MAX: 99,

  /** Low priority - tooltips, etc (100+) */
  LOW_PRIORITY: 100,

  /** Keyboard: Cell type handlers (15) - before editing triggers */
  KEYBOARD_CELL_TYPE: 15,

  /** Keyboard: Editing triggers - F2, Enter, Backspace, alphanumeric (20) */
  KEYBOARD_EDITING_TRIGGERS: 20,

  /** Keyboard: Paging - PageUp/PageDown, Cmd+Up/Down when paging enabled (25) */
  KEYBOARD_PAGING: 25,

  /** Keyboard: Navigation - arrows, tab, page up/down, etc. (30) */
  KEYBOARD_NAVIGATION: 30,
} as const

/**
 * Event metadata storage - replaces magic event properties
 */
export interface EventMetadata {
  addRowFinalizing?: boolean
  addRowCellTransition?: boolean
  addRowUneditableClick?: boolean
  [key: string]: any
}

const eventMetadata = new WeakMap<Event, EventMetadata>()

/**
 * Set metadata flag on an event
 */
export function setEventFlag(event: Event, key: string, value: any): void {
  const meta = eventMetadata.get(event) ?? {}
  meta[key] = value
  eventMetadata.set(event, meta)
}

/**
 * Get metadata flag from an event
 */
export function getEventFlag<T = any>(event: Event, key: string, defaultValue?: T): T {
  return (eventMetadata.get(event)?.[key] ?? defaultValue) as T
}

/**
 * Check if event has a metadata flag
 */
export function hasEventFlag(event: Event, key: string): boolean {
  return eventMetadata.has(event) && key in (eventMetadata.get(event) ?? {})
}

export interface NuGridCellClickContext<T extends TableData = TableData> {
  event: MouseEvent
  row: Row<T>
  cell: Cell<T, any>
  cellIndex: number
}

export interface NuGridInteractionRouteResult {
  handled?: boolean
  stop?: boolean
  preventDefault?: boolean
  stopPropagation?: boolean
}

export interface NuGridInteractionHandler<T extends TableData = TableData> {
  id: string
  priority: number
  when?: (context: NuGridCellClickContext<T>) => boolean
  handle: (context: NuGridCellClickContext<T>) => NuGridInteractionRouteResult | void
}

export interface NuGridPointerContext {
  event: PointerEvent | MouseEvent
}

export interface NuGridPointerHandler {
  id: string
  priority: number
  when?: (context: NuGridPointerContext) => boolean
  handle: (context: NuGridPointerContext) => NuGridInteractionRouteResult | void
}

export interface NuGridHoverContext {
  event: MouseEvent
  target: HTMLElement
  type: 'enter' | 'leave' | 'move'
}

export interface NuGridHoverHandler {
  id: string
  priority: number
  when?: (context: NuGridHoverContext) => boolean
  handle: (context: NuGridHoverContext) => NuGridInteractionRouteResult | void
}

export interface NuGridWheelContext<T extends TableData = TableData> {
  event: WheelEvent
  row: Row<T>
  cell: Cell<T, any>
  cellIndex: number
}

export interface NuGridWheelHandler<T extends TableData = TableData> {
  id: string
  priority: number
  when?: (context: NuGridWheelContext<T>) => boolean
  handle: (context: NuGridWheelContext<T>) => NuGridInteractionRouteResult | void
}

/**
 * Keyboard context passed to keyboard handlers
 */
export interface NuGridKeyboardContext<T extends TableData = TableData> {
  /** The keyboard event */
  event: KeyboardEvent
  /** Current focused cell position (null if no cell focused) */
  focusedCell: NuGridFocusedCell | null
  /** The focused row instance (if focused) */
  focusedRow: Row<T> | null
  /** The focused cell instance (if focused) */
  cell: Cell<T, any> | null
  /** Cell index within the row */
  cellIndex: number
  /** Whether a cell is currently being edited */
  isEditing: boolean
  /** Focus mode from props ('none' | 'cell' | 'row') */
  focusMode: 'none' | 'cell' | 'row'
  /** Whether editing is enabled */
  editingEnabled: boolean
  /** TanStack table API */
  tableApi: Table<T>
  /** Focus functions for navigation */
  focusFns: NuGridFocus<T>
  /** Cell editing functions */
  cellEditingFns: NuGridCellEditing<T>
}

/**
 * Keyboard handler definition - follows NuGridInteractionHandler pattern
 */
export interface NuGridKeyboardHandler<T extends TableData = TableData> {
  id: string
  priority: number
  /** Optional condition - handler only runs if when() returns true */
  when?: (context: NuGridKeyboardContext<T>) => boolean
  /** Handle the keyboard event */
  handle: (context: NuGridKeyboardContext<T>) => NuGridInteractionRouteResult | void
  /**
   * Request document-level keyboard listening.
   * Use this when the handler needs to capture events on elements outside the grid
   * (e.g., teleported dropdowns, modals).
   * Document-level handlers receive a minimal context (event + editing state).
   */
  documentLevel?: boolean
}

/**
 * Configuration for keyboard event handling
 */
export interface NuGridKeyboardConfig<T extends TableData = TableData> {
  /** Whether to attach listener to document (true) or grid root (false) */
  retainFocus: boolean
  /** Build context for a keyboard event. Return null to skip routing. */
  buildContext: (event: KeyboardEvent) => NuGridKeyboardContext<T> | null
}

export interface NuGridInteractionRouter<T extends TableData = TableData> {
  registerCellClickHandler: (handler: NuGridInteractionHandler<T>) => () => void
  routeCellClick: (context: NuGridCellClickContext<T>) => void
  registerCellDoubleClickHandler: (handler: NuGridInteractionHandler<T>) => () => void
  routeCellDoubleClick: (context: NuGridCellClickContext<T>) => void
  registerContextMenuHandler: (handler: NuGridInteractionHandler<T>) => () => void
  routeContextMenu: (context: NuGridCellClickContext<T>) => void
  registerWheelHandler: (handler: NuGridWheelHandler<T>) => () => void
  routeWheel: (context: NuGridWheelContext<T>) => void
  registerGlobalPointerHandler: (handler: NuGridPointerHandler) => () => void
  registerHoverHandler: (handler: NuGridHoverHandler) => () => void
  registerKeyboardHandler: (handler: NuGridKeyboardHandler<T>) => () => void
  routeKeyboard: (context: NuGridKeyboardContext<T>) => void
  setKeyboardConfig: (config: NuGridKeyboardConfig<T> | null) => void
  setGridRoot: (el: HTMLElement | null) => void
}
