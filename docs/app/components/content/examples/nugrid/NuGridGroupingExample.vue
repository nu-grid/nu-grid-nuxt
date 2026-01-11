<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface Employee {
  id: number
  name: string
  department: string
  role: string
  salary: number
}

const data = ref<Employee[]>([
  { id: 1, name: 'Alice', department: 'Engineering', role: 'Developer', salary: 95000 },
  { id: 2, name: 'Bob', department: 'Marketing', role: 'Manager', salary: 85000 },
  { id: 3, name: 'Carol', department: 'Engineering', role: 'Lead', salary: 110000 },
  { id: 4, name: 'David', department: 'HR', role: 'Specialist', salary: 60000 },
  { id: 5, name: 'Emma', department: 'Engineering', role: 'Developer', salary: 90000 },
  { id: 6, name: 'Frank', department: 'Marketing', role: 'Designer', salary: 75000 },
  { id: 7, name: 'Grace', department: 'HR', role: 'Manager', salary: 80000 },
])

const columns: NuGridColumn<Employee>[] = [
  { accessorKey: 'id', header: 'ID', size: 60 },
  { accessorKey: 'name', header: 'Name', size: 120 },
  { accessorKey: 'department', header: 'Department', size: 120 },
  { accessorKey: 'role', header: 'Role', size: 120 },
  {
    accessorKey: 'salary',
    header: 'Salary',
    size: 100,
    cell: ({ row }) => `$${row.original.salary.toLocaleString()}`,
  },
]
</script>

<template>
  <div class="w-full">
    <NuGrid
      :data="data"
      :columns="columns"
      :grouping="['department']"
      :layout="{ mode: 'group' }"
      :ui="{
        base: 'w-full border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50',
        th: 'py-2 border-y border-default first:border-l last:border-r first:rounded-l-lg last:rounded-r-lg',
        td: 'border-b border-default',
      }"
    />
  </div>
</template>
