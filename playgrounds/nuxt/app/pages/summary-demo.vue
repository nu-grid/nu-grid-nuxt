<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface SalesData {
  id: number
  product: string
  category: string
  region: string
  quantity: number
  unitPrice: number
  discount: number
  revenue: number
  rating: number
}

// Sample sales data
const data = ref<SalesData[]>([
  { id: 1, product: 'Laptop Pro', category: 'Electronics', region: 'North', quantity: 45, unitPrice: 1299, discount: 0.1, revenue: 52605.5, rating: 4.5 },
  { id: 2, product: 'Wireless Mouse', category: 'Electronics', region: 'North', quantity: 230, unitPrice: 49.99, discount: 0.05, revenue: 10922.81, rating: 4.2 },
  { id: 3, product: 'USB-C Hub', category: 'Electronics', region: 'South', quantity: 120, unitPrice: 79.99, discount: 0.15, revenue: 8158.98, rating: 4.0 },
  { id: 4, product: 'Monitor 27"', category: 'Electronics', region: 'East', quantity: 65, unitPrice: 449, discount: 0.12, revenue: 25683.8, rating: 4.7 },
  { id: 5, product: 'Mechanical Keyboard', category: 'Electronics', region: 'West', quantity: 180, unitPrice: 129, discount: 0.08, revenue: 21362.4, rating: 4.4 },
  { id: 6, product: 'Office Chair', category: 'Furniture', region: 'North', quantity: 35, unitPrice: 299, discount: 0.2, revenue: 8372, rating: 4.1 },
  { id: 7, product: 'Standing Desk', category: 'Furniture', region: 'South', quantity: 28, unitPrice: 549, discount: 0.15, revenue: 13064.7, rating: 4.6 },
  { id: 8, product: 'Desk Lamp', category: 'Furniture', region: 'East', quantity: 95, unitPrice: 45, discount: 0.05, revenue: 4061.25, rating: 3.9 },
  { id: 9, product: 'Filing Cabinet', category: 'Furniture', region: 'West', quantity: 42, unitPrice: 189, discount: 0.1, revenue: 7140.6, rating: 4.0 },
  { id: 10, product: 'Bookshelf', category: 'Furniture', region: 'North', quantity: 55, unitPrice: 159, discount: 0.12, revenue: 7693.56, rating: 4.3 },
  { id: 11, product: 'Headphones Pro', category: 'Audio', region: 'South', quantity: 150, unitPrice: 249, discount: 0.1, revenue: 33615, rating: 4.8 },
  { id: 12, product: 'Bluetooth Speaker', category: 'Audio', region: 'East', quantity: 200, unitPrice: 99, discount: 0.15, revenue: 16830, rating: 4.2 },
  { id: 13, product: 'Microphone', category: 'Audio', region: 'West', quantity: 85, unitPrice: 179, discount: 0.05, revenue: 14451.25, rating: 4.5 },
  { id: 14, product: 'Webcam HD', category: 'Audio', region: 'North', quantity: 110, unitPrice: 89, discount: 0.08, revenue: 9008.8, rating: 4.1 },
  { id: 15, product: 'Gaming Console', category: 'Gaming', region: 'South', quantity: 75, unitPrice: 499, discount: 0.05, revenue: 35553.75, rating: 4.9 },
  { id: 16, product: 'Controller', category: 'Gaming', region: 'East', quantity: 220, unitPrice: 69, discount: 0.1, revenue: 13662, rating: 4.3 },
  { id: 17, product: 'Gaming Chair', category: 'Gaming', region: 'West', quantity: 40, unitPrice: 349, discount: 0.15, revenue: 11866, rating: 4.4 },
  { id: 18, product: 'VR Headset', category: 'Gaming', region: 'North', quantity: 30, unitPrice: 399, discount: 0.1, revenue: 10773, rating: 4.6 },
])

// Grid configuration
const grouping = ref<string[]>(['category'])
const gridMode = ref<'div' | 'group' | 'splitgroup'>('splitgroup')
const showGrandTotals = ref(true)
const showGroupSummaries = ref(true)

// Computed summaries config
const summariesConfig = computed(() => {
  if (!showGrandTotals.value && !showGroupSummaries.value) {
    return undefined
  }
  return {
    grandTotals: showGrandTotals.value ? { label: 'Grand Total' } : false,
    groupSummaries: showGroupSummaries.value,
  }
})

// Computed layout
const layout = computed(() => {
  return { mode: gridMode.value }
})

// Computed grouping - only apply when not in div mode
const appliedGrouping = computed(() => {
  if (gridMode.value === 'div') {
    return []
  }
  return grouping.value
})

// Column definitions with various summary configurations
const columns: NuGridColumn<SalesData>[] = [
  {
    accessorKey: 'product',
    header: 'Product',
    minSize: 150,
    size: 180,
  },
  {
    accessorKey: 'category',
    header: 'Category',
    minSize: 100,
    size: 120,
  },
  {
    accessorKey: 'region',
    header: 'Region',
    minSize: 80,
    size: 100,
  },
  {
    accessorKey: 'quantity',
    header: 'Qty',
    minSize: 70,
    size: 80,
    summary: {
      aggregate: 'sum',
      format: (v) => (v as number).toLocaleString(),
    },
  },
  {
    accessorKey: 'unitPrice',
    header: 'Unit Price',
    minSize: 100,
    size: 110,
    cell: ({ row }) => `$${row.original.unitPrice.toFixed(2)}`,
    summary: {
      aggregate: 'avg',
      format: (v) => `$${(v as number).toFixed(2)}`,
    },
  },
  {
    accessorKey: 'discount',
    header: 'Discount',
    minSize: 90,
    size: 100,
    cell: ({ row }) => `${(row.original.discount * 100).toFixed(0)}%`,
    summary: {
      aggregate: 'avg',
      format: (v) => `${((v as number) * 100).toFixed(1)}%`,
    },
  },
  {
    accessorKey: 'revenue',
    header: 'Revenue',
    minSize: 110,
    size: 130,
    cell: ({ row }) => `$${row.original.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    summary: {
      aggregate: 'sum',
      format: (v) => `$${(v as number).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    minSize: 80,
    size: 90,
    cell: ({ row }) => `${row.original.rating.toFixed(1)} ★`,
    summary: {
      aggregate: 'avg',
      format: (v) => `${(v as number).toFixed(2)} ★`,
    },
  },
]

// Calculate totals for display
const totalRevenue = computed(() =>
  data.value.reduce((sum, row) => sum + row.revenue, 0),
)
const totalQuantity = computed(() =>
  data.value.reduce((sum, row) => sum + row.quantity, 0),
)
const avgRating = computed(() => {
  const sum = data.value.reduce((s, row) => s + row.rating, 0)
  return data.value.length ? sum / data.value.length : 0
})

const exampleCode = `// Column summary configuration
const columns = [
  {
    accessorKey: 'quantity',
    header: 'Qty',
    summary: {
      aggregate: 'sum',
      format: (v) => v.toLocaleString()
    }
  },
  {
    accessorKey: 'unitPrice',
    header: 'Unit Price',
    summary: {
      aggregate: 'avg',  // Average price
      format: (v) => \`$\${v.toFixed(2)}\`
    }
  },
  {
    accessorKey: 'revenue',
    header: 'Revenue',
    summary: {
      aggregate: 'sum',
      format: (v) => \`$\${v.toLocaleString()}\`
    }
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    summary: {
      aggregate: 'avg',
      format: (v) => \`\${v.toFixed(2)} ★\`
    }
  }
]

// Grid with summaries enabled
<NuGrid
  :data="data"
  :columns="columns"
  :grouping="['category']"
  :layout="{ mode: 'splitgroup' }"
  :summaries="{
    grandTotals: { label: 'Grand Total' },
    groupSummaries: true
  }"
/>

// Available aggregates:
// 'sum' - Sum of all values
// 'avg' - Average of all values
// 'count' - Count of rows
// 'min' - Minimum value
// 'max' - Maximum value
// (rows) => value - Custom function`
</script>

<template>
  <DemoLayout
    id="summary-demo"
    title="Summary & Aggregates"
    info-label="About Summaries"
  >
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Total Revenue">
        <UBadge color="success" variant="soft" size="xs">
          ${{ totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
        </UBadge>
      </DemoStatusItem>
      <DemoStatusItem label="Total Qty">
        <UBadge color="primary" variant="soft" size="xs">
          {{ totalQuantity.toLocaleString() }}
        </UBadge>
      </DemoStatusItem>
      <DemoStatusItem label="Avg Rating">
        <UBadge color="warning" variant="soft" size="xs">
          {{ avgRating.toFixed(2) }} ★
        </UBadge>
      </DemoStatusItem>
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Grid Mode">
        <div class="inline-flex">
          <UButton
            :color="gridMode === 'div' ? 'primary' : 'neutral'"
            :variant="gridMode === 'div' ? 'solid' : 'ghost'"
            size="xs"
            @click="gridMode = 'div'"
          >
            Flat
          </UButton>
          <UButton
            :color="gridMode === 'group' ? 'primary' : 'neutral'"
            :variant="gridMode === 'group' ? 'solid' : 'ghost'"
            size="xs"
            @click="gridMode = 'group'"
          >
            Group
          </UButton>
          <UButton
            :color="gridMode === 'splitgroup' ? 'primary' : 'neutral'"
            :variant="gridMode === 'splitgroup' ? 'solid' : 'ghost'"
            size="xs"
            @click="gridMode = 'splitgroup'"
          >
            Split Group
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Summary Options">
        <div class="flex items-center gap-4">
          <UCheckbox v-model="showGrandTotals" label="Grand Totals" />
          <UCheckbox v-model="showGroupSummaries" label="Group Summaries" :disabled="gridMode === 'div'" />
        </div>
      </DemoControlGroup>

      <DemoControlGroup v-if="gridMode !== 'div'" label="Group By">
        <USelectMenu
          v-model="grouping"
          :items="[
            { label: 'Category', value: 'category' },
            { label: 'Region', value: 'region' },
          ]"
          multiple
          value-key="value"
          size="xs"
          class="w-40"
        />
      </DemoControlGroup>
    </template>

    <!-- Info Panel -->
    <template #info>
      <div class="space-y-3 text-sm">
        <p>
          <strong>Summary columns</strong> enable automatic aggregate calculations for group summaries and grand totals.
        </p>

        <div class="space-y-2">
          <p class="font-medium">Built-in Aggregates:</p>
          <ul class="list-disc list-inside space-y-1 text-muted">
            <li><code>sum</code> - Sum of all numeric values</li>
            <li><code>avg</code> - Average of all numeric values</li>
            <li><code>count</code> - Count of rows</li>
            <li><code>min</code> - Minimum value</li>
            <li><code>max</code> - Maximum value</li>
          </ul>
        </div>

        <div class="space-y-2">
          <p class="font-medium">Features:</p>
          <ul class="list-disc list-inside space-y-1 text-muted">
            <li><strong>Grand Totals:</strong> Footer row with totals across all data</li>
            <li><strong>Group Summaries:</strong> Calculated values shown in collapsed group headers</li>
            <li><strong>Custom Format:</strong> Format function for display customization</li>
            <li><strong>Multiple Aggregates:</strong> Different columns can use different aggregates</li>
          </ul>
        </div>

        <div class="rounded bg-muted/30 p-2 text-xs">
          <p class="font-medium mb-1">This Demo Shows:</p>
          <ul class="list-disc list-inside text-muted">
            <li>Quantity: <code>sum</code></li>
            <li>Unit Price: <code>avg</code></li>
            <li>Discount: <code>avg</code> (formatted as %)</li>
            <li>Revenue: <code>sum</code> (formatted as currency)</li>
            <li>Rating: <code>avg</code> (formatted with star)</li>
          </ul>
        </div>
      </div>
    </template>

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock :code="exampleCode" />
    </template>

    <!-- Grid -->
    <template #default>
      <NuGrid
        :key="gridMode"
        v-model:grouping="appliedGrouping"
        :data="data"
        :columns="columns"
        :layout="layout"
        :summaries="summariesConfig"
        :autosize="{ strategy: 'fill' }"
        class="h-[500px]"
      />
    </template>
  </DemoLayout>
</template>
