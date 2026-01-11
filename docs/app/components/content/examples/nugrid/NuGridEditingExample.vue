<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface Task {
  id: number
  name: string
  status: string
  priority: number
}

const data = ref<Task[]>([
  { id: 1, name: 'Design mockups', status: 'completed', priority: 1 },
  { id: 2, name: 'Implement API', status: 'in-progress', priority: 2 },
  { id: 3, name: 'Write tests', status: 'pending', priority: 3 },
  { id: 4, name: 'Deploy to staging', status: 'pending', priority: 4 },
  { id: 5, name: 'Code review', status: 'in-progress', priority: 2 },
])

const columns: NuGridColumn<Task>[] = [
  { accessorKey: 'id', header: 'ID', size: 60, enableEditing: false },
  { accessorKey: 'name', header: 'Task', size: 180, cellDataType: 'text' },
  { accessorKey: 'status', header: 'Status', size: 120, cellDataType: 'text' },
  { accessorKey: 'priority', header: 'Priority', size: 100, cellDataType: 'number' },
]

const toast = useToast()

function onCellValueChanged(event: { row: any; column: any; oldValue: any; newValue: any }) {
  toast.add({
    title: 'Cell Updated',
    description: `${event.column.id}: "${event.oldValue}" → "${event.newValue}"`,
    color: 'success',
  })
}
</script>

<template>
  <div class="w-full">
    <p class="mb-3 text-sm text-muted">
      Double-click a cell to edit. Press Enter to save, Escape to cancel.
    </p>
    <NuGrid
      :data="data"
      :columns="columns"
      :editing="{ enabled: true, startClicks: 'double' }"
      :ui="{
        base: 'w-full border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50',
        th: 'py-2 border-y border-default first:border-l last:border-r first:rounded-l-lg last:rounded-r-lg',
        td: 'border-b border-default',
      }"
      @cell-value-changed="onCellValueChanged"
    />
  </div>
</template>
