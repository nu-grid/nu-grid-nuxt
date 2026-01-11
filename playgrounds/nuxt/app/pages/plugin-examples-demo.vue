<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

const toast = useToast()
const table = useTemplateRef('table')

// Sample data showcasing rating and currency plugins
interface Product {
  id: number
  name: string
  price: number
  rating: number | null
  currency: string
  usdPrice: number
  eurPrice: number
  gbpPrice: number
}

const data = ref<Product[]>([
  {
    id: 1,
    name: 'Laptop Pro',
    price: 1299.99,
    rating: 5,
    currency: 'USD',
    usdPrice: 1299.99,
    eurPrice: 1199.99,
    gbpPrice: 1099.99,
  },
  {
    id: 2,
    name: 'Wireless Mouse',
    price: 29.99,
    rating: 4,
    currency: 'USD',
    usdPrice: 29.99,
    eurPrice: 27.99,
    gbpPrice: 24.99,
  },
  {
    id: 3,
    name: 'USB-C Cable',
    price: 12.99,
    rating: 3,
    currency: 'USD',
    usdPrice: 12.99,
    eurPrice: 11.99,
    gbpPrice: 10.99,
  },
  {
    id: 4,
    name: 'Monitor 4K',
    price: 599.99,
    rating: 5,
    currency: 'USD',
    usdPrice: 599.99,
    eurPrice: 549.99,
    gbpPrice: 499.99,
  },
  {
    id: 5,
    name: 'Mechanical Keyboard',
    price: 149.99,
    rating: 4,
    currency: 'USD',
    usdPrice: 149.99,
    eurPrice: 139.99,
    gbpPrice: 129.99,
  },
  {
    id: 6,
    name: 'Webcam HD',
    price: 79.99,
    rating: null,
    currency: 'USD',
    usdPrice: 79.99,
    eurPrice: 74.99,
    gbpPrice: 69.99,
  },
  {
    id: 7,
    name: 'Gaming Headset',
    price: 199.99,
    rating: 5,
    currency: 'USD',
    usdPrice: 199.99,
    eurPrice: 189.99,
    gbpPrice: 179.99,
  },
  {
    id: 8,
    name: 'SSD 1TB',
    price: 89.99,
    rating: 4,
    currency: 'USD',
    usdPrice: 89.99,
    eurPrice: 84.99,
    gbpPrice: 79.99,
  },
])

const columns: (NuGridColumn<Product> & Record<string, any>)[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    minSize: 60,
    cellDataType: 'number',
  },
  {
    accessorKey: 'name',
    header: 'Product Name',
    minSize: 150,
    cellDataType: 'text',
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    minSize: 240,
    cellDataType: 'rating',
    description: '1-5 star rating. Press 1-5 keys to set rating directly.',
  },
  {
    accessorKey: 'usdPrice',
    header: 'Price (USD)',
    minSize: 130,
    cellDataType: 'currency',
    currency: 'USD',
    locale: 'en-US',
    description: 'US Dollar pricing with currency formatting',
  },
  {
    accessorKey: 'eurPrice',
    header: 'Price (EUR)',
    minSize: 130,
    cellDataType: 'currency',
    currency: 'EUR',
    locale: 'de-DE',
    description: 'Euro pricing with German locale formatting',
  },
  {
    accessorKey: 'gbpPrice',
    header: 'Price (GBP)',
    minSize: 130,
    cellDataType: 'currency',
    currency: 'GBP',
    locale: 'en-GB',
    description: 'British Pound pricing with UK locale formatting',
  },
]

function handleCellChange(payload: { row: any; column: any; oldValue: any; newValue: any }) {
  toast.add({
    title: 'Cell Updated',
    description: `${payload.column.id}: ${payload.oldValue} → ${payload.newValue}`,
    color: 'success',
  })
}
</script>

<template>
  <DemoLayout id="plugin-examples-demo" title="Plugin Examples Demo">
    <template #status>
      <DemoStatusItem label="Products" :value="data.length" />
      <DemoStatusItem label="Rating Plugin" value="Active" color="text-success" />
      <DemoStatusItem label="Currency Plugin" value="Active" color="text-success" />
    </template>

    <template #controls>
      <DemoControlGroup label="Documentation">
        <UButton
          label="View Plugin Guide"
          icon="i-lucide-book"
          color="primary"
          variant="outline"
          block
          to="https://github.com/nuxt-ui-templates/dashboard/blob/main/COLUMN_PLUGIN_GUIDE.md"
          target="_blank"
        />
      </DemoControlGroup>

      <DemoControlGroup label="Tips">
        <div class="rounded bg-default/50 p-2 text-xs text-muted">
          <strong>Rating:</strong> Click stars or press 1-5 keys
        </div>
        <div class="rounded bg-default/50 p-2 text-xs text-muted">
          <strong>Currency:</strong> Supports USD, EUR, GBP with locale formatting
        </div>
      </DemoControlGroup>
    </template>

    <template #info>
      <p class="mb-3 text-sm text-muted">
        This demo showcases the <strong>Rating</strong> and <strong>Currency</strong> column
        plugins. These are example implementations demonstrating the plugin system's capabilities.
      </p>
      <div class="mb-3 space-y-2">
        <div>
          <h4 class="mb-1 font-semibold">Rating Plugin</h4>
          <ul class="list-inside list-disc space-y-1 text-sm text-muted">
            <li>Visual star rating editor (1-5 stars)</li>
            <li>Press number keys 1-5 to set rating directly</li>
            <li>Range filter with operators (equals, at least, at most, between)</li>
            <li>Validation ensures rating is between 1-5</li>
            <li>Formatter displays stars and rating value</li>
          </ul>
        </div>
        <div>
          <h4 class="mb-1 font-semibold">Currency Plugin</h4>
          <ul class="list-inside list-disc space-y-1 text-sm text-muted">
            <li>Currency input with $ prefix</li>
            <li>Automatic formatting using Intl.NumberFormat</li>
            <li>Supports different currencies (USD, EUR, GBP)</li>
            <li>Locale-aware formatting</li>
            <li>Range filter with operators</li>
          </ul>
        </div>
      </div>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Tip:</strong> Double-click cells to start editing. Use Tab/Shift+Tab to navigate
        between cells, Enter to save, or Escape to cancel. For rating cells, press 1-5 keys to set
        rating directly.
      </div>
    </template>

    <NuGrid
      ref="table"
      :data="data"
      :columns="columns"
      :editing="{ enabled: true, startKeys: 'all', startClicks: 'double' }"
      @cell-value-changed="handleCellChange"
    />

    <template #code>
      <DemoCodeBlock
        code="const columns = [
  {
    accessorKey: 'rating',
    header: 'Rating',
    cellDataType: 'rating',  // Uses rating plugin
  },
  {
    accessorKey: 'usdPrice',
    header: 'Price (USD)',
    cellDataType: 'currency',
    currency: 'USD',
    locale: 'en-US',
  },
  {
    accessorKey: 'eurPrice',
    header: 'Price (EUR)',
    cellDataType: 'currency',
    currency: 'EUR',
    locale: 'de-DE',
  },
]"
      />
    </template>

    <template #extra>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <UCard>
          <template #header>
            <h3 class="font-semibold">Rating Plugin Features</h3>
          </template>
          <ul class="space-y-2 text-sm">
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="size-4 text-success" />
              Visual star editor (click stars to rate)
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="size-4 text-success" />
              Keyboard shortcuts (1-5 keys)
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="size-4 text-success" />
              Range filter with operators
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="size-4 text-success" />
              Validation (1-5 range)
            </li>
          </ul>
        </UCard>
        <UCard>
          <template #header>
            <h3 class="font-semibold">Currency Plugin Features</h3>
          </template>
          <ul class="space-y-2 text-sm">
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="size-4 text-success" />
              Currency formatting (USD, EUR, GBP)
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="size-4 text-success" />
              Locale-aware formatting
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="size-4 text-success" />
              Range filter with operators
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="size-4 text-success" />
              Numeric validation
            </li>
          </ul>
        </UCard>
      </div>
    </template>
  </DemoLayout>
</template>
