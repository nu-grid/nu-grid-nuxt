/**
 * @internal
 */

// =============================================================================
// INTERNAL TYPES (organized by domain)
// =============================================================================

export type { NuGridPresetOptions } from '../props'

// Action Menu
export type {
  NuGridActionMenuButton,
  NuGridActionMenuColumnDef,
  NuGridActionMenuColumnMeta,
} from './action-menu'

// Cell Editing
export type {
  NuGridCellEditing,
  NuGridEditingCell,
  NuGridEditorConfig,
  NuGridEditorRenderContext,
  NuGridRowValidationError,
} from './cell-editing'

// Composable Return Types (solves TS4058 errors)
export type {
  UseNuGridActionMenuReturn,
  UseNuGridColumnsReturn,
  UseNuGridRowSelectionReturn,
} from './composable-returns'

// Config
export type { NuGridConfig, NuGridUISlots } from './config'

// Re-export contexts barrel for convenience
export * from './contexts'

export type {
  NuGridAddRowContext,
  NuGridAddRowPosition,
  NuGridAddRowState,
} from './contexts/add-row'

export type { NuGridAnimationContext } from './contexts/animation'
export type { NuGridCoreContext } from './contexts/core'

export type { NuGridDragContext } from './contexts/drag'

export type { NuGridFocusContext } from './contexts/focus'

export type { NuGridGroupingContext } from './contexts/grouping'

export type { NuGridInteractionRouterContext } from './contexts/interaction-router'

export type { NuGridMultiRowContext } from './contexts/multi-row'

export type { NuGridPagingContext } from './contexts/paging'

// =============================================================================
// CONTEXT TYPES (inject/provide plumbing)
// =============================================================================

export type { NuGridPerformanceContext } from './contexts/performance'
export type { NuGridResizeContext } from './contexts/resize'
export type { NuGridRowInteractionsContext } from './contexts/row-interactions'
export type { NuGridScrollStateContext } from './contexts/scroll-state'
export type { NuGridUIConfigContext } from './contexts/ui-config'
export type { NuGridVirtualizationContext } from './contexts/virtualization'
// Drag & Drop
export type { NuGridColumnDragDrop, NuGridRowDragDrop } from './drag-drop'
// Focus
export type { NuGridFocus, NuGridFocusedCell } from './focus'
// Grouping
export type { NuGridGroupingFns } from './grouping'
export type {
  EventMetadata,
  NuGridCellClickContext,
  NuGridHoverContext,
  NuGridHoverHandler,
  NuGridInteractionHandler,
  NuGridInteractionRouter,
  NuGridInteractionRouteResult,
  NuGridKeyboardConfig,
  NuGridKeyboardContext,
  NuGridKeyboardHandler,
  NuGridPointerContext,
  NuGridPointerHandler,
  NuGridWheelContext,
  NuGridWheelHandler,
} from './interaction-router'
export { getEventFlag, hasEventFlag, ROUTER_PRIORITIES, setEventFlag } from './interaction-router'
// Props
export type { NuGridCreateConfigOptions, NuGridPreset } from './props'
// Resize
export type { NuGridColumnResize, PinnableHeader } from './resize'
// Row Interactions
export type { NuGridRowInteractions } from './row-interactions'
// Row Selection
export type {
  NuGridRowSelectionMode,
  NuGridSelectionColumnDef,
  NuGridSelectionColumnMeta,
} from './row-selection'

// States
export type { NuGridStates } from './states'

// =============================================================================
// INTERACTION ROUTER (event handling internals)
// =============================================================================

// Sticky Headers
export type { NuGridStickyHeaderClasses } from './sticky-headers'
// Validation
export type {
  NuGridResolvedValidation,
  NuGridRowValidationResult,
  NuGridRowValidationRule,
  NuGridValidationContext,
} from './validation'

// =============================================================================
// VIRTUALIZATION (virtual scrolling internals)
// =============================================================================

export type {
  GroupingVirtualRowHeights,
  GroupVirtualRowItem,
  GroupVirtualRowType,
  NuGridVirtualItemStyle,
  NuGridVirtualizer,
  NuGridVirtualizerOptions,
  OverscanSetting,
  ResolvedNuGridVirtualizeOptions,
} from './virtualization'
