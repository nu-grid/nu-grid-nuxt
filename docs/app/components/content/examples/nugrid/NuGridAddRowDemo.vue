<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
}

const toast = useToast()

const data = ref<Product[]>([
  { id: 1, name: 'Laptop', category: 'Electronics', price: 999.99, stock: 15 },
  { id: 2, name: 'Mouse', category: 'Electronics', price: 29.99, stock: 50 },
  { id: 3, name: 'Keyboard', category: 'Electronics', price: 79.99, stock: 30 },
  { id: 4, name: 'Headphones', category: 'Audio', price: 149.99, stock: 25 },
])

const addRowPosition = ref<'top' | 'bottom'>('bottom')

const addNewRowOptions = computed(() => ({
  position: addRowPosition.value,
  addNewText: 'Add New Product',
}))

function handleRowAdded(row: Product) {
  const maxId = Math.max(...data.value.map((d) => d.id), 0)
  row.id = maxId + 1

  if (!row.stock) row.stock = 0
  if (!row.category) row.category = 'General'

  data.value = [...data.value, { ...row }]

  toast.add({
    title: 'Product Added',
    description: `Added "${row.name}" to inventory`,
    color: 'success',
  })
}

const columns: NuGridColumn<Product>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 60,
    enableEditing: false,
    showNew: false, // Hide in add row
  },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 160,
    requiredNew: true, // Required field
  },
  {
    accessorKey: 'category',
    header: 'Category',
    size: 120,
  },
  {
    accessorKey: 'price',
    header: 'Price',
    size: 100,
    cell: ({ row }) => {
      const raw = row.original.price as number | string | null | undefined
      if (raw === null || raw === undefined || raw === '') return ''
      const price = Number(raw)
      return Number.isFinite(price) ? `$${price.toFixed(2)}` : ''
    },
    validateNew: (value) => {
      const num = Number(value)
      if (value && (!Number.isFinite(num) || num <= 0)) {
        return { valid: false, message: 'Price must be positive' }
      }
      return { valid: true }
    },
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    size: 80,
    validateNew: (value) => {
      const num = Number(value)
      if (value && (!Number.isFinite(num) || num < 0 || !Number.isInteger(num))) {
        return { valid: false, message: 'Stock must be non-negative integer' }
      }
      return { valid: true }
    },
  },
]
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <span class="text-sm font-medium">Add Row Position:</span>
      <UFieldGroup>
        <UButton
          :color="addRowPosition === 'top' ? 'primary' : 'neutral'"
          :variant="addRowPosition === 'top' ? 'solid' : 'outline'"
          size="sm"
          @click="addRowPosition = 'top'"
        >
          Top
        </UButton>
        <UButton
          :color="addRowPosition === 'bottom' ? 'primary' : 'neutral'"
          :variant="addRowPosition === 'bottom' ? 'solid' : 'outline'"
          size="sm"
          @click="addRowPosition = 'bottom'"
        >
          Bottom
        </UButton>
      </UFieldGroup>

      <span class="text-sm text-muted"> {{ data.length }} products </span>
    </div>

    <div class="rounded-lg border border-default p-3 bg-elevated/30 text-sm">
      <p class="font-medium mb-1">Column Options:</p>
      <ul class="text-xs text-muted space-y-1">
        <li><strong>ID:</strong> Hidden in add row (showNew: false)</li>
        <li><strong>Name:</strong> Required field (requiredNew: true)</li>
        <li><strong>Price/Stock:</strong> Custom validation (validateNew)</li>
      </ul>
    </div>

    <NuGrid
      :data="data"
      :columns="columns"
      :add-new-row="addNewRowOptions"
      :editing="{ enabled: true, startClicks: 'double', startKeys: 'all' }"
      :focus="{ retain: true }"
      @row-add-requested="handleRowAdded"
    />
  </div>
</template>
