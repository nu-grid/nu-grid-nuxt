import type { TableData } from '@nuxt/ui'
import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingInfoState,
  ColumnSizingState,
  ExpandedState,
  GroupingState,
  PaginationState,
  RowPinningState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
import type { NuGridEventEmitter } from '../../types'
import type { NuGridStates } from '../../types/_internal'
import { useCookie } from '#imports'
import { StorageSerializers, useStorage } from '@vueuse/core'
import { nextTick, onMounted, watch } from 'vue'

export interface NuGridStateSnapshot {
  globalFilter?: string
  columnFilters?: ColumnFiltersState
  columnOrder?: ColumnOrderState
  columnVisibility?: VisibilityState
  columnPinning?: ColumnPinningState
  columnSizing?: ColumnSizingState
  columnSizingInfo?: ColumnSizingInfoState
  rowSelection?: RowSelectionState
  rowPinning?: RowPinningState
  sorting?: SortingState
  grouping?: GroupingState
  expanded?: ExpandedState
  pagination?: PaginationState
}

/**
 * Composable for persisting and restoring NuGrid state to/from localStorage and cookies
 * Handles all state initialization, restoration, and persistence logic
 */
export function useNuGridStatePersistence<T extends TableData = TableData>(
  states: NuGridStates,
  enabled: boolean,
  storageId: string | undefined,
  onStateChanged?: (state: NuGridStateSnapshot) => void,
  eventEmitter?: NuGridEventEmitter<T>,
) {
  // Helper to emit state changes via both event emitter and callback
  // Check each handler exists to avoid overhead when no listeners
  const emitStateChanged = (state: NuGridStateSnapshot) => {
    if (eventEmitter?.stateChanged) {
      eventEmitter.stateChanged(state)
    }
    onStateChanged?.(state)
  }

  if (!enabled || !storageId) {
    return {
      getState: () => ({}),
      setState: (_snapshot: NuGridStateSnapshot) => {},
    }
  }

  const storageKey = enabled && storageId ? `nugrid-state-${storageId}` : null

  const cookieStateRef = storageKey
    ? useCookie<NuGridStateSnapshot | null>(storageKey, {
        default: () => null,
        sameSite: 'lax',
        path: '/',
      })
    : null

  const initialPersistedState = cookieStateRef?.value ?? null

  let storedState: ReturnType<typeof useStorage<NuGridStateSnapshot | null>> | null = null
  if (import.meta.client && storageKey) {
    storedState = useStorage<NuGridStateSnapshot | null>(storageKey, null, localStorage, {
      serializer: StorageSerializers.object,
    })
    if (storedState && initialPersistedState && storedState.value === null) {
      storedState.value = initialPersistedState
    }
  }

  let isRestoring = false
  let watchersActive = false
  let initialActivationComplete = false

  if (initialPersistedState) {
    applyStateSnapshot(initialPersistedState)
    emitStateChanged(initialPersistedState)
  }

  // If localStorage has state but cookie is missing (e.g., first load after a save),
  // apply it after mount to avoid hydration mismatches and sync the cookie for future SSR.
  if (import.meta.client && storedState) {
    onMounted(() => {
      const hasCookie = cookieStateRef?.value && Object.keys(cookieStateRef.value).length > 0
      const hasStored = storedState?.value && Object.keys(storedState.value ?? {}).length > 0
      if (!hasCookie && hasStored) {
        const snapshot = storedState.value as NuGridStateSnapshot
        isRestoring = true
        applyStateSnapshot(snapshot)
        if (cookieStateRef) {
          cookieStateRef.value = snapshot
        }
        emitStateChanged(getState())
        // Use nextTick to ensure all watchers have processed before resetting isRestoring
        nextTick(() => {
          isRestoring = false
        })
      }
    })
  }

  /**
   * Get current state snapshot
   * @returns A snapshot of the current grid state, only including properties with meaningful values
   */
  function getState(): NuGridStateSnapshot {
    const snapshot: NuGridStateSnapshot = {}

    if (states.globalFilterState.value) {
      snapshot.globalFilter = states.globalFilterState.value
    }
    if (hasArray(states.columnFiltersState.value)) {
      snapshot.columnFilters = states.columnFiltersState.value
    }
    if (hasArray(states.columnOrderState.value)) {
      snapshot.columnOrder = states.columnOrderState.value
    }
    if (hasKeys(states.columnVisibilityState.value)) {
      snapshot.columnVisibility = states.columnVisibilityState.value
    }
    if (hasKeys(states.columnPinningState.value)) {
      snapshot.columnPinning = states.columnPinningState.value
    }
    if (hasKeys(states.columnSizingState.value)) {
      snapshot.columnSizing = states.columnSizingState.value
    }
    if (hasKeys(states.columnSizingInfoState.value)) {
      snapshot.columnSizingInfo = states.columnSizingInfoState.value
    }
    if (hasKeys(states.rowSelectionState.value)) {
      snapshot.rowSelection = states.rowSelectionState.value
    }
    if (hasRowPinning(states.rowPinningState.value)) {
      snapshot.rowPinning = states.rowPinningState.value
    }
    if (hasArray(states.sortingState.value)) {
      snapshot.sorting = states.sortingState.value
    }
    if (hasArray(states.groupingState.value)) {
      snapshot.grouping = states.groupingState.value
    }
    if (hasExpanded(states.expandedState.value)) {
      snapshot.expanded = states.expandedState.value
    }
    if (hasKeys(states.paginationState.value)) {
      snapshot.pagination = states.paginationState.value
    }

    return snapshot
  }

  function hasArray<T>(value: T[] | undefined | null): value is T[] {
    return Array.isArray(value) && value.length > 0
  }

  function hasKeys(value: Record<string, any> | undefined | null): value is Record<string, any> {
    return !!value && Object.keys(value).length > 0
  }

  function hasRowPinning(value: RowPinningState | undefined | null): value is RowPinningState {
    return !!value && ((value.top?.length ?? 0) > 0 || (value.bottom?.length ?? 0) > 0)
  }

  function hasExpanded(value: ExpandedState | undefined | null): value is ExpandedState {
    if (value === undefined || value === null) return false
    if (value === true) return true
    return Object.keys(value).length > 0
  }

  function applyStateSnapshot(snapshot: NuGridStateSnapshot) {
    if (snapshot.globalFilter !== undefined) {
      states.globalFilterState.value = snapshot.globalFilter
    }
    if (snapshot.columnFilters !== undefined) {
      states.columnFiltersState.value = snapshot.columnFilters
    }
    if (snapshot.columnOrder !== undefined) {
      states.columnOrderState.value = snapshot.columnOrder
    }
    if (snapshot.columnVisibility !== undefined) {
      states.columnVisibilityState.value = snapshot.columnVisibility
    }
    if (snapshot.columnPinning !== undefined) {
      states.columnPinningState.value = snapshot.columnPinning
    }
    if (snapshot.columnSizing !== undefined) {
      states.columnSizingState.value = snapshot.columnSizing
    }
    if (snapshot.columnSizingInfo !== undefined) {
      states.columnSizingInfoState.value = snapshot.columnSizingInfo
    }
    if (snapshot.rowSelection !== undefined) {
      states.rowSelectionState.value = snapshot.rowSelection
    }
    if (snapshot.rowPinning !== undefined) {
      states.rowPinningState.value = snapshot.rowPinning
    }
    if (snapshot.sorting !== undefined) {
      states.sortingState.value = snapshot.sorting
    }
    if (snapshot.grouping !== undefined) {
      states.groupingState.value = snapshot.grouping
    }
    if (snapshot.expanded !== undefined) {
      states.expandedState.value = snapshot.expanded
    }
    if (snapshot.pagination !== undefined) {
      states.paginationState.value = snapshot.pagination
    }
  }

  /**
   * Set state from snapshot
   * @param snapshot - The state snapshot to apply to the grid
   */
  function setState(snapshot: NuGridStateSnapshot) {
    try {
      isRestoring = true
      applyStateSnapshot(snapshot)
      emitStateChanged(getState())
      // Use nextTick to ensure all watchers have processed before resetting isRestoring
      // This prevents watchers from firing after isRestoring is false and triggering duplicate events
      nextTick(() => {
        isRestoring = false
      })
    } catch (error) {
      console.warn('[NuGrid State] Failed to set state:', error)
      isRestoring = false
    }
  }

  function saveState() {
    if (isRestoring) {
      return
    }
    if (!watchersActive) {
      return
    }
    if (!storedState) {
      return
    }
    if (!initialActivationComplete) {
      return
    }
    try {
      const snapshot = getState()
      const hasState = Object.keys(snapshot).length > 0

      if (hasState) {
        storedState.value = snapshot
        if (cookieStateRef) {
          cookieStateRef.value = snapshot
        }
      } else {
        storedState.value = null
        if (cookieStateRef) {
          cookieStateRef.value = null
        }
      }

      emitStateChanged(snapshot)
    } catch (error) {
      console.warn('[NuGrid State] Failed to save state:', error)
    }
  }

  if (import.meta.client) {
    const watchedRefs = [
      states.globalFilterState,
      states.columnFiltersState,
      states.columnOrderState,
      states.columnVisibilityState,
      states.columnPinningState,
      states.columnSizingState,
      states.columnSizingInfoState,
      states.rowSelectionState,
      states.rowPinningState,
      states.sortingState,
      states.groupingState,
      states.expandedState,
      states.paginationState,
    ]

    for (const ref of watchedRefs) {
      watch(
        () => ref.value,
        () => saveState(),
        { deep: true },
      )
    }
  }

  if (storageKey && storedState) {
    if (import.meta.client) {
      nextTick(() => {
        watchersActive = true
        setTimeout(() => {
          initialActivationComplete = true
        }, 100)
      })
    }
  } else if (import.meta.client) {
    watchersActive = true
    initialActivationComplete = true
  }

  return {
    getState,
    setState,
  }
}
