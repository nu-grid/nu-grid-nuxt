<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'
import { z } from 'zod'

// Sample data
interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  rating: number
  active: boolean
}

const data = ref<Product[]>([
  {
    id: 1,
    name: 'Laptop Pro 15"',
    category: 'Electronics',
    price: 1299.99,
    stock: 45,
    rating: 4.5,
    active: true,
  },
  {
    id: 2,
    name: 'Wireless Mouse',
    category: 'Accessories',
    price: 29.99,
    stock: 120,
    rating: 4.2,
    active: true,
  },
  {
    id: 3,
    name: 'USB-C Hub',
    category: 'Accessories',
    price: 49.99,
    stock: 78,
    rating: 4.7,
    active: true,
  },
  {
    id: 4,
    name: 'Mechanical Keyboard',
    category: 'Accessories',
    price: 89.99,
    stock: 34,
    rating: 4.8,
    active: false,
  },
  {
    id: 5,
    name: 'Monitor 27" 4K',
    category: 'Electronics',
    price: 549.99,
    stock: 22,
    rating: 4.6,
    active: true,
  },
])

// Define columns
const columns: NuGridColumn<Product>[] = [
  { accessorKey: 'name', header: 'Product Name', cellDataType: 'text' },
  { accessorKey: 'category', header: 'Category', cellDataType: 'text' },
  {
    accessorKey: 'price',
    header: 'Price',
    cellDataType: 'number',
    cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
  },
  { accessorKey: 'stock', header: 'Stock', cellDataType: 'number' },
  { accessorKey: 'rating', header: 'Rating', cellDataType: 'number' },
  { accessorKey: 'active', header: 'Active', cellDataType: 'boolean' },
]

// Validation schema using Zod (implements Standard Schema v1)
const productSchema = z.object({
  id: z.number().min(1, 'ID must be a positive number'),
  name: z
    .string()
    .min(2, 'Name must be 2-100 characters')
    .max(100, 'Name must be 2-100 characters'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().min(0, 'Price must be positive'),
  stock: z
    .number()
    .int('Stock must be non-negative integer')
    .min(0, 'Stock must be non-negative integer'),
  rating: z
    .number()
    .min(0, 'Rating must be between 0 and 5')
    .max(5, 'Rating must be between 0 and 5'),
  active: z.boolean(),
})

// Track selected rows
const selectedIds = ref<string[]>([])

// Current preset
const currentPreset = ref<'readOnly' | 'editable' | 'forms'>('editable')
const presets: Array<{ label: string; value: 'readOnly' | 'editable' | 'forms'; icon: string }> = [
  { label: 'Read Only', value: 'readOnly', icon: 'i-lucide-eye' },
  { label: 'Editable', value: 'editable', icon: 'i-lucide-pencil' },
  { label: 'Forms', value: 'forms', icon: 'i-lucide-file-text' },
]

const exampleCode = `<NuGrid
  :preset="'editable'"
  :data="data"
  :columns="columns"
  :validation="{
    schema: productSchema,
    validateOn: 'submit',
    onInvalid: 'block'
  }"
  :row-selection="{
    mode: 'multi',
    placement: 'start'
  }"
  :actions="{
    placement: 'end',
    getActions: (row) => [...],
    isRowEnabled: (row) => row.original.active
  }"
  :column-defaults="{ resize: true, reorder: true }"
/>`
</script>

<template>
  <DemoLayout id="nugrid-new-api-demo" title="NuGrid New API Demo" info-label="About New API">
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Current Preset" :value="currentPreset" color="text-primary" />
      <DemoStatusItem label="Total Items" :value="data.length" />
      <DemoStatusItem label="Selected" :value="selectedIds.length" />
      <DemoStatusItem label="Editing" :value="currentPreset !== 'readOnly'" />
      <DemoStatusItem label="Validation" :value="currentPreset !== 'readOnly'" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Select Preset">
        <div class="space-y-1">
          <UButton
            v-for="preset in presets"
            :key="preset.value"
            block
            size="sm"
            :icon="preset.icon"
            :color="currentPreset === preset.value ? 'primary' : 'neutral'"
            :variant="currentPreset === preset.value ? 'solid' : 'outline'"
            @click="currentPreset = preset.value"
          >
            {{ preset.label }}
          </UButton>
        </div>
      </DemoControlGroup>

      <div class="rounded-lg border border-default/50 bg-elevated/30 p-3">
        <h4 class="mb-2 text-xs font-semibold">Preset Features:</h4>
        <div class="space-y-2 text-xs text-muted">
          <div v-if="currentPreset === 'readOnly'">
            <p>• Row focus mode</p>
            <p>• No editing</p>
            <p>• Basic layout</p>
          </div>
          <div v-else-if="currentPreset === 'editable'">
            <p>• Cell focus with retain</p>
            <p>• Editing enabled</p>
            <p>• Multi-select</p>
            <p>• Validation on submit</p>
          </div>
          <div v-else>
            <p>• Cell focus</p>
            <p>• Single-click editing</p>
            <p>• Validation on blur</p>
            <p>• Auto-size to fill</p>
          </div>
        </div>
      </div>

      <div
        v-if="selectedIds.length > 0"
        class="rounded-lg border border-primary/50 bg-primary/5 p-3"
      >
        <h4 class="mb-2 text-xs font-semibold">Selected Items:</h4>
        <div class="flex flex-wrap gap-1">
          <UBadge v-for="id in selectedIds" :key="id" color="primary" size="xs">
            {{ data.find((p) => p.id.toString() === id)?.name }}
          </UBadge>
        </div>
      </div>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        Demonstrating the new grouped props and preset system. Presets provide sensible defaults for
        common use cases while allowing full customization.
      </p>
      <div class="mb-3 grid grid-cols-2 gap-2 text-xs">
        <div class="rounded bg-default/50 p-2">
          <strong>Grouped Props:</strong>
          <ul class="mt-1 space-y-0.5 text-muted">
            <li>• focus</li>
            <li>• editing</li>
            <li>• validation</li>
            <li>• selection</li>
            <li>• actions</li>
            <li>• layout</li>
          </ul>
        </div>
        <div class="rounded bg-default/50 p-2">
          <strong>Available Presets:</strong>
          <ul class="mt-1 space-y-0.5 text-muted">
            <li>• readOnly</li>
            <li>• editable</li>
            <li>• forms</li>
            <li>• analytics</li>
            <li>• kanban</li>
          </ul>
        </div>
      </div>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Note:</strong> Legacy flat props still work with deprecation notices.
      </div>
    </template>

    <!-- Grid -->
    <NuGrid
      :key="currentPreset"
      :preset="currentPreset"
      :data="data"
      :columns="columns"
      :validation="
        currentPreset !== 'readOnly'
          ? {
              schema: productSchema,
              validateOn: currentPreset === 'forms' ? 'blur' : 'submit',
              onInvalid: 'block',
            }
          : false
      "
      :row-selection="
        currentPreset === 'editable'
          ? {
              mode: 'multi',
              placement: 'start',
              sync: (ids) => {
                selectedIds = ids
              },
            }
          : false
      "
      :actions="
        currentPreset !== 'readOnly'
          ? {
              placement: 'end',
              getActions: (row) => [
                {
                  label: 'Edit',
                  icon: 'i-lucide-pencil',
                  onSelect: () => console.log('Edit', row.original),
                },
                { type: 'separator' },
                {
                  label: 'Delete',
                  icon: 'i-lucide-trash-2',
                  color: 'error',
                  onSelect: () => console.log('Delete', row.original),
                },
              ],
              isRowEnabled: (row) => row.original.active,
            }
          : false
      "
      :column-defaults="{ resize: true, reorder: true }"
    />

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="New Grouped Props API:" :code="exampleCode" />
    </template>
  </DemoLayout>
</template>
