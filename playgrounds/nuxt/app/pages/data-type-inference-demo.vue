<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

const toast = useToast()

// Sample data with various data types for inference
interface SalesRecord {
  id: number
  product: string
  price: number // Will be inferred as 'currency' (2 decimals + column name)
  quantity: number // Will be inferred as 'number'
  discountRate: number // Will be inferred as 'percentage' (0-1 + column name contains 'rate')
  inStock: boolean // Will be inferred as 'boolean'
  orderDate: Date // Will be inferred as 'date'
  notes: string // Will be inferred as 'text'
  totalAmount: number // Will be inferred as 'currency' (2 decimals + column name)
}

const data = ref<SalesRecord[]>([
  {
    id: 1,
    product: 'Laptop Pro 15"',
    price: 1299.99,
    quantity: 5,
    discountRate: 0.15,
    inStock: true,
    orderDate: new Date('2024-01-15'),
    notes: 'High demand item',
    totalAmount: 5524.96,
  },
  {
    id: 2,
    product: 'Wireless Mouse',
    price: 49.99,
    quantity: 25,
    discountRate: 0.1,
    inStock: true,
    orderDate: new Date('2024-02-20'),
    notes: 'Popular accessory',
    totalAmount: 1124.78,
  },
  {
    id: 3,
    product: 'USB-C Hub',
    price: 79.99,
    quantity: 0,
    discountRate: 0.25,
    inStock: false,
    orderDate: new Date('2024-03-10'),
    notes: 'Awaiting restock',
    totalAmount: 0,
  },
  {
    id: 4,
    product: '4K Monitor',
    price: 599.99,
    quantity: 8,
    discountRate: 0.2,
    inStock: true,
    orderDate: new Date('2024-04-05'),
    notes: 'Premium display',
    totalAmount: 3839.94,
  },
  {
    id: 5,
    product: 'Mechanical Keyboard',
    price: 149.99,
    quantity: 12,
    discountRate: 0.05,
    inStock: true,
    orderDate: new Date('2024-05-18'),
    notes: 'Cherry MX switches',
    totalAmount: 1709.89,
  },
])

const inferenceEnabled = ref(true)

// Single column definition - inference is controlled by the grid's dataTypeInference prop
const columns: NuGridColumn<SalesRecord>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 60,
    enableEditing: false,
  },
  {
    accessorKey: 'product',
    header: 'Product',
    size: 180,
  },
  {
    accessorKey: 'price',
    header: 'Price',
    size: 100,
  },
  {
    accessorKey: 'quantity',
    header: 'Qty',
    size: 80,
  },
  {
    accessorKey: 'discountRate',
    header: 'Discount Rate',
    size: 120,
  },
  {
    accessorKey: 'inStock',
    header: 'In Stock',
    size: 90,
  },
  {
    accessorKey: 'orderDate',
    header: 'Order Date',
    size: 120,
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total Amount',
    size: 130,
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
    size: 150,
  },
]

const columnSizing = ref({})

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
  <DemoLayout id="data-type-inference-demo" title="Data Type Inference Demo">
    <template #status>
      <DemoStatusItem label="Records" :value="data.length" />
      <DemoStatusItem label="Inference" :value="inferenceEnabled ? 'Enabled' : 'Disabled'" />
    </template>

    <template #controls>
      <DemoControlGroup label="Type Inference">
        <UButton
          :color="inferenceEnabled ? 'success' : 'neutral'"
          :variant="inferenceEnabled ? 'solid' : 'outline'"
          :icon="inferenceEnabled ? 'i-lucide-sparkles' : 'i-lucide-sparkle-off'"
          block
          @click="inferenceEnabled = !inferenceEnabled"
        >
          {{ inferenceEnabled ? 'Disable' : 'Enable' }} Inference
        </UButton>
      </DemoControlGroup>
    </template>

    <template #info>
      <p class="mb-3 text-sm text-muted">
        NuGrid automatically infers data types from your row data, similar to AG Grid. This means
        you don't need to manually specify
        <code class="rounded bg-default px-1 py-0.5 text-xs">cellDataType</code>
        for each column - NuGrid will detect it automatically.
      </p>

      <div class="mb-3 rounded bg-success/10 border border-success/30 p-3 text-sm">
        <strong class="text-success">Detected Types:</strong>
        <ul class="mt-2 list-inside list-disc space-y-1 text-muted">
          <li>
            <strong>price, totalAmount:</strong> Detected as
            <code class="bg-default px-1 rounded text-xs">currency</code> (numbers with 2 decimals +
            column name contains price/amount)
          </li>
          <li>
            <strong>discountRate:</strong> Detected as
            <code class="bg-default px-1 rounded text-xs">percentage</code> (0-1 range + column name
            contains 'rate')
          </li>
          <li>
            <strong>inStock:</strong> Detected as
            <code class="bg-default px-1 rounded text-xs">boolean</code>
          </li>
          <li>
            <strong>orderDate:</strong> Detected as
            <code class="bg-default px-1 rounded text-xs">date</code> (JavaScript Date object)
          </li>
          <li>
            <strong>quantity, id:</strong> Detected as
            <code class="bg-default px-1 rounded text-xs">number</code>
          </li>
          <li>
            <strong>product, notes:</strong> Detected as
            <code class="bg-default px-1 rounded text-xs">text</code>
          </li>
        </ul>
      </div>

      <div class="mb-3 rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Opt-out options:</strong>
        <ul class="mt-1 list-inside list-disc">
          <li>
            <code class="bg-default px-1 rounded text-xs">dataTypeInference: false</code> on grid -
            disables all inference
          </li>
          <li>
            <code class="bg-default px-1 rounded text-xs">cellDataType: false</code> on column -
            disables inference for that column
          </li>
        </ul>
      </div>

      <p class="text-sm text-muted">
        Toggle the button above to see the difference between automatic inference and disabled
        inference.
      </p>
    </template>

    <NuGrid
      :key="`grid-inference-${inferenceEnabled}`"
      v-model:column-sizing="columnSizing"
      :data-type-inference="inferenceEnabled"
      :editing="{
        enabled: true,
        startKeys: 'all',
        startClicks: 'double',
      }"
      :focus="{ mode: 'cell' }"
      :layout="{ mode: 'div', stickyHeaders: true }"
      resize-columns
      :data="data"
      :columns="columns"
      @cell-value-changed="onCellValueChanged"
    />

    <template #code>
      <DemoCodeBlock
        code="// No cellDataType needed - types are inferred automatically!
const columns = [
  { accessorKey: 'product', header: 'Product' },       // Inferred: 'text'
  { accessorKey: 'price', header: 'Price' },           // Inferred: 'currency'
  { accessorKey: 'discountRate', header: 'Rate' },     // Inferred: 'percentage'
  { accessorKey: 'inStock', header: 'In Stock' },      // Inferred: 'boolean'
  { accessorKey: 'orderDate', header: 'Date' },        // Inferred: 'date'
]

// Disable inference globally
<NuGrid :data-type-inference='false' />

// Disable inference for specific column
{ accessorKey: 'price', cellDataType: false }"
      />
    </template>

    <template #extra>
      <UAccordion :items="[{ label: 'Inference Rules', icon: 'i-lucide-brain', slot: 'rules' }]">
        <template #rules>
          <div class="p-4">
            <div class="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
              <div>
                <div class="mb-1 rounded bg-default/50 p-2 font-mono">boolean</div>
                <p class="text-muted">Values are <code>true</code> or <code>false</code></p>
              </div>
              <div>
                <div class="mb-1 rounded bg-default/50 p-2 font-mono">date</div>
                <p class="text-muted">Values are JavaScript <code>Date</code> objects</p>
              </div>
              <div>
                <div class="mb-1 rounded bg-default/50 p-2 font-mono">currency</div>
                <p class="text-muted">
                  String: <code>$123.45</code> OR Number with 2 decimals + column name contains
                  price/cost/amount/total/etc.
                </p>
              </div>
              <div>
                <div class="mb-1 rounded bg-default/50 p-2 font-mono">percentage</div>
                <p class="text-muted">
                  String: <code>45%</code> OR Number 0-1 + column name contains percent/rate/ratio
                </p>
              </div>
              <div>
                <div class="mb-1 rounded bg-default/50 p-2 font-mono">number</div>
                <p class="text-muted">Numeric values (not matching currency/percentage patterns)</p>
              </div>
              <div>
                <div class="mb-1 rounded bg-default/50 p-2 font-mono">text</div>
                <p class="text-muted">Default fallback for string values</p>
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
