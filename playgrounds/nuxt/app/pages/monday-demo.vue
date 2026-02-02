<script setup lang="ts">
import type { NuGridAddRowState, NuGridColumn } from '#nu-grid/types'

const toast = useToast()

interface TaskRow {
  id: number
  item: string
  category: string
  owner: string
  status: string
  dueDate: string
  fee: number
}

interface GridExpose {
  addRowState?: NuGridAddRowState | { value: NuGridAddRowState }
}

const tasks = ref<TaskRow[]>([
  {
    id: 1,
    item: 'Launch campaign brief',
    category: 'Marketing',
    owner: 'Ava',
    status: 'In Progress',
    dueDate: '2024-06-15',
    fee: 4500,
  },
  {
    id: 2,
    item: 'Creative review',
    category: 'Marketing',
    owner: 'Ben',
    status: 'Blocked',
    dueDate: '2024-06-18',
    fee: 1800,
  },
  {
    id: 3,
    item: 'API contract update',
    category: 'Engineering',
    owner: 'Chloe',
    status: 'In Progress',
    dueDate: '2024-06-12',
    fee: 3200,
  },
  {
    id: 4,
    item: 'Mobile QA pass',
    category: 'Engineering',
    owner: 'Diego',
    status: 'Not Started',
    dueDate: '2024-06-20',
    fee: 2100,
  },
  {
    id: 5,
    item: 'Vendor contract',
    category: 'Operations',
    owner: 'Ella',
    status: 'Done',
    dueDate: '2024-06-10',
    fee: 900,
  },
  {
    id: 6,
    item: 'Budget refresh',
    category: 'Operations',
    owner: 'Finn',
    status: 'In Progress',
    dueDate: '2024-06-22',
    fee: 1500,
  },
])

const gridRef = ref<GridExpose | null>(null)
const grouping = ref<string[]>(['category'])

function handleRowAddRequested(row: TaskRow) {
  const maxId = tasks.value.reduce((max, item) => Math.max(max, item.id ?? 0), 0)
  row.id = maxId + 1
  row.owner = 'Unassigned'
  row.status = 'Not Started'
  row.dueDate = ''
  row.fee = 0
  tasks.value = [...tasks.value, { ...row }]

  toast.add({
    title: 'Task added successfully',
    description: `Added "${row.item}" to the grid`,
    color: 'success',
  })
}

const columns: NuGridColumn<TaskRow>[] = [
  { accessorKey: 'category', header: 'Category', minSize: 140, size: 160, showNew: false },
  { accessorKey: 'item', header: 'Item', minSize: 200, size: 240, requiredNew: true },
  { accessorKey: 'owner', header: 'Owner', minSize: 120, size: 140, showNew: false },
  { accessorKey: 'status', header: 'Status', minSize: 120, size: 140, showNew: false },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    minSize: 120,
    size: 140,
    showNew: false,
    cell: ({ row }) => {
      const value = row.original.dueDate
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return value
      return date.toLocaleDateString()
    },
  },
  {
    accessorKey: 'fee',
    header: 'Fee',
    minSize: 120,
    size: 120,
    cellDataType: 'number',
    showNew: false,
    cell: ({ row }) => {
      const value = Number(row.original.fee)
      return Number.isFinite(value) ? `$${value.toLocaleString()}` : '-'
    },
  },
]

const addRowState = computed(() => {
  const exposed = gridRef.value?.addRowState
  if (typeof exposed === 'string') return exposed
  return exposed?.value ?? 'idle'
})

const exampleCode = `<NuGrid
  :data="tasks"
  :columns="columns"
  :layout="{ mode: 'splitgroup' }"
  :add-new-row="{ position: 'bottom' }"
  :editing="{ enabled: true, startClicks: 'single' }"
  @row-add-requested="handleRowAddRequested"
/>

// Column with showNew: false hides in add row
{ accessorKey: 'owner', showNew: false }

// Column with requiredNew: true is required
{ accessorKey: 'item', requiredNew: true }`
</script>

<template>
  <DemoLayout id="monday-demo" title="Monday-style Add Rows" info-label="About Monday-style Layout">
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Add Row State">
        <UBadge
          :color="
            addRowState === 'editing'
              ? 'primary'
              : addRowState === 'focused'
                ? 'warning'
                : 'neutral'
          "
          :variant="addRowState === 'focused' ? 'subtle' : 'soft'"
          size="xs"
        >
          {{
            addRowState === 'editing' ? 'Editing' : addRowState === 'focused' ? 'Focused' : 'Idle'
          }}
        </UBadge>
      </DemoStatusItem>
      <DemoStatusItem label="Total Tasks" :value="tasks.length" />
      <DemoStatusItem label="Layout" value="Split Group" />
      <DemoStatusItem label="Grouping" value="Category" />
    </template>

    <!-- Controls -->
    <template #controls>
      <div class="rounded-lg border border-default/50 bg-elevated/30 p-3">
        <h4 class="mb-2 text-xs font-semibold">Monday-style Behavior:</h4>
        <ul class="space-y-1 text-xs text-muted">
          <li>• Split-group layout with per-group add rows</li>
          <li>• Only "Item" is editable in add row</li>
          <li>• Other fields are server-defaulted on save</li>
          <li>• All columns editable for existing rows</li>
        </ul>
      </div>

      <div class="rounded-lg border border-default/50 bg-elevated/30 p-3">
        <h4 class="mb-2 text-xs font-semibold">Column Configuration:</h4>
        <ul class="space-y-1 text-xs text-muted">
          <li><strong>Item:</strong> Required, editable in add row</li>
          <li><strong>Category:</strong> Hidden in add row (inherited)</li>
          <li><strong>Owner/Status:</strong> Server defaults</li>
          <li><strong>Due Date/Fee:</strong> Set after creation</li>
        </ul>
      </div>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        This demo recreates the Monday.com-style task board experience with split-group layout and
        inline row addition. Each group maintains its own add-row placeholder.
      </p>
      <ul class="mb-3 list-inside list-disc space-y-1 text-sm text-muted">
        <li><strong>Split Layout:</strong> Headers repeat for each grouped section</li>
        <li><strong>Minimal Input:</strong> Only essential fields shown in add row</li>
        <li><strong>Auto-defaults:</strong> Owner, status, and other fields auto-assigned</li>
      </ul>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Keyboard:</strong> Enter/Tab to save and spawn next add row.
      </div>
    </template>

    <!-- Grid -->
    <NuGrid
      ref="gridRef"
      v-model:grouping="grouping"
      :data="tasks"
      :columns="columns"
      :layout="{ mode: 'splitgroup' }"
      :add-new-row="{ position: 'bottom' }"
      add-new-text="Add task"
      :focus="{ retain: true }"
      :editing="{ enabled: true, startClicks: 'single', startKeys: 'all' }"
      resize-columns
      @row-add-requested="handleRowAddRequested"
    />

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Monday-style Configuration:" :code="exampleCode" />
    </template>
  </DemoLayout>
</template>
