<script setup lang="ts">
import type { NuGridColumn, NuGridSortIcon } from '#nu-grid/types'

const table = useTemplateRef('table')

// Sample data for sorting demonstration
interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  rating: number
}

const data = ref<Product[]>([
  { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 1299.99, stock: 15, rating: 4.5 },
  { id: 2, name: 'Wireless Mouse', category: 'Accessories', price: 29.99, stock: 150, rating: 4.2 },
  { id: 3, name: 'USB-C Cable', category: 'Accessories', price: 12.99, stock: 0, rating: 3.8 },
  { id: 4, name: 'Monitor 4K', category: 'Electronics', price: 599.99, stock: 8, rating: 4.7 },
  {
    id: 5,
    name: 'Mechanical Keyboard',
    category: 'Accessories',
    price: 149.99,
    stock: 25,
    rating: 4.6,
  },
  { id: 6, name: 'Webcam HD', category: 'Electronics', price: 79.99, stock: 0, rating: 4.0 },
  { id: 7, name: 'Headphones', category: 'Audio', price: 199.99, stock: 32, rating: 4.8 },
  { id: 8, name: 'Microphone', category: 'Audio', price: 89.99, stock: 18, rating: 4.4 },
  { id: 9, name: 'Desk Lamp', category: 'Furniture', price: 45.99, stock: 42, rating: 4.3 },
  { id: 10, name: 'Chair Ergonomic', category: 'Furniture', price: 349.99, stock: 12, rating: 4.9 },
])

// Define columns with simple headers - sort icons are rendered automatically!
const columns: NuGridColumn<Product>[] = [
  { accessorKey: 'id', header: 'ID', minSize: 80 },
  { accessorKey: 'name', header: 'Product Name', minSize: 180 },
  {
    accessorKey: 'category',
    header: 'Category',
    minSize: 140,
    sortIcons: {
      unsorted: 'i-lucide-filter',
      asc: 'i-lucide-chevron-up',
      desc: 'i-lucide-chevron-down',
    },
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
    minSize: 120,
  },
  { accessorKey: 'stock', header: 'Stock', minSize: 100 },
  {
    accessorKey: 'rating',
    header: 'Rating',
    cell: ({ row }) => `⭐ ${row.original.rating}`,
    minSize: 110,
    sortIcons: {
      unsorted: 'i-lucide-star',
      asc: 'i-lucide-trending-up',
      desc: 'i-lucide-trending-down',
    },
  },
]

const columnVisibility = ref()
const selectedRows = ref({})
const columnSizing = ref({})
const sorting = ref([])

// Grid-level sort icon configuration
const gridSortIcons = ref<NuGridSortIcon>({
  unsorted: 'i-lucide-chevrons-up-down',
  unsortedHover: true,
  asc: 'i-lucide-arrow-up',
  desc: 'i-lucide-arrow-down',
  position: 'edge',
})

const useCustomIcons = ref(false)
const useHoverIcons = ref(true)

function toggleCustomIcons() {
  useCustomIcons.value = !useCustomIcons.value
  if (useCustomIcons.value) {
    gridSortIcons.value = {
      ...gridSortIcons.value,
      unsorted: 'i-lucide-chevrons-up-down',
      asc: 'i-lucide-arrow-up-narrow-wide',
      desc: 'i-lucide-arrow-down-wide-narrow',
    }
  } else {
    gridSortIcons.value = {
      ...gridSortIcons.value,
      unsorted: 'i-lucide-chevrons-up-down',
      asc: 'i-lucide-arrow-up',
      desc: 'i-lucide-arrow-down',
    }
  }
}

function toggleHoverIcons() {
  useHoverIcons.value = !useHoverIcons.value
  gridSortIcons.value = {
    ...gridSortIcons.value,
    unsortedHover: useHoverIcons.value,
  }
  if (useHoverIcons.value && !gridSortIcons.value.unsorted) {
    gridSortIcons.value.unsorted = 'i-lucide-chevrons-up-down'
  }
}

function toggleSortIconPosition() {
  gridSortIcons.value = {
    ...gridSortIcons.value,
    position: gridSortIcons.value.position === 'edge' ? 'inline' : 'edge',
  }
}

function clearSorting() {
  sorting.value = []
}

const exampleCode = `// Define columns with simple headers - sort icons are automatic!
const columns = [
  { accessorKey: 'name', header: 'Product Name' },
  {
    accessorKey: 'category',
    header: 'Category',
    // Optional: Column-specific custom icons
    sortIcons: {
      unsorted: 'i-lucide-filter',
      asc: 'i-lucide-chevron-up',
      desc: 'i-lucide-chevron-down'
    }
  }
]

// Grid-level configuration
<NuGrid
  v-model:sorting="sorting"
  :column-defaults="{
    sortIcons: {
      unsorted: 'i-lucide-chevrons-up-down',
      unsortedHover: true,
      asc: 'i-lucide-arrow-up',
      desc: 'i-lucide-arrow-down',
      position: 'edge'
    }
  }"
  :columns="columns"
  :data="data"
/>`
</script>

<template>
  <DemoLayout
    id="header-sort-demo"
    title="Header Sort Button Demo"
    info-label="About Header Sort Button"
  >
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Active Sorts" :value="sorting.length" color="text-primary" />
      <DemoStatusItem
        label="Custom Icons"
        :value="useCustomIcons ? 'Active' : 'Default'"
        :color="useCustomIcons ? 'text-success' : 'text-muted'"
      />
      <DemoStatusItem
        label="Hover Mode"
        :value="useHoverIcons ? 'Enabled' : 'Disabled'"
        :color="useHoverIcons ? 'text-warning' : 'text-muted'"
      />
      <DemoStatusItem label="Position" :value="gridSortIcons.position" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Icons">
        <UButton
          block
          :color="useCustomIcons ? 'success' : 'neutral'"
          :variant="useCustomIcons ? 'solid' : 'outline'"
          icon="i-lucide-palette"
          size="sm"
          @click="toggleCustomIcons"
        >
          {{ useCustomIcons ? 'Custom' : 'Default' }} Icons
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Hover Mode">
        <UButton
          block
          :color="useHoverIcons ? 'warning' : 'neutral'"
          :variant="useHoverIcons ? 'solid' : 'outline'"
          icon="i-lucide-mouse-pointer"
          size="sm"
          @click="toggleHoverIcons"
        >
          {{ useHoverIcons ? 'Enabled' : 'Disabled' }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Icon Position">
        <UButton
          block
          color="neutral"
          variant="outline"
          :icon="
            gridSortIcons.position === 'inline'
              ? 'i-lucide-arrow-right-to-line'
              : 'i-lucide-arrow-left-to-line'
          "
          size="sm"
          @click="toggleSortIconPosition"
        >
          {{ gridSortIcons.position === 'edge' ? 'Edge' : 'Inline' }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup v-if="sorting.length > 0">
        <UButton
          block
          color="neutral"
          variant="outline"
          icon="i-lucide-x"
          size="sm"
          @click="clearSorting"
        >
          Clear Sorting
        </UButton>
      </DemoControlGroup>

      <!-- Current Sort State -->
      <div class="rounded-lg border border-default bg-elevated/30 p-3">
        <h3 class="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Sort State</h3>
        <pre class="max-h-24 overflow-auto rounded bg-default/50 p-2 text-xs">{{
          JSON.stringify(sorting, null, 2)
        }}</pre>
      </div>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        This page demonstrates automatic sort icon rendering in NuGrid headers.
      </p>
      <ul class="mb-3 list-inside list-disc space-y-1 text-sm text-muted">
        <li><strong>Automatic Rendering:</strong> Sort icons appear automatically</li>
        <li>
          <strong>Grid-Level Icons:</strong> Default icons via
          <code class="rounded bg-default px-1 py-0.5 text-xs">sortIcons</code> prop
        </li>
        <li>
          <strong>Column-Level Icons:</strong> Individual columns can override (see Category and
          Rating)
        </li>
        <li><strong>Hover Mode:</strong> Unsorted icons can show only on hover</li>
        <li><strong>Multi-Sort:</strong> Hold Shift to sort by multiple columns</li>
      </ul>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Try It:</strong>
        <ul class="mt-1 ml-2 list-inside list-disc">
          <li>Click any column header to sort</li>
          <li>Click again to reverse direction</li>
          <li>
            Hold <kbd class="rounded bg-default px-1 py-0.5 text-xs">Shift</kbd> for multi-sort
          </li>
        </ul>
      </div>
    </template>

    <!-- Grid -->
    <div class="overflow-x-auto">
      <NuGrid
        ref="table"
        v-model:column-visibility="columnVisibility"
        v-model:selected-rows="selectedRows"
        v-model:column-sizing="columnSizing"
        v-model:sorting="sorting"
        :column-defaults="{ sortIcons: gridSortIcons, resize: true, reorder: true }"
        :layout="{ mode: 'div', stickyHeaders: true }"
        :data="data"
        :columns="columns"
        :ui="{
          base: 'w-max min-w-full border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0',
        }"
      />
    </div>

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Automatic Sort Icons:" :code="exampleCode" />
    </template>
  </DemoLayout>
</template>

<style scoped>
code,
kbd {
  font-family: 'Monaco', 'Courier New', monospace;
}
</style>
