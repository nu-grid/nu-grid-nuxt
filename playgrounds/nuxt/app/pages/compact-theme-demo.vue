<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

// Sample data for the demo - stock market data (good for compact display)
interface StockData {
  id: number
  symbol: string
  company: string
  sector: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  pe: number
}

const data = ref<StockData[]>([
  {
    id: 1,
    symbol: 'AAPL',
    company: 'Apple Inc.',
    sector: 'Technology',
    price: 178.42,
    change: 2.34,
    changePercent: 1.33,
    volume: 52847123,
    marketCap: 2780000000000,
    pe: 28.5,
  },
  {
    id: 2,
    symbol: 'MSFT',
    company: 'Microsoft Corporation',
    sector: 'Technology',
    price: 378.91,
    change: -1.23,
    changePercent: -0.32,
    volume: 21456789,
    marketCap: 2810000000000,
    pe: 35.2,
  },
  {
    id: 3,
    symbol: 'GOOGL',
    company: 'Alphabet Inc.',
    sector: 'Technology',
    price: 141.8,
    change: 0.87,
    changePercent: 0.62,
    volume: 18923456,
    marketCap: 1780000000000,
    pe: 24.8,
  },
  {
    id: 4,
    symbol: 'AMZN',
    company: 'Amazon.com Inc.',
    sector: 'Consumer Cyclical',
    price: 178.25,
    change: 3.45,
    changePercent: 1.97,
    volume: 41234567,
    marketCap: 1850000000000,
    pe: 62.3,
  },
  {
    id: 5,
    symbol: 'NVDA',
    company: 'NVIDIA Corporation',
    sector: 'Technology',
    price: 875.35,
    change: 12.67,
    changePercent: 1.47,
    volume: 38765432,
    marketCap: 2160000000000,
    pe: 65.1,
  },
  {
    id: 6,
    symbol: 'META',
    company: 'Meta Platforms Inc.',
    sector: 'Technology',
    price: 505.75,
    change: -4.21,
    changePercent: -0.83,
    volume: 15678901,
    marketCap: 1290000000000,
    pe: 28.9,
  },
  {
    id: 7,
    symbol: 'TSLA',
    company: 'Tesla Inc.',
    sector: 'Consumer Cyclical',
    price: 248.5,
    change: 5.78,
    changePercent: 2.38,
    volume: 89012345,
    marketCap: 789000000000,
    pe: 72.4,
  },
  {
    id: 8,
    symbol: 'BRK.B',
    company: 'Berkshire Hathaway',
    sector: 'Financial Services',
    price: 407.89,
    change: 1.12,
    changePercent: 0.28,
    volume: 3456789,
    marketCap: 892000000000,
    pe: 8.2,
  },
  {
    id: 9,
    symbol: 'JPM',
    company: 'JPMorgan Chase & Co.',
    sector: 'Financial Services',
    price: 195.42,
    change: -0.89,
    changePercent: -0.45,
    volume: 9876543,
    marketCap: 567000000000,
    pe: 11.5,
  },
  {
    id: 10,
    symbol: 'JNJ',
    company: 'Johnson & Johnson',
    sector: 'Healthcare',
    price: 156.78,
    change: 0.45,
    changePercent: 0.29,
    volume: 7654321,
    marketCap: 378000000000,
    pe: 15.8,
  },
  {
    id: 11,
    symbol: 'V',
    company: 'Visa Inc.',
    sector: 'Financial Services',
    price: 278.34,
    change: 2.01,
    changePercent: 0.73,
    volume: 6543210,
    marketCap: 567000000000,
    pe: 30.2,
  },
  {
    id: 12,
    symbol: 'PG',
    company: 'Procter & Gamble',
    sector: 'Consumer Defensive',
    price: 162.45,
    change: -0.34,
    changePercent: -0.21,
    volume: 5432109,
    marketCap: 382000000000,
    pe: 26.1,
  },
])

// Theme selection
const selectedTheme = ref<'default' | 'compact'>('compact')
const focusMode = ref<'cell' | 'row'>('cell')

// Define columns
const columns: NuGridColumn<StockData>[] = [
  { accessorKey: 'symbol', header: 'Symbol', minSize: 80, size: 80 },
  { accessorKey: 'company', header: 'Company', minSize: 180, size: 200 },
  { accessorKey: 'sector', header: 'Sector', minSize: 140, size: 140 },
  {
    accessorKey: 'price',
    header: 'Price',
    minSize: 90,
    size: 90,
    cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
  },
  {
    accessorKey: 'change',
    header: 'Change',
    minSize: 80,
    size: 80,
    cell: ({ row }) => {
      const change = row.original.change
      const color = change >= 0 ? 'text-green-500' : 'text-red-500'
      const sign = change >= 0 ? '+' : ''
      return h('span', { class: color }, `${sign}${change.toFixed(2)}`)
    },
  },
  {
    accessorKey: 'changePercent',
    header: 'Change %',
    minSize: 90,
    size: 90,
    cell: ({ row }) => {
      const pct = row.original.changePercent
      const color = pct >= 0 ? 'text-green-500' : 'text-red-500'
      const sign = pct >= 0 ? '+' : ''
      return h('span', { class: color }, `${sign}${pct.toFixed(2)}%`)
    },
  },
  {
    accessorKey: 'volume',
    header: 'Volume',
    minSize: 100,
    size: 100,
    cell: ({ row }) => row.original.volume.toLocaleString(),
  },
  {
    accessorKey: 'marketCap',
    header: 'Market Cap',
    minSize: 100,
    size: 100,
    cell: ({ row }) => {
      const cap = row.original.marketCap
      if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`
      if (cap >= 1e9) return `$${(cap / 1e9).toFixed(0)}B`
      return `$${(cap / 1e6).toFixed(0)}M`
    },
  },
  {
    accessorKey: 'pe',
    header: 'P/E',
    minSize: 70,
    size: 70,
    cell: ({ row }) => row.original.pe.toFixed(1),
  },
]

const exampleCode = `<NuGrid
  theme="compact"
  :data="data"
  :columns="columns"
  :focus="{ mode: 'cell' }"
  row-selection="multi"
  resize-columns
/>`
</script>

<template>
  <DemoLayout
    id="compact-theme-demo"
    title="Compact Theme Demo"
    info-label="About the Compact Theme"
  >
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Theme" :value="selectedTheme" />
      <DemoStatusItem label="Focus Mode" :value="focusMode" />
      <DemoStatusItem label="Rows" :value="data.length" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Theme">
        <div class="grid grid-cols-2 gap-1">
          <UButton
            :color="selectedTheme === 'default' ? 'primary' : 'neutral'"
            :variant="selectedTheme === 'default' ? 'solid' : 'outline'"
            icon="i-lucide-palette"
            size="xs"
            @click="selectedTheme = 'default'"
          >
            Default
          </UButton>
          <UButton
            :color="selectedTheme === 'compact' ? 'primary' : 'neutral'"
            :variant="selectedTheme === 'compact' ? 'solid' : 'outline'"
            icon="i-lucide-table-2"
            size="xs"
            @click="selectedTheme = 'compact'"
          >
            Compact
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Focus Mode">
        <div class="grid grid-cols-2 gap-1">
          <UButton
            :color="focusMode === 'cell' ? 'primary' : 'neutral'"
            :variant="focusMode === 'cell' ? 'solid' : 'outline'"
            icon="i-lucide-grid-2x2"
            size="xs"
            @click="focusMode = 'cell'"
          >
            Cell
          </UButton>
          <UButton
            :color="focusMode === 'row' ? 'primary' : 'neutral'"
            :variant="focusMode === 'row' ? 'solid' : 'outline'"
            icon="i-lucide-rows-3"
            size="xs"
            @click="focusMode = 'row'"
          >
            Row
          </UButton>
        </div>
      </DemoControlGroup>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        This page demonstrates the optional
        <code class="rounded bg-default px-1 py-0.5 text-xs">theme="compact"</code>
        prop for NuGrid. The compact theme features:
      </p>
      <ul class="mb-3 list-inside list-disc space-y-1 text-sm text-muted">
        <li><strong>Compact spacing:</strong> Tighter cell padding to fit more data on screen</li>
        <li><strong>Blue accent color:</strong> Blue (#2196F3) for selection and focus states</li>
        <li>
          <strong>Distinct header styling:</strong> Light gray header background with uppercase text
        </li>
        <li><strong>Row hover effects:</strong> Subtle hover states for better UX</li>
        <li>
          <strong>Full dark mode support:</strong> Proper colors for both light and dark themes
        </li>
      </ul>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Usage:</strong>
        <code class="ml-1 text-xs">&lt;NuGrid theme="compact" ... /&gt;</code>
      </div>
    </template>

    <!-- Grid -->
    <NuGrid
      :key="selectedTheme"
      :theme="selectedTheme"
      :data="data"
      :columns="columns"
      :focus="{ mode: focusMode }"
      resize-columns
      row-selection="multi"
      class="border-compact-border max-h-[400px] rounded border dark:border-compact-border-dark"
    />

    <div class="mt-6 grid gap-4 md:grid-cols-2">
      <div class="rounded-lg border border-default p-4">
        <h3 class="mb-2 font-semibold">Default Theme</h3>
        <p class="text-sm text-muted">
          The default NuGrid theme uses your app's primary color with comfortable spacing (16px cell
          padding). Good for general use cases where readability is important.
        </p>
      </div>
      <div class="rounded-lg border border-default p-4">
        <h3 class="mb-2 font-semibold">Compact Theme</h3>
        <p class="text-sm text-muted">
          The compact theme uses a blue accent color with tighter spacing (8px cell padding). Ideal
          for data-dense applications like trading dashboards and analytics tools.
        </p>
      </div>
    </div>

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Using the Compact Theme:" :code="exampleCode" />
    </template>
  </DemoLayout>
</template>

<style scoped>
code {
  font-family: 'Monaco', 'Courier New', monospace;
}
</style>
