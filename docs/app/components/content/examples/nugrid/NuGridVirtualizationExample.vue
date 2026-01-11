<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface Row {
  id: number
  name: string
  value: number
  category: string
}

// Generate 1000 rows
const data = ref<Row[]>(
  Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    value: Math.floor(Math.random() * 10000),
    category: ['A', 'B', 'C', 'D'][i % 4]!,
  })),
)

const columns: NuGridColumn<Row>[] = [
  { accessorKey: 'id', header: 'ID', size: 80 },
  { accessorKey: 'name', header: 'Name', size: 150 },
  { accessorKey: 'value', header: 'Value', size: 100 },
  { accessorKey: 'category', header: 'Category', size: 100 },
]
</script>

<template>
  <div class="w-full">
    <p class="mb-3 text-sm text-muted">
      Rendering 1,000 rows with virtualization. Only visible rows are rendered in the DOM.
    </p>
    <div class="h-80">
      <NuGrid
        :data="data"
        :columns="columns"
        virtualization
        :ui="{
          base: 'w-full border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50',
          th: 'py-2 border-y border-default first:border-l last:border-r first:rounded-l-lg last:rounded-r-lg',
          td: 'border-b border-default',
        }"
      />
    </div>
  </div>
</template>
