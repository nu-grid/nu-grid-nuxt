import type { TableData } from '@nuxt/ui'
import type { Cell, Column, Row, Table } from '@tanstack/vue-table'
import type { Component, ComponentPublicInstance, Ref } from 'vue'

import type {
  NuGridColumn,
  NuGridEventEmitter,
  NuGridProps,
  NuGridValidationOptions,
} from '../../types'
import type {
  NuGridAddRowContext,
  NuGridCellEditing,
  NuGridEditingCell,
  NuGridEditorConfig,
  NuGridEditorRenderContext,
  NuGridFocus,
  NuGridInteractionRouter,
  NuGridResolvedValidation,
  NuGridRowValidationResult,
} from '../../types/_internal'
import type { NuGridValidationResult } from '../../utils/standardSchema'
import { FlexRender } from '@tanstack/vue-table'

import { computed, h, isReadonly, nextTick, onMounted, onUnmounted, ref, resolveComponent } from 'vue'

import { textCellType } from '../../cell-types'
import { getDefaults, usePropWithDefault } from '../../config/_internal'
import { splitPath, validateFieldValue } from '../../utils/standardSchema'

import { useNuGridCellTypeRegistry } from '../useNuGridCellTypeRegistry'
import { useNuGridKeyboardNavigation } from './useNuGridKeyboardNavigation'
import { useNuGridScroll } from './useNuGridScroll'

const validationDefaults = getDefaults('validation')

export const defaultValidationIcon = validationDefaults.icon

/**
 * Resolve validation options with defaults
 * Only accepts the options object form (not schema shorthand)
 */
function resolveValidationConfig<T>(
  validation: NuGridValidationOptions<T> | false | undefined,
): NuGridResolvedValidation<T> | null {
  if (!validation) return null

  return {
    schema: validation.schema ?? null,
    rowRules: validation.rowRules ?? [],
    validateOn: validation.validateOn ?? validationDefaults.validateOn,
    showErrors: validation.showErrors ?? validationDefaults.showErrors,
    icon: validation.icon ?? validationDefaults.icon,
    onInvalid: validation.onInvalid ?? validationDefaults.onInvalid,
    validateOnAddRow: validation.validateOnAddRow ?? validationDefaults.validateOnAddRow,
  }
}

/**
 * Cell editing management with inline editing support
 */
export function useNuGridCellEditing<T extends TableData>(
  props: NuGridProps<T>,
  tableApi: Table<T>,
  data: Ref<T[]>,
  rows: Ref<Row<T>[]>,
  tableRef: Ref<HTMLElement | null>,
  rootRef: Ref<HTMLElement | ComponentPublicInstance | null | undefined>,
  focusFns: NuGridFocus<T>,
  interactionRouter: NuGridInteractionRouter<T> | undefined,
  emit: (payload: { row: Row<T>; column: Column<T, any>; oldValue: any; newValue: any }) => void,
  navigableRows?: Ref<Row<T>[]> | null,
  externalEditingCell?: Ref<NuGridEditingCell | null>,
  addRowContext?: NuGridAddRowContext<T> | null,
  eventEmitter?: NuGridEventEmitter<T>,
): NuGridCellEditing<T> {
  const editingCell = externalEditingCell ?? ref<NuGridEditingCell | null>(null)
  const editingValue = ref<any>(null)
  const isNavigating = ref(false)
  const shouldFocusEditor = ref(false)
  const cellSelector = '[data-row-id="$ID"] [data-cell-index="$COL"]'
  // Validation state
  const validationError = ref<string | null>(null)
  const validationPending = ref(false)
  let validationRunId = 0
  // Track if the current cell has been "punished" (had validation error shown)
  // Used for 'reward' trigger mode
  const hasBeenPunished = ref(false)
  // Track if user has attempted to click away from an invalid editor
  // First click refocuses, second click reverts
  const hasAttemptedClickAway = ref(false)
  // Track if the current validation error is a row-level error
  // Row-level errors allow navigation within the row but not to other rows
  const isRowLevelValidationError = ref(false)
  let unregisterInteraction: (() => void) | null = null
  let unregisterDoubleClick: (() => void) | null = null
  let unregisterOutsidePointer: (() => void) | null = null

  // Get cell type registry with custom cell types
  const typeRegistry = useNuGridCellTypeRegistry<T>(
    props.cellTypes ? computed(() => props.cellTypes) : undefined,
  )

  const { scrollManager } = useNuGridScroll(tableApi)

  // Editing options with defaults
  const editingEnabled = usePropWithDefault(props, 'editing', 'enabled')
  const startClicks = usePropWithDefault(props, 'editing', 'startClicks')
  const startKeys = usePropWithDefault(props, 'editing', 'startKeys')

  // Resolve validation configuration
  const validationConfig = computed(() => resolveValidationConfig(props.validation))
  const showValidationErrors = computed(
    () => validationConfig.value?.showErrors ?? validationDefaults.showErrors,
  )
  const validationIcon = computed(() => validationConfig.value?.icon ?? defaultValidationIcon)
  const pathCache = new Map<string, (string | number)[]>()

  // Use shared keyboard navigation for multi-row support
  const keyboardNav = useNuGridKeyboardNavigation(props, tableApi)
  const { multiRowEnabled, multiRowCount, getVisualRowForColumn, findColumnInVisualRow } =
    keyboardNav

  // Row validation state - tracks which rows have validation errors and which fields failed
  // Key is rowId, value is { message, failedFields }
  const rowValidationErrors = ref<Map<string, { message: string; failedFields: string[] }>>(
    new Map(),
  )

  /**
   * Run row-level validation rules
   * Returns the first failing rule result, or { valid: true } if all pass
   */
  function runRowValidation(
    rowData: T,
    candidateField?: string,
    candidateValue?: any,
  ): NuGridRowValidationResult {
    const config = validationConfig.value
    if (!config || config.rowRules.length === 0) {
      return { valid: true }
    }

    // Create candidate row data with the new value
    const candidateRow = candidateField
      ? ({ ...(rowData as object), [candidateField]: candidateValue } as T)
      : rowData

    // Run all row rules and return first failure
    for (const rule of config.rowRules) {
      const result = rule(candidateRow)
      if (!result.valid) {
        return result
      }
    }

    return { valid: true }
  }

  /**
   * Check if a row has validation errors
   */
  function hasRowValidationError(rowId: string): boolean {
    return rowValidationErrors.value.has(rowId)
  }

  /**
   * Check if a specific cell in a row has a validation error
   */
  function hasCellValidationError(rowId: string, columnId: string): boolean {
    const rowError = rowValidationErrors.value.get(rowId)
    if (!rowError) return false
    // If failedFields is empty or not specified, all cells are considered failed
    if (!rowError.failedFields || rowError.failedFields.length === 0) return true
    return rowError.failedFields.includes(columnId)
  }

  /**
   * Get the row validation error message
   */
  function getRowValidationError(rowId: string): string | null {
    return rowValidationErrors.value.get(rowId)?.message ?? null
  }

  /**
   * Clear row validation error for a specific row
   */
  function clearRowValidationError(rowId: string): void {
    if (rowValidationErrors.value.has(rowId)) {
      const newMap = new Map(rowValidationErrors.value)
      newMap.delete(rowId)
      rowValidationErrors.value = newMap
    }
  }

  /**
   * Set row validation error for a specific row
   */
  function setRowValidationError(rowId: string, message: string, failedFields: string[]): void {
    const newMap = new Map(rowValidationErrors.value)
    newMap.set(rowId, { message, failedFields })
    rowValidationErrors.value = newMap
  }

  /**
   * Run schema validation for a cell value
   * Returns true if valid, false if invalid
   */
  function runSchemaValidation(row: Row<T>, cell: Cell<T, any>, value: any): boolean {
    const config = validationConfig.value
    if (!config || !config.schema) return true

    const accessorKey =
      'accessorKey' in cell.column.columnDef && cell.column.columnDef.accessorKey
        ? (cell.column.columnDef.accessorKey as string)
        : cell.column.id

    const fieldPath = (() => {
      const cached = pathCache.get(accessorKey)
      if (cached) return cached
      const resolved = splitPath(accessorKey)
      pathCache.set(accessorKey, resolved)
      return resolved
    })()

    // Run validation with the candidate row data
    const schemaResult = validateFieldValue(
      config.schema,
      fieldPath,
      value,
      row.original as Record<string, any>,
    )

    // Handle validation result (sync or async)
    const handleSchemaResult = (result: NuGridValidationResult): boolean => {
      if (!result.valid) {
        validationError.value = result.message || 'Validation failed'
        return false
      }
      validationError.value = null
      return true
    }

    // Check if result is a promise (async validation)
    if (schemaResult instanceof Promise) {
      const runId = ++validationRunId
      validationPending.value = true
      schemaResult
        .then((result) => {
          if (runId !== validationRunId) return
          validationPending.value = false
          handleSchemaResult(result)
        })
        .catch(() => {
          if (runId !== validationRunId) return
          validationPending.value = false
          validationError.value = 'Validation failed'
        })
      return true // Assume valid for async, will update when resolved
    }

    // Sync validation
    validationPending.value = false
    return handleSchemaResult(schemaResult)
  }

  /**
   * Helper function to render an editor from an NuGridEditorConfig
   * Supports string (component name), object (component + props), or function
   */
  function renderEditor(
    editorConfig: NuGridEditorConfig,
    context: NuGridEditorRenderContext,
    additionalProps?: Record<string, any>,
  ) {
    // Helper to get the current editing cell/row
    const getCurrentEditingContext = () => {
      if (!editingCell.value) return null

      // Use navigableRows if available (for grouped tables), otherwise use rows
      const rowsList = navigableRows?.value ?? rows.value
      const currentRow = rowsList.find((r) => r.id === editingCell.value!.rowId)
      if (!currentRow) return null

      const currentCell = currentRow
        .getAllCells()
        .find((c) => c.column.id === editingCell.value!.columnId)
      if (!currentCell) return null

      return { row: currentRow, cell: currentCell }
    }

    // If it's a function, call it with the context (backwards compatibility)
    if (typeof editorConfig === 'function') {
      // Type assertion needed because Component includes non-callable types
      type EditorRenderFunction = (ctx: NuGridEditorRenderContext) => any
      return (editorConfig as EditorRenderFunction)(context)
    }

    // Determine the component to render
    let componentToRender: Component | string
    let componentProps: Record<string, any> = {}

    if (typeof editorConfig === 'string') {
      // String: component name
      componentToRender = resolveComponent(editorConfig)
    } else if (typeof editorConfig === 'object' && 'component' in editorConfig) {
      // Object with component and props
      componentToRender =
        typeof editorConfig.component === 'string'
          ? resolveComponent(editorConfig.component)
          : editorConfig.component
      componentProps = editorConfig.props || {}
    } else {
      // Assume it's a Component reference
      componentToRender = editorConfig as Component
    }

    // Render the component with all necessary props
    const shouldShowPopover = showValidationErrors.value
    return h(componentToRender, {
      'modelValue': context.getValue(),
      'cell': context.cell,
      'row': context.row,
      'isNavigating': isNavigating.value,
      'shouldFocus': shouldFocusEditor.value,
      'validationError': validationError.value,
      'showValidationErrors': shouldShowPopover,
      'interactionRouter': interactionRouter,
      ...componentProps,
      ...additionalProps,
      'onUpdate:modelValue': (value: any) => {
        context.setValue(value)
        const config = validationConfig.value
        if (!config) return
        const validateOn = config.validateOn
        // Real-time validation if validateOn is 'change'
        if (validateOn === 'change') {
          runSchemaValidation(context.row, context.cell, value)
        }
        // Reward early: if already punished, validate on change to clear errors when valid
        else if (validateOn === 'reward' && hasBeenPunished.value) {
          const isValid = runSchemaValidation(context.row, context.cell, value)
          // Only clear error if valid (reward early), keep showing error if still invalid
          if (isValid) {
            validationError.value = null
          }
        }
      },
      'onUpdate:isNavigating': (value: boolean) => {
        isNavigating.value = value
      },
      'onStopEditing': (direction?: 'up' | 'down' | 'next' | 'previous') => {
        // Block navigation if scroll is already in progress (same pattern as focus mode)
        // This prevents rapid key repeats from overwhelming rendering
        if (direction && scrollManager.isProcessingScroll) {
          isNavigating.value = false
          return
        }
        // Don't set lock here - stopEditing has early returns (validation failures)
        // that would leave the lock stuck. Lock is set in startEditing instead.
        context.stopEditing(direction)
      },
      'onCancelEditing': () => {
        // Cancel editing: clear state and restore focus WITHOUT saving
        const ctx = getCurrentEditingContext()
        const hadError = !!validationError.value

        // Emit cellEditingCancelled event before clearing state
        // Check handler exists to avoid overhead when no listeners
        if (ctx && eventEmitter?.cellEditingCancelled) {
          eventEmitter.cellEditingCancelled({
            row: ctx.row,
            column: ctx.cell.column,
            value: editingValue.value,
          })
        }

        validationRunId++
        validationPending.value = false
        editingCell.value = null
        editingValue.value = null
        validationError.value = null
        hasBeenPunished.value = false
        hasAttemptedClickAway.value = false
        if (ctx) {
          // When there was a validation error, the popover closing may interfere with focus.
          // Use nextTick plus a micro-delay to ensure focus restoration happens after closure.
          if (hadError) {
            nextTick(() => restoreFocus(ctx.row, ctx.cell))
            setTimeout(() => restoreFocus(ctx.row, ctx.cell), 0)
          } else {
            restoreFocus(ctx.row, ctx.cell)
          }
        }
      },
    })
  }

  function isCellEditable(row: Row<T>, cell: Cell<T, any>): boolean {
    if (editingEnabled.value === false) {
      return false
    }

    const columnDef = cell.column.columnDef
    const isAddRow = addRowContext?.isAddRowRow(row) ?? false

    if (isAddRow && columnDef.showNew === false) {
      return false
    }

    if (isAddRow) {
      const groupingState = tableApi.getState().grouping || []
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

  function startEditing(
    row: Row<T>,
    cell: Cell<T, any>,
    initialValue?: any,
    options?: { rowIndex?: number; cellIndex?: number },
  ) {
    // Capture navigation state before any mutations so we can safely bail out
    const wasNavigating = isNavigating.value

    // If navigation is throttled, drop this request and clear navigating state
    if (wasNavigating && scrollManager.isProcessingScroll) {
      isNavigating.value = false
      return
    }
    // Don't restart editing if we're already editing this cell (unless initialValue is explicitly provided)
    // This prevents clicks on the editor (e.g., when validation popup is showing) from resetting the value
    if (
      editingCell.value?.rowId === row.id
      && editingCell.value?.columnId === cell.column.id
      && initialValue === undefined
    ) {
      return
    }

    // Check if editing is allowed
    if (!isCellEditable(row, cell)) {
      return
    }

    // Don't focus the editor yet - wait for scroll to settle
    shouldFocusEditor.value = false

    // Only start editing if column has editor or we use default
    editingCell.value = {
      rowId: row.id,
      columnId: cell.column.id,
    }
    // Use provided initialValue if given, otherwise use current cell value
    editingValue.value = initialValue !== undefined ? initialValue : cell.getValue()

    // Emit cellEditingStarted event
    // Check handler exists to avoid overhead when no listeners
    if (eventEmitter?.cellEditingStarted) {
      eventEmitter.cellEditingStarted({
        row,
        column: cell.column,
        value: editingValue.value,
      })
    }

    // Check if this row has a row-level validation error
    // If so, and this cell is one of the failed fields, preserve the error
    const rowError = rowValidationErrors.value.get(row.id)
    if (rowError && isRowLevelValidationError.value) {
      const accessorKey =
        'accessorKey' in cell.column.columnDef && cell.column.columnDef.accessorKey
          ? (cell.column.columnDef.accessorKey as string)
          : cell.column.id
      const isFailedField =
        rowError.failedFields.length === 0 || rowError.failedFields.includes(accessorKey)

      if (isFailedField) {
        // Preserve the row validation error for this cell
        validationError.value = rowError.message
        // Keep hasBeenPunished true so the error continues to show
        hasBeenPunished.value = true
      } else {
        // This cell is not a failed field, clear the error
        validationError.value = null
        hasBeenPunished.value = false
      }
    } else {
      // No row-level error, clear validation state
      validationError.value = null
      hasBeenPunished.value = false
    }
    hasAttemptedClickAway.value = false

    // Set the processing lock here (not in onStopEditing) because stopEditing has
    // early returns for validation failures. This ensures the lock is only set
    // when we actually proceed to start editing a new cell.
    if (wasNavigating) {
      if (scrollManager.isProcessingScroll) {
        // Another navigation is in progress, skip this one
        isNavigating.value = false
        return
      }
      scrollManager.setProcessing(true)
    }

    // Calculate indices and scroll synchronously (like focus mode does)
    // Use navigableRows if available (for grouped tables), otherwise use rows
    const rowsList = navigableRows?.value ?? rows.value
    const rowIndex =
      options?.rowIndex !== undefined
        ? options.rowIndex
        : rowsList.findIndex((r) => r.id === row.id)
    const cellIndex =
      options?.cellIndex !== undefined
        ? options.cellIndex
        : row.getVisibleCells().findIndex((c: Cell<T, any>) => c.id === cell.id)

    if (rowIndex !== -1 && cellIndex !== -1) {
      // Update focus system to track the editing cell
      // Preserve suppressOutline if it's currently set (e.g., during add-row transitions)
      const currentSuppressOutline = focusFns.focusedCell.value?.suppressOutline
      focusFns.focusedCell.value = {
        rowIndex,
        columnIndex: cellIndex,
        ...(currentSuppressOutline && { suppressOutline: true }),
      }
    }

    if (rowIndex !== -1 && cellIndex !== -1 && tableRef.value) {
      // Use shared cached cell lookup from focus system for performance
      const cellElement = focusFns.getCellElement(row.id, cellIndex)

      const rootElement =
        rootRef.value && '$el' in rootRef.value ? rootRef.value.$el : rootRef.value
      if (cellElement && rootElement) {
        // Use shared scroll-and-focus helper from focus system
        focusFns.scrollToCellAndFocus({
          cellElement,
          rowId: row.id,
          rowIndex,
          columnIndex: cellIndex,
          behavior: wasNavigating ? 'instant' : 'smooth',
          onComplete: () => {
            // Focus editor after scroll completes
            shouldFocusEditor.value = true
            if (wasNavigating) {
              scrollManager.setProcessing(false)
            }
          },
        })
      } else {
        // No cell element or scroll container, focus immediately
        shouldFocusEditor.value = true
        if (wasNavigating) {
          scrollManager.setProcessing(false)
        }
      }
    } else {
      // Indices not found or no tableRef, focus immediately
      shouldFocusEditor.value = true
      if (wasNavigating) {
        scrollManager.setProcessing(false)
      }
    }
  }

  function isEditingCell(row: Row<T>, columnId: string): boolean {
    return editingCell.value?.rowId === row.id && editingCell.value?.columnId === columnId
  }

  function stopEditing(
    row: Row<T>,
    cell: Cell<T, any>,
    newValue: any,
    moveDirection?: 'up' | 'down' | 'next' | 'previous',
    options?: { restoreFocus?: boolean; isClickAway?: boolean },
  ) {
    const shouldRestoreFocus = options?.restoreFocus !== false
    const isClickAway = options?.isClickAway === true
    const config = validationConfig.value
    const onInvalid = config?.onInvalid ?? validationDefaults.onInvalid

    // If we're waiting for the second click-away and this is NOT a click-away call,
    // ignore it (e.g., blur events after first click-away should be ignored)
    // Only applies in 'block' mode
    if (onInvalid === 'block' && hasAttemptedClickAway.value && !isClickAway) {
      return
    }

    const navDirection = moveDirection
    const oldValue = cell.getValue()
    // Track the value we'll actually save - may be reverted to oldValue if validation fails
    let valueToSave = newValue
    const isAddRow = addRowContext?.isAddRowRow(row)

    // For empty add rows navigating with arrow keys, skip validation and reset
    // This allows users to cursor in and out without triggering errors
    // Tab/Shift+Tab should run validation since it indicates intent to continue in the add row
    const isCurrentValueEmpty = newValue === undefined || newValue === null || newValue === ''
    const isVerticalNav = navDirection === 'up' || navDirection === 'down'

    if (isAddRow && isCurrentValueEmpty && isVerticalNav) {
      // Find row index BEFORE resetting (reset changes the row ID)
      const rowsList = navigableRows?.value ?? rows.value
      const currentRowIndex = rowsList.findIndex((r) => r.id === row.id)

      // Clear editing state
      editingCell.value = null
      editingValue.value = null
      validationError.value = null
      hasBeenPunished.value = false
      hasAttemptedClickAway.value = false

      // Reset the add row
      addRowContext!.resetAddRow(row)

      // If navigating, move to the target cell and stay in edit mode
      if (navDirection === 'up' || navDirection === 'down') {
        isNavigating.value = true
        const targetRowIndex = navDirection === 'up' ? currentRowIndex - 1 : currentRowIndex + 1

        // Get fresh row list after reset
        const freshRowsList = navigableRows?.value ?? rows.value

        if (targetRowIndex >= 0 && targetRowIndex < freshRowsList.length) {
          const targetRow = freshRowsList[targetRowIndex]
          if (targetRow) {
            const targetCells = targetRow.getVisibleCells() as Cell<T, any>[]
            const targetCellIdx = targetCells.findIndex((c) => c.column.id === cell.column.id)
            const targetCell = targetCellIdx !== -1 ? targetCells[targetCellIdx] : null
            if (targetCell && isCellEditable(targetRow, targetCell)) {
              nextTick(() => {
                startEditing(targetRow, targetCell, undefined, {
                  rowIndex: targetRowIndex,
                  cellIndex: targetCellIdx,
                })
                isNavigating.value = false
              })
              return
            }
          }
        }
        // Fallback - just clear navigation state
        isNavigating.value = false
      }
      return
    }

    const visibleCells = row.getVisibleCells()
    const editableCellIndices = visibleCells
      .map((c: Cell<T, any>, idx) => ({ c, idx }))
      .filter(({ c }) => isCellEditable(row, c))
    const lastEditableIndex =
      editableCellIndices[editableCellIndices.length - 1]?.idx ?? visibleCells.length - 1
    const currentCellIndex = visibleCells.findIndex((c: Cell<T, any>) => c.id === cell.id)

    // Get plugin for validation
    const columnDef = cell.column.columnDef
    const cellDataType = columnDef.cellDataType || 'text'
    const plugin = typeRegistry.getCellType(cellDataType)

    // Validate if plugin provides validation
    if (plugin?.validation) {
      const pluginContext: any = {
        cell,
        row,
        columnDef,
        column: cell.column,
        getValue: () => newValue,
        isFocused: false,
        canEdit: true,
        data: data.value,
        tableApi,
        startEditing: (initialValue?: any) => startEditing(row, cell, initialValue),
        stopEditing: (value: any, dir?: 'up' | 'down' | 'next' | 'previous') =>
          stopEditing(row, cell, value, dir),
        emitChange: (oldVal: any, newVal: any) => {
          emit({ row, column: cell.column, oldValue: oldVal, newValue: newVal })
        },
      }

      const validationResult = plugin.validation(newValue, pluginContext)
      if (!validationResult.valid) {
        if (onInvalid === 'revert') {
          // Revert to original value and continue
          valueToSave = oldValue
        } else {
          // Block mode: show error and prevent save
          validationError.value = validationResult.message || 'Invalid value'
          // Don't save or emit - stay in edit mode
          return
        }
      }
    }

    // Schema validation (Standard Schema v1)
    // Run on submit for 'submit', 'blur', and 'reward' triggers
    // For 'change' trigger, validation already happened in real-time
    if (config && config.validateOn !== 'change') {
      const isValid = runSchemaValidation(row, cell, valueToSave)
      if (!isValid) {
        if (onInvalid === 'revert') {
          // Revert to original value and continue
          valueToSave = oldValue
          validationError.value = null
        } else {
          // Block mode
          isRowLevelValidationError.value = false // Cell-level error
          if (handleValidationFailure(config as NuGridResolvedValidation<T>, isClickAway)) return
        }
      }
    }

    // Row-level validation
    // Run after schema validation passes to check cross-field rules
    const accessorKey =
      'accessorKey' in cell.column.columnDef && cell.column.columnDef.accessorKey
        ? (cell.column.columnDef.accessorKey as string)
        : cell.column.id

    const rowValidationResult = runRowValidation(row.original, accessorKey, valueToSave)
    if (!rowValidationResult.valid) {
      if (onInvalid === 'revert') {
        // Revert to original value and continue
        valueToSave = oldValue
        validationError.value = null
        // Don't set row validation error - we're reverting
      } else {
        // Block mode - set row validation error with the failed fields
        setRowValidationError(
          row.id,
          rowValidationResult.message || 'Row validation failed',
          rowValidationResult.failedFields || [accessorKey],
        )
        validationError.value = rowValidationResult.message || 'Row validation failed'
        isRowLevelValidationError.value = true // Row-level error

        // For row-level errors, allow within-row navigation (next/previous)
        // but block navigation to other rows (up/down) or wrapping to adjacent rows
        const isHorizontalNavigation = navDirection === 'next' || navDirection === 'previous'
        if (isHorizontalNavigation) {
          // Check if there's another editable cell in this row in the requested direction
          const cells = row.getVisibleCells() as Cell<T, any>[]
          let hasEditableCellInDirection = false

          if (navDirection === 'next') {
            // Check if there's an editable cell after the current one
            for (let i = currentCellIndex + 1; i < cells.length; i++) {
              const candidateCell = cells[i]
              if (candidateCell && isCellEditable(row, candidateCell)) {
                hasEditableCellInDirection = true
                break
              }
            }
          } else {
            // Check if there's an editable cell before the current one
            for (let i = currentCellIndex - 1; i >= 0; i--) {
              const candidateCell = cells[i]
              if (candidateCell && isCellEditable(row, candidateCell)) {
                hasEditableCellInDirection = true
                break
              }
            }
          }

          if (hasEditableCellInDirection) {
            // Allow navigation within the row - don't call handleValidationFailure
            // The row will stay invalid but the user can move to fix other fields
            if (config?.validateOn === 'reward') {
              hasBeenPunished.value = true
            }
          } else {
            // At edge of row - block navigation to prevent wrapping to adjacent row
            if (
              config
              && handleValidationFailure(config as NuGridResolvedValidation<T>, isClickAway)
            )
              return
          }
        } else {
          // Block navigation to other rows or saving (Enter without direction)
          if (config && handleValidationFailure(config as NuGridResolvedValidation<T>, isClickAway))
            return
        }
      }
    } else {
      // Clear any previous row validation error for this row
      clearRowValidationError(row.id)
      isRowLevelValidationError.value = false
      // All validation passed - clear any previous validation error
      validationError.value = null
    }

    // Coerce new value to match original value's type to preserve data types
    // This handles cases where the editor returns a string but the original was a number
    const coerceToOriginalType = (original: any, value: any): any => {
      if (value === null || value === undefined) return value
      if (original === null || original === undefined) return value

      const originalType = typeof original
      const valueType = typeof value

      // Already same type, no coercion needed
      if (originalType === valueType) return value

      // Coerce string to number if original was number
      if (originalType === 'number' && valueType === 'string') {
        const num = Number(value)
        return Number.isNaN(num) ? value : num
      }

      // Coerce string to boolean if original was boolean
      if (originalType === 'boolean' && valueType === 'string') {
        if (value === 'true') return true
        if (value === 'false') return false
        return value
      }

      return value
    }

    const coercedValue = coerceToOriginalType(oldValue, valueToSave)

    // Only emit if value changed
    if (oldValue !== coercedValue && cell.column.columnDef.cellDataType !== 'selection') {
      // Call lifecycle hook if plugin provides it
      if (plugin?.onValueChanged) {
        const pluginContext: any = {
          cell,
          row,
          columnDef,
          column: cell.column,
          getValue: () => coercedValue,
          isFocused: false,
          canEdit: true,
          data: data.value,
          tableApi,
          startEditing: (initialValue?: any) => startEditing(row, cell, initialValue),
          stopEditing: (value: any, dir?: 'up' | 'down' | 'next' | 'previous') =>
            stopEditing(row, cell, value, dir),
          emitChange: (oldVal: any, newVal: any) => {
            emit({ row, column: cell.column, oldValue: oldVal, newValue: newVal })
          },
        }
        plugin.onValueChanged(oldValue, coercedValue, pluginContext)
      }

      emit({
        row,
        column: cell.column,
        oldValue,
        newValue: coercedValue,
      })

      // Update the data directly
      const rowIndex = data.value.findIndex((r: T, index: number) => {
        return tableApi.options.getRowId?.(r, index) === row.id || r === row.original
      })

      const accessorKey =
        'accessorKey' in cell.column.columnDef && cell.column.columnDef.accessorKey
          ? (cell.column.columnDef.accessorKey as string)
          : undefined
      const fallbackKey = !accessorKey ? cell.column.id : undefined

      const assignValue = (target: any) => {
        if (accessorKey) {
          target[accessorKey] = coercedValue
        } else if (fallbackKey) {
          target[fallbackKey] = coercedValue
        }
      }

      if (rowIndex !== -1) {
        assignValue(data.value[rowIndex] as any)
      } else if (addRowContext?.isAddRowRow(row)) {
        // Keep placeholder row in sync so the edited value remains visible before finalize
        assignValue(row.original as any)
        // Trigger reactivity for add row cells (they're not in the data array)
        addRowContext.triggerValueUpdate?.()
      }

      // Clear TanStack's cached value so cell.getValue() returns the updated value
      const valuesCache = (row as any)._valuesCache
      if (valuesCache) {
        if (typeof valuesCache.clear === 'function') {
          valuesCache.clear()
        } else if (typeof valuesCache === 'object') {
          delete valuesCache[cell.column.id]
        }
      }

      // Ensure reactivity for regular rows (not add rows, which use valueVersion)
      // Only trigger data reactivity if this is NOT an add row
      if (!addRowContext?.isAddRowRow(row)) {
        // Note: This may fail silently if data is a computed ref (readonly)
        // but that's okay - the TanStack cache clear above handles value updates
        if (!isReadonly(data)) {
          data.value = [...data.value]
        }
      }
    }

    let shouldFocusNewAddRowAfterFinalize = false
    let groupIdToFocus: string | null = null

    if (isAddRow && addRowContext) {
      const currentIndex = visibleCells.findIndex((c: Cell<T, any>) => c.id === cell.id)
      const isLastEditable = currentIndex === lastEditableIndex

      // Finalize when:
      // 1. Explicitly navigating down (ArrowDown)
      // 2. Tab on the last editable column
      // 3. Enter key (always tries to finalize, regardless of column)
      const shouldFinalizeAfterNav =
        navDirection === 'down'
        || (navDirection === 'next' && isLastEditable)
        || navDirection === undefined // Enter key always tries to finalize

      if (shouldFinalizeAfterNav) {
        // Store the parentId (groupId) before finalizing, so we can focus the correct group's addrow
        const parentId = (row as any).parentId
        groupIdToFocus = parentId || null

        const result = addRowContext.finalizeAddRow(row)
        if (!result.success) {
          validationError.value = result.messages?.[0] || 'Invalid value'
          // If there's a moveDirection, allow navigation to proceed even if validation failed
          // This allows users to navigate away from invalid add rows
          if (!navDirection) {
            // No navigation requested (Enter key), prevent save and stay in edit mode
            return
          }
          // Navigation requested - continue with navigation but don't finalize
        } else {
          // Validation passed, finalization will happen (refreshAddRows is called in finalizeAddRow)
          // Focus new addrow when:
          // - Tab from last editable column
          // - Enter key (from any column)
          if ((navDirection === 'next' && isLastEditable) || navDirection === undefined) {
            shouldFocusNewAddRowAfterFinalize = true
          }
        }
      }
    }

    // Helper to find next/previous editable cell within a row
    const findEditableInRow = (
      targetRow: Row<T>,
      startIndex: number,
      direction: 'next' | 'previous',
    ): { cell: Cell<T, any>; index: number } | null => {
      const cells = targetRow.getVisibleCells() as Cell<T, any>[]
      if (direction === 'next') {
        for (let i = startIndex + 1; i < cells.length; i++) {
          const candidate = cells[i]
          if (candidate && isCellEditable(targetRow, candidate))
            return { cell: candidate, index: i }
        }
      } else {
        for (let i = startIndex - 1; i >= 0; i--) {
          const candidate = cells[i]
          if (candidate && isCellEditable(targetRow, candidate))
            return { cell: candidate, index: i }
        }
      }
      return null
    }

    // If we need to move to another cell, do it after saving
    if (navDirection) {
      isNavigating.value = true
      // Use navigableRows if available (for grouped tables), otherwise use rows
      const rowsList = navigableRows?.value ?? rows.value
      const currentRowIndex = rowsList.findIndex((r) => r.id === row.id)

      if (shouldFocusNewAddRowAfterFinalize) {
        nextTick(() => {
          const nextRowsList = navigableRows?.value ?? rows.value
          // If we have a groupId, find the addrow for that specific group
          // Otherwise, find the first addrow (for non-grouped grids)
          const newAddRow = groupIdToFocus
            ? nextRowsList.find(
                (r) => addRowContext?.isAddRowRow(r) && (r as any).parentId === groupIdToFocus,
              )
            : nextRowsList.find((r) => addRowContext?.isAddRowRow(r))
          if (newAddRow) {
            const firstEditableCell = newAddRow
              .getVisibleCells()
              .find((c: Cell<T, any>) => isCellEditable(newAddRow, c))
            if (firstEditableCell) {
              startEditing(newAddRow, firstEditableCell)
              isNavigating.value = false
              return
            }
          }
          // Fallback to restoring focus on the current cell if new add row isn't ready
          editingCell.value = null
          editingValue.value = null
          isNavigating.value = false
          hasAttemptedClickAway.value = false
          if (shouldRestoreFocus) {
            restoreFocus(row, cell)
          }
        })
        return
      }

      if (navDirection === 'up' || navDirection === 'down') {
        // Get current column index for multi-row navigation
        const visibleCells = row.getVisibleCells() as Cell<T, any>[]
        const currentCellIdx = visibleCells.findIndex((c) => c.id === cell.id)

        // Multi-row mode: navigate between visual rows first
        if (multiRowEnabled.value && multiRowCount.value > 1) {
          const currentVisualRow = getVisualRowForColumn(currentCellIdx)
          const lastVisualRow = multiRowCount.value - 1

          if (navDirection === 'up') {
            if (currentVisualRow > 0) {
              // Move to previous visual row within same data row
              const targetColIdx = findColumnInVisualRow(currentCellIdx, currentVisualRow - 1, row)
              const targetCell = visibleCells[targetColIdx]
              if (targetCell && isCellEditable(row, targetCell)) {
                nextTick(() => {
                  startEditing(row, targetCell, undefined, {
                    rowIndex: currentRowIndex,
                    cellIndex: targetColIdx,
                  })
                  isNavigating.value = false
                })
                return
              }
            } else {
              // At top visual row - move to previous data row's last visual row
              const targetRowIndex = currentRowIndex - 1
              if (targetRowIndex >= 0) {
                const targetRow = rowsList[targetRowIndex]
                if (targetRow) {
                  let targetColIdx = findColumnInVisualRow(currentCellIdx, lastVisualRow, targetRow)
                  const targetCells = targetRow.getVisibleCells() as Cell<T, any>[]
                  const targetCell = targetCells[targetColIdx]
                  let effectiveTargetCell: Cell<T, any> | null = targetCell ?? null
                  if (effectiveTargetCell && !isCellEditable(targetRow, effectiveTargetCell)) {
                    const fallback = findEditableInRow(targetRow, targetColIdx, 'previous')
                    effectiveTargetCell = fallback?.cell ?? null
                    if (fallback) {
                      targetColIdx = fallback.index
                    }
                  }
                  if (effectiveTargetCell) {
                    nextTick(() => {
                      startEditing(targetRow, effectiveTargetCell!, undefined, {
                        rowIndex: targetRowIndex,
                        cellIndex: targetColIdx,
                      })
                      isNavigating.value = false
                    })
                    return
                  }
                }
              }
            }
          } else {
            // navDirection === 'down'
            if (currentVisualRow < lastVisualRow) {
              // Move to next visual row within same data row
              const targetColIdx = findColumnInVisualRow(currentCellIdx, currentVisualRow + 1, row)
              const targetCell = visibleCells[targetColIdx]
              if (targetCell && isCellEditable(row, targetCell)) {
                nextTick(() => {
                  startEditing(row, targetCell, undefined, {
                    rowIndex: currentRowIndex,
                    cellIndex: targetColIdx,
                  })
                  isNavigating.value = false
                })
                return
              }
            } else {
              // At bottom visual row - move to next data row's first visual row
              const targetRowIndex = currentRowIndex + 1
              if (targetRowIndex < rowsList.length) {
                const targetRow = rowsList[targetRowIndex]
                if (targetRow) {
                  let targetColIdx = findColumnInVisualRow(currentCellIdx, 0, targetRow)
                  const targetCells = targetRow.getVisibleCells() as Cell<T, any>[]
                  const targetCell = targetCells[targetColIdx]
                  let effectiveTargetCell: Cell<T, any> | null = targetCell ?? null
                  if (effectiveTargetCell && !isCellEditable(targetRow, effectiveTargetCell)) {
                    const fallback = findEditableInRow(targetRow, targetColIdx, 'previous')
                    effectiveTargetCell = fallback?.cell ?? null
                    if (fallback) {
                      targetColIdx = fallback.index
                    }
                  }
                  if (effectiveTargetCell) {
                    nextTick(() => {
                      startEditing(targetRow, effectiveTargetCell!, undefined, {
                        rowIndex: targetRowIndex,
                        cellIndex: targetColIdx,
                      })
                      isNavigating.value = false
                    })
                    return
                  }
                }
              }
            }
          }
        } else {
          // Standard single-row vertical navigation
          const targetRowIndex = navDirection === 'up' ? currentRowIndex - 1 : currentRowIndex + 1

          if (targetRowIndex >= 0 && targetRowIndex < rowsList.length) {
            const targetRow = rowsList[targetRowIndex]
            if (targetRow) {
              const targetCells = targetRow.getVisibleCells() as Cell<T, any>[]
              const targetCellIdx = targetCells.findIndex((c) => c.column.id === cell.column.id)
              let effectiveTargetCell: Cell<T, any> | null =
                targetCellIdx !== -1 ? (targetCells[targetCellIdx] ?? null) : null
              let resolvedCellIdx = targetCellIdx

              if (effectiveTargetCell && !isCellEditable(targetRow, effectiveTargetCell)) {
                const fallback = findEditableInRow(targetRow, targetCellIdx, 'previous')
                effectiveTargetCell = fallback?.cell ?? null
                resolvedCellIdx = fallback?.index ?? targetCellIdx
              }

              if (effectiveTargetCell) {
                nextTick(() => {
                  startEditing(targetRow, effectiveTargetCell!, undefined, {
                    rowIndex: targetRowIndex,
                    cellIndex: resolvedCellIdx,
                  })
                  isNavigating.value = false
                })
                return
              }
            }
          }
        }
        // Can't move in that direction, restore focus and clear editing state
        editingCell.value = null
        editingValue.value = null
        isNavigating.value = false
        hasAttemptedClickAway.value = false
        if (shouldRestoreFocus) {
          restoreFocus(row, cell)
        }
        return
      } else if (navDirection === 'next' || navDirection === 'previous') {
        // Horizontal navigation - different column, potentially different row
        let targetCellInfo: { cell: Cell<T, any>; index: number } | null = null
        let targetRow: Row<T> = row
        let targetRowIndex = currentRowIndex

        if (navDirection === 'next') {
          // Try remaining cells in current row
          targetCellInfo = findEditableInRow(row, currentCellIndex, 'next')

          // Otherwise, wrap to the next row's first editable cell
          if (!targetCellInfo && currentRowIndex < rowsList.length - 1) {
            for (let r = currentRowIndex + 1; r < rowsList.length; r++) {
              const candidateRow = rowsList[r]
              if (!candidateRow) continue
              const candidateCellInfo = findEditableInRow(candidateRow, -1, 'next')
              if (candidateCellInfo) {
                targetRow = candidateRow
                targetRowIndex = r
                targetCellInfo = candidateCellInfo
                break
              }
            }
          }
        } else {
          // previous
          targetCellInfo = findEditableInRow(row, currentCellIndex, 'previous')

          // Otherwise, wrap to the previous row's last editable cell
          if (!targetCellInfo && currentRowIndex > 0) {
            for (let r = currentRowIndex - 1; r >= 0; r--) {
              const candidateRow = rowsList[r]
              if (!candidateRow) continue
              const cells = candidateRow.getVisibleCells() as Cell<T, any>[]
              const candidateCellInfo = findEditableInRow(candidateRow, cells.length, 'previous')
              if (candidateCellInfo) {
                targetRow = candidateRow
                targetRowIndex = r
                targetCellInfo = candidateCellInfo
                break
              }
            }
          }
        }

        if (targetCellInfo) {
          nextTick(() => {
            startEditing(targetRow, targetCellInfo!.cell, undefined, {
              rowIndex: targetRowIndex,
              cellIndex: targetCellInfo!.index,
            })
            isNavigating.value = false
          })
          return
        }
        // Can't move in that direction, restore focus and clear editing state
        editingCell.value = null
        editingValue.value = null
        isNavigating.value = false
        hasAttemptedClickAway.value = false
        if (shouldRestoreFocus) {
          restoreFocus(row, cell)
        }
        return
      }
    }

    // Handle focusing new addrow after finalization when Enter is pressed (no navDirection)
    if (shouldFocusNewAddRowAfterFinalize && !navDirection) {
      nextTick(() => {
        const nextRowsList = navigableRows?.value ?? rows.value
        // If we have a groupId, find the addrow for that specific group
        // Otherwise, find the first addrow (for non-grouped grids)
        const newAddRow = groupIdToFocus
          ? nextRowsList.find(
              (r) => addRowContext?.isAddRowRow(r) && (r as any).parentId === groupIdToFocus,
            )
          : nextRowsList.find((r) => addRowContext?.isAddRowRow(r))
        if (newAddRow) {
          const firstEditableCell = newAddRow
            .getVisibleCells()
            .find((c: Cell<T, any>) => isCellEditable(newAddRow, c))
          if (firstEditableCell) {
            startEditing(newAddRow, firstEditableCell)
            return
          }
        }
        // Fallback: clear editing state if new add row isn't ready
        editingCell.value = null
        editingValue.value = null
        hasAttemptedClickAway.value = false
        if (shouldRestoreFocus) {
          restoreFocus(row, cell)
        }
      })
      return
    }

    // Only clear editing state if we're not navigating (e.g., Enter key, blur)
    editingCell.value = null
    editingValue.value = null
    hasAttemptedClickAway.value = false

    // Restore focus to the cell after editing ends
    if (shouldRestoreFocus) {
      restoreFocus(row, cell)
    }
  }

  function restoreFocus(row: Row<T>, cell: Cell<T, any>) {
    nextTick(() => {
      // Use navigableRows if available (for grouped tables), otherwise use rows
      const rowsList = navigableRows?.value ?? rows.value
      const rowIndex = rowsList.findIndex((r) => r.id === row.id)
      const cellIndex = row.getVisibleCells().findIndex((c: Cell<T, any>) => c.id === cell.id)

      // Don't restore focus if row was removed (e.g., addrow was finalized)
      if (rowIndex === -1) {
        return
      }

      if (rowIndex !== -1 && cellIndex !== -1) {
        // Update the focus system's focusedCell ref so keyboard navigation works
        // Preserve suppressOutline if it's currently set (e.g., during add-row transitions)
        const currentSuppressOutline = focusFns.focusedCell.value?.suppressOutline
        focusFns.focusedCell.value = {
          rowIndex,
          columnIndex: cellIndex,
          ...(currentSuppressOutline && { suppressOutline: true }),
        }
        // Focus the DOM element
        focusFns.focusCell(row, rowIndex, cellIndex)
      }
    })
  }

  // Helper to get the current editing cell/row - reusable across multiple functions
  const getCurrentEditingContext = () => {
    if (!editingCell.value) return null

    // Use navigableRows if available (for grouped tables), otherwise use rows
    const rowsList = navigableRows?.value ?? rows.value
    const currentRow = rowsList.find((r) => r.id === editingCell.value!.rowId)
    if (!currentRow) return null

    const currentCell = currentRow
      .getAllCells()
      .find((c) => c.column.id === editingCell.value!.columnId)
    if (!currentCell) return null

    return { row: currentRow, cell: currentCell }
  }

  /**
   * Factory function to create editor context objects
   * This reduces code duplication and ensures consistent context structure
   */
  function createEditorContext(cell: Cell<T, any>, row: Row<T>) {
    return {
      cell,
      row,
      getValue: () => editingValue.value,
      setValue: (value: any) => {
        editingValue.value = value
      },
      stopEditing: (moveDirection?: 'up' | 'down' | 'next' | 'previous') => {
        const ctx = getCurrentEditingContext()
        if (ctx) {
          stopEditing(ctx.row, ctx.cell, editingValue.value, moveDirection)
        }
      },
      table: tableApi,
      column: cell.column,
    }
  }

  function createDefaultEditor(cell: Cell<T, any>, row: Row<T>) {
    // Determine which editor to use based on cellDataType with auto-detection
    const columnDef = cell.column.columnDef as NuGridColumn<T>
    const defined = columnDef.cellDataType
    let cellDataType = defined || 'text'

    // Auto-detect: use textarea for wrapped columns or multiline content
    if (!defined || defined === 'text') {
      // Use textarea if column has wrapText enabled
      if (columnDef.wrapText === true) {
        cellDataType = 'textarea'
      } else {
        const value = cell.getValue()
        if (typeof value === 'string' && value.includes('\n')) {
          cellDataType = 'textarea'
        }
      }
    }

    // Check if a custom default editor is provided for this data type
    // (only when editing is an object with defaultEditors, not boolean shorthand)
    const editingConfig = typeof props.editing === 'object' ? props.editing : undefined
    if (editingConfig?.defaultEditors?.[cellDataType]) {
      const customEditor = editingConfig.defaultEditors[cellDataType]
      if (customEditor) {
        const context = createEditorContext(cell, row)
        return renderEditor(customEditor, context)
      }
    }

    // Get editor from plugin registry (uses internal cache)
    // Fallback to text plugin editor if no plugin editor found (text plugin is always registered)
    const cellTypeEditor = typeRegistry.getDefaultEditor(cellDataType)
    const EditorComponent = cellTypeEditor ?? textCellType.editor

    if (!EditorComponent) {
      console.warn(
        `[NuGrid] No editor registered for cellDataType "${cellDataType}". Rendering skipped.`,
      )
      return null
    }

    // Use the cached context factory
    const context = createEditorContext(cell, row)
    return renderEditor(EditorComponent, context)
  }

  function renderCellContent(cell: Cell<T, any>, row: Row<T>) {
    const columnDef = cell.column.columnDef
    const isEditing = isEditingCell(row, cell.column.id)

    if (isEditing) {
      // Check if column has custom editor
      if (columnDef.editor) {
        const context = {
          cell,
          row,
          getValue: () => editingValue.value,
          setValue: (value: any) => {
            editingValue.value = value
          },
          stopEditing: (moveDirection?: 'up' | 'down' | 'next' | 'previous') => {
            // Find current editing cell dynamically
            if (!editingCell.value) return

            // Use navigableRows if available (for grouped tables), otherwise use rows
            const rowsList = navigableRows?.value ?? rows.value
            const currentRow = rowsList.find((r) => r.id === editingCell.value!.rowId)
            if (!currentRow) return

            const currentCell = currentRow
              .getAllCells()
              .find((c) => c.column.id === editingCell.value!.columnId)
            if (!currentCell) return

            if (moveDirection) {
              stopEditing(currentRow, currentCell, editingValue.value, moveDirection)
            } else {
              stopEditing(currentRow, currentCell, editingValue.value)
            }
          },
          table: tableApi,
          column: cell.column,
        }
        return renderEditor(columnDef.editor, context)
      }
      // Use default editor
      return createDefaultEditor(cell, row)
    }

    // Normal cell rendering
    return h(FlexRender, {
      render: cell.column.columnDef.cell,
      props: cell.getContext(),
    })
  }

  function handleValidationFailure(config: NuGridResolvedValidation<T>, isClickAway: boolean) {
    // For row-level validation errors, skip the two-click click-away scheme
    // The user needs freedom to navigate within the row to fix the issue
    if (isRowLevelValidationError.value && isClickAway) {
      if (config.validateOn === 'reward') {
        hasBeenPunished.value = true
      }
      // Clear editing state to allow the click to start editing the new cell
      // Don't set hasAttemptedClickAway so the click handler proceeds normally
      // Don't clear validation error - it will be preserved by startEditing if needed
      editingCell.value = null
      editingValue.value = null
      // The row stays invalid and highlighted until all issues are fixed
      return true
    }

    // Two-click behavior for click-away: first click refocuses, second click reverts
    if (isClickAway) {
      if (!hasAttemptedClickAway.value) {
        hasAttemptedClickAway.value = true
        if (config.validateOn === 'reward') {
          hasBeenPunished.value = true
        }
        shouldFocusEditor.value = false
        nextTick(() => {
          shouldFocusEditor.value = true
        })
        return true
      }

      editingCell.value = null
      editingValue.value = null
      validationError.value = null
      hasBeenPunished.value = false
      hasAttemptedClickAway.value = false
      return true
    }

    if (config.validateOn === 'reward') {
      hasBeenPunished.value = true
    }
    shouldFocusEditor.value = true
    return true
  }

  function onCellClick(event: MouseEvent, row: Row<T>, cell: Cell<T, any>) {
    // Don't start editing if we just did a click-away on an invalid editor
    // (the user needs to click again to confirm discarding the invalid value)
    if (hasAttemptedClickAway.value) {
      return
    }

    // Only start editing on single click if startEditClicks is 'single'
    if (startClicks.value === 'single') {
      event.stopPropagation()
      startEditing(row, cell)
    }
  }

  function onCellDoubleClick(event: MouseEvent, row: Row<T>, cell: Cell<T, any>) {
    // Don't start editing if we just did a click-away on an invalid editor
    if (hasAttemptedClickAway.value) {
      return
    }

    // Only start editing on double click if startEditClicks is 'double' (default)
    if (startClicks.value === 'double') {
      event.stopPropagation()
      startEditing(row, cell)
    }
  }

  // Register with the interaction router so editing claims clicks after focus
  if (interactionRouter) {
    unregisterInteraction = interactionRouter.registerCellClickHandler({
      id: 'cell-editing',
      priority: 20,
      handle: ({ event, row, cell }) => {
        // Handle add-row cell transitions atomically to prevent state flicker
        if ((event as any).__addRowCellTransition) {
          // Suppress focus outline during transition to prevent flickering
          // The focus click handler (priority 10) may have already set focusedCell
          if (focusFns.focusedCell.value) {
            focusFns.focusedCell.value = {
              ...focusFns.focusedCell.value,
              suppressOutline: true,
            }
          }

          // Note: editingCell may be null here due to blur, but we still do the transition
          const ctx = getCurrentEditingContext()
          if (ctx) {
            // Stop editing the old cell (saves value) without restoring focus
            stopEditing(ctx.row, ctx.cell, editingValue.value, undefined, {
              restoreFocus: false,
            })
          }
          // Start editing the new cell immediately
          startEditing(row, cell)
          // Don't return handled:true - let other handlers run (e.g., to clear transition flag)
          return { handled: false }
        }

        onCellClick(event, row, cell)
        return { handled: event.defaultPrevented || event.cancelBubble }
      },
    })

    // Register double-click handler for quick editing
    unregisterDoubleClick = interactionRouter.registerCellDoubleClickHandler({
      id: 'cell-editing-dblclick',
      priority: 20,
      handle: ({ event, row, cell }) => {
        onCellDoubleClick(event, row, cell)
        return { handled: event.defaultPrevented || event.cancelBubble }
      },
    })
  }

  function onCellKeyDown(event: KeyboardEvent, row: Row<T>, cell: Cell<T, any>, cellIndex: number) {
    const isEditing = isEditingCell(row, cell.column.id)
    const columnDef = cell.column.columnDef
    const cellDataType = columnDef.cellDataType || 'text'
    const isFocused = focusFns.shouldCellHandleKeydown(row, cellIndex)
    const canEdit = isCellEditable(row, cell)

    // Check for plugin keyboard handling (only when not editing)
    if (!isEditing) {
      const keyboardHandler = typeRegistry.getKeyboardHandler(cellDataType)
      if (keyboardHandler) {
        // Create plugin context
        const pluginContext: any = {
          cell,
          row,
          columnDef,
          column: cell.column,
          getValue: () => cell.getValue(),
          isFocused,
          canEdit,
          data: data.value,
          tableApi,
          startEditing: (initialValue?: any) => startEditing(row, cell, initialValue),
          stopEditing: (newValue: any, moveDirection?: 'up' | 'down' | 'next' | 'previous') => {
            stopEditing(row, cell, newValue, moveDirection)
          },
          emitChange: (oldValue: any, newValue: any) => {
            emit({
              row,
              column: cell.column,
              oldValue,
              newValue,
            })
          },
        }

        const result = keyboardHandler(event, pluginContext)
        if (result.handled) {
          if (result.preventDefault) {
            event.preventDefault()
          }
          if (result.stopPropagation) {
            event.stopPropagation()
          }
          return
        }
      }
    }

    // If editing, don't interfere with editor's keyboard handling
    // The editor component (TableCellEditor) handles its own Enter/Escape/Arrow/Tab keys
    if (isEditing) {
      // Stop propagation to prevent focus system from interfering
      event.stopPropagation()
      return
    }

    // Get enabled key shortcuts (default to all if not specified)
    const enabledKeys =
      startKeys.value === 'all'
        ? ['enter', 'f2', 'bs', 'alpha', 'numeric']
        : startKeys.value === 'minimal'
          ? ['enter', 'f2']
          : startKeys.value === 'none'
            ? []
            : startKeys.value
    const noKeysEnabled = enabledKeys.length === 0

    // Only handle these keys if cell is focused, not editing, and editable
    if (!isEditing && isFocused && canEdit && !noKeysEnabled) {
      // F2 - Start editing with current value
      if (event.key === 'F2' && enabledKeys.includes('f2')) {
        event.preventDefault()
        event.stopPropagation()
        startEditing(row, cell)
        return
      }

      // Backspace or Delete - Start editing with empty value
      if ((event.key === 'Backspace' || event.key === 'Delete') && enabledKeys.includes('bs')) {
        event.preventDefault()
        event.stopPropagation()
        startEditing(row, cell, '')
        return
      }

      // Enter key - Start editing
      if (event.key === 'Enter' && enabledKeys.includes('enter')) {
        event.preventDefault()
        event.stopPropagation()
        startEditing(row, cell)
        return
      }

      // Printable character - Start editing with that character
      // Check if it's a single printable character (not a modifier or special key)
      if (
        event.key.length === 1
        && !event.ctrlKey
        && !event.metaKey
        && !event.altKey
        && event.key !== ' ' // Exclude space to avoid conflicts with shortcuts
      ) {
        const isAlpha = /[a-z]/i.test(event.key)
        const isNumeric = /\d/.test(event.key)

        if (
          (isAlpha && enabledKeys.includes('alpha'))
          || (isNumeric && enabledKeys.includes('numeric'))
        ) {
          event.preventDefault()
          event.stopPropagation()
          startEditing(row, cell, event.key)
          return
        }
      }
    }

    // Otherwise, let focus system handle it
    if (isFocused) {
      focusFns.onCellKeyDown(event)
    }
  }

  // Click-off-to-close: Close editor when clicking outside the editing cell
  const handleClickOutside = (event: MouseEvent | PointerEvent) => {
    if (!editingCell.value) return

    // If this is an add-row cell transition, skip - the click handler will do atomic transition
    if ((event as any).__addRowCellTransition) {
      return
    }

    // If addrow is being finalized, skip - the click handler will handle it
    if ((event as any).__addRowFinalizing) {
      return
    }

    const target = event.target as HTMLElement

    // Check if click is inside a UI overlay (dropdown, popover, modal, etc.)
    // These are rendered in portals outside the grid DOM but should not trigger outside-click
    const isInsideUIOverlay = target.closest(
      '[role="menu"], [role="listbox"], [role="dialog"], .headlessui-portal-root, [data-headlessui-portal]',
    )
    if (isInsideUIOverlay) {
      return
    }

    const isClickInsideGrid = Boolean(tableRef.value && tableRef.value.contains(target))

    // Find the editing cell element
    if (tableRef.value && editingCell.value) {
      // Use navigableRows if available (for grouped tables), otherwise use rows
      const rowsList = navigableRows?.value ?? rows.value
      const currentRow = rowsList.find((r) => r.id === editingCell.value!.rowId)
      if (!currentRow) return

      const cellIndex = currentRow
        .getVisibleCells()
        .findIndex((c) => c.column.id === editingCell.value!.columnId)
      if (cellIndex === -1) return

      const selector = cellSelector.replace('$COL', String(cellIndex)).replace('$ID', currentRow.id)

      const editingCellElement = tableRef.value.querySelector(selector) as HTMLElement

      // If click is outside the editing cell, close the editor
      if (editingCellElement && !editingCellElement.contains(target)) {
        const currentCell = currentRow
          .getAllCells()
          .find((c) => c.column.id === editingCell.value!.columnId)
        if (currentCell) {
          // Check if we're editing an add row - if clicking away, reset to empty state
          const isAddRow = addRowContext?.isAddRowRow(currentRow)
          if (isAddRow && addRowContext) {
            // Reset the add row to empty state and clear editing
            addRowContext.resetAddRow(currentRow)
            editingCell.value = null
            editingValue.value = null
            validationError.value = null
            hasBeenPunished.value = false
            hasAttemptedClickAway.value = false
            if (isClickInsideGrid) {
              // Keep grid focused and suppress outline during transition
              focusFns.gridHasFocus.value = true
              if (focusFns.focusedCell.value) {
                focusFns.focusedCell.value = {
                  ...focusFns.focusedCell.value,
                  columnIndex: -1,
                }
              }
            } else {
              // Clear focus state when clicking outside the grid
              focusFns.focusedCell.value = null
            }
            return
          }

          if (isClickInsideGrid) {
            // Keep grid focused during internal click transitions to prevent flash
            focusFns.gridHasFocus.value = true
            // Set columnIndex to -1 to prevent focus outline on old cell
            // while keeping row highlighting via rowIndex
            // The click handler will set focusedCell to the new cell
            if (focusFns.focusedCell.value) {
              focusFns.focusedCell.value = {
                ...focusFns.focusedCell.value,
                columnIndex: -1,
              }
            }
          }
          stopEditing(currentRow, currentCell, editingValue.value, undefined, {
            restoreFocus: !isClickInsideGrid,
            isClickAway: isClickInsideGrid, // Signal this is a click-away attempt
          })
        }
      }
    }
  }

  // Register outside-click handling through the interaction router
  if (interactionRouter) {
    unregisterOutsidePointer = interactionRouter.registerGlobalPointerHandler({
      id: 'cell-editing-outside',
      priority: 25,
      handle: ({ event }) => {
        handleClickOutside(event)
        return { handled: false }
      },
    })
  } else if (typeof document !== 'undefined') {
    const listener = (event: MouseEvent) => handleClickOutside(event)
    onMounted(() => document.addEventListener('mousedown', listener))
    unregisterOutsidePointer = () => {
      document.removeEventListener('mousedown', listener)
    }
  }

  onUnmounted(() => {
    if (unregisterInteraction) {
      unregisterInteraction()
      unregisterInteraction = null
    }

    if (unregisterDoubleClick) {
      unregisterDoubleClick()
      unregisterDoubleClick = null
    }

    if (unregisterOutsidePointer) {
      unregisterOutsidePointer()
      unregisterOutsidePointer = null
    }
  })

  return {
    editingCell,
    editingValue,
    isNavigating,
    shouldFocusEditor,
    validationError,
    showValidationErrors,
    validationIcon,
    startClicks,
    // Row validation
    rowValidationErrors,
    hasRowValidationError,
    hasCellValidationError,
    getRowValidationError,
    // Cell editing functions
    isEditingCell,
    isCellEditable,
    startEditing,
    stopEditing,
    createDefaultEditor,
    renderCellContent,
    onCellClick,
    onCellDoubleClick,
    onCellKeyDown,
  }
}
