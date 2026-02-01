<script setup lang="ts">
import type { NuGridColumn, NuGridTooltipOptions } from '#nu-grid/types'

const toast = useToast()
const table = useTemplateRef('table')

// Sample data with various text lengths
interface Product {
  id: number
  name: string
  shortDescription: string
  fullDescription: string
  category: string
  manufacturer: string
  sku: string
  price: number
  notes: string
}

const data = ref<Product[]>([
  {
    id: 1,
    name: 'Professional Wireless Keyboard',
    shortDescription: 'Ergonomic design with backlit keys',
    fullDescription:
      'This professional-grade wireless keyboard features an ergonomic split design, customizable RGB backlighting, programmable macro keys, and a rechargeable battery lasting up to 6 months. Perfect for both gaming and productivity.',
    category: 'Electronics',
    manufacturer: 'TechCorp Industries International Ltd.',
    sku: 'KB-PRO-WIRELESS-2024',
    price: 149.99,
    notes: 'Best seller in keyboards',
  },
  {
    id: 2,
    name: 'Ultra HD Monitor 32"',
    shortDescription: '4K resolution with HDR support',
    fullDescription:
      'Experience stunning visuals with this 32-inch 4K Ultra HD monitor featuring HDR10+ support, 144Hz refresh rate, 1ms response time, and USB-C connectivity with 90W power delivery.',
    category: 'Displays',
    manufacturer: 'ViewPro',
    sku: 'MON-32-4K-HDR',
    price: 599.99,
    notes: '',
  },
  {
    id: 3,
    name: 'Ergonomic Office Chair',
    shortDescription: 'Adjustable lumbar support',
    fullDescription:
      'Premium ergonomic office chair with adjustable lumbar support, breathable mesh back, 4D armrests, seat depth adjustment, and a weight capacity of 300 lbs. Designed for 8+ hours of comfortable sitting.',
    category: 'Furniture',
    manufacturer: 'ComfortSeating Solutions Corp.',
    sku: 'CHAIR-ERGO-PRO',
    price: 449.99,
    notes: 'High demand item, reorder weekly',
  },
  {
    id: 4,
    name: 'USB-C Hub',
    shortDescription: '10-in-1 multiport adapter',
    fullDescription:
      'Versatile 10-in-1 USB-C hub with HDMI 4K@60Hz, 3x USB-A 3.0, 2x USB-C, SD/microSD card readers, Ethernet port, and 100W power delivery pass-through.',
    category: 'Accessories',
    manufacturer: 'ConnectPro',
    sku: 'HUB-10-1',
    price: 79.99,
    notes: 'Works with Mac, PC, and iPad',
  },
  {
    id: 5,
    name: 'Noise-Cancelling Headphones',
    shortDescription: 'ANC with 40-hour battery',
    fullDescription:
      'Premium wireless headphones with active noise cancellation, transparency mode, spatial audio support, 40-hour battery life, and multipoint Bluetooth connectivity for seamless device switching.',
    category: 'Audio',
    manufacturer: 'AudioMax Premium Sound Technologies',
    sku: 'HP-ANC-PRO-X',
    price: 349.99,
    notes: 'Available in 3 colors',
  },
])

// Tooltip options
const truncatedOnly = ref(true)
const showDelay = ref(500)
const hideDelay = ref(100)
const mouseFollow = ref(false)

const tooltipOptions = computed<NuGridTooltipOptions>(() => ({
  truncatedOnly: truncatedOnly.value,
  showDelay: showDelay.value,
  hideDelay: hideDelay.value,
  mouseFollow: mouseFollow.value,
}))

const { focusMode, toggleFocusMode, focusModeIcon, focusModeLabel, focusModeStatus } =
  useFocusModeToggle()

// Columns with various tooltip configurations
const columns = computed<NuGridColumn<Product>[]>(() => [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 60,
    enableEditing: false,
  },
  {
    accessorKey: 'name',
    header: 'Product Name',
    size: 180,
  },
  {
    accessorKey: 'shortDescription',
    header: 'Short Desc',
    size: 150,
    tooltipField: 'fullDescription',
  },
  {
    accessorKey: 'category',
    header: 'Category',
    size: 100,
    tooltipHeader: true,
    tooltipHeaderValue: () => 'Product category classification',
  },
  {
    accessorKey: 'manufacturer',
    header: 'Mfr',
    size: 120,
    tooltipHeader: true,
    tooltipHeaderValue: () => 'Manufacturer / Brand Name',
  },
  {
    accessorKey: 'sku',
    header: 'SKU',
    size: 120,
    tooltipValue: (row) => `SKU: ${row.sku}\nPrice: $${row.price.toFixed(2)}`,
  },
  {
    accessorKey: 'price',
    header: 'Price',
    size: 80,
    cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
    tooltipValue: (row) =>
      `Unit Price: $${row.price.toFixed(2)}\nCategory: ${row.category}\nManufacturer: ${row.manufacturer}`,
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
    size: 150,
  },
])

const columnVisibility = ref()
const selectedRows = ref({})
const columnSizing = ref({})
const columnPinning = ref({})

function onCellValueChanged(event: { row: any; column: any; oldValue: any; newValue: any }) {
  const columnLabel = event.column.header || event.column.id
  toast.add({
    title: 'Cell Value Changed',
    description: `${columnLabel}: Updated successfully`,
    color: 'success',
  })
}

const gridTooltipCode = `<NuGrid
  :tooltip="{
    truncatedOnly: true,
    showDelay: 500,
    hideDelay: 100,
    mouseFollow: false
  }"
  :data="data"
  :columns="columns"
/>`

const columnTooltipCode = `const columns = [
  {
    accessorKey: 'shortDescription',
    header: 'Short Desc',
    tooltipField: 'fullDescription', // Show different field
  },
  {
    accessorKey: 'sku',
    header: 'SKU',
    tooltipValue: (row) => \`SKU: \${row.sku}\\nPrice: $\${row.price}\`,
  },
  {
    accessorKey: 'category',
    header: 'Category',
    tooltipHeader: true,
    tooltipHeaderValue: () => 'Product category classification',
  },
]`
</script>

<template>
  <DemoLayout id="tooltip-demo" title="Tooltip Demo" info-label="About Tooltip Options">
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem
        label="Truncated Only"
        :value="truncatedOnly ? 'Yes' : 'No'"
        :color="truncatedOnly ? 'text-success' : 'text-warning'"
      />
      <DemoStatusItem label="Show Delay" :value="`${showDelay}ms`" />
      <DemoStatusItem label="Hide Delay" :value="`${hideDelay}ms`" />
      <DemoStatusItem
        label="Mouse Follow"
        :value="mouseFollow ? 'On' : 'Off'"
        :color="mouseFollow ? 'text-success' : 'text-muted'"
      />
      <DemoStatusItem label="Focus Mode" :value="focusModeLabel" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Truncated Only">
        <UButton
          block
          :color="truncatedOnly ? 'success' : 'warning'"
          :variant="truncatedOnly ? 'solid' : 'outline'"
          icon="i-lucide-text-cursor"
          size="sm"
          @click="truncatedOnly = !truncatedOnly"
        >
          {{ truncatedOnly ? 'Truncated Only' : 'Show All' }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Mouse Follow">
        <UButton
          block
          :color="mouseFollow ? 'primary' : 'neutral'"
          :variant="mouseFollow ? 'solid' : 'outline'"
          icon="i-lucide-mouse-pointer"
          size="sm"
          @click="mouseFollow = !mouseFollow"
        >
          {{ mouseFollow ? 'On' : 'Off' }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Show Delay">
        <div class="grid grid-cols-3 gap-1">
          <UButton
            v-for="delay in [100, 500, 1000]"
            :key="delay"
            :color="showDelay === delay ? 'primary' : 'neutral'"
            :variant="showDelay === delay ? 'solid' : 'outline'"
            size="xs"
            @click="showDelay = delay"
          >
            {{ delay === 1000 ? '1s' : `${delay}ms` }}
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Hide Delay">
        <div class="grid grid-cols-3 gap-1">
          <UButton
            v-for="delay in [0, 100, 300]"
            :key="delay"
            :color="hideDelay === delay ? 'primary' : 'neutral'"
            :variant="hideDelay === delay ? 'solid' : 'outline'"
            size="xs"
            @click="hideDelay = delay"
          >
            {{ `${delay}ms` }}
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Focus Mode">
        <UButton
          block
          color="neutral"
          variant="outline"
          :icon="focusModeIcon"
          :aria-label="focusModeStatus"
          size="sm"
          @click="toggleFocusMode"
        >
          {{ focusModeLabel }}
        </UButton>
      </DemoControlGroup>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        This page demonstrates the comprehensive tooltip options for NuGrid columns and cells.
      </p>

      <div class="mb-3 rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Grid-Level Tooltip Options:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li>
            <strong>truncatedOnly:</strong> When true (default), tooltips only show for truncated
            text
          </li>
          <li>
            <strong>showDelay:</strong> Milliseconds to wait before showing tooltip (default: 500ms)
          </li>
          <li><strong>hideDelay:</strong> Milliseconds before hiding tooltip (default: 100ms)</li>
          <li><strong>mouseFollow:</strong> When true, tooltip follows the mouse cursor</li>
        </ul>
      </div>

      <div class="mb-3 rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Column-Level Tooltip Options:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li>
            <strong>tooltipField:</strong> Use a different field's value as tooltip (e.g., show
            fullDescription for shortDescription)
          </li>
          <li>
            <strong>tooltipValue:</strong> Custom function to generate tooltip content from row data
          </li>
          <li><strong>tooltipHeader:</strong> Enable tooltip on column header</li>
          <li><strong>tooltipHeaderValue:</strong> Custom function for header tooltip content</li>
        </ul>
      </div>

      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Column Configurations in This Demo:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li>
            <strong>Product Name:</strong> Default behavior - tooltip shows when text is truncated
          </li>
          <li>
            <strong>Short Desc:</strong> Uses
            <code class="rounded bg-default px-1 py-0.5 text-xs">tooltipField</code>
            to show fullDescription
          </li>
          <li>
            <strong>Category:</strong> Header has tooltip via
            <code class="rounded bg-default px-1 py-0.5 text-xs">tooltipHeaderValue</code>
          </li>
          <li><strong>Mfr (Manufacturer):</strong> Abbreviated header with full name in tooltip</li>
          <li>
            <strong>SKU:</strong> Custom
            <code class="rounded bg-default px-1 py-0.5 text-xs">tooltipValue</code>
            showing SKU + price
          </li>
          <li><strong>Price:</strong> Custom tooltip with detailed product info</li>
          <li><strong>Notes:</strong> Default truncation behavior</li>
        </ul>
      </div>
    </template>

    <!-- Grid -->
    <div class="overflow-x-auto">
      <NuGrid
        ref="table"
        v-model:column-visibility="columnVisibility"
        v-model:selected-rows="selectedRows"
        v-model:column-sizing="columnSizing"
        v-model:column-pinning="columnPinning"
        :editing="{
          enabled: true,
          startKeys: 'all',
          startClicks: 'double',
        }"
        :focus="{ mode: focusMode }"
        :layout="{ mode: 'div', stickyHeaders: true }"
        :tooltip="tooltipOptions"
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
    </div>

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Grid-Level Tooltip Options:" :code="gridTooltipCode" />
      <DemoCodeBlock title="Column-Level Tooltip Options:" :code="columnTooltipCode" class="mt-4" />
    </template>

    <!-- Extra: Test Scenarios -->
    <template #extra>
      <UAccordion
        :items="[{ label: 'Test Scenarios', icon: 'i-lucide-test-tube', slot: 'test-scenarios' }]"
      >
        <template #test-scenarios>
          <div class="space-y-2 p-4 text-sm text-muted">
            <p><strong>Try these scenarios:</strong></p>
            <ul class="list-inside list-disc space-y-1">
              <li>
                <strong>Default tooltips:</strong> Hover over "Product Name" column - tooltip only
                appears if text is truncated
              </li>
              <li>
                <strong>tooltipField:</strong> Hover over "Short Desc" column - shows the full
                description regardless of truncation
              </li>
              <li>
                <strong>tooltipHeaderValue:</strong> Hover over "Category" or "Mfr" headers to see
                custom header tooltips
              </li>
              <li>
                <strong>tooltipValue:</strong> Hover over "SKU" or "Price" cells to see custom
                formatted tooltips with multiple lines
              </li>
              <li>
                <strong>Toggle "Truncated Only" off:</strong> All cells with tooltip configuration
                will show tooltips
              </li>
              <li>
                <strong>Enable "Mouse Follow":</strong> Tooltip will follow your cursor as you move
                within a cell
              </li>
              <li>
                <strong>Adjust delays:</strong> Change show/hide delays to see how responsiveness
                changes
              </li>
              <li>
                <strong>Resize columns:</strong> Make columns narrower to trigger truncation
                tooltips
              </li>
            </ul>
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
