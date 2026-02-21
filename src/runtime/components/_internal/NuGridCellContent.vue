<script setup lang="ts">
import type { Component, ComputedRef } from 'vue'
import type { NuGridSearchContext } from '../../composables/_internal/useNuGridSearch'
import type { NuGridAddRowContext, NuGridCellEditing, NuGridCoreContext } from '../../types/_internal'
import { FlexRender } from '@tanstack/vue-table'
import { computed, inject, ref, resolveComponent, watch } from 'vue'
import { nuGridCellTypeRegistry } from '../../composables/useNuGridCellTypeRegistry'
import NuGridHighlightedText from './NuGridHighlightedText.vue'

interface Props {
  cell: any
  row: any
  cellEditingFns: NuGridCellEditing<any>
}

const props = defineProps<Props>()

// Inject core context for theme UI slots (editor container classes)
const coreContext = inject<NuGridCoreContext>('nugrid-core')!

// Inject UI config for column defaults
const uiConfig = inject<{ wrapText: ComputedRef<boolean> } | null>('nugrid-ui-config', null)

// Inject search context for highlighting
const searchContext = inject<NuGridSearchContext | null>('nugrid-search', null)

// Inject cell slots from parent grid component
const cellSlots = inject<Record<string, (props: any) => any> | null>('nugrid-cell-slots', null)

// Get the cell slot for this column (if any)
const cellSlot = computed(() => {
  if (!cellSlots) return null
  const slotName = `${props.cell.column.id}-cell`
  return cellSlots[slotName] ?? null
})

// Compute the props to pass to the cell slot
const cellSlotProps = computed(() => ({
  cell: props.cell,
  row: props.row,
  column: props.cell.column,
  cellIndex: props.cell.column.getIndex(),
  value: props.cell.getValue(),
  isEditing: props.cellEditingFns.isEditingCell(props.row, props.cell.column.id),
  isInvalid: props.cellEditingFns.hasCellValidationError(props.row.id, props.cell.column.id),
}))

// Ref for the cell content wrapper
const wrapperRef = ref<HTMLElement | null>(null)

// Capture cell height before editing to maintain row height during edit mode
const capturedHeight = ref<number | null>(null)

// Inject add row context to check if this is an add row and if showNew is false
const addRowContext = inject<NuGridAddRowContext<any> | null>('nugrid-add-row', null)
const isAddRow = computed(() => addRowContext?.isAddRowRow(props.row) ?? false)
const shouldHideContent = computed(() => {
  if (!isAddRow.value) return false
  const columnDef = props.cell.column.columnDef
  // showNew defaults to true, so only hide if explicitly false
  return columnDef.showNew === false
})

const isEditing = computed(() =>
  props.cellEditingFns.isEditingCell(props.row, props.cell.column.id),
)

// Capture the cell height just before entering edit mode
// This prevents the row from changing height when the editor replaces the content
// Using flush: 'sync' ensures we capture height BEFORE the DOM updates with the editor
watch(
  isEditing,
  (newValue, oldValue) => {
    if (newValue && !oldValue && wrapperRef.value) {
      // Entering edit mode - capture current height before DOM updates
      capturedHeight.value = wrapperRef.value.offsetHeight
    } else if (!newValue && oldValue) {
      // Leaving edit mode - clear captured height
      capturedHeight.value = null
    }
  },
  { flush: 'sync' },
)

const hasOverrideCellRender = computed(
  () => props.cell.column.columnDef.overrideCellRender === true,
)

// Get cell data type - auto-detect textarea for wrapped columns or multiline content
const cellDataType = computed(() => {
  const columnDef = props.cell.column.columnDef
  const defined = columnDef.cellDataType
  // If explicitly set to something other than 'text', use that
  if (defined && defined !== 'text') return defined

  // Auto-detect textarea if column has wrapText enabled
  if (columnDef.wrapText === true) {
    return 'textarea'
  }

  // Auto-detect: use textarea if content has newlines
  const value = props.cell.getValue()
  if (typeof value === 'string' && value.includes('\n')) {
    return 'textarea'
  }
  return 'text'
})

// Use global registry directly for better performance (no reactive overhead)
// This avoids creating reactive computed values per cell component instance
// Cache renderer lookup - only recalculate when cellDataType changes
// Use registry's cached getRenderer method for better performance
const pluginRenderer = computed(() => {
  const type = cellDataType.value
  return nuGridCellTypeRegistry.getRenderer(type)
})

// Determine if we should use plugin renderer (combine checks for efficiency)
const shouldUsePluginRenderer = computed(() => {
  if (isEditing.value || hasOverrideCellRender.value) return false
  const renderer = pluginRenderer.value
  return !!renderer && renderer !== undefined
})

// Cache resolved components to avoid repeated resolveComponent calls
const resolvedComponentCache = new Map<string | Component, any>()

// Check if renderer is a function (needs special handling)
const isRendererFunction = computed(() => {
  const renderer = pluginRenderer.value
  if (!renderer) return false
  return (
    typeof renderer === 'function'
    && !('component' in (renderer as any))
    && !('__name' in (renderer as any)) // Vue component check
  )
})

// Render plugin renderer component (for component-based renderers)
// Optimized to cache resolved components
const pluginRendererComponent = computed(() => {
  if (!shouldUsePluginRenderer.value || !pluginRenderer.value || isRendererFunction.value)
    return null

  const renderer = pluginRenderer.value

  // Handle different renderer config formats
  if (typeof renderer === 'string') {
    // Component name string - cache resolved component
    if (!resolvedComponentCache.has(renderer)) {
      const resolved = resolveComponent(renderer)
      resolvedComponentCache.set(renderer, resolved)
      return resolved
    }
    return resolvedComponentCache.get(renderer)
  } else if (typeof renderer === 'object' && 'component' in renderer) {
    // Component with props - return component only, props handled separately
    const component = renderer.component
    if (typeof component === 'string') {
      // Cache resolved component
      if (!resolvedComponentCache.has(component)) {
        const resolved = resolveComponent(component)
        resolvedComponentCache.set(component, resolved)
        return resolved
      }
      return resolvedComponentCache.get(component)
    }
    return component
  } else {
    // Direct component reference
    return renderer
  }
})

// Helper to get the accessor key for a cell
const cellAccessorKey = computed(() => {
  const columnDef = props.cell.column.columnDef
  if ('accessorKey' in columnDef && columnDef.accessorKey) {
    return columnDef.accessorKey as string
  }
  return props.cell.column.id
})

// Get renderer props (only compute when needed)
const pluginRendererProps = computed(() => {
  // Access reactive dependencies at the TOP to ensure they're tracked before early returns
  // - valueVersion: triggers re-render when add row values change
  // - isEditing: triggers re-render when editing state changes (value saved on edit stop)
  // eslint-disable-next-line ts/no-unused-expressions
  addRowContext?.valueVersion?.value
  // eslint-disable-next-line ts/no-unused-expressions
  isEditing.value

  if (!shouldUsePluginRenderer.value || !pluginRenderer.value || isRendererFunction.value) {
    return {}
  }
  const renderer = pluginRenderer.value

  // For add rows, read value directly from row.original to bypass TanStack's cache
  // This ensures we always get the latest value after editing
  let cellValue: any
  if (isAddRow.value) {
    // Read directly from row.original using the accessor key
    const key = cellAccessorKey.value
    cellValue = (props.row.original as any)?.[key]
  } else {
    cellValue = props.cell.getValue()
  }

  const baseProps: any = {
    value: cellValue,
    row: props.row,
    cell: props.cell,
    editable: props.cellEditingFns.isCellEditable(props.row, props.cell),
    onUpdateValue: (value: any) => {
      props.cellEditingFns.stopEditing(props.row, props.cell, value)
    },
  }

  // Add custom props if renderer config has them
  if (typeof renderer === 'object' && 'component' in renderer && renderer.props) {
    return { ...baseProps, ...renderer.props }
  }

  return baseProps
})

// Render function result (for function-based renderers)
const functionRendererResult = computed(() => {
  if (!isRendererFunction.value || !pluginRenderer.value) return null
  const renderer = pluginRenderer.value as (context: any) => any

  // For add rows, read value directly from row.original
  const getValue = () => {
    if (isAddRow.value) {
      // eslint-disable-next-line ts/no-unused-expressions
      addRowContext?.valueVersion?.value
      const key = cellAccessorKey.value
      return (props.row.original as any)?.[key]
    }
    return props.cell.getValue()
  }

  return renderer({
    cell: props.cell,
    row: props.row,
    getValue,
    column: props.cell.column,
    table: props.cell.table,
  })
})

// Check if text should wrap (column-level overrides grid-level default)
const shouldWrapText = computed(() => {
  const columnDef = props.cell.column.columnDef
  // Column-level wrapText takes precedence over grid-level default
  if (columnDef.wrapText !== undefined) {
    return columnDef.wrapText
  }
  return uiConfig?.wrapText.value ?? false
})

const wrapperClass = computed(() => {
  // Keep same text styling, add relative positioning when editing for overlay
  const baseClass = shouldWrapText.value
    ? 'w-full whitespace-normal break-words'
    : 'truncate w-full'
  if (isEditing.value) {
    return `${baseClass} relative`
  }
  // select-none prevents text selection flash on double-click to edit
  const preventSelect = props.cellEditingFns.startClicks.value === 'double'
  return preventSelect ? `${baseClass} select-none` : baseClass
})

// Apply captured height during editing to prevent row height changes
// Use both minHeight and height to constrain the editor to match original content
// Also add flex centering to properly position the editor within the constrained height
const wrapperStyle = computed(() => {
  if (isEditing.value && capturedHeight.value !== null) {
    return {
      minHeight: `${capturedHeight.value}px`,
      height: `${capturedHeight.value}px`,
      display: 'flex',
      alignItems: 'center',
    }
  }
  return undefined
})

// Track shouldFocusEditor to trigger re-renders when focus state changes
// This ensures the editor component receives updated shouldFocus prop
const editorContent = computed(() => {
  // Access shouldFocusEditor to create dependency
  const _focus = props.cellEditingFns.shouldFocusEditor.value
  const _showErrors = props.cellEditingFns.showValidationErrors.value
  return props.cellEditingFns.renderCellContent(props.cell, props.row)
})

// Check if search highlighting should be applied to this cell
const shouldHighlight = computed(() => {
  // Highlight when either the search panel has a query or type-ahead is active
  const hasQuery = searchContext?.isSearching.value || (searchContext?.typeAheadBuffer.value?.length ?? 0) > 0
  if (!hasQuery) return false
  // Check if this column is searchable
  const columnDef = props.cell.column.columnDef
  return columnDef.enableSearching !== false
})

// Get the cell value as a string for highlighting
// Uses the column's cell renderer if it returns a string (preserves formatting like "$999")
const cellTextValue = computed(() => {
  // For add rows, read directly from row.original
  if (isAddRow.value) {
    // eslint-disable-next-line ts/no-unused-expressions
    addRowContext?.valueVersion?.value
    const key = cellAccessorKey.value
    const value = (props.row.original as any)?.[key]
    if (value === null || value === undefined) return ''
    return String(value)
  }

  // Try to get formatted text from the cell renderer
  const cellRenderer = props.cell.column.columnDef.cell
  if (typeof cellRenderer === 'function') {
    const result = cellRenderer(props.cell.getContext())
    if (typeof result === 'string') {
      return result
    }
  }

  // Fall back to raw value
  const value = props.cell.getValue()
  if (value === null || value === undefined) return ''
  return String(value)
})
</script>

<template>
  <div v-if="shouldHideContent" :class="wrapperClass">
    <span class="invisible select-none" aria-hidden="true">Aa</span>
  </div>
  <div
    v-else-if="isEditing && cellDataType === 'textarea'"
    ref="wrapperRef"
    :class="wrapperClass"
    :style="wrapperStyle"
    data-editing
  >
    <component :is="functionRendererResult" v-if="shouldUsePluginRenderer && isRendererFunction" />
    <component
      :is="pluginRendererComponent"
      v-else-if="shouldUsePluginRenderer && pluginRendererComponent"
      v-bind="pluginRendererProps"
    />
    <FlexRender v-else :render="cell.column.columnDef.cell" :props="cell.getContext()" />
    <div :class="coreContext.ui.value.editorContainerTextarea?.()">
      <component :is="editorContent" />
    </div>
  </div>
  <div
    v-else-if="isEditing"
    ref="wrapperRef"
    :class="coreContext.ui.value.editorContainer?.()"
    :style="wrapperStyle"
    data-editing
  >
    <component :is="editorContent" />
  </div>
  <div v-else ref="wrapperRef" :class="wrapperClass" :style="wrapperStyle">
    <component :is="cellSlot" v-if="cellSlot" v-bind="cellSlotProps" />
    <component
      :is="functionRendererResult"
      v-else-if="shouldUsePluginRenderer && isRendererFunction"
    />
    <component
      :is="pluginRendererComponent"
      v-else-if="shouldUsePluginRenderer && pluginRendererComponent"
      v-bind="pluginRendererProps"
    />
    <!-- Use highlighted text when search is active and this column is searchable -->
    <NuGridHighlightedText v-else-if="shouldHighlight && cellTextValue" :text="cellTextValue" />
    <FlexRender v-else :render="cell.column.columnDef.cell" :props="cell.getContext()" />
  </div>
</template>

<style>
/* ==========================================================================
   Compact theme editor overrides
   Shrink Nuxt UI inputs, focus rings, and editor chrome to fit compact cells
   ========================================================================== */

/* --- Input sizing --- */
.nugrid-compact [data-editing] [data-slot='root'] {
  --ui-input-height: 1.5rem;
}

.nugrid-compact [data-editing] input,
.nugrid-compact [data-editing] select {
  font-size: 0.8125rem;
  padding-top: 0.0625rem;
  padding-bottom: 0.0625rem;
  padding-left: 0.375rem;
  padding-right: 0.375rem;
}

.nugrid-compact [data-editing] textarea {
  font-size: 0.8125rem;
  padding-left: 0.375rem;
  padding-right: 0.375rem;
}

/* --- Focus ring: shrink ring-2 → ring-1 on UInput / UTextarea --- */
.nugrid-compact [data-editing] input:focus-visible,
.nugrid-compact [data-editing] textarea:focus-visible,
.nugrid-compact [data-editing] select:focus-visible {
  --tw-ring-offset-width: 0px;
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);
}

/* Default (unfocused) outline ring on inputs: shrink from 1px to 0.5px */
.nugrid-compact [data-editing] [data-slot='root'] input {
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 0.5px var(--tw-ring-color);
}

/* --- Lookup / select menu trigger --- */
.nugrid-compact [data-editing] [data-slot='base'][aria-haspopup='listbox'] {
  font-size: 0.8125rem;
  min-height: 1.5rem;
  padding-top: 0.0625rem;
  padding-bottom: 0.0625rem;
  padding-left: 0.375rem;
  padding-right: 0.375rem;
  /* Shrink the hardcoded ring-2 to ring-1 */
  --tw-ring-offset-width: 0px;
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 1px var(--tw-ring-color);
}

/* --- Rating editor --- */
/* Smaller stars */
.nugrid-compact [data-editing] .flex.items-center.gap-1 svg {
  width: 1rem;
  height: 1rem;
}

/* Shrink star focus ring from ring-2 to ring-1 */
.nugrid-compact [data-editing] .flex.items-center.gap-1 button {
  --tw-ring-offset-width: 0px;
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);
}

/* Shrink rating container focus border from border-2 to border */
.nugrid-compact [data-editing] .flex.items-center.gap-1[tabindex='0'] {
  border-width: 1px;
  padding: 0.125rem;
}

/* --- Hide number input spinners --- */
.nugrid-compact [data-editing] input[type='number']::-webkit-inner-spin-button,
.nugrid-compact [data-editing] input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.nugrid-compact [data-editing] input[type='number'] {
  -moz-appearance: textfield;
}

/* --- Currency / percentage symbols --- */
.nugrid-compact [data-editing] .text-gray-500 {
  font-size: 0.8125rem;
}
</style>
