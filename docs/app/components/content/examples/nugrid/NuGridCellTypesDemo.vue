<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface Product {
  id: number
  name: string
  price: number
  quantity: number
  releaseDate: string
  rating: number
  inStock: boolean
}

const toast = useToast()

const data = ref<Product[]>([
  {
    id: 1,
    name: 'Laptop Pro',
    price: 1299.99,
    quantity: 15,
    releaseDate: '2024-01-15',
    rating: 4.5,
    inStock: true,
  },
  {
    id: 2,
    name: 'Wireless Mouse',
    price: 29.99,
    quantity: 150,
    releaseDate: '2023-06-10',
    rating: 4.2,
    inStock: true,
  },
  {
    id: 3,
    name: 'USB-C Cable',
    price: 12.99,
    quantity: 0,
    releaseDate: '2023-03-22',
    rating: 3.8,
    inStock: false,
  },
  {
    id: 4,
    name: 'Monitor 4K',
    price: 599.99,
    quantity: 8,
    releaseDate: '2024-08-05',
    rating: 4.7,
    inStock: true,
  },
  {
    id: 5,
    name: 'Mechanical Keyboard',
    price: 149.99,
    quantity: 25,
    releaseDate: '2024-02-14',
    rating: 4.6,
    inStock: true,
  },
  {
    id: 6,
    name: 'Webcam HD',
    price: 79.99,
    quantity: 0,
    releaseDate: '2023-11-30',
    rating: 4.0,
    inStock: false,
  },
])

const editingEnabled = ref(true)

const columns: NuGridColumn<Product>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 60,
    enableEditing: false,
    cellDataType: 'number',
  },
  {
    accessorKey: 'name',
    header: 'Product Name',
    size: 160,
    cellDataType: 'text',
  },
  {
    accessorKey: 'inStock',
    header: 'In Stock',
    size: 90,
    cellDataType: 'boolean',
  },
  {
    accessorKey: 'price',
    header: 'Price',
    size: 100,
    cellDataType: 'number',
    cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
  },
  {
    accessorKey: 'quantity',
    header: 'Qty',
    size: 70,
    cellDataType: 'number',
  },
  {
    accessorKey: 'releaseDate',
    header: 'Release Date',
    size: 130,
    cellDataType: 'date',
    cell: ({ row }) => new Date(row.original.releaseDate).toLocaleDateString(),
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    size: 80,
    cellDataType: 'number',
    cell: ({ row }) => `⭐ ${row.original.rating}`,
  },
]

function onCellValueChanged(event: { row: any; column: any; oldValue: any; newValue: any }) {
  toast.add({
    title: 'Cell Updated',
    description: `${event.column.header}: "${event.oldValue}" → "${event.newValue}"`,
    color: 'success',
  })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <UButton
        :color="editingEnabled ? 'primary' : 'neutral'"
        :variant="editingEnabled ? 'solid' : 'outline'"
        size="sm"
        @click="editingEnabled = !editingEnabled"
      >
        {{ editingEnabled ? 'Editing Enabled' : 'Editing Disabled' }}
      </UButton>

      <span class="text-sm text-muted">
        Double-click cells to edit. Boolean cells toggle on click.
      </span>
    </div>

    <div class="rounded-lg border border-default p-3 bg-elevated/30 text-sm">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div><strong>text:</strong> Product Name</div>
        <div><strong>number:</strong> Price, Qty, Rating</div>
        <div><strong>date:</strong> Release Date</div>
        <div><strong>boolean:</strong> In Stock</div>
      </div>
    </div>

    <NuGrid
      :data="data"
      :columns="columns"
      :editing="{ enabled: editingEnabled, startClicks: 'double', startKeys: 'all' }"
      :focus="{ mode: 'cell' }"
      @cell-value-changed="onCellValueChanged"
    />
  </div>
</template>
