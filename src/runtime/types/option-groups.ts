import type { TableData } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import type { Ref } from 'vue'
import type { NuGridEditorConfig } from './_internal'
import type { NuGridColumnMenuItemsCallback } from './column'
import type { NuGridScrollbars } from './props'
import type { NuGridSortIcon } from './sort-icon'

// Defaults are defined in nuGridDefaults (app/nugrid/options-defaults.ts); keep @defaultValue notes in sync.

/**
 * Focus and keyboard navigation configuration
 */
export interface NuGridFocusOptions {
  /**
   * Focus mode for grid navigation and interaction
   * - 'none': No focus behavior
   * - 'cell': Individual cell focus with keyboard navigation
   * - 'row': Row focus with keyboard navigation
   * @defaultValue 'none'
   */
  mode?: 'none' | 'cell' | 'row'

  /**
   * When enabled, the grid retains focus and responds to keyboard events even when
   * other elements on the page are clicked
   * @defaultValue false
   */
  retain?: boolean

  /**
   * Controls Cmd/Ctrl+Arrow key navigation behavior
   * - 'paging': Cmd+Up/Down act like PageUp/PageDown (cursor paging)
   * - 'firstlast': Cmd+Up/Down jump to first/last row in grid
   * @defaultValue 'paging'
   */
  cmdArrows?: 'paging' | 'firstlast'

  /**
   * Whether arrow key navigation should loop from last to first row and vice versa
   * @defaultValue false
   */
  loopNavigation?: boolean

  /**
   * Number of rows to skip when using Page Up/Down keys
   * @defaultValue 10
   */
  pageStep?: number

  /**
   * Alignment to use when the focused row is changed via the v-model:focused-row-id binding
   * (applies when no explicit align option is provided to focusRowById)
   * - 'nearest': Just makes the row visible (no sticky offset)
   * - 'top': Scrolls the row to the top, accounting for sticky headers
   * - 'center': Centers the row in the viewport, accounting for sticky headers
   * @defaultValue 'nearest'
   */
  alignOnModel?: 'nearest' | 'top' | 'center'

  /**
   * Automatically focus the first row/cell when data loads
   * @defaultValue false
   */
  autoFocus?: boolean

  /**
   * When enabled, the grid will scroll to keep the focused row visible after
   * the row set changes (e.g., when a global filter is applied or cleared).
   * Uses the `alignOnModel` alignment setting.
   * @defaultValue true
   */
  maintainFocusOnFilter?: boolean
}

/**
 * Cell editing configuration
 */
export interface NuGridEditingOptions<T extends TableData = TableData> {
  /**
   * Controls whether cell editing is enabled globally
   * @defaultValue false
   */
  enabled?: boolean

  /**
   * Which keyboard shortcuts can start editing mode
   * - 'all': All editing keys enabled (enter, f2, backspace, alpha, numeric)
   * - 'minimal': Only Enter and F2
   * - 'none': No keyboard shortcuts
   * - Array: Custom combination of keys
   * @defaultValue 'all'
   */
  startKeys?: 'all' | 'minimal' | 'none' | ('enter' | 'f2' | 'bs' | 'alpha' | 'numeric')[]

  /**
   * How clicking on a cell starts editing mode
   * - 'none': Clicking does not start editing
   * - 'single': Single click starts editing
   * - 'double': Double click starts editing
   * @defaultValue 'double'
   */
  startClicks?: 'none' | 'single' | 'double'

  /**
   * Debounce delay in milliseconds before committing value changes
   * @defaultValue 0
   */
  debounce?: number

  /**
   * Whether to commit changes when editor loses focus
   * @defaultValue true
   */
  commitOnBlur?: boolean

  /**
   * Grid-level guard function to determine if a cell can be edited
   * This provides a centralized place to define editing rules
   * @param row The row containing the cell
   * @param columnId The column identifier
   * @returns Whether the cell can be edited
   */
  canEdit?: (row: Row<T>, columnId: string) => boolean

  /**
   * Custom default editors for each cell data type
   * Allows overriding the built-in default editors
   */
  defaultEditors?: Record<string, NuGridEditorConfig>
}

/**
 * Selection column placement
 */
export type NuGridColumnPlacement = 'start' | 'end'

/**
 * Enhanced selection configuration
 */
export interface NuGridSelectionOptions<T extends TableData = TableData> {
  /**
   * Selection mode
   * - 'single': Single row selection
   * - 'multi': Multiple row selection
   * @defaultValue 'multi'
   */
  mode?: 'single' | 'multi'

  /**
   * Column placement
   * @defaultValue 'start'
   */
  placement?: NuGridColumnPlacement

  /**
   * Whether selection column is hidden
   * @defaultValue false
   */
  hidden?: boolean

  /**
   * Whether selection checkboxes are enabled
   * @defaultValue true
   */
  enabled?: boolean

  /**
   * Function to determine if a row can be selected
   */
  rowSelectionEnabled?: (row: Row<T>) => boolean

  /**
   * Callback for external state synchronization
   * @param selectedIds Array of selected row IDs
   */
  sync?: (selectedIds: string[]) => void

  /**
   * Advanced column definition options
   */
  columnDef?: any
}

/**
 * Actions column configuration
 */
export interface NuGridActionsOptions<T extends TableData = TableData> {
  /**
   * Whether actions column is enabled
   * @defaultValue false
   */
  enabled?: boolean

  /**
   * Function that returns action menu items for a row
   */
  getActions?: (row: Row<T>) => Array<{
    type?: 'label' | 'separator'
    label?: string
    icon?: string
    color?: 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'
    disabled?: boolean
    onSelect?: (event?: Event) => void
  }>

  /**
   * Column placement
   * @defaultValue 'end'
   */
  placement?: NuGridColumnPlacement

  /**
   * Function to determine if actions are enabled for a row
   * @defaultValue () => true
   */
  isRowEnabled?: (row: Row<T>) => boolean

  /**
   * Button configuration
   */
  button?: {
    icon?: string
    color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
    variant?: 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link'
    class?: string
  }

  /**
   * Whether actions column is hidden
   * @defaultValue false
   */
  hidden?: boolean

  /**
   * Advanced column definition options
   */
  columnDef?: any
}

/**
 * Column menu preset options
 */
export type NuGridColumnMenuPreset = 'minimal' | 'full'

/**
 * Column menu button configuration
 */
export interface NuGridColumnMenuButton {
  /**
   * Icon to display on the column menu button
   * @defaultValue 'i-lucide-more-vertical'
   */
  icon?: string
  /**
   * Button color
   * @defaultValue 'neutral'
   */
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  /**
   * Button variant
   * @defaultValue 'ghost'
   */
  variant?: 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link'
}

/**
 * Column menu configuration
 */
export interface NuGridColumnMenuOptions<T extends TableData = TableData> {
  /**
   * Preset configuration
   * - 'minimal': Basic menu with essential items
   * - 'full': Complete menu with all options
   */
  preset?: NuGridColumnMenuPreset

  /**
   * Custom menu items callback
   */
  items?: NuGridColumnMenuItemsCallback<T>

  /**
   * Whether to show column visibility toggle in menu
   * @defaultValue true
   */
  visibilityToggle?: boolean

  /**
   * Button configuration for the column menu trigger
   * @defaultValue { icon: 'i-lucide-more-vertical', color: 'neutral', variant: 'ghost' }
   */
  button?: NuGridColumnMenuButton
}

/**
 * Column defaults configuration
 * Default settings applied to all columns, can be overridden at the column level
 */
export interface NuGridColumnDefaultsOptions<T extends TableData = TableData> {
  /**
   * Default sort icon configuration for all columns
   * Can be overridden at the column level using column.sortIcons
   * @defaultValue { unsorted: 'i-lucide-chevrons-up-down', asc: 'i-lucide-arrow-up', desc: 'i-lucide-arrow-down', unsortedHover: true, position: 'edge' }
   */
  sortIcons?: NuGridSortIcon

  /**
   * Default column menu configuration
   * @defaultValue { visibilityToggle: true, button: { icon: 'i-lucide-more-vertical', color: 'neutral', variant: 'ghost' } }
   */
  menu?: NuGridColumnMenuOptions<T>

  /**
   * Enable column resizing by default
   * Can be overridden at the column level using enableResizing
   * @defaultValue false
   */
  resize?: boolean

  /**
   * Enable column reordering by default
   * Can be overridden at the column level using enableReordering
   * @defaultValue false
   */
  reorder?: boolean

  /**
   * Enable text wrapping by default for all columns
   * When true, cell content will wrap to multiple lines instead of being truncated
   * Can be overridden at the column level using wrapText
   * @defaultValue false
   */
  wrapText?: boolean

  /**
   * Default lookup configuration for all lookup cells
   * Can be overridden at the column level using lookup
   * @defaultValue { valueKey: 'value', labelKey: 'label', searchable: true, placeholder: 'Select...', clearable: false, autoOpen: true }
   */
  lookup?: Omit<NuGridLookupOptions, 'items'>
}

/**
 * Grid layout mode
 */
export type NuGridLayoutMode = 'div' | 'group' | 'splitgroup'

/**
 * Auto-size strategy
 * - 'fill': Columns fill container using CSS flex
 * - 'content': Columns size to cell content
 * - false: No auto-sizing
 */
export type NuGridAutoSizeStrategy = 'fill' | 'content' | false

/**
 * Column resize mode
 * - 'shift': Resizing a column shifts adjacent columns to maintain table width
 * - 'expand': Resizing a column expands/shrinks the table width
 */
export type NuGridResizeMode = 'shift' | 'expand'

/**
 * Layout and display configuration
 */
export interface NuGridLayoutOptions {
  /**
   * Grid rendering mode
   * - 'div': Render with divs (default)
   * - 'group': Grouped rows with headers at top
   * - 'splitgroup': Separate tables per group
   * @defaultValue 'div'
   */
  mode?: NuGridLayoutMode

  /**
   * Enable sticky headers
   * @defaultValue false
   */
  stickyHeaders?: boolean

  /**
   * Scrollbar styling mode
   * @defaultValue 'scroll'
   */
  scrollbars?: NuGridScrollbars

  /**
   * Auto-size strategy for columns
   * - 'fill': Columns fill container using CSS flex distribution.
   *   Use `grow: false` for fixed-width columns, `widthPercentage` for weighted distribution.
   *   Instant layout with no JavaScript measurement delay.
   * - 'content': Measure cell contents and set exact pixel widths.
   *   Ignores `grow` and `widthPercentage` settings.
   *   May cause visual flash on initial load due to measurement.
   * - false: No auto-sizing, columns use their defined `size` values.
   * @defaultValue 'fill'
   */
  autoSize?: NuGridAutoSizeStrategy

  /**
   * Column resize behavior
   * - 'shift': Resizing a column shifts adjacent columns to maintain table width (default)
   * - 'expand': Resizing a column expands/shrinks the table width
   *
   * With `autoSize: 'fill'` + `resizeMode: 'expand'`: Grid fills container initially,
   * but user can resize columns to expand beyond the container (enabling horizontal scroll).
   * @defaultValue 'shift'
   */
  resizeMode?: NuGridResizeMode
}

/**
 * State persistence parts
 */
export type NuGridStatePart =
  | 'filters'
  | 'sorting'
  | 'columnVisibility'
  | 'density'
  | 'columnOrder'
  | 'columnSizing'
  | 'pagination'
  | 'grouping'
  | 'expanded'

/**
 * Storage type for state persistence
 */
export type NuGridStorageType = 'local' | 'session'

/**
 * State persistence configuration
 */
export interface NuGridStateOptions {
  /**
   * Storage key identifier
   */
  key: string

  /**
   * Which state parts to persist
   * @defaultValue ['filters', 'sorting', 'columnVisibility', 'columnOrder', 'columnSizing']
   */
  parts?: NuGridStatePart[]

  /**
   * Storage type
   * @defaultValue 'local'
   */
  storage?: NuGridStorageType

  /**
   * Throttle delay in milliseconds for saving state
   * @defaultValue 300
   */
  throttleMs?: number

  /**
   * Callback when state changes
   * @param state Current state snapshot
   */
  onStateChange?: (state: any) => void

  /**
   * Initial state for SSR-friendly hydration
   */
  initialState?: any
}

/**
 * Multi-row configuration
 * Allows a single data item to span multiple visual rows
 */
export interface NuGridMultiRowOptions {
  /**
   * Whether multi-row mode is enabled
   * When enabled, columns can specify which row they appear on using the `row` property
   * @defaultValue false
   */
  enabled?: boolean

  /**
   * Number of visual rows per data item
   * Must be >= 1. Columns without a `row` property default to row 0
   * @defaultValue 1
   */
  rowCount?: number

  /**
   * Whether columns in extra rows should align with columns in row 0
   * When enabled, columns in rows 1+ will match the widths of corresponding row 0 columns
   * Columns can use the `span` property to span multiple column slots
   * Pinned columns in row 0 will have spacer columns below them
   * @defaultValue false
   */
  alignColumns?: boolean
}

/**
 * Tooltip configuration
 */
export interface NuGridTooltipOptions {
  /**
   * Whether tooltips only show for truncated content
   * When true, tooltips only appear when text is cut off
   * When false, tooltips show for all cells regardless of truncation
   * @defaultValue true
   */
  truncatedOnly?: boolean

  /**
   * Delay in milliseconds before showing the tooltip (initial appearance)
   * @defaultValue 2000
   */
  showDelay?: number

  /**
   * Delay in milliseconds before showing tooltip when moving between cells
   * Used when a tooltip was recently visible, for faster discovery
   * @defaultValue 500
   */
  switchDelay?: number

  /**
   * Delay in milliseconds before hiding the tooltip
   * Helps prevent flicker when moving between cells
   * @defaultValue 100
   */
  hideDelay?: number

  /**
   * Whether the tooltip follows the mouse cursor
   * When false, tooltip stays at initial position
   * @defaultValue false
   */
  mouseFollow?: boolean
}

/**
 * Lookup item type for dropdown selections
 */
export interface NuGridLookupItem {
  [key: string]: any
}

/**
 * Lookup/dropdown configuration for cells using cellDataType: 'lookup'
 * Provides a dropdown selection interface using Nuxt UI's SelectMenu
 */
export interface NuGridLookupOptions {
  /**
   * Items to display in the dropdown
   * Can be a static array, reactive ref, or async function that returns items
   */
  items: NuGridLookupItem[] | Ref<NuGridLookupItem[]> | (() => Promise<NuGridLookupItem[]>)

  /**
   * Field to use as the stored value (what gets saved to the data)
   * @defaultValue 'value'
   */
  valueKey?: string

  /**
   * Field to use as the display label (what the user sees)
   * @defaultValue 'label'
   */
  labelKey?: string

  /**
   * Field to use for item description (shown below label in dropdown)
   */
  descriptionKey?: string

  /**
   * Show search/filter input in dropdown
   * @defaultValue true
   */
  searchable?: boolean

  /**
   * Fields to search against when filtering
   * Defaults to [labelKey] if not specified
   */
  filterFields?: string[]

  /**
   * Placeholder text when no selection
   * @defaultValue 'Select...'
   */
  placeholder?: string

  /**
   * Icon to show (leading icon in trigger)
   */
  icon?: string

  /**
   * Show clear button to reset selection
   * @defaultValue false
   */
  clearable?: boolean

  /**
   * Automatically open dropdown when ArrowDown is pressed
   * @defaultValue true
   */
  autoOpen?: boolean
}

/**
 * Paging configuration
 * Controls client-side or server-side paging with built-in UI panel
 */
export interface NuGridPagingOptions {
  /**
   * Whether paging is enabled
   * @defaultValue false
   */
  enabled?: boolean

  /**
   * Number of rows to display per page
   * If autoPageSize is true, this is used as a fallback/initial value
   * @defaultValue 20
   */
  pageSize?: number

  /**
   * Page size selector options
   * - Array of numbers: Custom page size options for the dropdown
   * - true: Show default options [10, 20, 50, 100]
   * - false: Hide the page size selector
   * @defaultValue [10, 20, 50, 100]
   */
  pageSizeSelector?: number[] | boolean

  /**
   * Automatically calculate page size based on container height
   * When enabled, the grid will fit as many rows as possible in the available space
   * @defaultValue false
   */
  autoPageSize?: boolean

  /**
   * Minimum page size when autoPageSize is enabled
   * Ensures the calculated page size never falls below this value
   * @defaultValue 5
   */
  autoPageSizeMinimum?: number

  /**
   * Hide the built-in paging panel
   * Use this when you want to render your own paging controls
   * The paging logic still works, you just control the UI via the #paging slot or external controls
   * @defaultValue false
   */
  suppressPanel?: boolean

  /**
   * Enable server-side (manual) pagination
   * When true, the grid expects paginated data from the server and won't slice the data itself.
   * You must provide `rowCount` with the total number of rows from the server.
   * Listen to the `pageChanged` event to fetch new data when the page changes.
   * @defaultValue false
   */
  manualPagination?: boolean

  /**
   * Total row count from the server (required when manualPagination is true)
   * Used to calculate total pages and display correct pagination info.
   * This should be updated when the server returns new data with updated counts.
   */
  rowCount?: number
}

/**
 * Available animation presets
 * - 'refresh': Subtle fade + small translate (default)
 * - 'fade': Simple opacity transition
 * - 'slide': Slide up from below
 * - 'scale': Subtle scale + fade
 */
export type NuGridAnimationPreset = 'refresh' | 'fade' | 'slide' | 'scale'

/**
 * Row animation configuration
 * Controls animations for row transitions after sorting, filtering, and other data changes
 */
export interface NuGridAnimationOptions {
  /**
   * Whether row animations are enabled
   * @defaultValue false
   */
  enabled?: boolean

  /**
   * Animation preset to use
   * - 'refresh': Subtle fade + small translate (default)
   * - 'fade': Simple opacity transition
   * - 'slide': Slide up from below
   * - 'scale': Subtle scale + fade
   * @defaultValue 'refresh'
   */
  preset?: NuGridAnimationPreset

  /**
   * Animation duration in milliseconds
   * @defaultValue 300
   */
  duration?: number

  /**
   * CSS easing function for animations
   * @defaultValue 'ease-out'
   */
  easing?: string

  /**
   * Delay between each row's animation start (creates wave effect)
   * @defaultValue 15
   */
  stagger?: number

  /**
   * Maximum total stagger delay across all rows
   * Prevents long delays when animating many rows
   * @defaultValue 120
   */
  maxStagger?: number
}

/**
 * Excel export configuration options
 */
export interface NuGridExcelExportOptions {
  /**
   * Filename for the exported file (without extension)
   * @defaultValue 'export'
   */
  filename?: string

  /**
   * Sheet name in the Excel file
   * @defaultValue 'Sheet1'
   */
  sheetName?: string

  /**
   * Whether to include column headers
   * @defaultValue true
   */
  includeHeaders?: boolean

  /**
   * Whether to only export visible columns
   * @defaultValue true
   */
  visibleColumnsOnly?: boolean

  /**
   * Custom column widths by column ID
   */
  columnWidths?: Record<string, number>

  /**
   * Whether to include group header rows (for grouped exports)
   * @defaultValue true
   */
  includeGroupHeaders?: boolean

  /**
   * Indent for grouped data (number of spaces)
   * @defaultValue 2
   */
  groupIndent?: number

  /**
   * Format string for group headers
   * Available placeholders: {groupName}, {groupValue}, {count}
   * @defaultValue '{groupName}: {groupValue} ({count})'
   */
  groupHeaderFormat?: string
}

/**
 * Search/filter configuration
 * Controls the search-as-you-type feature with debounced filtering
 */
export interface NuGridSearchOptions {
  /**
   * Whether search is enabled
   * @defaultValue false
   */
  enabled?: boolean

  /**
   * Placeholder text for the search input
   * @defaultValue 'Search...'
   */
  placeholder?: string

  /**
   * Debounce delay in milliseconds before filtering
   * @defaultValue 300
   */
  debounce?: number

  /**
   * Whether to auto-focus the search input on mount
   * @defaultValue false
   */
  autofocus?: boolean

  /**
   * Whether to show the clear button
   * @defaultValue true
   */
  clearable?: boolean

  /**
   * Icon to display in the search input
   * @defaultValue 'i-lucide-search'
   */
  icon?: string

  /**
   * Icon for the clear button
   * @defaultValue 'i-lucide-x'
   */
  clearIcon?: string

  /**
   * Hide the built-in search panel
   * Use this when you want to render your own search controls
   * The search logic still works via v-model:global-filter
   * @defaultValue false
   */
  suppressPanel?: boolean

  /**
   * Enable type-to-search behavior
   * When true, typing while the grid is focused (but not editing) will start filtering
   * @defaultValue true
   */
  typeToSearch?: boolean

  /**
   * Automatically focus the first matching cell/row when search results change
   * Set to true if you want the grid to take focus when results are found
   * Set to false (default) to keep focus in the search input
   * @defaultValue false
   */
  focusOnResults?: boolean

  /**
   * Highlight color for matching text in cells
   * - 'primary': Uses the app's primary color (default)
   * - 'yellow': Classic yellow highlight
   * - 'green': Green highlight
   * - 'blue': Blue highlight
   * - 'orange': Orange highlight
   * - 'red': Red highlight
   * - Custom string: Any valid Tailwind classes for custom styling
   * @defaultValue 'primary'
   */
  highlightColor?: 'primary' | 'yellow' | 'green' | 'blue' | 'orange' | 'red' | string
}

/**
 * Grand totals footer configuration
 */
export interface NuGridGrandTotalsConfig {
  /**
   * Whether grand totals are enabled
   * @defaultValue true (when used as object)
   */
  enabled?: boolean

  /**
   * Position of the grand totals row
   * @defaultValue 'bottom'
   */
  position?: 'top' | 'bottom'

  /**
   * Label to show in the first column of the grand totals row
   * @defaultValue 'Total'
   */
  label?: string
}

/**
 * Summary/footer configuration for the grid
 * Controls group summaries and grand totals display
 */
export interface NuGridSummaryOptions {
  /**
   * Show grand totals row at the bottom (or top) of the grid
   * - true: Enable grand totals with default settings
   * - false: Disable grand totals
   * - Object: Enable with custom configuration
   * @defaultValue false
   * @example
   * // Simple enable
   * grandTotals: true
   *
   * @example
   * // Custom configuration
   * grandTotals: {
   *   position: 'bottom',
   *   label: 'Grand Total'
   * }
   */
  grandTotals?: boolean | NuGridGrandTotalsConfig

  /**
   * Show calculated summary values in collapsed group rows
   * When true and columns have `summary` config, the collapsed group row
   * shows actual aggregate values instead of placeholder text
   * @defaultValue true (when any column has summary config)
   */
  groupSummaries?: boolean
}
