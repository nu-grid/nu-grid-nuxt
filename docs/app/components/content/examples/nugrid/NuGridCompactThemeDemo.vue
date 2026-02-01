<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface StockData {
  symbol: string
  company: string
  price: number
  change: number
  changePercent: number
  volume: number
}

const data = ref<StockData[]>([
  {
    symbol: 'AAPL',
    company: 'Apple Inc.',
    price: 178.42,
    change: 2.34,
    changePercent: 1.33,
    volume: 52847123,
  },
  {
    symbol: 'MSFT',
    company: 'Microsoft',
    price: 378.91,
    change: -1.23,
    changePercent: -0.32,
    volume: 21456789,
  },
  {
    symbol: 'GOOGL',
    company: 'Alphabet',
    price: 141.8,
    change: 0.87,
    changePercent: 0.62,
    volume: 18923456,
  },
  {
    symbol: 'AMZN',
    company: 'Amazon',
    price: 178.25,
    change: 3.45,
    changePercent: 1.97,
    volume: 41234567,
  },
  {
    symbol: 'NVDA',
    company: 'NVIDIA',
    price: 875.35,
    change: 12.67,
    changePercent: 1.47,
    volume: 38765432,
  },
  {
    symbol: 'META',
    company: 'Meta',
    price: 505.75,
    change: -4.21,
    changePercent: -0.83,
    volume: 15678901,
  },
  {
    symbol: 'TSLA',
    company: 'Tesla',
    price: 248.5,
    change: 5.78,
    changePercent: 2.38,
    volume: 89012345,
  },
  {
    symbol: 'JPM',
    company: 'JPMorgan',
    price: 195.42,
    change: -0.89,
    changePercent: -0.45,
    volume: 9876543,
  },
])

const selectedTheme = ref<'default' | 'compact'>('compact')

const columns: NuGridColumn<StockData>[] = [
  { accessorKey: 'symbol', header: 'Symbol', size: 80 },
  { accessorKey: 'company', header: 'Company', size: 120 },
  {
    accessorKey: 'price',
    header: 'Price',
    size: 90,
    cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
  },
  {
    accessorKey: 'change',
    header: 'Change',
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
    header: '%',
    size: 70,
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
    size: 100,
    cell: ({ row }) => row.original.volume.toLocaleString(),
  },
]
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <span class="text-sm font-medium">Theme:</span>
      <UFieldGroup>
        <UButton
          :color="selectedTheme === 'default' ? 'primary' : 'neutral'"
          :variant="selectedTheme === 'default' ? 'solid' : 'outline'"
          size="sm"
          @click="selectedTheme = 'default'"
        >
          Default
        </UButton>
        <UButton
          :color="selectedTheme === 'compact' ? 'primary' : 'neutral'"
          :variant="selectedTheme === 'compact' ? 'solid' : 'outline'"
          size="sm"
          @click="selectedTheme = 'compact'"
        >
          Compact
        </UButton>
      </UFieldGroup>
    </div>

    <div class="grid gap-4 md:grid-cols-2 text-sm">
      <div class="rounded-lg border border-default p-3">
        <p class="font-medium mb-1">Default Theme</p>
        <p class="text-muted text-xs">Comfortable spacing (16px padding), app primary color</p>
      </div>
      <div class="rounded-lg border border-default p-3">
        <p class="font-medium mb-1">Compact Theme</p>
        <p class="text-muted text-xs">
          Dense spacing (8px padding), blue accent, uppercase headers
        </p>
      </div>
    </div>

    <NuGrid
      :key="selectedTheme"
      :theme="selectedTheme"
      :data="data"
      :columns="columns"
      :focus="{ mode: 'cell' }"
      row-selection="multi"
      resize-columns
    />
  </div>
</template>
