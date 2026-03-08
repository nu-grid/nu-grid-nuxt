import type { ComputedRef, Ref } from 'vue'

import { inject, nextTick, onMounted, watch } from 'vue'

import type { NuGridCellEditorEmits, NuGridCellEditorProps } from '../types'

/**
 * Shared composable for building custom NuGrid cell editors
 *
 * This composable provides:
 * - Keyboard event handling (Enter, Escape, Arrow keys, Tab)
 * - Focus management (with scroll settling)
 * - Blur handling (navigation-aware)
 * - Manual focus trigger (for custom focus logic)
 * - Custom focus callback support (for complex components)
 *
 * @example Basic usage
 * ```vue
 * <script setup>
 * const props = defineProps<NuGridCellEditorProps>()
 * const emit = defineEmits<NuGridCellEditorEmits>()
 * const inputRef = ref(null)
 *
 * const { handleKeydown, handleBlur } = useNuGridCellEditor(props, emit, inputRef)
 * </script>
 *
 * <template>
 *   <USelect
 *     ref="inputRef"
 *     :model-value="modelValue"
 *     @blur="handleBlur"
 *     @keydown="handleKeydown"
 *   />
 * </template>
 * ```
 *
 * @example Custom focus callback for complex components
 * ```vue
 * <script setup>
 * const props = defineProps<NuGridCellEditorProps>()
 * const emit = defineEmits<NuGridCellEditorEmits>()
 * const editorRef = ref(null)
 *
 * // Custom focus logic for a complex editor component
 * const customFocus = () => {
 *   editorRef.value?.openDropdown()
 *   editorRef.value?.selectAll()
 * }
 *
 * const { handleKeydown, handleBlur } = useNuGridCellEditor(
 *   props,
 *   emit,
 *   editorRef,
 *   customFocus
 * )
 * </script>
 * ```
 *
 * @example Manual focus control
 * ```vue
 * <script setup>
 * const props = defineProps<NuGridCellEditorProps>()
 * const emit = defineEmits<NuGridCellEditorEmits>()
 * const inputRef = ref(null)
 *
 * const { handleKeydown, handleBlur, focusInput } = useNuGridCellEditor(props, emit, inputRef)
 *
 * // Manually trigger focus after some async operation
 * async function loadDataAndFocus() {
 *   await fetchData()
 *   focusInput()
 * }
 * </script>
 * ```
 */
export function useNuGridCellEditor(
  props: NuGridCellEditorProps,
  emit: NuGridCellEditorEmits,
  inputRef: Ref<any>,
  customFocusCallback?: () => void,
) {
  // Inject enterBehavior from grid context (provided by NuGrid component)
  // Falls back to prop value for custom editors that might not be inside a NuGrid
  const injectedEnterBehavior = inject<ComputedRef<string> | null>('nugrid-enter-behavior', null)

  // Inject spreadsheet nav flag — when enabled, ArrowLeft/Right navigate between cells
  // at text boundaries (cursor at start/end or all text selected)
  const spreadsheetNavEnabled = inject<ComputedRef<boolean> | null>('nugrid-spreadsheet-nav', null)

  function getEnterBehavior() {
    return injectedEnterBehavior?.value ?? props.enterBehavior ?? 'default'
  }

  /**
   * Request navigation to another cell
   */
  function scheduleNavigation(direction: 'up' | 'down' | 'left' | 'right' | 'next' | 'previous') {
    emit('update:isNavigating', true)
    emit('stopEditing', direction)
  }

  /**
   * Focus the input element
   * Uses custom callback if provided, otherwise handles both nested refs (like UInput with .inputRef) and direct refs
   */
  function focusInput() {
    nextTick(() => {
      // Use custom focus callback if provided
      if (customFocusCallback) {
        customFocusCallback()
      } else {
        // Default focus logic
        // Use preventScroll to avoid browser's automatic scroll-into-view behavior
        // which can fight with our controlled scrolling
        // Try nested ref first (e.g., UInput component has .inputRef property)
        if (inputRef.value?.inputRef) {
          inputRef.value.inputRef.focus({ preventScroll: true })
        } else if (inputRef.value?.focus) {
          // Fall back to direct focus (e.g., native input element)
          inputRef.value.focus({ preventScroll: true })
        }
      }

      // SpreadsheetNav: auto-select all text so typing replaces content
      if (spreadsheetNavEnabled?.value) {
        const native = getNativeInput(inputRef)
        if (native) native.select()
      }
    })
  }

  /**
   * Set up focus management
   * Focuses input when shouldFocus becomes true (after scroll settles)
   */
  watch(
    () => props.shouldFocus,
    (shouldFocus) => {
      if (shouldFocus) {
        focusInput()
      }
    },
    { immediate: true },
  )

  /**
   * Also try to focus on mount if shouldFocus is already true
   */
  onMounted(() => {
    if (props.shouldFocus) {
      focusInput()
    }
  })

  /**
   * Handle blur events
   * Only emits stopEditing if not currently navigating to another cell
   */
  function handleBlur() {
    // Don't handle blur if we're navigating
    if (!props.isNavigating) {
      emit('stopEditing')
    }
  }

  /**
   * Resolve the native HTMLInputElement from an editor ref.
   * Handles UInput (.inputRef), direct elements, and component wrappers.
   */
  function getNativeInput(ref: Ref<any>): HTMLInputElement | null {
    const el = ref.value
    if (!el) return null
    // UInput component: has .inputRef property pointing to native input
    if (el.inputRef instanceof HTMLInputElement) return el.inputRef
    // Direct HTMLInputElement
    if (el instanceof HTMLInputElement) return el
    // Component with $el containing an input
    const root = el.$el ?? el
    if (root instanceof HTMLElement) {
      return root.querySelector('input, textarea') as HTMLInputElement | null
    }
    return null
  }

  /**
   * Handle ArrowLeft/Right for spreadsheet navigation
   * Navigates to adjacent cells when cursor is at a text boundary.
   * Custom editors can call this from their own keydown handler.
   * @returns true if the key was handled (navigation scheduled)
   */
  function handleSpreadsheetArrows(e: KeyboardEvent, beforeNavigate?: () => void): boolean {
    if (
      !spreadsheetNavEnabled?.value ||
      (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') ||
      e.metaKey ||
      e.ctrlKey ||
      e.altKey
    ) {
      return false
    }

    const input = getNativeInput(inputRef)

    // Non-input editors (e.g. checkbox): always navigate on ArrowLeft/Right
    if (!input) {
      e.preventDefault()
      beforeNavigate?.()
      scheduleNavigation(e.key === 'ArrowRight' ? 'right' : 'left')
      return true
    }

    const { selectionStart, selectionEnd, value } = input
    const len = value.length

    // For inputs where selection is not queryable (e.g. type="number"),
    // treat as all-selected since spreadsheetNav auto-selects on focus
    if (selectionStart === null || selectionEnd === null) {
      e.preventDefault()
      beforeNavigate?.()
      scheduleNavigation(e.key === 'ArrowRight' ? 'right' : 'left')
      return true
    }

    const atStart = selectionStart === 0 && selectionEnd === 0
    const atEnd = selectionStart === len && selectionEnd === len
    const allSelected = selectionStart === 0 && selectionEnd === len && len > 0
    const isEmpty = len === 0

    if (e.key === 'ArrowRight' && (atEnd || allSelected || isEmpty)) {
      e.preventDefault()
      beforeNavigate?.()
      scheduleNavigation('right')
      return true
    } else if (e.key === 'ArrowLeft' && (atStart || allSelected || isEmpty)) {
      e.preventDefault()
      beforeNavigate?.()
      scheduleNavigation('left')
      return true
    }

    return false
  }

  /**
   * Handle keyboard events for navigation and editing control
   *
   * Supported keys:
   * - Enter: Save and stop editing
   * - Escape: Cancel editing without saving
   * - ArrowUp: Save and move to cell above (ignored with Cmd/Ctrl)
   * - ArrowDown: Save and move to cell below (ignored with Cmd/Ctrl)
   * - Tab: Save and move to next cell (Shift+Tab for previous)
   * - ArrowLeft/Right: Navigate cells at text boundary (spreadsheetNav mode)
   * - PageUp/PageDown: Ignored (prevented to avoid losing focus)
   */
  function handleKeydown(e: KeyboardEvent) {
    // For all keys (typing), stop propagation to prevent focus system interference
    e.stopPropagation()

    if (e.key === 'Enter') {
      e.preventDefault()
      const behavior = getEnterBehavior()
      if (behavior === 'moveDown') {
        scheduleNavigation(e.shiftKey ? 'up' : 'down')
      } else if (behavior === 'moveCell') {
        scheduleNavigation(e.shiftKey ? 'previous' : 'next')
      } else {
        emit('stopEditing')
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      emit('cancelEditing')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      // Cmd/Ctrl+Up is a page-jump key - ignore it in edit mode
      if (e.metaKey || e.ctrlKey) return
      // Use RAF-throttled navigation to prevent overwhelming rendering when holding key
      scheduleNavigation('up')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      // Cmd/Ctrl+Down is a page-jump key - ignore it in edit mode
      if (e.metaKey || e.ctrlKey) return
      // Use RAF-throttled navigation to prevent overwhelming rendering when holding key
      scheduleNavigation('down')
    } else if (e.key === 'Tab') {
      e.preventDefault()
      // Use RAF-throttled navigation to prevent overwhelming rendering when holding key
      scheduleNavigation(e.shiftKey ? 'previous' : 'next')
    } else if (handleSpreadsheetArrows(e)) {
      // Handled by spreadsheet nav ArrowLeft/Right
    } else if (e.key === 'PageUp' || e.key === 'PageDown') {
      // Page navigation keys are ignored in edit mode to prevent losing focus
      e.preventDefault()
    }
  }

  return {
    /**
     * Handle keyboard events for navigation and editing control
     */
    handleKeydown,
    /**
     * Handle blur events (navigation-aware)
     */
    handleBlur,
    /**
     * Manually trigger focus on the input element
     * Useful for custom focus logic or after async operations
     */
    focusInput,
    /**
     * Schedule navigation to another cell
     * Emits stopEditing with direction, which is throttled by the scroll processing lock
     */
    scheduleNavigation,
    /**
     * Handle ArrowLeft/Right for spreadsheet cell navigation
     * Call from custom keydown handlers to participate in spreadsheetNav mode.
     * Returns true if the key was handled.
     */
    handleSpreadsheetArrows,
  }
}
