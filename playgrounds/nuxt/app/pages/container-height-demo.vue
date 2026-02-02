<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

// Simple sample data
interface Item {
  id: number
  name: string
  category: string
  value: number
}

function generateData(count: number): Item[] {
  const categories = ['Alpha', 'Beta', 'Gamma', 'Delta']
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    category: categories[i % categories.length]!,
    value: Math.floor(Math.random() * 1000),
  }))
}

const data = ref<Item[]>(generateData(50))

const columns: NuGridColumn<Item>[] = [
  { accessorKey: 'id', header: 'ID', size: 60 },
  { accessorKey: 'name', header: 'Name', size: 150 },
  { accessorKey: 'category', header: 'Category', size: 100 },
  { accessorKey: 'value', header: 'Value', size: 100 },
]

const gridUi = {
  base: 'w-max min-w-full border-separate border-spacing-0',
  thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
  tbody: '[&>tr]:last:[&>td]:border-b-0',
  th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
  td: 'border-b border-default',
}
</script>

<template>
  <DemoLayout id="container-height-demo" title="Container Height Demo" sidebar-width="280px">
    <template #status>
      <DemoStatusItem label="Rows" :value="data.length" />
    </template>

    <template #controls>
      <DemoControlGroup label="About">
        <p class="text-xs text-muted">
          This demo shows grids in various container configurations to verify height constraints
          work correctly. The grid should respect container height and show scrollbars when content
          exceeds the container.
        </p>
      </DemoControlGroup>
    </template>

    <template #info>
      <p class="mb-3 text-sm text-muted">
        NuGrid uses <code class="rounded bg-default px-1 py-0.5 text-xs">h-full min-h-0</code> on
        the root element to properly constrain to container height in flex contexts.
      </p>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Key CSS:</strong>
        <ul class="mt-1 list-inside list-disc text-xs">
          <li><code>h-full</code> - takes 100% of parent height</li>
          <li><code>min-h-0</code> - allows shrinking in flexbox</li>
          <li><code>overflow-auto</code> - enables scrolling</li>
        </ul>
      </div>
    </template>

    <!-- Main content area with multiple grids -->
    <div class="flex flex-col gap-6">
      <!-- Fixed height container -->
      <section>
        <h3 class="mb-2 text-sm font-semibold">1. Fixed Height Container (h-[200px])</h3>
        <p class="mb-2 text-xs text-muted">
          Grid should be constrained to 200px and scroll vertically.
        </p>
        <div class="h-[200px] rounded-lg border border-default">
          <NuGrid :data="data" :columns="columns" :ui="gridUi" />
        </div>
      </section>

      <!-- Flex container with flex-1 -->
      <section>
        <h3 class="mb-2 text-sm font-semibold">2. Flex Container with Fixed Height Parent</h3>
        <p class="mb-2 text-xs text-muted">
          Parent has h-[250px], grid uses flex-1 to fill remaining space after header.
        </p>
        <div class="flex h-[250px] flex-col rounded-lg border border-default">
          <div
            class="shrink-0 border-b border-default bg-elevated/50 px-3 py-2 text-sm font-medium"
          >
            Header (shrink-0)
          </div>
          <div class="min-h-0 flex-1">
            <NuGrid :data="data" :columns="columns" :ui="gridUi" />
          </div>
        </div>
      </section>

      <!-- Grid layout -->
      <section>
        <h3 class="mb-2 text-sm font-semibold">3. CSS Grid with Fixed Row Height</h3>
        <p class="mb-2 text-xs text-muted">
          Using CSS grid with grid-rows-[auto_1fr] and h-[300px] on container.
        </p>
        <div class="grid h-[300px] grid-rows-[auto_1fr] rounded-lg border border-default">
          <div class="border-b border-default bg-elevated/50 px-3 py-2 text-sm font-medium">
            Grid Header (auto)
          </div>
          <div class="min-h-0">
            <NuGrid :data="data" :columns="columns" :ui="gridUi" />
          </div>
        </div>
      </section>

      <!-- Two grids side by side -->
      <section>
        <h3 class="mb-2 text-sm font-semibold">4. Two Grids Side-by-Side (h-[200px])</h3>
        <p class="mb-2 text-xs text-muted">
          Two grids in a flex row, each should scroll independently.
        </p>
        <div class="flex h-[200px] gap-4">
          <div class="min-w-0 flex-1 rounded-lg border border-default">
            <NuGrid :data="data.slice(0, 25)" :columns="columns" :ui="gridUi" />
          </div>
          <div class="min-w-0 flex-1 rounded-lg border border-default">
            <NuGrid :data="data.slice(25)" :columns="columns" :ui="gridUi" />
          </div>
        </div>
      </section>

      <!-- Nested flex containers -->
      <section>
        <h3 class="mb-2 text-sm font-semibold">5. Deeply Nested Flex (h-[280px])</h3>
        <p class="mb-2 text-xs text-muted">
          Multiple levels of flex nesting - each level needs min-h-0 for proper shrinking.
        </p>
        <div class="flex h-[280px] flex-col rounded-lg border border-default">
          <div
            class="shrink-0 border-b border-default bg-elevated/50 px-3 py-2 text-sm font-medium"
          >
            Level 1 Header
          </div>
          <div class="flex min-h-0 flex-1 flex-col">
            <div
              class="shrink-0 border-b border-default bg-elevated/30 px-3 py-1.5 text-xs text-muted"
            >
              Level 2 Subheader
            </div>
            <div class="min-h-0 flex-1">
              <NuGrid :data="data" :columns="columns" :ui="gridUi" />
            </div>
          </div>
        </div>
      </section>

      <!-- Small fixed height to test minimum sizing -->
      <section>
        <h3 class="mb-2 text-sm font-semibold">6. Small Container (h-[120px])</h3>
        <p class="mb-2 text-xs text-muted">
          Very small container - grid should still work with scrolling.
        </p>
        <div class="h-[120px] rounded-lg border border-default">
          <NuGrid :data="data" :columns="columns" :ui="gridUi" />
        </div>
      </section>
    </div>
  </DemoLayout>
</template>
