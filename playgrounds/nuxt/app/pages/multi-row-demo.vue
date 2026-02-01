<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

const toast = useToast()
const table = useTemplateRef('table')

// Sample data for multi-row demonstration
interface Contact {
  id: number
  name: string
  email: string
  phone: string
  company: string
  role: string
  bio: string
  location: string
  website: string
}

const data = ref<Contact[]>([
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@techcorp.com',
    phone: '+1 (555) 123-4567',
    company: 'TechCorp Industries',
    role: 'Senior Software Engineer',
    bio: 'Passionate about building scalable web applications and mentoring junior developers.',
    location: 'San Francisco, CA',
    website: 'https://sarahjohnson.dev',
  },
  {
    id: 2,
    name: 'Michael Chen',
    email: 'michael.chen@dataflow.io',
    phone: '+1 (555) 234-5678',
    company: 'DataFlow Solutions',
    role: 'Data Architect',
    bio: 'Specializes in data pipeline design and real-time analytics systems.',
    location: 'Seattle, WA',
    website: 'https://mchen.tech',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@creative.agency',
    phone: '+1 (555) 345-6789',
    company: 'Creative Agency',
    role: 'UX Design Lead',
    bio: 'Creating user-centered designs that balance aesthetics with functionality.',
    location: 'Austin, TX',
    website: 'https://emilydesigns.co',
  },
  {
    id: 4,
    name: 'James Wilson',
    email: 'james.wilson@cloudops.net',
    phone: '+1 (555) 456-7890',
    company: 'CloudOps Networks',
    role: 'DevOps Engineer',
    bio: 'Automating infrastructure and improving deployment pipelines.',
    location: 'Denver, CO',
    website: 'https://jwilson.cloud',
  },
  {
    id: 5,
    name: 'Lisa Thompson',
    email: 'lisa.thompson@fintech.co',
    phone: '+1 (555) 567-8901',
    company: 'FinTech Innovations',
    role: 'Product Manager',
    bio: 'Driving product strategy for financial technology solutions.',
    location: 'New York, NY',
    website: 'https://lisathompson.biz',
  },
])

const editingEnabled = ref(true)
const multiRowEnabled = ref(true)
const rowCount = ref(3)
const alignColumns = ref(true)

const { focusMode, toggleFocusMode, focusModeIcon, focusModeLabel, focusModeStatus } =
  useFocusModeToggle()

// Define columns with row assignments for multi-row layout
const columns = computed<NuGridColumn<Contact>[]>(() => [
  {
    accessorKey: 'id',
    header: 'ID',
    minSize: 50,
    size: 60,
    enableEditing: false,
    enableFocusing: false,
    cellDataType: 'number',
    row: 0,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    minSize: 120,
    size: 150,
    cellDataType: 'text',
    row: 0,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    minSize: 150,
    size: 200,
    cellDataType: 'text',
    row: 0,
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    minSize: 120,
    size: 140,
    cellDataType: 'text',
    row: 0,
  },
  {
    accessorKey: 'company',
    header: 'Company',
    minSize: 120,
    size: 160,
    cellDataType: 'text',
    row: 1,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    minSize: 120,
    size: 160,
    cellDataType: 'text',
    row: 1,
  },
  {
    accessorKey: 'location',
    header: 'Location',
    minSize: 100,
    size: 140,
    cellDataType: 'text',
    row: 1,
  },
  {
    accessorKey: 'bio',
    header: 'Bio',
    minSize: 200,
    size: 300,
    cellDataType: 'textarea',
    wrapText: true,
    row: 2,
    span: '*',
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

function incrementRowCount() {
  if (rowCount.value < 4) rowCount.value++
}

function decrementRowCount() {
  if (rowCount.value > 1) rowCount.value--
}

const exampleCode = `<NuGrid
  :multiRow="{ enabled: true, rowCount: 2 }"
  :columns="[
    { accessorKey: 'name', header: 'Name', row: 0 },
    { accessorKey: 'email', header: 'Email', row: 0 },
    { accessorKey: 'company', header: 'Company', row: 1 },
    { accessorKey: 'bio', header: 'Bio', row: 1, span: '*' }
  ]"
  :data="data"
/>`
</script>

<template>
  <DemoLayout id="multi-row-demo" title="Multi-Row Layout Demo" info-label="About Multi-Row Layout">
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem
        label="Multi-Row"
        :value="multiRowEnabled ? 'Enabled' : 'Disabled'"
        :color="multiRowEnabled ? 'text-success' : 'text-muted'"
      />
      <DemoStatusItem label="Row Count" :value="rowCount" />
      <DemoStatusItem
        label="Align Columns"
        :value="alignColumns ? 'On' : 'Off'"
        :color="alignColumns ? 'text-success' : 'text-muted'"
      />
      <DemoStatusItem
        label="Editing"
        :value="editingEnabled ? 'Enabled' : 'Disabled'"
        :color="editingEnabled ? 'text-success' : 'text-error'"
      />
      <DemoStatusItem label="Focus Mode" :value="focusModeLabel" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Multi-Row">
        <UButton
          block
          :color="multiRowEnabled ? 'success' : 'neutral'"
          :variant="multiRowEnabled ? 'solid' : 'outline'"
          icon="i-lucide-rows-3"
          size="sm"
          @click="multiRowEnabled = !multiRowEnabled"
        >
          {{ multiRowEnabled ? 'Enabled' : 'Disabled' }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Row Count">
        <div class="flex items-center gap-1">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-minus"
            size="sm"
            :disabled="rowCount <= 1"
            @click="decrementRowCount"
          />
          <span class="flex-1 text-center text-sm font-medium">{{ rowCount }}</span>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-plus"
            size="sm"
            :disabled="rowCount >= 4"
            @click="incrementRowCount"
          />
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Align Columns">
        <UButton
          block
          :color="alignColumns ? 'success' : 'neutral'"
          :variant="alignColumns ? 'solid' : 'outline'"
          icon="i-lucide-align-horizontal-justify-center"
          :disabled="!multiRowEnabled"
          size="sm"
          @click="alignColumns = !alignColumns"
        >
          {{ alignColumns ? 'Enabled' : 'Disabled' }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Editing">
        <UButton
          block
          :color="editingEnabled ? 'success' : 'neutral'"
          :variant="editingEnabled ? 'solid' : 'outline'"
          :icon="editingEnabled ? 'i-lucide-pencil' : 'i-lucide-pencil-off'"
          size="sm"
          @click="editingEnabled = !editingEnabled"
        >
          {{ editingEnabled ? 'Enabled' : 'Disabled' }}
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

      <DemoControlGroup label="Column Pinning">
        <NuGridColumnPinningControl :grid-ref="table" />
      </DemoControlGroup>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        This page demonstrates the
        <code class="rounded bg-default px-1 py-0.5 text-xs">multiRow</code>
        feature for NuGrid. A single data item can span multiple visual rows, with columns assigned
        to specific rows.
      </p>
      <div class="mb-3 rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Multi-Row Configuration:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li>
            <strong>Grid-level:</strong> Set
            <code class="rounded bg-default px-1 py-0.5 text-xs"
              >multiRow: { enabled: true, rowCount: 2 }</code
            >
          </li>
          <li>
            <strong>Column-level:</strong> Set
            <code class="rounded bg-default px-1 py-0.5 text-xs">row: 0</code> or
            <code class="rounded bg-default px-1 py-0.5 text-xs">row: 1</code> on columns
          </li>
          <li>Columns without a <code>row</code> property default to row 0</li>
        </ul>
      </div>
      <div class="mb-3 rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Demo Layout:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li><strong>Row 0:</strong> ID, Name, Email, Phone (primary info)</li>
          <li><strong>Row 1:</strong> Company, Role, Location (details)</li>
          <li><strong>Row 2:</strong> Bio (spans all columns)</li>
        </ul>
      </div>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Keyboard Navigation:</strong>
        <ul class="mt-1 list-inside list-disc">
          <li><strong>Arrow keys:</strong> Navigate between cells within visual rows</li>
          <li>Cells can be edited regardless of their visual row</li>
          <li>Sticky headers stay visible while scrolling</li>
        </ul>
      </div>
    </template>

    <!-- Grid -->
    <NuGrid
      ref="table"
      v-model:column-visibility="columnVisibility"
      v-model:selected-rows="selectedRows"
      v-model:column-sizing="columnSizing"
      v-model:column-pinning="columnPinning"
      :multi-row="{ enabled: multiRowEnabled, rowCount, alignColumns }"
      :editing="{
        enabled: editingEnabled,
        startKeys: 'all',
        startClicks: 'double',
      }"
      :focus="{ mode: focusMode }"
      :layout="{ mode: 'div', stickyHeaders: true }"
      resize-columns
      reorder-columns
      :data="data"
      :columns="columns"
      :ui="{
        root: 'max-h-[600px]',
        base: 'w-max min-w-full border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default',
        separator: 'h-0',
      }"
      @cell-value-changed="onCellValueChanged"
    />

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Grid Configuration:" :code="exampleCode" />
    </template>
  </DemoLayout>
</template>

<style scoped>
code {
  font-family: 'Monaco', 'Courier New', monospace;
}
</style>
