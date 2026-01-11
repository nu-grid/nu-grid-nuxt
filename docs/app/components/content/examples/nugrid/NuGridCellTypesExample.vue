<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface Product {
  id: number
  name: string
  price: number
  releaseDate: string
  inStock: boolean
}

const data = ref<Product[]>([
  { id: 1, name: 'Laptop', price: 1299.99, releaseDate: '2024-01-15', inStock: true },
  { id: 2, name: 'Mouse', price: 29.99, releaseDate: '2023-06-10', inStock: true },
  { id: 3, name: 'Cable', price: 12.99, releaseDate: '2023-03-22', inStock: false },
  { id: 4, name: 'Monitor', price: 599.99, releaseDate: '2024-08-05', inStock: true },
])

const columns: NuGridColumn<Product>[] = [
  { accessorKey: 'id', header: 'ID', size: 60, enableEditing: false, cellDataType: 'number' },
  { accessorKey: 'name', header: 'Name', size: 120, cellDataType: 'text' },
  {
    accessorKey: 'price',
    header: 'Price',
    size: 100,
    cellDataType: 'number',
    cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
  },
  {
    accessorKey: 'releaseDate',
    header: 'Release Date',
    size: 130,
    cellDataType: 'date',
    cell: ({ row }) => new Date(row.original.releaseDate).toLocaleDateString(),
  },
  { accessorKey: 'inStock', header: 'In Stock', size: 100, cellDataType: 'boolean' },
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
      Different cell data types provide appropriate editors: text input, number input, date picker,
      and checkbox.
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
