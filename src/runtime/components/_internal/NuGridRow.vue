<script setup lang="ts" generic="T extends TableData">
import type { TableData } from '@nuxt/ui'
import type { Cell, Row } from '@tanstack/vue-table'
import type { ComponentPublicInstance } from 'vue'
import type {
  NuGridCoreContext,
  NuGridDragContext,
  NuGridFocusContext,
  NuGridInteractionRouterContext,
  NuGridMultiRowContext,
  NuGridPerformanceContext,
  NuGridResizeContext,
  NuGridRowInteractionsContext,
  NuGridUIConfigContext,
} from '../../types/_internal'
import { computed, inject } from 'vue'
import { getFlexCellStyle, resolveStyleObject, resolveValue } from '../../composables/_internal'
import NuGridCellContent from './NuGridCellContent.vue'

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
  row?: (props: { row: Row<T>; cells: Cell<T, unknown>[] }) => any
}>()

// Inject split contexts
const coreContext = inject<NuGridCoreContext<T>>('nugrid-core')!
const dragContext = inject<NuGridDragContext<T>>('nugrid-drag')!
const focusContext = inject<NuGridFocusContext<T>>('nugrid-focus')!
const performanceContext = inject<NuGridPerformanceContext<T>>('nugrid-performance')!
const rowInteractionsContext = inject<NuGridRowInteractionsContext<T>>('nugrid-row-interactions')!
const interactionRouterContext = inject<NuGridInteractionRouterContext<T>>(
  'nugrid-interaction-router',
)!
const multiRowContext = inject<NuGridMultiRowContext>('nugrid-multi-row')
const uiConfigContext = inject<NuGridUIConfigContext<T>>('nugrid-ui-config')
const resizeContext = inject<NuGridResizeContext<T>>('nugrid-resize')

if (
  !coreContext
  || !dragContext
  || !focusContext
  || !performanceContext
  || !rowInteractionsContext
  || !interactionRouterContext
) {
  throw new Error('NuGridRow must be used within a NuGrid component.')
}

const { tableApi, ui, propsUi, rowSlot } = coreContext
const { rowDragFns, rowDragOptions } = dragContext
const { focusFns, cellEditingFns } = focusContext
const { getVisibleCells, shouldHaveBorder } = performanceContext
const { rowInteractions } = rowInteractionsContext
const { interactionRouter } = interactionRouterContext

const { onRowSelect, onRowHover, onRowContextmenu } = rowInteractions

/** Flex style options for cell styling */
const flexStyleOptions = computed(() => ({
  useCssFlexDistribution: uiConfigContext?.autoSizeMode?.value === 'fill',
  manuallyResizedColumns: resizeContext?.manuallyResizedColumns.value ?? new Set<string>(),
  columnSizing: tableApi.getState().columnSizing,
}))

/** Get cell style with flex distribution support */
function getCellStyle(cell: Cell<T, unknown>): Record<string, string | number> {
  return getFlexCellStyle(cell.column, flexStyleOptions.value)
}

const tdClassCache = new Map<string, string>()

function getTdCacheKey(variants: {
  pinned: boolean
  hasLeftBorder: boolean
  hasRightBorder: boolean
  focusCell: boolean
  focusRow: boolean
  activeRow: boolean
  gridFocused: boolean
  rowInvalid: boolean
  customClass?: string
}): string {
  return `${variants.pinned ? 1 : 0}|${variants.hasLeftBorder ? 1 : 0}|${variants.hasRightBorder ? 1 : 0}|${variants.focusCell ? 1 : 0}|${variants.focusRow ? 1 : 0}|${variants.activeRow ? 1 : 0}|${variants.gridFocused ? 1 : 0}|${variants.rowInvalid ? 1 : 0}|${variants.customClass || ''}`
}

function getMemoizedTdClass(
  customClass: any,
  pinned: boolean,
  hasLeftBorder: boolean,
  hasRightBorder: boolean,
  focusCell: boolean,
  focusRow: boolean,
  activeRow: boolean,
  gridFocused: boolean,
  rowInvalid: boolean,
): string {
  const cacheKey = getTdCacheKey({
    pinned,
    hasLeftBorder,
    hasRightBorder,
    focusCell,
    focusRow,
    activeRow,
    gridFocused,
    rowInvalid,
    customClass: String(customClass || ''),
  })

  let cached = tdClassCache.get(cacheKey)
  if (!cached) {
    cached = ui.value.td({
      class: [propsUi?.value?.td, customClass],
      pinned,
      hasLeftBorder,
      hasRightBorder,
      focusCell,
      focusRow,
      activeRow,
      gridFocused,
      rowInvalid,
    })
    if (tdClassCache.size > 500) {
      const firstKey = tdClassCache.keys().next().value
      if (firstKey) tdClassCache.delete(firstKey)
    }
    tdClassCache.set(cacheKey, cached)
  }
  return cached
}

const rowTrClass = computed(() =>
  ui.value.tr({
    class: [propsUi?.value?.tr, resolveValue(tableApi.options.meta?.class?.tr, props.row)],
    focusRow: !!focusFns.isFocusedRow(props.row),
    gridFocused: focusFns.gridHasFocus.value,
    rowSlot: !!rowSlot,
    activeRow: isRowActive.value,
    rowInvalid: rowHasValidationError.value,
  }),
)

const rowMultiRowContainerClass = computed(() =>
  ui.value.multiRowContainer({
    class: [propsUi?.value?.multiRowContainer],
    focusMultiRow: focusFns.isFocusedRow(props.row) && focusFns.gridHasFocus.value,
  }),
)

const isRowFocused = computed(() => !!focusFns.isFocusedRow(props.row))
const isRowActive = computed(
  () => focusFns.isActiveRow(props.row) && !focusFns.isFocusedRow(props.row),
)
const rowHasValidationError = computed(() => cellEditingFns.hasRowValidationError(props.row.id))
const gridIsFocused = computed(() => focusFns.gridHasFocus.value)

// Handle row click for focus when using row slot (since there are no cells to click)
function onRowClick(e: MouseEvent) {
  // First handle selection
  onRowSelect(e, props.row)

  // If using row slot, also handle focus and emit row-clicked
  // (since there are no cells to trigger onCellClick or routeCellClick)
  if (rowSlot) {
    // Trigger focus on this row with column 0 (for row focus mode)
    focusFns.onCellClick(e, props.row, 0)

    // Route through interaction router so @row-clicked events are emitted
    const cells = getVisibleCells(props.row)
    if (cells.length > 0) {
      interactionRouter.routeCellClick({
        event: e,
        row: props.row,
        cell: cells[0]!,
        cellIndex: 0,
      })
    }
  }
}

// Multi-row support
const multiRowEnabled = computed(() => multiRowContext?.enabled.value ?? false)
const multiRowCount = computed(() => multiRowContext?.rowCount.value ?? 1)
const alignColumns = computed(() => multiRowContext?.alignColumns.value ?? false)
const row0Columns = computed(() => multiRowContext?.row0Columns.value ?? [])

// Group cells by their row property for multi-row rendering
interface CellWithIndex {
  cell: Cell<T, unknown>
  cellIndex: number // Original index in the flat visible cells array
}

// Item in aligned row: can be a cell, a spacer under pinned column, or a flex filler
interface AlignedRowItem {
  type: 'cell' | 'spacer' | 'filler'
  cell?: Cell<T, unknown>
  cellIndex?: number
  width?: number
  minWidth?: number
  pinned?: 'left' | 'right' | false
  // For spacers, the left/right position for sticky positioning
  stickyOffset?: number
  // For flex-based sizing (aligned mode uses flex to match header widths)
  flexGrow?: number
  flexBasis?: number
}

const cellsByVisualRow = computed(() => {
  const cells = getVisibleCells(props.row)
  if (!multiRowEnabled.value || multiRowCount.value <= 1) {
    // Single row mode - return all cells in row 0
    return [cells.map((cell, idx) => ({ cell, cellIndex: idx }))]
  }

  // Multi-row mode - group cells by their row property
  const grouped: CellWithIndex[][] = Array.from({ length: multiRowCount.value }, () => [])

  cells.forEach((cell, cellIndex) => {
    const rowNum = cell.column.columnDef.row ?? 0
    const clampedRow = Math.max(0, Math.min(rowNum, multiRowCount.value - 1))
    grouped[clampedRow]!.push({ cell, cellIndex })
  })

  return grouped
})

// Precompute row 0 layout info for aligned mode to reuse partitions and prefix sums
const row0Layout = computed(() => {
  if (!alignColumns.value || !multiRowEnabled.value) return null

  const row0Cols = row0Columns.value
  if (row0Cols.length === 0) return null

  const grouped = cellsByVisualRow.value
  const row0 = grouped[0] ?? []

  // Find pinned column boundaries
  let leftPinnedEnd = 0
  while (leftPinnedEnd < row0Cols.length && row0Cols[leftPinnedEnd]!.pinned === 'left') {
    leftPinnedEnd++
  }
  const firstRightPinnedIdx = row0Cols.findIndex(
    (col, idx) => idx >= leftPinnedEnd && col.pinned === 'right',
  )
  const unpinnedEndIdx = firstRightPinnedIdx === -1 ? row0Cols.length : firstRightPinnedIdx

  // Prefix sums for fast span calculations
  const widthPrefix: number[] = [0]
  const minWidthPrefix: number[] = [0]
  for (let i = 0; i < row0Cols.length; i++) {
    widthPrefix.push(widthPrefix[i]! + row0Cols[i]!.width)
    minWidthPrefix.push(minWidthPrefix[i]! + row0Cols[i]!.minWidth)
  }

  const sumRange = (prefix: number[], start: number, end: number) => prefix[end]! - prefix[start]!

  const row0NonPinned = row0.filter(({ cell }) => !cell.column.getIsPinned())
  const leftPinnedCells = row0.filter(({ cell }) => cell.column.getIsPinned() === 'left')
  const rightPinnedCells = row0.filter(({ cell }) => cell.column.getIsPinned() === 'right')

  return {
    row0Cols,
    row0NonPinned,
    leftPinnedCells,
    rightPinnedCells,
    leftPinnedEnd,
    unpinnedEndIdx,
    widthPrefix,
    minWidthPrefix,
    sumRange,
  }
})

// Compute aligned row items when alignColumns is enabled
// In aligned mode, pinned columns span all visual rows (rendered separately)
// Non-pinned content is rendered per visual row with proper widths
const alignedCellsByVisualRow = computed(() => {
  if (!alignColumns.value || !multiRowEnabled.value) {
    return null // Not in aligned mode, use regular cellsByVisualRow
  }

  const layout = row0Layout.value
  if (!layout) return null

  const {
    row0Cols,
    row0NonPinned,
    leftPinnedEnd,
    unpinnedEndIdx,
    widthPrefix,
    minWidthPrefix,
    sumRange,
  } = layout

  const grouped = cellsByVisualRow.value
  const result: AlignedRowItem[][] = []

  // Row 0 - only non-pinned cells (pinned cells rendered separately)
  result[0] = row0NonPinned.map(({ cell, cellIndex }) => ({
    type: 'cell' as const,
    cell,
    cellIndex,
    width: cell.column.getSize(),
    minWidth: cell.column.columnDef.minSize ?? 50,
    pinned: false,
    flexGrow: 1,
    flexBasis: cell.column.getSize(),
  }))

  // For rows 1+, build aligned items (non-pinned only)
  for (let rowIdx = 1; rowIdx < multiRowCount.value; rowIdx++) {
    const rowCells = grouped[rowIdx] ?? []
    const alignedItems: AlignedRowItem[] = []

    // Place cells from this row into the unpinned area
    let cellIdx = 0
    let currentSlotIdx = leftPinnedEnd

    while (cellIdx < rowCells.length && currentSlotIdx < unpinnedEndIdx) {
      const { cell, cellIndex } = rowCells[cellIdx]!
      const span = cell.column.columnDef.span

      let cellFlexBasis = 0
      let cellMinWidth = 0
      let slotsToSpan = 1

      if (span === '*') {
        // Span all remaining unpinned columns
        slotsToSpan = unpinnedEndIdx - currentSlotIdx
        cellFlexBasis = sumRange(widthPrefix, currentSlotIdx, unpinnedEndIdx)
        cellMinWidth = sumRange(minWidthPrefix, currentSlotIdx, unpinnedEndIdx)
      } else if (typeof span === 'number' && span > 1) {
        // Span specified number of columns
        slotsToSpan = Math.min(span, unpinnedEndIdx - currentSlotIdx)
        cellFlexBasis = sumRange(widthPrefix, currentSlotIdx, currentSlotIdx + slotsToSpan)
        cellMinWidth = sumRange(minWidthPrefix, currentSlotIdx, currentSlotIdx + slotsToSpan)
      } else {
        // Default: span 1 column
        cellFlexBasis = row0Cols[currentSlotIdx]!.width
        cellMinWidth = row0Cols[currentSlotIdx]!.minWidth
      }

      alignedItems.push({
        type: 'cell',
        cell,
        cellIndex,
        minWidth: cellMinWidth,
        pinned: false,
        flexGrow: slotsToSpan,
        flexBasis: cellFlexBasis,
      })

      currentSlotIdx += slotsToSpan
      cellIdx++
    }

    // If there are remaining slots, expand the last cell to fill them
    // This ensures no white space at the end of each visual row
    if (currentSlotIdx < unpinnedEndIdx && alignedItems.length > 0) {
      const lastItem = alignedItems[alignedItems.length - 1]!
      // Add remaining slots' width to the last cell
      const remainingSlots = unpinnedEndIdx - currentSlotIdx
      lastItem.flexBasis =
        (lastItem.flexBasis ?? 0) + sumRange(widthPrefix, currentSlotIdx, unpinnedEndIdx)
      lastItem.flexGrow = (lastItem.flexGrow ?? 1) + remainingSlots
      lastItem.minWidth =
        (lastItem.minWidth ?? 50) + sumRange(minWidthPrefix, currentSlotIdx, unpinnedEndIdx)
    } else if (currentSlotIdx < unpinnedEndIdx) {
      // No cells in this row - add a filler (edge case)
      alignedItems.push({
        type: 'filler',
        minWidth: 50,
        pinned: false,
        flexGrow: unpinnedEndIdx - currentSlotIdx,
        flexBasis: sumRange(widthPrefix, currentSlotIdx, unpinnedEndIdx),
      })
    }

    result[rowIdx] = alignedItems
  }

  return result
})

// Get left-pinned cells from row 0 for aligned mode (these span all rows)
const alignedLeftPinnedCells = computed(() => {
  return row0Layout.value?.leftPinnedCells ?? []
})

// Get right-pinned cells from row 0 for aligned mode (these span all rows)
const alignedRightPinnedCells = computed(() => {
  return row0Layout.value?.rightPinnedCells ?? []
})

// Calculate pinning position within a visual row
function getMultiRowPinningStyle(
  cell: Cell<T, unknown>,
  _visualRowCells: CellWithIndex[],
): Record<string, string | number> {
  const pinned = cell.column.getIsPinned()
  if (!pinned) return {}

  if (pinned === 'left') {
    return {
      position: 'sticky',
      left: `${cell.column.getStart('left')}px`,
      zIndex: 10,
    }
  }

  if (pinned === 'right') {
    return {
      position: 'sticky',
      right: `${cell.column.getAfter('right')}px`,
      zIndex: 10,
    }
  }

  return {}
}
</script>

<template>
  <div
    v-if="multiRowEnabled && multiRowCount > 1"
    :ref="measureRef"
    :data-index="dataIndex"
    v-bind="rowDragFns.rowDragProps(row)"
    :data-row-id="row.id"
    :data-multi-row="true"
    :data-selected="row.getIsSelected()"
    :data-selectable="!!onRowSelect || !!onRowHover || !!onRowContextmenu"
    :data-expanded="row.getIsExpanded()"
    :data-active-row="focusFns.isActiveRow(row)"
    :data-focused-row="focusFns.isFocusedRow(row)"
    :tabindex="focusFns.getRowTabIndex(row)"
    :class="rowMultiRowContainerClass"
    :style="[
      resolveValue(tableApi.options.meta?.style?.tr, row),
      style,
      minHeight ? { minHeight: `${minHeight}px` } : {},
    ]"
    @click="onRowSelect($event, row)"
    @pointerenter="onRowHover($event, row)"
    @pointerleave="onRowHover($event, null)"
    @contextmenu="onRowContextmenu($event, row)"
  >
    <div
      v-if="rowDragOptions.enabled"
      v-bind="rowDragFns.rowDragHandleProps(row)"
      :class="[
        ui.rowDragHandle({ class: [propsUi?.rowDragHandle] }),
        ui.multiRowDragHandle({ class: [propsUi?.multiRowDragHandle] }),
      ]"
    >
      <UIcon
        name="i-lucide-grip-vertical"
        :class="[
          'h-4 w-4',
          rowDragFns.isRowDraggable(row) ? 'text-muted hover:text-default' : 'text-muted/30',
        ]"
      />
    </div>

    <div
      v-if="!alignedCellsByVisualRow"
      :class="ui.multiRowContent({ class: [propsUi?.multiRowContent] })"
    >
      <div
        v-for="(visualRowCells, visualRowIndex) in cellsByVisualRow"
        :key="visualRowIndex"
        :data-visual-row="visualRowIndex"
        :class="ui.visualRow({ class: [propsUi?.visualRow] })"
      >
        <div
          v-for="{ cell, cellIndex } in visualRowCells"
          :key="cell.id"
          :data-cell-index="cellIndex"
          :data-column-id="cell.column.id"
          :data-pinned="cell.column.getIsPinned()"
          :data-focused="focusFns.isFocusedCell(row, cellIndex)"
          :data-row-invalid="cellEditingFns.hasRowValidationError(row.id)"
          :data-cell-invalid="cellEditingFns.hasCellValidationError(row.id, cell.column.id)"
          :tabindex="focusFns.getCellTabIndex(row, cellIndex)"
          :class="
            getMemoizedTdClass(
              resolveValue(cell.column.columnDef.meta?.class?.td, cell),
              !!cell.column.getIsPinned(),
              shouldHaveBorder(row, cellIndex, 'left'),
              shouldHaveBorder(row, cellIndex, 'right'),
              !!focusFns.isFocusedCell(row, cellIndex)
                && !cellEditingFns.isEditingCell(row, cell.column.id),
              false,
              isRowActive,
              gridIsFocused,
              rowHasValidationError,
            )
          "
          :style="{
            ...resolveStyleObject(cell.column.columnDef.meta?.style?.td, cell),
            // Pinned columns use fixed width, non-pinned use flex-grow
            ...(cell.column.getIsPinned()
              ? {
                  width: `${cell.column.getSize()}px`,
                  minWidth: `${cell.column.getSize()}px`,
                  maxWidth: `${cell.column.getSize()}px`,
                  flexShrink: 0,
                }
              : {
                  flexGrow: 1,
                  flexBasis: `${cell.column.getSize()}px`,
                  minWidth: `${cell.column.columnDef.minSize ?? 50}px`,
                }),
            ...getMultiRowPinningStyle(cell, visualRowCells),
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
    </div>

    <div v-else :class="ui.alignedLayout({ class: [propsUi?.alignedLayout] })">
      <div
        v-if="alignedLeftPinnedCells.length > 0"
        :class="ui.alignedPinnedLeft({ class: [propsUi?.alignedPinnedLeft] })"
      >
        <div
          v-for="{ cell, cellIndex } in alignedLeftPinnedCells"
          :key="cell.id"
          :data-cell-index="cellIndex"
          :data-column-id="cell.column.id"
          data-pinned="left"
          :data-focused="focusFns.isFocusedCell(row, cellIndex)"
          :data-row-invalid="cellEditingFns.hasRowValidationError(row.id)"
          :data-cell-invalid="cellEditingFns.hasCellValidationError(row.id, cell.column.id)"
          :tabindex="focusFns.getCellTabIndex(row, cellIndex)"
          :class="
            getMemoizedTdClass(
              resolveValue(cell.column.columnDef.meta?.class?.td, cell),
              true,
              shouldHaveBorder(row, cellIndex, 'left'),
              shouldHaveBorder(row, cellIndex, 'right'),
              !!focusFns.isFocusedCell(row, cellIndex)
                && !cellEditingFns.isEditingCell(row, cell.column.id),
              false,
              isRowActive,
              gridIsFocused,
              rowHasValidationError,
            )
          "
          :style="{
            ...resolveStyleObject(cell.column.columnDef.meta?.style?.td, cell),
            width: `${cell.column.getSize()}px`,
            minWidth: `${cell.column.getSize()}px`,
            maxWidth: `${cell.column.getSize()}px`,
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

      <div :class="ui.alignedContent({ class: [propsUi?.alignedContent] })">
        <div
          v-for="(alignedItems, visualRowIndex) in alignedCellsByVisualRow"
          :key="visualRowIndex"
          :data-visual-row="visualRowIndex"
          :class="ui.visualRow({ class: [propsUi?.visualRow] })"
        >
          <template v-for="(item, itemIndex) in alignedItems" :key="itemIndex">
            <div
              v-if="item.type === 'cell' && item.cell"
              :data-cell-index="item.cellIndex"
              :data-column-id="item.cell.column.id"
              :data-focused="focusFns.isFocusedCell(row, item.cellIndex!)"
              :data-row-invalid="cellEditingFns.hasRowValidationError(row.id)"
              :data-cell-invalid="
                cellEditingFns.hasCellValidationError(row.id, item.cell.column.id)
              "
              :tabindex="focusFns.getCellTabIndex(row, item.cellIndex!)"
              :class="
                getMemoizedTdClass(
                  resolveValue(item.cell.column.columnDef.meta?.class?.td, item.cell),
                  false,
                  shouldHaveBorder(row, item.cellIndex!, 'left'),
                  shouldHaveBorder(row, item.cellIndex!, 'right'),
                  !!focusFns.isFocusedCell(row, item.cellIndex!)
                    && !cellEditingFns.isEditingCell(row, item.cell.column.id),
                  false,
                  isRowActive,
                  gridIsFocused,
                  rowHasValidationError,
                )
              "
              :style="{
                ...resolveStyleObject(item.cell.column.columnDef.meta?.style?.td, item.cell),
                flexGrow: item.flexGrow ?? 1,
                flexBasis: `${item.flexBasis ?? item.width}px`,
                minWidth: `${item.minWidth}px`,
              }"
              @click="
                (e: MouseEvent) =>
                  interactionRouter.routeCellClick({
                    event: e,
                    row,
                    cell: item.cell!,
                    cellIndex: item.cellIndex!,
                  })
              "
              @dblclick="cellEditingFns.onCellDoubleClick($event, row, item.cell!)"
            >
              <slot :cell="item.cell" :row="row" :cell-index="item.cellIndex!">
                <NuGridCellContent
                  :cell="item.cell"
                  :row="row"
                  :cell-editing-fns="cellEditingFns"
                />
              </slot>
            </div>

            <div
              v-else-if="item.type === 'filler'"
              :class="ui.alignedFiller({ class: [propsUi?.alignedFiller] })"
              :style="{
                flexGrow: item.flexGrow ?? 1,
                flexBasis: `${item.flexBasis ?? item.width ?? 0}px`,
                minWidth: `${item.minWidth}px`,
              }"
            />
          </template>
        </div>
      </div>

      <div
        v-if="alignedRightPinnedCells.length > 0"
        :class="ui.alignedPinnedRight({ class: [propsUi?.alignedPinnedRight] })"
      >
        <div
          v-for="{ cell, cellIndex } in alignedRightPinnedCells"
          :key="cell.id"
          :data-cell-index="cellIndex"
          :data-column-id="cell.column.id"
          data-pinned="right"
          :data-focused="focusFns.isFocusedCell(row, cellIndex)"
          :data-row-invalid="cellEditingFns.hasRowValidationError(row.id)"
          :data-cell-invalid="cellEditingFns.hasCellValidationError(row.id, cell.column.id)"
          :tabindex="focusFns.getCellTabIndex(row, cellIndex)"
          :class="
            getMemoizedTdClass(
              resolveValue(cell.column.columnDef.meta?.class?.td, cell),
              true,
              shouldHaveBorder(row, cellIndex, 'left'),
              shouldHaveBorder(row, cellIndex, 'right'),
              !!focusFns.isFocusedCell(row, cellIndex)
                && !cellEditingFns.isEditingCell(row, cell.column.id),
              false,
              isRowActive,
              gridIsFocused,
              rowHasValidationError,
            )
          "
          :style="{
            ...resolveStyleObject(cell.column.columnDef.meta?.style?.td, cell),
            width: `${cell.column.getSize()}px`,
            minWidth: `${cell.column.getSize()}px`,
            maxWidth: `${cell.column.getSize()}px`,
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
    </div>

    <div
      v-if="row.getIsExpanded() && !!slots.expanded"
      :class="ui.visualRow({ class: [propsUi?.visualRow] })"
    >
      <div :class="ui.td({ class: [propsUi?.td] })">
        <slot name="expanded" :row="row" />
      </div>
    </div>
  </div>

  <div
    v-else
    :ref="measureRef"
    :data-index="dataIndex"
    v-bind="rowDragFns.rowDragProps(row)"
    :data-row-id="row.id"
    :data-selected="row.getIsSelected()"
    :data-selectable="!!onRowSelect || !!onRowHover || !!onRowContextmenu"
    :data-expanded="row.getIsExpanded()"
    :data-active-row="focusFns.isActiveRow(row)"
    :data-focused-row="focusFns.isFocusedRow(row)"
    :tabindex="focusFns.getRowTabIndex(row)"
    :class="rowTrClass"
    :style="[
      resolveValue(tableApi.options.meta?.style?.tr, row),
      style,
      minHeight ? { minHeight: `${minHeight}px` } : {},
    ]"
    @click="onRowClick"
    @pointerenter="onRowHover($event, row)"
    @pointerleave="onRowHover($event, null)"
    @contextmenu="onRowContextmenu($event, row)"
  >
    <div
      v-if="rowDragOptions.enabled"
      v-bind="rowDragFns.rowDragHandleProps(row)"
      :class="[
        ui.rowDragHandle({ class: [propsUi?.rowDragHandle] }),
        ui.td({ class: [propsUi?.td] }),
      ]"
    >
      <UIcon
        name="i-lucide-grip-vertical"
        :class="[
          'h-4 w-4',
          rowDragFns.isRowDraggable(row) ? 'text-muted hover:text-default' : 'text-muted/30',
        ]"
      />
    </div>

    <component :is="rowSlot" v-if="rowSlot" :row="row" :cells="getVisibleCells(row)" />

    <template v-else>
      <div
        v-for="(cell, cellIndex) in getVisibleCells(row)"
        :key="cell.id"
        :data-cell-index="cellIndex"
        :data-column-id="cell.column.id"
        :data-pinned="cell.column.getIsPinned()"
        :data-focused="focusFns.isFocusedCell(row, cellIndex)"
        :data-row-invalid="cellEditingFns.hasRowValidationError(row.id)"
        :data-cell-invalid="cellEditingFns.hasCellValidationError(row.id, cell.column.id)"
        :tabindex="focusFns.getCellTabIndex(row, cellIndex)"
        :class="
          getMemoizedTdClass(
            resolveValue(cell.column.columnDef.meta?.class?.td, cell),
            !!cell.column.getIsPinned(),
            shouldHaveBorder(row, cellIndex, 'left'),
            shouldHaveBorder(row, cellIndex, 'right'),
            !!focusFns.isFocusedCell(row, cellIndex)
              && !cellEditingFns.isEditingCell(row, cell.column.id),
            isRowFocused,
            isRowActive,
            gridIsFocused,
            rowHasValidationError,
          )
        "
        :style="{
          ...resolveStyleObject(cell.column.columnDef.meta?.style?.td, cell),
          ...getCellStyle(cell),
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
    </template>
  </div>
</template>
