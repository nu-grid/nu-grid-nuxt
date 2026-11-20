<script setup lang="ts">
import type { NuGridColumn, NuGridLayoutMode } from '#nu-grid/types'

// A grid under a page-level sticky header, for e2e/stacking.spec.ts.
// Query: ?theme=default|compact&mode=div|group|splitgroup
definePageMeta({ layout: false })

interface Row {
  id: number
  name: string
  region: string
  amount: number
}

const route = useRoute()
const theme = computed(() => (route.query.theme === 'compact' ? 'compact' : 'default'))
const mode = computed<NuGridLayoutMode>(() => {
  const m = route.query.mode
  return m === 'group' || m === 'splitgroup' ? m : 'div'
})

const regions = ['North', 'South', 'East', 'West']
const data = ref<Row[]>(
  Array.from({ length: 60 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    region: regions[i % regions.length]!,
    amount: (i * 37) % 1000,
  })),
)

const columns: NuGridColumn<Row>[] = [
  { accessorKey: 'id', header: 'ID', size: 80 },
  { accessorKey: 'name', header: 'Name', size: 200 },
  { accessorKey: 'region', header: 'Region', size: 160 },
  { accessorKey: 'amount', header: 'Amount', size: 120 },
]

const grouping = ref<string[]>(mode.value === 'div' ? [] : ['region'])
</script>

<template>
  <div class="bg-default min-h-[300vh]">
    <header
      data-testid="page-header"
      class="bg-default sticky top-0 z-10 flex h-16 items-center border-b px-4 font-semibold"
    >
      Page header (sticky top-0 z-10)
    </header>
    <div class="h-24" />
    <div data-testid="grid-container" class="h-[400px] px-4">
      <NuGrid
        v-model:grouping="grouping"
        :data="data"
        :columns="columns"
        :theme="theme"
        :layout="{ mode, stickyHeaders: true }"
      />
    </div>
  </div>
</template>
