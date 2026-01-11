<script setup lang="ts" generic="T extends TableData">
import type { DropdownMenuItem, TableData } from '@nuxt/ui'
import type { Column, Header } from '@tanstack/vue-table'
import type { NuGridColumnMenuItem, NuGridFilterContext } from '../../types'
import type {
  NuGridCoreContext,
  NuGridPerformanceContext,
  NuGridUIConfigContext,
} from '../../types/_internal'
import { computed, inject, ref, resolveComponent, watch } from 'vue'

import { nuGridCellTypeRegistry } from '../../composables/useNuGridCellTypeRegistry'
import { nuGridDefaults } from '../../config/_internal'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  /**
   * The TanStack Table header object
   */
  header: Header<any, unknown>
}>()

// Inject split contexts
const coreContext = inject<NuGridCoreContext<T>>('nugrid-core')!
const performanceContext = inject<NuGridPerformanceContext<T>>('nugrid-performance')!
const uiConfigContext = inject<NuGridUIConfigContext<T>>('nugrid-ui-config')!

if (!coreContext || !performanceContext || !uiConfigContext) {
  throw new Error('NuGridColumnMenu must be used within a NuGrid component.')
}

const { tableApi } = coreContext
const { allLeafColumns } = performanceContext
const { getColumnMenuItems, showColumnVisibility, columnMenuButton } = uiConfigContext

// Use global registry directly for better performance (no reactive overhead)

// Column pinning helper functions (inline to avoid public composable dependency)
const pinColumn = (columnId: string, side: 'left' | 'right') => {
  if (!tableApi) return
  const currentPinning = tableApi.getState().columnPinning
  const newPinning = { ...currentPinning }

  // Remove from opposite side if present
  const oppositeSide = side === 'left' ? 'right' : 'left'
  if (newPinning[oppositeSide]) {
    newPinning[oppositeSide] = newPinning[oppositeSide].filter((id) => id !== columnId)
  }

  // Add to the desired side if not already there
  if (!newPinning[side]) {
    newPinning[side] = []
  }
  if (!newPinning[side].includes(columnId)) {
    newPinning[side] = [...newPinning[side], columnId]
  }

  tableApi.setColumnPinning(newPinning)
}

const unpinColumn = (columnId: string) => {
  if (!tableApi) return
  const currentPinning = tableApi.getState().columnPinning
  const newPinning = {
    left: currentPinning.left?.filter((id) => id !== columnId) || [],
    right: currentPinning.right?.filter((id) => id !== columnId) || [],
  }

  tableApi.setColumnPinning(newPinning)
}

const getIsPinned = (columnId: string): 'left' | 'right' | false => {
  if (!tableApi) return false
  const pinning = tableApi.getState().columnPinning
  if (pinning.left?.includes(columnId)) return 'left'
  if (pinning.right?.includes(columnId)) return 'right'
  return false
}

// Menu open state
const menuOpen = ref(false)
// Filter popover state
const filterPopoverOpen = ref(false)

// Column reference
const column = computed(() => props.header.column)

// Check if column menu is enabled (defaults to true)
const isColumnMenuEnabled = computed(() => {
  const colDef = column.value.columnDef as any
  return colDef.enableColumnMenu !== false
})

// Hide menu for selection and action menu columns, or if disabled
const isSpecialColumn = computed(() => {
  const columnId = column.value.id
  return columnId === '__selection' || columnId === '__actions' || !isColumnMenuEnabled.value
})

// Sort state
const sortState = computed(() => column.value.getIsSorted())
const canSort = computed(() => column.value.getCanSort())

// Filter state
const canFilter = computed(() => column.value.getCanFilter())
const isFiltered = computed(() => {
  const filterValue = column.value.getFilterValue()
  return filterValue !== undefined && filterValue !== null && filterValue !== ''
})

// Pinning state
const isPinned = computed(() => {
  return getIsPinned(column.value.id)
})

// Column sizing state
const canResize = computed(() => column.value.getCanResize())
const hasCustomSize = computed(() => {
  const currentSize = column.value.getSize()
  const defaultSize = column.value.columnDef.size ?? 150
  return currentSize !== defaultSize
})

// Button configuration with defaults
const buttonConfig = computed(() => ({
  icon: columnMenuButton.value?.icon ?? nuGridDefaults.columnDefaults.menu.button.icon,
  color: columnMenuButton.value?.color ?? nuGridDefaults.columnDefaults.menu.button.color,
  variant: columnMenuButton.value?.variant ?? nuGridDefaults.columnDefaults.menu.button.variant,
}))

// Build default menu items
function buildDefaultMenuItems() {
  const items: NuGridColumnMenuItem<T>[] = []
  let needsSeparator = false

  // Helper function to add separator if needed before adding new items
  const addSeparatorIfNeeded = () => {
    if (needsSeparator && items.length > 0) {
      items.push({ type: 'separator' })
      needsSeparator = false
    }
  }

  // Sort items
  if (canSort.value) {
    addSeparatorIfNeeded()
    if (sortState.value !== 'asc') {
      items.push({
        label: 'Sort Ascending',
        icon: 'i-lucide-arrow-up',
        onSelect: (_event?, _col?) => {
          column.value.toggleSorting(false, false)
        },
      })
    }
    if (sortState.value !== 'desc') {
      items.push({
        label: 'Sort Descending',
        icon: 'i-lucide-arrow-down',
        onSelect: (_event?, _col?) => {
          column.value.toggleSorting(true, false)
        },
      })
    }
    if (sortState.value) {
      items.push({
        label: 'Clear Sort',
        icon: 'i-lucide-x',
        onSelect: (_event?, _col?) => {
          column.value.clearSorting()
        },
      })
    }
    needsSeparator = true
  }

  // Filter item - show plugin filter if available
  if (canFilter.value) {
    const colDef = column.value.columnDef as any
    const cellDataType = colDef.cellDataType || 'text'
    const plugin = nuGridCellTypeRegistry.get(cellDataType)
    const isFilteringEnabled = plugin?.enableFiltering !== false && !!plugin?.filter

    if (isFilteringEnabled) {
      addSeparatorIfNeeded()
      items.push({
        label: isFiltered.value ? 'Filter Active' : 'Filter',
        icon: isFiltered.value ? 'i-lucide-filter' : 'i-lucide-filter',
        onSelect: (_event?, _col?) => {
          // Toggle filter popover
          filterPopoverOpen.value = !filterPopoverOpen.value
        },
      })
      needsSeparator = true
    }
  }

  // Pinning items
  if (tableApi) {
    const pinSide = isPinned.value
    let hasAddedPinningItem = false

    addSeparatorIfNeeded()
    if (pinSide !== 'left') {
      items.push({
        label: 'Pin Left',
        icon: 'i-lucide-arrow-left-to-line',
        onSelect: (_event?, _col?) => {
          pinColumn(column.value.id, 'left')
        },
      })
      hasAddedPinningItem = true
    }
    if (pinSide !== 'right') {
      items.push({
        label: 'Pin Right',
        icon: 'i-lucide-arrow-right-to-line',
        onSelect: (_event?, _col?) => {
          pinColumn(column.value.id, 'right')
        },
      })
      hasAddedPinningItem = true
    }
    if (pinSide) {
      items.push({
        label: 'Unpin',
        icon: 'i-lucide-pin-off',
        onSelect: (_event?, _col?) => {
          unpinColumn(column.value.id)
        },
      })
      hasAddedPinningItem = true
    }
    if (hasAddedPinningItem) {
      needsSeparator = true
    }
  }

  // Autosize column
  if (canResize.value) {
    addSeparatorIfNeeded()
    items.push({
      label: 'Autosize Column',
      icon: 'i-lucide-maximize-2',
      onSelect: (_event?, _col?) => {
        const columnId = column.value.id
        if (tableApi) {
          const headerGroups = tableApi.getHeaderGroups()
          const header = headerGroups
            .flatMap((hg: any) => hg.headers)
            .find((h: any) => h.column.id === columnId)
          if (header) {
            // Simple autosize: measure header text
            const headerText =
              typeof header.column.columnDef.header === 'string'
                ? header.column.columnDef.header
                : columnId
            const measureDiv = document.createElement('div')
            measureDiv.style.cssText =
              'position: absolute; visibility: hidden; height: auto; width: auto; white-space: nowrap; font-size: 14px; font-weight: 600;'
            document.body.appendChild(measureDiv)
            measureDiv.textContent = headerText
            const measuredWidth = Math.max(measureDiv.offsetWidth + 64, 100)
            document.body.removeChild(measureDiv)

            tableApi.setColumnSizing((old: any) => ({
              ...old,
              [columnId]: measuredWidth,
            }))
          }
        }
      },
    })
    needsSeparator = true
  }

  // Reset column size
  if (canResize.value && hasCustomSize.value) {
    addSeparatorIfNeeded()
    items.push({
      label: 'Reset Column Size',
      icon: 'i-lucide-rotate-ccw',
      onSelect: (_event?, _col?) => {
        const columnId = column.value.id
        const defaultSize = column.value.columnDef.size ?? 150
        tableApi?.setColumnSizing((old: any) => ({
          ...old,
          [columnId]: defaultSize,
        }))
      },
    })
    needsSeparator = true
  }

  // Return main items (chooser items are handled separately)
  return items
}

// Helper function to convert NuGridColumnMenuItem to DropdownMenuItem for UDropdownMenu
function convertToDropdownMenuItem(
  item: NuGridColumnMenuItem<T>,
  col: typeof column.value,
): DropdownMenuItem {
  // Separators and labels pass through as-is
  if (item.type === 'separator' || item.type === 'label') {
    return item as DropdownMenuItem
  }

  const dropdownItem: DropdownMenuItem = { ...item }

  // Process children recursively if they exist
  if (item.children) {
    dropdownItem.children = item.children.map((child) => convertToDropdownMenuItem(child, col))
  }

  // Wrap onSelect to pass column parameter
  if (item.onSelect) {
    dropdownItem.onSelect = (event?: Event) => {
      return item.onSelect!(event, col)
    }
  }

  return dropdownItem
}

// Helper function to process NuGridColumnMenuItem items
function processMenuItems(items: NuGridColumnMenuItem<T>[], _col: typeof column.value) {
  // Items are already NuGridColumnMenuItem, just return them
  // The column parameter will be passed when converting to DropdownMenuItem
  return items
}

// Build menu items with customization support
const menuItems = computed<DropdownMenuItem[][]>(() => {
  // Build default menu items
  let defaultItems = buildDefaultMenuItems()

  // Get column definition
  const colDef = column.value.columnDef as any
  const cellDataType = colDef.cellDataType || 'text'

  // Apply plugin menu items if provided (before column/grid-level customization)
  const plugin = nuGridCellTypeRegistry.get(cellDataType)
  const pluginMenuItemsCallback = plugin?.columnMenuItems
  if (pluginMenuItemsCallback) {
    // Type cast needed because plugin registry uses generic types
    // The plugin callback is typed with unknown, but we know it's compatible with T
    const callback = pluginMenuItemsCallback as (
      defaultItems: NuGridColumnMenuItem<T>[],
      column: Column<T, unknown>,
    ) => NuGridColumnMenuItem<T>[]
    defaultItems = callback(defaultItems, column.value)
  }

  // Apply custom menu items if provided
  // Priority: columnMenuItems (column-level) > getColumnMenuItems (grid-level) > plugin items > default items
  let finalItems = defaultItems

  if (colDef.columnMenuItems) {
    // Column-level custom menu items
    if (typeof colDef.columnMenuItems === 'function') {
      // Callback function - receives default items and optionally column, returns custom items
      // Support both signatures: (defaultItems) and (defaultItems, column)
      finalItems =
        colDef.columnMenuItems.length === 2
          ? (colDef.columnMenuItems as any)(defaultItems, column.value)
          : colDef.columnMenuItems(defaultItems)
    } else {
      // Array - replaces default items
      finalItems = colDef.columnMenuItems
    }
    // Process custom items
    finalItems = processMenuItems(finalItems, column.value)
  } else if (getColumnMenuItems?.value) {
    // Grid-level custom menu items callback
    finalItems = getColumnMenuItems.value(defaultItems, column.value)
    // Process custom items
    finalItems = processMenuItems(finalItems, column.value)
  }

  // Column chooser (show/hide columns)
  // Check both column-level and grid-level settings
  const columnShowVisibility = colDef.showColumnVisibility ?? showColumnVisibility.value

  const chooserItems: NuGridColumnMenuItem<T>[] = []
  if (columnShowVisibility) {
    // Note: No separator needed here - UDropdownMenu automatically separates sections,
    // and submenus have their own visual separation
    const visibleColumns = allLeafColumns.value.filter((col) => col.getCanHide())

    if (visibleColumns.length > 0) {
      chooserItems.push({
        label: 'Column Visibility',
        icon: 'i-lucide-eye',
        children: visibleColumns.map(
          (col) =>
            ({
              label: typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id,
              type: 'checkbox',
              checked: col.getIsVisible(),
              onUpdateChecked: (checked: boolean) => {
                col.toggleVisibility(!!checked)
              },
              onSelect: (_event?, _column?) => {
                // Prevent default checkbox behavior
              },
            }) as NuGridColumnMenuItem<T>,
        ),
      })
    }
  }

  // Convert NuGridColumnMenuItem to DropdownMenuItem for UDropdownMenu
  const convertedFinalItems = finalItems.map((item) =>
    convertToDropdownMenuItem(item, column.value),
  )
  const convertedChooserItems = chooserItems.map((item) =>
    convertToDropdownMenuItem(item, column.value),
  )

  // Return items grouped by sections
  const sections: DropdownMenuItem[][] = []
  if (convertedFinalItems.length > 0) {
    sections.push(convertedFinalItems)
  }
  if (convertedChooserItems.length > 0) {
    sections.push(convertedChooserItems)
  }

  return sections.length > 0 ? sections : []
})

// Only show menu button if there are items to show and it's not a special column
const shouldShowMenu = computed(() => !isSpecialColumn.value && menuItems.value.length > 0)

// Filter value ref - created per column
const filterValueRef = ref<any>(null)

// Filter context for plugin filter components
const filterContext = computed<NuGridFilterContext<T> | null>(() => {
  if (!canFilter.value) return null
  const colDef = column.value.columnDef as any
  const cellDataType = colDef.cellDataType || 'text'
  const plugin = nuGridCellTypeRegistry.get(cellDataType)
  if (!plugin?.filter || plugin.enableFiltering === false) return null

  return {
    column: column.value,
    filterValue: filterValueRef,
    setFilterValue: (value: any) => {
      filterValueRef.value = value
      column.value.setFilterValue(value)
    },
    clearFilter: () => {
      filterValueRef.value = null
      column.value.setFilterValue(undefined)
    },
    isFiltered: isFiltered.value,
    table: tableApi,
  }
})

// Sync filter value with column's filter value
watch(
  [filterContext, () => (canFilter.value ? column.value.getFilterValue() : null)],
  ([context, currentFilterValue]) => {
    if (!context) return
    const colDef = column.value.columnDef as any
    const cellDataType = colDef.cellDataType || 'text'
    const plugin = nuGridCellTypeRegistry.get(cellDataType)
    const defaultValue = plugin?.filter?.defaultValue ?? null
    const newValue = currentFilterValue ?? defaultValue
    if (filterValueRef.value !== newValue) {
      filterValueRef.value = newValue
    }
  },
  { immediate: true },
)

// Filter component to render
const filterComponent = computed(() => {
  if (!filterContext.value) return null
  const colDef = column.value.columnDef as any
  const cellDataType = colDef.cellDataType || 'text'
  const plugin = nuGridCellTypeRegistry.get(cellDataType)
  if (!plugin?.filter?.component) return null

  const component = plugin.filter.component
  if (typeof component === 'string') {
    return resolveComponent(component)
  }
  return component
})
</script>

<template>
  <div
    v-if="shouldShowMenu"
    :class="[
      'relative z-0 flex shrink-0 items-center px-1 transition-opacity duration-200',
      menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100',
    ]"
  >
    <UDropdownMenu
      v-model:open="menuOpen"
      :items="menuItems"
      :content="{ align: 'end', collisionPadding: 8 }"
    >
      <UButton
        :icon="buttonConfig.icon"
        :color="buttonConfig.color"
        :variant="buttonConfig.variant"
        size="xs"
        :square="true"
        :class="[
          'flex h-6 w-6 items-center justify-center p-0 text-gray-400/60 hover:text-primary-500',
          menuOpen && 'text-primary-500',
        ]"
        @click.stop
      />
    </UDropdownMenu>

    <!-- Filter popover - positioned relative to menu button -->
    <UPopover
      v-if="filterComponent && filterContext"
      v-model:open="filterPopoverOpen"
      :content="{ align: 'end' }"
    >
      <template #content>
        <component :is="filterComponent" :context="filterContext" />
      </template>
    </UPopover>
  </div>
</template>
