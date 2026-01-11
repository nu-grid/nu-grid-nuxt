<script setup lang="ts">
import type { NuGridColumn, NuGridPagingOptions } from '#nu-grid/types'

interface Task {
  id: number
  name: string
  category: string
  status: 'pending' | 'in-progress' | 'completed'
  assignee: string
}

const categories = ['Design', 'Backend', 'Testing', 'Frontend', 'DevOps']
const assignees = ['Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank']
const statuses: Task['status'][] = ['pending', 'in-progress', 'completed']

function generateTasks(count: number): Task[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Task ${i + 1}`,
    category: categories[i % categories.length]!,
    status: statuses[i % statuses.length]!,
    assignee: assignees[i % assignees.length]!,
  }))
}

const data = ref<Task[]>(generateTasks(100))

const grouping = ref<string[]>(['category'])
const pageSize = ref(20)
const layoutMode = ref<'group' | 'splitgroup'>('group')

const paginationOptions = computed<NuGridPagingOptions>(() => ({
  enabled: true,
  pageSize: pageSize.value,
  pageSizeSelector: [10, 20, 50],
}))

const columns: NuGridColumn<Task>[] = [
  { accessorKey: 'id', header: 'ID', size: 60, enableEditing: false },
  { accessorKey: 'name', header: 'Task Name', size: 200 },
  { accessorKey: 'category', header: 'Category', size: 100 },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 100,
    cell: ({ row }) => {
      const colors: Record<string, string> = {
        'pending': 'text-warning',
        'in-progress': 'text-info',
        'completed': 'text-success',
      }
      return h(
        'span',
        { class: `capitalize ${colors[row.original.status]}` },
        row.original.status.replace('-', ' '),
      )
    },
  },
  { accessorKey: 'assignee', header: 'Assignee', size: 100 },
]
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <span class="text-sm font-medium">Layout:</span>
      <UFieldGroup>
        <UButton
          :color="layoutMode === 'group' ? 'primary' : 'neutral'"
          :variant="layoutMode === 'group' ? 'solid' : 'outline'"
          size="sm"
          @click="layoutMode = 'group'"
        >
          Group
        </UButton>
        <UButton
          :color="layoutMode === 'splitgroup' ? 'primary' : 'neutral'"
          :variant="layoutMode === 'splitgroup' ? 'solid' : 'outline'"
          size="sm"
          @click="layoutMode = 'splitgroup'"
        >
          Split Group
        </UButton>
      </UFieldGroup>

      <span class="text-sm font-medium ml-4">Page Size:</span>
      <UFieldGroup>
        <UButton
          v-for="size in [10, 20, 50]"
          :key="size"
          :color="pageSize === size ? 'primary' : 'neutral'"
          :variant="pageSize === size ? 'solid' : 'outline'"
          size="sm"
          @click="pageSize = size"
        >
          {{ size }}
        </UButton>
      </UFieldGroup>
    </div>

    <div class="rounded-lg border border-default p-3 bg-elevated/30 text-sm">
      <div class="flex items-center gap-4">
        <span><strong>Tasks:</strong> {{ data.length }}</span>
        <span><strong>Grouped by:</strong> {{ grouping.join(', ') }}</span>
        <span><strong>Layout:</strong> {{ layoutMode }}</span>
      </div>
    </div>

    <NuGrid
      v-model:grouping="grouping"
      :data="data"
      :columns="columns"
      :layout="{ mode: layoutMode, stickyHeaders: true }"
      :paging="paginationOptions"
      :focus="{ retain: true }"
    />
  </div>
</template>
