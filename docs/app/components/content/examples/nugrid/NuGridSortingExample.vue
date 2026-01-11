<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface User {
  id: number
  name: string
  email: string
  age: number
}

const data = ref<User[]>([
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', age: 28 },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', age: 35 },
  { id: 3, name: 'Carol White', email: 'carol@example.com', age: 42 },
  { id: 4, name: 'David Brown', email: 'david@example.com', age: 31 },
  { id: 5, name: 'Emma Davis', email: 'emma@example.com', age: 26 },
])

const UButton = resolveComponent('UButton')

const columns: NuGridColumn<User>[] = [
  { accessorKey: 'id', header: 'ID', size: 60, enableSorting: true },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Name',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      })
    },
    size: 150,
    enableSorting: true,
  },
  { accessorKey: 'email', header: 'Email', size: 200, enableSorting: true },
  { accessorKey: 'age', header: 'Age', size: 80, enableSorting: true },
]

const sorting = ref([{ id: 'name', desc: false }])
</script>

<template>
  <div class="w-full">
    <p class="mb-3 text-sm text-muted">Click on the Name column header to toggle sorting.</p>
    <NuGrid
      v-model:sorting="sorting"
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
