import type { TableColumn, TableData } from '@nuxt/ui'
import type { Cell, GroupingState, Row, Table } from '@tanstack/vue-table'
import type { ComputedRef, Ref } from 'vue'
import type { NuGridAddRowFinalizeResult, NuGridAddRowState, NuGridProps } from '../../types'
import type {
  NuGridCellEditing,
  NuGridEditingCell,
  NuGridFocus,
  NuGridGroupingFns,
  NuGridInteractionRouter,
} from '../../types/_internal'
import { createRow } from '@tanstack/table-core'
import { computed, isRef, nextTick, onUnmounted, ref, shallowRef, watch } from 'vue'
import { isEmptyGroupPlaceholder } from './useNuGridEmptyGroups'

export const ADD_ROW_FLAG = '__nugridAddNewRow'

type AddRowPosition = 'none' | 'top' | 'bottom'

function resolvePosition(addNewRow: NuGridProps['addNewRow']): AddRowPosition {
  if (!addNewRow) {
    return 'none'
  }

  if (addNewRow === true) {
    return 'bottom'
  }

  return addNewRow.position ?? 'bottom'
}

function isAddRowRecord(record: any) {
  return !!record?.[ADD_ROW_FLAG]
}

function createAddRowRecord<T extends TableData>(
  groupingValues?: Partial<T>,
  uniqueSuffix?: string,
): T {
  const idSuffix = uniqueSuffix ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const base: any = groupingValues ? { ...groupingValues } : {}
  base[ADD_ROW_FLAG] = true
  if (base.id === undefined) {
    base.id = `add-new-${idSuffix}`
  }
  return base as T
}

export function useNuGridAddRow<T extends TableData>(options: {
  props: NuGridProps<T>
  data: Ref<T[]>
  table: Table<T>
  rows: ComputedRef<Row<T>[]>
  columns: ComputedRef<TableColumn<T>[]>
  groupingState: Ref<GroupingState>
  onAddRowRequested?: (row: T) => NuGridAddRowFinalizeResult & { row?: T }
  editingCell?: Ref<NuGridEditingCell | null>
  focusFns?: Ref<NuGridFocus<T> | null>
  cellEditingFns?: Ref<NuGridCellEditing<T> | null>
  groupingFns?: Ref<NuGridGroupingFns<T> | null> | NuGridGroupingFns<T> | null
  onAddRowStateChange?: (state: NuGridAddRowState) => void
  interactionRouter?: NuGridInteractionRouter<T> | null
}) {
  const addRowPosition = computed<AddRowPosition>(() => resolvePosition(options.props.addNewRow))
  const showAddNewRow = computed(() => addRowPosition.value !== 'none')
  const addNewText = computed(() => {
    const addNewRow = options.props.addNewRow
    if (typeof addNewRow === 'object' && addNewRow.addNewText) {
      return addNewRow.addNewText
    }
    return 'Click here to add'
  })

  const addRowDraft: Ref<T | null> = ref(null)
  const addRowRow: Ref<Row<T> | null> = shallowRef(null)
  const groupAddRowDrafts: Ref<Map<string, T>> = shallowRef(new Map<string, T>())
  const groupAddRowRows: Ref<Map<string, Row<T>>> = shallowRef(new Map<string, Row<T>>())
  // Flag to maintain 'editing' state during add-row cell transitions
  // Set on pointerdown, cleared when editingCell is set - prevents blur-induced state flicker
  const addRowTransitioning = ref(false)
  // Flag to track if we're currently finalizing an addrow (prevents focus handlers from running)
  const isFinalizing = ref(false)
  // Store the row ID being finalized to prevent focus handlers from focusing it
  const finalizingRowId = ref<string | null>(null)
  // Version counter that increments when add row values change - used to trigger re-renders
  const valueVersion = ref(0)
  const triggerValueUpdate = () => {
    valueVersion.value++
  }
  let unregisterPointer: (() => void) | null = null

  // Helper: Get current editing value, handling both Ref and direct value cases
  function getCurrentEditingValue(editingValue: any, fallbackValue: any): any {
    const isRef = editingValue && typeof editingValue === 'object' && 'value' in editingValue
    return isRef ? ((editingValue as any).value ?? fallbackValue) : (editingValue ?? fallbackValue)
  }

  // Helper: Return object to stop event propagation
  function stopEventPropagation() {
    return {
      handled: true,
      stop: true,
      preventDefault: true,
      stopPropagation: true,
    }
  }
  let unregisterCellClick: (() => void) | null = null

  function collectGroupRows(rows: Row<T>[], all: Row<T>[]) {
    rows.forEach((row) => {
      if (row.getIsGrouped?.()) {
        all.push(row)
        if (row.subRows?.length) {
          collectGroupRows(row.subRows as Row<T>[], all)
        }
      }
    })
  }

  function resetAddRowRow() {
    addRowDraft.value = null
    addRowRow.value = null
  }

  function resetAddRow(row: Row<T>) {
    if (!isAddRowRow(row)) {
      return
    }

    // For grouped add rows, reset the specific group's draft
    if (options.groupingState.value.length) {
      const parentId = (row as any).parentId
      if (parentId) {
        groupAddRowDrafts.value.delete(parentId)
        groupAddRowRows.value.delete(parentId)
      }
    } else {
      // For non-grouped, reset the main add row
      resetAddRowRow()
    }

    // Refresh to create a new empty add row
    refreshAddRows()
  }

  function resetGroupedAddRows() {
    groupAddRowDrafts.value = new Map<string, T>()
    groupAddRowRows.value = new Map<string, Row<T>>()
  }

  function ensureAddRowRow(): Row<T> {
    if (addRowRow.value) {
      // Ensure row.original always points to the current draft
      // If the draft exists and is different from row.original, update row.original
      // This ensures that updates to the draft are reflected in the row
      if (addRowDraft.value) {
        // row.original should be the same reference as addRowDraft.value
        // But if for some reason they're different, ensure they're in sync
        if (addRowRow.value.original !== addRowDraft.value) {
          // This shouldn't happen, but if it does, recreate the row
          const id =
            (addRowDraft.value as any).id
            ?? `add-new-${Date.now()}-${Math.random().toString(36).slice(2)}`
          const rowIndex = options.rows.value.length
          addRowRow.value = createRow(
            options.table as any,
            id as string,
            addRowDraft.value as T,
            rowIndex,
            0,
            undefined,
            undefined,
          ) as Row<T>
        }
      }
      return addRowRow.value
    }

    const draft = addRowDraft.value ?? createAddRowRecord<T>()
    addRowDraft.value = draft

    const id = (draft as any).id ?? `add-new-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const rowIndex = options.rows.value.length

    addRowRow.value = createRow(
      options.table as any,
      id as string,
      draft as T,
      rowIndex,
      0,
      undefined,
      undefined,
    ) as Row<T>

    return addRowRow.value
  }

  const orderedRows = computed(() => {
    if (!showAddNewRow.value || addRowPosition.value === 'none') {
      return options.rows.value
    }

    if (options.groupingState.value.length) {
      return options.rows.value
    }

    const addRow = ensureAddRowRow()

    if (addRowPosition.value === 'top') {
      return [addRow, ...options.rows.value]
    }

    return [...options.rows.value, addRow]
  })

  function resolveGroupingFns() {
    if (!options.groupingFns) {
      return null
    }

    return isRef(options.groupingFns) ? options.groupingFns.value : options.groupingFns
  }

  // Helper: Find the editing row from editingCell
  function findEditingRow(
    editingCell: NuGridEditingCell,
    useOrderedRows = true,
  ): Row<T> | undefined {
    const groupingFns = resolveGroupingFns()
    const rowsList = useOrderedRows
      ? (groupingFns?.navigableRows?.value ?? orderedRows.value)
      : (groupingFns?.navigableRows?.value ?? options.rows.value)
    return rowsList.find((r) => r.id === editingCell.rowId)
  }

  // Helper: Focus and activate the new add row after finalization
  function focusNewAddRow() {
    nextTick(() => {
      if (options.focusFns?.value && options.cellEditingFns?.value) {
        const groupingFns = resolveGroupingFns()
        const rowsList = groupingFns?.navigableRows?.value ?? orderedRows.value

        // Find the new add row (should be the first add row after refresh)
        const newAddRow = rowsList.find((r) => isAddRowRow(r))

        if (newAddRow) {
          const firstEditableCell = newAddRow
            .getVisibleCells()
            .find((c: Cell<T, any>) => options.cellEditingFns?.value?.isCellEditable(newAddRow, c))

          if (firstEditableCell && options.focusFns.value && options.cellEditingFns?.value) {
            // Start editing on the first editable cell (same as keyboard navigation)
            // This activates the add row, not just focuses it
            options.cellEditingFns.value.startEditing(newAddRow, firstEditableCell)
          }
        }
      }
    })
  }

  function resolveGroupingValue(groupRow: Row<T>, columnId: string) {
    const rowsById = (options.table.getRowModel() as any)?.rowsById ?? {}
    let current: Row<T> | null | undefined = groupRow

    while (current) {
      const value = current.getValue(columnId)
      if (value !== undefined) {
        return value
      }

      const parentId: string | undefined = (current as any).parentId
      current = parentId ? rowsById[parentId] : null
    }

    return undefined
  }

  function buildGroupingValues(groupRow: Row<T>): Partial<T> {
    const values: Record<string, any> = {}
    options.groupingState.value.forEach((columnId) => {
      const value = resolveGroupingValue(groupRow, columnId as string)
      if (value !== undefined) {
        values[columnId as string] = value
      }
    })
    return values as Partial<T>
  }

  function refreshAddRows() {
    if (!showAddNewRow.value) {
      resetAddRowRow()
      resetGroupedAddRows()
      return
    }

    const grouping = options.groupingState.value

    if (!grouping.length) {
      resetGroupedAddRows()
      // Preserve the existing draft when refreshing (don't reset if it exists)
      // This ensures values entered in add rows persist across refreshes
      if (!addRowDraft.value) {
        resetAddRowRow()
      }
      ensureAddRowRow()
      return
    }

    resetAddRowRow()

    const groupRows = options.table.getSortedRowModel().rows
    const allGroupRows: Row<T>[] = []

    collectGroupRows(groupRows as Row<T>[], allGroupRows)
    const nextDrafts = new Map<string, T>()
    const nextRows = new Map<string, Row<T>>()

    allGroupRows.forEach((groupRow) => {
      if (!groupRow.getIsGrouped?.()) {
        return
      }

      // Check if this is a leaf group (has no nested subgroups)
      // Empty groups (with no subRows) are still leaf groups and should get add rows
      const hasNestedGroups = groupRow.subRows?.some((subRow: Row<T>) => subRow.getIsGrouped?.()) ?? false
      if (hasNestedGroups) {
        return
      }

      const existingDraft = groupAddRowDrafts.value.get(groupRow.id)
      const draft = (existingDraft ?? createAddRowRecord<T>(buildGroupingValues(groupRow))) as T
      nextDrafts.set(groupRow.id, draft)

      const id = (draft as any).id ?? `${groupRow.id}-add-new`
      const rowIndex = groupRow.subRows?.length ?? 0
      const depth = (groupRow as any).depth ?? (groupRow.parentId ? 1 : 0)

      const row = createRow(
        options.table as any,
        id as string,
        draft as T,
        rowIndex,
        depth + 1,
        undefined,
        groupRow.id,
      ) as Row<T>

      nextRows.set(groupRow.id, row)
    })

    groupAddRowDrafts.value = nextDrafts
    groupAddRowRows.value = nextRows
  }

  function isAddRowRow(row: Row<T>) {
    return isAddRowRecord(row.original)
  }

  function normalizeValidation(result: any): { valid: boolean; message?: string } {
    if (result === undefined || result === null) return { valid: true }
    if (typeof result === 'boolean') return { valid: result }
    if (typeof result === 'string') return { valid: false, message: result }
    if (typeof result === 'object' && 'valid' in result) {
      return { valid: !!(result as any).valid, message: (result as any).message }
    }
    return { valid: true }
  }

  function validateAddRow(row: Row<T>): NuGridAddRowFinalizeResult {
    const messages: string[] = []
    const cols = options.columns.value

    cols.forEach((column) => {
      const columnDef: any = (column as any)?.columnDef ?? column
      if (!columnDef || (column as any)?.columns) {
        return
      }
      if (columnDef.showNew === false) {
        return
      }

      const columnId = (column as any)?.id ?? (column as any)?.accessorKey ?? columnDef?.id

      if (!columnId) {
        return
      }

      const value = row.getValue(columnId as string)

      const required =
        typeof columnDef.requiredNew === 'function'
          ? columnDef.requiredNew()
          : columnDef.requiredNew

      if (required && (value === undefined || value === null || value === '')) {
        messages.push(`${columnId} is required`)
        return
      }

      if (columnDef.validateNew) {
        const res = normalizeValidation(columnDef.validateNew(value))
        if (!res.valid) {
          messages.push(res.message || `${columnId} is invalid`)
        }
      }
    })

    return { success: messages.length === 0, messages }
  }

  function finalizeAddRow(row: Row<T>): NuGridAddRowFinalizeResult {
    if (!isAddRowRow(row)) {
      return { success: true }
    }

    // Prevent duplicate finalization - if this row is already being finalized, return early
    if (isFinalizing.value && finalizingRowId.value === row.id) {
      return { success: true }
    }

    // Set flags IMMEDIATELY to prevent duplicate calls from other handlers
    isFinalizing.value = true
    finalizingRowId.value = row.id

    const validation = validateAddRow(row)
    if (!validation.success) {
      // Clear flags on validation failure so user can try again
      isFinalizing.value = false
      finalizingRowId.value = null
      return validation
    }

    let newRow: any = { ...(row.original as any) }
    delete newRow[ADD_ROW_FLAG]

    if (options.onAddRowRequested) {
      try {
        const result = options.onAddRowRequested(newRow)
        if (!result.success) {
          isFinalizing.value = false
          finalizingRowId.value = null
          return { success: false, messages: result.messages }
        }
        if (result.row) {
          newRow = result.row
        }
      } catch (error: any) {
        isFinalizing.value = false
        finalizingRowId.value = null
        return {
          success: false,
          messages: [error?.message || 'Add row failed'],
        }
      }
    }

    // Clear the current draft so the next add row starts empty
    if (options.groupingState.value.length) {
      const parentId = (row as any).parentId
      if (parentId) {
        groupAddRowDrafts.value.delete(parentId)
        groupAddRowRows.value.delete(parentId)
      }
    } else {
      resetAddRowRow()
    }

    refreshAddRows()

    // Clear flags after a delay to ensure click handlers have run
    setTimeout(() => {
      if (finalizingRowId.value === row.id) {
        isFinalizing.value = false
        finalizingRowId.value = null
      }
    }, 100)

    return { success: true }
  }

  const addRowState = computed<NuGridAddRowState>(() => {
    const groupingFns = resolveGroupingFns()

    // Check if editing
    const editing = options.editingCell?.value
    if (editing) {
      const rootAddRow = addRowRow.value
      if (rootAddRow && rootAddRow.id === editing.rowId) {
        return 'editing'
      }

      const rowsList = groupingFns?.navigableRows?.value ?? options.rows.value
      const editingRow = rowsList.find((row: Row<T>) => row.id === editing.rowId)

      if (editingRow && isAddRowRow(editingRow)) {
        return 'editing'
      }

      if (groupingFns?.groupRows?.value?.length) {
        for (const groupRow of groupingFns.groupRows.value) {
          const groupAddRow = groupAddRowRows.value.get(groupRow.id)
          if (groupAddRow && groupAddRow.id === editing.rowId) {
            return 'editing'
          }
        }
      }
    }

    // If we're transitioning between add-row cells, maintain 'editing' state
    // This prevents flicker when blur clears editingCell before click sets it again
    if (addRowTransitioning.value) {
      return 'editing'
    }

    // Check if focused (but not editing)
    const focus = options.focusFns?.value?.focusedCell.value
    if (focus) {
      // Use navigableRows if available (includes add row when grouping)
      // Otherwise construct the rows list that includes add row
      let rowsList: Row<T>[]
      if (groupingFns?.navigableRows?.value) {
        rowsList = groupingFns.navigableRows.value
      } else if (
        showAddNewRow.value
        && addRowPosition.value !== 'none'
        && !options.groupingState.value.length
      ) {
        // Construct rows list with add row (same logic as orderedRows)
        const addRow = addRowRow.value
        if (addRow) {
          if (addRowPosition.value === 'top') {
            rowsList = [addRow, ...options.rows.value]
          } else {
            rowsList = [...options.rows.value, addRow]
          }
        } else {
          rowsList = options.rows.value
        }
      } else {
        rowsList = options.rows.value
      }

      // Get the focused row by index and check if it's an add row
      const focusedRow = rowsList[focus.rowIndex]
      if (focusedRow && isAddRowRow(focusedRow)) {
        return 'focused'
      }

      // Check group add rows by comparing focused row ID
      if (focusedRow && groupingFns?.groupRows?.value?.length) {
        for (const groupRow of groupingFns.groupRows.value) {
          const groupAddRow = groupAddRowRows.value.get(groupRow.id)
          if (groupAddRow && groupAddRow.id === focusedRow.id) {
            return 'focused'
          }
        }
      }
    }

    return 'idle'
  })

  if (options.onAddRowStateChange) {
    watch(
      addRowState,
      (next, prev) => {
        if (next !== prev) {
          options.onAddRowStateChange?.(next)
        }
      },
      { immediate: true },
    )
  }

  // Check if currently editing an add-row cell
  const isEditingAddRow = (): boolean => {
    const editing = options.editingCell?.value
    if (!editing) return false

    const rootAddRow = addRowRow.value
    if (rootAddRow && rootAddRow.id === editing.rowId) {
      return true
    }

    // Check group add rows
    for (const [, groupAddRow] of groupAddRowRows.value) {
      if (groupAddRow.id === editing.rowId) {
        return true
      }
    }

    return false
  }

  // Watch editingCell to clear the transitioning flag when editing starts
  // This is the primary mechanism to clear the flag after a transition completes
  if (options.editingCell) {
    watch(
      () => options.editingCell?.value,
      (editing) => {
        if (editing && addRowTransitioning.value) {
          addRowTransitioning.value = false
          // Clear suppressOutline now that the transition is complete
          const focusedCell = options.focusFns?.value?.focusedCell
          if (focusedCell?.value?.suppressOutline) {
            focusedCell.value = { ...focusedCell.value, suppressOutline: false }
          }
        }
      },
    )
  }

  // Helper to check if a cell is editable (replicates logic from useNuGridCellEditing)
  function isCellEditable(row: Row<T>, cell: Cell<T, any>): boolean {
    // Handle boolean shorthand: editing: false means disabled
    // editing: true or editing: { ... } means enabled (unless enabled: false in object)
    const editingProp = options.props.editing
    if (editingProp === false) {
      return false
    }
    if (typeof editingProp === 'object' && editingProp?.enabled === false) {
      return false
    }

    const columnDef = cell.column.columnDef
    const isAddRow = isAddRowRow(row)

    if (isAddRow && columnDef.showNew === false) {
      return false
    }

    if (isAddRow) {
      const groupingState = options.table.getState().grouping || []
      if (groupingState.includes(cell.column.id as string)) {
        return false
      }
    }

    if (columnDef.enableEditing !== undefined) {
      if (typeof columnDef.enableEditing === 'function') {
        return columnDef.enableEditing(row)
      }
      return columnDef.enableEditing
    }

    return true
  }

  // Helper to find the closest editable cell to the left
  function findClosestEditableCellToLeft(
    row: Row<T>,
    clickedCellIndex: number | null,
  ): Cell<T, any> | null {
    const cells = row.getVisibleCells() as Cell<T, any>[]
    const startIndex = clickedCellIndex !== null ? clickedCellIndex : cells.length

    // Search from the clicked cell (or end) backwards to find the first editable cell
    for (let i = startIndex - 1; i >= 0; i--) {
      const cell = cells[i]
      if (cell && isCellEditable(row, cell)) {
        return cell
      }
    }

    return null
  }

  // Helper to find the first editable cell to the right
  function findFirstEditableCellToRight(
    row: Row<T>,
    clickedCellIndex: number | null,
  ): Cell<T, any> | null {
    const cells = row.getVisibleCells() as Cell<T, any>[]
    const startIndex = clickedCellIndex !== null ? clickedCellIndex : -1

    // Search from the clicked cell forwards to find the first editable cell
    for (let i = startIndex + 1; i < cells.length; i++) {
      const cell = cells[i]
      if (cell && isCellEditable(row, cell)) {
        return cell
      }
    }

    return null
  }

  // Helper: does this row correspond to any add-row sentinel (root or grouped)
  const isAnyAddRow = (row: Row<T>) => {
    if (isAddRowRow(row)) return true
    if (addRowRow.value && addRowRow.value.id === row.id) return true
    for (const [, groupAddRow] of groupAddRowRows.value) {
      if (groupAddRow.id === row.id) return true
    }
    return typeof row.id === 'string' && row.id.startsWith('add-new-')
  }

  if (options.interactionRouter) {
    // Register cell click handler for uneditable addrow cells
    // Use priority 5 to run BEFORE focus (10) when editing, but let focus handle it when not editing
    unregisterCellClick = options.interactionRouter.registerCellClickHandler({
      id: 'add-row-uneditable-click',
      priority: 5, // Before focus (10) - intercepts when editing, passes through when not editing
      when: ({ row, event }) => {
        // Skip if pointer handler already handled this
        // Check both the flag and the row ID to be extra safe
        if (
          (event as any).__addRowFinalizing
          || isFinalizing.value
          || finalizingRowId.value === row.id
        ) {
          return false
        }
        return isAnyAddRow(row)
      },
      handle: ({ event, row, cell, cellIndex: _cellIndex }) => {
        // Skip if we're currently finalizing (handled by pointer handler)
        // Check this FIRST before any other logic
        // Check both the flag and the row ID to be extra safe
        if (
          isFinalizing.value
          || (event as any).__addRowFinalizing
          || finalizingRowId.value === row.id
        ) {
          ;(event as any).__addRowFinalizing = true
          return stopEventPropagation()
        }

        // If clicking on an editable cell, let normal handlers take over
        if (isCellEditable(row, cell)) {
          return { handled: false }
        }

        // Case 1: Addrow is IN edit mode - stop editing and finalize
        // Run BEFORE focus to prevent it from focusing the next row
        // Double-check isFinalizing and finalizingRowId here too in case it changed
        if (
          addRowState.value === 'editing'
          && !isFinalizing.value
          && finalizingRowId.value !== row.id
        ) {
          const cellEditingFns = options.cellEditingFns?.value
          const editingCell = options.editingCell?.value

          if (cellEditingFns && editingCell && cellEditingFns.editingValue) {
            // Find the currently editing row
            const editingRow = findEditingRow(editingCell, false)

            if (editingRow && isAddRowRow(editingRow)) {
              const editingCellObj = editingRow
                .getVisibleCells()
                .find((c: Cell<T, any>) => c.column.id === editingCell.columnId)

              if (editingCellObj) {
                // Double-check we're not already finalizing (race condition protection)
                if (isFinalizing.value && finalizingRowId.value === editingRow.id) {
                  return stopEventPropagation()
                }

                // Mark this event to prevent blur and click-outside handlers from interfering
                ;(event as any).__addRowFinalizing = true

                // Save the current editing value first
                const currentValue = cellEditingFns.editingValue?.value ?? editingCellObj.getValue()

                // Stop editing to save the value (but don't restore focus)
                // This saves the value to the row's data
                cellEditingFns.stopEditing(editingRow, editingCellObj, currentValue, undefined, {
                  restoreFocus: false,
                })

                // Now try to finalize the addrow (like pressing ArrowUp would do)
                const result = finalizeAddRow(editingRow)

                if (!result.success) {
                  // Validation failed - restart editing on the same cell to show the error
                  // The finalizeAddRow should have set validation error messages
                  const cellEditingFns = options.cellEditingFns?.value
                  if (cellEditingFns) {
                    // Restart editing to show validation error
                    cellEditingFns.startEditing(editingRow, editingCellObj, currentValue)
                  }
                  return stopEventPropagation()
                }

                // Successfully finalized - editing state is already cleared by stopEditing
                // Clear focusedCell to prevent any focus restoration attempts
                if (options.focusFns?.value) {
                  options.focusFns.value.focusedCell.value = null
                }

                // Prevent further handlers from running (especially focus handler and blur)
                return stopEventPropagation()
              }
            }
          }

          return { handled: false }
        }

        // Case 2: Addrow is NOT in edit mode - let focus handler run first, then handle
        // Return handled: false so focus (priority 10) can handle it, then we'll handle finding closest editable
        // Actually, we need to handle this AFTER focus, so we need a separate handler or different priority
        // For now, let focus handle it and we'll handle finding closest editable in a second handler
        return { handled: false }
      },
    })

    // Register a second handler for uneditable cells that runs BEFORE focus
    // This ensures we can correctly focus the clicked addrow's editable cell, even if another group's addrow is focused
    let unregisterCellClickNotEditing: (() => void) | null = null
    unregisterCellClickNotEditing = options.interactionRouter.registerCellClickHandler({
      id: 'add-row-uneditable-click-not-editing',
      priority: 8, // Before focus (10), so we can handle uneditable cells correctly
      when: ({ row }) => isAnyAddRow(row),
      handle: ({ event, row, cell, cellIndex }) => {
        // If clicking on an editable cell, let normal handlers take over
        if (isCellEditable(row, cell)) {
          return { handled: false }
        }

        // If we're currently editing THIS addrow, let the editing handler deal with it
        const editingCell = options.editingCell?.value
        if (editingCell && editingCell.rowId === row.id) {
          return { handled: false }
        }

        // Find closest editable cell to the left first, then to the right if none found
        let closestEditableCell = findClosestEditableCellToLeft(row, cellIndex)
        if (!closestEditableCell) {
          closestEditableCell = findFirstEditableCellToRight(row, cellIndex)
        }

        // If no editable cell found, let other handlers take over
        if (!closestEditableCell) {
          return { handled: false }
        }

        // Mark the event so focus handler skips it (we'll handle focus ourselves)
        ;(event as any).__addRowUneditableClick = true

        // Stop any existing editing from a different addrow before starting new editing
        const cellEditingFns = options.cellEditingFns?.value
        const needsToStopEditing =
          cellEditingFns
          && editingCell
          && (() => {
            const groupingFns = resolveGroupingFns()
            const rowsList = groupingFns?.navigableRows?.value ?? options.rows.value
            const currentlyEditingRow = rowsList.find((r) => r.id === editingCell.rowId)
            return (
              currentlyEditingRow
              && isAddRowRow(currentlyEditingRow)
              && currentlyEditingRow.id !== row.id
            )
          })()

        if (needsToStopEditing && cellEditingFns && editingCell) {
          const groupingFns = resolveGroupingFns()
          const rowsList = groupingFns?.navigableRows?.value ?? options.rows.value
          const currentlyEditingRow = rowsList.find((r) => r.id === editingCell.rowId)

          if (currentlyEditingRow) {
            const editingCellObj = currentlyEditingRow
              .getVisibleCells()
              .find((c: Cell<T, any>) => c.column.id === editingCell.columnId)

            if (editingCellObj) {
              const currentValue = cellEditingFns.editingValue?.value ?? editingCellObj.getValue()
              // Stop editing without restoring focus (we'll focus the new cell)
              cellEditingFns.stopEditing(
                currentlyEditingRow,
                editingCellObj,
                currentValue,
                undefined,
                {
                  restoreFocus: false,
                },
              )
            }
          }
        }

        // Use nextTick to ensure editing state is cleared before starting new editing
        nextTick(() => {
          // Find the cell index for the closest editable cell
          const cells = row.getVisibleCells() as Cell<T, any>[]
          const targetCellIndex = cells.findIndex((c) => c.id === closestEditableCell.id)

          if (targetCellIndex !== -1 && options.focusFns?.value) {
            const focusFns = options.focusFns.value
            const groupingFns = resolveGroupingFns()
            // Use navigableRows to ensure we get the correct row index for grouped addrows
            const rowsList = groupingFns?.navigableRows?.value ?? options.rows.value
            const rowIndex = rowsList.findIndex((r) => r.id === row.id)

            if (rowIndex !== -1) {
              // Focus the target cell using the correct row index
              focusFns.focusCell(row, rowIndex, targetCellIndex)

              // Start editing if cellEditingFns is available
              const cellEditingFns = options.cellEditingFns?.value
              if (cellEditingFns) {
                cellEditingFns.startEditing(row, closestEditableCell)
              }
            }
          }
        })

        // Return handled to prevent other handlers from running
        return { handled: true, stop: true }
      },
    })

    onUnmounted(() => {
      if (unregisterCellClickNotEditing) {
        unregisterCellClickNotEditing()
        unregisterCellClickNotEditing = null
      }
    })

    // Register global pointer handler for transitions and finalization
    unregisterPointer = options.interactionRouter.registerGlobalPointerHandler({
      id: 'nugrid-add-row-transition',
      priority: 1, // Low priority to intercept pointerdown early
      handle: ({ event }) => {
        const target = event.target as HTMLElement | null
        const isAddRowElement = target?.closest?.('[data-add-row="true"]')

        if (!isAddRowElement) {
          return { handled: false }
        }

        // If clicking on an add-row cell while editing an add-row cell,
        // set the transitioning flag to maintain 'editing' state through the blur
        if (isEditingAddRow()) {
          // Check if clicking on an uneditable cell
          const cellElement = target?.closest?.('[data-cell-index]')
          const rowElement = target?.closest?.('[data-add-row="true"]') as HTMLElement | null

          if (cellElement && rowElement) {
            const cellIndexAttr = cellElement.getAttribute('data-cell-index')
            const rowId = rowElement.getAttribute('data-row-id')

            if (cellIndexAttr !== null && rowId) {
              // Use ID-based lookup - get the correct rows list
              const groupingFns = resolveGroupingFns()
              const rowsList = groupingFns?.navigableRows?.value ?? orderedRows.value

              // Try to find by ID
              let row: Row<T> | undefined = rowsList.find((r) => r.id === rowId)

              // If not found and this is an add row ID, ensure add row exists and use it
              if (
                !row
                && rowId.startsWith('add-new-')
                && showAddNewRow.value
                && !options.groupingState.value.length
              ) {
                ensureAddRowRow()
                if (addRowRow.value && addRowRow.value.id === rowId) {
                  row = addRowRow.value
                }
              }

              if (row && isAddRowRow(row)) {
                const cellIndex = Number.parseInt(cellIndexAttr, 10)
                const cells = row.getVisibleCells() as Cell<T, any>[]
                const cell = cells[cellIndex]

                // If clicking on an uneditable cell while editing, finalize
                if (cell && !isCellEditable(row, cell) && addRowState.value === 'editing') {
                  // Mark the event so click handlers can check it
                  ;(event as any).__addRowFinalizing = true

                  // Prevent default and stop propagation to prevent focus handler from running
                  event.preventDefault()
                  event.stopPropagation()

                  // Handle finalization synchronously on pointerdown
                  // Find the row that's actually being edited (might be different from clicked row)
                  const cellEditingFns = options.cellEditingFns?.value
                  const editingCell = options.editingCell?.value

                  // Check if we have the necessary components for finalization
                  if (cellEditingFns && editingCell) {
                    // Find the row that's actually being edited (by editingCell.rowId)
                    const editingRow = findEditingRow(editingCell) ?? row

                    if (editingRow && isAddRowRow(editingRow)) {
                      // Store the row ID being finalized
                      finalizingRowId.value = editingRow.id

                      const editingCellObj = editingRow
                        .getVisibleCells()
                        .find((c: Cell<T, any>) => c.column.id === editingCell.columnId)

                      if (editingCellObj) {
                        // Get current value from editingValue ref (Vue reactive value)
                        // editingValue is a Ref that's updated via v-model binding
                        const editingValue = cellEditingFns.editingValue
                        const cellValue = editingCellObj.getValue()
                        const currentValue = getCurrentEditingValue(editingValue, cellValue)
                        const valueToSave = getCurrentEditingValue(editingValue, cellValue)

                        cellEditingFns.stopEditing(
                          editingRow,
                          editingCellObj,
                          valueToSave,
                          undefined,
                          {
                            restoreFocus: false,
                          },
                        )

                        // Check if already finalizing before calling finalizeAddRow
                        if (isFinalizing.value && finalizingRowId.value === editingRow.id) {
                          return stopEventPropagation()
                        }

                        // Finalize the addrow (like pressing ArrowUp/Down would do)
                        const result = finalizeAddRow(editingRow)

                        if (!result.success) {
                          // Validation failed - clear flags and restart editing
                          isFinalizing.value = false
                          finalizingRowId.value = null
                          if (cellEditingFns) {
                            cellEditingFns.startEditing(editingRow, editingCellObj, currentValue)
                          }
                          // Still prevent click handlers from running
                          return stopEventPropagation()
                        } else {
                          // Successfully finalized - focus the new add row
                          focusNewAddRow()
                        }

                        // Return immediately to prevent click handlers from running
                        // The flags are cleared by finalizeAddRow after a delay
                        return stopEventPropagation()
                      }
                    }
                  }

                  // If we got here but didn't finalize, clear flags and return handled
                  nextTick(() => {
                    isFinalizing.value = false
                    finalizingRowId.value = null
                  })

                  return stopEventPropagation()
                }
              }
            }
          }

          // Otherwise, handle cell transition (clicked on editable cell or didn't match conditions above)
          addRowTransitioning.value = true
          ;(event as any).__addRowCellTransition = true

          // Suppress focus outline during transition to prevent flickering
          const focusedCell = options.focusFns?.value?.focusedCell
          if (focusedCell?.value) {
            focusedCell.value = { ...focusedCell.value, suppressOutline: true }
          }

          // Stop the chain so cell-editing-outside (priority 25) doesn't run
          return { handled: true, stop: true }
        }

        return { handled: false }
      },
    })
  }

  onUnmounted(() => {
    if (unregisterCellClick) {
      unregisterCellClick()
      unregisterCellClick = null
    }
    if (unregisterPointer) {
      unregisterPointer()
      unregisterPointer = null
    }
  })

  return {
    addRowPosition,
    showAddNewRow,
    addNewText,
    refreshAddRows,
    isAddRowRow,
    orderedRows,
    getAddRowRow: () => addRowRow.value,
    getGroupAddRow: (groupId: string) => groupAddRowRows.value.get(groupId) ?? null,
    finalizeAddRow,
    resetAddRow,
    addRowState,
    isFinalizing,
    finalizingRowId,
    valueVersion,
    triggerValueUpdate,
  }
}
