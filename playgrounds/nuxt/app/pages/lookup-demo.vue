<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

const toast = useToast()
const table = useTemplateRef('table')

// Sample data for demonstrating lookup cell type
interface Product {
  id: number
  name: string
  category: string
  status: string
  priority: string
  assignedTo: number | null
  tags: string[]
  region: string
  manufacturer: string
}

const data = ref<Product[]>([
  {
    id: 1,
    name: 'Wireless Keyboard',
    category: 'electronics',
    status: 'active',
    priority: 'high',
    assignedTo: 1,
    tags: ['new', 'featured'],
    region: 'us-east',
    manufacturer: 'tech-corp',
  },
  {
    id: 2,
    name: 'Office Chair',
    category: 'furniture',
    status: 'inactive',
    priority: 'medium',
    assignedTo: 2,
    tags: ['sale'],
    region: 'eu-west',
    manufacturer: 'comfort-seat',
  },
  {
    id: 3,
    name: 'USB-C Hub',
    category: 'accessories',
    status: 'draft',
    priority: 'low',
    assignedTo: null,
    tags: [],
    region: 'asia-pacific',
    manufacturer: 'connect-pro',
  },
  {
    id: 4,
    name: 'Monitor 32"',
    category: 'electronics',
    status: 'active',
    priority: 'high',
    assignedTo: 3,
    tags: ['bestseller'],
    region: 'us-west',
    manufacturer: 'view-pro',
  },
  {
    id: 5,
    name: 'Desk Lamp',
    category: 'furniture',
    status: 'active',
    priority: 'low',
    assignedTo: 1,
    tags: ['eco-friendly'],
    region: 'eu-north',
    manufacturer: 'light-systems',
  },
])

// Static items - simple string arrays
const categoryItems = [
  { value: 'electronics', label: 'Electronics', icon: 'i-lucide-cpu' },
  { value: 'furniture', label: 'Furniture', icon: 'i-lucide-armchair' },
  { value: 'accessories', label: 'Accessories', icon: 'i-lucide-plug' },
  { value: 'office', label: 'Office Supplies', icon: 'i-lucide-briefcase' },
]

// Items with descriptions
const statusItems = [
  {
    value: 'active',
    label: 'Active',
    description: 'Product is live and available',
    icon: 'i-lucide-check-circle',
  },
  {
    value: 'inactive',
    label: 'Inactive',
    description: 'Product is temporarily unavailable',
    icon: 'i-lucide-pause-circle',
  },
  {
    value: 'draft',
    label: 'Draft',
    description: 'Product is still being prepared',
    icon: 'i-lucide-file-edit',
  },
  {
    value: 'archived',
    label: 'Archived',
    description: 'Product is no longer available',
    icon: 'i-lucide-archive',
  },
]

// Simple priority items
const priorityItems = [
  { value: 'low', label: 'Low Priority', icon: 'i-lucide-arrow-down' },
  { value: 'medium', label: 'Medium Priority', icon: 'i-lucide-minus' },
  { value: 'high', label: 'High Priority', icon: 'i-lucide-arrow-up' },
  { value: 'urgent', label: 'Urgent', icon: 'i-lucide-alert-triangle' },
]

// Reactive items that can change
const assigneeItems = ref([
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', department: 'Engineering' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', department: 'Design' },
  { id: 3, name: 'Carol White', email: 'carol@example.com', department: 'Marketing' },
  { id: 4, name: 'David Brown', email: 'david@example.com', department: 'Sales' },
])

// Async items - simulates API call
async function loadRegions(): Promise<any[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  return [
    { code: 'us-east', name: 'US East', country: 'United States' },
    { code: 'us-west', name: 'US West', country: 'United States' },
    { code: 'eu-west', name: 'EU West', country: 'Europe' },
    { code: 'eu-north', name: 'EU North', country: 'Europe' },
    { code: 'asia-pacific', name: 'Asia Pacific', country: 'Asia' },
  ]
}

// Custom value/label keys example
const manufacturerItems = [
  { mfgId: 'tech-corp', companyName: 'TechCorp Industries', country: 'USA' },
  { mfgId: 'view-pro', companyName: 'ViewPro Display Systems', country: 'Japan' },
  { mfgId: 'comfort-seat', companyName: 'ComfortSeating Solutions', country: 'Germany' },
  { mfgId: 'connect-pro', companyName: 'ConnectPro Tech', country: 'Taiwan' },
  { mfgId: 'light-systems', companyName: 'Light Systems International', country: 'Sweden' },
]

const { focusMode, toggleFocusMode, focusModeIcon, focusModeLabel, focusModeStatus } =
  useFocusModeToggle()

// Column definitions showcasing different lookup configurations
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
    accessorKey: 'category',
    header: 'Category',
    size: 150,
    cellDataType: 'lookup',
    lookup: {
      items: categoryItems,
      valueKey: 'value',
      labelKey: 'label',
      searchable: true,
      placeholder: 'Select category...',
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 150,
    cellDataType: 'lookup',
    lookup: {
      items: statusItems,
      valueKey: 'value',
      labelKey: 'label',
      descriptionKey: 'description',
      searchable: true,
      filterFields: ['label', 'description'],
      placeholder: 'Choose status...',
    },
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    size: 150,
    cellDataType: 'lookup',
    lookup: {
      items: priorityItems,
      searchable: false,
      clearable: false,
      autoOpen: false,
    },
  },
  {
    accessorKey: 'assignedTo',
    header: 'Assigned To',
    size: 180,
    cellDataType: 'lookup',
    lookup: {
      items: assigneeItems,
      valueKey: 'id',
      labelKey: 'name',
      descriptionKey: 'department',
      searchable: true,
      filterFields: ['name', 'email', 'department'],
      placeholder: 'Select assignee...',
      clearable: true,
    },
  },
  {
    accessorKey: 'region',
    header: 'Region',
    size: 150,
    cellDataType: 'lookup',
    lookup: {
      items: loadRegions,
      valueKey: 'code',
      labelKey: 'name',
      descriptionKey: 'country',
      searchable: true,
      placeholder: 'Loading regions...',
    },
  },
  {
    accessorKey: 'manufacturer',
    header: 'Manufacturer',
    size: 200,
    cellDataType: 'lookup',
    lookup: {
      items: manufacturerItems,
      valueKey: 'mfgId',
      labelKey: 'companyName',
      descriptionKey: 'country',
      searchable: true,
      filterFields: ['companyName', 'country'],
      placeholder: 'Select manufacturer...',
    },
  },
])

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

// Function to add a new assignee to demonstrate reactive items
function addAssignee() {
  const newId = Math.max(...assigneeItems.value.map((a) => a.id)) + 1
  const departments = ['Engineering', 'Design', 'Marketing', 'Sales', 'Support']
  const names = ['Emma Wilson', 'Frank Miller', 'Grace Lee', 'Henry Davis', 'Ivy Chen']
  const randomName = names[Math.floor(Math.random() * names.length)]!
  const randomDept = departments[Math.floor(Math.random() * departments.length)]!

  assigneeItems.value.push({
    id: newId,
    name: randomName,
    email: `${randomName.toLowerCase().replace(' ', '.')}@example.com`,
    department: randomDept,
  })

  toast.add({
    title: 'Assignee Added',
    description: `${randomName} has been added to the list`,
    color: 'success',
  })
}

const basicLookupCode = `{
  accessorKey: 'category',
  header: 'Category',
  cellDataType: 'lookup',
  lookup: {
    items: [
      { value: 'electronics', label: 'Electronics' },
      { value: 'furniture', label: 'Furniture' },
    ],
    valueKey: 'value',
    labelKey: 'label',
    searchable: true,
    placeholder: 'Select category...',
  },
}`

const asyncLookupCode = `{
  accessorKey: 'region',
  header: 'Region',
  cellDataType: 'lookup',
  lookup: {
    items: async () => {
      const response = await fetch('/api/regions')
      return response.json()
    },
    valueKey: 'code',
    labelKey: 'name',
    descriptionKey: 'country',
    searchable: true,
  },
}`
</script>

<template>
  <DemoLayout id="lookup-demo" title="Lookup Cell Type Demo" info-label="About Lookup Cell Type">
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Products" :value="data.length" />
      <DemoStatusItem label="Assignees" :value="assigneeItems.length" />
      <DemoStatusItem label="Focus Mode" :value="focusModeLabel" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Reactive Items">
        <UButton
          block
          color="primary"
          variant="outline"
          icon="i-lucide-user-plus"
          size="sm"
          @click="addAssignee"
        >
          Add Random Assignee
        </UButton>
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

      <DemoControlGroup label="Demo Features">
        <div class="space-y-1 text-xs text-muted">
          <div>Static Items</div>
          <div>Reactive Items</div>
          <div>Async Loading</div>
          <div>Descriptions</div>
          <div>Multi-field Search</div>
          <div>Clearable</div>
        </div>
      </DemoControlGroup>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        The lookup cell type provides a dropdown selection interface using Nuxt UI's SelectMenu
        component. It supports static arrays, reactive refs, and async data sources.
      </p>

      <div class="mb-3 rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Basic Configuration:</strong>
        <pre class="mt-2 overflow-x-auto rounded bg-default p-2 text-xs"><code>{
  cellDataType: 'lookup',
  lookup: {
    items: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ],
    valueKey: 'value',
    labelKey: 'label',
    searchable: true
  }
}</code></pre>
      </div>

      <div class="mb-3 rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Lookup Options:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li><strong>items:</strong> Array, Ref, or async function that returns items</li>
          <li><strong>valueKey:</strong> Field for stored value (default: 'value')</li>
          <li><strong>labelKey:</strong> Field for display label (default: 'label')</li>
          <li><strong>descriptionKey:</strong> Optional field shown below label in dropdown</li>
          <li><strong>searchable:</strong> Enable search/filter input (default: true)</li>
          <li><strong>filterFields:</strong> Fields to search (defaults to [labelKey])</li>
          <li><strong>placeholder:</strong> Placeholder text (default: 'Select...')</li>
          <li><strong>clearable:</strong> Show clear button to reset (default: false)</li>
        </ul>
      </div>

      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Column Configurations in This Demo:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li><strong>Category:</strong> Static items with icons, searchable</li>
          <li><strong>Status:</strong> Items with descriptions, multi-field search</li>
          <li><strong>Priority:</strong> Non-searchable simple list</li>
          <li><strong>Assigned To:</strong> Reactive ref items, clearable, multi-field search</li>
          <li><strong>Region:</strong> Async function (simulates API call with loading state)</li>
          <li><strong>Manufacturer:</strong> Custom valueKey/labelKey fields</li>
        </ul>
      </div>
    </template>

    <!-- Grid -->
    <div class="overflow-x-auto">
      <NuGrid
        ref="table"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:column-sizing="columnSizing"
        v-model:column-pinning="columnPinning"
        :editing="{
          enabled: true,
          startKeys: 'all',
          startClicks: 'double',
        }"
        :focus="{ mode: focusMode }"
        :layout="{ mode: 'div', stickyHeaders: true }"
        :tooltip="{
          truncatedOnly: true,
          showDelay: 500,
        }"
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
      <DemoCodeBlock title="Basic Lookup Column:" :code="basicLookupCode" />
      <DemoCodeBlock title="Async Items (API Call):" :code="asyncLookupCode" class="mt-4" />
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
                <strong>Basic lookup:</strong> Double-click or press Enter on Category cell to open
                dropdown
              </li>
              <li>
                <strong>With descriptions:</strong> Open Status dropdown to see descriptions below
                labels
              </li>
              <li>
                <strong>Non-searchable:</strong> Priority dropdown has no search input (simple list)
              </li>
              <li><strong>Clearable:</strong> Select an assignee, then click the X to clear it</li>
              <li>
                <strong>Reactive items:</strong> Click "Add Random Assignee" - new option appears in
                Assigned To dropdown
              </li>
              <li>
                <strong>Async loading:</strong> Region dropdown shows loading state when first
                opened
              </li>
              <li>
                <strong>Multi-field search:</strong> In Assigned To, type a department name or email
                to filter
              </li>
              <li>
                <strong>Custom keys:</strong> Manufacturer uses custom field names (mfgId,
                companyName)
              </li>
              <li>
                <strong>Keyboard navigation:</strong>
                <ul class="list-circle mt-1 ml-4 list-inside space-y-0.5">
                  <li>
                    Space opens dropdown when closed, selects item when open (stays in edit mode)
                  </li>
                  <li>Enter selects item and exits edit mode</li>
                  <li>Escape twice: first closes dropdown, second cancels editing</li>
                  <li>Arrow keys open dropdown and navigate items</li>
                  <li>Tab/Shift+Tab navigate to next/previous cell</li>
                </ul>
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
