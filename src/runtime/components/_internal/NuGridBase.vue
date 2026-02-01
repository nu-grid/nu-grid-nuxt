<script setup lang="ts" generic="T extends TableData">
import type { TableData, TableSlots } from '@nuxt/ui'
import type { VirtualItem } from '@tanstack/vue-virtual'
import type { ComponentPublicInstance } from 'vue'
import type { NuGridProps } from '../../types'
import type {
  GroupVirtualRowType,
  NuGridAddRowContext,
  NuGridAnimationContext,
  NuGridCoreContext,
  NuGridDragContext,
  NuGridMultiRowContext,
  NuGridPerformanceContext,
  NuGridResizeContext,
  NuGridUIConfigContext,
  NuGridVirtualItemStyle,
  NuGridVirtualizationContext,
} from '../../types/_internal'
import { FlexRender } from '@tanstack/vue-table'
import { createReusableTemplate } from '@vueuse/core'
import { Primitive } from 'reka-ui'
import { computed, inject, toValue } from 'vue'
import {
  getFlexHeaderStyle,
  getHeaderEffectivePinning,
  getHeaderPinningStyle,
  resolveStyleObject,
  resolveValue,
} from '../../composables/_internal'
import NuGridAddRow from './NuGridAddRow.vue'
import NuGridColumnMenu from './NuGridColumnMenu.vue'
import NuGridHeaderSortButton from './NuGridHeaderSortButton.vue'
import NuGridRow from './NuGridRow.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<NuGridProps<T>>()

const slots = defineSlots<TableSlots<T>>()

// Inject split contexts
const coreContext = inject<NuGridCoreContext<T>>('nugrid-core')!
const dragContext = inject<NuGridDragContext<T>>('nugrid-drag')!
const resizeContext = inject<NuGridResizeContext<T>>('nugrid-resize')!
const virtualizationContext = inject<NuGridVirtualizationContext<T>>('nugrid-virtualization')!
const performanceContext = inject<NuGridPerformanceContext<T>>('nugrid-performance')!
const uiConfigContext = inject<NuGridUIConfigContext<T>>('nugrid-ui-config')!
const addRowContext = inject<NuGridAddRowContext<T>>('nugrid-add-row')!
const multiRowContext = inject<NuGridMultiRowContext>('nugrid-multi-row')
const animationContext = inject<NuGridAnimationContext>('nugrid-animation')!

if (
  !coreContext
  || !dragContext
  || !resizeContext
  || !virtualizationContext
  || !performanceContext
  || !uiConfigContext
  || !addRowContext
  || !animationContext
) {
  throw new Error('NuGridBase must be used within a NuGrid component.')
}

// Animation
const animationEnabled = animationContext.enabled

// Destructure from contexts
const { tableRef, rootRef, tableApi, ui, hasFooter, rows: contextRows, propsUi } = coreContext

// Create a local computed for animated rows to ensure proper reactivity tracking
// IMPORTANT: Return a new array reference to trigger Vue's reactivity for FLIP animations
// The source array from TanStack may be the same reference even when order changes
const rows = computed(() => {
  const currentRows = contextRows.value ?? []
  // Return a new array (shallow copy) to ensure Vue detects the change
  return [...currentRows]
})
const { dragFns, rowDragOptions } = dragContext
const {
  handleResizeStart,
  handleGroupResizeStart,
  resizingGroupId,
  resizingColumnId,
  manuallyResizedColumns,
} = resizeContext
const {
  virtualizer,
  virtualizationEnabled,
  virtualRowItems,
  getVirtualItemHeight,
  stickyOffsets,
  stickyEnabled,
} = virtualizationContext
const { headerGroups, headerGroupsLength, footerGroups } = performanceContext
const {
  sortIcons: gridSortIcons,
  scrollbarClass,
  scrollbarThemeClass,
  scrollbarAttr,
  autoSizeMode,
  resizeMode,
} = uiConfigContext

// Check if we should use CSS flex distribution (no fixed widths)
const useCssFlexDistribution = computed(() => autoSizeMode?.value === 'fill')

// For expand mode with fill: once columns are resized, switch to explicit width
// This allows the table to grow beyond the container
const shouldUseFlexWidth = computed(() => {
  if (!useCssFlexDistribution.value) return false
  // In shift mode, always use 100% to maintain container fit
  if (resizeMode?.value === 'shift') return true
  // In expand mode, switch to explicit width once any column is resized
  return manuallyResizedColumns.value.size === 0
})

/** Flex style options for header/cell styling */
const flexStyleOptions = computed(() => ({
  useCssFlexDistribution: useCssFlexDistribution.value,
  manuallyResizedColumns: manuallyResizedColumns.value,
  columnSizing: tableApi.getState().columnSizing,
}))

/** Get header style with flex distribution support */
function getStandardHeaderStyle(
  header: (typeof headerGroups.value)[number]['headers'][number],
): Record<string, string | number> {
  return getFlexHeaderStyle(header, flexStyleOptions.value)
}

// Multi-row support
const multiRowEnabled = computed(() => multiRowContext?.enabled.value ?? false)
const multiRowCount = computed(() => multiRowContext?.rowCount.value ?? 1)
const alignColumns = computed(() => multiRowContext?.alignColumns.value ?? false)
const row0Columns = computed(() => multiRowContext?.row0Columns.value ?? [])

// Calculate total width of left-pinned columns from row 0 (for header spacers)
const leftPinnedWidth = computed(() => {
  if (!alignColumns.value) return 0
  return row0Columns.value
    .filter((col) => col.pinned === 'left')
    .reduce((sum, col) => sum + col.width, 0)
})

// Calculate total width of right-pinned columns from row 0 (for header spacers)
const rightPinnedWidth = computed(() => {
  if (!alignColumns.value) return 0
  return row0Columns.value
    .filter((col) => col.pinned === 'right')
    .reduce((sum, col) => sum + col.width, 0)
})

// Group headers by their row property for multi-row mode
// For rows 1+ in aligned mode, filter out pinned headers (we use spacers instead)
const headersByVisualRow = computed(() => {
  const groups = headerGroups.value
  if (!multiRowEnabled.value || multiRowCount.value <= 1 || groups.length === 0) {
    return null // Use default rendering
  }

  // Get the leaf header group (last one contains actual column headers)
  const leafHeaderGroup = groups[groups.length - 1]
  if (!leafHeaderGroup) return null

  // Group headers by their row property
  type HeaderType = (typeof leafHeaderGroup.headers)[number]
  const grouped: HeaderType[][] = Array.from({ length: multiRowCount.value }, () => [])

  leafHeaderGroup.headers.forEach((header) => {
    const rowNum = header.column.columnDef.row ?? 0
    const clampedRow = Math.max(0, Math.min(rowNum, multiRowCount.value - 1))

    // In aligned mode, rows 1+ use spacers for pinned columns, so filter out pinned headers
    if (alignColumns.value && clampedRow > 0 && header.column.getIsPinned()) {
      return // Skip pinned headers for rows 1+ in aligned mode
    }

    grouped[clampedRow]!.push(header)
  })

  return grouped
})

// Calculate pinning position within a visual row for headers
function getMultiRowHeaderPinningStyle(
  header: (typeof headerGroups.value)[number]['headers'][number],
  visualRowHeaders: (typeof headerGroups.value)[number]['headers'],
): Record<string, string | number> {
  const pinned = header.column.getIsPinned()
  if (!pinned) return {}

  if (pinned === 'left') {
    // Calculate left position: sum of widths of left-pinned headers before this one
    let leftOffset = 0
    for (const h of visualRowHeaders) {
      if (h.column.id === header.column.id) break
      if (h.column.getIsPinned() === 'left') {
        leftOffset += h.getSize()
      }
    }
    return {
      position: 'sticky',
      left: `${leftOffset}px`,
      zIndex: 20,
    }
  }

  if (pinned === 'right') {
    // Calculate right position: sum of widths of right-pinned headers after this one
    let rightOffset = 0
    let foundSelf = false
    for (const h of visualRowHeaders) {
      if (h.column.id === header.column.id) {
        foundSelf = true
        continue
      }
      if (foundSelf && h.column.getIsPinned() === 'right') {
        rightOffset += h.getSize()
      }
    }
    return {
      position: 'sticky',
      right: `${rightOffset}px`,
      zIndex: 20,
    }
  }

  return {}
}

// Calculate aligned header style for multi-row mode
// For rows 1+ in aligned mode, headers should span row 0 column slots based on their span property
function getAlignedHeaderStyle(
  header: (typeof headerGroups.value)[number]['headers'][number],
  visualRowIndex: number,
  headerIndexInRow: number,
  totalHeadersInRow: number,
): Record<string, string | number> {
  const isPinned = header.column.getIsPinned()

  // Pinned columns always use fixed width
  if (isPinned) {
    return {
      width: `${header.getSize()}px`,
      minWidth: `${header.getSize()}px`,
      maxWidth: `${header.getSize()}px`,
      flexShrink: 0,
    }
  }

  // Row 0 or non-aligned mode: use standard flex sizing
  if (visualRowIndex === 0 || !alignColumns.value) {
    // For fill mode, use flex with min/max constraints from column definitions
    const useCssFlexDistribution = autoSizeMode?.value === 'fill'
    const minSize = header.column.columnDef.minSize ?? 50
    const maxSize = header.column.columnDef.maxSize

    if (useCssFlexDistribution) {
      return {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
        minWidth: `${minSize}px`,
        ...(maxSize && maxSize < Number.MAX_SAFE_INTEGER ? { maxWidth: `${maxSize}px` } : {}),
      }
    }

    return {
      flexGrow: 1,
      flexBasis: `${header.getSize()}px`,
      minWidth: `${minSize}px`,
    }
  }

  // Rows 1+ in aligned mode: calculate based on row 0 column slots
  const row0Cols = row0Columns.value

  // Find pinned column boundaries in row 0
  let leftPinnedEnd = 0
  while (leftPinnedEnd < row0Cols.length && row0Cols[leftPinnedEnd]?.pinned === 'left') {
    leftPinnedEnd++
  }
  const firstRightPinnedIdx = row0Cols.findIndex(
    (col, idx) => idx >= leftPinnedEnd && col.pinned === 'right',
  )
  const unpinnedEndIdx = firstRightPinnedIdx === -1 ? row0Cols.length : firstRightPinnedIdx
  const unpinnedSlots = unpinnedEndIdx - leftPinnedEnd

  const span = header.column.columnDef.span
  let slotsToSpan = 1
  let flexBasis = 0
  let minWidth = 0

  // Check if this is the last header in the row - it should fill remaining space
  const isLastHeader = headerIndexInRow === totalHeadersInRow - 1

  if (span === '*' || isLastHeader) {
    // Span all remaining unpinned columns
    // Calculate how many slots previous headers in this row have consumed
    // For simplicity, we'll make the last header fill remaining space
    const remainingSlots = Math.max(1, unpinnedSlots - headerIndexInRow)
    slotsToSpan = remainingSlots
    for (
      let i = 0;
      i < remainingSlots && leftPinnedEnd + headerIndexInRow + i < unpinnedEndIdx;
      i++
    ) {
      const slotIdx = leftPinnedEnd + headerIndexInRow + i
      if (slotIdx < row0Cols.length) {
        flexBasis += row0Cols[slotIdx]!.width
        minWidth += row0Cols[slotIdx]!.minWidth
      }
    }
  } else if (typeof span === 'number' && span > 1) {
    // Span specified number of columns
    slotsToSpan = Math.min(span, unpinnedSlots - headerIndexInRow)
    for (let i = 0; i < slotsToSpan; i++) {
      const slotIdx = leftPinnedEnd + headerIndexInRow + i
      if (slotIdx < row0Cols.length && slotIdx < unpinnedEndIdx) {
        flexBasis += row0Cols[slotIdx]!.width
        minWidth += row0Cols[slotIdx]!.minWidth
      }
    }
  } else {
    // Default: span 1 column slot
    const slotIdx = leftPinnedEnd + headerIndexInRow
    if (slotIdx < row0Cols.length && slotIdx < unpinnedEndIdx) {
      flexBasis = row0Cols[slotIdx]!.width
      minWidth = row0Cols[slotIdx]!.minWidth
    } else {
      flexBasis = header.getSize()
      minWidth = header.column.columnDef.minSize ?? 50
    }
  }

  return {
    flexGrow: slotsToSpan,
    flexBasis: `${flexBasis}px`,
    minWidth: `${minWidth}px`,
  }
}

const [DefineTableTemplate, ReuseNuGridTemplate] = createReusableTemplate({ inheritAttrs: false })

// Memoized ref callback for measuring elements with dynamic row heights
function measureElementRef(el: Element | ComponentPublicInstance | null) {
  if (el && virtualizer && virtualizer.value.dynamicRowHeightsEnabled.value) {
    virtualizer.value.measureElement(el as Element)
  }
}

// Get total table width for virtualized rows (needed for horizontal sticky columns)
const totalTableWidth = computed(() => `${tableApi.getTotalSize()}px`)

function getVirtualItemStyle(
  type: GroupVirtualRowType,
  virtualRow: VirtualItem,
): NuGridVirtualItemStyle | Record<string, never> {
  if (!virtualizer) {
    return {}
  }

  const useDynamicHeight = virtualizer.value.dynamicRowHeightsEnabled?.value ?? false
  const stickyTop = stickyOffsets.value.get(virtualRow.index)
  const resolvedHeight = getVirtualItemHeight(virtualRow.index)
  // For CSS flex distribution (fill with shift mode, or expand mode before any resize):
  // use 100% to fill container and enable flex
  // Once columns are resized in expand mode, switch to explicit width for horizontal scrolling
  const width = shouldUseFlexWidth.value ? '100%' : totalTableWidth.value

  if (stickyEnabled.value && type === 'column-headers') {
    if (stickyTop !== undefined) {
      return {
        position: 'sticky',
        top: `${stickyTop}px`,
        left: 0,
        width,
        zIndex: 30,
        ...(useDynamicHeight ? {} : { height: `${resolvedHeight}px` }),
        backgroundColor: 'var(--ui-bg)',
      }
    }

    return {
      position: 'absolute',
      top: 0,
      width,
      zIndex: 30,
      ...(useDynamicHeight ? {} : { height: `${resolvedHeight}px` }),
      transform: `translateY(${virtualRow.start}px)`,
      backgroundColor: 'var(--ui-bg)',
    }
  }

  return {
    position: 'absolute',
    top: 0,
    width,
    ...(useDynamicHeight ? {} : { height: `${resolvedHeight}px` }),
    transform: `translateY(${virtualRow.start}px)`,
  }
}
</script>

<template>
  <Primitive
    ref="rootRef"
    :as="as"
    :class="[ui.root({ class: [propsUi?.root, props.class] }), scrollbarThemeClass, scrollbarClass]"
    :style="{
      '--nugrid-animation-duration': animationEnabled
        ? `${animationContext.duration.value}ms`
        : undefined,
      '--nugrid-animation-easing': animationEnabled ? animationContext.easing.value : undefined,
    }"
    :data-scrollbars="scrollbarAttr"
  >
    <DefineTableTemplate>
      <div
        ref="tableRef"
        :class="ui.base({ class: [propsUi?.base, autoSizeMode === 'fill' && 'w-full'] })"
      >
        <div v-if="caption || !!slots.caption" :class="ui.caption({ class: [propsUi?.caption] })">
          <slot name="caption">
            {{ caption }}
          </slot>
        </div>

        <!-- Multi-row headers: render headers grouped by visual row -->
        <div
          v-if="!virtualizationEnabled && multiRowEnabled && headersByVisualRow"
          :class="[
            ui.thead({ class: [propsUi?.thead] }),
            stickyEnabled ? ui.stickyColumnHeader({ class: [propsUi?.stickyColumnHeader] }) : {},
          ]"
          :data-sticky-header="stickyEnabled ? 'true' : undefined"
          data-multi-row-headers="true"
        >
          <div
            v-for="(visualRowHeaders, visualRowIndex) in headersByVisualRow"
            :key="`visual-row-${visualRowIndex}`"
            :data-visual-row="visualRowIndex"
            :class="ui.multiRowHeaderRow({ class: [propsUi?.multiRowHeaderRow] })"
          >
            <!-- Drag handle header placeholder (only on first visual row) -->
            <div
              v-if="rowDragOptions.enabled && visualRowIndex === 0"
              :class="[
                ui.th({ class: [propsUi?.th] }),
                ui.rowDragHeaderHandle({ class: [propsUi?.rowDragHeaderHandle] }),
              ]"
              :style="{ gridRow: `span ${multiRowCount}` }"
            />
            <!-- Left pinned spacer for visual rows 1+ (aligns with pinned columns from row 0) -->
            <div
              v-if="alignColumns && visualRowIndex > 0 && leftPinnedWidth > 0"
              class="nugrid-header-pinned-spacer"
              :style="{
                width: `${leftPinnedWidth}px`,
                minWidth: `${leftPinnedWidth}px`,
                flexShrink: 0,
                position: 'sticky',
                left: 0,
                zIndex: 20,
                backgroundColor: 'var(--ui-bg-elevated)',
              }"
            />
            <div
              v-for="(header, headerIndex) in visualRowHeaders"
              :key="header.id"
              :data-column-id="header.column.id"
              :data-pinned="header.column.getIsPinned()"
              :data-dragging="toValue(dragFns.draggedColumnId) === header.column.id"
              :data-drop-target="toValue(dragFns.dropTargetColumnId) === header.column.id"
              :data-drop-position="
                toValue(dragFns.dropTargetColumnId) === header.column.id
                  ? toValue(dragFns.dropPosition)
                  : undefined
              "
              :class="[
                ui.th({
                  class: [
                    propsUi?.th,
                    resolveValue(header.column.columnDef.meta?.class?.th, header),
                  ],
                  pinned: !!getHeaderEffectivePinning(header),
                  colDragging: toValue(dragFns.draggedColumnId) === header.column.id,
                  colDropTarget: toValue(dragFns.dropTargetColumnId) === header.column.id,
                }),
              ]"
              :style="{
                ...resolveStyleObject(header.column.columnDef.meta?.style?.th, header),
                ...getAlignedHeaderStyle(
                  header,
                  visualRowIndex,
                  headerIndex,
                  visualRowHeaders.length,
                ),
                ...getMultiRowHeaderPinningStyle(header, visualRowHeaders),
              }"
              @dragover="
                (e: DragEvent) =>
                  dragFns.isHeaderDraggable(header)
                  && dragFns.handleColumnDragOver(e, header.column.id)
              "
              @dragenter="dragFns.handleColumnDragEnter"
              @drop="
                (e: DragEvent) =>
                  dragFns.isHeaderDraggable(header) && dragFns.handleColumnDrop(e, header.column.id)
              "
              @dragend="dragFns.handleColumnDragEnd"
              @dragleave="dragFns.handleColumnDragLeave"
            >
              <div :class="ui.headerContainer({ class: [propsUi?.headerContainer] })">
                <div
                  :draggable="dragFns.isHeaderDraggable(header)"
                  :class="
                    ui.thInner({
                      class: [propsUi?.thInner],
                      colDraggable: dragFns.isHeaderDraggable(header),
                    })
                  "
                  @dragstart="
                    (e: DragEvent) =>
                      dragFns.isHeaderDraggable(header)
                      && dragFns.handleColumnDragStart(e, header.column.id)
                  "
                >
                  <slot :name="`${header.id}-header`" v-bind="header.getContext()">
                    <FlexRender
                      v-if="!header.isPlaceholder"
                      :render="header.column.columnDef.header"
                      :props="header.getContext()"
                    />
                  </slot>
                  <NuGridHeaderSortButton
                    v-if="
                      (header.column.columnDef.sortIcons?.position
                        ?? gridSortIcons?.position
                        ?? 'edge') === 'inline'
                    "
                    :header="header"
                    :sort-icons="header.column.columnDef.sortIcons"
                  />
                </div>
                <!-- Header controls wrapper - absolutely positioned to not affect column width -->
                <div :class="ui.headerControls({ class: [propsUi?.headerControls] })">
                  <NuGridHeaderSortButton
                    v-if="
                      (header.column.columnDef.sortIcons?.position
                        ?? gridSortIcons?.position
                        ?? 'edge') === 'edge'
                    "
                    :header="header"
                    :sort-icons="header.column.columnDef.sortIcons"
                  />
                  <NuGridColumnMenu :header="header" />
                  <div
                    v-if="header.column.getCanResize()"
                    :class="
                      ui.colResizeHandle({
                        class: [propsUi?.colResizeHandle],
                        colResizing:
                          resizingColumnId === header.column.id || header.column.getIsResizing(),
                      })
                    "
                    :data-col-resizing="
                      resizingColumnId === header.column.id || header.column.getIsResizing()
                        ? 'true'
                        : undefined
                    "
                    @mousedown="handleResizeStart($event, header)"
                    @touchstart.passive="handleResizeStart($event, header)"
                  >
                    <div
                      :class="
                        ui.colResizer({
                          class: [propsUi?.colResizer],
                          colResizing:
                            resizingColumnId === header.column.id || header.column.getIsResizing(),
                        })
                      "
                      :data-col-resizing="
                        resizingColumnId === header.column.id || header.column.getIsResizing()
                          ? 'true'
                          : undefined
                      "
                    />
                  </div>
                </div>
              </div>
            </div>
            <!-- Right pinned spacer for visual rows 1+ (aligns with pinned columns from row 0) -->
            <div
              v-if="alignColumns && visualRowIndex > 0 && rightPinnedWidth > 0"
              class="nugrid-header-pinned-spacer"
              :style="{
                width: `${rightPinnedWidth}px`,
                minWidth: `${rightPinnedWidth}px`,
                flexShrink: 0,
                position: 'sticky',
                right: 0,
                zIndex: 20,
                backgroundColor: 'var(--ui-bg-elevated)',
              }"
            />
          </div>

          <div :class="ui.separator({ class: [propsUi?.separator] })" />
        </div>

        <!-- Standard headers: original single-row rendering -->
        <div
          v-else-if="!virtualizationEnabled"
          :class="[
            ui.thead({ class: [propsUi?.thead] }),
            stickyEnabled ? ui.stickyColumnHeader({ class: [propsUi?.stickyColumnHeader] }) : {},
          ]"
          :data-sticky-header="stickyEnabled ? 'true' : undefined"
        >
          <div
            v-for="(headerGroup, rowIndex) in headerGroups"
            :key="headerGroup.id"
            :class="ui.tr({ class: propsUi?.tr })"
          >
            <!-- Drag handle header placeholder -->
            <div
              v-if="rowDragOptions.enabled"
              :class="[
                ui.th({ class: [propsUi?.th] }),
                ui.rowDragHeaderHandle({ class: [propsUi?.rowDragHeaderHandle] }),
              ]"
            />
            <div
              v-for="header in headerGroup.headers"
              :key="header.id"
              :data-column-id="header.column.id"
              :data-pinned="header.column.getIsPinned()"
              :data-column-group="header.colSpan > 1 ? 'true' : undefined"
              :data-dragging="toValue(dragFns.draggedColumnId) === header.column.id"
              :data-drop-target="toValue(dragFns.dropTargetColumnId) === header.column.id"
              :data-drop-position="
                toValue(dragFns.dropTargetColumnId) === header.column.id
                  ? toValue(dragFns.dropPosition)
                  : undefined
              "
              :class="[
                header.colSpan > 1 || rowIndex < headerGroupsLength - 1
                  ? ui.thGroup({
                      class: [
                        propsUi?.thGroup,
                        rowIndex < headerGroupsLength - 1 ? 'rounded-b-none!' : '',
                        resolveValue(header.column.columnDef.meta?.class?.th, header),
                      ],
                      pinned: !!getHeaderEffectivePinning(header),
                    })
                  : ui.th({
                      class: [
                        propsUi?.th,
                        rowIndex < headerGroupsLength - 1 ? 'rounded-b-none!' : '',
                        headerGroupsLength > 1 && rowIndex === headerGroupsLength - 1
                          ? 'rounded-t-none!'
                          : '',
                        resolveValue(header.column.columnDef.meta?.class?.th, header),
                      ],
                      pinned: !!getHeaderEffectivePinning(header),
                      colDragging: toValue(dragFns.draggedColumnId) === header.column.id,
                      colDropTarget: toValue(dragFns.dropTargetColumnId) === header.column.id,
                    }),
              ]"
              :style="{
                ...resolveStyleObject(header.column.columnDef.meta?.style?.th, header),
                ...getStandardHeaderStyle(header),
                ...getHeaderPinningStyle(header),
                ...(header.colSpan > 1 ? { flexGrow: header.colSpan } : {}),
                ...(header.rowSpan > 1 ? { alignSelf: 'stretch' } : {}),
              }"
              @dragover="
                (e: DragEvent) =>
                  dragFns.isHeaderDraggable(header)
                  && dragFns.handleColumnDragOver(e, header.column.id)
              "
              @dragenter="dragFns.handleColumnDragEnter"
              @drop="
                (e: DragEvent) =>
                  dragFns.isHeaderDraggable(header) && dragFns.handleColumnDrop(e, header.column.id)
              "
              @dragend="dragFns.handleColumnDragEnd"
              @dragleave="dragFns.handleColumnDragLeave"
            >
              <!-- Column Group Header (multi-column spanning or in group row) -->
              <template v-if="header.colSpan > 1 || rowIndex < headerGroupsLength - 1">
                <div :class="ui.headerContainer({ class: [propsUi?.headerContainer] })">
                  <div :class="ui.thGroupInner({ class: [propsUi?.thGroupInner] })">
                    <slot :name="`${header.id}-header`" v-bind="header.getContext()">
                      <FlexRender
                        v-if="!header.isPlaceholder"
                        :render="header.column.columnDef.header"
                        :props="header.getContext()"
                      />
                    </slot>
                  </div>
                  <!-- Group resize handle -->
                  <div
                    v-if="header.colSpan > 1"
                    :class="
                      ui.colResizeHandle({
                        class: [propsUi?.colResizeHandle],
                        colResizing: resizingGroupId === header.id,
                      })
                    "
                    :data-col-resizing="resizingGroupId === header.id ? 'true' : undefined"
                    @mousedown="handleGroupResizeStart($event, header)"
                    @touchstart.passive="handleGroupResizeStart($event, header)"
                  >
                    <div
                      :class="
                        ui.colResizer({
                          class: [propsUi?.colResizer],
                          colResizing: resizingGroupId === header.id,
                        })
                      "
                      :data-col-resizing="resizingGroupId === header.id ? 'true' : undefined"
                    />
                  </div>
                </div>
              </template>
              <!-- Regular Column Header -->
              <template v-else>
                <div :class="ui.headerContainer({ class: [propsUi?.headerContainer] })">
                  <div
                    :draggable="dragFns.isHeaderDraggable(header)"
                    :class="
                      ui.thInner({
                        class: [propsUi?.thInner],
                        colDraggable: dragFns.isHeaderDraggable(header),
                      })
                    "
                    @dragstart="
                      (e: DragEvent) =>
                        dragFns.isHeaderDraggable(header)
                        && dragFns.handleColumnDragStart(e, header.column.id)
                    "
                  >
                    <slot :name="`${header.id}-header`" v-bind="header.getContext()">
                      <FlexRender
                        v-if="!header.isPlaceholder"
                        :render="header.column.columnDef.header"
                        :props="header.getContext()"
                      />
                    </slot>
                    <NuGridHeaderSortButton
                      v-if="
                        (header.column.columnDef.sortIcons?.position
                          ?? gridSortIcons?.position
                          ?? 'edge') === 'inline'
                      "
                      :header="header"
                      :sort-icons="header.column.columnDef.sortIcons"
                    />
                  </div>
                  <!-- Header controls wrapper - absolutely positioned to not affect column width -->
                  <div :class="ui.headerControls({ class: [propsUi?.headerControls] })">
                    <NuGridHeaderSortButton
                      v-if="
                        (header.column.columnDef.sortIcons?.position
                          ?? gridSortIcons?.position
                          ?? 'edge') === 'edge'
                      "
                      :header="header"
                      :sort-icons="header.column.columnDef.sortIcons"
                    />
                    <NuGridColumnMenu :header="header" />
                    <div
                      v-if="header.column.getCanResize()"
                      :class="
                        ui.colResizeHandle({
                          class: [propsUi?.colResizeHandle],
                          colResizing:
                            resizingColumnId === header.column.id || header.column.getIsResizing(),
                        })
                      "
                      :data-col-resizing="
                        resizingColumnId === header.column.id || header.column.getIsResizing()
                          ? 'true'
                          : undefined
                      "
                      @mousedown="handleResizeStart($event, header)"
                      @touchstart.passive="handleResizeStart($event, header)"
                    >
                      <div
                        :class="
                          ui.colResizer({
                            class: [propsUi?.colResizer],
                            colResizing:
                              resizingColumnId === header.column.id
                              || header.column.getIsResizing(),
                          })
                        "
                        :data-col-resizing="
                          resizingColumnId === header.column.id || header.column.getIsResizing()
                            ? 'true'
                            : undefined
                        "
                      />
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <div :class="ui.separator({ class: [propsUi?.separator] })" />
        </div>

        <div
          data-tbody
          :class="ui.tbody({ class: [propsUi?.tbody] })"
          :style="
            virtualizer
              ? { position: 'relative', height: `${virtualizer.getTotalSize()}px` }
              : undefined
          "
        >
          <slot name="body-top" />

          <template v-if="rows.length">
            <template v-if="virtualizer && virtualizationEnabled">
              <template v-for="virtualRow in virtualizer.getVirtualItems()" :key="virtualRow.index">
                <div
                  v-if="virtualRowItems[virtualRow.index]?.type === 'column-headers'"
                  :ref="
                    virtualizer && virtualizer.dynamicRowHeightsEnabled.value
                      ? measureElementRef
                      : undefined
                  "
                  :data-sticky-header="stickyEnabled ? 'true' : undefined"
                  :data-index="virtualRow.index"
                  :data-multi-row-headers="
                    multiRowEnabled && headersByVisualRow ? 'true' : undefined
                  "
                  :class="[
                    ui.thead({ class: [propsUi?.thead] }),
                    stickyEnabled
                      ? ui.stickyColumnHeader({ class: [propsUi?.stickyColumnHeader] })
                      : {},
                  ]"
                  :style="getVirtualItemStyle('column-headers', virtualRow)"
                >
                  <!-- Multi-row virtualized headers -->
                  <template v-if="multiRowEnabled && headersByVisualRow">
                    <div
                      v-for="(visualRowHeaders, visualRowIndex) in headersByVisualRow"
                      :key="`virtual-visual-row-${visualRowIndex}-${virtualRow.index}`"
                      :data-visual-row="visualRowIndex"
                      :class="ui.multiRowHeaderRow({ class: [propsUi?.multiRowHeaderRow] })"
                    >
                      <!-- Drag handle header placeholder (only on first visual row) -->
                      <div
                        v-if="rowDragOptions.enabled && visualRowIndex === 0"
                        :class="[
                          ui.th({ class: [propsUi?.th] }),
                          ui.rowDragHeaderHandle({ class: [propsUi?.rowDragHeaderHandle] }),
                        ]"
                        :style="{ gridRow: `span ${multiRowCount}` }"
                      />
                      <!-- Left pinned spacer for visual rows 1+ -->
                      <div
                        v-if="alignColumns && visualRowIndex > 0 && leftPinnedWidth > 0"
                        class="nugrid-header-pinned-spacer"
                        :style="{
                          width: `${leftPinnedWidth}px`,
                          minWidth: `${leftPinnedWidth}px`,
                          flexShrink: 0,
                          position: 'sticky',
                          left: 0,
                          zIndex: 20,
                          backgroundColor: 'var(--ui-bg-elevated)',
                        }"
                      />
                      <div
                        v-for="(header, headerIndex) in visualRowHeaders"
                        :key="header.id"
                        :data-column-id="header.column.id"
                        :data-pinned="header.column.getIsPinned()"
                        :data-dragging="toValue(dragFns.draggedColumnId) === header.column.id"
                        :data-drop-target="toValue(dragFns.dropTargetColumnId) === header.column.id"
                        :data-drop-position="
                          toValue(dragFns.dropTargetColumnId) === header.column.id
                            ? toValue(dragFns.dropPosition)
                            : undefined
                        "
                        :class="[
                          ui.th({
                            class: [
                              propsUi?.th,
                              resolveValue(header.column.columnDef.meta?.class?.th, header),
                            ],
                            pinned: !!getHeaderEffectivePinning(header),
                            colDragging: toValue(dragFns.draggedColumnId) === header.column.id,
                            colDropTarget: toValue(dragFns.dropTargetColumnId) === header.column.id,
                          }),
                        ]"
                        :style="{
                          ...resolveStyleObject(header.column.columnDef.meta?.style?.th, header),
                          ...getAlignedHeaderStyle(
                            header,
                            visualRowIndex,
                            headerIndex,
                            visualRowHeaders.length,
                          ),
                          ...getMultiRowHeaderPinningStyle(header, visualRowHeaders),
                        }"
                        @dragover="
                          (e: DragEvent) =>
                            dragFns.isHeaderDraggable(header)
                            && dragFns.handleColumnDragOver(e, header.column.id)
                        "
                        @dragenter="dragFns.handleColumnDragEnter"
                        @drop="
                          (e: DragEvent) =>
                            dragFns.isHeaderDraggable(header)
                            && dragFns.handleColumnDrop(e, header.column.id)
                        "
                        @dragend="dragFns.handleColumnDragEnd"
                        @dragleave="dragFns.handleColumnDragLeave"
                      >
                        <div :class="ui.headerContainer({ class: [propsUi?.headerContainer] })">
                          <div
                            :draggable="dragFns.isHeaderDraggable(header)"
                            :class="
                              ui.thInner({
                                class: [propsUi?.thInner],
                                colDraggable: dragFns.isHeaderDraggable(header),
                              })
                            "
                            @dragstart="
                              (e: DragEvent) =>
                                dragFns.isHeaderDraggable(header)
                                && dragFns.handleColumnDragStart(e, header.column.id)
                            "
                          >
                            <slot :name="`${header.id}-header`" v-bind="header.getContext()">
                              <FlexRender
                                v-if="!header.isPlaceholder"
                                :render="header.column.columnDef.header"
                                :props="header.getContext()"
                              />
                            </slot>
                            <NuGridHeaderSortButton
                              v-if="
                                (header.column.columnDef.sortIcons?.position
                                  ?? gridSortIcons?.position
                                  ?? 'edge') === 'inline'
                              "
                              :header="header"
                              :sort-icons="header.column.columnDef.sortIcons"
                            />
                          </div>
                          <!-- Header controls wrapper - absolutely positioned to not affect column width -->
                          <div :class="ui.headerControls({ class: [propsUi?.headerControls] })">
                            <NuGridHeaderSortButton
                              v-if="
                                (header.column.columnDef.sortIcons?.position
                                  ?? gridSortIcons?.position
                                  ?? 'edge') === 'edge'
                              "
                              :header="header"
                              :sort-icons="header.column.columnDef.sortIcons"
                            />
                            <NuGridColumnMenu :header="header" />
                            <div
                              v-if="header.column.getCanResize()"
                              :class="
                                ui.colResizeHandle({
                                  class: [propsUi?.colResizeHandle],
                                  colResizing:
                                    resizingColumnId === header.column.id
                                    || header.column.getIsResizing(),
                                })
                              "
                              :data-col-resizing="
                                resizingColumnId === header.column.id
                                || header.column.getIsResizing()
                                  ? 'true'
                                  : undefined
                              "
                              @mousedown="handleResizeStart($event, header)"
                              @touchstart.passive="handleResizeStart($event, header)"
                            >
                              <div
                                :class="
                                  ui.colResizer({
                                    class: [propsUi?.colResizer],
                                    colResizing:
                                      resizingColumnId === header.column.id
                                      || header.column.getIsResizing(),
                                  })
                                "
                                :data-col-resizing="
                                  resizingColumnId === header.column.id
                                  || header.column.getIsResizing()
                                    ? 'true'
                                    : undefined
                                "
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <!-- Right pinned spacer for visual rows 1+ -->
                      <div
                        v-if="alignColumns && visualRowIndex > 0 && rightPinnedWidth > 0"
                        class="nugrid-header-pinned-spacer"
                        :style="{
                          width: `${rightPinnedWidth}px`,
                          minWidth: `${rightPinnedWidth}px`,
                          flexShrink: 0,
                          position: 'sticky',
                          right: 0,
                          zIndex: 20,
                          backgroundColor: 'var(--ui-bg-elevated)',
                        }"
                      />
                    </div>
                  </template>

                  <!-- Standard virtualized headers -->
                  <template v-else>
                    <div
                      v-for="(headerGroup, rowIndex) in headerGroups"
                      :key="`${headerGroup.id}-${virtualRow.index}`"
                      :class="ui.tr({ class: propsUi?.tr })"
                    >
                      <div
                        v-if="rowDragOptions.enabled"
                        :class="[
                          ui.th({ class: [propsUi?.th] }),
                          ui.rowDragHeaderHandle({ class: [propsUi?.rowDragHeaderHandle] }),
                        ]"
                      />
                      <div
                        v-for="header in headerGroup.headers"
                        :key="header.id"
                        :data-column-id="header.column.id"
                        :data-pinned="header.column.getIsPinned()"
                        :data-column-group="header.colSpan > 1 ? 'true' : undefined"
                        :data-dragging="toValue(dragFns.draggedColumnId) === header.column.id"
                        :data-drop-target="toValue(dragFns.dropTargetColumnId) === header.column.id"
                        :data-drop-position="
                          toValue(dragFns.dropTargetColumnId) === header.column.id
                            ? toValue(dragFns.dropPosition)
                            : undefined
                        "
                        :class="[
                          header.colSpan > 1 || rowIndex < headerGroupsLength - 1
                            ? ui.thGroup({
                                class: [
                                  propsUi?.thGroup,
                                  rowIndex < headerGroupsLength - 1 ? 'rounded-b-none!' : '',
                                  resolveValue(header.column.columnDef.meta?.class?.th, header),
                                ],
                                pinned: !!getHeaderEffectivePinning(header),
                              })
                            : ui.th({
                                class: [
                                  propsUi?.th,
                                  rowIndex < headerGroupsLength - 1 ? 'rounded-b-none!' : '',
                                  headerGroupsLength > 1 && rowIndex === headerGroupsLength - 1
                                    ? 'rounded-t-none!'
                                    : '',
                                  resolveValue(header.column.columnDef.meta?.class?.th, header),
                                ],
                                pinned: !!getHeaderEffectivePinning(header),
                                colDragging: toValue(dragFns.draggedColumnId) === header.column.id,
                                colDropTarget:
                                  toValue(dragFns.dropTargetColumnId) === header.column.id,
                              }),
                        ]"
                        :style="{
                          ...resolveStyleObject(header.column.columnDef.meta?.style?.th, header),
                          ...getStandardHeaderStyle(header),
                          ...getHeaderPinningStyle(header),
                          ...(header.colSpan > 1 ? { flexGrow: header.colSpan } : {}),
                          ...(header.rowSpan > 1 ? { alignSelf: 'stretch' } : {}),
                        }"
                        @dragover="
                          (e: DragEvent) =>
                            dragFns.isHeaderDraggable(header)
                            && dragFns.handleColumnDragOver(e, header.column.id)
                        "
                        @dragenter="dragFns.handleColumnDragEnter"
                        @drop="
                          (e: DragEvent) =>
                            dragFns.isHeaderDraggable(header)
                            && dragFns.handleColumnDrop(e, header.column.id)
                        "
                        @dragend="dragFns.handleColumnDragEnd"
                        @dragleave="dragFns.handleColumnDragLeave"
                      >
                        <!-- Column Group Header (multi-column spanning or in group row) -->
                        <template v-if="header.colSpan > 1 || rowIndex < headerGroupsLength - 1">
                          <div :class="ui.headerContainer({ class: [propsUi?.headerContainer] })">
                            <div :class="ui.thGroupInner({ class: [propsUi?.thGroupInner] })">
                              <slot :name="`${header.id}-header`" v-bind="header.getContext()">
                                <FlexRender
                                  v-if="!header.isPlaceholder"
                                  :render="header.column.columnDef.header"
                                  :props="header.getContext()"
                                />
                              </slot>
                            </div>
                            <!-- Group resize handle -->
                            <div
                              v-if="header.colSpan > 1"
                              :class="
                                ui.colResizeHandle({
                                  class: [propsUi?.colResizeHandle],
                                  colResizing: resizingGroupId === header.id,
                                })
                              "
                              @mousedown="handleGroupResizeStart($event, header)"
                              @touchstart.passive="handleGroupResizeStart($event, header)"
                            >
                              <div
                                :class="
                                  ui.colResizer({
                                    class: [propsUi?.colResizer],
                                    colResizing: resizingGroupId === header.id,
                                  })
                                "
                              />
                            </div>
                          </div>
                        </template>
                        <!-- Regular Column Header -->
                        <template v-else>
                          <div :class="ui.headerContainer({ class: [propsUi?.headerContainer] })">
                            <div
                              :draggable="dragFns.isHeaderDraggable(header)"
                              :class="
                                ui.thInner({
                                  class: [propsUi?.thInner],
                                  colDraggable: dragFns.isHeaderDraggable(header),
                                })
                              "
                              @dragstart="
                                (e: DragEvent) =>
                                  dragFns.isHeaderDraggable(header)
                                  && dragFns.handleColumnDragStart(e, header.column.id)
                              "
                            >
                              <slot :name="`${header.id}-header`" v-bind="header.getContext()">
                                <FlexRender
                                  v-if="!header.isPlaceholder"
                                  :render="header.column.columnDef.header"
                                  :props="header.getContext()"
                                />
                              </slot>
                              <NuGridHeaderSortButton
                                v-if="
                                  (header.column.columnDef.sortIcons?.position
                                    ?? gridSortIcons?.position
                                    ?? 'edge') === 'inline'
                                "
                                :header="header"
                                :sort-icons="header.column.columnDef.sortIcons"
                              />
                            </div>
                            <!-- Header controls wrapper - absolutely positioned to not affect column width -->
                            <div :class="ui.headerControls({ class: [propsUi?.headerControls] })">
                              <NuGridHeaderSortButton
                                v-if="
                                  (header.column.columnDef.sortIcons?.position
                                    ?? gridSortIcons?.position
                                    ?? 'edge') === 'edge'
                                "
                                :header="header"
                                :sort-icons="header.column.columnDef.sortIcons"
                              />
                              <NuGridColumnMenu :header="header" />
                              <div
                                v-if="header.column.getCanResize()"
                                :class="
                                  ui.colResizeHandle({
                                    class: [propsUi?.colResizeHandle],
                                    colResizing:
                                      resizingColumnId === header.column.id
                                      || header.column.getIsResizing(),
                                  })
                                "
                                :data-col-resizing="
                                  resizingColumnId === header.column.id
                                  || header.column.getIsResizing()
                                    ? 'true'
                                    : undefined
                                "
                                @mousedown="handleResizeStart($event, header)"
                                @touchstart.passive="handleResizeStart($event, header)"
                              >
                                <div
                                  :class="
                                    ui.colResizer({
                                      class: [propsUi?.colResizer],
                                      colResizing:
                                        resizingColumnId === header.column.id
                                        || header.column.getIsResizing(),
                                    })
                                  "
                                  :data-col-resizing="
                                    resizingColumnId === header.column.id
                                    || header.column.getIsResizing()
                                      ? 'true'
                                      : undefined
                                  "
                                />
                              </div>
                            </div>
                          </div>
                        </template>
                      </div>
                    </div>
                  </template>

                  <div :class="ui.separator({ class: [propsUi?.separator] })" />
                </div>

                <component
                  :is="
                    addRowContext.isAddRowRow(virtualRowItems[virtualRow.index]?.dataRow!)
                      ? NuGridAddRow
                      : NuGridRow
                  "
                  v-else-if="virtualRowItems[virtualRow.index]?.type === 'data'"
                  :key="virtualRowItems[virtualRow.index]?.dataRow?.id"
                  :row="virtualRowItems[virtualRow.index]?.dataRow!"
                  :data-index="virtualRow.index"
                  :data-row-id="virtualRowItems[virtualRow.index]?.dataRow?.id"
                  :measure-ref="
                    virtualizer && virtualizer.dynamicRowHeightsEnabled.value
                      ? measureElementRef
                      : undefined
                  "
                  :style="getVirtualItemStyle('data', virtualRow)"
                />

                <div
                  v-else-if="virtualRowItems[virtualRow.index]?.type === 'footer'"
                  :ref="
                    virtualizer && virtualizer.dynamicRowHeightsEnabled.value
                      ? measureElementRef
                      : undefined
                  "
                  :data-index="virtualRow.index"
                  :class="ui.tfoot({ class: [propsUi?.tfoot] })"
                  :style="getVirtualItemStyle('footer', virtualRow)"
                >
                  <div :class="ui.separator({ class: [propsUi?.separator] })" />

                  <div
                    v-for="footerGroup in footerGroups"
                    :key="`${footerGroup.id}-${virtualRow.index}`"
                    :class="ui.tr({ class: [propsUi?.tr] })"
                  >
                    <div
                      v-for="header in footerGroup.headers"
                      :key="header.id"
                      :data-pinned="header.column.getIsPinned()"
                      :class="[
                        ui.th({
                          class: [
                            propsUi?.th,
                            resolveValue(header.column.columnDef.meta?.class?.th, header),
                          ],
                          pinned: !!getHeaderEffectivePinning(header),
                        }),
                      ]"
                      :style="{
                        ...resolveStyleObject(header.column.columnDef.meta?.style?.th, header),
                        width: `${header.getSize()}px`,
                        minWidth: `${header.getSize()}px`,
                        maxWidth: `${header.getSize()}px`,
                        ...getHeaderPinningStyle(header),
                        ...(header.colSpan > 1 ? { flexGrow: header.colSpan } : {}),
                        ...(header.rowSpan > 1 ? { alignSelf: 'stretch' } : {}),
                      }"
                    >
                      <div :class="ui.footerContent({ class: [propsUi?.footerContent] })">
                        <slot :name="`${header.id}-footer`" v-bind="header.getContext()">
                          <FlexRender
                            v-if="!header.isPlaceholder"
                            :render="header.column.columnDef.footer"
                            :props="header.getContext()"
                          />
                        </slot>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </template>

            <!-- Non-virtualized rows (animation handled by useVirtualizedRowAnimation composable) -->
            <template v-else>
              <component
                :is="addRowContext.isAddRowRow(row) ? NuGridAddRow : NuGridRow"
                v-for="row in rows"
                :key="row.id"
                :row="row"
                :data-row-id="row.id"
              />
            </template>
          </template>

          <div v-else-if="loading && !!slots.loading" :class="ui.tr({ class: propsUi?.tr })">
            <div :class="ui.loading({ class: propsUi?.loading })">
              <slot name="loading" />
            </div>
          </div>

          <div v-else :class="ui.tr({ class: propsUi?.tr })">
            <div :class="ui.empty({ class: propsUi?.empty })">
              <slot name="empty">
                {{ empty || 'No data available.' }}
              </slot>
            </div>
          </div>

          <slot name="body-bottom" />
        </div>

        <div
          v-if="hasFooter && !virtualizationEnabled"
          :class="ui.tfoot({ class: [propsUi?.tfoot] })"
        >
          <div :class="ui.separator({ class: [propsUi?.separator] })" />

          <div
            v-for="footerGroup in footerGroups"
            :key="footerGroup.id"
            :class="ui.tr({ class: [propsUi?.tr] })"
          >
            <div
              v-for="header in footerGroup.headers"
              :key="header.id"
              :data-pinned="header.column.getIsPinned()"
              :class="[
                ui.th({
                  class: [
                    propsUi?.th,
                    resolveValue(header.column.columnDef.meta?.class?.th, header),
                  ],
                  pinned: !!getHeaderEffectivePinning(header),
                }),
              ]"
              :style="{
                ...resolveStyleObject(header.column.columnDef.meta?.style?.th, header),
                width: `${header.getSize()}px`,
                minWidth: `${header.getSize()}px`,
                maxWidth: `${header.getSize()}px`,
                ...getHeaderPinningStyle(header),
                ...(header.colSpan > 1 ? { flexGrow: header.colSpan } : {}),
                ...(header.rowSpan > 1 ? { alignSelf: 'stretch' } : {}),
              }"
            >
              <div :class="ui.footerContent({ class: [propsUi?.footerContent] })">
                <slot :name="`${header.id}-footer`" v-bind="header.getContext()">
                  <FlexRender
                    v-if="!header.isPlaceholder"
                    :render="header.column.columnDef.footer"
                    :props="header.getContext()"
                  />
                </slot>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefineTableTemplate>

    <div
      v-if="virtualizer"
      :style="{
        height: `${virtualizer.getTotalSize()}px`,
      }"
    >
      <ReuseNuGridTemplate />
    </div>
    <ReuseNuGridTemplate v-else />
  </Primitive>
</template>
