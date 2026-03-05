/**
 * @internal
 */

import type { TableData } from '../table-data'
import type { Cell, Column, Row, Table } from '../../engine'
import type { Component, ComputedRef, Ref } from 'vue'

import type { NuGridShowErrors } from '../validation'

/**
 * Editor configuration type - supports multiple formats for flexibility
 * @internal
 */
export type NuGridEditorConfig =
  | string // Component name (e.g., 'NuGridCellEditorRange')
  | Component // Component reference
  | { component: string | Component; props?: Record<string, any> } // Component with props
  | ((context: NuGridEditorRenderContext) => any) // Function for advanced use cases

/**
 * Editing cell position
 * @internal
 */
export interface NuGridEditingCell {
  rowId: string
  columnId: string
}

/**
 * Row validation error state
 * @internal
 */
export interface NuGridRowValidationError {
  message: string
  failedFields: string[]
}

/**
 * Type for nugrid-celleditfns injection
 * Provides cell editing functionality
 * @internal
 */
export interface NuGridCellEditing<T extends TableData = TableData> {
  editingCell: Ref<NuGridEditingCell | null>
  editingValue: Ref<any>
  isNavigating: Ref<boolean>
  shouldFocusEditor: Ref<boolean>
  validationError: Ref<string | null>
  showValidationErrors: Ref<NuGridShowErrors>
  validationIcon: Ref<string>
  startClicks: Ref<'none' | 'single' | 'double'>
  enterBehavior: ComputedRef<string>
  // Row validation state
  rowValidationErrors: Ref<Map<string, NuGridRowValidationError>>
  hasRowValidationError: (rowId: string) => boolean
  hasCellValidationError: (rowId: string, columnId: string) => boolean
  getRowValidationError: (rowId: string) => string | null
  // Cell editing functions
  isEditingCell: (row: Row<T>, columnId: string) => boolean
  isCellEditable: (row: Row<T>, cell: Cell<T>) => boolean
  startEditing: (
    row: Row<T>,
    cell: Cell<T>,
    initialValue?: any,
    options?: { rowIndex?: number; cellIndex?: number },
  ) => void
  stopEditing: (
    row: Row<T>,
    cell: Cell<T>,
    newValue: any,
    moveDirection?: 'up' | 'down' | 'left' | 'right' | 'next' | 'previous',
    options?: { restoreFocus?: boolean },
  ) => void
  createDefaultEditor: (cell: Cell<T>, row: Row<T>) => any
  renderCellContent: (cell: Cell<T>, row: Row<T>) => any
  onCellClick: (event: MouseEvent, row: Row<T>, cell: Cell<T>) => void
  onCellDoubleClick: (event: MouseEvent, row: Row<T>, cell: Cell<T>) => void
  onCellKeyDown: (event: KeyboardEvent, row: Row<T>, cell: Cell<T>, cellIndex: number) => void
}

/**
 * Type for the editor render context
 * Used when rendering editors with custom components or functions
 * @internal
 */
export interface NuGridEditorRenderContext<T = any> {
  cell: Cell<T>
  row: Row<T>
  getValue: () => any
  setValue: (value: any) => void
  stopEditing: (moveDirection?: 'up' | 'down' | 'left' | 'right' | 'next' | 'previous') => void
  table: Table<T>
  column: Column<T>
}
