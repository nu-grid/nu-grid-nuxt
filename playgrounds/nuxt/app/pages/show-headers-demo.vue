<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface Item {
  id: number
  name: string
  category: string
  value: number
  status: string
}

const categories = ['Electronics', 'Clothing', 'Food', 'Books']
const statuses = ['Active', 'Inactive', 'Pending']

function generateData(count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    category: categories[i % categories.length]!,
    value: Math.floor(Math.random() * 1000),
    status: statuses[i % statuses.length]!,
  }))
}

const data = ref<Item[]>(generateData(50))

const columns: NuGridColumn<Item>[] = [
  { accessorKey: 'id', header: 'ID', size: 60 },
  { accessorKey: 'name', header: 'Name', size: 150 },
  { accessorKey: 'category', header: 'Category', size: 120 },
  { accessorKey: 'value', header: 'Value', size: 100 },
  { accessorKey: 'status', header: 'Status', size: 100 },
]

const showHeaders = ref(true)
const stickyHeaders = ref(false)

const layoutOptions = computed(() => ({
  showHeaders: showHeaders.value,
  stickyHeaders: stickyHeaders.value,
}))
</script>

<template>
  <DemoLayout
    id="show-headers-demo"
    title="Show/Hide Headers Demo"
    sidebar-width="280px"
    grid-height="600px"
  >
    <template #status>
      <DemoStatusItem label="Rows" :value="data.length" />
      <DemoStatusItem label="Show Headers" :value="showHeaders" boolean />
      <DemoStatusItem label="Sticky Headers" :value="stickyHeaders" boolean />
    </template>

    <template #controls>
      <DemoControlGroup label="Header Visibility">
        <UButton
          :color="showHeaders ? 'primary' : 'neutral'"
          :variant="showHeaders ? 'solid' : 'outline'"
          icon="i-lucide-panel-top"
          block
          @click="showHeaders = !showHeaders"
        >
          {{ showHeaders ? 'Hide' : 'Show' }} Headers
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Other Options">
        <UButton
          :color="stickyHeaders ? 'primary' : 'neutral'"
          :variant="stickyHeaders ? 'solid' : 'outline'"
          icon="i-lucide-pin"
          block
          @click="stickyHeaders = !stickyHeaders"
        >
          {{ stickyHeaders ? 'Disable' : 'Enable' }} Sticky
        </UButton>
      </DemoControlGroup>
    </template>

    <template #info>
      <p class="mb-3 text-sm text-muted">
        Use <code class="rounded bg-default px-1 py-0.5 text-xs">layout.showHeaders</code> to
        hide column headers entirely. This is useful for data-only views or when headers are
        redundant.
      </p>
      <ul class="list-inside list-disc space-y-1 text-sm text-muted">
        <li>Set <code class="text-xs">showHeaders: false</code> to hide all column headers</li>
        <li>Defaults to <code class="text-xs">true</code> (headers visible)</li>
        <li>Works with all layout modes (div, group, splitgroup)</li>
        <li>Works with virtualization</li>
      </ul>
    </template>

    <div class="h-full">
      <NuGrid
        :data="data"
        :columns="columns"
        :layout="layoutOptions"
      />
    </div>

    <template #code>
      <DemoCodeBlock
        code="<NuGrid
  :data=&quot;data&quot;
  :columns=&quot;columns&quot;
  :layout=&quot;{ showHeaders: false }&quot;
/>"
      />
    </template>
  </DemoLayout>
</template>
