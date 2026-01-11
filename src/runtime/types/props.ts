import type { TableData, TableProps } from '@nuxt/ui'
import type { RowDragOptions } from '../composables/_internal/useNuGridRowDragDrop'
import type { NuGridConfig, NuGridPreset, NuGridVirtualizerOptions } from './_internal'
import type { NuGridCellType } from './cells'
import type {
  NuGridActionsOptions,
  NuGridAnimationOptions,
  NuGridColumnDefaultsOptions,
  NuGridEditingOptions,
  NuGridFocusOptions,
  NuGridLayoutOptions,
  NuGridMultiRowOptions,
  NuGridPagingOptions,
  NuGridSelectionOptions,
  NuGridStateOptions,
  NuGridTooltipOptions,
} from './option-groups'
import type { NuGridTheme } from './theme'
import type { NuGridValidationOptions } from './validation'

/**
 * Scrollbar styling modes for NuGrid
 * - 'native': Browser default scrollbar behavior
 * - 'hover': Show styled scrollbar on hover
 * - 'scroll': Show styled scrollbar when scrolling (macOS-like)
 */
export type NuGridScrollbars = 'native' | 'hover' | 'scroll'

/**
 * NuGrid props interface extending TableProps with additional grid-specific options
 * - Omits the base virtualize flag in favor of the grouped `virtualization` config
 * - Omits 'state' to avoid conflict with new NuGrid state persistence config
 */
export interface NuGridProps<T extends TableData = TableData> extends Omit<
  TableProps<T>,
  'virtualize' | 'state'
> {
  ui?: NuGridConfig['slots']

  /**
   * Preset configuration to quickly setup common grid behaviors
   * Presets hydrate sensible defaults for focus, editing, selection, validation, etc.
   * - 'readOnly': Read-only grid with basic navigation
   * - 'editable': Editable grid with validation and editing features
   * - 'kanban': Kanban-style grid with drag-and-drop
   * - 'forms': Form-like grid optimized for data entry
   * - 'analytics': Analytics-focused grid with virtualization
   * @defaultValue undefined
   *
   * @example
   * // Quick setup with preset
   * <NuGrid preset="editable" :data="data" :columns="columns" />
   *
   * @example
   * // Preset with overrides
   * <NuGrid
   *   preset="editable"
   *   :focus="{ retain: false }"
   *   :editing="{ startClicks: 'single' }"
   * />
   */
  preset?: NuGridPreset

  /**
   * Focus and keyboard navigation configuration
   * Groups focus-related settings for cleaner API surface
   *
   * @example
   * // Enable cell focus with paging navigation
   * focus: {
   *   mode: 'cell',
   *   retain: true,
   *   cmdArrows: 'paging',
   *   loopNavigation: false
   * }
   */
  focus?: NuGridFocusOptions

  /**
   * Cell editing configuration
   * Groups editing-related settings including start triggers and behaviors
   *
   * @example
   * // Enable editing with custom triggers
   * editing: {
   *   enabled: true,
   *   startKeys: 'minimal',
   *   startClicks: 'single',
   *   commitOnBlur: true,
   *   canEdit: (row, columnId) => row.original.status !== 'locked'
   * }
   */
  editing?: NuGridEditingOptions<T>

  /**
   * Enhanced validation configuration
   * Supports schema validation, row rules, and flexible validation modes
   *
   * @example
   * // Basic validation with schema
   * validation: {
   *   schema: myZodSchema,
   *   trigger: 'submit',
   *   mode: 'block'
   * }
   *
   * @example
   * // With row-level rules
   * validation: {
   *   schema: mySchema,
   *   rowRules: [(row) => ({
   *     valid: row.startDate < row.endDate,
   *     message: 'End date must be after start date',
   *     failedFields: ['endDate']
   *   })],
   *   trigger: 'blur',
   *   mode: 'warn'
   * }
   */
  validation?: false | NuGridValidationOptions<T>

  /**
   * Enhanced selection configuration
   * Provides preset-based setup with sync callback for external state
   *
   * @example
   * // Multi-select with sync callback
   * selection: {
   *   mode: 'multi',
   *   placement: 'start',
   *   sync: (ids) => { selectedIds.value = ids }
   * }
   *
   * @example
   * // Single select with conditional enabling
   * selection: {
   *   mode: 'single',
   *   rowSelectionEnabled: (row) => row.original.selectable
   * }
   */
  selection?: false | 'single' | 'multi' | NuGridSelectionOptions<T>

  /**
   * Actions column configuration
   * Simplified API with placement options and defaults to hidden when no getActions provided
   *
   * @example
   * // Basic actions at end
   * actions: {
   *   getActions: (row) => [
   *     { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => edit(row) }
   *   ]
   * }
   *
   * @example
   * // Actions at start with conditional enable
   * actions: {
   *   placement: 'start',
   *   getActions: (row) => [...],
   *   actionsEnabled: (row) => row.original.status !== 'archived'
   * }
   */
  actions?: false | NuGridActionsOptions<T>

  /**
   * Column defaults configuration
   * Default settings applied to all columns, can be overridden at the column level
   *
   * @example
   * // Configure column defaults
   * columnDefaults: {
   *   sortIcons: {
   *     unsorted: 'i-lucide-chevrons-up-down',
   *     asc: 'i-lucide-arrow-up-narrow-wide',
   *     desc: 'i-lucide-arrow-down-wide-narrow'
   *   },
   *   menu: {
   *     visibilityToggle: true,
   *     button: { icon: 'i-lucide-settings' }
   *   },
   *   resize: true,
   *   reorder: true
   * }
   */
  columnDefaults?: NuGridColumnDefaultsOptions<T>

  /**
   * Layout and display configuration
   * Groups layout-related settings for consistent theming and display
   *
   * @example
   * // Grouped layout with sticky headers
   * layout: {
   *   mode: 'group',
   *   stickyHeaders: true,
   *   scrollbars: 'scroll',
   *   autoSize: 'fitGrid'
   * }
   */
  layout?: NuGridLayoutOptions

  /**
   * Tooltip configuration
   * Controls tooltip behavior for cells and headers
   *
   * @example
   * // Enable tooltips for all cells with mouse follow
   * tooltip: {
   *   truncatedOnly: false,
   *   mouseFollow: true,
   *   showDelay: 300
   * }
   *
   * @example
   * // Disable tooltips entirely
   * tooltip: false
   */
  tooltip?: false | NuGridTooltipOptions

  /**
   * Multi-row configuration
   * Allows a single data item to span multiple visual rows
   * Each column can specify which row it appears on using the `row` property
   *
   * @example
   * // Enable multi-row with 2 rows per data item
   * multiRow: {
   *   enabled: true,
   *   rowCount: 2
   * }
   *
   * @example
   * // Columns specify their row
   * columns: [
   *   { accessorKey: 'name', header: 'Name', row: 0 },
   *   { accessorKey: 'email', header: 'Email', row: 0 },
   *   { accessorKey: 'bio', header: 'Bio', row: 1 }
   * ]
   */
  multiRow?: false | NuGridMultiRowOptions

  /**
   * Row animation configuration
   * Controls animations for row transitions after sorting, filtering, and other data changes
   * Similar to AG Grid's row animations, but disabled by default for performance
   *
   * @example
   * // Enable animations with default settings
   * animation: {
   *   enabled: true
   * }
   *
   * @example
   * // Custom animation timing
   * animation: {
   *   enabled: true,
   *   duration: 400,
   *   easing: 'ease-in-out'
   * }
   */
  animation?: false | NuGridAnimationOptions

  /**
   * Paging configuration
   * Controls client-side pagination with built-in UI panel
   * Similar to AG Grid's pagination feature
   *
   * Note: Named 'paging' to avoid conflict with TanStack's pagination state v-model
   *
   * @example
   * // Enable with defaults
   * paging: true
   *
   * @example
   * // Custom page size
   * paging: {
   *   pageSize: 25,
   *   pageSizeSelector: [10, 25, 50, 100]
   * }
   *
   * @example
   * // Auto-fit rows to container height
   * paging: {
   *   autoPageSize: true
   * }
   *
   * @example
   * // Hide built-in panel (use custom controls)
   * paging: {
   *   suppressPanel: true
   * }
   */
  paging?: boolean | NuGridPagingOptions

  /**
   * State persistence configuration
   * Enhanced with granular control over persisted parts and storage type
   *
   * @example
   * // Persist filters and sorting to localStorage
   * state: {
   *   key: 'my-grid-state',
   *   parts: ['filters', 'sorting'],
   *   storage: 'local',
   *   throttleMs: 500
   * }
   *
   * @example
   * // With state change callback
   * state: {
   *   key: 'my-grid',
   *   parts: ['filters', 'sorting', 'columnVisibility'],
   *   onStateChange: (state) => console.log('State changed', state)
   * }
   */
  state?: false | NuGridStateOptions

  /**
   * Theme preset for the grid
   * Built-in themes:
   * - 'default': Standard NuGrid theme with primary color accents and comfortable spacing
   * - 'compact': Compact theme with blue accents and tighter spacing for data-dense displays
   *
   * Custom themes can be registered via registerTheme() or app config
   * @defaultValue 'default'
   *
   * @example
   * // Use built-in theme
   * <NuGrid theme="compact" :data="data" :columns="columns" />
   *
   * @example
   * // Use custom registered theme
   * <NuGrid theme="ocean" :data="data" :columns="columns" />
   */
  theme?: NuGridTheme

  /**
   * Enable virtualization for large datasets with extended configuration options.
   * When `gridMode` is 'group', additional `rowHeights` can be configured.
   * Use `enabled: true` (or `virtualization: true`) to turn it on.
   * @defaultValue { enabled: false, estimateSize: 65, overscan: 12, dynamicRowHeights: true }
   *
   * @example
   * // Simple boolean to enable with defaults
   * virtualization: true
   *
   * @example
   * // Configure virtualization options
   * virtualization: {
   *   estimateSize: 80,
   *   overscan: 10,
   *   overscanByBreakpoint: { default: 12, sm: 8, lg: 18 },
   *   rowHeights: {
   *     groupHeader: 60,
   *     columnHeader: 45,
   *     dataRow: 100,
   *     footer: 50
   *   }
   * }
   */
  virtualization?: boolean | NuGridVirtualizerOptions

  /**
   * Custom cell types for extending column behavior
   * Allows defining custom cell types with their own editors, renderers, filters, validation, and keyboard handling
   * Custom types override built-in types with the same name, and new types are added to the registry
   * @example
   * // Rating cell type with editor, keyboard handler, and validation
   * cellTypes: [
   *   {
   *     name: 'rating',
   *     displayName: 'Rating',
   *     editor: RatingEditor,
   *     renderer: RatingRenderer,
   *     keyboardHandler: (event, context) => {
   *       if (event.key >= '1' && event.key <= '5' && context.isFocused && context.canEdit) {
   *         const newValue = parseInt(event.key)
   *         context.emitChange(context.getValue(), newValue)
   *         return { handled: true, preventDefault: true }
   *       }
   *       return { handled: false }
   *     },
   *     validation: (value) => ({
   *       valid: value >= 1 && value <= 5,
   *       message: 'Rating must be between 1 and 5'
   *     })
   *   }
   * ]
   *
   * @see NuGridCellType interface for full capabilities
   * @see CELL_TYPE_GUIDE.md for detailed documentation
   */
  cellTypes?: NuGridCellType<T>[]

  /**
   * Columns to skip when autosizing
   * Provide an array of column IDs that should not be auto-sized
   * @defaultValue []
   */
  skipAutoSizeColumns?: string[]

  /**
   * Row dragging configuration
   * Enables drag and drop reordering of rows
   * @defaultValue undefined
   */
  rowDragOptions?: RowDragOptions

  /**
   * Row identity field or function
   * Used for stable row tracking during sorting, filtering, and animations
   * - String: Field name to use as row ID (e.g., 'id', 'userId', '_id')
   * - Function: Custom function to generate row ID from row data
   * @defaultValue 'id'
   *
   * @example
   * // Use a different field as row ID
   * rowId: 'uuid'
   *
   * @example
   * // Custom function for composite keys
   * rowId: (row) => `${row.type}-${row.id}`
   */
  rowId?: string | ((row: T) => string)

  /**
   * Add new item row configuration
   * - true: Enable add new row at bottom (default position)
   * - false: Disable add new row
   * - object: Configure add new row with position and text
   *   - position: 'none' | 'top' | 'bottom' - Where to display the add new row
   *   - addNewText: Text to display in idle state (default: 'Click here to add')
   * @defaultValue undefined
   *
   * @example
   * // Simple boolean to enable at bottom
   * addNewRow: true
   *
   * @example
   * // Configure position and text
   * addNewRow: {
   *   position: 'bottom',
   *   addNewText: 'Add new item...'
   * }
   */
  addNewRow?: boolean | { position: 'none' | 'top' | 'bottom'; addNewText?: string }
}

/**
 * Preset options configuration
 * Configuration options that can be set via presets
 */
export type NuGridPresetOptions<T extends TableData = TableData> = Partial<
  Pick<NuGridProps<T>, 'focus' | 'editing' | 'layout' | 'validation' | 'virtualization'>
>
