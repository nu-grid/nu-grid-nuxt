import type { DropdownMenuItem } from '@nuxt/ui'
import type { Column, EngineCell, EngineColumn, EngineHeader, EngineRow, EngineTable, Row } from '../engine'

import type { NuGridEditorConfig } from './_internal'
import type { NuGridValidationResult } from './cells'
import type { NuGridLookupOptions } from './option-groups'
import type { NuGridSortIcon } from './sort-icon'
import type { TableData } from './table-data'

// ---------------------------------------------------------------------------
// Render Context Types
// ---------------------------------------------------------------------------

/**
 * Context passed to header/footer render functions on column definitions
 * Matches the return type of EngineHeader.getContext()
 */
export interface NuGridHeaderContext<T = any> {
  table: EngineTable<T>
  header: EngineHeader<T>
  column: EngineColumn<T>
}

/**
 * Context passed to cell render functions on column definitions
 * Matches the return type of EngineCell.getContext()
 */
export interface NuGridCellContext<T = any> {
  table: EngineTable<T>
  column: EngineColumn<T>
  row: EngineRow<T>
  cell: EngineCell<T>
  getValue: <V = unknown>() => V
  renderValue: <V = unknown>() => V | null
}

// ---------------------------------------------------------------------------
// Summary Types
// ---------------------------------------------------------------------------

/**
 * Built-in aggregate types for column summaries
 */
export type NuGridAggregateType = 'sum' | 'avg' | 'count' | 'min' | 'max'

/**
 * Context passed to summary format functions
 */
export interface NuGridSummaryFormatContext {
  /** The group ID if this is a group summary */
  groupId?: string
  /** True if this is a grand total (all data) */
  isGrandTotal?: boolean
}

/**
 * Summary configuration for a column
 * Enables automatic aggregate calculations for group and grand totals
 */
export interface NuGridColumnSummary<T = unknown> {
  /**
   * The aggregate function to use
   * - 'sum': Sum of all numeric values
   * - 'avg': Average of all numeric values
   * - 'count': Count of all rows
   * - 'min': Minimum numeric value
   * - 'max': Maximum numeric value
   * - Function: Custom aggregate function receiving all rows
   */
  aggregate: NuGridAggregateType | ((rows: any[]) => T)

  /**
   * Optional format function for displaying the aggregated value
   * @param value The calculated aggregate value
   * @param context Context with groupId and isGrandTotal flags
   * @returns Formatted string to display
   * @example
   * format: (value) => `$${value.toFixed(2)}`
   */
  format?: (value: T, context: NuGridSummaryFormatContext) => string

  /**
   * Optional label to show before the value
   * @example 'Total: ' would display as "Total: $1,234.56"
   */
  label?: string
}

// ---------------------------------------------------------------------------
// Column Menu Types
// ---------------------------------------------------------------------------

/**
 * Extended dropdown menu item for column menus
 * Adds column parameter to onSelect callback
 * Supports all DropdownMenuItem types (separator, label, etc.) but extends onSelect for regular items
 */
export type NuGridColumnMenuItem<T extends TableData = TableData> =
  | (Omit<DropdownMenuItem, 'onSelect' | 'children'> & {
      /**
       * Callback function called when the menu item is selected
       * @param event The click event (optional)
       * @param column The column instance (automatically provided by NuGridColumnMenu)
       */
      onSelect?: (event?: Event, column?: Column<T>) => void
      /**
       * Nested menu items (children)
       */
      children?: NuGridColumnMenuItem<T>[]
    })
  | Extract<DropdownMenuItem, { type: 'separator' | 'label' }>

/**
 * Function type for customizing column menu items
 * Used by both column-level `columnMenuItems` callbacks and grid-level `getColumnMenuItems`
 * @param defaultItems The default menu items for the column
 * @param column The column instance
 * @returns Custom menu items array
 */
export type NuGridColumnMenuItemsCallback<T extends TableData = TableData> = (
  defaultItems: NuGridColumnMenuItem<T>[],
  column: Column<T>,
) => NuGridColumnMenuItem<T>[]

// ---------------------------------------------------------------------------
// Column Definition
// ---------------------------------------------------------------------------

/**
 * NuGrid column definition
 *
 * Fully self-contained — no dependency on @nuxt/ui.
 * Base properties are what the NuGrid engine reads from columnDef.
 */
export interface NuGridColumn<T extends TableData = TableData> {
  // --- Identity ---

  /** Column identifier. Auto-generated from accessorKey if not provided. */
  id?: string

  /** Key in the row data to access this column's value */
  accessorKey?: string

  /** Custom accessor function for computing cell values */
  accessorFn?: (row: T, index: number) => any

  // --- Rendering ---

  /**
   * Header content — string or render function
   * @example
   * header: 'Name'
   * header: ({ column }) => `Sort: ${column.getIsSorted()}`
   */
  header?: string | ((props: NuGridHeaderContext<T>) => any)

  /**
   * Cell content render function
   * @example
   * cell: ({ getValue }) => `$${getValue<number>().toFixed(2)}`
   */
  cell?: string | ((props: NuGridCellContext<T>) => any)

  /**
   * Footer content — string or render function
   */
  footer?: string | ((props: NuGridHeaderContext<T>) => any)

  // --- Column Groups ---

  /** Child columns (for grouped header columns) */
  columns?: NuGridColumn<T>[]

  // --- Metadata ---

  /** Arbitrary metadata attached to the column */
  meta?: Record<string, any>

  // --- Sizing ---

  /**
   * Default column width in pixels
   * @defaultValue 150
   */
  size?: number

  /** Minimum column width in pixels */
  minSize?: number

  /** Maximum column width in pixels */
  maxSize?: number

  // --- Feature Flags (read by engine) ---

  /** Whether this column can be resized */
  enableResizing?: boolean

  /** Whether this column can be sorted */
  enableSorting?: boolean

  /** Whether this column can be hidden */
  enableHiding?: boolean

  /** Whether this column can be filtered */
  enableColumnFilter?: boolean

  /** Whether this column is included in global filter */
  enableGlobalFilter?: boolean

  /** Whether this column can be used for grouping */
  enableGrouping?: boolean

  /** Whether multi-sort is allowed for this column */
  enableMultiSort?: boolean

  /** Whether this column can be pinned */
  enablePinning?: boolean

  /** Whether descending sort comes first when toggling */
  sortDescFirst?: boolean

  /** How undefined values are treated during sorting */
  sortUndefined?: false | -1 | 1 | 'first' | 'last'

  // --- NuGrid Extensions ---

  /**
   * Editor configuration for the column cell
   * Can be specified as:
   * - String: Component name (e.g., 'NuGridCellEditorRange')
   * - Object: { component: 'ComponentName', props: { min: 0, max: 100 } }
   * - Function: Custom render function for advanced cases
   * @example
   * // Simple component reference
   * editor: 'NuGridCellEditorRange'
   *
   * // Component with props
   * editor: { component: 'NuGridCellEditorRange', props: { min: 0, max: 100, step: 5 } }
   */
  editor?: NuGridEditorConfig

  /**
   * Controls whether this column is editable
   * Can be a boolean or a function that receives the row and returns a boolean
   * @defaultValue true
   */
  enableEditing?: boolean | ((row: Row<T>) => boolean)

  /**
   * Controls whether this column can receive keyboard focus during navigation
   * Can be a boolean or a function that receives the row and returns a boolean
   * When false, the column will be skipped during keyboard navigation (arrows, tab, etc.)
   * @defaultValue true
   */
  enableFocusing?: boolean | ((row: Row<T>) => boolean)

  /**
   * Data type for the cell, determines which default editor to use
   * - Automatically inferred from row data if not specified (when dataTypeInference is enabled)
   * - Set to `false` to disable inference and use default text rendering
   * Built-in types: 'text', 'number', 'date', 'boolean', 'currency', 'percentage', 'selection', 'action-menu', 'lookup'
   * Custom types can be registered via cellTypes prop
   * @defaultValue undefined (inferred from data)
   */
  cellDataType?: string | false

  /**
   * Lookup/dropdown configuration for cells using cellDataType: 'lookup'
   * Provides a dropdown selection interface using Nuxt UI's SelectMenu
   * @example
   * {
   *   items: [
   *     { value: 'active', label: 'Active' },
   *     { value: 'inactive', label: 'Inactive' }
   *   ],
   *   valueKey: 'value',
   *   labelKey: 'label',
   *   searchable: true
   * }
   */
  lookup?: NuGridLookupOptions

  /**
   * Sort icon configuration for this column's header
   * Overrides the grid-level sortIcons configuration
   * @example
   * // Use custom icons for this column
   * sortIcons: {
   *   unsorted: 'i-lucide-chevrons-up-down',
   *   asc: 'i-lucide-chevron-up',
   *   desc: 'i-lucide-chevron-down',
   *   position: 'inline'
   * }
   */
  sortIcons?: NuGridSortIcon

  /**
   * Override which value is used for sorting.
   * When a string, reads that key from the row data instead of the column's accessor.
   * When a function, calls it with the row to get the sort value.
   * Useful when a column displays one field (e.g. statusText) but should
   * sort by another (e.g. statusSort).
   * @example
   * // Sort by numeric sort order instead of display text
   * { accessorKey: 'statusText', header: 'Status', sortAccessor: 'statusSort' }
   *
   * @example
   * // Sort by a nested or computed value
   * { accessorKey: 'name', sortAccessor: (row) => row.lastName + row.firstName }
   */
  sortAccessor?: string | ((row: T) => unknown)

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
   * When true, header controls (sort icon, menu) are hidden by default and shown
   * in a floating overlay on hover. Useful for narrow columns or when you want a
   * cleaner header appearance.
   * When false, controls are always shown inline regardless of column width.
   * When undefined (default), controls auto-compact when column width < 150px.
   */
  compactHeader?: boolean

  /**
   * Controls whether this column can be reordered via drag and drop
   * @defaultValue true
   */
  enableReordering?: boolean

  /**
   * Controls whether the column visibility chooser appears in the column menu
   * Column-level setting takes precedence over grid-level `showColumnVisibility`
   * @defaultValue true
   */
  showColumnVisibility?: boolean

  /**
   * Custom menu items for the column menu
   * Can be either:
   * - An array of menu items (replaces default items)
   * - A callback function that receives default items and returns custom items
   * If not provided, default menu items are used
   * @example
   * // Replace with custom items
   * columnMenuItems: [
   *   { label: 'Custom Action', icon: 'i-lucide-star', onSelect: (event, column) => console.log(column?.id) }
   * ]
   * @example
   * // Modify default items
   * columnMenuItems: (defaultItems) => [
   *   ...defaultItems,
   *   { type: 'separator' },
   *   { label: 'Custom Action', icon: 'i-lucide-star', onSelect: (event, column) => console.log(column?.id) }
   * ]
   */
  columnMenuItems?:
    | NuGridColumnMenuItem<T>[]
    | ((
        defaultItems: NuGridColumnMenuItem<T>[],
        column?: Column<T>,
      ) => NuGridColumnMenuItem<T>[])

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
   * @example
   * // Simple boolean
   * requiredNew: true
   *
   * @example
   * // Function for dynamic requirement
   * requiredNew: () => someCondition
   */
  requiredNew?: boolean | (() => boolean)

  /**
   * Validation function for the new row value
   * Called when the user attempts to add a new row with a value for this column
   * @param value The current value being attempted by the user
   * @returns NuGridValidationResult, boolean, or string (error message)
   * @example
   * // Return NuGridValidationResult
   * validateNew: (value) => ({
   *   valid: value.length > 0,
   *   message: 'Name is required'
   * })
   *
   * @example
   * // Return boolean
   * validateNew: (value) => value > 0
   *
   * @example
   * // Return string (error message) or undefined/null (valid)
   * validateNew: (value) => value ? undefined : 'Value is required'
   */
  validateNew?: (value: any) => NuGridValidationResult | boolean | string | undefined | null

  /**
   * Controls whether text in this column should wrap instead of being truncated
   * When true, cell content will wrap to multiple lines
   * When false or undefined, text will be truncated with ellipsis
   * @defaultValue false
   */
  wrapText?: boolean

  /**
   * Alternate field in the row data to use as the tooltip value
   * When set, tooltip always shows (ignores truncatedOnly setting for this column)
   * @example
   * // Show 'fullDescription' field as tooltip for 'title' column
   * { accessorKey: 'title', tooltipField: 'fullDescription' }
   */
  tooltipField?: string

  /**
   * Function to generate custom tooltip content for cells in this column
   * Takes precedence over tooltipField
   * When set, tooltip always shows (ignores truncatedOnly setting for this column)
   * @param row The row data
   * @returns The tooltip text to display
   * @example
   * // Generate tooltip from multiple fields
   * tooltipValue: (row) => `${row.name} - ${row.department}`
   */
  tooltipValue?: (row: T) => string

  /**
   * Whether to show a tooltip on the column header
   * Useful for showing full header text when header is truncated
   * @defaultValue false
   */
  tooltipHeader?: boolean

  /**
   * Function to generate custom tooltip content for the column header
   * When set, tooltipHeader is automatically enabled
   * @returns The tooltip text for the header
   * @example
   * // Custom header tooltip
   * tooltipHeaderValue: () => 'Full column description or help text'
   */
  tooltipHeaderValue?: () => string

  /**
   * The visual row index this column should appear on in multi-row mode
   * Only used when `multiRow.enabled` is true on the grid
   * Columns on the same row are rendered left-to-right in their defined order
   * @defaultValue 0
   * @example
   * // Place this column on the second visual row
   * row: 1
   */
  row?: number

  /**
   * Number of column slots to span in aligned multi-row mode
   * Only used when `multiRow.alignColumns` is true
   * - Number: Span that many columns from row 0
   * - '*': Span all remaining columns (fills to the end)
   * @defaultValue 1
   * @example
   * // Span 2 column slots
   * span: 2
   *
   * @example
   * // Span all remaining columns
   * span: '*'
   */
  span?: number | '*'

  /**
   * Lock the column to an exact pixel width
   * Sets `size`, `minSize`, and `maxSize` all to the given value
   * @example
   * // Fixed 80px column that cannot be resized wider or narrower
   * { accessorKey: 'id', lockSize: 80 }
   */
  lockSize?: number

  /**
   * Controls whether the column participates in flex distribution in fill mode
   * - true (default): Column flexes to fill available space (uses widthPercentage or equal share)
   * - false: Column uses its fixed `size` and doesn't grow/shrink
   *
   * Use grow: false for columns that should have a fixed width regardless of container size,
   * such as checkbox columns, ID columns, or action columns.
   * @defaultValue true
   * @example
   * // Fixed-width columns that don't grow
   * { id: 'select', size: 50, grow: false }    // Checkbox column
   * { accessorKey: 'id', size: 80, grow: false } // ID column
   * { accessorKey: 'status', size: 120, grow: false } // Status badge column
   *
   * @example
   * // Flex columns that share remaining space (default behavior)
   * { accessorKey: 'name' }   // Grows with equal share
   * { accessorKey: 'email' }  // Grows with equal share
   */
  grow?: boolean

  /**
   * Weighted flex-grow value for proportional distribution in fill mode
   * Columns with higher values take more space relative to other flex columns
   * Only applies when grow !== false (flex columns only)
   * @example
   * // Name takes 40%, Email takes 40%, Location takes 20% of flex space
   * { accessorKey: 'name', widthPercentage: 40 }
   * { accessorKey: 'email', widthPercentage: 40 }
   * { accessorKey: 'location', widthPercentage: 20 }
   *
   * @example
   * // Without widthPercentage, flex columns share space equally (flex-grow: 1)
   * { accessorKey: 'name' }  // Equal share
   * { accessorKey: 'email' } // Equal share
   */
  widthPercentage?: number

  /**
   * Controls whether this column is included in global search/filter
   * When false, this column's values will not be searched when using the search feature
   * @defaultValue true
   * @example
   * // Exclude internal ID column from search
   * { accessorKey: 'internalId', header: 'ID', enableSearching: false }
   */
  enableSearching?: boolean

  /**
   * Summary/aggregate configuration for this column
   * Enables automatic calculation of aggregates for group summaries and grand totals
   * @example
   * // Sum with currency formatting
   * summary: {
   *   aggregate: 'sum',
   *   format: (value) => `$${value.toFixed(2)}`
   * }
   * @example
   * // Average with label
   * summary: {
   *   aggregate: 'avg',
   *   format: (value) => value.toFixed(1),
   *   label: 'Avg: '
   * }
   * @example
   * // Custom aggregate function
   * summary: {
   *   aggregate: (rows) => rows.filter(r => r.active).length,
   *   format: (value) => `${value} active`
   * }
   */
  summary?: NuGridColumnSummary
}
