import type { Ref } from 'vue'
import type { NuGridCellEditorEmits, NuGridCellEditorProps } from '../types'
import { nextTick, onMounted, watch } from 'vue'

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
  /**
   * Request navigation to another cell
   */
  function scheduleNavigation(direction: 'up' | 'down' | 'next' | 'previous') {
    emit('update:isNavigating', true)
    emit('stop-editing', direction)
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
        return
      }

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
   * Only emits stop-editing if not currently navigating to another cell
   */
  function handleBlur() {
    // Don't handle blur if we're navigating
    if (!props.isNavigating) {
      emit('stop-editing')
    }
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
   * - PageUp/PageDown: Ignored (prevented to avoid losing focus)
   */
  function handleKeydown(e: KeyboardEvent) {
    // For all keys (typing), stop propagation to prevent focus system interference
    e.stopPropagation()

    if (e.key === 'Enter') {
      e.preventDefault()
      emit('stop-editing')
    } else if (e.key === 'Escape') {
      e.preventDefault()
      emit('cancel-editing')
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
     * Emits stop-editing with direction, which is throttled by the scroll processing lock
     */
    scheduleNavigation,
  }
}
