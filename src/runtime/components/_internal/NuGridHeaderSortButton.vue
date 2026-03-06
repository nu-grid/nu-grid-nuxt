<script setup lang="ts" generic="T extends TableData">
import type { Ref } from 'vue'

import { computed, inject } from 'vue'

import type { Header } from '../../engine'
import type { NuGridSortIcon } from '../../types'
import type { NuGridCoreContext, NuGridUIConfigContext } from '../../types/_internal'
import type { TableData } from '../../types/table-data'

import { nuGridDefaults } from '../../config/_internal'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  /**
   * The table header object
   */
  header: Header<any>

  /**
   * Column-specific sort icon configuration
   * Overrides the grid-level sortIcons
   */
  sortIcons?: NuGridSortIcon

  /**
   * When true, skip width-based hiding — parent overlay controls visibility
   */
  compact?: boolean
}>()

// Inject split contexts
const coreContext = inject<NuGridCoreContext<T>>('nugrid-core')!
const uiConfigContext = inject<NuGridUIConfigContext<T>>('nugrid-ui-config')!

if (!coreContext || !uiConfigContext) {
  throw new Error('NuGridHeaderSortButton must be used within a NuGrid component.')
}

// Get UI theme and propsUi from core context
const { propsUi, ui } = coreContext
// Get sort icons from UI config context
const { sortIcons: gridSortIcons } = uiConfigContext

// Merge grid-level and column-level icon configs
// Column-level icons take precedence over grid-level
const effectiveIcons = computed<NuGridSortIcon>(() => ({
  unsorted:
    props.sortIcons?.unsorted ??
    gridSortIcons.value?.unsorted ??
    nuGridDefaults.columnDefaults.sortIcons.unsorted,
  asc:
    props.sortIcons?.asc ?? gridSortIcons.value?.asc ?? nuGridDefaults.columnDefaults.sortIcons.asc,
  desc:
    props.sortIcons?.desc ??
    gridSortIcons.value?.desc ??
    nuGridDefaults.columnDefaults.sortIcons.desc,
  unsortedHover:
    props.sortIcons?.unsortedHover ??
    gridSortIcons.value?.unsortedHover ??
    nuGridDefaults.columnDefaults.sortIcons.unsortedHover,
}))

const sortState = computed(() => props.header.column.getIsSorted())

const canSort = computed(() => props.header.column.getCanSort())

const icon = computed(() => {
  if (sortState.value === 'asc') {
    return effectiveIcons.value.asc
  }
  if (sortState.value === 'desc') {
    return effectiveIcons.value.desc
  }
  return effectiveIcons.value.unsorted
})

const sortIndex = computed(() => {
  const index = props.header.column.getSortIndex()
  return index >= 1 ? index : null
})

const shouldHideUnsorted = computed(() => {
  if (props.compact) return false
  return !sortState.value && effectiveIcons.value.unsortedHover
})

// Hide sort button entirely on narrow columns when not actively sorted
// Skipped when compact — parent overlay controls visibility
const isNarrowColumn = computed(() => {
  if (props.compact) return false
  return !sortState.value && props.header.getSize() < 120
})

// Sort stability — stale indicator when sort order is frozen after cell edit
const staleColumns = inject<Ref<Set<string>>>('nugrid-stale-sort-columns')
const clearStale = inject<(() => void) | undefined>('nugrid-clear-stale-sort')
const isStale = computed(() => staleColumns?.value?.has(props.header.column.id) ?? false)

function handleSortClick(event: MouseEvent) {
  if (isStale.value && clearStale) {
    // When stale, re-sort in the current direction (don't toggle)
    clearStale()
  } else {
    props.header.column.getToggleSortingHandler()?.(event)
  }
}
</script>

<template>
  <div
    v-if="canSort && icon && !isNarrowColumn"
    :class="
      shouldHideUnsorted
        ? ui.sortHandleHover({ class: [propsUi?.sortHandleHover] })
        : ui.sortHandle({ class: [propsUi?.sortHandle] })
    "
    @click.stop="handleSortClick($event)"
  >
    <UChip
      v-if="sortIndex !== null"
      :text="sortIndex"
      size="lg"
      :ui="{ base: 'rounded-md px-1 py-1.5' }"
    >
      <UIcon
        :name="icon"
        class="size-4"
        :class="isStale ? ui.sortHandleStale({ class: [propsUi?.sortHandleStale] }) : ''"
      />
    </UChip>
    <UIcon
      v-else
      :name="icon"
      class="size-4"
      :class="isStale ? ui.sortHandleStale({ class: [propsUi?.sortHandleStale] }) : ''"
    />
  </div>
</template>
