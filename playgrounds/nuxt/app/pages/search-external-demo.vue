<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

const table = useTemplateRef('table')

// Sample data
interface Product {
  id: number
  name: string
  category: string
  brand: string
  price: number
  stock: number
  sku: string
}

const categories = ['Electronics', 'Clothing', 'Home', 'Sports', 'Books', 'Food', 'Toys', 'Garden'] as const
const brands = ['Apple', 'Nike', 'Samsung', 'Sony', 'Adidas', 'Microsoft', 'LG', 'Amazon', 'Google', 'Dell'] as const

function generateData(count: number): Product[] {
  const products: Product[] = []
  const adjectives = ['Premium', 'Basic', 'Pro', 'Ultra', 'Compact', 'Deluxe', 'Essential', 'Advanced']
  const items = ['Widget', 'Gadget', 'Device', 'Tool', 'Kit', 'Pack', 'Set', 'Bundle']

  for (let i = 1; i <= count; i++) {
    const category = categories[i % categories.length]!
    const brand = brands[i % brands.length]!
    const adj = adjectives[i % adjectives.length]!
    const item = items[i % items.length]!
    const price = Math.round((10 + ((i * 7.13) % 990)) * 100) / 100
    const stock = (i * 17) % 500
    products.push({
      id: i,
      name: `${adj} ${item} ${i}`,
      category,
      brand,
      price,
      stock,
      sku: `SKU-${brand.substring(0, 3).toUpperCase()}-${String(i).padStart(5, '0')}`,
    })
  }
  return products
}

const data = ref<Product[]>(generateData(100))

// External search query - bound via v-model:global-filter
const searchQuery = ref('')

// Type-to-search toggle
const typeToSearch = ref(true)

// Focus on results toggle (defaults to false for external search)
const focusOnResults = ref(false)

// Columns
const columns: NuGridColumn<Product>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 60,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 200,
  },
  {
    accessorKey: 'category',
    header: 'Category',
    size: 120,
  },
  {
    accessorKey: 'brand',
    header: 'Brand',
    size: 120,
  },
  {
    accessorKey: 'price',
    header: 'Price',
    size: 100,
    cell: ({ getValue }) => {
      const value = getValue() as number
      return `$${value.toFixed(2)}`
    },
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    size: 80,
  },
  {
    accessorKey: 'sku',
    header: 'SKU',
    size: 150,
    // Exclude SKU from search
    enableGlobalFilter: false,
  },
]

const { focusMode, toggleFocusMode, focusModeIcon, focusModeLabel } = useFocusModeToggle()

// Quick search presets
function quickSearch(term: string) {
  searchQuery.value = term
}

function clearSearch() {
  searchQuery.value = ''
}

// Use grid ref methods
function focusSearchViaRef() {
  table.value?.searchFocus()
}

// Example code
const exampleCode = `<script setup lang="ts">
const searchQuery = ref('')
<\/script>

<template>
  <!-- External search component -->
  <NuGridSearch
    v-model="searchQuery"
    placeholder="Search products..."
    :debounce="300"
  />

  <!-- Grid with external search binding -->
  <NuGrid
    v-model:global-filter="searchQuery"
    :data="data"
    :columns="columns"
    :search="{
      enabled: true,
      suppressPanel: true,  // Hide built-in panel
      typeToSearch: true    // Still capture keystrokes
    }"
  />
</template>`
</script>

<template>
  <DemoLayout
    id="search-external-demo"
    title="External Search Demo"
    info-label="About External Search"
    info-title="External Search Integration"
  >
    <!-- Status Bar -->
    <template #status>
      <DemoStatusItem
        label="Query"
        :value="searchQuery || '(empty)'"
        :color="searchQuery ? 'text-info' : 'text-dimmed'"
      />
      <DemoStatusItem
        label="Type-to-Search"
        :value="typeToSearch ? 'On' : 'Off'"
        :color="typeToSearch ? 'text-success' : 'text-dimmed'"
      />
      <DemoStatusItem
        label="Focus Results"
        :value="focusOnResults ? 'On' : 'Off'"
        :color="focusOnResults ? 'text-info' : 'text-dimmed'"
      />
      <DemoStatusItem label="Focus Mode" :value="focusModeLabel" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="External Search">
        <NuGridSearch
          v-model="searchQuery"
          placeholder="Search products..."
          :debounce="300"
          class="w-full"
        />
        <div class="flex gap-1 mt-2">
          <UButton color="neutral" size="xs" @click="clearSearch">
            Clear
          </UButton>
          <UButton color="neutral" size="xs" @click="focusSearchViaRef">
            Focus via Ref
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Quick Search">
        <div class="flex flex-wrap gap-1">
          <UButton color="neutral" size="xs" @click="quickSearch('Apple')">
            Apple
          </UButton>
          <UButton color="neutral" size="xs" @click="quickSearch('Sony')">
            Sony
          </UButton>
          <UButton color="neutral" size="xs" @click="quickSearch('Premium')">
            Premium
          </UButton>
          <UButton color="neutral" size="xs" @click="quickSearch('Electronics')">
            Electronics
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Type-to-Search">
        <UButton
          block
          :color="typeToSearch ? 'success' : 'neutral'"
          :variant="typeToSearch ? 'solid' : 'outline'"
          icon="i-lucide-keyboard"
          size="sm"
          @click="typeToSearch = !typeToSearch"
        >
          {{ typeToSearch ? 'Enabled' : 'Disabled' }}
        </UButton>
        <p class="text-xs text-muted mt-1">
          Click grid and type to search
        </p>
      </DemoControlGroup>

      <DemoControlGroup label="Focus Results">
        <UButton
          block
          :color="focusOnResults ? 'info' : 'neutral'"
          :variant="focusOnResults ? 'solid' : 'outline'"
          icon="i-lucide-locate"
          size="sm"
          @click="focusOnResults = !focusOnResults"
        >
          {{ focusOnResults ? 'Enabled' : 'Disabled' }}
        </UButton>
        <p class="text-xs text-muted mt-1">
          Auto-focus first match
        </p>
      </DemoControlGroup>

      <DemoControlGroup label="Focus Mode">
        <UButton
          block
          color="neutral"
          variant="outline"
          :icon="focusModeIcon"
          size="sm"
          @click="toggleFocusMode"
        >
          {{ focusModeLabel }}
        </UButton>
      </DemoControlGroup>
    </template>

    <!-- Grid -->
    <NuGrid
      ref="table"
      v-model:global-filter="searchQuery"
      :data="data"
      :columns="columns"
      :search="{
        enabled: true,
        suppressPanel: true,
        typeToSearch: typeToSearch,
        focusOnResults: focusOnResults,
      }"
      :focus="{ mode: focusMode }"
      :layout="{ mode: 'div', stickyHeaders: true }"
    />

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="External Search:" :code="exampleCode" />
    </template>

    <!-- Info Panel -->
    <template #info>
      <UAccordion
        :items="[
          { label: 'How it works', slot: 'how-it-works', defaultOpen: true },
          { label: 'Key features', slot: 'features' },
          { label: 'API Methods', slot: 'api' },
        ]"
      >
        <template #how-it-works>
          <div class="text-sm text-muted space-y-2">
            <p>
              This demo shows how to use an external search component instead of
              the built-in search panel.
            </p>
            <ol class="list-decimal list-inside space-y-1">
              <li>Use <code>NuGridSearch</code> component anywhere</li>
              <li>Bind it to a ref with <code>v-model</code></li>
              <li>Connect to grid via <code>v-model:global-filter</code></li>
              <li>Set <code>suppressPanel: true</code> to hide built-in panel</li>
            </ol>
          </div>
        </template>

        <template #features>
          <div class="text-sm text-muted space-y-2">
            <ul class="list-disc list-inside space-y-1">
              <li><strong>Type-to-search:</strong> Still works! Click grid and type</li>
              <li><strong>Focus management:</strong> First match is auto-focused</li>
              <li><strong>Highlighting:</strong> Matches are highlighted in cells</li>
              <li><strong>Empty state:</strong> Shows "No results" when filtering</li>
              <li><strong>Debouncing:</strong> Configurable delay on input</li>
            </ul>
          </div>
        </template>

        <template #api>
          <div class="text-sm text-muted space-y-2">
            <p>Grid ref methods for programmatic control:</p>
            <ul class="list-disc list-inside space-y-1">
              <li><code>searchFocus()</code> - Focus the search input</li>
              <li><code>searchSetQuery(q)</code> - Set search query</li>
              <li><code>searchClear()</code> - Clear the search</li>
              <li><code>searchGetQuery()</code> - Get current query</li>
              <li><code>searchIsActive()</code> - Check if searching</li>
            </ul>
          </div>
        </template>
      </UAccordion>
    </template>
  </DemoLayout>
</template>
