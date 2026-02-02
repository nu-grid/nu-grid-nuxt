<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface Product {
  id: number
  name: string
  category: string
  region: string
  price: number
  stock: number
  status: 'active' | 'discontinued' | 'coming_soon'
}

// Sample product data with categories and regions for grouping
const data = ref<Product[]>([
  // Electronics - North America
  {
    id: 1,
    name: 'Laptop Pro 15"',
    category: 'Electronics',
    region: 'North America',
    price: 1299.99,
    stock: 45,
    status: 'active',
  },
  {
    id: 2,
    name: 'Wireless Mouse',
    category: 'Electronics',
    region: 'North America',
    price: 49.99,
    stock: 200,
    status: 'active',
  },
  {
    id: 3,
    name: 'USB-C Hub',
    category: 'Electronics',
    region: 'North America',
    price: 79.99,
    stock: 85,
    status: 'active',
  },
  // Electronics - Europe
  {
    id: 4,
    name: 'Mechanical Keyboard',
    category: 'Electronics',
    region: 'Europe',
    price: 129.99,
    stock: 60,
    status: 'active',
  },
  {
    id: 5,
    name: 'Webcam HD',
    category: 'Electronics',
    region: 'Europe',
    price: 89.99,
    stock: 35,
    status: 'discontinued',
  },
  // Electronics - Asia
  {
    id: 6,
    name: 'Gaming Monitor 27"',
    category: 'Electronics',
    region: 'Asia',
    price: 449.99,
    stock: 25,
    status: 'active',
  },
  {
    id: 7,
    name: 'Noise-Cancelling Headphones',
    category: 'Electronics',
    region: 'Asia',
    price: 299.99,
    stock: 40,
    status: 'coming_soon',
  },
  // Furniture - North America
  {
    id: 8,
    name: 'Standing Desk',
    category: 'Furniture',
    region: 'North America',
    price: 599.0,
    stock: 15,
    status: 'active',
  },
  {
    id: 9,
    name: 'Ergonomic Chair',
    category: 'Furniture',
    region: 'North America',
    price: 449.0,
    stock: 22,
    status: 'active',
  },
  // Furniture - Europe
  {
    id: 10,
    name: 'Monitor Arm',
    category: 'Furniture',
    region: 'Europe',
    price: 89.0,
    stock: 55,
    status: 'active',
  },
  {
    id: 11,
    name: 'Desk Organizer',
    category: 'Furniture',
    region: 'Europe',
    price: 34.99,
    stock: 100,
    status: 'discontinued',
  },
  // Furniture - Asia
  {
    id: 12,
    name: 'Footrest',
    category: 'Furniture',
    region: 'Asia',
    price: 45.0,
    stock: 80,
    status: 'active',
  },
  // Software - North America
  {
    id: 13,
    name: 'Project Management Suite',
    category: 'Software',
    region: 'North America',
    price: 199.99,
    stock: 999,
    status: 'active',
  },
  {
    id: 14,
    name: 'Design Tool Pro',
    category: 'Software',
    region: 'North America',
    price: 299.99,
    stock: 999,
    status: 'active',
  },
  // Software - Europe
  {
    id: 15,
    name: 'Code Editor Premium',
    category: 'Software',
    region: 'Europe',
    price: 149.99,
    stock: 999,
    status: 'active',
  },
  // Software - Asia
  {
    id: 16,
    name: 'Video Editor Suite',
    category: 'Software',
    region: 'Asia',
    price: 399.99,
    stock: 999,
    status: 'coming_soon',
  },
])

const columns: NuGridColumn<Product>[] = [
  { accessorKey: 'name', header: 'Product Name', minSize: 180, size: 220 },
  { accessorKey: 'id', header: 'ID', minSize: 60, size: 70, cellDataType: 'number' },
  { accessorKey: 'category', header: 'Category', minSize: 100, size: 120 },
  { accessorKey: 'region', header: 'Region', minSize: 100, size: 130 },
  { accessorKey: 'price', header: 'Price', minSize: 100, size: 110, cellDataType: 'currency' },
  { accessorKey: 'stock', header: 'Stock', minSize: 70, size: 80, cellDataType: 'number' },
  { accessorKey: 'status', header: 'Status', minSize: 100, size: 120 },
]

// Grouping state - defaults to category grouping
const grouping = ref<string[]>(['category'])

// Grouping options
const groupingOptions = [
  { label: 'By Category', value: 'category' },
  { label: 'By Region', value: 'region' },
  { label: 'By Category & Region', value: 'category,region' },
  { label: 'No Grouping', value: 'none' },
]
const selectedGrouping = ref('category')

watch(selectedGrouping, (val) => {
  grouping.value = val && val !== 'none' ? val.split(',') : []
})

// Export options
const includeGroupHeaders = ref(true)
const groupHeaderFormat = ref('{groupName}: {groupValue} ({count})')

// Table reference
const table = useTemplateRef<{
  excelExport: (filenameOrOptions?: string | object, sheetName?: string) => Promise<void>
}>('table')

// Check if table is ready for export
const canExport = computed(() => !!table.value)

const handleExport = () => {
  table.value?.excelExport({
    filename: 'grouped-products',
    sheetName: 'Products',
    includeGroupHeaders: includeGroupHeaders.value,
    groupHeaderFormat: groupHeaderFormat.value,
  })
}

const exampleCode = `// Get table reference
const table = useTemplateRef('table')

// Export with grouped options
table.value?.excelExport({
  filename: 'grouped-products',
  sheetName: 'Products',
  includeGroupHeaders: true,
  groupHeaderFormat: '{groupName}: {groupValue} ({count})'
})`
</script>

<template>
  <DemoLayout
    id="excel-export-grouped-demo"
    title="Grouped Excel Export Demo"
    info-label="About Grouped Export"
  >
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Total Products" :value="data.length" />
      <DemoStatusItem label="Grouping" :value="grouping.length ? grouping.join(' > ') : 'None'" />
      <DemoStatusItem label="Include Headers" :value="includeGroupHeaders" />
      <DemoStatusItem
        label="Export Ready"
        :value="canExport ? 'Yes' : 'No'"
        :color="canExport ? 'text-success' : 'text-muted'"
      />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Grouping">
        <USelect v-model="selectedGrouping" :items="groupingOptions" size="sm" />
      </DemoControlGroup>

      <DemoControlGroup label="Export Options">
        <div class="space-y-3">
          <USwitch v-model="includeGroupHeaders" label="Include Group Headers" />
          <div>
            <label class="mb-1 block text-xs text-muted">Header Format</label>
            <UInput
              v-model="groupHeaderFormat"
              size="sm"
              placeholder="{groupName}: {groupValue} ({count})"
              :disabled="!includeGroupHeaders"
            />
            <p class="mt-1 text-xs text-muted">Variables: {groupName}, {groupValue}, {count}</p>
          </div>
        </div>
      </DemoControlGroup>

      <DemoControlGroup>
        <UButton icon="i-lucide-download" :disabled="!canExport" block @click="handleExport">
          Export Grouped Data
        </UButton>
      </DemoControlGroup>

      <div class="rounded-lg border border-default/50 bg-elevated/30 p-3">
        <h4 class="mb-2 text-xs font-semibold">Data Summary:</h4>
        <ul class="space-y-1 text-xs text-muted">
          <li><strong>Categories:</strong> Electronics, Furniture, Software</li>
          <li><strong>Regions:</strong> North America, Europe, Asia</li>
        </ul>
      </div>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        This demo exports grouped grid data to Excel. Group headers are included as separate rows
        with formatting. Try different grouping options and export settings.
      </p>
      <ul class="mb-3 list-inside list-disc space-y-1 text-sm text-muted">
        <li>Exports data with group structure preserved</li>
        <li>Group header rows with customizable format</li>
        <li>Supports nested grouping (category + region)</li>
        <li>Visual indentation in export</li>
        <li>Respects column visibility and order</li>
      </ul>
    </template>

    <!-- Grid -->
    <NuGrid
      ref="table"
      v-model:grouping="grouping"
      :data="data"
      :columns="columns"
      :layout="{ mode: grouping.length ? 'group' : 'div' }"
      resize-columns
    />

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Grouped Excel Export:" :code="exampleCode" />
    </template>
  </DemoLayout>
</template>
