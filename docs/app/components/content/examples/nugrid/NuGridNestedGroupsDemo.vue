<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface Product {
  id: number
  name: string
  region: string
  country: string
  status: 'active' | 'inactive'
  price: number
}

const data = ref<Product[]>([
  {
    id: 1,
    name: 'Laptop',
    region: 'North America',
    country: 'USA',
    status: 'active',
    price: 1299.99,
  },
  {
    id: 2,
    name: 'Headphones',
    region: 'North America',
    country: 'USA',
    status: 'active',
    price: 199.5,
  },
  { id: 3, name: 'Mic', region: 'North America', country: 'USA', status: 'inactive', price: 159 },
  {
    id: 4,
    name: 'Monitor',
    region: 'North America',
    country: 'Canada',
    status: 'active',
    price: 349.99,
  },
  {
    id: 5,
    name: 'Webcam',
    region: 'North America',
    country: 'Canada',
    status: 'active',
    price: 129.99,
  },
  { id: 6, name: 'Office Chair', region: 'Europe', country: 'UK', status: 'active', price: 299 },
  { id: 7, name: 'Desk Lamp', region: 'Europe', country: 'UK', status: 'active', price: 59.99 },
  {
    id: 8,
    name: 'Gaming Chair',
    region: 'Europe',
    country: 'Germany',
    status: 'active',
    price: 349,
  },
  {
    id: 9,
    name: 'Controller',
    region: 'Europe',
    country: 'Germany',
    status: 'inactive',
    price: 69.99,
  },
  { id: 10, name: 'Tablet', region: 'Asia', country: 'Japan', status: 'active', price: 599.99 },
  { id: 11, name: 'Smartphone', region: 'Asia', country: 'Japan', status: 'active', price: 899.99 },
  {
    id: 12,
    name: 'Smart Watch',
    region: 'Asia',
    country: 'China',
    status: 'active',
    price: 199.99,
  },
  { id: 13, name: 'Earbuds', region: 'Asia', country: 'China', status: 'active', price: 49.99 },
])

const grouping = ref<string[]>(['region', 'country'])
const splitGroup = ref(false)

const gridMode = computed<'group' | 'splitgroup'>(() => (splitGroup.value ? 'splitgroup' : 'group'))

const columns: NuGridColumn<Product>[] = [
  { accessorKey: 'name', header: 'Product', size: 150 },
  { accessorKey: 'region', header: 'Region', size: 120 },
  { accessorKey: 'country', header: 'Country', size: 100 },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 90,
    cell: ({ row }) =>
      h(
        'span',
        { class: row.original.status === 'active' ? 'text-success' : 'text-error' },
        row.original.status,
      ),
  },
  {
    accessorKey: 'price',
    header: 'Price',
    size: 100,
    cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
  },
]

const regionCount = computed(() => new Set(data.value.map((d) => d.region)).size)
const countryCount = computed(() => new Set(data.value.map((d) => d.country)).size)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-4">
      <UButton
        :color="splitGroup ? 'primary' : 'neutral'"
        :variant="splitGroup ? 'solid' : 'outline'"
        size="sm"
        @click="splitGroup = !splitGroup"
      >
        {{ splitGroup ? 'Split Group Mode' : 'Standard Group Mode' }}
      </UButton>

      <div class="text-muted flex items-center gap-4 text-sm">
        <span>{{ data.length }} products</span>
        <span>{{ regionCount }} regions</span>
        <span>{{ countryCount }} countries</span>
      </div>
    </div>

    <div class="border-default bg-elevated/30 rounded-lg border p-3 text-sm">
      <p class="mb-2 font-medium">Grouping Hierarchy:</p>
      <div class="text-muted flex items-center gap-2">
        <span class="bg-primary inline-block h-2 w-2 rounded-full" />
        <span>Region (Level 1)</span>
        <span class="text-default">→</span>
        <span class="bg-primary/60 inline-block h-2 w-2 rounded-full" />
        <span>Country (Level 2)</span>
      </div>
    </div>

    <NuGrid
      v-model:grouping="grouping"
      :data="data"
      :columns="columns"
      :layout="{ mode: gridMode }"
      :focus="{ mode: 'cell' }"
    />
  </div>
</template>
