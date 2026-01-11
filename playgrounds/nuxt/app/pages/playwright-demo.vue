<script setup lang="ts">
import type { NuGridActionMenuItem, NuGridColumn, NuGridRow } from '#nu-grid/types'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const table = useTemplateRef('table')

// Data interface with all data types
interface DemoRow {
  id: number
  name: string
  email: string
  price: number
  quantity: number
  rating: number
  discount: number
  releaseDate: string
  lastUpdated: string
  inStock: boolean
  featured: boolean
  status: 'active' | 'inactive' | 'pending'
  category: string
  notes: string
}

// Generate 100 rows of inline data
const firstNames = [
  'Alice',
  'Bob',
  'Charlie',
  'Diana',
  'Eve',
  'Frank',
  'Grace',
  'Henry',
  'Ivy',
  'Jack',
]
const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
]
const categories = [
  'Electronics',
  'Clothing',
  'Food',
  'Books',
  'Sports',
  'Home',
  'Garden',
  'Toys',
  'Health',
  'Beauty',
]
const statuses: ('active' | 'inactive' | 'pending')[] = ['active', 'inactive', 'pending']

function generateData(): DemoRow[] {
  const rows: DemoRow[] = []
  for (let i = 1; i <= 100; i++) {
    const firstName = firstNames[i % firstNames.length]!
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length]!
    const name = `${firstName} ${lastName}`
    rows.push({
      id: i,
      name,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      price: Math.round((Math.random() * 1000 + 10) * 100) / 100,
      quantity: Math.floor(Math.random() * 200),
      rating: Math.round((Math.random() * 4 + 1) * 10) / 10,
      discount: Math.floor(Math.random() * 50),
      releaseDate: new Date(
        2023,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1,
      )
        .toISOString()
        .split('T')[0]!,
      lastUpdated: new Date(
        2024,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1,
      )
        .toISOString()
        .split('T')[0]!,
      inStock: Math.random() > 0.3,
      featured: Math.random() > 0.7,
      status: statuses[i % statuses.length]! as 'active' | 'inactive' | 'pending',
      category: categories[i % categories.length]!,
      notes: `Note for item ${i}`,
    })
  }
  return rows
}

const data = ref<DemoRow[]>(generateData())

// Feature states
const editingEnabled = ref(true)
const rowDraggingEnabled = ref(true)
const stickyHeadersEnabled = ref(true)
const macCursorPaging = ref(true)
const startEditClicks = ref<'none' | 'single' | 'double'>('double')
const startEditKeys = ref<('enter' | 'f2' | 'bs' | 'alpha' | 'numeric')[]>([
  'enter',
  'f2',
  'alpha',
  'numeric',
])
const autoSizeStrategy = ref<'fitCell' | 'fitGrid' | false>('fitGrid')

// State models
const columnFilters = ref([{ id: 'email', value: '' }])
const columnVisibility = ref()
const rowSelection = ref({ 1: true })
const columnSizing = ref({})
const columnPinning = ref({
  left: ['select', 'id'],
  right: ['__actions'],
})

const { focusMode, toggleFocusMode, focusModeIcon, focusModeLabel, focusModeStatus } =
  useFocusModeToggle()

function getRowItems(row: NuGridRow<DemoRow>): NuGridActionMenuItem[] {
  return [
    { type: 'label', label: 'Actions' },
    {
      label: 'Copy ID',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText(row.original.id.toString())
        toast.add({ title: 'Copied', description: 'ID copied to clipboard' })
      },
    },
    { type: 'separator' },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        toast.add({ title: 'Deleted', description: `Deleted row ${row.original.id}` })
      },
    },
  ]
}

const columns: NuGridColumn<DemoRow>[] = [
  {
    id: 'select',
    minSize: 40,
    enableEditing: false,
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all',
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Select row',
      }),
  },
  {
    accessorKey: 'id',
    header: 'ID',
    minSize: 60,
    maxSize: 80,
    enableEditing: false,
    enableFocusing: false,
    cellDataType: 'number',
  },
  {
    accessorKey: 'name',
    header: 'Name',
    minSize: 120,
    cellDataType: 'text',
  },
  {
    accessorKey: 'email',
    minSize: 180,
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
    cellDataType: 'text',
  },
  {
    accessorKey: 'price',
    header: 'Price ($)',
    minSize: 100,
    cellDataType: 'number',
    cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
  },
  {
    accessorKey: 'quantity',
    header: 'Quantity',
    minSize: 90,
    cellDataType: 'number',
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    minSize: 80,
    cellDataType: 'number',
    cell: ({ row }) => `⭐ ${row.original.rating}`,
  },
  {
    accessorKey: 'discount',
    header: 'Discount %',
    minSize: 100,
    cellDataType: 'number',
    cell: ({ row }) => `${row.original.discount}%`,
  },
  {
    accessorKey: 'releaseDate',
    header: 'Release Date',
    minSize: 120,
    cellDataType: 'date',
    cell: ({ row }) => new Date(row.original.releaseDate).toLocaleDateString(),
  },
  {
    accessorKey: 'lastUpdated',
    header: 'Last Updated',
    minSize: 120,
    cellDataType: 'date',
    cell: ({ row }) => new Date(row.original.lastUpdated).toLocaleDateString(),
  },
  {
    accessorKey: 'inStock',
    header: 'In Stock',
    minSize: 90,
    cellDataType: 'boolean',
  },
  {
    accessorKey: 'featured',
    header: 'Featured',
    minSize: 90,
    cellDataType: 'boolean',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filterFn: 'equals',
    minSize: 100,
    cellDataType: 'text',
    cell: ({ row }) => {
      const color = {
        active: 'success',
        inactive: 'error',
        pending: 'warning',
      }[row.original.status]
      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => row.original.status)
    },
  },
  {
    accessorKey: 'category',
    header: 'Category',
    minSize: 100,
    cellDataType: 'text',
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
    minSize: 150,
    cellDataType: 'text',
  },
]

const actionMenuOptions = computed(() => ({
  getActions: getRowItems,
}))

const rowDragOptions = computed(() => ({
  enabled: rowDraggingEnabled.value,
  sortOrderField: 'id',
}))

function onRowDragged(event: any) {
  toast.add({
    title: 'Row Dragged',
    description: `Moved row from index ${event.originalIndex} to ${event.newIndex}`,
  })
}

function onCellValueChanged(event: { row: any; column: any; oldValue: any; newValue: any }) {
  toast.add({
    title: 'Cell Value Changed',
    description: `${event.column.id}: "${event.oldValue}" → "${event.newValue}"`,
  })
}

function triggerAutoSize() {
  if (table.value?.autoSizeColumns) {
    table.value.autoSizeColumns(autoSizeStrategy.value as 'fitCell' | 'fitGrid')
    toast.add({
      title: 'Columns Auto-sized',
      description: `Applied ${autoSizeStrategy.value} strategy`,
    })
  }
}
</script>

<template>
  <DemoLayout id="playwright-demo" title="Playwright Demo" sidebar-width="300px">
    <template #status>
      <DemoStatusItem label="Rows" :value="data.length" />
      <DemoStatusItem label="Editing" :value="editingEnabled" boolean />
      <DemoStatusItem label="Row Dragging" :value="rowDraggingEnabled" boolean />
      <DemoStatusItem label="Sticky Headers" :value="stickyHeadersEnabled" boolean />
      <DemoStatusItem label="Cursor Paging" :value="macCursorPaging ? 'Mac' : 'Grid'" />
      <DemoStatusItem label="Focus Mode" :value="focusModeLabel" />
      <DemoStatusItem
        label="Selected"
        :value="`${table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0} / ${table?.tableApi?.getFilteredRowModel().rows.length || 0}`"
      />
    </template>

    <template #controls>
      <DemoControlGroup label="Filter">
        <UInput
          :model-value="table?.tableApi?.getColumn('email')?.getFilterValue() as string"
          icon="i-lucide-search"
          placeholder="Filter emails..."
          @update:model-value="table?.tableApi?.getColumn('email')?.setFilterValue($event)"
        />
      </DemoControlGroup>

      <DemoControlGroup label="Features">
        <UButton
          :color="editingEnabled ? 'primary' : 'neutral'"
          :variant="editingEnabled ? 'solid' : 'outline'"
          icon="i-lucide-pencil"
          block
          @click="editingEnabled = !editingEnabled"
        >
          {{ editingEnabled ? 'Disable' : 'Enable' }} Editing
        </UButton>

        <UButton
          :color="rowDraggingEnabled ? 'primary' : 'neutral'"
          :variant="rowDraggingEnabled ? 'solid' : 'outline'"
          icon="i-lucide-grip-vertical"
          block
          @click="rowDraggingEnabled = !rowDraggingEnabled"
        >
          {{ rowDraggingEnabled ? 'Disable' : 'Enable' }} Row Drag
        </UButton>

        <UButton
          :color="stickyHeadersEnabled ? 'primary' : 'neutral'"
          :variant="stickyHeadersEnabled ? 'solid' : 'outline'"
          icon="i-lucide-pin"
          block
          @click="stickyHeadersEnabled = !stickyHeadersEnabled"
        >
          {{ stickyHeadersEnabled ? 'Disable' : 'Enable' }} Sticky
        </UButton>

        <UButton
          :color="macCursorPaging ? 'primary' : 'neutral'"
          :variant="macCursorPaging ? 'solid' : 'outline'"
          icon="i-lucide-keyboard"
          block
          @click="macCursorPaging = !macCursorPaging"
        >
          {{ macCursorPaging ? 'Mac' : 'Grid' }} Cursor Paging
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Focus Mode">
        <UButton
          color="neutral"
          variant="outline"
          :icon="focusModeIcon"
          :aria-label="focusModeStatus"
          block
          @click="toggleFocusMode"
        >
          Focus: {{ focusModeLabel }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Column Pinning">
        <NuGridColumnPinningControl :grid-ref="table" />
      </DemoControlGroup>

      <DemoControlGroup label="Column Sizing">
        <USelect
          v-model="autoSizeStrategy"
          :items="[
            { label: 'Fit Cell Contents', value: 'fitCell' },
            { label: 'Fit Grid Width', value: 'fitGrid' },
            { label: 'No Autosize', value: false },
          ]"
          placeholder="Autosize Mode"
          class="w-full"
        />
        <UButton
          v-if="autoSizeStrategy"
          icon="i-lucide-maximize"
          color="primary"
          variant="solid"
          block
          @click="triggerAutoSize"
        >
          Apply AutoSize
        </UButton>
      </DemoControlGroup>
    </template>

    <template #info>
      <p class="mb-3 text-sm text-muted">
        This page is used for <strong>Playwright end-to-end testing</strong> of NuGrid features. It
        contains 100 rows of sample data with all major features enabled.
      </p>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Features Tested:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li>Row selection with checkboxes</li>
          <li>Cell editing with various data types</li>
          <li>Row dragging and reordering</li>
          <li>Column pinning, resizing, and reordering</li>
          <li>Virtualization for large datasets</li>
          <li>Focus mode navigation</li>
          <li>Action menu dropdown</li>
        </ul>
      </div>
    </template>

    <NuGrid
      ref="table"
      v-model:column-filters="columnFilters"
      v-model:column-visibility="columnVisibility"
      v-model:row-selection="rowSelection"
      v-model:column-sizing="columnSizing"
      v-model:column-pinning="columnPinning"
      :focus="{ mode: focusMode, cmdArrows: macCursorPaging ? 'paging' : 'firstlast' }"
      :layout="{
        mode: 'div',
        maintainWidth: true,
        stickyHeaders: stickyHeadersEnabled,
        autoSize:
          autoSizeStrategy === 'fitCell'
            ? 'fitCell'
            : autoSizeStrategy === 'fitGrid'
              ? 'fitGrid'
              : false,
      }"
      resize-columns
      reorder-columns
      :editing="{
        enabled: editingEnabled,
        startKeys: startEditKeys,
        startClicks: startEditClicks,
      }"
      :actions="actionMenuOptions"
      :row-drag-options="rowDragOptions"
      :column-sizing-options="{ columnResizeMode: 'onChange' }"
      virtualization
      :data="data"
      :columns="columns"
      :ui="{
        base: 'w-max min-w-0 border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default',
        separator: 'h-0',
      }"
      @row-dragged="onRowDragged"
      @cell-value-changed="onCellValueChanged"
    />

    <template #code>
      <DemoCodeBlock
        code='<NuGrid
  :data="data"
  :columns="columns"
  :focus="{ mode: &apos;cell&apos;, cmdArrows: &apos;paging&apos; }"
  :layout="{ mode: &apos;div&apos;, stickyHeaders: true }"
  :editing="{ enabled: true, startClicks: &apos;double&apos; }"
  :actions="{ getActions: getRowItems }"
  :row-drag-options="{ enabled: true }"
  resize-columns
  reorder-columns
  virtualization
/>'
      />
    </template>
  </DemoLayout>
</template>

<style scoped></style>
