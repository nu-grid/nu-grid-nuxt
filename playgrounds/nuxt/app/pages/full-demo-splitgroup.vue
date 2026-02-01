<script setup lang="ts">
import type {
  NuGridActionMenuItem,
  NuGridColumn,
  NuGridGroupingOptions,
  NuGridRow,
} from '#nu-grid/types'
import type { User } from '~/types'
import { createColumnHelper } from '#nu-grid'
import { upperFirst } from 'scule'

const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const toast = useToast()
const table = useTemplateRef('table')
const editingEnabled = ref(false)
const startEditClicks = ref<'none' | 'single' | 'double'>('double')
const startEditKeys = ref<('enter' | 'f2' | 'bs' | 'alpha' | 'numeric')[]>([
  'enter',
  'f2',
  'bs',
  'alpha',
  'numeric',
])

// Autosize strategy
const autoSizeStrategy = ref<'content' | 'fill' | false>('fill')

const columnFilters = ref([
  {
    id: 'email',
    value: '',
  },
])
const columnVisibility = ref()
const selectedRows = ref({ 1: true })
const columnSizing = ref({})
const columnPinning = ref({
  left: ['__selection', 'id'],
  right: ['company', '__actions'],
})

const { data, status } = await useFetch<User[]>('/api/customers', {
  lazy: true,
  deep: true,
})

function getRowItems(row: NuGridRow<User>): NuGridActionMenuItem[] {
  return [
    {
      type: 'label',
      label: 'Actions',
    },
    {
      label: 'Copy customer ID',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText(row.original.id.toString())
        toast.add({
          title: 'Copied to clipboard',
          description: 'Customer ID copied to clipboard',
        })
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'View customer details',
      icon: 'i-lucide-list',
    },
    {
      label: 'View customer payments',
      icon: 'i-lucide-wallet',
    },
    {
      type: 'separator',
    },
    {
      label: 'Delete customer',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        toast.add({
          title: 'Customer deleted',
          description: 'The customer has been deleted.',
        })
      },
    },
  ]
}

const columnHelper = createColumnHelper<User>()

const columns2: NuGridColumn<User>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    minSize: 40,
    enableEditing: false,
    enableFocusing: false,
    aggregationFn: 'count',
    aggregatedCell: ({ getValue }) => `Count: ${getValue()}`,
    footer: ({ table }) => {
      const rows = table.getFilteredRowModel().rows
      return h('span', { class: 'font-semibold' }, `Total: ${rows.length}`)
    },
  },
  {
    accessorKey: 'name',
    header: 'Name',
    minSize: 40,
    enableSorting: true,
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          ...row.original.avatar,
          size: 'lg',
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted' }, row.original.name),
          h('p', { class: '' }, `@${row.original.name}`),
        ]),
      ])
    },
  },
  {
    accessorKey: 'email',
    minSize: 40,
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Email',
        trailing: true,
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      })
    },
  },
  {
    accessorKey: 'location',
    header: 'Location',
    minSize: 150,
    cell: ({ row }) => row.original.location,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filterFn: 'equals',
    minSize: 120,
    cell: ({ row }) => {
      const color = {
        subscribed: 'success',
        unsubscribed: 'error',
        bounced: 'warning',
      }[row.original.status]

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => row.original.status)
    },
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => {
      const values = getValue() as string[]
      return `${values.length} status types`
    },
    footer: ({ table }) => {
      const statusCounts = table.getFilteredRowModel().rows.reduce(
        (acc, row) => {
          const status = row.original.status
          acc[status] = (acc[status] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      return h('div', { class: 'text-xs space-y-1' }, [
        h('div', `✓ ${statusCounts.subscribed || 0} subscribed`),
        h('div', `✗ ${statusCounts.unsubscribed || 0} unsubscribed`),
        h('div', `⚠ ${statusCounts.bounced || 0} bounced`),
      ])
    },
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    minSize: 150,
    enableSorting: true,
    cell: ({ row }) => row.original.email,
  },
  {
    accessorKey: 'company',
    header: 'Company',
    minSize: 150,
    enableSorting: true,
    cell: ({ row }) => `${row.original.name.split(' ')[1]} Inc.`,
  },
]

const columns = [
  columnHelper.group({
    id: 'main',
    header: 'Customer Info',
    columns: columns2.slice(0, -2),
  }),
  columnHelper.group({
    id: 'second',
    header: 'Phone & Company',
    columns: columns2.slice(-2),
  }),
]

const statusFilter = ref('all')

watch(
  () => statusFilter.value,
  (newVal) => {
    if (!table?.value?.tableApi) return

    const statusColumn = table.value.tableApi.getColumn('status')
    if (!statusColumn) return

    if (newVal === 'all') {
      statusColumn.setFilterValue(undefined)
    } else {
      statusColumn.setFilterValue(newVal)
    }
  },
)

const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
})

const rowDraggingEnabled = ref(false)
const stickyHeadersEnabled = ref(false)
const macCursorPaging = ref(true)

const actionMenuOptions = computed(() => ({
  getActions: getRowItems,
}))

const rowDragOptions = computed(() => ({
  enabled: rowDraggingEnabled.value,
  sortOrderField: 'id',
  allowCrossGroup: true,
}))

const { focusMode, toggleFocusMode, focusModeIcon, focusModeLabel, focusModeStatus } =
  useFocusModeToggle()

function onRowDragged(event: any) {
  toast.add({
    title: 'Row Dragged',
    description: `Moved row from index ${event.originalIndex} to ${event.newIndex}${event.sourceGroup !== event.targetGroup ? ' (cross-group)' : ''}`,
  })
}

function editUser() {
  toast.add({
    title: 'Edit User',
    description: 'Edit User button clicked.',
  })
  if (data.value && data.value[1]) {
    data.value[1].name = 'Updated Name'
  }
}

function onCellValueChanged(event: { row: any; column: any; oldValue: any; newValue: any }) {
  toast.add({
    title: `Cell Value Changed in row ${event.row.index}`,
    description: `${event.column.id}: "${event.oldValue}" → "${event.newValue}"`,
  })
}

function triggerAutoSize() {
  if (table.value?.autoSizeColumns) {
    table.value.autoSizeColumns(autoSizeStrategy.value as 'content' | 'fill')
    toast.add({
      title: 'Columns Auto-sized',
      description: `Applied ${autoSizeStrategy.value} strategy`,
    })
  }
}

const grouping_options = ref<NuGridGroupingOptions>({
  groupedColumnMode: false,
})
</script>

<template>
  <UDashboardPanel id="customers">
    <template #header>
      <UDashboardNavbar title="Customers">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <CustomersAddModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex h-full flex-col">
        <div class="flex flex-wrap items-center justify-between gap-1.5">
          <UInput
            :model-value="table?.tableApi?.getColumn('email')?.getFilterValue() as string"
            class="max-w-sm"
            icon="i-lucide-search"
            placeholder="Filter emails..."
            @update:model-value="table?.tableApi?.getColumn('email')?.setFilterValue($event)"
          />

          <div class="flex flex-wrap items-center gap-1.5">
            <CustomersDeleteModal
              :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
            >
              <UButton
                v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
                label="Delete"
                color="error"
                variant="subtle"
                icon="i-lucide-trash"
              >
                <template #trailing>
                  <UKbd>
                    {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
                  </UKbd>
                </template>
              </UButton>
            </CustomersDeleteModal>
            <UButton @click="editUser"> Edit User </UButton>
            <UButton
              :color="editingEnabled ? 'primary' : 'neutral'"
              :variant="editingEnabled ? 'solid' : 'outline'"
              icon="i-lucide-pencil"
              @click="editingEnabled = !editingEnabled"
            >
              {{ editingEnabled ? 'Disable' : 'Enable' }} Editing
            </UButton>
            <USelect
              v-model="startEditClicks"
              :items="[
                { label: 'No Click Edit', value: 'none' },
                { label: 'Single Click Edit', value: 'single' },
                { label: 'Double Click Edit', value: 'double' },
              ]"
              placeholder="Edit Click Mode"
              class="min-w-40"
            />
            <UDropdownMenu
              :items="[
                {
                  label: 'Enter Key',
                  type: 'checkbox',
                  checked: startEditKeys.includes('enter'),
                  onUpdateChecked(checked: boolean) {
                    if (checked) {
                      startEditKeys.push('enter')
                    } else {
                      startEditKeys.splice(startEditKeys.indexOf('enter'), 1)
                    }
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault()
                  },
                },
                {
                  label: 'F2 Key',
                  type: 'checkbox',
                  checked: startEditKeys.includes('f2'),
                  onUpdateChecked(checked: boolean) {
                    if (checked) {
                      startEditKeys.push('f2')
                    } else {
                      startEditKeys.splice(startEditKeys.indexOf('f2'), 1)
                    }
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault()
                  },
                },
                {
                  label: 'Backspace/Delete',
                  type: 'checkbox',
                  checked: startEditKeys.includes('bs'),
                  onUpdateChecked(checked: boolean) {
                    if (checked) {
                      startEditKeys.push('bs')
                    } else {
                      startEditKeys.splice(startEditKeys.indexOf('bs'), 1)
                    }
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault()
                  },
                },
                {
                  label: 'Alpha Keys',
                  type: 'checkbox',
                  checked: startEditKeys.includes('alpha'),
                  onUpdateChecked(checked: boolean) {
                    if (checked) {
                      startEditKeys.push('alpha')
                    } else {
                      startEditKeys.splice(startEditKeys.indexOf('alpha'), 1)
                    }
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault()
                  },
                },
                {
                  label: 'Numeric Keys',
                  type: 'checkbox',
                  checked: startEditKeys.includes('numeric'),
                  onUpdateChecked(checked: boolean) {
                    if (checked) {
                      startEditKeys.push('numeric')
                    } else {
                      startEditKeys.splice(startEditKeys.indexOf('numeric'), 1)
                    }
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault()
                  },
                },
              ]"
              :content="{ align: 'end' }"
            >
              <UButton color="neutral" variant="outline" trailing-icon="i-lucide-chevron-down">
                Edit Keys
              </UButton>
            </UDropdownMenu>
            <UButton
              :color="rowDraggingEnabled ? 'primary' : 'neutral'"
              :variant="rowDraggingEnabled ? 'solid' : 'outline'"
              icon="i-lucide-grip-vertical"
              @click="rowDraggingEnabled = !rowDraggingEnabled"
            >
              {{ rowDraggingEnabled ? 'Disable' : 'Enable' }} Row Drag
            </UButton>
            <UButton
              :color="stickyHeadersEnabled ? 'primary' : 'neutral'"
              :variant="stickyHeadersEnabled ? 'solid' : 'outline'"
              icon="i-lucide-pin"
              @click="stickyHeadersEnabled = !stickyHeadersEnabled"
            >
              {{ stickyHeadersEnabled ? 'Disable' : 'Enable' }} Sticky Headers
            </UButton>
            <UButton
              :color="macCursorPaging ? 'primary' : 'neutral'"
              :variant="macCursorPaging ? 'solid' : 'outline'"
              icon="i-lucide-keyboard"
              @click="macCursorPaging = !macCursorPaging"
            >
              {{ macCursorPaging ? 'Mac' : 'Grid' }} Cursor Paging
            </UButton>
            <UButton
              color="neutral"
              variant="outline"
              :icon="focusModeIcon"
              :aria-label="focusModeStatus"
              @click="toggleFocusMode"
            >
              Focus: {{ focusModeLabel }}
            </UButton>
            <NuGridColumnPinningControl :grid-ref="table" />

            <div class="flex items-center gap-1.5">
              <USelect
                v-model="autoSizeStrategy"
                :items="[
                  { label: 'Content Width', value: 'content' },
                  { label: 'Fill Container', value: 'fill' },
                  { label: 'No Autosize', value: false },
                ]"
                :ui="{
                  trailingIcon:
                    'group-data-[state=open]:rotate-180 transition-transform duration-200',
                }"
                placeholder="Autosize Mode"
                class="min-w-44"
              />
              <UButton
                v-if="autoSizeStrategy"
                icon="i-lucide-maximize"
                color="neutral"
                variant="outline"
                @click="triggerAutoSize"
              >
                Apply
              </UButton>
            </div>

            <USelect
              v-model="statusFilter"
              :items="[
                { label: 'All', value: 'all' },
                { label: 'Subscribed', value: 'subscribed' },
                { label: 'Unsubscribed', value: 'unsubscribed' },
                { label: 'Bounced', value: 'bounced' },
              ]"
              :ui="{
                trailingIcon:
                  'group-data-[state=open]:rotate-180 transition-transform duration-200',
              }"
              placeholder="Filter status"
              class="min-w-28"
            />
            <UDropdownMenu
              :items="
                table?.tableApi
                  ?.getAllColumns()
                  .filter((column: any) => column.getCanHide())
                  .map((column: any) => ({
                    label: upperFirst(column.id),
                    type: 'checkbox',
                    checked: column.getIsVisible(),
                    onUpdateChecked(checked: boolean) {
                      table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                    },
                    onSelect(e?: Event) {
                      e?.preventDefault()
                    },
                  }))
              "
              :content="{ align: 'end' }"
            >
              <UButton
                label="Display"
                color="neutral"
                variant="outline"
                trailing-icon="i-lucide-settings-2"
              />
            </UDropdownMenu>
          </div>
        </div>

        <div class="mt-4 min-h-0 flex-1">
          <NuGrid
            ref="table"
            v-model:column-filters="columnFilters"
            v-model:column-visibility="columnVisibility"
            v-model:selected-rows="selectedRows"
            v-model:pagination="pagination"
            v-model:column-sizing="columnSizing"
            v-model:column-pinning="columnPinning"
            :focus="{ mode: focusMode, cmdArrows: macCursorPaging ? 'paging' : 'firstlast' }"
            :layout="{
              mode: 'splitgroup',
              resizeMode: 'shift',
              stickyHeaders: stickyHeadersEnabled,
              autoSize:
                autoSizeStrategy === 'content'
                  ? 'content'
                  : autoSizeStrategy === 'fill'
                    ? 'fill'
                    : false,
            }"
            row-selection="multi"
            :editing="{
              enabled: editingEnabled,
              startKeys: startEditKeys,
              startClicks: startEditClicks,
            }"
            :actions="actionMenuOptions"
            :row-drag-options="rowDragOptions"
            :column-sizing-options="{
              columnResizeMode: 'onChange',
            }"
            virtualization
            :data="data"
            :columns="columns"
            :loading="status === 'pending'"
            :grouping="['status']"
            :grouping-options="grouping_options"
            :ui="{
              base: 'w-max border-separate border-spacing-0',
              thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
              tbody: '[&>tr]:last:[&>td]:border-b-0',
              th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
              td: 'border-b border-default',
              separator: 'h-0',
            }"
            @row-dragged="onRowDragged"
            @cell-value-changed="onCellValueChanged"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped></style>
