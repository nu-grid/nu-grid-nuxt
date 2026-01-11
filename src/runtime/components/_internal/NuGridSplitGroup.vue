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
  NuGridUIConfigContext,
  NuGridVirtualItemStyle,
  NuGridVirtualizationContext,
} from '../../types/_internal'

import { FlexRender } from '@tanstack/vue-table'
import { createReusableTemplate } from '@vueuse/core'
import { Primitive } from 'reka-ui'
import { upperFirst } from 'scule'
import { computed, h, inject, toValue } from 'vue'
import {
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
const addRowContext = inject<NuGridAddRowContext<T>>('nugrid-add-row')!

if (
  !coreContext
  || !dragContext
  || !resizeContext
  || !virtualizationContext
  || !groupingContext
  || !performanceContext
  || !uiConfigContext
  || !addRowContext
) {
  throw new Error('NuGridSplitGroup must be used within a NuGrid component.')
}

// Destructure from contexts
const { tableRef, rootRef, tableApi, ui, hasFooter, propsUi } = coreContext
const { dragFns, rowDragOptions } = dragContext
const { handleGroupResizeStart, resizingGroupId, resizingColumnId } = resizeContext
const { stickyEnabled } = virtualizationContext
const { groupingFns } = groupingContext
const { headerGroupsLength } = performanceContext
const {
  sortIcons: gridSortIcons,
  scrollbarClass,
  scrollbarThemeClass,
  scrollbarAttr,
} = uiConfigContext

const [DefineTableTemplate, ReuseNuGridTemplate] = createReusableTemplate({ inheritAttrs: false })

// Reusable template for group header
const [DefineGroupHeaderTemplate, ReuseGroupHeaderTemplate] = createReusableTemplate<{
  groupId: string
  groupRow?: Row<T>
  itemCount: number
  depth?: number
}>({ inheritAttrs: false })

// Reusable template for header cell
const [DefineHeaderCellTemplate, ReuseHeaderCellTemplate] = createReusableTemplate<{
  header: Header<T, unknown>
  groupId: string
  isExpanded: boolean
  rowIndex: number
}>({ inheritAttrs: false })

// Reusable template for footer cell
const [DefineFooterCellTemplate, ReuseFooterCellTemplate] = createReusableTemplate<{
  header: Header<T, unknown>
  index: number
  isExpanded: boolean
}>({ inheritAttrs: false })

// Use grouping functions from context (created in parent NuGrid.vue)
if (!groupingFns) {
  throw new Error(
    'NuGridSplitGroup requires groupingFns from context. Ensure gridMode="group" is set on NuGrid.',
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
} = groupingFns

const dynamicRowHeightsEnabled = computed(() => {
  if (!virtualizer || !virtualizer.value.dynamicRowHeightsEnabled) {
    return false
  }
  return !!virtualizer.value.dynamicRowHeightsEnabled.value
})

// Group-aware row selection
const { toggleAllGroupRows, getGroupCheckboxState } = useNuGridGroupSelection(tableApi, groupedRows)

// Helper to render group-aware select column header
function renderGroupSelectHeader(header: any, groupId: string) {
  // Only handle the selection column
  if (header.column.id !== '__selection') {
    // For non-select columns, execute the header function to get the VNode
    if (typeof header.column.columnDef.header === 'function') {
      const rendered = header.column.columnDef.header(header.getContext())
      // Protect against empty string/undefined header functions which create invalid VNodes
      if (rendered === '' || rendered === undefined || rendered === null) {
        return h('span')
      }
      return typeof rendered === 'string' ? h('span', {}, rendered) : rendered
    }

    // If it's a string or other type, wrap it in a span to ensure a valid VNode
    if (typeof header.column.columnDef.header === 'string') {
      return h('span', {}, header.column.columnDef.header)
    }

    return h('span')
  }

  // Render group-aware checkbox for select column
  return h(NuGridGroupCheckbox, {
    'modelValue': getGroupCheckboxState(groupId),
    'onUpdate:modelValue': (value: boolean | 'indeterminate') => {
      toggleAllGroupRows(groupId, !!value)
    },
    'ariaLabel': `Select all in group ${groupId}`,
  })
}

function virtStyle(virtualRow: VirtualItem): NuGridVirtualItemStyle {
  const item = virtualRowItems.value[virtualRow.index]
  const useDynamicHeight = dynamicRowHeightsEnabled.value
  const stickyTop = stickyOffsets.value.get(virtualRow.index)
  const resolvedHeight = getVirtualItemHeight(virtualRow.index)

  if (stickyEnabled.value && (item?.type === 'group-header' || item?.type === 'column-headers')) {
    if (stickyTop !== undefined) {
      return {
        position: 'sticky',
        top: `${stickyTop}px`,
        left: 0,
        width: '100%',
        zIndex: 10,
        ...(useDynamicHeight ? {} : { height: `${resolvedHeight}px` }),
        backgroundColor: 'var(--ui-bg)',
      }
    }

    return {
      position: 'absolute',
      top: 0,
      width: '100%',
      zIndex: 40,
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
  <!-- Reusable Group Header Template -->
  <DefineGroupHeaderTemplate v-slot="{ groupId, groupRow, itemCount, depth = 0 }">
    <div
      :data-group-header="groupId"
      :class="ui.groupHeader({ class: [propsUi?.groupHeader] })"
      :style="{ width: `${tableApi.getTotalSize()}px` }"
      @click="toggleGroup(groupId)"
    >
      <!-- Fixed left part (doesn't scroll horizontally) -->
      <div
        :class="[
          ui.groupHeaderLeft({ class: [propsUi?.groupHeaderLeft] }),
          ui.td({ class: [propsUi?.td] }),
        ]"
        :style="{ paddingLeft: depth > 0 ? `${depth * 24}px` : undefined }"
      >
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
      <!-- Spacer that scrolls (optional, for visual continuity) -->
      <div :class="ui.groupHeaderSpacer({ class: [propsUi?.groupHeaderSpacer] })" />
    </div>
  </DefineGroupHeaderTemplate>

  <!-- Reusable Header Cell Template -->
  <DefineHeaderCellTemplate v-slot="{ header, groupId, isExpanded, rowIndex }">
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
          class: [propsUi?.th, resolveValue(header.column.columnDef.meta?.class?.th, header)],
          pinned: !!getHeaderEffectivePinning(header),
          colDragging: toValue(dragFns.draggedColumnId) === header.column.id,
          colDropTarget: toValue(dragFns.dropTargetColumnId) === header.column.id,
        }),
      ]"
      :style="{
        ...resolveStyleObject(header.column.columnDef.meta?.style?.th, header),
        // Use header.getSize() for all headers - it returns the sum of leaf column widths for group headers
        width: `${header.getSize()}px`,
        minWidth: `${header.getSize()}px`,
        maxWidth: `${header.getSize()}px`,
        ...getHeaderPinningStyle(header, { includeZIndex: isExpanded }),
        ...(isExpanded && header.rowSpan > 1 ? { alignSelf: 'stretch' } : {}),
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
            <component
              :is="header.isPlaceholder ? 'span' : renderGroupSelectHeader(header, groupId)"
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

  <!-- Reusable Footer Cell Template -->
  <DefineFooterCellTemplate v-slot="{ header, index, isExpanded }">
    <div
      :data-pinned="header.column.getIsPinned()"
      :class="[
        ui.collapsedHeaderCell({ class: [propsUi?.collapsedHeaderCell] }),
        ui.td({ class: [propsUi?.td], pinned: !!header.column.getIsPinned() }),
      ]"
      :style="{
        width: `${header.getSize()}px`,
        minWidth: `${header.getSize()}px`,
        maxWidth: `${header.getSize()}px`,
        ...(header.column.getIsPinned() === 'left'
          ? { left: `${header.column.getStart('left')}px` }
          : {}),
        ...(header.column.getIsPinned() === 'right'
          ? { right: `${header.column.getAfter('right')}px` }
          : {}),
      }"
    >
      <!-- Collapsed state: show summary with Σ column.id -->
      <div v-if="!isExpanded" :class="ui.collapsedText({ class: [propsUi?.collapsedText] })">
        <template v-if="index === 0"> Summary </template>
        <template v-else> Σ {{ header.column.id }} </template>
      </div>
      <!-- Expanded state: show actual footer content -->
      <div v-else :class="ui.expandedText({ class: [propsUi?.expandedText] })">
        <slot :name="`${header.id}-footer`" v-bind="header.getContext()">
          <FlexRender
            v-if="!header.isPlaceholder && header.column.columnDef.footer"
            :render="header.column.columnDef.footer"
            :props="header.getContext()"
          />
          <template v-else-if="index === 0">
            <span class="italic">Summary</span>
          </template>
        </slot>
      </div>
    </div>
  </DefineFooterCellTemplate>

  <DefineTableTemplate>
    <div ref="tableRef" :class="ui.base({ class: [propsUi?.base] })">
      <div v-if="caption || !!slots.caption" :class="ui.caption({ class: [propsUi?.caption] })">
        <slot name="caption">
          {{ caption }}
        </slot>
      </div>

      <!-- Top-level headers are not shown since we show them inside each group -->

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
                  <!-- Group Header -->
                  <ReuseGroupHeaderTemplate
                    v-if="virtualRowItems[virtualRow.index]?.type === 'group-header'"
                    :group-id="virtualRowItems[virtualRow.index]?.groupId!"
                    :group-row="virtualRowItems[virtualRow.index]?.groupRow"
                    :item-count="
                      groupedRows[virtualRowItems[virtualRow.index]?.groupId!]?.filter(
                        (row) => !addRowContext.isAddRowRow(row),
                      ).length || 0
                    "
                    :depth="virtualRowItems[virtualRow.index]?.depth ?? 0"
                  />

                  <!-- Column Headers -->
                  <template
                    v-else-if="virtualRowItems[virtualRow.index]?.type === 'column-headers'"
                  >
                    <!-- Collapsed state -->
                    <div
                      v-if="!isGroupExpanded(virtualRowItems[virtualRow.index]?.groupId!)"
                      :class="ui.thead({ class: [propsUi?.thead, 'border-t-0 border-b-0'] })"
                      :data-sticky-header="stickyEnabled ? 'true' : undefined"
                    >
                      <div :class="ui.tr({ class: propsUi?.tr })">
                        <!-- Drag handle header placeholder -->
                        <div
                          v-if="rowDragOptions.enabled"
                          :class="[
                            'w-10 max-w-10 min-w-10 shrink-0',
                            ui.th({ class: [propsUi?.th] }),
                          ]"
                        />
                        <ReuseHeaderCellTemplate
                          v-for="header in tableApi.getHeaderGroups()[
                            tableApi.getHeaderGroups().length - 1
                          ]?.headers || []"
                          :key="header.id"
                          :header="header"
                          :group-id="virtualRowItems[virtualRow.index]?.groupId!"
                          :is-expanded="false"
                          :row-index="tableApi.getHeaderGroups().length - 1"
                        />
                      </div>
                    </div>

                    <!-- Expanded state -->
                    <div
                      v-else
                      :class="ui.thead({ class: [propsUi?.thead, 'border-t-0'] })"
                      :data-sticky-header="stickyEnabled ? 'true' : undefined"
                    >
                      <div
                        v-for="(headerGroup, rowIndex) in tableApi.getHeaderGroups()"
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
                          :group-id="virtualRowItems[virtualRow.index]?.groupId!"
                          :is-expanded="true"
                          :row-index="rowIndex"
                        />
                      </div>
                    </div>
                  </template>

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
                    :class="
                      ui.tr({
                        class: [
                          propsUi?.tr,
                          'bg-elevated/20',
                          !isGroupExpanded(virtualRowItems[virtualRow.index]?.groupId!)
                            ? 'border-t-0'
                            : 'border-t border-default',
                        ],
                      })
                    "
                  >
                    <ReuseFooterCellTemplate
                      v-for="(header, index) in tableApi.getHeaderGroups()[
                        tableApi.getHeaderGroups().length - 1
                      ]?.headers || []"
                      :key="index"
                      :header="header"
                      :index="index"
                      :is-expanded="isGroupExpanded(virtualRowItems[virtualRow.index]?.groupId!)"
                    />
                  </div>
                </template>
              </div>
            </template>
          </template>

          <!-- Non-virtualized rendering (existing logic) -->
          <template v-else>
            <template v-for="item in virtualRowItems" :key="item.index">
              <!-- Group Header -->
              <template v-if="item.type === 'group-header'">
                <div :class="['flex flex-col']">
                  <!-- Combined sticky container for group header and column headers -->
                  <div
                    :class="[
                      stickyEnabled
                        ? ui.stickyGroupHeader({ class: [propsUi?.stickyGroupHeader] })
                        : 'bg-default',
                    ]"
                  >
                    <!-- Group Header Row with fixed left side -->
                    <ReuseGroupHeaderTemplate
                      :group-id="item.groupId!"
                      :group-row="item.groupRow"
                      :item-count="
                        groupedRows[item.groupId!]?.filter((row) => !addRowContext.isAddRowRow(row))
                          .length || 0
                      "
                      :depth="item.depth ?? 0"
                    />
                    <!-- Collapsed state -->
                    <template v-if="!isGroupExpanded(item.groupId!)">
                      <div
                        :class="ui.thead({ class: [propsUi?.thead, 'border-t-0 border-b-0'] })"
                        :data-sticky-header="stickyEnabled ? 'true' : undefined"
                      >
                        <div :class="ui.tr({ class: propsUi?.tr })">
                          <!-- Drag handle header placeholder -->
                          <div
                            v-if="rowDragOptions.enabled"
                            :class="[
                              'w-10 max-w-10 min-w-10 shrink-0',
                              ui.th({ class: [propsUi?.th] }),
                            ]"
                          />
                          <ReuseHeaderCellTemplate
                            v-for="header in tableApi.getHeaderGroups()[
                              tableApi.getHeaderGroups().length - 1
                            ]?.headers || []"
                            :key="header.id"
                            :header="header"
                            :group-id="item.groupId!"
                            :is-expanded="false"
                            :row-index="tableApi.getHeaderGroups().length - 1"
                          />
                        </div>
                      </div>
                    </template>

                    <!-- Expanded state -->
                    <template v-else>
                      <div
                        :class="ui.thead({ class: [propsUi?.thead, 'border-t-0'] })"
                        :data-sticky-header="stickyEnabled ? 'true' : undefined"
                      >
                        <div
                          v-for="(headerGroup, rowIndex) in tableApi.getHeaderGroups()"
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
                            :group-id="item.groupId!"
                            :is-expanded="true"
                            :row-index="rowIndex"
                          />
                        </div>
                      </div>
                    </template>
                  </div>

                  <!-- Collapsed state summary row -->
                  <div
                    v-if="!isGroupExpanded(item.groupId!)"
                    :class="ui.tr({ class: [propsUi?.tr, 'bg-elevated/20 border-t-0'] })"
                  >
                    <ReuseFooterCellTemplate
                      v-for="(header, index) in tableApi.getHeaderGroups()[
                        tableApi.getHeaderGroups().length - 1
                      ]?.headers || []"
                      :key="index"
                      :header="header"
                      :index="index"
                      :is-expanded="false"
                    />
                  </div>

                  <!-- Data rows and nested groups are handled by virtualRowItems iteration -->
                  <!-- Footer is rendered separately when we encounter footer items -->
                </div>
              </template>

              <!-- Data Row -->
              <template v-else-if="item.type === 'data' && item.dataRow">
                <component
                  :is="addRowContext.isAddRowRow(item.dataRow) ? NuGridAddRow : NuGridRow"
                  :row="item.dataRow"
                />
              </template>

              <!-- Footer Row -->
              <template v-else-if="item.type === 'footer'">
                <div
                  :class="
                    ui.tr({
                      class: [
                        propsUi?.tr,
                        'bg-elevated/20',
                        !isGroupExpanded(item.groupId!) ? 'border-t-0' : 'border-t border-default',
                      ],
                    })
                  "
                >
                  <ReuseFooterCellTemplate
                    v-for="(header, index) in tableApi.getHeaderGroups()[
                      tableApi.getHeaderGroups().length - 1
                    ]?.headers || []"
                    :key="index"
                    :header="header"
                    :index="index"
                    :is-expanded="isGroupExpanded(item.groupId!)"
                  />
                </div>
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

      <div
        v-if="hasFooter && groupRows.length === 0"
        :class="ui.tfoot({ class: [propsUi?.tfoot] })"
        :style="
          virtualizationEnabled && virtualizer
            ? {
                transform: `translateY(${virtualizer.getTotalSize() - virtualizer.getVirtualItems().length * (virtualizer.props.value.estimateSize ?? 0)}px)`,
              }
            : undefined
        "
      >
        <div :class="ui.separator({ class: [propsUi?.separator] })" />

        <div
          v-for="footerGroup in tableApi.getFooterGroups()"
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
              width: `${header.getSize()}px`,
              minWidth: `${header.getSize()}px`,
              maxWidth: `${header.getSize()}px`,
              ...getHeaderPinningStyle(header),
              ...(header.colSpan > 1 ? { flexGrow: header.colSpan } : {}),
              ...(header.rowSpan > 1 ? { alignSelf: 'stretch' } : {}),
            }"
          >
            <div class="w-full truncate">
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
