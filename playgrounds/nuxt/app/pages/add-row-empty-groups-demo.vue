<script setup lang="ts">
import type { NuGridAddRowState, NuGridColumn } from '#nu-grid/types'

const toast = useToast()

interface Product {
  id: number | string
  name: string
  category: string
  status: 'active' | 'inactive' | 'pending'
  price: number
  stock: number
}

interface GridExpose {
  addRowState?: NuGridAddRowState | { value: NuGridAddRowState }
}

// All possible values for grouping columns
// These will be shown even when no data exists for them
const allCategories = ['Electronics', 'Audio', 'Furniture', 'Gaming', 'Office']
// Status items for lookup dropdown
const statusItems = [
  { value: 'active', label: 'Active', icon: 'i-lucide-check-circle' },
  { value: 'inactive', label: 'Inactive', icon: 'i-lucide-pause-circle' },
  { value: 'pending', label: 'Pending', icon: 'i-lucide-clock' },
]

// Start with NO data - all groups are empty to demonstrate the feature
const data = ref<Product[]>([])

const gridRef = ref<GridExpose | null>(null)

// Single-level grouping by category to demonstrate empty groups feature
const grouping = ref<string[]>(['category'])
const splitGroup = ref(true)
const emptyGroupsEnabled = ref(true)
const gridMode = computed<'group' | 'splitgroup'>(() => (splitGroup.value ? 'splitgroup' : 'group'))

// emptyGroupValues config - enables persistent empty groups
const emptyGroupValues = computed(() => {
  if (!emptyGroupsEnabled.value) return undefined
  return {
    category: allCategories,
  }
})

// Track items per category
const categoryStats = computed(() => {
  const stats: Record<string, number> = {}
  allCategories.forEach((cat) => {
    stats[cat] = data.value.filter((item) => item.category === cat).length
  })
  return stats
})

const emptyCategories = computed(() =>
  allCategories.filter((cat) => categoryStats.value[cat] === 0),
)

const addNewRow: { position: 'bottom'; addNewText: string } = {
  position: 'bottom',
  addNewText: 'Click to add new item',
}

const addRowState = computed(() => {
  const exposed = gridRef.value?.addRowState
  if (typeof exposed === 'string') return exposed
  return exposed?.value ?? 'idle'
})

function handleRowAddRequested(row: Product) {
  const maxId = data.value.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0)
  row.id = maxId + 1
  if (!row.status) {
    row.status = 'active'
  }
  data.value = [...data.value, { ...row }]

  toast.add({
    title: 'Row added successfully',
    description: `Added "${row.name}" to ${row.category}`,
    color: 'success',
  })
}

function deleteRow(id: number | string) {
  const item = data.value.find((row) => row.id === id)
  data.value = data.value.filter((row) => row.id !== id)

  if (item) {
    toast.add({
      title: 'Row deleted',
      description: `Removed "${item.name}"`,
      color: 'warning',
    })
  }
}

function clearCategory(category: string) {
  const count = data.value.filter((row) => row.category === category).length
  data.value = data.value.filter((row) => row.category !== category)

  toast.add({
    title: 'Category cleared',
    description: emptyGroupsEnabled.value
      ? `Removed ${count} items. Group "${category}" still shows with add row!`
      : `Removed ${count} items. Group "${category}" disappeared.`,
    color: 'info',
  })
}

function addSampleData() {
  const sampleItems: Omit<Product, 'id'>[] = [
    { name: 'Laptop', category: 'Electronics', status: 'active', price: 1299.99, stock: 8 },
    { name: 'Monitor', category: 'Electronics', status: 'active', price: 349.99, stock: 10 },
    { name: 'Headphones', category: 'Audio', status: 'active', price: 199.5, stock: 24 },
    { name: 'Microphone', category: 'Audio', status: 'inactive', price: 159, stock: 12 },
    { name: 'Office Chair', category: 'Furniture', status: 'active', price: 299, stock: 6 },
    { name: 'Desk Lamp', category: 'Furniture', status: 'pending', price: 45, stock: 30 },
    { name: 'Gaming Chair', category: 'Gaming', status: 'active', price: 349, stock: 5 },
    { name: 'Controller', category: 'Gaming', status: 'active', price: 69.99, stock: 22 },
    { name: 'Notebook', category: 'Office', status: 'active', price: 12.99, stock: 100 },
    { name: 'Stapler', category: 'Office', status: 'active', price: 8.99, stock: 50 },
  ]

  let maxId = data.value.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0)
  const newItems = sampleItems.map((item) => ({ ...item, id: ++maxId })) as Product[]
  data.value = [...data.value, ...newItems]

  toast.add({
    title: 'Sample data added',
    description: `Added ${newItems.length} items across all categories`,
    color: 'success',
  })
}

function resetData() {
  data.value = []

  toast.add({
    title: 'Data cleared',
    description: 'All data removed - empty groups still visible!',
    color: 'info',
  })
}

const columns: NuGridColumn<Product>[] = [
  { accessorKey: 'name', header: 'Name', minSize: 150, size: 180, requiredNew: true },
  { accessorKey: 'id', header: 'ID', minSize: 50, size: 50, enableEditing: false, showNew: false },
  {
    accessorKey: 'category',
    header: 'Category',
    minSize: 110,
    size: 120,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    minSize: 90,
    size: 120,
    cellDataType: 'lookup',
    lookup: {
      items: statusItems,
      valueKey: 'value',
      labelKey: 'label',
      placeholder: 'Select status...',
    },
  },
  {
    accessorKey: 'price',
    header: 'Price',
    minSize: 90,
    size: 100,
    cell: ({ row }) => {
      const raw = row.original.price as any
      const numeric = Number(raw)
      if (Number.isFinite(numeric)) {
        return `$${numeric.toFixed(2)}`
      }
      return '-'
    },
    summary: {
      aggregate: 'sum',
      format: (v) => `$${(v as number).toFixed(2)}`,
    },
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    minSize: 70,
    size: 80,
    summary: {
      aggregate: 'sum',
    },
  },
  {
    id: 'actions',
    header: '',
    size: 60,
    enableEditing: false,
    showNew: false,
    cell: ({ row }) => {
      return h(
        'button',
        {
          class: 'text-red-500 hover:text-red-700 text-xs px-2 py-1',
          onClick: () => deleteRow(row.original.id),
        },
        'Delete',
      )
    },
  },
]

const exampleCode = `// Show empty groups with add rows and summaries
<NuGrid
  v-model:grouping="grouping"
  :data="data"
  :columns="columns"
  :add-new-row="{ position: 'bottom' }"
  :layout="{ mode: 'splitgroup' }"
  :empty-group-values="{
    category: ['Electronics', 'Audio', 'Furniture', 'Gaming', 'Office']
  }"
  :summaries="{ grandTotals: true, groupSummaries: true }"
  @row-add-requested="handleRowAddRequested"
/>

// Columns with summary config:
{
  accessorKey: 'price',
  summary: { aggregate: 'sum', format: (v) => \`$\${v.toFixed(2)}\` }
}

// Collapsed groups show calculated values
// Grand totals row appears at the bottom`
</script>

<template>
  <DemoLayout
    id="add-row-empty-groups-demo"
    title="Add Row in Empty Groups"
    info-label="About Empty Groups"
  >
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Add Row State">
        <UBadge
          :color="
            addRowState === 'editing'
              ? 'primary'
              : addRowState === 'focused'
                ? 'warning'
                : 'neutral'
          "
          :variant="addRowState === 'focused' ? 'subtle' : 'soft'"
          size="xs"
        >
          {{ addRowState === 'editing' ? 'Editing' : addRowState === 'focused' ? 'Focused' : 'Idle' }}
        </UBadge>
      </DemoStatusItem>
      <DemoStatusItem label="Total Items" :value="data.length" />
      <DemoStatusItem label="Empty Groups" :value="emptyCategories.length" />
      <DemoStatusItem label="Persistent Groups" :value="emptyGroupsEnabled" boolean />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Empty Groups Feature">
        <USwitch v-model="emptyGroupsEnabled" label="Enable emptyGroupValues" />
        <p class="mt-1 text-xs text-muted">
          {{ emptyGroupsEnabled ? 'Empty groups persist with add rows' : 'Empty groups disappear' }}
        </p>
      </DemoControlGroup>

      <DemoControlGroup label="Data Management">
        <UButton
          icon="i-lucide-plus"
          color="primary"
          variant="soft"
          block
          size="sm"
          @click="addSampleData"
        >
          Add Sample Data
        </UButton>
        <UButton
          icon="i-lucide-trash-2"
          color="warning"
          variant="soft"
          block
          size="sm"
          @click="resetData"
        >
          Clear All Data
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Categories">
        <div class="space-y-1">
          <UButton
            v-for="category in allCategories"
            :key="category"
            :disabled="categoryStats[category] === 0"
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="xs"
            block
            @click="clearCategory(category)"
          >
            {{ category }} ({{ categoryStats[category] }} items)
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Layout">
        <USwitch v-model="splitGroup" label="Split Group Layout" />
      </DemoControlGroup>

      <div class="rounded-lg border border-success/30 bg-success/5 p-3">
        <h4 class="mb-2 flex items-center gap-2 text-xs font-semibold text-success">
          <UIcon name="i-lucide-check-circle" />
          Empty Groups Feature
        </h4>
        <ul class="space-y-1 text-xs text-muted">
          <li>• All groups shown even with no data</li>
          <li>• Add items directly via add row</li>
          <li>• Toggle feature to see difference</li>
          <li>• Groups maintain defined order</li>
        </ul>
      </div>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        This demo starts with <strong>no data</strong> but all groups are visible thanks to the
        <code class="rounded bg-default/50 px-1">emptyGroupValues</code> prop.
      </p>
      <div class="mb-3 rounded border border-default/50 bg-default/30 p-2">
        <h4 class="mb-1 text-sm font-medium">Empty Categories:</h4>
        <div v-if="emptyCategories.length" class="flex flex-wrap gap-1">
          <UBadge
            v-for="cat in emptyCategories"
            :key="cat"
            :color="emptyGroupsEnabled ? 'success' : 'warning'"
            variant="subtle"
            size="xs"
          >
            {{ cat }}
            <span v-if="emptyGroupsEnabled" class="ml-1 opacity-60">(visible)</span>
            <span v-else class="ml-1 opacity-60">(hidden)</span>
          </UBadge>
        </div>
        <span v-else class="text-xs text-muted">All categories have items</span>
      </div>
      <ul class="list-inside list-disc space-y-1 text-sm text-muted">
        <li><strong>Try it:</strong> Add sample data, then clear categories</li>
        <li><strong>Add items:</strong> Double-click the add row in any group</li>
        <li><strong>Key prop:</strong> <code class="rounded bg-default/50 px-1">:empty-group-values="{ category: [...] }"</code></li>
      </ul>
    </template>

    <!-- Grid -->
    <NuGrid
      ref="gridRef"
      v-model:grouping="grouping"
      :data="data"
      :columns="columns"
      :add-new-row="addNewRow"
      :layout="{ mode: gridMode }"
      :focus="{ mode: 'cell', retain: true }"
      :editing="{ enabled: true, startClicks: 'double' }"
      :empty-group-values="emptyGroupValues"
      :summaries="{ grandTotals: true, groupSummaries: true }"
      resize-columns
      @row-add-requested="handleRowAddRequested"
    />

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Empty Groups with Add Row:" :code="exampleCode" />
    </template>
  </DemoLayout>
</template>

<style scoped>
[data-add-row='true'] {
  border-inline: 1px dashed var(--ui-border);
  background-image: linear-gradient(90deg, var(--ui-primary) / 0.08, transparent 40%);
}

[data-add-row='true']:hover {
  background-image: linear-gradient(90deg, var(--ui-primary) / 0.12, transparent 50%);
}

[data-add-row='true'] [data-cell-index='0']::before {
  content: '+ ';
  color: var(--ui-primary);
  font-weight: 600;
}
</style>
