<script setup lang="ts">
import type { NuGridColumn, NuGridSearchOptions } from '#nu-grid/types'

const toast = useToast()
const table = useTemplateRef('table')

// Sample data for demonstration
interface Product {
  id: number
  name: string
  category: string
  brand: string
  price: number
  stock: number
  sku: string
  description: string
}

const categories = ['Electronics', 'Clothing', 'Home', 'Sports', 'Books', 'Food', 'Toys', 'Garden'] as const
const brands = ['Apple', 'Nike', 'Samsung', 'Sony', 'Adidas', 'Microsoft', 'LG', 'Amazon', 'Google', 'Dell'] as const

// Generate rows of data
function generateData(count: number): Product[] {
  const products: Product[] = []
  const adjectives = ['Premium', 'Basic', 'Pro', 'Ultra', 'Compact', 'Deluxe', 'Essential', 'Advanced']
  const items = ['Widget', 'Gadget', 'Device', 'Tool', 'Kit', 'Pack', 'Set', 'Bundle']

  for (let i = 1; i <= count; i++) {
    const category = categories[i % categories.length]!
    const brand = brands[i % brands.length]!
    const adj = adjectives[i % adjectives.length]!
    const item = items[i % items.length]!
    // Use deterministic values based on index to avoid hydration mismatches
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
      description: `${adj} ${category.toLowerCase()} ${item.toLowerCase()} from ${brand}. Perfect for everyday use.`,
    })
  }
  return products
}

const initialData = generateData(100)
const data = ref<Product[]>([...initialData])

// Search options
const searchEnabled = ref(true)
const debounce = ref(300)
const autofocus = ref(false)
const clearable = ref(true)
const suppressPanel = ref(false)
const typeToSearch = ref(true)
const focusOnResults = ref(true)
const highlightColor = ref<'primary' | 'yellow' | 'green' | 'blue' | 'orange' | 'red'>('primary')
const placeholder = ref('Search products...')

const highlightColorOptions = [
  { label: 'Primary', value: 'primary' },
  { label: 'Yellow', value: 'yellow' },
  { label: 'Green', value: 'green' },
  { label: 'Blue', value: 'blue' },
  { label: 'Orange', value: 'orange' },
  { label: 'Red', value: 'red' },
]

// External search query (for standalone demo)
const externalQuery = ref('')

const searchOptions = computed<NuGridSearchOptions | boolean>(() => {
  if (!searchEnabled.value) return false
  return {
    enabled: true,
    placeholder: placeholder.value,
    debounce: debounce.value,
    autofocus: autofocus.value,
    clearable: clearable.value,
    suppressPanel: suppressPanel.value,
    typeToSearch: typeToSearch.value,
    focusOnResults: focusOnResults.value,
    highlightColor: highlightColor.value,
  }
})

const { focusMode, toggleFocusMode, focusModeIcon, focusModeLabel } = useFocusModeToggle()

// Editing mode toggle (off by default to demonstrate type-to-search)
const editingEnabled = ref(false)

// Track if SKU column is searchable
const skuSearchable = ref(true)

// Columns
const columns = computed<NuGridColumn<Product>[]>(() => [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 60,
    enableEditing: false,
    enableSorting: true,
    enableSearching: false, // ID is never searchable
  },
  {
    accessorKey: 'name',
    header: 'Product Name',
    size: 200,
    enableSorting: true,
  },
  {
    accessorKey: 'category',
    header: 'Category',
    size: 120,
    enableSorting: true,
  },
  {
    accessorKey: 'brand',
    header: 'Brand',
    size: 100,
    enableSorting: true,
  },
  {
    accessorKey: 'price',
    header: 'Price',
    size: 90,
    enableSorting: true,
    cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    size: 80,
    enableSorting: true,
  },
  {
    accessorKey: 'sku',
    header: 'SKU',
    size: 150,
    enableSorting: true,
    enableSearching: skuSearchable.value, // Toggle-able
  },
  {
    accessorKey: 'description',
    header: 'Description',
    size: 300,
    enableSorting: false,
  },
])

const sorting = ref([])

// Demo actions
function clearSearch() {
  table.value?.searchClear()
  toast.add({
    title: 'Search Cleared',
    description: 'Search query has been cleared',
    color: 'neutral',
  })
}

function focusSearch() {
  table.value?.searchFocus()
  toast.add({
    title: 'Search Focused',
    description: 'Search input is now focused',
    color: 'info',
  })
}

function setSearchQuery(query: string) {
  table.value?.searchSetQuery(query)
  toast.add({
    title: 'Search Set',
    description: `Search query set to "${query}"`,
    color: 'info',
  })
}

function resetData() {
  data.value = [...initialData]
  toast.add({
    title: 'Data Reset',
    description: `Reset to ${initialData.length} rows`,
    color: 'neutral',
  })
}

const debounceOptions = [
  { label: 'Instant (0ms)', value: 0 },
  { label: 'Fast (100ms)', value: 100 },
  { label: 'Default (300ms)', value: 300 },
  { label: 'Slow (500ms)', value: 500 },
]

const selectedDebounce = ref(300)

watch(selectedDebounce, (val) => {
  debounce.value = val
})

const exampleCode = `<!-- Built-in search panel -->
<NuGrid
  :data="data"
  :columns="columns"
  :search="{
    enabled: true,
    placeholder: 'Search...',
    debounce: 300,
    typeToSearch: true
  }"
/>

<!-- Enable with defaults -->
<NuGrid
  :data="data"
  :columns="columns"
  :search="true"
/>

<!-- Standalone component -->
<NuGridSearch v-model="query" placeholder="Filter..." />
<NuGrid
  :data="data"
  :columns="columns"
  v-model:global-filter="query"
/>

<!-- Exclude column from search -->
const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'internalId', enableSearching: false },
]`
</script>

<template>
  <DemoLayout id="search-demo" title="Search Demo" info-label="About Search">
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Total Rows" :value="data.length" />
      <DemoStatusItem
        label="Search"
        :value="searchEnabled ? 'Enabled' : 'Disabled'"
        :color="searchEnabled ? 'text-success' : 'text-warning'"
      />
      <template v-if="searchEnabled">
        <DemoStatusItem label="Debounce" :value="`${debounce}ms`" />
        <DemoStatusItem
          label="Type-to-Search"
          :value="typeToSearch ? 'On' : 'Off'"
          :color="typeToSearch ? 'text-info' : 'text-dimmed'"
        />
        <DemoStatusItem
          label="Focus Results"
          :value="focusOnResults ? 'On' : 'Off'"
          :color="focusOnResults ? 'text-info' : 'text-dimmed'"
        />
        <DemoStatusItem
          label="Panel"
          :value="suppressPanel ? 'Hidden' : 'Visible'"
          :color="suppressPanel ? 'text-warning' : 'text-success'"
        />
        <DemoStatusItem
          label="Highlight"
          :value="highlightColor.charAt(0).toUpperCase() + highlightColor.slice(1)"
        />
      </template>
      <DemoStatusItem
        label="Editing"
        :value="editingEnabled ? 'On' : 'Off'"
        :color="editingEnabled ? 'text-info' : 'text-dimmed'"
      />
      <DemoStatusItem label="Focus Mode" :value="focusModeLabel" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Search">
        <UButton
          block
          :color="searchEnabled ? 'success' : 'warning'"
          :variant="searchEnabled ? 'solid' : 'outline'"
          icon="i-lucide-search"
          size="sm"
          @click="searchEnabled = !searchEnabled"
        >
          {{ searchEnabled ? 'Enabled' : 'Disabled' }}
        </UButton>
      </DemoControlGroup>

      <template v-if="searchEnabled">
        <DemoControlGroup label="Debounce">
          <USelectMenu
            v-model="selectedDebounce"
            :items="debounceOptions"
            value-key="value"
            size="sm"
          />
        </DemoControlGroup>

        <DemoControlGroup label="Type-to-Search">
          <UButton
            block
            :color="typeToSearch ? 'info' : 'neutral'"
            :variant="typeToSearch ? 'solid' : 'outline'"
            icon="i-lucide-keyboard"
            size="sm"
            @click="typeToSearch = !typeToSearch"
          >
            {{ typeToSearch ? 'Enabled' : 'Disabled' }}
          </UButton>
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

        <DemoControlGroup label="Highlight Color">
          <USelectMenu
            v-model="highlightColor"
            :items="highlightColorOptions"
            value-key="value"
            size="sm"
          />
        </DemoControlGroup>

        <DemoControlGroup label="Autofocus">
          <UButton
            block
            :color="autofocus ? 'info' : 'neutral'"
            :variant="autofocus ? 'solid' : 'outline'"
            icon="i-lucide-focus"
            size="sm"
            @click="autofocus = !autofocus"
          >
            {{ autofocus ? 'On' : 'Off' }}
          </UButton>
        </DemoControlGroup>

        <DemoControlGroup label="Panel Visibility">
          <UButton
            block
            :color="suppressPanel ? 'warning' : 'success'"
            :variant="suppressPanel ? 'outline' : 'solid'"
            icon="i-lucide-panel-top"
            size="sm"
            @click="suppressPanel = !suppressPanel"
          >
            {{ suppressPanel ? 'Hidden' : 'Visible' }}
          </UButton>
        </DemoControlGroup>

        <DemoControlGroup label="SKU Column Searchable">
          <UButton
            block
            :color="skuSearchable ? 'success' : 'warning'"
            :variant="skuSearchable ? 'solid' : 'outline'"
            icon="i-lucide-filter"
            size="sm"
            @click="skuSearchable = !skuSearchable"
          >
            {{ skuSearchable ? 'Searchable' : 'Excluded' }}
          </UButton>
        </DemoControlGroup>

        <DemoControlGroup label="Search Actions">
          <div class="grid grid-cols-2 gap-1">
            <UButton color="info" icon="i-lucide-focus" size="xs" @click="focusSearch">
              Focus
            </UButton>
            <UButton color="warning" icon="i-lucide-x" size="xs" @click="clearSearch">
              Clear
            </UButton>
          </div>
          <div class="grid grid-cols-2 gap-1">
            <UButton color="neutral" size="xs" @click="setSearchQuery('Apple')">
              "Apple"
            </UButton>
            <UButton color="neutral" size="xs" @click="setSearchQuery('Premium')">
              "Premium"
            </UButton>
          </div>
        </DemoControlGroup>
      </template>

      <DemoControlGroup label="Editing">
        <UButton
          block
          :color="editingEnabled ? 'info' : 'neutral'"
          :variant="editingEnabled ? 'solid' : 'outline'"
          icon="i-lucide-pencil"
          size="sm"
          @click="editingEnabled = !editingEnabled"
        >
          {{ editingEnabled ? 'Enabled' : 'Disabled' }}
        </UButton>
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

      <DemoControlGroup label="Data Actions">
        <UButton
          block
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
          size="sm"
          @click="resetData"
        >
          Reset Data
        </UButton>
      </DemoControlGroup>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-dimmed">
        This page demonstrates the search-as-you-type feature for NuGrid. Search filters rows
        in real-time with debounced input and highlights matching text in cells.
      </p>

      <div class="mb-3 rounded bg-default/50 p-2 text-sm text-dimmed">
        <strong>Search Options:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li><strong>enabled:</strong> Enable or disable search (default: false)</li>
          <li><strong>placeholder:</strong> Input placeholder text (default: 'Search...')</li>
          <li><strong>debounce:</strong> Debounce delay in ms (default: 300)</li>
          <li><strong>autofocus:</strong> Auto-focus search input on mount (default: false)</li>
          <li><strong>clearable:</strong> Show clear button (default: true)</li>
          <li><strong>suppressPanel:</strong> Hide built-in panel (default: false)</li>
          <li><strong>typeToSearch:</strong> Start searching when typing while grid is focused (default: true)</li>
        </ul>
      </div>

      <div class="rounded bg-default/50 p-2 text-sm text-dimmed">
        <strong>How It Works:</strong>
        <p class="mt-1">
          NuGrid uses TanStack Table's global filter with debounced input. Matching text is
          highlighted in cells. Use <code>enableSearching: false</code> on columns to exclude
          them from search. When type-to-search is enabled, just click the grid and start typing!
        </p>
      </div>
    </template>

    <!-- Grid -->
    <NuGrid
      ref="table"
      v-model:sorting="sorting"
      :data="data"
      :columns="columns"
      :search="searchOptions"
      :focus="{ mode: focusMode }"
      :layout="{ mode: 'div', stickyHeaders: true }"
      :editing="{ enabled: editingEnabled, startClicks: 'double' }"
    />

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Basic Usage:" :code="exampleCode" />
    </template>

    <!-- Extra: Implementation Notes -->
    <template #extra>
      <UAccordion
        :items="[{ label: 'Implementation Notes', icon: 'i-lucide-file-text', slot: 'notes' }]"
      >
        <template #notes>
          <div class="space-y-2 p-4 text-sm text-dimmed">
            <p><strong>Key Points:</strong></p>
            <ul class="list-inside list-disc space-y-1">
              <li>
                <strong>Disabled by default:</strong> Search is off by default
              </li>
              <li>
                <strong>Simple enable:</strong> Use <code>:search="true"</code> to enable with
                defaults
              </li>
              <li>
                <strong>Type-to-search:</strong> When the grid has focus (not editing), typing
                automatically activates search
              </li>
              <li>
                <strong>Match highlighting:</strong> Matching text is highlighted with a yellow
                background
              </li>
              <li>
                <strong>Column exclusion:</strong> Use <code>enableSearching: false</code> to
                exclude columns from search
              </li>
              <li>
                <strong>Programmatic control:</strong> Use exposed methods like
                <code>searchSetQuery()</code>, <code>searchClear()</code>, and <code>searchFocus()</code>
              </li>
              <li>
                <strong>Standalone component:</strong> Use <code>NuGridSearch</code> with
                <code>v-model:global-filter</code> for custom layouts
              </li>
            </ul>
          </div>
        </template>
      </UAccordion>
    </template>
  </DemoLayout>
</template>
