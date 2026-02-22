/**
 * Cell Types System - Public API for custom cell types and editors
 *
 * This module exports types for creating custom cell types, editors,
 * renderers, and filters for NuGrid columns.
 *
 * Import from '#nu-grid/cells' in your Nuxt application.
 */

import type { TableData } from '@nuxt/ui'
import type { Column, Row, Table } from '@tanstack/vue-table'
import type { Component, Ref } from 'vue'
import type { NuGridEditorConfig, NuGridInteractionRouter } from './_internal'
import type { NuGridColumn, NuGridColumnMenuItem } from './column'
import type { NuGridShowErrors } from './validation'

// =============================================================================
// CELL EDITOR TYPES
// =============================================================================

/**
 * Props for custom cell editor components
 */
export interface NuGridCellEditorProps<T extends TableData = TableData> {
  modelValue: any
  cell: any
  row: Row<any>
  isNavigating: boolean
  shouldFocus: boolean
  /**
   * Validation error message from schema validation
   * When set, the editor should display error styling and optionally show the message
   */
  validationError?: string | null
  /**
   * When to show error messages
   * - 'always': show whenever invalid (default)
   * - 'hover': show only while hovering
   * - 'never': never show
   * @defaultValue 'always'
   */
  showValidationErrors?: NuGridShowErrors
  /**
   * Interaction router for registering keyboard handlers
   * Editors can use this to register keyboard handlers through the router system
   * instead of managing their own document-level listeners
   */
  interactionRouter?: NuGridInteractionRouter<T>
  /**
   * What happens when Enter is pressed during editing
   * Passed from the grid's editing options
   * @defaultValue 'default'
   */
  enterBehavior?: 'default' | 'moveDown' | 'moveCell'
}

/**
 * Emits for custom cell editor components
 */
export interface NuGridCellEditorEmits {
  (e: 'update:modelValue', value: any): void
  (e: 'stop-editing', moveDirection?: 'up' | 'down' | 'next' | 'previous'): void
  (e: 'cancel-editing'): void
  (e: 'update:isNavigating', value: boolean): void
}

// =============================================================================
// CELL RENDER TYPES
// =============================================================================

/**
 * Renderer configuration type - supports multiple formats for flexibility
 */
export type NuGridRendererConfig =
  | string // Component name (e.g., 'NuGridCellRendererBoolean')
  | Component // Component reference
  | { component: string | Component; props?: Record<string, any> } // Component with props
  | ((context: NuGridCellRenderContext) => any) // Function for advanced use cases

/**
 * Context provided when rendering a cell
 */
export interface NuGridCellRenderContext<T = any> {
  cell: any
  row: Row<T>
  getValue: () => any
  column: Column<T, unknown>
  table: Table<T>
}

// =============================================================================
// FILTER TYPES
// =============================================================================

/**
 * Filter operator definition
 */
export interface NuGridFilterOperator {
  /** Unique identifier for the operator */
  value: string
  /** Human-readable label */
  label: string
  /** Filter function that determines if a row matches */
  filterFn: (row: Row<any>, columnId: string, filterValue: any, operatorValue: string) => boolean
}

/**
 * Filter configuration for a cell type
 */
export interface NuGridFilterConfig {
  /** Filter control component (rendered in column menu or header) */
  component?: Component | string

  /** Props to pass to filter component */
  props?: Record<string, any>

  /** Default filter value */
  defaultValue?: any

  /** Filter operator options (e.g., 'equals', 'contains', 'greaterThan', etc.) */
  operators?: NuGridFilterOperator[]

  /** Default operator to use */
  defaultOperator?: string
}

/**
 * Context provided to filter components
 */
export interface NuGridFilterContext<T extends TableData = TableData> {
  /** The column being filtered */
  column: Column<T, unknown>
  /** Current filter value (reactive) */
  filterValue: Ref<any>
  /** Set the filter value */
  setFilterValue: (value: any) => void
  /** Clear the filter */
  clearFilter: () => void
  /** Whether a filter is currently active */
  isFiltered: boolean
  /** Table API instance */
  table: Table<T>
}

// =============================================================================
// CELL TYPE CONTEXT & RESULT TYPES
// =============================================================================

/**
 * Context provided to cell types
 * Provides access to cell, row, column, and utility functions
 */
export interface NuGridCellTypeContext<T extends TableData = TableData> {
  /** The cell being operated on */
  cell: any
  /** The row containing the cell */
  row: Row<T>
  /** Column definition */
  columnDef: any
  /** Column instance */
  column: Column<T, unknown>
  /** Current cell value */
  getValue: () => any
  /** Whether the cell is currently focused */
  isFocused: boolean
  /** Whether editing is enabled for this cell */
  canEdit: boolean
  /** Data array reference (for direct updates) */
  data: T[]
  /** TanStack table API */
  tableApi: Table<T>
  /** Start editing the cell */
  startEditing: (initialValue?: any) => void
  /** Stop editing and save value */
  stopEditing: (newValue: any, moveDirection?: 'up' | 'down' | 'next' | 'previous') => void
  /** Emit cell value change event */
  emitChange: (oldValue: any, newValue: any) => void
}

/**
 * Result from a cell type's keyboard handler
 */
export interface NuGridCellTypeKeyboardResult {
  /** Whether the cell type handled this key event */
  handled: boolean
  /** Whether to prevent default behavior */
  preventDefault?: boolean
  /** Whether to stop event propagation */
  stopPropagation?: boolean
}

/**
 * Result from validation function
 */
export interface NuGridValidationResult {
  /** Whether the value is valid */
  valid: boolean
  /** Error message if invalid */
  message?: string
  /** Detailed validation issues (for schema validation) */
  issues?: ReadonlyArray<{
    message: string
    path?: ReadonlyArray<PropertyKey | { key: PropertyKey }>
  }>
}

// =============================================================================
// CELL TYPE DEFINITION
// =============================================================================

/**
 * Cell type interface
 * Comprehensive interface for defining custom cell types with editors, renderers, filters, validation, and more
 *
 * @example
 * // Custom rating cell type
 * const ratingCellType: NuGridCellType = {
 *   name: 'rating',
 *   displayName: 'Rating',
 *   description: '1-5 star rating column',
 *   editor: RatingEditor,
 *   renderer: RatingRenderer,
 *   filter: {
 *     component: RatingFilter,
 *     operators: [
 *       { value: 'equals', label: 'Equals', filterFn: (row, colId, val) => row.getValue(colId) === val },
 *       { value: 'gte', label: 'At least', filterFn: (row, colId, val) => row.getValue(colId) >= val }
 *     ]
 *   },
 *   validation: (value) => ({
 *     valid: value >= 1 && value <= 5,
 *     message: value < 1 || value > 5 ? 'Rating must be between 1 and 5' : undefined
 *   }),
 *   formatter: (value) => `${value} ⭐`,
 *   keyboardHandler: (event, context) => {
 *     if (event.key >= '1' && event.key <= '5' && context.isFocused && context.canEdit) {
 *       const newValue = parseInt(event.key)
 *       const oldValue = context.getValue()
 *       context.emitChange(oldValue, newValue)
 *       return { handled: true, preventDefault: true }
 *     }
 *     return { handled: false }
 *   }
 * }
 */
export interface NuGridCellType<T extends TableData = TableData> {
  /**
   * Unique name for this cell type
   * Used to match against column's cellDataType property
   */
  name: string

  /**
   * Human-readable display name for this type
   * Used in UI elements like filter dropdowns
   */
  displayName?: string

  /**
   * Description of what this cell type does
   * Used for documentation and tooltips
   */
  description?: string

  /**
   * Editor component for edit mode
   * Used when column doesn't specify a custom editor
   */
  editor?: NuGridEditorConfig

  /**
   * Renderer component for display mode
   * Optional - falls back to default cell rendering if not provided
   */
  renderer?: NuGridRendererConfig

  /**
   * Custom keyboard handler for non-editing mode
   * Called when a key is pressed on a focused cell that is not in edit mode
   * Return { handled: true } to prevent default behavior
   */
  keyboardHandler?: (
    event: KeyboardEvent,
    context: NuGridCellTypeContext<T>,
  ) => NuGridCellTypeKeyboardResult

  /**
   * Validation function for cell values
   * Called when editing stops to validate the new value
   */
  validation?: (value: any, context: NuGridCellTypeContext<T>) => NuGridValidationResult

  /**
   * Formatter function for display values
   * Transforms the raw value for display purposes
   */
  formatter?: (value: any, context: NuGridCellTypeContext<T>) => any

  /**
   * Filter configuration
   * Defines filter component and operators for this cell type
   */
  filter?: NuGridFilterConfig

  /**
   * Custom filter function
   * Overrides default filtering logic for this cell type
   * If not provided, uses TanStack Table's default filterFn or type's filter operators
   */
  filterFn?: (row: Row<T>, columnId: string, filterValue: any) => boolean

  /**
   * Whether filtering is enabled for this cell type
   * @defaultValue true if filter is provided, false otherwise
   */
  enableFiltering?: boolean

  /**
   * Column menu customization
   * Allows cell types to add or modify column menu items
   */
  columnMenuItems?: (
    defaultItems: NuGridColumnMenuItem<T>[],
    column: Column<T, unknown>,
  ) => NuGridColumnMenuItem<T>[]

  /**
   * Default cell renderer function
   * Used if renderer component is not provided
   * Falls back to TanStack Table's default cell rendering
   */
  defaultCellRenderer?: (context: NuGridCellRenderContext<T>) => any

  /**
   * Lifecycle hook called when a cell is created
   * Useful for initialization or setup
   */
  onCellCreated?: (cell: any, context: NuGridCellTypeContext<T>) => void

  /**
   * Lifecycle hook called when a cell value changes
   * Useful for side effects or data synchronization
   */
  onValueChanged?: (oldValue: any, newValue: any, context: NuGridCellTypeContext<T>) => void

  /**
   * Default column definition properties
   * Applied to columns using this cell type
   * Can be overridden by explicit column definition
   */
  defaultColumnDef?: Partial<NuGridColumn<T>>
}

// =============================================================================
// COMPOSABLES FOR CUSTOM CELL TYPES AND EDITORS
// =============================================================================

// Re-export cell-related composables for convenience
export { useNuGridCellEditor } from '../composables/useNuGridCellEditor'
export {
  nuGridCellTypeRegistry,
  useNuGridCellTypeRegistry,
} from '../composables/useNuGridCellTypeRegistry'
