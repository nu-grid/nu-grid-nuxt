<script setup lang="ts" generic="T extends TableData">
import type { TableData } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import type { ComponentPublicInstance } from 'vue'
import type {
  NuGridAddRowContext,
  NuGridCoreContext,
  NuGridFocusContext,
  NuGridInteractionRouterContext,
  NuGridPerformanceContext,
} from '../../types/_internal'
import { computed, inject } from 'vue'
import { resolveStyleObject, resolveValue } from '../../composables/_internal'
import NuGridCellContent from './NuGridCellContent.vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  row: Row<T>
  style?: Record<string, any>
  minHeight?: number
  dataIndex?: number
  measureRef?: (el: Element | ComponentPublicInstance | null) => void
}>()

const slots = defineSlots<{
  default?: (props: { cell: any; row: Row<T>; cellIndex: number }) => any
  expanded?: (props: { row: Row<T> }) => any
}>()

// Inject split contexts
const coreContext = inject<NuGridCoreContext<T>>('nugrid-core')!
const focusContext = inject<NuGridFocusContext<T>>('nugrid-focus')!
const performanceContext = inject<NuGridPerformanceContext<T>>('nugrid-performance')!
const addRowContext = inject<NuGridAddRowContext<T>>('nugrid-add-row')!
const interactionRouterContext = inject<NuGridInteractionRouterContext<T>>(
  'nugrid-interaction-router',
)!

if (
  !coreContext
  || !focusContext
  || !performanceContext
  || !addRowContext
  || !interactionRouterContext
) {
  throw new Error('NuGridAddRow must be used within a NuGrid component.')
}

const { tableApi, ui, propsUi } = coreContext
const { focusFns, cellEditingFns } = focusContext
const { getVisibleCells, shouldHaveBorder } = performanceContext
const { interactionRouter } = interactionRouterContext
const isAddRow = computed(() => addRowContext.isAddRowRow(props.row))
const showIndicator = computed(() => addRowContext.addRowState.value === 'idle' && isAddRow.value)
const indicatorText = computed(() => addRowContext.addNewText.value)

// Calculate left offset for indicator based on uneditable columns
const indicatorLeftOffset = computed(() => {
  if (!showIndicator.value) return 0

  const cells = getVisibleCells(props.row)
  let offset = 0

  for (const cell of cells) {
    // Check if this cell is editable in add row context
    const isEditable = cellEditingFns.isCellEditable(props.row, cell)

    if (isEditable) {
      // Found first editable cell, stop here
      break
    }

    // Add this cell's width to the offset
    offset += cell.column.getSize()
  }

  return offset
})
</script>

<template>
  <div
    :ref="measureRef"
    :data-index="dataIndex"
    :data-add-row="isAddRow"
    :data-row-id="row.id"
    :data-selected="false"
    data-selectable="false"
    :data-expanded="row.getIsExpanded()"
    :data-active-row="focusFns.isActiveRow(row)"
    :data-focused-row="focusFns.isFocusedRow(row)"
    :tabindex="focusFns.getRowTabIndex(row)"
    :class="[
      ui.tr({
        class: [propsUi?.tr, resolveValue(tableApi.options.meta?.class?.tr, row)],
        focusRow: !!focusFns.isFocusedRow(row),
        gridFocused: focusFns.gridHasFocus.value,
      }),
    ]"
    :style="[
      resolveValue(tableApi.options.meta?.style?.tr, row),
      style,
      minHeight ? { minHeight: `${minHeight}px` } : {},
      showIndicator ? { position: 'relative' } : {},
    ]"
    @click.stop
    @pointerenter.stop
    @pointerleave.stop
    @contextmenu.prevent
  >
    <div
      v-if="showIndicator"
      :class="ui.addRowIndicator({ class: propsUi?.addRowIndicator })"
      :style="
        !addRowContext.indicatorSlot && indicatorLeftOffset
          ? { left: `${indicatorLeftOffset}px` }
          : {}
      "
    >
      <component
        :is="() => addRowContext.indicatorSlot?.({ row, text: indicatorText })"
        v-if="addRowContext.indicatorSlot"
      />
      <template v-else>{{ indicatorText }}</template>
    </div>

    <div
      v-for="(cell, cellIndex) in getVisibleCells(row)"
      :key="cell.id"
      :data-cell-index="cellIndex"
      :data-column-id="cell.column.id"
      :data-pinned="cell.column.getIsPinned()"
      :data-focused="focusFns.isFocusedCell(row, cellIndex)"
      :tabindex="focusFns.getCellTabIndex(row, cellIndex)"
      :class="[
        cellEditingFns.isEditingCell(row, cell.column.id)
        && cell.column.columnDef.cellDataType !== 'boolean'
          ? 'p-3!'
          : '',
        ui.td({
          class: [propsUi?.td, resolveValue(cell.column.columnDef.meta?.class?.td, cell)],
          pinned: !!cell.column.getIsPinned(),
          hasLeftBorder: shouldHaveBorder(row, cellIndex, 'left'),
          hasRightBorder: shouldHaveBorder(row, cellIndex, 'right'),
          focusCell:
            !!focusFns.isFocusedCell(row, cellIndex)
            && !cellEditingFns.isEditingCell(row, cell.column.id),
          focusRow: !!focusFns.isFocusedRow(row),
          activeRow: focusFns.isActiveRow(row) && !focusFns.isFocusedRow(row),
          gridFocused: focusFns.gridHasFocus.value,
        }),
      ]"
      :style="{
        ...resolveStyleObject(cell.column.columnDef.meta?.style?.td, cell),
        width: `${cell.column.getSize()}px`,
        minWidth: `${cell.column.getSize()}px`,
        maxWidth: `${cell.column.getSize()}px`,
        ...(cell.column.getIsPinned() === 'left'
          ? { left: `${cell.column.getStart('left')}px` }
          : {}),
        ...(cell.column.getIsPinned() === 'right'
          ? { right: `${cell.column.getAfter('right')}px` }
          : {}),
        ...(resolveValue(cell.column.columnDef.meta?.colspan?.td, cell)
          ? { flexGrow: resolveValue(cell.column.columnDef.meta?.colspan?.td, cell) }
          : {}),
      }"
      @click="
        (e: MouseEvent) =>
          interactionRouter.routeCellClick({
            event: e,
            row,
            cell,
            cellIndex,
          })
      "
      @dblclick="cellEditingFns.onCellDoubleClick($event, row, cell)"
    >
      <slot :cell="cell" :row="row" :cell-index="cellIndex">
        <NuGridCellContent :cell="cell" :row="row" :cell-editing-fns="cellEditingFns" />
      </slot>
    </div>
  </div>

  <div v-if="row.getIsExpanded() && !!slots.expanded" :class="ui.tr({ class: [propsUi?.tr] })">
    <div :class="ui.td({ class: [propsUi?.td] })">
      <slot name="expanded" :row="row" />
    </div>
  </div>
</template>
