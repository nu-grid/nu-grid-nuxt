<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface User {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive'
}

const data = ref<User[]>([
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', status: 'active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', status: 'active' },
  { id: 3, name: 'Carol White', email: 'carol@example.com', status: 'inactive' },
  { id: 4, name: 'David Brown', email: 'david@example.com', status: 'active' },
  { id: 5, name: 'Emma Davis', email: 'emma@example.com', status: 'active' },
])

const columns: NuGridColumn<User>[] = [
  { accessorKey: 'id', header: 'ID', size: 60 },
  { accessorKey: 'name', header: 'Name', size: 150 },
  { accessorKey: 'email', header: 'Email', size: 200 },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 100,
    cell: ({ row }) => {
      const color = row.original.status === 'active' ? 'text-success' : 'text-error'
      return h('span', { class: color }, row.original.status)
    },
  },
]
</script>

<template>
  <div class="w-full">
    <NuGrid
      :data="data"
      :columns="columns"
      :ui="{
        base: 'w-full border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50',
        th: 'py-2 border-y border-default first:border-l last:border-r first:rounded-l-lg last:rounded-r-lg',
        td: 'border-b border-default',
      }"
    />
  </div>
</template>
