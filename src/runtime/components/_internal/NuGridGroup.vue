<!-- eslint-disable vue/block-tag-newline -->
<script setup lang="ts" generic="T extends TableData">
import type { TableData, TableSlots } from '@nuxt/ui'
import type { Header, Row } from '@tanstack/vue-table'
import type { VirtualItem } from '@tanstack/vue-virtual'
import type { ComponentPublicInstance } from 'vue'
import type { NuGridProps } from '../../types'
import type {
  NuGridAddRowContext,
  NuGridCoreContext,
  NuGridDragContext,
  NuGridGroupingContext,
  NuGridPerformanceContext,
  NuGridResizeContext,
  NuGridRowInteractionsContext,
  NuGridUIConfigContext,
  NuGridVirtualItemStyle,
  NuGridVirtualizationContext,
} from '../../types/_internal'

import { FlexRender } from '@tanstack/vue-table'
import { createReusableTemplate, useElementSize } from '@vueuse/core'
import { Primitive } from 'reka-ui'
import { upperFirst } from 'scule'
import { computed, inject, ref, toValue } from 'vue'
import {
  getFlexHeaderStyle,
  getHeaderEffectivePinning,
  getHeaderPinningStyle,
  resolveStyleObject,
  resolveValue,
  useNuGridGroupSelection,
} from '../../composables/_internal'
import NuGridAddRow from './NuGridAddRow.vue'
import NuGridColumnMenu from './NuGridColumnMenu.vue'
import NuGridGroupCheckbox from './NuGridGroupCheckbox.vue'
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
const groupingContext = inject<NuGridGroupingContext<T>>('nugrid-grouping')!
const performanceContext = inject<NuGridPerformanceContext<T>>('nugrid-performance')!
const uiConfigContext = inject<NuGridUIConfigContext<T>>('nugrid-ui-config')!
const rowInteractionsContext = inject<NuGridRowInteractionsContext<T>>('nugrid-row-interactions')!
const addRowContext = inject<NuGridAddRowContext<T>>('nugrid-add-row')!

if (
  !coreContext
  || !dragContext
  || !resizeContext
  || !virtualizationContext
  || !groupingContext
  || !performanceContext
  || !uiConfigContext
  || !rowInteractionsContext
  || !addRowContext
) {
  throw new Error('NuGridGroup must be used within a NuGrid component.')
}

// Destructure from contexts
const { tableRef, rootRef, tableApi, ui, hasFooter, propsUi } = coreContext
const { dragFns, rowDragOptions } = dragContext
const { handleGroupResizeStart, resizingGroupId, resizingColumnId, manuallyResizedColumns } =
  resizeContext
const { stickyEnabled } = virtualizationContext
const { groupingFns } = groupingContext
const { headerGroups, headerGroupsLength, footerGroups } = performanceContext
const {
  sortIcons: gridSortIcons,
  scrollbarClass,
  scrollbarThemeClass,
  scrollbarAttr,
  autoSizeMode,
} = uiConfigContext
const { rowSelectionMode } = rowInteractionsContext

/** Flex style options for header styling */
const flexStyleOptions = computed(() => ({
  useCssFlexDistribution: autoSizeMode?.value === 'fill',
  manuallyResizedColumns: manuallyResizedColumns.value,
}))

/** Get header style with flex distribution support */
function getHeaderStyle(header: Header<T, unknown>): Record<string, string | number> {
  return getFlexHeaderStyle(header, flexStyleOptions.value)
}

const [DefineTableTemplate, ReuseNuGridTemplate] = createReusableTemplate({ inheritAttrs: false })

// Reusable template for group subheader row
const [DefineGroupSubheaderTemplate, ReuseGroupSubheaderTemplate] = createReusableTemplate<{
  groupId: string
  groupRow?: Row<T>
  itemCount: number
  depth?: number
}>({ inheritAttrs: false })

// Reusable template for header cell
const [DefineHeaderCellTemplate, ReuseHeaderCellTemplate] = createReusableTemplate<{
  header: Header<T, unknown>
  rowIndex: number
}>({ inheritAttrs: false })

// Use grouping functions from context (created in parent NuGrid.vue)
if (!groupingFns) {
  throw new Error(
    'NuGridGroup requires groupingFns from context. Ensure gridMode="group" is set on NuGrid.',
  )
}

const {
  groupRows,
  groupedRows,
  virtualRowItems,
  virtualizer,
  virtualizationEnabled,
  toggleGroup,
  isGroupExpanded,
  getVirtualItemHeight,
  stickyOffsets,
  groupingRowHeights,
  headerGroupCount,
} = groupingFns

// Group-aware row selection
const { toggleAllGroupRows, getGroupCheckboxState } = useNuGridGroupSelection(tableApi, groupedRows)

// Check if row selection mode is enabled
const rowSelectionEnabled = computed(() => {
  const mode = rowSelectionMode.value
  return (
    mode === true
    || mode === 'single'
    || mode === 'multi'
    || (typeof mode === 'object' && !mode.hidden)
  )
})

const dynamicRowHeightsEnabled = computed(() => {
  if (!virtualizer || !virtualizer.value.dynamicRowHeightsEnabled) {
    return false
  }
  return !!virtualizer.value.dynamicRowHeightsEnabled.value
})

// Ref for measuring actual column header height in non-virtualized mode
const columnHeadersRef = ref<HTMLElement | null>(null)
const { height: measuredColumnHeaderHeight } = useElementSize(columnHeadersRef)

// Computed sticky offset for group headers in non-virtualized mode
// Uses measured height when available, falls back to estimated height
const nonVirtStickyTop = computed(() => {
  if (measuredColumnHeaderHeight.value > 0) {
    return measuredColumnHeaderHeight.value
  }
  // Fallback to estimated height
  return headerGroupCount.value * groupingRowHeights.value.columnHeader
})

function virtStyle(virtualRow: VirtualItem): NuGridVirtualItemStyle {
  const item = virtualRowItems.value[virtualRow.index]
  const useDynamicHeight = dynamicRowHeightsEnabled.value
  const stickyTop = stickyOffsets.value.get(virtualRow.index)
  const resolvedHeight = getVirtualItemHeight(virtualRow.index)

  // Column headers are sticky at the very top
  if (stickyEnabled.value && item?.type === 'column-headers') {
    if (stickyTop !== undefined) {
      return {
        position: 'sticky',
        top: `${stickyTop}px`,
        left: 0,
        width: '100%',
        zIndex: 30,
        ...(useDynamicHeight ? {} : { height: `${resolvedHeight}px` }),
        backgroundColor: 'var(--ui-bg)',
        // Shadow extends only above to cover subpixel gap at top
        boxShadow: '0 -1px 0 var(--ui-bg)',
      }
    }

    return {
      position: 'absolute',
      top: 0,
      width: '100%',
      zIndex: 30,
      ...(useDynamicHeight ? {} : { height: `${resolvedHeight}px` }),
      transform: `translateY(${virtualRow.start}px)`,
      backgroundColor: 'var(--ui-bg)',
    }
  }

  // Group headers get sticky behavior below column headers
  if (stickyEnabled.value && item?.type === 'group-header') {
    if (stickyTop !== undefined) {
      return {
        position: 'sticky',
        top: `${stickyTop}px`,
        width: '100%',
        zIndex: 20,
        ...(useDynamicHeight ? {} : { height: `${resolvedHeight}px` }),
        backgroundColor: 'var(--ui-bg)',
      }
    }

    return {
      position: 'absolute',
      top: 0,
      width: '100%',
      zIndex: 20,
      ...(useDynamicHeight ? {} : { height: `${resolvedHeight}px` }),
      transform: `translateY(${virtualRow.start}px)`,
      backgroundColor: 'var(--ui-bg)',
    }
  }

  return {
    position: 'absolute',
    top: 0,
    width: '100%',
    ...(useDynamicHeight ? {} : { height: `${resolvedHeight}px` }),
    transform: `translateY(${virtualRow.start}px)`,
  }
}

// Memoized ref callback for measuring elements with dynamic row heights
function measureElementRef(el: Element | ComponentPublicInstance | null) {
  if (el && virtualizer && virtualizer.value.dynamicRowHeightsEnabled.value) {
    virtualizer.value.measureElement(el as Element)
  }
}
</script>

<template>
  <!-- Reusable Group Subheader Template -->
  <DefineGroupSubheaderTemplate v-slot="{ groupId, groupRow, itemCount, depth = 0 }">
    <div
      :data-group-header="groupId"
      :class="ui.groupHeader({ class: [propsUi?.groupHeader] })"
      :style="{ width: `${tableApi.getTotalSize()}px` }"
    >
      <!-- Fixed left part (doesn't scroll horizontally) -->
      <div
        :class="ui.groupHeaderLeft({ class: [propsUi?.groupHeaderLeft] })"
        :style="{ paddingLeft: depth > 0 ? `${depth * 24}px` : undefined }"
      >
        <!-- Group selection checkbox -->
        <NuGridGroupCheckbox
          v-if="rowSelectionEnabled"
          :model-value="getGroupCheckboxState(groupId)"
          :aria-label="`Select all in group ${groupId}`"
          class="mr-2"
          @click.stop
          @update:model-value="
            (value: boolean | 'indeterminate') => toggleAllGroupRows(groupId, !!value)
          "
        />
        <div class="flex cursor-pointer items-center gap-3" @click="toggleGroup(groupId)">
          <UIcon
            :name="isGroupExpanded(groupId) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            :class="ui.groupIcon({ class: [propsUi?.groupIcon] })"
          />
          <template v-if="groupRow?.groupingColumnId">
            <span :class="ui.groupLabel({ class: [propsUi?.groupLabel] })">
              {{ upperFirst(groupRow.groupingColumnId) }}:
            </span>
            <span class="text-base font-semibold">
              {{ groupRow.getGroupingValue(groupRow.groupingColumnId) }}
            </span>
          </template>
          <span :class="ui.groupLabel({ class: [propsUi?.groupLabel] })">
            ({{ itemCount }} items)
          </span>
        </div>
      </div>
      <!-- Spacer that scrolls (optional, for visual continuity) -->
      <div :class="ui.groupHeaderSpacer({ class: [propsUi?.groupHeaderSpacer] })" />
    </div>
  </DefineGroupSubheaderTemplate>

  <!-- Reusable Header Cell Template -->
  <DefineHeaderCellTemplate v-slot="{ header, rowIndex }">
    <div
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
            rowIndex < headerGroupsLength - 1 ? 'rounded-b-none!' : '',
            headerGroupsLength > 1 && rowIndex === headerGroupsLength - 1 ? 'rounded-t-none!' : '',
            resolveValue(header.column.columnDef.meta?.class?.th, header),
          ],
          pinned: !!getHeaderEffectivePinning(header),
          colDragging: toValue(dragFns.draggedColumnId) === header.column.id,
          colDropTarget: toValue(dragFns.dropTargetColumnId) === header.column.id,
        }),
      ]"
      :style="{
        ...resolveStyleObject(header.column.columnDef.meta?.style?.th, header),
        ...getHeaderStyle(header),
        ...getHeaderPinningStyle(header),
        ...(header.rowSpan > 1 ? { alignSelf: 'stretch' } : {}),
      }"
      @dragover="
        (e: DragEvent) =>
          dragFns.isHeaderDraggable(header) && dragFns.handleColumnDragOver(e, header.column.id)
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
              (header.column.columnDef.sortIcons?.position ?? gridSortIcons?.position ?? 'edge')
              === 'inline'
            "
            :header="header"
            :sort-icons="header.column.columnDef.sortIcons"
          />
        </div>
        <NuGridHeaderSortButton
          v-if="
            (header.column.columnDef.sortIcons?.position ?? gridSortIcons?.position ?? 'edge')
            === 'edge'
          "
          :header="header"
          :sort-icons="header.column.columnDef.sortIcons"
        />
        <NuGridColumnMenu
          v-if="header.colSpan === 1 && rowIndex === headerGroupsLength - 1"
          :header="header"
        />

        <!-- Column resize handle (works for both regular columns and column groups) -->
        <div
          v-if="header.column.getCanResize() || header.colSpan > 1"
          :class="
            ui.colResizeHandle({
              class: [propsUi?.colResizeHandle],
              colResizing:
                header.colSpan > 1
                  ? resizingGroupId === header.id
                  : resizingColumnId === header.column.id || header.column.getIsResizing(),
            })
          "
          :data-col-resizing="
            header.colSpan > 1
              ? resizingGroupId === header.id
              : resizingColumnId === header.column.id || header.column.getIsResizing()
                ? 'true'
                : undefined
          "
          @mousedown="handleGroupResizeStart($event, header)"
          @touchstart.passive="handleGroupResizeStart($event, header)"
        >
          <div
            :class="
              ui.colResizer({
                class: [propsUi?.colResizer],
                colResizing:
                  header.colSpan > 1
                    ? resizingGroupId === header.id
                    : resizingColumnId === header.column.id || header.column.getIsResizing(),
              })
            "
            :data-col-resizing="
              header.colSpan > 1
                ? resizingGroupId === header.id
                : resizingColumnId === header.column.id || header.column.getIsResizing()
                  ? 'true'
                  : undefined
            "
          />
        </div>
      </div>
    </div>
  </DefineHeaderCellTemplate>

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

      <!-- Column headers shown once at the top (non-virtualized) -->
      <div
        v-if="!virtualizationEnabled"
        ref="columnHeadersRef"
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
          <ReuseHeaderCellTemplate
            v-for="header in headerGroup.headers"
            :key="header.id"
            :header="header"
            :row-index="rowIndex"
          />
        </div>
        <div :class="ui.separator({ class: [propsUi?.separator] })" />
      </div>

      <div
        data-tbody
        :class="ui.tbody({ class: [propsUi?.tbody] })"
        :style="
          virtualizationEnabled && virtualizer
            ? {
                height: `${virtualizer.getTotalSize()}px`,
                position: 'relative',
              }
            : undefined
        "
      >
        <slot name="body-top" />

        <template v-if="groupRows.length">
          <!-- Virtualized rendering -->
          <template v-if="virtualizationEnabled && virtualizer">
            <template v-for="virtualRow in virtualizer.getVirtualItems()" :key="virtualRow.index">
              <div
                :ref="
                  virtualizer && virtualizer.dynamicRowHeightsEnabled.value
                    ? measureElementRef
                    : undefined
                "
                :data-index="virtualRow.index"
                :style="virtStyle(virtualRow)"
              >
                <template v-if="virtualRowItems[virtualRow.index]">
                  <!-- Column Headers (shown once at top in virtualized mode) -->
                  <template v-if="virtualRowItems[virtualRow.index]?.type === 'column-headers'">
                    <div
                      :class="[
                        ui.thead({ class: [propsUi?.thead] }),
                        stickyEnabled
                          ? ui.stickyColumnHeader({ class: [propsUi?.stickyColumnHeader] })
                          : {},
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
                            'w-10 max-w-10 min-w-10 shrink-0',
                            ui.th({ class: [propsUi?.th] }),
                          ]"
                        />
                        <ReuseHeaderCellTemplate
                          v-for="header in headerGroup.headers"
                          :key="header.id"
                          :header="header"
                          :row-index="rowIndex"
                        />
                      </div>
                    </div>
                  </template>

                  <!-- Group Subheader -->
                  <ReuseGroupSubheaderTemplate
                    v-else-if="virtualRowItems[virtualRow.index]?.type === 'group-header'"
                    :group-id="virtualRowItems[virtualRow.index]?.groupId!"
                    :group-row="virtualRowItems[virtualRow.index]?.groupRow"
                    :item-count="
                      groupedRows[virtualRowItems[virtualRow.index]?.groupId!]?.filter(
                        (row) => !addRowContext.isAddRowRow(row),
                      ).length || 0
                    "
                    :depth="virtualRowItems[virtualRow.index]?.depth ?? 0"
                  />

                  <!-- Data Row -->
                  <component
                    :is="
                      addRowContext.isAddRowRow(virtualRowItems[virtualRow.index]?.dataRow!)
                        ? NuGridAddRow
                        : NuGridRow
                    "
                    v-else-if="
                      virtualRowItems[virtualRow.index]?.type === 'data'
                      && virtualRowItems[virtualRow.index]?.dataRow
                    "
                    :row="virtualRowItems[virtualRow.index]?.dataRow!"
                  />

                  <!-- Footer Row -->
                  <div
                    v-else-if="virtualRowItems[virtualRow.index]?.type === 'footer'"
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
                          ...getHeaderStyle(header),
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
              </div>
            </template>
          </template>

          <!-- Non-virtualized rendering -->
          <template v-else>
            <template v-for="item in virtualRowItems" :key="item.index">
              <!-- Group Subheader Row - uses measured column header height for accurate sticky positioning -->
              <div
                v-if="item.type === 'group-header'"
                :class="[stickyEnabled ? 'sticky top-(--header-height,0px) z-20 bg-default' : '']"
                :style="stickyEnabled ? { '--header-height': `${nonVirtStickyTop}px` } : {}"
              >
                <ReuseGroupSubheaderTemplate
                  :group-id="item.groupId!"
                  :group-row="item.groupRow"
                  :item-count="
                    groupedRows[item.groupId!]?.filter((row) => !addRowContext.isAddRowRow(row))
                      .length || 0
                  "
                  :depth="item.depth ?? 0"
                />
              </div>

              <!-- Data rows for this group (only if expanded) -->
              <template v-else-if="item.type === 'data' && item.dataRow">
                <component
                  :is="addRowContext.isAddRowRow(item.dataRow) ? NuGridAddRow : NuGridRow"
                  :key="item.dataRow.id"
                  :row="item.dataRow"
                />
              </template>
            </template>
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

      <!-- Footer (non-virtualized, only when not in groups or no data) -->
      <div
        v-if="hasFooter && !virtualizationEnabled && groupRows.length === 0"
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
                class: [propsUi?.th, resolveValue(header.column.columnDef.meta?.class?.th, header)],
                pinned: !!getHeaderEffectivePinning(header),
              }),
            ]"
            :style="{
              ...resolveStyleObject(header.column.columnDef.meta?.style?.th, header),
              ...getHeaderStyle(header),
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

  <Primitive
    ref="rootRef"
    :as="as"
    :class="[ui.root({ class: [propsUi?.root, props.class] }), scrollbarThemeClass, scrollbarClass]"
    :data-scrollbars="scrollbarAttr"
  >
    <ReuseNuGridTemplate />
  </Primitive>
</template>
