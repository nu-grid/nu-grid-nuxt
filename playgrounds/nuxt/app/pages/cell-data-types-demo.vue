<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'
import NuGridCellEditorCustomNumber from '~/components/NuGrid/NuGridCellEditorCustomNumber.vue'
import NuGridCellEditorRange from '~/components/NuGrid/NuGridCellEditorRange.vue'

const toast = useToast()
const table = useTemplateRef('table')

// Sample data with different data types
interface Product {
  id: number
  name: string
  price: number
  quantity: number
  releaseDate: string
  lastUpdated: string
  rating: number
  discount: number // Percentage discount (0-100)
  inStock: boolean
  featured: boolean // Featured product (custom renderer demo)
}

const data = ref<Product[]>([
  {
    id: 1,
    name: 'Laptop Pro',
    price: 1299.99,
    quantity: 15,
    releaseDate: '2024-01-15',
    lastUpdated: '2024-11-20',
    rating: 4.5,
    discount: 10,
    inStock: true,
    featured: true,
  },
  {
    id: 2,
    name: 'Wireless Mouse',
    price: 29.99,
    quantity: 150,
    releaseDate: '2023-06-10',
    lastUpdated: '2024-11-18',
    rating: 4.2,
    discount: 15,
    inStock: true,
    featured: false,
  },
  {
    id: 3,
    name: 'USB-C Cable',
    price: 12.99,
    quantity: 0,
    releaseDate: '2023-03-22',
    lastUpdated: '2024-11-15',
    rating: 3.8,
    discount: 5,
    inStock: false,
    featured: false,
  },
  {
    id: 4,
    name: 'Monitor 4K',
    price: 599.99,
    quantity: 8,
    releaseDate: '2024-08-05',
    lastUpdated: '2024-11-22',
    rating: 4.7,
    discount: 20,
    inStock: true,
    featured: true,
  },
  {
    id: 5,
    name: 'Mechanical Keyboard',
    price: 149.99,
    quantity: 25,
    releaseDate: '2024-02-14',
    lastUpdated: '2024-11-19',
    rating: 4.6,
    discount: 0,
    inStock: true,
    featured: false,
  },
  {
    id: 6,
    name: 'Webcam HD',
    price: 79.99,
    quantity: 0,
    releaseDate: '2023-11-30',
    lastUpdated: '2024-11-10',
    rating: 4.0,
    discount: 25,
    inStock: false,
    featured: true,
  },
])

const editingEnabled = ref(true)
const useCustomDefaultEditors = ref(false)

const { focusMode, toggleFocusMode, focusModeIcon, focusModeLabel, focusModeStatus } =
  useFocusModeToggle()

const columns: NuGridColumn<Product>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    minSize: 60,
    enableEditing: false,
    enableFocusing: false,
    cellDataType: 'number',
  },
  {
    accessorKey: 'name',
    header: 'Product Name',
    minSize: 150,
    cellDataType: 'text',
  },
  {
    accessorKey: 'inStock',
    header: 'In Stock',
    minSize: 100,
    cellDataType: 'boolean',
  },
  {
    accessorKey: 'featured',
    header: 'Featured',
    minSize: 100,
    cellDataType: 'boolean',
    // Custom cell renderer with Yes/No text instead of checkbox
    cell: ({ row }) =>
      h(
        'span',
        {
          class: row.original.featured ? 'text-success font-medium' : 'text-muted',
        },
        row.original.featured ? '⭐ Yes' : 'No',
      ),
    overrideCellRender: true, // Marks that we have a custom renderer
  },
  {
    accessorKey: 'price',
    header: 'Price ($)',
    minSize: 100,
    cellDataType: 'number',
    cell: ({ row }) => {
      return `$${row.original.price.toFixed(2)}`
    },
  },
  {
    accessorKey: 'quantity',
    header: 'Quantity',
    minSize: 100,
    cellDataType: 'number',
  },
  {
    accessorKey: 'releaseDate',
    header: 'Release Date',
    minSize: 130,
    cellDataType: 'date',
    cell: ({ row }) => {
      const date = new Date(row.original.releaseDate)
      return date.toLocaleDateString()
    },
  },
  {
    accessorKey: 'lastUpdated',
    header: 'Last Updated',
    minSize: 130,
    cellDataType: 'date',
    cell: ({ row }) => {
      const date = new Date(row.original.lastUpdated)
      return date.toLocaleDateString()
    },
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    minSize: 90,
    cellDataType: 'number',
    cell: ({ row }) => {
      return `⭐ ${row.original.rating}`
    },
  },
  {
    accessorKey: 'discount',
    header: 'Discount %',
    minSize: 110,
    cellDataType: 'number', // Has cellDataType, but custom editor overrides it
    cell: ({ row }) => {
      return `${row.original.discount}%`
    },
    // Custom editor overrides the default number editor with declarative syntax
    editor: { component: NuGridCellEditorRange, props: { min: 0, max: 100, step: 5 } },
  },
]

const columnVisibility = ref()
const rowSelection = ref({})
const columnSizing = ref({})
const columnPinning = ref({})

function onCellValueChanged(event: { row: any; column: any; oldValue: any; newValue: any }) {
  const columnLabel = event.column.header || event.column.id
  toast.add({
    title: 'Cell Value Changed',
    description: `${columnLabel}: "${event.oldValue}" → "${event.newValue}"`,
    color: 'success',
  })
}
</script>

<template>
  <DemoLayout id="cell-data-types-demo" title="Cell Data Types Demo">
    <template #status>
      <DemoStatusItem label="Products" :value="data.length" />
      <DemoStatusItem label="Editing" :value="editingEnabled" boolean />
      <DemoStatusItem label="Custom Editors" :value="useCustomDefaultEditors" boolean />
      <DemoStatusItem label="Focus Mode" :value="focusModeLabel" />
    </template>

    <template #controls>
      <DemoControlGroup label="Editing Options">
        <UButton
          :color="editingEnabled ? 'success' : 'neutral'"
          :variant="editingEnabled ? 'solid' : 'outline'"
          :icon="editingEnabled ? 'i-lucide-pencil' : 'i-lucide-pencil-off'"
          block
          @click="editingEnabled = !editingEnabled"
        >
          {{ editingEnabled ? 'Disable' : 'Enable' }} Editing
        </UButton>

        <UButton
          :color="useCustomDefaultEditors ? 'primary' : 'neutral'"
          :variant="useCustomDefaultEditors ? 'solid' : 'outline'"
          icon="i-lucide-sparkles"
          block
          @click="useCustomDefaultEditors = !useCustomDefaultEditors"
        >
          {{ useCustomDefaultEditors ? 'Disable' : 'Enable' }} Custom Editors
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Focus Mode">
        <UButton
          color="neutral"
          variant="outline"
          :icon="focusModeIcon"
          :aria-label="focusModeStatus"
          block
          @click="toggleFocusMode"
        >
          Focus: {{ focusModeLabel }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Column Pinning">
        <NuGridColumnPinningControl :grid-ref="table" />
      </DemoControlGroup>
    </template>

    <template #info>
      <p class="mb-3 text-sm text-muted">
        This page demonstrates the new
        <code class="rounded bg-default px-1 py-0.5 text-xs">cellDataType</code> property for NuGrid
        columns. Each column has a specific data type that determines which default editor is used
        when editing cells.
      </p>
      <ul class="mb-3 list-inside list-disc space-y-1 text-sm text-muted">
        <li><strong>text:</strong> Text input field (Product Name)</li>
        <li><strong>number:</strong> Number input with step controls (Price, Quantity, Rating)</li>
        <li><strong>date:</strong> Date picker (Release Date, Last Updated)</li>
        <li>
          <strong>boolean:</strong> Checkbox input, toggleable with click or space key (In Stock)
        </li>
      </ul>
      <div class="mb-3 rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Per-Column Custom Editors:</strong> The Discount % column demonstrates that custom
        editors override cellDataType defaults. It has
        <code class="rounded bg-default px-1 py-0.5 text-xs">cellDataType: 'number'</code> but uses
        a custom slider editor instead of the default number input.
      </div>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Grid-Level Default Editors:</strong> Click "Enable Custom Editors" to see custom
        default editors in action! All number columns (Price, Quantity, Rating) will use a custom
        editor with a blue border and sparkle icon. This demonstrates the
        <code class="rounded bg-default px-1 py-0.5 text-xs">defaultEditors</code> prop which allows
        you to override built-in editors for all columns of a specific data type.
      </div>
    </template>

    <NuGrid
      ref="table"
      v-model:column-visibility="columnVisibility"
      v-model:row-selection="rowSelection"
      v-model:column-sizing="columnSizing"
      v-model:column-pinning="columnPinning"
      :editing="{
        enabled: editingEnabled,
        startKeys: 'all',
        startClicks: 'double',
        defaultEditors: useCustomDefaultEditors
          ? {
              number: NuGridCellEditorCustomNumber,
            }
          : undefined,
      }"
      :focus="{ mode: focusMode }"
      :layout="{ mode: 'div', stickyHeaders: true }"
      resize-columns
      reorder-columns
      :data="data"
      :columns="columns"
      :ui="{
        base: 'w-max min-w-full border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default',
        separator: 'h-0',
      }"
      @cell-value-changed="onCellValueChanged"
    />

    <template #code>
      <DemoCodeBlock
        code="const columns = [
  {
    accessorKey: 'name',
    header: 'Product Name',
    cellDataType: 'text',
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cellDataType: 'number',
  },
  {
    accessorKey: 'releaseDate',
    header: 'Release Date',
    cellDataType: 'date',
  },
  {
    accessorKey: 'inStock',
    header: 'In Stock',
    cellDataType: 'boolean',
  },
  {
    accessorKey: 'discount',
    header: 'Discount %',
    cellDataType: 'number',
    // Custom editor overrides the default
    editor: {
      component: NuGridCellEditorRange,
      props: { min: 0, max: 100, step: 5 }
    },
  },
]"
      />
    </template>

    <template #extra>
      <UAccordion
        :items="[{ label: 'Data Type Reference', icon: 'i-lucide-book-open', slot: 'reference' }]"
      >
        <template #reference>
          <div class="p-4">
            <div class="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
              <div>
                <div class="mb-1 rounded bg-default/50 p-2 font-mono">cellDataType: 'text'</div>
                <p class="text-muted">Default text input editor for string values</p>
              </div>
              <div>
                <div class="mb-1 rounded bg-default/50 p-2 font-mono">cellDataType: 'number'</div>
                <p class="text-muted">Numeric input with increment/decrement controls</p>
              </div>
              <div>
                <div class="mb-1 rounded bg-default/50 p-2 font-mono">cellDataType: 'date'</div>
                <p class="text-muted">Date picker input (stores as YYYY-MM-DD string)</p>
              </div>
              <div>
                <div class="mb-1 rounded bg-default/50 p-2 font-mono">cellDataType: 'boolean'</div>
                <p class="text-muted">
                  Checkbox input for true/false values, toggleable with click or space
                </p>
              </div>
            </div>
          </div>
        </template>
      </UAccordion>
    </template>
  </DemoLayout>
</template>

<style scoped>
code {
  font-family: 'Monaco', 'Courier New', monospace;
}
</style>
