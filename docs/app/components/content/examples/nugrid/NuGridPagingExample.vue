<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface Item {
  id: number
  name: string
  category: string
  value: number
}

// Generate sample data
const data = ref<Item[]>(
  Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    category: ['Electronics', 'Clothing', 'Books', 'Home'][i % 4]!,
    value: Math.floor(Math.random() * 1000) + 10,
  })),
)

const columns: NuGridColumn<Item>[] = [
  { accessorKey: 'id', header: 'ID', size: 60 },
  { accessorKey: 'name', header: 'Name', size: 120 },
  { accessorKey: 'category', header: 'Category', size: 120 },
  {
    accessorKey: 'value',
    header: 'Value',
    size: 100,
    cell: ({ row }) => `$${row.original.value}`,
  },
]
</script>

<template>
  <div class="w-full">
    <NuGrid
      :data="data"
      :columns="columns"
      :paging="{
        enabled: true,
        pageSize: 10,
        pageSizeSelector: [5, 10, 20, 50],
      }"
      :ui="{
        base: 'w-full border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50',
        th: 'py-2 border-y border-default first:border-l last:border-r first:rounded-l-lg last:rounded-r-lg',
        td: 'border-b border-default',
      }"
    />
  </div>
</template>
