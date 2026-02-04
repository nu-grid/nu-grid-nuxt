// Reference module augmentation to ensure TanStack Table types are extended
/// <reference path="./tanstack-table.d.ts" />

// ============================================================================
// PUBLIC API TYPES
// These types are part of the stable public API for nu-grid users.
// ============================================================================

// Add Row (public types re-exported from internal location)
export type { NuGridAddRowFinalizeResult, NuGridAddRowState } from './_internal/contexts/add-row'

// Action Menu (public types only)
export type { NuGridActionMenuItem, NuGridActionMenuOptions } from './action-menu'

// Autosize
export type { NuGridAutosize } from './autosize'

// Cell Types System (public API for custom cell types and editors)
// Import from '#nu-grid/cells' for creating custom cell types
export type {
  // Cell editor types
  NuGridCellEditorEmits,
  NuGridCellEditorProps,
  // Cell type system types
  NuGridCellRenderContext,
  NuGridCellType,
  NuGridCellTypeContext,
  NuGridCellTypeKeyboardResult,
  NuGridFilterConfig,
  NuGridFilterContext,
  NuGridFilterOperator,
  NuGridRendererConfig,
  NuGridValidationResult,
} from './cells'

// Column
export type { NuGridColumn, NuGridColumnMenuItem, NuGridColumnMenuItemsCallback } from './column'

// Drag and Drop
export type { RowDragEvent } from './drag-drop'

// Events
export type {
  NUGRID_EVENTS_KEY,
  // Click events
  NuGridCellClickEvent,
  // Editing lifecycle events
  NuGridCellEditingCancelledEvent,
  NuGridCellEditingStartedEvent,
  NuGridCellValueChangedEvent,
  // Event emitter
  NuGridEventEmitter,
  // State change events
  NuGridFilterChangedEvent,
  NuGridPageChangedEvent,
  // Focus events
  NuGridFocusedCellChangedEvent,
  NuGridFocusedRowChangedEvent,
  // Keyboard events
  NuGridKeydownEvent,
  NuGridRowClickEvent,
  NuGridSortChangedEvent,
} from './events'

// Grouping
export type { NuGridGroupingOptions } from './grouping'

// Option Groups
export type {
  NuGridActionsOptions,
  NuGridAnimationOptions,
  NuGridAnimationPreset,
  NuGridAutoSizeStrategy,
  NuGridColumnMenuOptions,
  NuGridColumnMenuPreset,
  NuGridColumnPlacement,
  NuGridEditingOptions,
  NuGridExcelExportOptions,
  NuGridFocusOptions,
  NuGridLayoutMode,
  NuGridLayoutOptions,
  NuGridLookupItem,
  NuGridLookupOptions,
  NuGridMultiRowOptions,
  NuGridPagingOptions,
  NuGridResizeMode,
  NuGridSearchOptions,
  NuGridSelectionOptions,
  NuGridStateOptions,
  NuGridStatePart,
  NuGridStorageType,
  NuGridTooltipOptions,
} from './option-groups'

// Props
export type { NuGridProps, NuGridScrollbars } from './props'

// Row
export type { NuGridRow } from './row'

// Row Selection (public types only)
export type { NuGridRowSelectOptions } from './row-selection'

// Slots
export type { NuGridCellSlotProps } from './slots'

// Sort Icon
export type { NuGridSortIcon } from './sort-icon'

// Theme
export type { NuGridTheme, NuGridThemeDefinition } from './theme'

// Validation (public types only)
export type {
  NuGridOnInvalid,
  NuGridShowErrors,
  NuGridValidateOn,
  NuGridValidationOptions,
} from './validation'

// TanStack Table State Types (re-exported for convenience)
// These are used in NuGridStateSnapshot and various v-models
export type {
  ColumnFiltersState,
  ColumnPinningState,
  PaginationState,
  RowSelectionState,
  SortingState,
} from '@tanstack/vue-table'
