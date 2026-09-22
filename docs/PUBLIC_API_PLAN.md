# NuGrid Public API Reference

## Status: Implementation Complete

This document tracks the public vs internal API for nu-grid.

---

## Internal Types Reorganization (Completed)

All internal types have been moved to `types/_internal/` subdirectories with organized barrel exports.

### Structure

```
src/runtime/types/
├── _internal/
│   ├── index.ts              # Main barrel - exports all internal types
│   ├── action-menu.ts        # NuGridActionMenuButton, NuGridActionMenuColumnDef, etc.
│   ├── cell-editing.ts       # NuGridCellEditing, NuGridEditingCell, etc.
│   ├── config.ts             # NuGridConfig, NuGridUISlots
│   ├── drag-drop.ts          # NuGridColumnDragDrop, NuGridRowDragDrop
│   ├── focus.ts              # NuGridFocus, NuGridFocusedCell
│   ├── grouping.ts           # NuGridGroupingFns
│   ├── props.ts              # NuGridPreset, NuGridCreateConfigOptions
│   ├── resize.ts             # NuGridColumnResize
│   ├── row-interactions.ts   # NuGridRowInteractions
│   ├── row-selection.ts      # NuGridSelectionColumnDef, NuGridRowSelectionMode
│   ├── states.ts             # NuGridStates
│   ├── sticky-headers.ts     # NuGridStickyHeaderClasses
│   ├── validation.ts         # NuGridValidationContext, NuGridRowValidationRule
│   ├── interaction-router.ts # Router types and utilities
│   ├── virtualization.ts     # Virtualizer types
│   └── contexts/             # All context types for inject/provide
├── props.ts                  # Public props (NuGridProps, NuGridPresetOptions)
├── action-menu.ts            # Public action menu types
├── cell-editing.ts           # Public cell editor types
├── validation.ts             # Public validation types
└── ...                       # Other public type files
```

### Import Pattern

Internal code imports from the `_internal` barrel:

```typescript
import type { NuGridCellEditing, NuGridFocus, NuGridInteractionRouter } from '../types/_internal'
```

Public types import internal dependencies from `_internal`:

```typescript
// In public cell-editing.ts
import type { NuGridEditorRenderContext, NuGridInteractionRouter } from './_internal'
```

---

## Type Renames Completed

| Old Name                    | New Name                     | Status                  |
| --------------------------- | ---------------------------- | ----------------------- |
| `SortIconConfig`            | `NuGridSortIcon`             | ✅ Done                 |
| `RowSelectionOptions`       | `NuGridRowSelectOptions`     | ✅ Done                 |
| `ActionMenuItem`            | `NuGridActionMenuItem`       | ✅ Done                 |
| `ActionMenuOptions`         | `NuGridActionMenuOptions`    | ✅ Done                 |
| `FocusedCell`               | `NuGridFocusedCell`          | ✅ Done (now @internal) |
| `EditingCell`               | `NuGridEditingCell`          | ✅ Done (now @internal) |
| `ActionMenuButton`          | `NuGridActionMenuButton`     | ✅ Done (@internal)     |
| `ActionMenuColumnDef`       | `NuGridActionMenuColumnDef`  | ✅ Done (@internal)     |
| `ActionMenuColumnMeta`      | `NuGridActionMenuColumnMeta` | ✅ Done (@internal)     |
| `SelectionColumnDef`        | `NuGridSelectionColumnDef`   | ✅ Done (@internal)     |
| `SelectionColumnMeta`       | `NuGridSelectionColumnMeta`  | ✅ Done (@internal)     |
| `RowSelectionMode`          | `NuGridRowSelectionMode`     | ✅ Done (@internal)     |
| `CreateNuGridConfigOptions` | `NuGridCreateConfigOptions`  | ✅ Done (@internal)     |
| `EditorRenderContext`       | `NuGridEditorRenderContext`  | ✅ Done (@internal)     |
| `RowValidationError`        | `NuGridRowValidationError`   | ✅ Done (@internal)     |
| `ValidationResult`          | `NuGridValidationResult`     | ✅ Done                 |
| `EditorConfig`              | `NuGridEditorConfig`         | ✅ Done (@internal)     |

**Note:** Playground demos updated to use new type names.

---

## Current Public Types

### Core Types (Essential)

- `NuGridColumn<T>` - Column definition
- `NuGridRow<T>` - Row type alias
- `NuGridProps<T>` - Component props
- `NuGridPresetOptions<T>` - Preset configuration options

### Cell Editor Types (Custom Editors)

- `NuGridCellEditorProps<T>` - Props passed to custom editors
- `NuGridCellEditorEmits` - Events emitted by custom editors

### Option Types (Grid Configuration)

- `NuGridAnimationOptions`, `NuGridAnimationPreset`
- `NuGridAutoSizeStrategy`
- `NuGridColumnMenuOptions`, `NuGridColumnMenuPreset`
- `NuGridEditingOptions`
- `NuGridFocusOptions`
- `NuGridGroupingOptions`
- `NuGridLayoutOptions`, `NuGridLayoutMode`
- `NuGridLookupOptions`, `NuGridLookupItem`
- `NuGridMultiRowOptions`
- `NuGridPagingOptions`
- `NuGridSelectionOptions`
- `NuGridStateOptions`, `NuGridStatePart`, `NuGridStorageType`
- `NuGridTooltipOptions`
- `NuGridValidationOptions`, `NuGridValidateOn`, `NuGridShowErrors`, `NuGridOnInvalid`
- `NuGridExcelExportOptions`

### Action Menu Types

- `NuGridActionMenuItem` - Menu item definition
- `NuGridActionMenuOptions<T>` - Action menu configuration

### Column Menu Types

- `NuGridColumnMenuItem<T>` - Column menu item
- `NuGridColumnMenuItemsCallback<T>` - Menu customization callback
- `NuGridColumnPlacement`

### Row Selection Types

- `NuGridRowSelectOptions<T>` - Selection configuration

### Sort Icons

- `NuGridSortIcon` - Sort icon configuration

### Add Row Types

- `NuGridAddRowState` - Add row form state
- `NuGridAddRowFinalizeResult` - Result from finalizing add row

### Theme Types

- `NuGridTheme`, `NuGridThemeDefinition`

### Other Public Types

- `NuGridAutosize` - Autosize configuration
- `NuGridScrollbars` - Scrollbar configuration
- `NuGridValidationResult` - Cell validation result

---

## Internal Types (in `_internal/`)

These types are now properly isolated in `types/_internal/` and exported only for internal use:

### Action Menu Internal

- `NuGridActionMenuButton` - Button styling
- `NuGridActionMenuColumnDef` - Action column definition
- `NuGridActionMenuColumnMeta` - Action column meta

### Row Selection Internal

- `NuGridSelectionColumnDef` - Selection column definition
- `NuGridSelectionColumnMeta` - Selection column meta
- `NuGridRowSelectionMode` - Selection mode union

### Cell Editing Internal

- `NuGridCellEditing<T>` - Composable return type
- `NuGridEditingCell` - Editing cell position
- `NuGridEditorConfig` - Editor configuration type
- `NuGridEditorRenderContext` - Editor render context
- `NuGridRowValidationError` - Row validation error

### Config Internal

- `NuGridConfig` - Config system
- `NuGridUISlots` - UI slots
- `NuGridPreset` - Preset union type
- `NuGridCreateConfigOptions` - Config factory options

### Composable Return Types

- `NuGridFocus<T>`, `NuGridFocusedCell` - Focus composable types
- `NuGridRowInteractions<T>` - Row interactions composable type
- `NuGridGroupingFns<T>` - Grouping composable type
- `NuGridStates` - Internal state management
- `NuGridColumnResize` - Resize composable type
- `NuGridColumnDragDrop`, `NuGridRowDragDrop` - Drag/drop composable types
- `NuGridStickyHeaderClasses` - Internal styling
- `NuGridResolvedValidation<T>`, `NuGridRowValidationResult`, `NuGridRowValidationRule<T>` - Validation internals
- `NuGridValidationContext` - Validation context
- `ColumnPinningControls` - Column pinning composable return type (now @internal)

### Context Types (inject/provide)

- `NuGridCoreContext`, `NuGridPerformanceContext`
- `NuGridAnimationContext`, `NuGridDragContext`
- `NuGridFocusContext`, `NuGridGroupingContext`
- `NuGridInteractionRouterContext`, `NuGridMultiRowContext`
- `NuGridPagingContext`, `NuGridResizeContext`
- `NuGridRowInteractionsContext`, `NuGridUIConfigContext`
- `NuGridVirtualizationContext`, `NuGridScrollStateContext`
- `NuGridAddRowContext`

### Interaction Router

- `EventMetadata`, `NuGridInteractionHandler`, `NuGridInteractionRouteResult`
- `NuGridPointerHandler`, `NuGridPointerContext`
- `NuGridKeyboardHandler`, `NuGridKeyboardContext`, `NuGridKeyboardConfig`
- `NuGridWheelHandler`, `NuGridWheelContext`
- `NuGridHoverHandler`, `NuGridHoverContext`
- `NuGridCellClickContext`
- `ROUTER_PRIORITIES`, `getEventFlag`, `hasEventFlag`, `setEventFlag`

### Virtualization

- `NuGridVirtualizer`, `NuGridVirtualizerOptions`
- `NuGridVirtualItemStyle`, `ResolvedNuGridVirtualizeOptions`
- `GroupVirtualRowItem`, `GroupVirtualRowType`, `GroupingVirtualRowHeights`
- `OverscanSetting`

### Cell Type System (Available from `#nu-grid/cells`)

Cell-related types and composables for creating custom cell types and editors are exported from `#nu-grid/cells`:

**Types:**
- `NuGridCellType<T>` - Cell type definition
- `NuGridCellEditorProps<T>` - Props for custom cell editors
- `NuGridCellEditorEmits` - Events for custom cell editors
- `NuGridCellRenderContext<T>` - Cell render context
- `NuGridCellTypeContext<T>` - Cell type context
- `NuGridCellTypeKeyboardResult` - Keyboard handling result
- `NuGridFilterConfig`, `NuGridFilterContext<T>`, `NuGridFilterOperator`
- `NuGridRendererConfig`
- `NuGridValidationResult`

**Composables:**
- `useNuGridCellEditor` - Keyboard/blur handling for custom cell editors
- `useNuGridCellTypeRegistry` - Register custom cell types

---

## Public Composables

| Composable                  | Purpose                                   | Status |
| --------------------------- | ----------------------------------------- | ------ |
| `useNuGridCellEditor`       | Custom cell editor keyboard/blur handling | Public |
| `useNuGridCellTypeRegistry` | Register custom cell types                | Public |

---

## Public Components

| Component             | Purpose                                                    |
| --------------------- | ---------------------------------------------------------- |
| `NuGrid`              | Main grid component                                        |
| `NuGridCellCheckbox`  | Checkbox for boolean cell values (use in custom editors)   |

---

## Component Methods (defineExpose)

The NuGrid component exposes methods via `defineExpose` that can be accessed through a template ref:

```vue
<template>
  <NuGrid ref="gridRef" :columns="columns" :data="data" />
</template>

<script setup>
const gridRef = ref(null)

// Access exposed methods
gridRef.value?.pinColumn('name', 'left')
</script>
```

### Exposed Methods

| Method                 | Signature                                               | Description                   |
| ---------------------- | ------------------------------------------------------- | ----------------------------- |
| `pinColumn`            | `(columnId: string, side: 'left' \| 'right') => void`   | Pin a column to left or right |
| `unpinColumn`          | `(columnId: string) => void`                            | Unpin a column                |
| `isPinned`             | `(columnId: string) => 'left' \| 'right' \| false`      | Check if column is pinned     |
| `getPinnedColumns`     | `() => { left: string[]; right: string[] }`             | Get all pinned column IDs     |
| `autoSizeColumns`      | `() => void`                                            | Auto-size all columns         |
| `autoSizeColumn`       | `(columnId: string) => void`                            | Auto-size a specific column   |
| `getState`             | `() => NuGridStateSnapshot`                             | Get current grid state        |
| `setState`             | `(state: NuGridStateSnapshot) => void`                  | Restore grid state            |
| `excelExport`          | `(options?: NuGridExcelExportOptions) => Promise<void>` | Export to Excel               |
| `getSelectedRows`      | `<T>() => T[]`                                          | Get selected row data         |
| `pagingGoToPage`       | `(page: number) => void`                                | Navigate to page              |
| `pagingGetCurrentPage` | `() => number`                                          | Get current page index        |
| `pagingGetPageSize`    | `() => number`                                          | Get page size                 |
| `pagingGetTotalPages`  | `() => number`                                          | Get total pages               |

---

## Public Utilities

From `#nu-grid`:

- `createColumnHelper<T>()` - Type-safe column definitions

---

## Public Themes

- `nuGridTheme`, `nuGridThemeCompact` - Built-in themes
- `createNuGridTheme()` - Custom theme creation
- `registerTheme()`, `getTheme()`, `getAllThemes()` - Registry functions

---

## Remaining Work

### Completed

- ✅ Update playground demos to use new type names
- ✅ Rename internal types with NuGrid prefix
- ✅ Add @internal JSDoc to internal types
- ✅ Move internal types to `_internal/` folders with organized barrel exports
- ✅ Update all composables/components to import from `_internal` barrel
- ✅ Clean up public type files to only export public types
- ✅ Move `useNuGridColumnPinning` to internal, expose pinning via `defineExpose`
- ✅ Rename `EditorConfig` to `NuGridEditorConfig` and move to internal
- ✅ Rename Cell Type System types with NuGrid prefix for consistency
- ✅ Create `#nu-grid/cells` export path for cell types and composables
- ✅ Move internal components to `components/_internal/` folder
- ✅ Rename `NuGridCheckbox` to `NuGridGroupCheckbox` (internal)
- ✅ Rename `NuGridCellBooleanCheckbox` to `NuGridCellCheckbox` (public)

### Future Considerations

All planned tasks have been completed. The public API is now properly locked down.
