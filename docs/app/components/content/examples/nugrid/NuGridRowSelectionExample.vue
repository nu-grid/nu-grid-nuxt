<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface Employee {
  id: number
  name: string
  department: string
  role: string
}

const data = ref<Employee[]>([
  { id: 1, name: 'Alice Johnson', department: 'Engineering', role: 'Developer' },
  { id: 2, name: 'Bob Smith', department: 'Marketing', role: 'Manager' },
  { id: 3, name: 'Carol White', department: 'Engineering', role: 'Lead' },
  { id: 4, name: 'David Brown', department: 'HR', role: 'Specialist' },
  { id: 5, name: 'Emma Davis', department: 'Engineering', role: 'Developer' },
])

const columns: NuGridColumn<Employee>[] = [
  { accessorKey: 'id', header: 'ID', size: 60 },
  { accessorKey: 'name', header: 'Name', size: 150 },
  { accessorKey: 'department', header: 'Department', size: 120 },
  { accessorKey: 'role', header: 'Role', size: 120 },
]

const rowSelection = ref({})
const table = useTemplateRef('table')

const selectedCount = computed(() => {
  return Object.values(rowSelection.value).filter(Boolean).length
})
</script>

<template>
  <div class="w-full space-y-4">
    <NuGrid
      ref="table"
      v-model:row-selection="rowSelection"
      :data="data"
      :columns="columns"
      selection="multi"
      :ui="{
        base: 'w-full border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50',
        th: 'py-2 border-y border-default first:border-l last:border-r first:rounded-l-lg last:rounded-r-lg',
        td: 'border-b border-default',
      }"
    />
    <div class="text-sm text-muted">{{ selectedCount }} row(s) selected</div>
  </div>
</template>
