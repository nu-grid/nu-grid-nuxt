import type { TableData } from '@nuxt/ui'
import type { Row, VisibilityState } from '@tanstack/vue-table'
import type { Ref } from 'vue'
import type { NuGridActionMenuOptions, NuGridColumn } from '../../types'
import type {
  NuGridActionMenuButton,
  NuGridActionMenuColumnDef,
  NuGridActionMenuColumnMeta,
  UseNuGridActionMenuReturn,
} from '../../types/_internal'
import { computed, h, ref, watch } from 'vue'
import { nuGridCellTypeRegistry } from '../useNuGridCellTypeRegistry'

/**
 * Default button configuration for action menu
 */
const defaultButton: NuGridActionMenuButton = {
  icon: 'i-lucide-ellipsis-vertical',
  color: 'neutral',
  variant: 'ghost',
  class: 'ml-auto',
}

/**
 * Create the action menu column
 * The column is created once and uses refs to reactively update its behavior
 */
function createActionMenuColumn<T extends TableData>(
  options: NuGridActionMenuOptions<T>,
  enabledRef: Ref<boolean>,
  menuOpenStates: Map<string, Ref<boolean>>,
): NuGridColumn<T> {
  // Store configuration in meta for cell renderer to access
  const requiredMeta: NuGridActionMenuColumnMeta<T> = {
    actionMenuEnabled: true,
    enabledRef,
    getActions: options.getActions,
    isRowEnabledFn: options.isRowEnabled,
    button: {
      ...defaultButton,
      ...options.button,
    },
    menuOpenStates,
  }

  const defaultColumn: NuGridColumn<T> = {
    id: '__actions',
    size: 60,
    minSize: 60,
    maxSize: 60,
    enableResizing: false,
    enableSorting: false,
    enableGrouping: false,
    enableReordering: false,
    enableEditing: false,
    enableFocusing: true,
    cellDataType: 'action-menu',
    accessorFn: () => null,
    // Header is empty for action menu column
    header: () => '',
    // Cell renderer for action menu - get from plugin registry
    // The action menu plugin always uses a Component renderer
    cell: ({ row, cell }: { row: Row<T>; cell: any }) => {
      const renderer = nuGridCellTypeRegistry.getRenderer('action-menu')
      if (renderer) {
        return h(renderer as any, {
          row,
          cell,
        })
      }
      // Fallback (should not happen for built-in plugin)
      return null
    },
    // Store configuration in meta for cell renderer to access
    meta: requiredMeta as any,
  }

  // Merge user-provided columnDef with defaults
  // Note: columnDef excludes meta, so we can safely merge without overriding meta
  return {
    ...defaultColumn,
    ...(options.columnDef as NuGridActionMenuColumnDef<T>),
  } as NuGridColumn<T>
}

/**
 * Parse action menu options
 */
function parseNuGridActionMenuOptions<T>(
  options: NuGridActionMenuOptions<T> | undefined | false,
): NuGridActionMenuOptions<T> | null {
  if (options === undefined || options === false) return null
  if (typeof options === 'object') {
    // Actions are enabled if enabled is true OR if getActions is provided (backwards compat)
    const isEnabled =
      options.enabled === true || (options.enabled !== false && options.getActions !== undefined)
    if (!isEnabled) return null

    return {
      enabled: true,
      getActions: options.getActions ?? (() => []),
      isRowEnabled: options.isRowEnabled ?? (() => true),
      button: { ...defaultButton, ...options.button },
      hidden: options.hidden ?? false,
      columnDef: options.columnDef,
    }
  }
  return null
}

/**
 * Composable for managing action menu column in NuGrid.
 * Handles creating the action menu column for row actions.
 *
 * IMPORTANT: The action menu column is created at instantiation and cannot be added later.
 * If actionMenu is initially false/undefined and later changed to enabled,
 * an error will be thrown. To start with a hidden action menu column, use:
 * { getActions: fn, hidden: true }
 */
export function useNuGridActionMenu<T extends TableData>(
  actionMenuOptions: Ref<NuGridActionMenuOptions<T> | undefined | false>,
  columnVisibilityState?: Ref<VisibilityState>,
): UseNuGridActionMenuReturn<T> {
  // Track whether the column was created at instantiation
  const initialOptions = parseNuGridActionMenuOptions(actionMenuOptions.value)
  const wasCreatedAtInstantiation = ref(initialOptions !== null)

  /**
   * Parsed options from the actionMenu value
   */
  const parsedOptions = computed((): NuGridActionMenuOptions<T> | null => {
    return parseNuGridActionMenuOptions(actionMenuOptions.value)
  })

  /**
   * Whether action menu is currently configured (may be false after being enabled)
   */
  const isCurrentlyConfigured = computed(() => {
    return parsedOptions.value !== null
  })

  /**
   * Whether the action menu column exists (was created at instantiation)
   * This determines if the column should be in the columns array
   */
  const hasActionMenuColumn = computed(() => {
    return wasCreatedAtInstantiation.value
  })

  /**
   * Whether the action menu column should be hidden
   * If actionMenu is set to false after being enabled, the column is hidden
   */
  const isHidden = computed(() => {
    // If currently disabled but column exists, it should be hidden
    if (!isCurrentlyConfigured.value && wasCreatedAtInstantiation.value) {
      return true
    }
    return parsedOptions.value?.hidden ?? false
  })

  /**
   * Whether the action menus are enabled/interactive
   */
  const isInteractive = computed(() => {
    // If currently disabled, menus should not be interactive
    if (!isCurrentlyConfigured.value) {
      return false
    }
    return true
  })

  /**
   * Map to store menu open states for each row
   * This allows keyboard navigation to toggle menus without DOM manipulation
   */
  const menuOpenStates = new Map<string, Ref<boolean>>()

  /**
   * The action menu column instance - created once at instantiation and never recreated.
   * It uses refs internally to reactively update its behavior.
   */
  const actionMenuColumn: NuGridColumn<T> | null =
    wasCreatedAtInstantiation.value && initialOptions
      ? createActionMenuColumn<T>(initialOptions, isInteractive, menuOpenStates)
      : null

  /**
   * Append action menu column to columns array if it was created at instantiation
   */
  function appendActionMenuColumn(columns: NuGridColumn<T>[]): NuGridColumn<T>[] {
    if (!actionMenuColumn) return columns
    return [...columns, actionMenuColumn]
  }

  // Watch for changes and handle the "can't add column after creation" rule
  watch(
    actionMenuOptions,
    (newValue) => {
      const newOptions = parseNuGridActionMenuOptions(newValue)

      // If trying to enable action menu when it wasn't created at instantiation, throw error
      if (newOptions !== null && !wasCreatedAtInstantiation.value) {
        throw new Error(
          'Cannot enable action menu after grid instantiation. '
            + 'Action menu must be configured when the grid is created. '
            + 'To start with a hidden action menu column, use: { getActions: fn, hidden: true }',
        )
      }
    },
    { flush: 'sync' },
  )

  /**
   * Watch for hidden changes and update column visibility state
   */
  if (columnVisibilityState) {
    watch(
      isHidden,
      (hidden) => {
        if (hasActionMenuColumn.value) {
          columnVisibilityState.value = {
            ...columnVisibilityState.value,
            __actions: !hidden,
          }
        }
      },
      { immediate: true },
    )
  }

  return {
    isEnabled: isCurrentlyConfigured,
    hasActionMenuColumn,
    actionMenuColumn,
    appendActionMenuColumn,
    isHidden,
    isInteractive,
    parsedOptions,
  }
}
