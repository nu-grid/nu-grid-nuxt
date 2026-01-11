<script setup lang="ts">
import type { NuGridColumn, NuGridPagingOptions } from '#nu-grid/types'

interface Task {
  id: number
  name: string
  status: 'pending' | 'in-progress' | 'completed'
  assignee: string
  category: string
}

const categories = ['Design', 'Backend', 'Testing', 'Frontend', 'DevOps']
const assignees = ['Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank']
const statuses: Task['status'][] = ['pending', 'in-progress', 'completed']

function generateData(count: number): Task[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Task ${i + 1}`,
    status: statuses[i % statuses.length]!,
    assignee: assignees[i % assignees.length]!,
    category: categories[i % categories.length]!,
  }))
}

const data = ref<Task[]>(generateData(100))

const pageSize = ref(10)
const autoPageSize = ref(false)

const paginationOptions = computed<NuGridPagingOptions>(() => ({
  enabled: true,
  pageSize: pageSize.value,
  pageSizeSelector: [10, 20, 50],
  autoPageSize: autoPageSize.value,
}))

const statusColors: Record<string, string> = {
  'pending': 'text-warning',
  'in-progress': 'text-info',
  'completed': 'text-success',
}

const columns = computed<NuGridColumn<Task>[]>(() => [
  { accessorKey: 'id', header: 'ID', size: 60 },
  { accessorKey: 'name', header: 'Task', size: 150 },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 110,
    cell: ({ row }) => h('span', { class: statusColors[row.original.status] }, row.original.status),
  },
  { accessorKey: 'assignee', header: 'Assignee', size: 100 },
  { accessorKey: 'category', header: 'Category', size: 100 },
])
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">Page Size:</span>
        <UFieldGroup>
          <UButton
            v-for="size in [10, 20, 50]"
            :key="size"
            :color="pageSize === size ? 'primary' : 'neutral'"
            :variant="pageSize === size ? 'solid' : 'outline'"
            size="xs"
            @click="pageSize = size"
          >
            {{ size }}
          </UButton>
        </UFieldGroup>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">Auto Size:</span>
        <USwitch v-model="autoPageSize" />
      </div>

      <div class="text-sm text-muted">Total: {{ data.length }} rows</div>
    </div>

    <div class="h-[400px] overflow-hidden rounded-lg border border-default">
      <NuGrid
        :data="data"
        :columns="columns"
        :paging="paginationOptions"
        :layout="{ stickyHeaders: true }"
      />
    </div>
  </div>
</template>
