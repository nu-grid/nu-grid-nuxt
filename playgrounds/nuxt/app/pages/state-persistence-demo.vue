<script setup lang="ts">
import type { NuGridStateSnapshot } from '#nu-grid/composables'
import type { NuGridColumn } from '#nu-grid/types'

const toast = useToast()
const gridRef = useTemplateRef<{
  getState: () => NuGridStateSnapshot
  setState: (state: NuGridStateSnapshot) => void
  clearState: () => void
}>('grid')

// Sample data for the demo
interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  status: 'active' | 'inactive' | 'discontinued'
}

const data = ref<Product[]>([
  {
    id: 1,
    name: 'Laptop Pro',
    category: 'Electronics',
    price: 1299.99,
    stock: 25,
    status: 'active',
  },
  {
    id: 2,
    name: 'Wireless Mouse',
    category: 'Accessories',
    price: 49.99,
    stock: 150,
    status: 'active',
  },
  { id: 3, name: 'USB-C Hub', category: 'Accessories', price: 79.99, stock: 0, status: 'inactive' },
  {
    id: 4,
    name: 'Monitor 27"',
    category: 'Electronics',
    price: 399.99,
    stock: 42,
    status: 'active',
  },
  {
    id: 5,
    name: 'Keyboard Mechanical',
    category: 'Accessories',
    price: 129.99,
    stock: 8,
    status: 'active',
  },
  {
    id: 6,
    name: 'Old Webcam',
    category: 'Electronics',
    price: 29.99,
    stock: 3,
    status: 'discontinued',
  },
  { id: 7, name: 'Desk Lamp', category: 'Furniture', price: 45.0, stock: 67, status: 'active' },
  {
    id: 8,
    name: 'Office Chair',
    category: 'Furniture',
    price: 299.99,
    stock: 12,
    status: 'active',
  },
  {
    id: 9,
    name: 'Standing Desk',
    category: 'Furniture',
    price: 599.99,
    stock: 5,
    status: 'active',
  },
  {
    id: 10,
    name: 'Noise Cancelling Headphones',
    category: 'Electronics',
    price: 249.99,
    stock: 18,
    status: 'active',
  },
])

// State persistence controls
const persistState = ref(true)
const stateStorageId = ref('demo-grid')
const currentState = ref<NuGridStateSnapshot | null>(null)
const stateChangeCount = ref(0)

// Track if we're past initial hydration to avoid toast hydration mismatches
const isHydrated = ref(false)
onMounted(() => {
  isHydrated.value = true
})

// Handle state changed event
function onStateChanged(state: NuGridStateSnapshot) {
  currentState.value = state
  stateChangeCount.value++
  // Only show toast after hydration to avoid SSR mismatch
  if (isHydrated.value) {
    toast.add({
      title: 'State Changed',
      description: 'Grid state has been updated',
    })
  }
}

// Get current state (silent mode for initial load to avoid hydration issues)
function getCurrentState(silent = false) {
  if (!gridRef.value?.getState) {
    if (!silent) {
      toast.add({ title: 'Error', description: 'Grid reference not available', color: 'error' })
    }
    return
  }
  const state = gridRef.value.getState()
  currentState.value = state
  if (!silent) {
    toast.add({ title: 'State Retrieved', description: 'Current state has been retrieved' })
  }
}

function getCurrentStateWithToast() {
  getCurrentState(false)
}

// Set state from a predefined example
function setExampleState(type: 'sorted' | 'filtered' | 'custom') {
  if (!gridRef.value?.setState) {
    toast.add({ title: 'Error', description: 'Grid reference not available', color: 'error' })
    return
  }

  let newState: NuGridStateSnapshot = {}

  switch (type) {
    case 'sorted':
      newState = {
        sorting: [{ id: 'price', desc: true }],
        columnVisibility: {},
        pagination: { pageIndex: 0, pageSize: 10 } as any,
      }
      break
    case 'filtered':
      newState = {
        columnFilters: [{ id: 'category', value: 'Electronics' }],
        columnVisibility: {},
        pagination: { pageIndex: 0, pageSize: 10 } as any,
      }
      break
    case 'custom':
      newState = {
        sorting: [{ id: 'stock', desc: false }],
        columnFilters: [{ id: 'status', value: 'active' }],
        columnVisibility: { id: false, stock: false },
        pagination: { pageIndex: 0, pageSize: 5 } as any,
      }
      break
  }

  gridRef.value.setState(newState)
  toast.add({ title: 'State Applied', description: `${type} state has been applied` })
}

// Clear all state (clears both cookie and localStorage, restores grid to original state)
function clearState() {
  if (!gridRef.value?.clearState) {
    toast.add({ title: 'Error', description: 'Grid reference not available', color: 'error' })
    return
  }

  gridRef.value.clearState()
  currentState.value = null

  toast.add({ title: 'State Cleared', description: 'All grid state and storage have been cleared' })
}

// Save state to a variable (simulating custom storage)
const savedState = ref<NuGridStateSnapshot | null>(null)

function saveStateToVariable() {
  if (!gridRef.value?.getState) {
    toast.add({ title: 'Error', description: 'Grid reference not available', color: 'error' })
    return
  }
  savedState.value = gridRef.value.getState()
  toast.add({ title: 'State Saved', description: 'State has been saved to variable' })
}

function loadStateFromVariable() {
  if (!gridRef.value?.setState || !savedState.value) {
    toast.add({
      title: 'Error',
      description: savedState.value ? 'Grid reference not available' : 'No saved state available',
      color: 'error',
    })
    return
  }
  gridRef.value.setState(savedState.value)
  toast.add({ title: 'State Loaded', description: 'State has been loaded from variable' })
}

// Define columns
const columns: NuGridColumn<Product>[] = [
  { accessorKey: 'id', header: 'ID', minSize: 60, maxSize: 80 },
  { accessorKey: 'name', header: 'Product Name', minSize: 150 },
  { accessorKey: 'category', header: 'Category', minSize: 120 },
  {
    accessorKey: 'price',
    header: 'Price',
    minSize: 100,
    cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    minSize: 80,
    cell: ({ row }) => {
      const stock = row.original.stock
      const colorClass = stock === 0 ? 'text-error' : stock < 10 ? 'text-warning' : 'text-success'
      return h('span', { class: colorClass }, stock.toString())
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    minSize: 120,
    cell: ({ row }) => {
      const colors: Record<string, string> = {
        active: 'text-success',
        inactive: 'text-warning',
        discontinued: 'text-muted',
      }
      return h('span', { class: ['capitalize', colors[row.original.status]] }, row.original.status)
    },
  },
]

const basicUsageCode = `<NuGrid
  ref="gridRef"
  :data="data"
  :columns="columns"
  :persist-state="true"
  state-storage-id="my-grid"
  @state-changed="handleStateChange"
/>`

const programmaticCode = `const gridRef = ref()

// Get current state
function getState() {
  const state = gridRef.value?.getState()
  console.log('Current state:', state)
}

// Set state
function setState() {
  gridRef.value?.setState({
    sorting: [{ id: 'price', desc: true }],
    columnVisibility: { status: false }
  })
}`
</script>

<template>
  <DemoLayout
    id="state-persistence-demo"
    title="State Persistence Demo"
    info-label="About State Persistence"
    sidebar-width="300px"
  >
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem
        label="Persistence"
        :value="persistState ? 'Enabled' : 'Disabled'"
        :color="persistState ? 'text-success' : 'text-muted'"
      />
      <DemoStatusItem label="Storage ID" :value="stateStorageId" />
      <DemoStatusItem label="State Changes" :value="stateChangeCount" color="text-primary" />
      <DemoStatusItem
        label="Saved State"
        :value="savedState ? 'Yes' : 'No'"
        :color="savedState ? 'text-success' : 'text-muted'"
      />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Persistence">
        <UCheckbox v-model="persistState" label="Enable Persistence" />
        <UInput v-model="stateStorageId" size="sm" placeholder="Storage ID" class="mt-2" />
      </DemoControlGroup>

      <DemoControlGroup label="State Methods">
        <div class="space-y-1.5">
          <UButton block icon="i-lucide-download" size="sm" @click="getCurrentStateWithToast">
            Get Current State
          </UButton>
          <UButton
            block
            icon="i-lucide-upload"
            color="warning"
            variant="outline"
            size="sm"
            @click="clearState"
          >
            Clear All State
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Apply Preset">
        <div class="space-y-1.5">
          <UButton
            block
            icon="i-lucide-arrow-down-up"
            color="primary"
            variant="outline"
            size="sm"
            @click="setExampleState('sorted')"
          >
            Sorted by Price
          </UButton>
          <UButton
            block
            icon="i-lucide-filter"
            color="primary"
            variant="outline"
            size="sm"
            @click="setExampleState('filtered')"
          >
            Electronics Only
          </UButton>
          <UButton
            block
            icon="i-lucide-settings"
            color="primary"
            variant="outline"
            size="sm"
            @click="setExampleState('custom')"
          >
            Custom State
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Save/Load">
        <div class="space-y-1.5">
          <UButton
            block
            icon="i-lucide-save"
            color="success"
            variant="outline"
            size="sm"
            @click="saveStateToVariable"
          >
            Save to Variable
          </UButton>
          <UButton
            block
            icon="i-lucide-folder-open"
            color="success"
            variant="outline"
            size="sm"
            :disabled="!savedState"
            @click="loadStateFromVariable"
          >
            Load from Variable
          </UButton>
        </div>
      </DemoControlGroup>

      <!-- Current State Display -->
      <div class="rounded-lg border border-default bg-elevated/30 p-3">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="text-xs font-semibold tracking-wide text-muted uppercase">Current State</h3>
          <UButton
            icon="i-lucide-refresh-cw"
            size="xs"
            variant="ghost"
            @click="getCurrentStateWithToast"
          />
        </div>
        <div v-if="currentState" class="overflow-x-auto">
          <pre class="max-h-40 overflow-auto rounded bg-default/50 p-2 text-xs">{{
            JSON.stringify(currentState, null, 2)
          }}</pre>
        </div>
        <div v-else class="text-center text-xs text-muted">
          <UIcon name="i-lucide-database" class="mx-auto mb-1 size-5" />
          <p>Click "Get Current State"</p>
        </div>
      </div>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        State persistence allows you to save and restore grid state (filters, sorting, pagination,
        column visibility, etc.) to localStorage and provides methods to programmatically get and
        set state.
      </p>
      <ul class="mb-3 list-inside list-disc space-y-1 text-sm text-muted">
        <li><strong>persistState:</strong> Enable/disable automatic state persistence</li>
        <li><strong>stateStorageId:</strong> Unique identifier for localStorage key</li>
        <li><strong>getState():</strong> Retrieve current grid state programmatically</li>
        <li><strong>setState(state):</strong> Apply a state snapshot to the grid</li>
        <li><strong>@stateChanged:</strong> Event emitted whenever state is updated</li>
      </ul>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Tip:</strong> Try sorting, filtering, or hiding columns, then refresh the page. The
        state will be automatically restored if persistence is enabled.
      </div>
    </template>

    <!-- Grid -->
    <NuGrid
      ref="grid"
      :data="data"
      :columns="columns"
      :state="persistState ? { key: stateStorageId } : false"
      :column-defaults="{ resize: true, reorder: true }"
      :ui="{
        base: 'w-max min-w-full border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default',
      }"
      @state-changed="onStateChanged"
      @ready="() => getCurrentState(true)"
    />

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Basic Usage with Persistence:" :code="basicUsageCode" />
      <DemoCodeBlock title="Programmatic State Management:" :code="programmaticCode" class="mt-4" />
    </template>
  </DemoLayout>
</template>

<style scoped>
code {
  font-family: 'Monaco', 'Courier New', monospace;
}
</style>
