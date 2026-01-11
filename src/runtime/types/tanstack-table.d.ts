import type { Column, Row, RowData } from '@tanstack/vue-table'
import type { NuGridEditorConfig } from './_internal'
import type { NuGridColumnMenuItem } from './column'
import type { NuGridSortIcon, NuGridValidationResult } from './index'

/**
 * Module augmentation for TanStack Table to add NuGrid custom column properties.
 * This extends the ColumnDefBase interface to add custom properties directly
 * to column definitions, avoiding the need to access them via the `meta` property.
 *
 * @see https://tanstack.com/table/latest/docs/guide/column-defs#column-def-types
 */
declare module '@tanstack/vue-table' {
  interface ColumnDefBase<TData extends RowData, TValue> {
    /**
     * Editor configuration for the column cell
     * Can be specified as:
     * - String: Component name (e.g., 'NuGridCellEditorRange')
     * - Object: { component: 'ComponentName', props: { min: 0, max: 100 } }
     * - Function: Custom render function for advanced cases
     */
    editor?: NuGridEditorConfig

    /**
     * Controls whether this column is editable
     * Can be a boolean or a function that receives the row and returns a boolean
     * @defaultValue true
     */
    enableEditing?: boolean | ((row: Row<TData>) => boolean)

    /**
     * Controls whether this column can receive keyboard focus during navigation
     * Can be a boolean or a function that receives the row and returns a boolean
     * When false, the column will be skipped during keyboard navigation (arrows, tab, etc.)
     * @defaultValue true
     */
    enableFocusing?: boolean | ((row: Row<TData>) => boolean)

    /**
     * Data type for the cell, determines which default editor to use
     * Built-in types: 'text', 'number', 'date', 'boolean', 'selection', 'action-menu'
     * Custom types can be registered via cellTypes prop
     * @defaultValue 'text'
     */
    cellDataType?: string

    /**
     * Sort icon configuration for this column's header
     * Overrides the grid-level sortIcons configuration
     */
    sortIcons?: NuGridSortIcon

    /**
     * Override the default cell rendering behavior
     * When true, indicates that the cell uses a custom renderer and should bypass default rendering logic
     * @defaultValue false
     */
    overrideCellRender?: boolean

    /**
     * Controls whether the column menu is enabled for this column
     * @defaultValue true
     */
    enableColumnMenu?: boolean

    /**
     * Controls whether this column can be reordered via drag and drop
     * @defaultValue true
     */
    enableReordering?: boolean

    /**
     * Custom menu items for the column menu
     * Can be either:
     * - An array of menu items (replaces default items)
     * - A callback function that receives default items and returns custom items
     */
    columnMenuItems?:
      | NuGridColumnMenuItem<TData>[]
      | ((
          defaultItems: NuGridColumnMenuItem<TData>[],
          column?: Column<TData, unknown>,
        ) => NuGridColumnMenuItem<TData>[])

    /**
     * Controls whether this column's editor is shown when the user clicks "Add New"
     * When false, the column will be hidden in the add new row form
     * @defaultValue true
     */
    showNew?: boolean

    /**
     * Controls whether this column is required when adding a new row
     * Can be a boolean or a function that returns a boolean
     * @defaultValue false
     */
    requiredNew?: boolean | (() => boolean)

    /**
     * Validation function for the new row value
     * Called when the user attempts to add a new row with a value for this column
     * @param value The current value being attempted by the user
     * @returns NuGridValidationResult, boolean, or string (error message)
     */
    validateNew?: (value: any) => NuGridValidationResult | boolean | string | undefined | null

    /**
     * The visual row index this column should appear on in multi-row mode
     * Only used when `multiRow.enabled` is true on the grid
     * Columns on the same row are rendered left-to-right in their defined order
     * @defaultValue 0
     */
    row?: number

    /**
     * Number of column slots to span in aligned multi-row mode
     * Only used when `multiRow.alignColumns` is true
     * - Number: Span that many columns from row 0
     * - '*': Span all remaining columns (fills to the end)
     * @defaultValue 1
     */
    span?: number | '*'
  }
}

export {}
