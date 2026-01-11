<script setup lang="ts">
import type { NuGridAddRowState, NuGridColumn, NuGridValidationOptions } from '#nu-grid/types'
import { z } from 'zod'

const toast = useToast()

// Sample data for the demo
interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  quantity: number
  status: string
}

// Schema-based validation using Zod (implements Standard Schema v1)
// This validates both existing row edits AND add-row submissions
// Note: Fields use .optional() to handle add-row where values start as undefined
// Note: Numeric fields use z.coerce to handle string inputs from editors
const productSchema = z.object({
  id: z.coerce.number().min(1, 'ID must be a positive number').optional(),
  name: z
    .string()
    .min(2, 'Name must be 2-100 characters')
    .max(100, 'Name must be 2-100 characters')
    .optional(),
  category: z.string().min(1, 'Category is required').optional(),
  price: z.coerce.number().min(0.01, 'Price must be greater than 0').optional(),
  stock: z.coerce
    .number()
    .int('Stock must be a non-negative integer')
    .min(0, 'Stock must be a non-negative integer')
    .optional(),
  quantity: z.coerce
    .number()
    .int('Quantity must be a non-negative integer')
    .min(0, 'Quantity must be a non-negative integer')
    .optional(),
  status: z.string().min(1, 'Status is required').optional(),
})

// Row-level validation rules (cross-field validation)
const rowRules = [
  // Stock should be greater than or equal to quantity
  (row: Product) => {
    if (row.stock < row.quantity) {
      return {
        valid: false,
        message: 'Stock cannot be less than quantity',
        failedFields: ['stock', 'quantity'],
      }
    }
    return { valid: true }
  },
]

// Toggle validation on/off for demonstration
const validationEnabled = ref(true)

// Computed validation schema
// Cast schema to any to handle optional fields for add-row compatibility
const validationSchemaWithOptions = computed<NuGridValidationOptions<Product> | undefined>(() => {
  if (!validationEnabled.value) return undefined
  return {
    schema: productSchema as any,
    rowRules,
    validateOn: 'reward',
    showErrors: 'always',
    icon: 'i-lucide-alert-circle',
    onInvalid: 'block',
  }
})

interface GridExpose {
  addRowState?: NuGridAddRowState | { value: NuGridAddRowState }
}

const data = ref<Product[]>([
  {
    id: 1,
    name: 'Laptop',
    category: 'Electronics',
    price: 999.99,
    stock: 15,
    quantity: 12,
    status: 'active',
  },
  {
    id: 2,
    name: 'Mouse',
    category: 'Electronics',
    price: 29.99,
    stock: 50,
    quantity: 44,
    status: 'active',
  },
  {
    id: 3,
    name: 'Keyboard',
    category: 'Electronics',
    price: 79.99,
    stock: 30,
    quantity: 28,
    status: 'active',
  },
  {
    id: 4,
    name: 'Monitor',
    category: 'Electronics',
    price: 299.99,
    stock: 20,
    quantity: 18,
    status: 'active',
  },
  {
    id: 5,
    name: 'Headphones',
    category: 'Audio',
    price: 149.99,
    stock: 25,
    quantity: 22,
    status: 'active',
  },
])

const gridRef = ref<GridExpose | null>(null)

// Add new row configuration
type AddNewRowOption = 'disabled' | 'boolean' | 'none' | 'top' | 'bottom'
const addNewRowOption = ref<AddNewRowOption>('boolean')

const addNewRowOptions = [
  { label: 'Disabled', value: 'disabled' as AddNewRowOption },
  { label: 'Boolean (true)', value: 'boolean' as AddNewRowOption },
  { label: 'Position: none', value: 'none' as AddNewRowOption },
  { label: 'Position: top', value: 'top' as AddNewRowOption },
  { label: 'Position: bottom', value: 'bottom' as AddNewRowOption },
]

const grouping = ref<string[]>([])
const groupByCategory = ref(false)

function handleRowAddRequested(row: Product) {
  const maxId = data.value.reduce((max, item) => Math.max(max, item.id ?? 0), 0)
  row.id = maxId + 1
  row.quantity = 0
  if (!row.status) {
    row.status = 'active'
  }
  // Keep the demo's source data in sync so subsequent edits work on the persisted array
  data.value = [...data.value, { ...row }]

  // Show toast notification when addrow is finalized
  toast.add({
    title: 'Row added successfully',
    description: `Added "${row.name}" to the grid`,
    color: 'success',
  })
}

watch(groupByCategory, (enabled) => {
  grouping.value = enabled ? ['category'] : []
})

const addNewRow = computed<
  boolean | { position: 'none' | 'top' | 'bottom'; addNewText: string } | undefined
>(() => {
  switch (addNewRowOption.value) {
    case 'disabled':
      return undefined
    case 'boolean':
      return true
    case 'none':
      return { position: 'none', addNewText: 'Add New Product' }
    case 'top':
      return { position: 'top', addNewText: 'Add New Product' }
    case 'bottom':
      return { position: 'bottom', addNewText: 'Add New Product' }
    default:
      return undefined
  }
})

const addRowState = computed(() => {
  const exposed = gridRef.value?.addRowState
  if (typeof exposed === 'string') return exposed
  return exposed?.value ?? 'idle'
})

// Define columns
const columns: NuGridColumn<Product>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    minSize: 60,
    size: 60,
    enableEditing: false,
    // Hide ID column in add row (it's auto-generated)
    showNew: false,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    minSize: 150,
    size: 200,
    // Name is required when adding a new row
    requiredNew: true,
  },
  {
    accessorKey: 'category',
    header: 'Category',
    minSize: 120,
    size: 150,
  },
  {
    accessorKey: 'price',
    header: 'Price',
    minSize: 100,
    size: 100,
    // Validate that price is positive
    validateNew: (value) => {
      const num = Number(value)
      if (value === undefined || value === null || value === '') {
        return { valid: true } // Allow empty, but can be made required with requiredNew
      }
      if (!Number.isFinite(num) || num <= 0) {
        return { valid: false, message: 'Price must be a positive number' }
      }
      return { valid: true }
    },
    cell: ({ row }) => {
      const raw = row.original.price as any
      const numeric = Number(raw)
      if (Number.isFinite(numeric)) {
        return `$${numeric.toFixed(2)}`
      }
      if (raw !== undefined && raw !== null && raw !== '') {
        return String(raw)
      }
      return '-'
    },
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    minSize: 80,
    size: 80,
    // Validate that stock is a non-negative integer
    validateNew: (value) => {
      if (value === undefined || value === null || value === '') {
        return { valid: true } // Allow empty
      }
      const num = Number(value)
      if (!Number.isFinite(num) || num < 0 || !Number.isInteger(num)) {
        return { valid: false, message: 'Stock must be a non-negative integer' }
      }
      return { valid: true }
    },
  },
  {
    accessorKey: 'quantity',
    header: 'Quantity',
    minSize: 100,
    size: 110,
    // Editable for existing rows, hidden in add row so it's server-provided there
    showNew: false,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    minSize: 100,
    size: 100,
  },
]

const exampleCode = `<NuGrid
  :data="data"
  :columns="columns"
  :add-new-row="true"
  @row-add-requested="handleRowAddRequested"
/>

// Column options for add row:
{
  accessorKey: 'id',
  showNew: false, // Hide in add row
}
{
  accessorKey: 'name',
  requiredNew: true, // Required field
}
{
  accessorKey: 'category',
  defaultValue: 'General', // Default value
}`
</script>

<template>
  <DemoLayout id="add-row-demo" title="Add New Row Demo" info-label="About Add New Row">
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
          {{
            addRowState === 'editing' ? 'Editing' : addRowState === 'focused' ? 'Focused' : 'Idle'
          }}
        </UBadge>
      </DemoStatusItem>
      <DemoStatusItem label="Position" :value="addNewRowOption" />
      <DemoStatusItem label="Grouped" :value="groupByCategory" />
      <DemoStatusItem label="Validation" :value="validationEnabled" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Add Row Position">
        <USelect
          v-model="addNewRowOption"
          :items="addNewRowOptions"
          placeholder="Select option"
          size="sm"
        />
      </DemoControlGroup>

      <DemoControlGroup label="Options">
        <div class="space-y-2">
          <USwitch v-model="groupByCategory" label="Group by Category" />
          <USwitch v-model="validationEnabled" label="Schema Validation" />
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Configuration">
        <pre
          class="max-h-32 overflow-auto rounded-lg border border-default bg-elevated/50 p-2 text-xs"
          >{{ JSON.stringify(addNewRow, null, 2) || 'undefined' }}</pre
        >
      </DemoControlGroup>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        This page demonstrates the
        <code class="rounded bg-default px-1 py-0.5 text-xs">addNewRow</code>
        prop for NuGrid. The add new row feature allows you to display a special row for adding new
        items to the grid.
      </p>
      <ul class="mb-3 list-inside list-disc space-y-1 text-sm text-muted">
        <li>
          <strong>Boolean:</strong> Set to <code>true</code> to enable add new row at bottom
          (default position)
        </li>
        <li>
          <strong>Object:</strong> Configure with <code>position</code> ('none', 'top', or 'bottom')
          and <code>addNewText</code>
        </li>
        <li>
          <strong>Reactivity:</strong> The composable <code>showAddNewRow</code> reacts to prop
          changes in real-time
        </li>
      </ul>
      <div class="mb-3 rounded-lg border border-default/50 bg-elevated/30 p-3">
        <p class="mb-2 text-sm font-semibold">Column Props for Add Row:</p>
        <ul class="space-y-1 text-xs text-muted">
          <li>
            <code class="rounded bg-default px-1 py-0.5">showNew: false</code> - Hide column in add
            row (ID column)
          </li>
          <li>
            <code class="rounded bg-default px-1 py-0.5">requiredNew: true</code> - Require field
            when adding (Name column)
          </li>
          <li>
            <code class="rounded bg-default px-1 py-0.5">validateNew</code> - Custom validation
            function (Price & Stock columns)
          </li>
        </ul>
      </div>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Keyboard:</strong> Arrow Up/Down keys finalize and create a new add row.
      </div>
    </template>

    <!-- Grid -->
    <NuGrid
      ref="gridRef"
      v-model:grouping="grouping"
      :data="data"
      :columns="columns"
      :add-new-row="addNewRow"
      :validation="validationSchemaWithOptions"
      :focus="{ retain: true }"
      :editing="{ enabled: true, startClicks: 'single', startKeys: 'all' }"
      resize-columns
      :ui="{
        root: 'h-full w-full',
        base: 'w-max min-w-full border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody:
          '[data-add-row=true]:bg-primary/5 [&>tr]:last:[&>td]:border-b-0 [data-add-row=true] [data-cell-index=\'0\']::before:hidden',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default',
      }"
      @row-add-requested="handleRowAddRequested"
    />

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Add New Row Configuration:" :code="exampleCode" />
    </template>
  </DemoLayout>
</template>

<style scoped>
code {
  font-family: 'Monaco', 'Courier New', monospace;
}

[data-add-row='true'] {
  border-inline: 1px dashed var(--ui-border);
  background-image: linear-gradient(90deg, var(--ui-primary) / 0.06, transparent 35%);
}

[data-add-row='true'] [data-cell-index='0']::before {
  content: '+ Add new item';
  color: var(--ui-primary);
  font-weight: 600;
  margin-right: 0.5rem;
}
</style>
