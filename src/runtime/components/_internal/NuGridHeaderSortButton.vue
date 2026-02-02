<script setup lang="ts" generic="T extends TableData">
import type { TableData } from '@nuxt/ui'
import type { Header } from '@tanstack/vue-table'

import type { NuGridSortIcon } from '../../types'
import type { NuGridCoreContext, NuGridUIConfigContext } from '../../types/_internal'
import { computed, inject } from 'vue'
import { nuGridDefaults } from '../../config/_internal'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  /**
   * The TanStack Table header object
   */
  header: Header<any, unknown>

  /**
   * Column-specific sort icon configuration
   * Overrides the grid-level sortIcons
   */
  sortIcons?: NuGridSortIcon
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
    props.sortIcons?.unsorted
    ?? gridSortIcons.value?.unsorted
    ?? nuGridDefaults.columnDefaults.sortIcons.unsorted,
  asc:
    props.sortIcons?.asc ?? gridSortIcons.value?.asc ?? nuGridDefaults.columnDefaults.sortIcons.asc,
  desc:
    props.sortIcons?.desc
    ?? gridSortIcons.value?.desc
    ?? nuGridDefaults.columnDefaults.sortIcons.desc,
  unsortedHover:
    props.sortIcons?.unsortedHover
    ?? gridSortIcons.value?.unsortedHover
    ?? nuGridDefaults.columnDefaults.sortIcons.unsortedHover,
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
  return !sortState.value && effectiveIcons.value.unsortedHover
})
</script>

<template>
  <div
    v-if="canSort && icon"
    :class="
      shouldHideUnsorted
        ? ui.sortHandleHover({ class: [propsUi?.sortHandleHover] })
        : ui.sortHandle({ class: [propsUi?.sortHandle] })
    "
    @click="props.header.column.getToggleSortingHandler()?.($event)"
  >
    <UChip
      v-if="sortIndex !== null"
      :text="sortIndex"
      size="lg"
      :ui="{ base: 'rounded-md px-1 py-1.5' }"
    >
      <UIcon :name="icon" class="size-4" />
    </UChip>
    <UIcon v-else :name="icon" class="size-4" />
  </div>
</template>
