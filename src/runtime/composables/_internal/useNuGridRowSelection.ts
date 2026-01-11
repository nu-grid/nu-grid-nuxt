import type { TableData } from '@nuxt/ui'
import type { Row, Table, VisibilityState } from '@tanstack/vue-table'
import type { Ref } from 'vue'
import type { NuGridColumn, NuGridRowSelectOptions } from '../../types'
import type {
  NuGridRowSelectionMode,
  NuGridSelectionColumnDef,
  UseNuGridRowSelectionReturn,
} from '../../types/_internal'
import { computed, h, ref, watch } from 'vue'
import NuGridCellCheckbox from '../../components/NuGridCellCheckbox.vue'
import { getDefaults } from '../../config/_internal'
import { nuGridCellTypeRegistry } from '../useNuGridCellTypeRegistry'

const selectionDefaults = getDefaults('selection')

interface SelectionTotalsCache<T extends TableData> {
  lastCoreRows: Row<T>[]
  lastSelectionState: unknown
  totalCount: number
  selectedCount: number
}

const selectionTotalsCache = new WeakMap<Table<TableData>, SelectionTotalsCache<TableData>>()

/**
 * Create the selection column for row selection mode
 * The column is created once and uses refs to reactively update its behavior
 */
function createSelectionColumn<T extends TableData>(
  modeRef: Ref<'single' | 'multi' | null>,
  enabledRef: Ref<boolean>,
  rowSelectionEnabledRef: Ref<((row: Row<T>) => boolean) | undefined>,
  columnDef?: NuGridSelectionColumnDef<T>,
): NuGridColumn<T> {
  const defaultColumn: NuGridColumn<T> = {
    id: '__selection',
    size: 48,
    minSize: 48,
    maxSize: 48,
    enableResizing: false,
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: false,
    enableGrouping: false,
    enableReordering: false,
    enablePinning: false,
    enableEditing: true,
    enableFocusing: true,
    cellDataType: 'selection',
    editor: nuGridCellTypeRegistry.getEditor('selection'),
    accessorFn: (_row, _index) => {
      // Return a placeholder value for the accessor
      // The actual selection state is managed by TanStack Table
      return false
    },
    // Header reactively checks the current mode to show/hide "select all" checkbox
    header: ({ table }: { table: Table<T> }) => {
      // Only show select all checkbox in multi mode
      if (modeRef.value !== 'multi') {
        return ''
      }

      const typedTable = table as unknown as Table<TableData>
      const coreRows = table.getCoreRowModel().rows as Row<TableData>[]
      const rowSelection = table.getState().rowSelection

      let totalCount = 0
      let selectedCount = 0

      const cached = selectionTotalsCache.get(typedTable)
      if (
        cached
        && cached.lastCoreRows === coreRows
        && cached.lastSelectionState === rowSelection
      ) {
        totalCount = cached.totalCount
        selectedCount = cached.selectedCount
      } else {
        for (const row of coreRows) {
          if (row.getCanSelect()) {
            totalCount++
            if (rowSelection[row.id]) {
              selectedCount++
            }
          }
        }

        selectionTotalsCache.set(typedTable, {
          lastCoreRows: coreRows,
          lastSelectionState: rowSelection,
          totalCount,
          selectedCount,
        })
      }

      const isAllSelected = totalCount > 0 && selectedCount === totalCount
      const isSomeSelected = selectedCount > 0 && selectedCount < totalCount

      return h(NuGridCellCheckbox, {
        'modelValue': isSomeSelected ? 'indeterminate' : isAllSelected,
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'interactive': enabledRef.value,
        'disabled': !enabledRef.value,
        'aria-label': 'Select all',
      })
    },
    // Store enabled ref in meta for cell renderer to access
    // Using 'any' type assertion because ColumnMeta is user-defined in TanStack Table
    meta: {
      selectionEnabled: true, // Default value, actual check uses enabledRef
      enabledRef, // Pass the ref so cell renderer can access current value
      rowSelectionEnabledRef, // Pass the ref so cell renderer can check per-row selection
    } as any,
  }

  // Merge user-provided columnDef with defaults
  // Note: columnDef excludes meta, so we can safely merge without overriding meta
  return {
    ...defaultColumn,
    ...(columnDef as NuGridSelectionColumnDef<T>),
  } as NuGridColumn<T>
}

/**
 * Helper to check if value is a NuGridRowSelectOptions object
 */
function isNuGridRowSelectOptions<T extends TableData>(
  value: NuGridRowSelectionMode<T>,
): value is NuGridRowSelectOptions<T> {
  return typeof value === 'object' && value !== null
}

/**
 * Parse row selection mode into options
 */
function parseRowSelectionMode<T extends TableData>(
  mode: NuGridRowSelectionMode<T>,
): NuGridRowSelectOptions<T> | null {
  if (mode === undefined || mode === false) return null
  if (mode === true || mode === 'multi')
    return {
      mode: selectionDefaults.mode,
      hidden: selectionDefaults.hidden,
      enabled: selectionDefaults.enabled,
    }
  if (mode === 'single')
    return {
      mode: 'single',
      hidden: selectionDefaults.hidden,
      enabled: selectionDefaults.enabled,
    }
  if (isNuGridRowSelectOptions<T>(mode)) {
    return {
      mode: mode.mode ?? selectionDefaults.mode,
      hidden: mode.hidden ?? selectionDefaults.hidden,
      enabled: mode.enabled ?? selectionDefaults.enabled,
      rowSelectionEnabled: mode.rowSelectionEnabled,
      columnDef: mode.columnDef,
    }
  }
  return null
}

/**
 * Composable for managing row selection in NuGrid.
 * Handles creating the selection column and determining if multi-selection is enabled.
 *
 * IMPORTANT: The selection column is created at instantiation and cannot be added later.
 * If rowSelectionMode is initially false/undefined and later changed to enabled,
 * an error will be thrown. To start with a hidden selection column, use:
 * { mode: 'multi', hidden: true }
 */
export function useNuGridRowSelection<T extends TableData>(
  rowSelectionMode: Ref<NuGridRowSelectionMode<T>>,
  columnVisibilityState?: Ref<VisibilityState>,
): UseNuGridRowSelectionReturn<T> {
  // Track whether the column was created at instantiation
  const initialOptions = parseRowSelectionMode(rowSelectionMode.value)
  const wasCreatedAtInstantiation = ref(initialOptions !== null)

  /**
   * Parsed options from the rowSelectionMode value
   */
  const parsedOptions = computed((): NuGridRowSelectOptions<T> | null => {
    return parseRowSelectionMode<T>(rowSelectionMode.value)
  })

  /**
   * Whether row selection is currently configured (may be false after being enabled)
   */
  const isCurrentlyConfigured = computed(() => {
    return parsedOptions.value !== null
  })

  /**
   * Whether the selection column exists (was created at instantiation)
   * This determines if the column should be in the columns array
   */
  const hasSelectionColumn = computed(() => {
    return wasCreatedAtInstantiation.value
  })

  /**
   * The normalized selection mode ('single' or 'multi')
   * Falls back to the initial mode if currently disabled but was created at instantiation
   */
  const normalizedMode = computed((): 'single' | 'multi' | null => {
    if (parsedOptions.value) {
      return parsedOptions.value.mode ?? 'multi'
    }
    // If disabled but column was created, use 'multi' as default
    if (wasCreatedAtInstantiation.value) {
      return 'multi'
    }
    return null
  })

  /**
   * Whether the selection column should be hidden
   * If rowSelectionMode is set to false/none after being enabled, the column is hidden
   */
  const isHidden = computed(() => {
    // If currently disabled but column exists, it should be hidden
    if (!isCurrentlyConfigured.value && wasCreatedAtInstantiation.value) {
      return true
    }
    return parsedOptions.value?.hidden ?? false
  })

  /**
   * Whether the checkboxes are enabled/clickable
   */
  const isInteractive = computed(() => {
    // If currently disabled, checkboxes should not be interactive
    if (!isCurrentlyConfigured.value) {
      return false
    }
    return parsedOptions.value?.enabled ?? true
  })

  /**
   * Function to check if a specific row can be selected
   * Returns undefined if no per-row selection check is configured
   */
  const rowSelectionEnabled = computed((): ((row: Row<T>) => boolean) | undefined => {
    if (!isCurrentlyConfigured.value) {
      return undefined
    }
    return parsedOptions.value?.rowSelectionEnabled
  })

  /**
   * Whether multi-row selection is enabled (for TanStack Table config)
   */
  const enableMultiRowSelection = computed(() => {
    return normalizedMode.value !== 'single'
  })

  /**
   * Function for TanStack Table's enableRowSelection option.
   * Combines global interactive state and per-row selection check.
   * Returns a function that TanStack uses to determine if a row can be selected.
   */
  const enableRowSelection = computed((): boolean | ((row: Row<T>) => boolean) => {
    // If globally disabled, no rows can be selected
    if (!isInteractive.value) {
      return false
    }

    // If there's a per-row selection function, wrap it
    const rowSelectionFn = rowSelectionEnabled.value
    if (rowSelectionFn) {
      return (row: Row<T>) => rowSelectionFn(row)
    }

    // All rows can be selected
    return true
  })

  /**
   * The selection column instance - created once at instantiation and never recreated.
   * It uses refs internally to reactively update its behavior (header checkbox visibility, enabled state).
   */
  const selectionColumn: NuGridColumn<T> | null = wasCreatedAtInstantiation.value
    ? createSelectionColumn<T>(
        normalizedMode,
        isInteractive,
        rowSelectionEnabled,
        // Type assertion needed because NuGridRowSelectOptions.columnDef defaults to SelectionColumnDef<TableData>
        // but we need SelectionColumnDef<T>. At runtime, if columnDef is provided, it will be compatible.
        initialOptions?.columnDef as any,
      )
    : null

  /**
   * Prepend selection column to columns array if it was created at instantiation
   */
  function prependSelectionColumn(columns: NuGridColumn<T>[]): NuGridColumn<T>[] {
    if (!selectionColumn) return columns
    return [selectionColumn, ...columns]
  }

  // Watch for changes and handle the "can't add column after creation" rule
  watch(
    rowSelectionMode,
    (newValue) => {
      const newOptions = parseRowSelectionMode<T>(newValue)

      // If trying to enable selection when it wasn't created at instantiation, throw error
      if (newOptions !== null && !wasCreatedAtInstantiation.value) {
        throw new Error(
          'Cannot enable row selection after grid instantiation. '
            + 'Row selection must be configured when the grid is created. '
            + 'To start with a hidden selection column, use: { mode: "multi", hidden: true }',
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
        if (hasSelectionColumn.value) {
          columnVisibilityState.value = {
            ...columnVisibilityState.value,
            __selection: !hidden,
          }
        }
      },
      { immediate: true },
    )
  }

  return {
    isEnabled: isCurrentlyConfigured,
    hasSelectionColumn,
    normalizedMode,
    enableMultiRowSelection,
    enableRowSelection,
    selectionColumn,
    prependSelectionColumn,
    isHidden,
    isInteractive,
    rowSelectionEnabled,
    parsedOptions,
  }
}
