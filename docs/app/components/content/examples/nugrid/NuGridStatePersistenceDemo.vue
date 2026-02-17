<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  status: 'active' | 'inactive'
}

const toast = useToast()
const gridRef = useTemplateRef<{
  getState: () => any
  setState: (state: any) => void
}>('grid')

const data = ref<Product[]>([
  { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 1299, stock: 25, status: 'active' },
  {
    id: 2,
    name: 'Wireless Mouse',
    category: 'Accessories',
    price: 49,
    stock: 150,
    status: 'active',
  },
  { id: 3, name: 'USB-C Hub', category: 'Accessories', price: 79, stock: 0, status: 'inactive' },
  { id: 4, name: 'Monitor 27"', category: 'Electronics', price: 399, stock: 42, status: 'active' },
  { id: 5, name: 'Keyboard', category: 'Accessories', price: 129, stock: 8, status: 'active' },
  { id: 6, name: 'Webcam', category: 'Electronics', price: 89, stock: 3, status: 'active' },
  { id: 7, name: 'Desk Lamp', category: 'Furniture', price: 45, stock: 67, status: 'active' },
  { id: 8, name: 'Office Chair', category: 'Furniture', price: 299, stock: 12, status: 'active' },
])

const persistEnabled = ref(true)
const stateKey = ref('demo-products')
const currentState = ref<any>(null)

const columns: NuGridColumn<Product>[] = [
  { accessorKey: 'id', header: 'ID', size: 60 },
  { accessorKey: 'name', header: 'Name', size: 150 },
  { accessorKey: 'category', header: 'Category', size: 120 },
  {
    accessorKey: 'price',
    header: 'Price',
    size: 100,
    cell: ({ row }) => `$${row.original.price}`,
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    size: 80,
    cell: ({ row }) => {
      const stock = row.original.stock
      const color = stock === 0 ? 'text-error' : stock < 10 ? 'text-warning' : 'text-success'
      return h('span', { class: color }, String(stock))
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 90,
    cell: ({ row }) =>
      h(
        'span',
        { class: row.original.status === 'active' ? 'text-success' : 'text-muted' },
        row.original.status,
      ),
  },
]

function getState() {
  currentState.value = gridRef.value?.getState()
  toast.add({ title: 'State Retrieved', description: 'Current state captured' })
}

function applyPreset(type: 'sorted' | 'filtered' | 'custom') {
  let state: any = {}

  switch (type) {
    case 'sorted':
      state = { sorting: [{ id: 'price', desc: true }] }
      break
    case 'filtered':
      state = { columnFilters: [{ id: 'category', value: 'Electronics' }] }
      break
    case 'custom':
      state = {
        sorting: [{ id: 'stock', desc: false }],
        columnVisibility: { id: false },
      }
      break
  }

  gridRef.value?.setState(state)
  toast.add({ title: 'Preset Applied', description: `Applied ${type} state` })
}

function clearState() {
  gridRef.value?.setState({
    sorting: [],
    columnFilters: [],
    columnVisibility: {},
  })
  toast.add({ title: 'State Cleared', description: 'All state reset' })
}

function onStateChanged(state: any) {
  currentState.value = state
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <UButton
        :color="persistEnabled ? 'primary' : 'neutral'"
        :variant="persistEnabled ? 'solid' : 'outline'"
        size="sm"
        @click="persistEnabled = !persistEnabled"
      >
        Persistence {{ persistEnabled ? 'On' : 'Off' }}
      </UButton>

      <UButton size="sm" variant="outline" @click="getState"> Get State </UButton>

      <UButton size="sm" variant="outline" @click="applyPreset('sorted')"> Sort by Price </UButton>

      <UButton size="sm" variant="outline" @click="applyPreset('filtered')">
        Filter Electronics
      </UButton>

      <UButton size="sm" variant="outline" color="warning" @click="clearState">
        Clear State
      </UButton>
    </div>

    <div class="rounded-lg border border-default p-3 bg-elevated/30 text-sm">
      <p class="font-medium mb-2">Current State:</p>
      <pre v-if="currentState" class="text-xs overflow-auto max-h-32 bg-default/50 rounded p-2">{{
        JSON.stringify(currentState, null, 2)
      }}</pre>
      <p v-else class="text-muted text-xs">Click "Get State" to see current state</p>
    </div>

    <NuGrid
      ref="grid"
      :data="data"
      :columns="columns"
      :state="persistEnabled ? { key: stateKey } : false"
      :focus="{ mode: 'cell' }"
      resize-columns
      @state-changed="onStateChanged"
    />

    <p class="text-xs text-muted">
      Try sorting or filtering, then refresh the page. State will be restored if persistence is
      enabled.
    </p>
  </div>
</template>
