<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface Product {
  id: number
  name: string
  price: number
  category: string
  inStock: boolean
}

const data = ref<Product[]>([
  { id: 1, name: 'Laptop Pro', price: 1299.99, category: 'Electronics', inStock: true },
  { id: 2, name: 'Wireless Mouse', price: 29.99, category: 'Accessories', inStock: true },
  { id: 3, name: 'USB-C Cable', price: 12.99, category: 'Accessories', inStock: false },
  { id: 4, name: 'Monitor 4K', price: 599.99, category: 'Electronics', inStock: true },
  { id: 5, name: 'Keyboard', price: 149.99, category: 'Accessories', inStock: true },
])

const columns: NuGridColumn<Product>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 60,
    enableEditing: false,
  },
  {
    accessorKey: 'name',
    header: 'Product Name',
    size: 150,
  },
  {
    accessorKey: 'price',
    header: 'Price',
    size: 100,
    cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
  },
  {
    accessorKey: 'category',
    header: 'Category',
    size: 120,
  },
  {
    accessorKey: 'inStock',
    header: 'In Stock',
    size: 100,
    cell: ({ row }) =>
      h(
        'span',
        {
          class: row.original.inStock ? 'text-success' : 'text-error',
        },
        row.original.inStock ? 'Yes' : 'No',
      ),
  },
]
</script>

<template>
  <div class="w-full">
    <NuGrid
      :data="data"
      :columns="columns"
      resize-columns
      :ui="{
        base: 'w-full border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50',
        th: 'py-2 border-y border-default first:border-l last:border-r first:rounded-l-lg last:rounded-r-lg',
        td: 'border-b border-default',
      }"
    />
  </div>
</template>
