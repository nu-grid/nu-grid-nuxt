<script setup lang="ts">
import type { NuGridAddRowState, NuGridColumn, NuGridValidationOptions } from '#nu-grid/types'
import { z } from 'zod'

const toast = useToast()

interface Product {
  id: number | string
  name: string
  category: string
  status: string
  price: number
  stock: number
  quantity: number
}

// Schema-based validation using Zod (implements Standard Schema v1)
const productSchema = z.object({
  id: z.number().min(1, 'ID must be a positive number'),
  name: z
    .string()
    .min(2, 'Name must be 2-100 characters')
    .max(100, 'Name must be 2-100 characters'),
  category: z.string().min(1, 'Category is required'),
  status: z.string().min(1, 'Status is required'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  stock: z
    .number()
    .int('Stock must be a non-negative integer')
    .min(0, 'Stock must be a non-negative integer'),
  quantity: z
    .number()
    .int('Quantity must be a non-negative integer')
    .min(0, 'Quantity must be a non-negative integer'),
})

// Row-level validation rules
const rowRules = [
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

// Toggle validation on/off
const validationEnabled = ref(true)

const validationSchemaWithOptions = computed<NuGridValidationOptions<Product> | undefined>(() => {
  if (!validationEnabled.value) return undefined
  return {
    schema: productSchema,
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
    status: 'active',
    price: 1299.99,
    stock: 8,
    quantity: 6,
  },
  {
    id: 2,
    name: 'Headphones',
    category: 'Audio',
    status: 'active',
    price: 199.5,
    stock: 24,
    quantity: 18,
  },
  { id: 3, name: 'Mic', category: 'Audio', status: 'inactive', price: 159, stock: 12, quantity: 9 },
  {
    id: 4,
    name: 'Keyboard',
    category: 'Electronics',
    status: 'active',
    price: 89.99,
    stock: 18,
    quantity: 15,
  },
  {
    id: 5,
    name: 'Mouse',
    category: 'Electronics',
    status: 'inactive',
    price: 39.99,
    stock: 44,
    quantity: 41,
  },
  {
    id: 6,
    name: 'Office Chair',
    category: 'Furniture',
    status: 'active',
    price: 299,
    stock: 6,
    quantity: 5,
  },
  {
    id: 7,
    name: 'Desk Lamp',
    category: 'Furniture',
    status: 'active',
    price: 59.99,
    stock: 30,
    quantity: 26,
  },
  {
    id: 8,
    name: 'Monitor',
    category: 'Electronics',
    status: 'active',
    price: 349.99,
    stock: 10,
    quantity: 9,
  },
  {
    id: 9,
    name: 'Webcam',
    category: 'Electronics',
    status: 'active',
    price: 129.99,
    stock: 14,
    quantity: 12,
  },
  {
    id: 10,
    name: 'Soundbar',
    category: 'Audio',
    status: 'active',
    price: 249.99,
    stock: 9,
    quantity: 7,
  },
  {
    id: 11,
    name: 'Standing Desk',
    category: 'Furniture',
    status: 'inactive',
    price: 799,
    stock: 4,
    quantity: 3,
  },
  {
    id: 12,
    name: 'Gaming Chair',
    category: 'Gaming',
    status: 'active',
    price: 349,
    stock: 5,
    quantity: 4,
  },
  {
    id: 13,
    name: 'Controller',
    category: 'Gaming',
    status: 'inactive',
    price: 69.99,
    stock: 22,
    quantity: 17,
  },
])

const gridRef = ref<GridExpose | null>(null)

// Default grouping: category then status, so each group shows its own add row placeholder
type GroupingPreset = 'category-status' | 'category' | 'none'

const grouping = ref<string[]>(['category', 'status'])

const groupingOptions: { label: string; value: GroupingPreset }[] = [
  { label: 'Category + Status', value: 'category-status' },
  { label: 'Category only', value: 'category' },
  { label: 'No grouping', value: 'none' },
]

const groupingPreset = computed<GroupingPreset>({
  get: () => {
    if (grouping.value.length === 2) return 'category-status'
    if (grouping.value.length === 1) return 'category'
    return 'none'
  },
  set: (preset) => {
    if (preset === 'category-status') {
      grouping.value = ['category', 'status']
      return
    }

    if (preset === 'category') {
      grouping.value = ['category']
      return
    }

    grouping.value = []
  },
})

const splitGroup = ref(false)
const gridMode = computed<'group' | 'splitgroup'>(() => (splitGroup.value ? 'splitgroup' : 'group'))

const addNewRow: { position: 'bottom'; addNewText: string } = {
  position: 'bottom',
  addNewText: 'Add grouped item',
}

const addRowState = computed(() => {
  const exposed = gridRef.value?.addRowState
  if (typeof exposed === 'string') return exposed
  return exposed?.value ?? 'idle'
})

function handleRowAddRequested(row: Product) {
  const maxId = data.value.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0)
  row.id = maxId + 1
  row.quantity = 0
  if (!row.status) {
    row.status = 'active'
  }
  data.value = [...data.value, { ...row }]

  toast.add({
    title: 'Row added successfully',
    description: `Added "${row.name}" to the grid`,
    color: 'success',
  })
}

const columns: NuGridColumn<Product>[] = [
  { accessorKey: 'name', header: 'Name', minSize: 150, size: 180, requiredNew: true },
  { accessorKey: 'id', header: 'ID', minSize: 60, size: 60, enableEditing: false, showNew: false },
  { accessorKey: 'category', header: 'Category', minSize: 140, size: 160, requiredNew: true },
  {
    accessorKey: 'status',
    header: 'Status',
    minSize: 110,
    size: 120,
    enableEditing: true,
    requiredNew: true,
  },
  { accessorKey: 'quantity', header: 'Quantity', minSize: 100, size: 110, showNew: false },
  {
    accessorKey: 'price',
    header: 'Price',
    minSize: 100,
    size: 110,
    validateNew: (value) => {
      const num = Number(value)
      if (value === undefined || value === null || value === '') {
        return { valid: true }
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
    minSize: 90,
    size: 100,
    validateNew: (value) => {
      if (value === undefined || value === null || value === '') {
        return { valid: true }
      }
      const num = Number(value)
      if (!Number.isFinite(num) || num < 0 || !Number.isInteger(num)) {
        return { valid: false, message: 'Stock must be a non-negative integer' }
      }
      return { valid: true }
    },
  },
]

const exampleCode = `<NuGrid
  v-model:grouping="grouping"
  :data="data"
  :columns="columns"
  :add-new-row="{ position: 'bottom' }"
  :layout="{ mode: 'group' }"
  @row-add-requested="handleRowAddRequested"
/>

// Each group maintains its own add-row placeholder
// New rows automatically inherit the group's values`
</script>

<template>
  <DemoLayout
    id="add-row-grouped-demo"
    title="Add Row in Groups"
    info-label="About Grouped Add Row"
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
          {{
            addRowState === 'editing' ? 'Editing' : addRowState === 'focused' ? 'Focused' : 'Idle'
          }}
        </UBadge>
      </DemoStatusItem>
      <DemoStatusItem label="Grouping" :value="grouping.length ? grouping.join(' > ') : 'None'" />
      <DemoStatusItem label="Split Layout" :value="splitGroup" />
      <DemoStatusItem label="Validation" :value="validationEnabled" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Grouping Preset">
        <URadioGroup v-model="groupingPreset" :items="groupingOptions" class="space-y-2" />
      </DemoControlGroup>

      <DemoControlGroup label="Layout Options">
        <div class="space-y-2">
          <USwitch v-model="splitGroup" label="Split Group Layout" />
          <USwitch v-model="validationEnabled" label="Schema Validation" />
        </div>
      </DemoControlGroup>

      <div class="rounded-lg border border-default/50 bg-elevated/30 p-3">
        <h4 class="mb-2 text-xs font-semibold">How it works:</h4>
        <ul class="space-y-1 text-xs text-muted">
          <li>• Placeholder row lives inside every group</li>
          <li>• Split layout repeats headers per group</li>
          <li>• Tab/Enter finalizes and spawns next placeholder</li>
          <li>• Required fields: Name, Category, Status</li>
        </ul>
      </div>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        This demo shows how add-row functionality works with grouped data. Each group maintains its
        own add-row placeholder, allowing you to add items directly into the appropriate group.
      </p>
      <ul class="mb-3 list-inside list-disc space-y-1 text-sm text-muted">
        <li><strong>Category + Status:</strong> Nested grouping with two levels</li>
        <li><strong>Split Layout:</strong> Repeats column headers for each group section</li>
        <li>
          <strong>Auto-assignment:</strong> New rows inherit the group's category/status values
        </li>
      </ul>
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
      :layout="{ mode: gridMode }"
      :focus="{ retain: true }"
      :editing="{ enabled: true, startClicks: 'double' }"
      resize-columns
      @row-add-requested="handleRowAddRequested"
    />

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Grouped Add Row Configuration:" :code="exampleCode" />
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
