<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

const toast = useToast()

interface Task {
  id: number
  title: string
  status: string
  priority: string
  assignee: string
  effort: number
}

const statuses = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'In Review' },
  { value: 'done', label: 'Done' },
]

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const data = ref<Task[]>([
  { id: 1, title: 'Setup CI pipeline', status: 'done', priority: 'high', assignee: 'Alice', effort: 8 },
  { id: 2, title: 'Design landing page', status: 'in-progress', priority: 'medium', assignee: 'Bob', effort: 5 },
  { id: 3, title: 'Write API docs', status: 'todo', priority: 'low', assignee: 'Carol', effort: 3 },
  { id: 4, title: 'Fix login bug', status: 'in-progress', priority: 'critical', assignee: 'David', effort: 2 },
  { id: 5, title: 'Add dark mode', status: 'todo', priority: 'medium', assignee: 'Emma', effort: 5 },
  { id: 6, title: 'Optimize queries', status: 'review', priority: 'high', assignee: 'Frank', effort: 8 },
  { id: 7, title: 'Update deps', status: 'todo', priority: 'low', assignee: 'Grace', effort: 1 },
  { id: 8, title: 'Auth refactor', status: 'review', priority: 'high', assignee: 'Henry', effort: 13 },
  { id: 9, title: 'Mobile responsive', status: 'in-progress', priority: 'medium', assignee: 'Alice', effort: 8 },
  { id: 10, title: 'E2E tests', status: 'todo', priority: 'high', assignee: 'Bob', effort: 5 },
])

const sortOnCellEdit = ref<'maintain' | 'resort'>('maintain')

const columns: NuGridColumn<Task>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 60,
    enableEditing: false,
    enableFocusing: false,
    cellDataType: 'number',
  },
  {
    accessorKey: 'title',
    header: 'Title',
    size: 200,
    cellDataType: 'text',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 140,
    cellDataType: 'lookup',
    lookup: {
      items: statuses,
      valueKey: 'value',
      labelKey: 'label',
      searchable: false,
      autoOpen: true,
    },
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    size: 130,
    cellDataType: 'lookup',
    lookup: {
      items: priorities,
      valueKey: 'value',
      labelKey: 'label',
      searchable: false,
      autoOpen: true,
    },
  },
  {
    accessorKey: 'assignee',
    header: 'Assignee',
    size: 120,
    cellDataType: 'text',
  },
  {
    accessorKey: 'effort',
    header: 'Effort',
    size: 90,
    cellDataType: 'number',
  },
]

const sorting = ref([{ id: 'status', desc: false }])

function onCellValueChanged(event: { row: any; column: any; oldValue: any; newValue: any }) {
  const columnLabel = event.column.columnDef?.header || event.column.id
  toast.add({
    title: 'Cell Updated',
    description: `${columnLabel}: "${event.oldValue}" → "${event.newValue}"`,
    color: 'success',
  })
}

const modeOptions = [
  { value: 'maintain', label: 'Maintain', description: 'Freeze order, show stale indicator' },
  { value: 'resort', label: 'Resort', description: 'Immediately re-sort rows' },
]

// External mutation: randomly change 1-3 statuses to test reactivity outside of cell editing
function randomizeStatuses() {
  const statusValues = statuses.map((s) => s.value)
  const count = Math.floor(Math.random() * 3) + 1
  const indices = [...Array(data.value.length).keys()]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)

  const changes: string[] = []
  for (const i of indices) {
    const row = data.value[i]
    const otherStatuses = statusValues.filter((s) => s !== row.status)
    const newStatus = otherStatuses[Math.floor(Math.random() * otherStatuses.length)]
    changes.push(`${row.title}: ${row.status} → ${newStatus}`)
    row.status = newStatus
  }
  data.value = [...data.value]

  toast.add({
    title: `Changed ${count} status${count > 1 ? 'es' : ''} externally`,
    description: changes.join(', '),
    color: 'info',
  })
}
</script>

<template>
  <DemoLayout
    id="sort-stability-demo"
    title="Sort Stability Demo"
    info-label="About Sort Stability"
  >
    <template #status>
      <DemoStatusItem label="Mode" :value="sortOnCellEdit" />
      <DemoStatusItem label="Sorted By" :value="sorting.length ? sorting[0].id : 'none'" />
      <DemoStatusItem label="Rows" :value="data.length" />
    </template>

    <template #controls>
      <DemoControlGroup label="Sort on Cell Edit">
        <UButton
          v-for="option in modeOptions"
          :key="option.value"
          :color="sortOnCellEdit === option.value ? 'primary' : 'neutral'"
          :variant="sortOnCellEdit === option.value ? 'solid' : 'outline'"
          size="xs"
          block
          @click="sortOnCellEdit = option.value as any"
        >
          {{ option.label }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="External Mutation">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-shuffle"
          size="xs"
          block
          @click="randomizeStatuses"
        >
          Randomize Statuses
        </UButton>
      </DemoControlGroup>
    </template>

    <template #info>
      <p class="text-muted mb-3 text-sm">
        Controls how the grid handles sorting when a cell value changes in a sorted column.
        Sort by Status (default), then edit a status value to see the behavior.
      </p>
      <ul class="text-muted list-inside list-disc space-y-1 text-sm">
        <li>
          <strong>Maintain:</strong> Row stays in place, amber dot appears on sort icon.
          Click the sort header to re-sort.
        </li>
        <li>
          <strong>Resort:</strong> Rows immediately re-sort after the edit.
        </li>
      </ul>
    </template>

    <NuGrid
      v-model:sorting="sorting"
      :data="data"
      :columns="columns"
      :editing="{
        enabled: true,
        startClicks: 'double',
        sortOnCellEdit: sortOnCellEdit,
      }"
      :focus="{ mode: 'cell' }"
      class="border-default max-h-[500px] rounded border"
      @cell-value-changed="onCellValueChanged"
    />
  </DemoLayout>
</template>
