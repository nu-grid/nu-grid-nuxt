<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

const table = useTemplateRef('table')

// Data with varied types for sorting demonstration
interface SortDemoRow {
  id: number
  name: string
  version: string
  status: string
  statusSort: number
  price: number
  quantity: number
  createdAt: Date
  active: boolean
  priority: string
  priorityWeight: number
  mixed: string
}

const data = ref<SortDemoRow[]>([
  { id: 1, name: 'Widget Alpha', version: 'v2.1', status: 'Active', statusSort: 1, price: 29.99, quantity: 150, createdAt: new Date('2024-03-15'), active: true, priority: 'High', priorityWeight: 3, mixed: 'item10' },
  { id: 2, name: 'widget beta', version: 'v10.0', status: 'Pending', statusSort: 2, price: 149.50, quantity: 0, createdAt: new Date('2024-01-20'), active: false, priority: 'Low', priorityWeight: 1, mixed: 'item2' },
  { id: 3, name: 'WIDGET GAMMA', version: 'v1.0', status: 'Archived', statusSort: 4, price: 9.99, quantity: 500, createdAt: new Date('2023-11-01'), active: true, priority: 'Medium', priorityWeight: 2, mixed: 'item1' },
  { id: 4, name: 'Gadget Delta', version: 'v2.0', status: 'Active', statusSort: 1, price: 299.00, quantity: 12, createdAt: new Date('2024-06-10'), active: true, priority: 'Critical', priorityWeight: 4, mixed: 'abc20' },
  { id: 5, name: 'gadget epsilon', version: 'v1.2', status: 'Draft', statusSort: 3, price: 0.99, quantity: 1000, createdAt: new Date('2024-02-28'), active: false, priority: 'High', priorityWeight: 3, mixed: 'abc2' },
  { id: 6, name: 'Tool Zeta', version: 'v3.5', status: 'Active', statusSort: 1, price: 59.00, quantity: 75, createdAt: new Date('2023-07-04'), active: true, priority: 'Low', priorityWeight: 1, mixed: 'abc123' },
  { id: 7, name: 'tool eta', version: 'v20.0', status: 'Pending', statusSort: 2, price: 199.99, quantity: 3, createdAt: new Date('2024-08-22'), active: false, priority: 'Medium', priorityWeight: 2, mixed: '100' },
  { id: 8, name: 'Part Theta', version: 'v1.10', status: 'Archived', statusSort: 4, price: 45.00, quantity: 200, createdAt: new Date('2023-05-15'), active: true, priority: 'Critical', priorityWeight: 4, mixed: '20' },
  { id: 9, name: 'Part Iota', version: 'v2.2', status: 'Draft', statusSort: 3, price: 89.99, quantity: 0, createdAt: new Date('2024-04-01'), active: false, priority: 'High', priorityWeight: 3, mixed: '3' },
  { id: 10, name: 'Component Kappa', version: 'v1.1', status: 'Active', statusSort: 1, price: 12.50, quantity: 350, createdAt: new Date('2024-09-12'), active: true, priority: 'Low', priorityWeight: 1, mixed: 'item100' },
  { id: 11, name: 'component lambda', version: 'v5.0', status: 'Pending', statusSort: 2, price: 499.99, quantity: 5, createdAt: new Date('2024-07-18'), active: true, priority: 'Medium', priorityWeight: 2, mixed: 'item20' },
  { id: 12, name: 'Module Mu', version: 'v3.0', status: 'Active', statusSort: 1, price: 74.50, quantity: 88, createdAt: new Date('2023-12-25'), active: false, priority: 'High', priorityWeight: 3, mixed: 'abc10' },
])

// Status badge colors
const statusColors: Record<string, string> = {
  Active: 'success',
  Pending: 'warning',
  Draft: 'info',
  Archived: 'neutral',
}

// Priority badge colors
const priorityColors: Record<string, string> = {
  Critical: 'error',
  High: 'warning',
  Medium: 'info',
  Low: 'neutral',
}

const columns: NuGridColumn<SortDemoRow>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 70,
    grow: false,
    cellDataType: 'number',
  },
  {
    accessorKey: 'name',
    header: 'Name',
    // Default alphanumeric sort (case-insensitive)
  },
  {
    accessorKey: 'version',
    header: 'Version',
    size: 100,
    grow: false,
    // Alphanumeric sort handles v1.0 < v2.0 < v10.0 correctly
    sortingFn: 'alphanumeric',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    grow: false,
    // sortAccessor: display "status" but sort by "statusSort" field
    sortAccessor: 'statusSort',
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    size: 120,
    grow: false,
    // sortAccessor as function: sort by priorityWeight instead of alphabetical
    sortAccessor: (row) => row.priorityWeight,
  },
  {
    accessorKey: 'price',
    header: 'Price',
    size: 110,
    grow: false,
    cellDataType: 'number',
    cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
  },
  {
    accessorKey: 'quantity',
    header: 'Qty',
    size: 80,
    grow: false,
    cellDataType: 'number',
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    size: 120,
    grow: false,
    cellDataType: 'date',
    cell: ({ row }) => row.original.createdAt.toLocaleDateString(),
  },
  {
    accessorKey: 'active',
    header: 'Active',
    size: 90,
    grow: false,
    cellDataType: 'boolean',
    cell: ({ row }) => row.original.active ? 'Yes' : 'No',
  },
  {
    accessorKey: 'mixed',
    header: 'Mixed',
    size: 110,
    grow: false,
    // Alphanumeric: handles item2 < item10 < item100 correctly
    sortingFn: 'alphanumeric',
  },
]

const sorting = ref([])
const columnVisibility = ref()
const columnSizing = ref({})

const sortChangeBehavior = ref<'maintain' | 'resort'>('maintain')

function clearSorting() {
  sorting.value = []
}

function setMultiSort() {
  sorting.value = [
    { id: 'status', desc: false },
    { id: 'priority', desc: true },
  ] as any
}

function setVersionSort() {
  sorting.value = [{ id: 'version', desc: false }] as any
}

function setMixedSort() {
  sorting.value = [{ id: 'mixed', desc: false }] as any
}

function randomizePrice() {
  data.value = data.value.map(row => ({
    ...row,
    price: Math.round(Math.random() * 500 * 100) / 100,
  }))
}
</script>

<template>
  <DemoLayout
    id="sorting-demo"
    title="Sorting Engine Demo"
    info-label="About NuGrid Sorting"
  >
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Active Sorts" :value="sorting.length" color="text-primary" />
      <DemoStatusItem label="Behavior" :value="sortChangeBehavior" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Quick Sort Presets">
        <UButton block color="neutral" variant="outline" size="sm" @click="setVersionSort">
          Version (alphanumeric)
        </UButton>
        <UButton block color="neutral" variant="outline" size="sm" @click="setMixedSort">
          Mixed (alphanumeric)
        </UButton>
        <UButton block color="neutral" variant="outline" size="sm" @click="setMultiSort">
          Status + Priority (multi)
        </UButton>
        <UButton v-if="sorting.length" block color="neutral" variant="outline" icon="i-lucide-x" size="sm" @click="clearSorting">
          Clear
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Data Mutation">
        <UButton block color="warning" variant="outline" size="sm" icon="i-lucide-shuffle" @click="randomizePrice">
          Randomize Prices
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Sort Behavior">
        <UButton
          block
          :color="sortChangeBehavior === 'resort' ? 'success' : 'neutral'"
          :variant="sortChangeBehavior === 'resort' ? 'solid' : 'outline'"
          size="sm"
          @click="sortChangeBehavior = sortChangeBehavior === 'maintain' ? 'resort' : 'maintain'"
        >
          {{ sortChangeBehavior === 'maintain' ? 'Maintain Order' : 'Auto Re-sort' }}
        </UButton>
      </DemoControlGroup>

      <!-- Sort State -->
      <div class="border-default bg-elevated/30 rounded-lg border p-3">
        <h3 class="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">Sort State</h3>
        <pre class="bg-default/50 max-h-32 overflow-auto rounded p-2 text-xs">{{ JSON.stringify(sorting, null, 2) }}</pre>
      </div>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="text-muted mb-3 text-sm">
        This page demonstrates NuGrid's sorting engine features.
      </p>
      <ul class="text-muted mb-3 list-inside list-disc space-y-1 text-sm">
        <li><strong>sortAccessor (string):</strong> Status column displays status text but sorts by statusSort number</li>
        <li><strong>sortAccessor (function):</strong> Priority column sorts by priorityWeight (Critical=4 > High=3 > Medium=2 > Low=1)</li>
        <li><strong>Alphanumeric:</strong> Version and Mixed columns handle v1.0 &lt; v2.0 &lt; v10.0 and item2 &lt; item10 correctly</li>
        <li><strong>Type detection:</strong> Number, date, and boolean columns use appropriate comparators automatically</li>
        <li><strong>Multi-sort:</strong> Hold Shift+click for multi-column sort, or use the preset button</li>
        <li><strong>Sort stability:</strong> Randomize prices while sorted to see maintain/resort behavior</li>
      </ul>
      <div class="bg-default/50 text-muted rounded p-2 text-sm">
        <strong>Try It:</strong>
        <ul class="mt-1 ml-2 list-inside list-disc">
          <li>Sort by Version — notice v1.0, v1.1, v1.2, v2.0, v2.1, v10.0 (not v10 before v2)</li>
          <li>Sort by Status — sorts Active(1), Pending(2), Draft(3), Archived(4) via sortAccessor</li>
          <li>Sort by Priority — Critical first (weight 4), then High, Medium, Low</li>
          <li>Sort by Price, then click "Randomize Prices" to test sort stability</li>
        </ul>
      </div>
    </template>

    <!-- Grid -->
    <div class="overflow-x-auto">
      <NuGrid
        ref="table"
        v-model:column-visibility="columnVisibility"
        v-model:column-sizing="columnSizing"
        v-model:sorting="sorting"
        :column-defaults="{ resize: true, reorder: true }"
        :layout="{ mode: 'div', stickyHeaders: true }"
        :editing="{ enabled: true }"
        :sort="{ dataChangeBehavior: sortChangeBehavior }"
        :data="data"
        :columns="columns"
      />
    </div>
  </DemoLayout>
</template>
