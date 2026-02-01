<script setup lang="ts">
import type { Component, ComputedRef } from 'vue'
import type { NuGridAddRowContext, NuGridCellEditing } from '../../types/_internal'
import { FlexRender } from '@tanstack/vue-table'
import { computed, inject, ref, resolveComponent, watch } from 'vue'
import { nuGridCellTypeRegistry } from '../../composables/useNuGridCellTypeRegistry'

interface Props {
  cell: any
  row: any
  cellEditingFns: NuGridCellEditing<any>
}

const props = defineProps<Props>()

// Inject UI config for column defaults
const uiConfig = inject<{ wrapText: ComputedRef<boolean> } | null>('nugrid-ui-config', null)

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

// Get renderer props (only compute when needed)
const pluginRendererProps = computed(() => {
  if (!shouldUsePluginRenderer.value || !pluginRenderer.value || isRendererFunction.value) {
    return {}
  }
  const renderer = pluginRenderer.value

  const baseProps: any = {
    value: props.cell.getValue(),
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
  return renderer({
    cell: props.cell,
    row: props.row,
    getValue: () => props.cell.getValue(),
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
</script>

<template>
  <div v-if="shouldHideContent" :class="wrapperClass">
    <span class="invisible select-none" aria-hidden="true">Aa</span>
  </div>
  <!-- Editing mode: textarea needs overlay for popout, others render inline -->
  <div
    v-else-if="isEditing && cellDataType === 'textarea'"
    ref="wrapperRef"
    :class="wrapperClass"
    :style="wrapperStyle"
    data-editing
  >
    <!-- Original content stays visible to maintain exact height -->
    <component :is="functionRendererResult" v-if="shouldUsePluginRenderer && isRendererFunction" />
    <component
      :is="pluginRendererComponent"
      v-else-if="shouldUsePluginRenderer && pluginRendererComponent"
      v-bind="pluginRendererProps"
    />
    <FlexRender v-else :render="cell.column.columnDef.cell" :props="cell.getContext()" />
    <!-- Textarea overlay expands beyond cell -->
    <div class="absolute inset-0 -mx-2.5 -my-2">
      <component :is="editorContent" />
    </div>
  </div>
  <!-- Regular editors render inline without overlay, negative margin compensates for input border/padding -->
  <div
    v-else-if="isEditing"
    ref="wrapperRef"
    class="-ml-3 w-full"
    :style="wrapperStyle"
    data-editing
  >
    <component :is="editorContent" />
  </div>
  <!-- Display mode: tooltip handled by grid-level event delegation -->
  <div v-else ref="wrapperRef" :class="wrapperClass" :style="wrapperStyle">
    <!-- Cell slot takes highest priority in display mode -->
    <component :is="cellSlot" v-if="cellSlot" v-bind="cellSlotProps" />
    <!-- Function-based renderer -->
    <component
      :is="functionRendererResult"
      v-else-if="shouldUsePluginRenderer && isRendererFunction"
    />
    <!-- Component-based plugin renderer -->
    <component
      :is="pluginRendererComponent"
      v-else-if="shouldUsePluginRenderer && pluginRendererComponent"
      v-bind="pluginRendererProps"
    />
    <!-- Display mode - render custom or default cell content -->
    <FlexRender v-else :render="cell.column.columnDef.cell" :props="cell.getContext()" />
  </div>
</template>
