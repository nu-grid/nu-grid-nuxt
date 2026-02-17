import type { TableData } from '@nuxt/ui'
import type { Row, Table } from '@tanstack/vue-table'
import type { ComputedRef, Ref } from 'vue'
import type {
  NuGridCellEditing,
  NuGridFocus,
  NuGridInteractionRouter,
  NuGridKeyboardContext,
} from '../../../types/_internal'
import { onMounted, onUnmounted } from 'vue'
import {
  createCellTypeDispatchHandler,
  createEditingTriggersHandler,
  createNavigationHandler,
} from './index'

// Constants for keyboard handling (hoisted to avoid allocation on every keydown)
const INTERACTIVE_SELECTORS = ['input', 'textarea', 'select', '[contenteditable="true"]', 'button']
const NAVIGATION_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Tab',
  ' ', // Space key for row selection toggle
])

export interface KeyboardSetupOptions<T extends TableData> {
  interactionRouter: NuGridInteractionRouter<T>
  focusFns: NuGridFocus<T>
  cellEditingFns: NuGridCellEditing<T>
  tableApi: Table<T>
  resolvedRows: ComputedRef<Row<T>[]>
  rootRef: Ref<{ $el: HTMLElement | undefined } | undefined>

  // Props refs
  focusModeRef: ComputedRef<'none' | 'cell' | 'row'>
  editingEnabledRef: ComputedRef<boolean>
  startKeysRef: ComputedRef<any>
  cellTypes?: ComputedRef<any[] | undefined>
  data: Ref<T[]>

  // Emit function for cellValueChanged
  emitCellValueChanged: (payload: { row: any; column: any; oldValue: any; newValue: any }) => void
}

/**
 * Sets up keyboard handling for NuGrid
 * - Configures the interaction router with keyboard context builder
 * - Registers built-in keyboard handlers
 * - Manages lifecycle cleanup
 */
export function useKeyboardSetup<T extends TableData>(options: KeyboardSetupOptions<T>) {
  const {
    interactionRouter,
    focusFns,
    cellEditingFns,
    tableApi,
    resolvedRows,
    rootRef,
    focusModeRef,
    editingEnabledRef,
    startKeysRef,
    cellTypes,
    data,
    emitCellValueChanged,
  } = options

  // Helper to check if target is interactive element
  function isInteractiveElement(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false
    return INTERACTIVE_SELECTORS.some((s) => target.matches(s) || target.closest(s))
  }

  // Shared keyboard context builder
  function buildKeyboardContext(event: KeyboardEvent): NuGridKeyboardContext<T> | null {
    // Skip if focus mode is none
    if (focusModeRef.value === 'none') return null

    const isEditing = !!cellEditingFns.editingCell.value
    const focusedCell = focusFns.focusedCell.value

    // During editing, we still build context (for document-level handlers)
    // When not editing, require a focused cell
    if (!isEditing && !focusedCell) return null

    // Interactive element filtering (only when not editing)
    if (!isEditing) {
      const isInteractive = isInteractiveElement(event.target)
      const isNavigationKey = NAVIGATION_KEYS.has(event.key)

      if (isInteractive && !isNavigationKey) {
        return null
      }
    }

    // Build context
    const rowsList = resolvedRows.value
    const focusedRow = focusedCell ? (rowsList[focusedCell.rowIndex] ?? null) : null
    const cellIndex = focusedCell?.columnIndex ?? 0
    const cell = focusedRow?.getVisibleCells()[cellIndex] ?? null

    return {
      event,
      focusedCell,
      focusedRow,
      cell,
      cellIndex,
      isEditing,
      focusMode: focusModeRef.value,
      editingEnabled: editingEnabledRef.value,
      tableApi,
      focusFns,
      cellEditingFns,
    }
  }

  // Set up keyboard config
  interactionRouter.setKeyboardConfig({
    buildContext: buildKeyboardContext,
  })

  // Track unregister functions for cleanup
  const keyboardUnregisterFns: (() => void)[] = []

  onMounted(() => {
    // Cell type dispatch handler
    const cellTypeHandler = createCellTypeDispatchHandler<T>({
      cellTypes,
      data,
      emit: emitCellValueChanged,
    })
    keyboardUnregisterFns.push(interactionRouter.registerKeyboardHandler(cellTypeHandler))

    // Editing triggers handler
    const editingHandler = createEditingTriggersHandler<T>({
      getStartKeys: () => startKeysRef.value,
    })
    keyboardUnregisterFns.push(interactionRouter.registerKeyboardHandler(editingHandler))

    // Navigation handler
    const navHandler = createNavigationHandler<T>()
    keyboardUnregisterFns.push(interactionRouter.registerKeyboardHandler(navHandler))
  })

  onUnmounted(() => {
    // Unregister all keyboard handlers
    keyboardUnregisterFns.forEach((unregister) => unregister())
    keyboardUnregisterFns.length = 0

    // Clear keyboard config
    interactionRouter.setKeyboardConfig(null)
  })
}
