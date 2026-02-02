import type { TableData } from '@nuxt/ui'
import type { Table } from '@tanstack/vue-table'
import type { ComputedRef, Ref } from 'vue'
import type { NuGridSearchOptions } from '../../types/option-groups'
import type { NuGridProps } from '../../types/props'
import type { NuGridInteractionRouter } from '../../types/_internal'
import { useDebounceFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { nuGridDefaults } from '../../config/_internal'

/**
 * Search context provided to child components
 */
/** Search component instance with focus method */
interface SearchComponentInstance {
  focus: () => void
  $el?: HTMLElement
}

export interface NuGridSearchContext {
  /** Whether search is enabled */
  enabled: ComputedRef<boolean>
  /** Current search query (debounced) */
  searchQuery: ComputedRef<string>
  /** Raw search query (not debounced) */
  rawSearchQuery: Ref<string>
  /** Whether search is active (has a query) */
  isSearching: ComputedRef<boolean>
  /** Whether to show the built-in search panel */
  showPanel: ComputedRef<boolean>
  /** Debounce delay in milliseconds */
  debounceMs: ComputedRef<number>
  /** Placeholder text */
  placeholder: ComputedRef<string>
  /** Whether type-to-search is enabled */
  typeToSearch: ComputedRef<boolean>
  /** Search icon */
  icon: ComputedRef<string>
  /** Clear button icon */
  clearIcon: ComputedRef<string>
  /** Clear the search query */
  clear: () => void
  /** Set the search query */
  setQuery: (query: string) => void
  /** Ref to the search component instance for focusing */
  searchInputRef: Ref<SearchComponentInstance | null>
  /** Focus the search input */
  focusSearchInput: () => void
}

interface UseNuGridSearchOptions<T extends TableData> {
  /** NuGrid props */
  props: NuGridProps<T>
  /** TanStack table instance */
  tableApi: Table<T>
  /** Global filter state ref (v-model binding) */
  globalFilterState: Ref<string>
  /** Interaction router for keyboard handling */
  interactionRouter?: NuGridInteractionRouter<T>
  /** Whether editing is currently active */
  isEditing?: ComputedRef<boolean>
  /** Grid root element ref for focus checking */
  gridRoot?: ComputedRef<HTMLElement | null>
  /** Callback to focus the first cell/row when results are found */
  onFocusFirstResult?: () => void
}

/**
 * Resolve search options from props
 * Handles boolean shorthand and merges with defaults
 */
export function resolveSearchOptions(
  prop: boolean | NuGridSearchOptions | undefined,
): NuGridSearchOptions {
  const defaults = nuGridDefaults.search

  if (prop === undefined || prop === false) {
    return { ...defaults, enabled: false }
  }

  if (prop === true) {
    return { ...defaults, enabled: true }
  }

  // Merge with defaults, prop values take precedence
  return {
    enabled: prop.enabled ?? defaults.enabled,
    placeholder: prop.placeholder ?? defaults.placeholder,
    debounce: prop.debounce ?? defaults.debounce,
    autofocus: prop.autofocus ?? defaults.autofocus,
    clearable: prop.clearable ?? defaults.clearable,
    icon: prop.icon ?? defaults.icon,
    clearIcon: prop.clearIcon ?? defaults.clearIcon,
    suppressPanel: prop.suppressPanel ?? defaults.suppressPanel,
    typeToSearch: prop.typeToSearch ?? defaults.typeToSearch,
    focusOnResults: prop.focusOnResults ?? defaults.focusOnResults,
    highlightColor: prop.highlightColor ?? defaults.highlightColor,
  }
}

/**
 * Composable for NuGrid search
 *
 * Provides:
 * - Search configuration from props
 * - Debounced search state management
 * - Type-to-search keyboard handling
 * - Search context for child components
 */
export function useNuGridSearch<T extends TableData = TableData>(
  options: UseNuGridSearchOptions<T>,
): NuGridSearchContext {
  const { props, tableApi, globalFilterState, interactionRouter, isEditing, gridRoot, onFocusFirstResult } = options

  // Resolve search options
  const resolvedOptions = computed(() => resolveSearchOptions(props.search))

  // Core computed values
  const enabled = computed(() => resolvedOptions.value.enabled ?? false)
  const suppressPanel = computed(() => resolvedOptions.value.suppressPanel ?? false)
  const showPanel = computed(() => enabled.value && !suppressPanel.value)
  const debounceMs = computed(() => resolvedOptions.value.debounce ?? 300)
  const placeholder = computed(() => resolvedOptions.value.placeholder ?? 'Search...')
  const typeToSearch = computed(() => resolvedOptions.value.typeToSearch ?? true)
  const focusOnResults = computed(() => resolvedOptions.value.focusOnResults ?? false)
  const highlightColor = computed(() => resolvedOptions.value.highlightColor ?? 'primary')
  const icon = computed(() => resolvedOptions.value.icon ?? 'i-lucide-search')
  const clearIcon = computed(() => resolvedOptions.value.clearIcon ?? 'i-lucide-x')

  // Raw search query (immediate, not debounced)
  const rawSearchQuery = ref('')

  // Debounced search query
  const searchQuery = computed(() => globalFilterState.value ?? '')

  // Whether a search is active
  const isSearching = computed(() => searchQuery.value.length > 0)

  // Ref for search component instance (set by NuGridSearchPanel)
  const searchInputRef = ref<SearchComponentInstance | null>(null)

  // Debounced function to update global filter
  const debouncedSetGlobalFilter = useDebounceFn((value: string) => {
    globalFilterState.value = value
  }, debounceMs)

  // Watch raw query and debounce updates to global filter
  watch(rawSearchQuery, (newValue) => {
    debouncedSetGlobalFilter(newValue)
  })

  // Sync from external global filter changes
  watch(globalFilterState, (newValue) => {
    if (rawSearchQuery.value !== newValue) {
      rawSearchQuery.value = newValue ?? ''
    }
  }, { immediate: true })

  // Clear search
  const clear = () => {
    rawSearchQuery.value = ''
    globalFilterState.value = ''
  }

  // Set search query
  const setQuery = (query: string) => {
    rawSearchQuery.value = query
  }

  // Focus search input
  const focusSearchInput = () => {
    searchInputRef.value?.focus()
  }

  // Watch for search query changes to manage focus:
  // - When focusOnResults is true and results exist → focus first result
  // - When no results and panel is shown → focus search input (so user can keep typing)
  watch(
    searchQuery,
    (newQuery) => {
      if (!newQuery) {
        // Search cleared - don't manage focus
        return
      }

      // Wait for next tick to let the filter apply
      const rowCount = tableApi.getFilteredRowModel().rows.length

      if (rowCount === 0) {
        // No results - focus search input (only if panel is shown)
        if (showPanel.value) {
          focusSearchInput()
        }
      } else if (focusOnResults.value) {
        // Results exist and focusOnResults is enabled - focus first result
        onFocusFirstResult?.()
      }
    },
    { flush: 'post' }, // Run after DOM updates
  )

  // Register type-to-search keyboard handler
  // Only captures keystrokes when the grid or search input is focused
  // When search input has focus, native input behavior handles typing
  if (interactionRouter) {
    const unregister = interactionRouter.registerKeyboardHandler({
      id: 'nugrid-type-to-search',
      priority: 1000, // Low priority - runs after other handlers
      when: (context) => {
        // Only handle if:
        // 1. Search is enabled
        // 2. Type-to-search is enabled
        // 3. Not currently editing a cell
        // 4. Grid has focus (but not the search input - let native input handle that)
        // 5. Key is a printable character or special search key
        if (!enabled.value) return false
        if (!typeToSearch.value) return false
        if (isEditing?.value) return false

        // Check if grid has focus but NOT the search input
        // When search input has focus, let native input behavior handle typing
        const activeElement = document.activeElement
        const searchEl = searchInputRef.value?.$el
        const searchInputHasFocus = searchEl && searchEl.contains(activeElement)
        if (searchInputHasFocus) return false // Let native input handle it

        const gridHasFocus = gridRoot?.value?.contains(activeElement)
        if (!gridHasFocus) return false

        const event = context.event
        // Skip if modifier keys are pressed (except Shift)
        if (event.ctrlKey || event.metaKey || event.altKey) return false

        // Handle printable characters and special keys
        const key = event.key
        return (
          key.length === 1 // Printable character
          || key === 'Backspace'
          || key === 'Delete'
          || key === 'Escape'
        )
      },
      handle: (context) => {
        const event = context.event
        const key = event.key

        if (key === 'Escape') {
          // Clear search on Escape
          if (isSearching.value) {
            clear()
            return { handled: true, preventDefault: true }
          }
          return { handled: false }
        }

        if (key === 'Backspace' || key === 'Delete') {
          // Only handle if search has content
          if (rawSearchQuery.value.length > 0) {
            if (key === 'Backspace') {
              rawSearchQuery.value = rawSearchQuery.value.slice(0, -1)
            } else {
              // Delete clears entire search
              clear()
            }
            // Don't focus search input - keep grid focused for arrow key navigation
            return { handled: true, preventDefault: true }
          }
          return { handled: false }
        }

        // Printable character - append to search (keep grid focused for arrow key navigation)
        if (key.length === 1) {
          rawSearchQuery.value += key
          return { handled: true, preventDefault: true }
        }

        return { handled: false }
      },
    })

    // Cleanup on component unmount would be handled by the caller
    // The router tracks registrations and the NuGrid cleanup handles this
  }

  return {
    enabled,
    searchQuery,
    rawSearchQuery,
    isSearching,
    showPanel,
    debounceMs,
    placeholder,
    typeToSearch,
    icon,
    clearIcon,
    highlightColor,
    clear,
    setQuery,
    searchInputRef,
    focusSearchInput,
  }
}
