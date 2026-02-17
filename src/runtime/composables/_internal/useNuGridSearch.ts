import type { TableData } from '@nuxt/ui'
import type { Table } from '@tanstack/vue-table'
import type { ComputedRef, Ref } from 'vue'
import type { NuGridSearchOptions } from '../../types/option-groups'
import type { NuGridProps } from '../../types/props'
import type { NuGridFocus, NuGridInteractionRouter } from '../../types/_internal'
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
  /** Highlight color for matching text */
  highlightColor: ComputedRef<string>
  /** Current type-ahead buffer for type-to-navigate */
  typeAheadBuffer: Ref<string>
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
  /** Focus functions for type-ahead navigation (focusRowById, gridHasFocus) */
  focusFns?: NuGridFocus<T>
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
 * - Type-ahead keyboard navigation (moves focus to matching row)
 * - Search context for child components
 */
export function useNuGridSearch<T extends TableData = TableData>(
  options: UseNuGridSearchOptions<T>,
): NuGridSearchContext {
  const {
    props, tableApi, globalFilterState, interactionRouter,
    isEditing, gridRoot, onFocusFirstResult,
    focusFns,
  } = options

  // Derive editing-enabled from props (avoids passing extra refs from NuGrid.vue)
  const editingEnabled = computed(() => {
    const editing = props.editing
    if (editing === true) return true
    if (editing && typeof editing === 'object') return editing.enabled ?? false
    return false
  })

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

  // --- Type-ahead navigation ---
  // When the grid has focus and editing is not enabled, typing characters
  // navigates to the first matching row instead of filtering.
  const typeAheadBuffer = ref('')
  let typeAheadTimeout: ReturnType<typeof setTimeout> | null = null
  const TYPE_AHEAD_TIMEOUT = 1000 // 1 second

  function clearTypeAhead() {
    typeAheadBuffer.value = ''
    if (typeAheadTimeout) {
      clearTimeout(typeAheadTimeout)
      typeAheadTimeout = null
    }
  }

  function resetTypeAheadTimer() {
    if (typeAheadTimeout) {
      clearTimeout(typeAheadTimeout)
    }
    typeAheadTimeout = setTimeout(() => {
      typeAheadBuffer.value = ''
      typeAheadTimeout = null
    }, TYPE_AHEAD_TIMEOUT)
  }

  function navigateToMatch(query: string) {
    if (!focusFns) return

    const lowerQuery = query.toLowerCase()
    // Use flatRows from the current row model (respects grouping/sorting/filtering)
    // and filter to leaf rows only (skip group header rows)
    const rowsList = tableApi.getRowModel().flatRows.filter(r => !r.getIsGrouped())

    // Build a map of accessor key → visible column index for cell-level focus
    const visibleColumns = tableApi.getVisibleLeafColumns()
    const columnIndexMap = new Map<string, number>()
    visibleColumns.forEach((col, idx) => { columnIndexMap.set(col.id, idx) })

    // Get searchable column accessor keys from props
    const searchableColumns = (props.columns ?? []).filter((col: any) => {
      if (!('accessorKey' in col)) return false
      return col.enableSearching !== false
    })

    // Two-pass search: prefer startsWith matches, fall back to contains
    let containsMatch: { rowId: string, columnKey: string } | null = null

    for (let i = 0; i < rowsList.length; i++) {
      const row = rowsList[i]
      if (!row) continue

      for (const col of searchableColumns) {
        const key = ('accessorKey' in col ? col.accessorKey : undefined) as string | undefined
        if (!key) continue

        const cellValue = row.getValue(key)
        if (cellValue == null) continue

        const stringValue = String(cellValue).toLowerCase()
        if (stringValue.startsWith(lowerQuery)) {
          // Exact startsWith match - navigate immediately
          const columnIndex = columnIndexMap.get(key)
          focusFns.focusRowById(row.id, { align: 'nearest', ...(columnIndex !== undefined && { columnIndex }) })
          return
        }
        if (!containsMatch && stringValue.includes(lowerQuery)) {
          containsMatch = { rowId: row.id, columnKey: key }
        }
      }
    }

    // Fall back to contains match if no startsWith match was found
    if (containsMatch) {
      const columnIndex = columnIndexMap.get(containsMatch.columnKey)
      focusFns.focusRowById(containsMatch.rowId, { align: 'nearest', ...(columnIndex !== undefined && { columnIndex }) })
    }
  }

  // Register type-ahead keyboard handler
  if (interactionRouter) {
    interactionRouter.registerKeyboardHandler({
      id: 'nugrid-type-to-search',
      priority: 1000, // Low priority - runs after other handlers
      when: (context) => {
        // Only handle if:
        // 1. Type-to-search is enabled
        // 2. Editing is NOT globally enabled (editing.enabled must be false)
        // 3. Grid has focus
        // 4. Key is a printable character, Backspace, or Escape
        if (!typeToSearch.value) return false
        if (editingEnabled.value) return false

        // Check grid focus
        if (!focusFns?.gridHasFocus.value) return false

        // Don't interfere when search input has focus
        const activeElement = document.activeElement
        const searchEl = searchInputRef.value?.$el
        if (searchEl && searchEl.contains(activeElement)) return false

        const event = context.event
        // Skip if modifier keys are pressed (except Shift)
        if (event.ctrlKey || event.metaKey || event.altKey) return false

        const key = event.key
        return (
          key.length === 1 // Printable character
          || key === 'Backspace'
          || key === 'Escape'
        )
      },
      handle: (context) => {
        const event = context.event
        const key = event.key

        if (key === 'Escape') {
          if (typeAheadBuffer.value) {
            clearTypeAhead()
            return { handled: true, preventDefault: true }
          }
          return { handled: false }
        }

        if (key === 'Backspace') {
          if (typeAheadBuffer.value.length > 0) {
            typeAheadBuffer.value = typeAheadBuffer.value.slice(0, -1)
            resetTypeAheadTimer()
            if (typeAheadBuffer.value.length > 0) {
              navigateToMatch(typeAheadBuffer.value)
            }
            return { handled: true, preventDefault: true }
          }
          return { handled: false }
        }

        // Printable character - append to buffer and navigate
        if (key.length === 1) {
          typeAheadBuffer.value += key
          resetTypeAheadTimer()
          navigateToMatch(typeAheadBuffer.value)
          return { handled: true, preventDefault: true }
        }

        return { handled: false }
      },
    })
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
    typeAheadBuffer,
    clear,
    setQuery,
    searchInputRef,
    focusSearchInput,
  }
}
