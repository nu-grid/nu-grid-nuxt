<script setup lang="ts">
import type {
  NuGridActionMenuItem,
  NuGridActionMenuOptions,
  NuGridColumn,
  NuGridRow,
} from '#nu-grid/types'

const toast = useToast()

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
])

// Action menu controls
const actionMenuEnabled = ref(true)
const actionMenuHidden = ref(false)
const conditionalActions = ref(false)
const customButton = ref(false)

// Button customization
const buttonIcon = ref('i-lucide-ellipsis-vertical')
const buttonColor = ref<'neutral' | 'primary' | 'error'>('neutral')
const buttonVariant = ref<'ghost' | 'solid' | 'outline'>('ghost')

// Focus mode for keyboard navigation
const focusMode = ref<'cell' | 'row'>('cell')

// Get actions for a row
function getActions(row: NuGridRow<Product>): NuGridActionMenuItem[] {
  const items: NuGridActionMenuItem[] = [
    { type: 'label', label: 'Actions' },
    {
      label: 'View details',
      icon: 'i-lucide-eye',
      onSelect: () =>
        toast.add({ title: 'View Details', description: `Viewing ${row.original.name}` }),
    },
    {
      label: 'Edit product',
      icon: 'i-lucide-pencil',
      onSelect: () =>
        toast.add({ title: 'Edit Product', description: `Editing ${row.original.name}` }),
    },
    {
      label: 'Duplicate',
      icon: 'i-lucide-copy',
      onSelect: () =>
        toast.add({ title: 'Duplicate', description: `Duplicating ${row.original.name}` }),
    },
    { type: 'separator' },
  ]

  if (row.original.stock === 0) {
    items.push({
      label: 'Restock',
      icon: 'i-lucide-package-plus',
      color: 'success',
      onSelect: () =>
        toast.add({ title: 'Restock', description: `Restocking ${row.original.name}` }),
    })
  }

  if (row.original.status === 'active') {
    items.push({
      label: 'Deactivate',
      icon: 'i-lucide-power-off',
      color: 'warning',
      onSelect: () =>
        toast.add({ title: 'Deactivate', description: `Deactivating ${row.original.name}` }),
    })
  } else if (row.original.status === 'inactive') {
    items.push({
      label: 'Activate',
      icon: 'i-lucide-power',
      color: 'success',
      onSelect: () =>
        toast.add({ title: 'Activate', description: `Activating ${row.original.name}` }),
    })
  }

  items.push({ type: 'separator' })
  items.push({
    label: 'Delete product',
    icon: 'i-lucide-trash',
    color: 'error',
    onSelect: () =>
      toast.add({ title: 'Delete', description: `Deleting ${row.original.name}`, color: 'error' }),
  })

  return items
}

function isRowEnabled(row: NuGridRow<Product>): boolean {
  if (!conditionalActions.value) return true
  return row.original.status !== 'discontinued'
}

const actionMenuOptions = computed<NuGridActionMenuOptions<Product> | false>(() => {
  if (!actionMenuEnabled.value) return false
  return {
    getActions,
    isRowEnabled,
    hidden: actionMenuHidden.value,
    button: customButton.value
      ? {
          icon: buttonIcon.value,
          color: buttonColor.value,
          variant: buttonVariant.value,
          class: 'ml-auto',
        }
      : undefined,
  }
})

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

const iconOptions = [
  { label: 'Ellipsis Vertical', value: 'i-lucide-ellipsis-vertical' },
  { label: 'Ellipsis Horizontal', value: 'i-lucide-ellipsis' },
  { label: 'Menu', value: 'i-lucide-menu' },
  { label: 'Settings', value: 'i-lucide-settings' },
]

const colorOptions = [
  { label: 'Neutral', value: 'neutral' },
  { label: 'Primary', value: 'primary' },
  { label: 'Error', value: 'error' },
]

const variantOptions = [
  { label: 'Ghost', value: 'ghost' },
  { label: 'Solid', value: 'solid' },
  { label: 'Outline', value: 'outline' },
]

const exampleCode = `<NuGrid
  :data="data"
  :columns="columns"
  :actions="{
    getActions: (row) => [
      { label: 'View', icon: 'i-lucide-eye', onSelect: () => view(row) },
      { type: 'separator' },
      { label: 'Delete', icon: 'i-lucide-trash', color: 'error' }
    ],
    isRowEnabled: (row) => row.original.status !== 'discontinued',
    button: { icon: 'i-lucide-more-horizontal', color: 'primary' }
  }"
/>`
</script>

<template>
  <DemoLayout id="action-menu-demo" title="Action Menu Demo" info-label="About Action Menu Column">
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Enabled" :value="actionMenuEnabled" />
      <DemoStatusItem
        label="Hidden"
        :value="actionMenuHidden ? 'Yes' : 'No'"
        :color="actionMenuHidden ? 'text-warning' : 'text-success'"
      />
      <DemoStatusItem
        label="Conditional"
        :value="conditionalActions ? 'Yes' : 'No'"
        :color="conditionalActions ? 'text-primary' : 'text-muted'"
      />
      <DemoStatusItem label="Focus Mode" :value="focusMode" />
      <DemoStatusItem
        label="Custom Button"
        :value="customButton ? 'Yes' : 'No'"
        :color="customButton ? 'text-primary' : 'text-muted'"
      />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Action Menu">
        <UButton
          block
          :color="actionMenuEnabled ? 'success' : 'error'"
          :variant="actionMenuEnabled ? 'solid' : 'outline'"
          :icon="actionMenuEnabled ? 'i-lucide-check' : 'i-lucide-x'"
          size="sm"
          @click="actionMenuEnabled = !actionMenuEnabled"
        >
          {{ actionMenuEnabled ? 'Enabled' : 'Disabled' }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Visibility">
        <UButton
          block
          :color="actionMenuHidden ? 'warning' : 'neutral'"
          :variant="actionMenuHidden ? 'solid' : 'outline'"
          :icon="actionMenuHidden ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          :disabled="!actionMenuEnabled"
          size="sm"
          @click="actionMenuHidden = !actionMenuHidden"
        >
          {{ actionMenuHidden ? 'Hidden' : 'Visible' }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Row Filtering">
        <UButton
          block
          :color="conditionalActions ? 'primary' : 'neutral'"
          :variant="conditionalActions ? 'solid' : 'outline'"
          icon="i-lucide-filter"
          :disabled="!actionMenuEnabled"
          size="sm"
          @click="conditionalActions = !conditionalActions"
        >
          {{ conditionalActions ? 'Conditional' : 'All Rows' }}
        </UButton>
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

      <DemoControlGroup v-if="actionMenuEnabled" label="Custom Button">
        <UCheckbox v-model="customButton" label="Enable" />
        <template v-if="customButton">
          <USelect v-model="buttonIcon" :items="iconOptions" size="sm" class="mt-2" />
          <div class="mt-2 grid grid-cols-2 gap-1">
            <USelect v-model="buttonColor" :items="colorOptions" size="xs" />
            <USelect v-model="buttonVariant" :items="variantOptions" size="xs" />
          </div>
        </template>
      </DemoControlGroup>

      <div
        v-if="conditionalActions"
        class="rounded-lg border border-dashed border-warning/50 bg-warning/5 p-2"
      >
        <div class="flex items-center gap-1.5 text-warning">
          <UIcon name="i-lucide-alert-triangle" class="size-3.5" />
          <span class="text-xs font-medium">Conditional Mode</span>
        </div>
        <p class="mt-1 text-xs text-muted">Discontinued products have disabled actions.</p>
      </div>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        This page demonstrates the built-in
        <code class="rounded bg-default px-1 py-0.5 text-xs">actionMenu</code>
        property for NuGrid. This creates a column with an action dropdown menu at the end of each
        row.
      </p>
      <ul class="mb-3 list-inside list-disc space-y-1 text-sm text-muted">
        <li><strong>getActions:</strong> Function that returns menu items for each row</li>
        <li><strong>isRowEnabled:</strong> Function that determines if actions are enabled</li>
        <li><strong>button:</strong> Customize the action button (icon, color, variant)</li>
        <li><strong>hidden:</strong> Hide the action column while keeping it functional</li>
      </ul>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Keyboard:</strong> Press
        <kbd class="rounded bg-elevated px-1 py-0.5 text-xs">Space</kbd> to open menu,
        <kbd class="rounded bg-elevated px-1 py-0.5 text-xs">Escape</kbd> to close.
      </div>
    </template>

    <!-- Grid -->
    <NuGrid
      :data="data"
      :columns="columns"
      :actions="actionMenuOptions"
      :focus="{ mode: focusMode }"
    />

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Action Menu Configuration:" :code="exampleCode" />
    </template>
  </DemoLayout>
</template>
