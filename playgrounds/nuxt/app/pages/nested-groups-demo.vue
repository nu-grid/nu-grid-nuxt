<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface Product {
  id: number | string
  name: string
  region: string
  country: string
  status: 'active' | 'inactive'
  price: number
  stock: number
}

const data = ref<Product[]>([
  // North America - USA
  {
    id: 1,
    name: 'Laptop',
    region: 'North America',
    country: 'USA',
    status: 'active',
    price: 1299.99,
    stock: 8,
  },
  {
    id: 2,
    name: 'Headphones',
    region: 'North America',
    country: 'USA',
    status: 'active',
    price: 199.5,
    stock: 24,
  },
  {
    id: 3,
    name: 'Mic',
    region: 'North America',
    country: 'USA',
    status: 'inactive',
    price: 159,
    stock: 12,
  },
  {
    id: 4,
    name: 'Keyboard',
    region: 'North America',
    country: 'USA',
    status: 'active',
    price: 89.99,
    stock: 18,
  },
  {
    id: 5,
    name: 'Mouse',
    region: 'North America',
    country: 'USA',
    status: 'inactive',
    price: 39.99,
    stock: 44,
  },
  // North America - Canada
  {
    id: 6,
    name: 'Monitor',
    region: 'North America',
    country: 'Canada',
    status: 'active',
    price: 349.99,
    stock: 10,
  },
  {
    id: 7,
    name: 'Webcam',
    region: 'North America',
    country: 'Canada',
    status: 'active',
    price: 129.99,
    stock: 14,
  },
  {
    id: 8,
    name: 'Soundbar',
    region: 'North America',
    country: 'Canada',
    status: 'inactive',
    price: 249.99,
    stock: 9,
  },
  // Europe - UK
  {
    id: 9,
    name: 'Office Chair',
    region: 'Europe',
    country: 'UK',
    status: 'active',
    price: 299,
    stock: 6,
  },
  {
    id: 10,
    name: 'Desk Lamp',
    region: 'Europe',
    country: 'UK',
    status: 'active',
    price: 59.99,
    stock: 30,
  },
  {
    id: 11,
    name: 'Standing Desk',
    region: 'Europe',
    country: 'UK',
    status: 'inactive',
    price: 799,
    stock: 4,
  },
  // Europe - Germany
  {
    id: 12,
    name: 'Gaming Chair',
    region: 'Europe',
    country: 'Germany',
    status: 'active',
    price: 349,
    stock: 5,
  },
  {
    id: 13,
    name: 'Controller',
    region: 'Europe',
    country: 'Germany',
    status: 'inactive',
    price: 69.99,
    stock: 22,
  },
  {
    id: 14,
    name: 'Gaming Mouse',
    region: 'Europe',
    country: 'Germany',
    status: 'active',
    price: 79.99,
    stock: 15,
  },
  // Asia - Japan
  {
    id: 15,
    name: 'Tablet',
    region: 'Asia',
    country: 'Japan',
    status: 'active',
    price: 599.99,
    stock: 12,
  },
  {
    id: 16,
    name: 'Smartphone',
    region: 'Asia',
    country: 'Japan',
    status: 'active',
    price: 899.99,
    stock: 8,
  },
  {
    id: 17,
    name: 'Camera',
    region: 'Asia',
    country: 'Japan',
    status: 'inactive',
    price: 1299.99,
    stock: 3,
  },
  // Asia - China
  {
    id: 18,
    name: 'Smart Watch',
    region: 'Asia',
    country: 'China',
    status: 'active',
    price: 199.99,
    stock: 20,
  },
  {
    id: 19,
    name: 'Earbuds',
    region: 'Asia',
    country: 'China',
    status: 'active',
    price: 49.99,
    stock: 35,
  },
  {
    id: 20,
    name: 'Power Bank',
    region: 'Asia',
    country: 'China',
    status: 'inactive',
    price: 29.99,
    stock: 50,
  },
])

// 3-tier grouping: region > country > status
const grouping = ref<string[]>(['region', 'country', 'status'])
const splitGroup = ref(false)
const gridMode = computed<'group' | 'splitgroup'>(() => (splitGroup.value ? 'splitgroup' : 'group'))

const columns: NuGridColumn<Product>[] = [
  { accessorKey: 'name', header: 'Product Name', minSize: 150, size: 200 },
  { accessorKey: 'id', header: 'ID', minSize: 60, size: 80, enableEditing: false },
  { accessorKey: 'region', header: 'Region', minSize: 120, size: 140 },
  { accessorKey: 'country', header: 'Country', minSize: 100, size: 120 },
  { accessorKey: 'status', header: 'Status', minSize: 100, size: 110 },
  {
    accessorKey: 'price',
    header: 'Price',
    minSize: 100,
    size: 120,
    cell: ({ row }) => {
      const raw = row.original.price
      const numeric = Number(raw)
      return Number.isFinite(numeric) ? `$${numeric.toFixed(2)}` : '-'
    },
  },
  { accessorKey: 'stock', header: 'Stock', minSize: 80, size: 100 },
]

// Unique counts for status
const regionCount = computed(() => new Set(data.value.map((d) => d.region)).size)
const countryCount = computed(() => new Set(data.value.map((d) => d.country)).size)

const exampleCode = `<NuGrid
  v-model:grouping="grouping"
  :data="data"
  :columns="columns"
  :layout="{ mode: 'group' }"
/>

// Set up 3-tier grouping
const grouping = ref(['region', 'country', 'status'])

// Toggle between group and splitgroup modes
const gridMode = computed(() =>
  splitGroup.value ? 'splitgroup' : 'group'
)`
</script>

<template>
  <DemoLayout id="nested-groups-demo" title="Nested Groups Demo" info-label="About Nested Grouping">
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Total Products" :value="data.length" />
      <DemoStatusItem label="Regions" :value="regionCount" />
      <DemoStatusItem label="Countries" :value="countryCount" />
      <DemoStatusItem label="Grouping Levels" :value="grouping.length" />
      <DemoStatusItem label="Split Layout" :value="splitGroup" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Layout Mode">
        <USwitch v-model="splitGroup" label="Split Group Layout" />
        <p class="mt-1 text-xs text-muted">Repeats headers for each group section</p>
      </DemoControlGroup>

      <div class="rounded-lg border border-default/50 bg-elevated/30 p-3">
        <h4 class="mb-2 text-xs font-semibold">Grouping Hierarchy:</h4>
        <ul class="space-y-1 text-xs text-muted">
          <li class="flex items-center gap-2">
            <span class="inline-block h-2 w-2 rounded-full bg-primary" />
            Region (Level 1)
          </li>
          <li class="flex items-center gap-2">
            <span class="ml-2 inline-block h-2 w-2 rounded-full bg-primary/70" />
            Country (Level 2)
          </li>
          <li class="flex items-center gap-2">
            <span class="ml-4 inline-block h-2 w-2 rounded-full bg-primary/40" />
            Status (Level 3)
          </li>
        </ul>
      </div>

      <div class="rounded-lg border border-default/50 bg-elevated/30 p-3">
        <h4 class="mb-2 text-xs font-semibold">Data Structure:</h4>
        <ul class="space-y-1 text-xs text-muted">
          <li><strong>Regions:</strong> North America, Europe, Asia</li>
          <li><strong>Countries:</strong> USA, Canada, UK, Germany, Japan, China</li>
          <li><strong>Status:</strong> active, inactive</li>
        </ul>
      </div>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        This demo shows 3-tier nested grouping: Region → Country → Status. Click group headers to
        expand/collapse. Each level provides visual indentation for hierarchy.
      </p>
      <ul class="mb-3 list-inside list-disc space-y-1 text-sm text-muted">
        <li><strong>Visual Indentation:</strong> Nested groups are indented for clarity</li>
        <li><strong>Expand/Collapse:</strong> Click any group header to toggle</li>
        <li><strong>Split Mode:</strong> Optional repeating headers per group</li>
      </ul>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Note:</strong> Nested groups only show when their parent is expanded.
      </div>
    </template>

    <!-- Grid -->
    <NuGrid
      v-model:grouping="grouping"
      :data="data"
      :columns="columns"
      :layout="{ mode: gridMode }"
      :focus="{ retain: true }"
      :editing="{ enabled: true, startClicks: 'double' }"
      resize-columns
      :ui="{
        root: 'h-full w-full',
        base: 'w-max min-w-full border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default',
      }"
    />

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="3-Tier Nested Grouping:" :code="exampleCode" />
    </template>
  </DemoLayout>
</template>
