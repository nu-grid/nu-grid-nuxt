<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

const toast = useToast()

interface Employee {
  id: number
  name: string
  department: string
  role: string
  salary: number
  performance: number
  rating: number
  startDate: string
  active: boolean
  notes: string
}

const departments = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'finance', label: 'Finance' },
]

const roles = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'manager', label: 'Manager' },
]

const data = ref<Employee[]>([
  { id: 1, name: 'Alice Chen', department: 'engineering', role: 'senior', salary: 125000, performance: 0.92, rating: 5, startDate: '2021-03-15', active: true, notes: 'Tech lead candidate' },
  { id: 2, name: 'Bob Martinez', department: 'design', role: 'mid', salary: 95000, performance: 0.85, rating: 4, startDate: '2022-06-01', active: true, notes: 'UI specialist' },
  { id: 3, name: 'Carol Kim', department: 'marketing', role: 'lead', salary: 110000, performance: 0.78, rating: 3, startDate: '2020-11-20', active: true, notes: 'Campaign manager' },
  { id: 4, name: 'David Patel', department: 'engineering', role: 'junior', salary: 75000, performance: 0.88, rating: 4, startDate: '2024-01-10', active: true, notes: 'Fast learner' },
  { id: 5, name: 'Emma Wilson', department: 'sales', role: 'manager', salary: 130000, performance: 0.95, rating: 5, startDate: '2019-08-05', active: true, notes: 'Top performer' },
  { id: 6, name: 'Frank Lopez', department: 'hr', role: 'senior', salary: 100000, performance: 0.72, rating: 3, startDate: '2021-02-28', active: false, notes: 'On leave' },
  { id: 7, name: 'Grace Tanaka', department: 'finance', role: 'mid', salary: 92000, performance: 0.81, rating: 4, startDate: '2023-04-12', active: true, notes: 'Audit specialist' },
  { id: 8, name: 'Henry Davis', department: 'engineering', role: 'lead', salary: 140000, performance: 0.91, rating: 5, startDate: '2020-06-15', active: true, notes: 'Backend architect' },
  { id: 9, name: 'Iris Nguyen', department: 'design', role: 'senior', salary: 105000, performance: 0.87, rating: 4, startDate: '2021-09-01', active: true, notes: 'Design system lead' },
  { id: 10, name: 'Jack O\'Brien', department: 'marketing', role: 'junior', salary: 65000, performance: 0.69, rating: 2, startDate: '2024-07-22', active: true, notes: 'New hire' },
])

const editingEnabled = ref(true)
const { focusMode, toggleFocusMode, focusModeIcon, focusModeLabel } = useFocusModeToggle()

const columns: NuGridColumn<Employee>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 50,
    minSize: 50,
    enableEditing: false,
    enableFocusing: false,
    cellDataType: 'number',
  },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 150,
    minSize: 120,
    cellDataType: 'text',
  },
  {
    accessorKey: 'department',
    header: 'Department',
    size: 140,
    minSize: 120,
    cellDataType: 'lookup',
    lookup: {
      items: departments,
      valueKey: 'value',
      labelKey: 'label',
      searchable: true,
      clearable: false,
      autoOpen: true,
    },
  },
  {
    accessorKey: 'role',
    header: 'Role',
    size: 120,
    minSize: 100,
    cellDataType: 'lookup',
    lookup: {
      items: roles,
      valueKey: 'value',
      labelKey: 'label',
      searchable: false,
      clearable: false,
      autoOpen: true,
    },
  },
  {
    accessorKey: 'salary',
    header: 'Salary',
    size: 110,
    minSize: 100,
    cellDataType: 'currency',
  },
  {
    accessorKey: 'performance',
    header: 'Perf %',
    size: 90,
    minSize: 80,
    cellDataType: 'percentage',
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    size: 150,
    minSize: 140,
    cellDataType: 'rating',
  },
  {
    accessorKey: 'startDate',
    header: 'Start Date',
    size: 130,
    minSize: 120,
    cellDataType: 'date',
  },
  {
    accessorKey: 'active',
    header: 'Active',
    size: 70,
    minSize: 60,
    cellDataType: 'boolean',
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
    size: 160,
    minSize: 120,
    cellDataType: 'text',
  },
]

function onCellValueChanged(event: { row: any; column: any; oldValue: any; newValue: any }) {
  const columnLabel = event.column.header || event.column.id
  toast.add({
    title: 'Cell Updated',
    description: `${columnLabel}: "${event.oldValue}" → "${event.newValue}"`,
    color: 'success',
  })
}

const exampleCode = `<NuGrid
  theme="compact"
  :data="data"
  :columns="columns"
  :editing="{ enabled: true, startClicks: 'double' }"
  :focus="{ mode: 'cell' }"
  resize-columns
/>`
</script>

<template>
  <DemoLayout
    id="compact-editing-demo"
    title="Compact Theme Editing Demo"
    info-label="About Compact Editing"
  >
    <template #status>
      <DemoStatusItem label="Theme" value="compact" />
      <DemoStatusItem label="Editing" :value="editingEnabled" boolean />
      <DemoStatusItem label="Focus" :value="focusModeLabel" />
      <DemoStatusItem label="Rows" :value="data.length" />
    </template>

    <template #controls>
      <DemoControlGroup label="Editing">
        <UButton
          :color="editingEnabled ? 'success' : 'neutral'"
          :variant="editingEnabled ? 'solid' : 'outline'"
          :icon="editingEnabled ? 'i-lucide-pencil' : 'i-lucide-pencil-off'"
          size="xs"
          block
          @click="editingEnabled = !editingEnabled"
        >
          {{ editingEnabled ? 'Editing On' : 'Editing Off' }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Focus Mode">
        <UButton
          color="neutral"
          variant="outline"
          :icon="focusModeIcon"
          size="xs"
          block
          @click="toggleFocusMode"
        >
          Focus: {{ focusModeLabel }}
        </UButton>
      </DemoControlGroup>
    </template>

    <template #info>
      <p class="mb-3 text-sm text-muted">
        Demonstrates the compact theme with all editor types. Double-click any cell to edit.
        Editors are styled to fit the compact cell sizing.
      </p>
      <ul class="list-inside list-disc space-y-1 text-sm text-muted">
        <li><strong>Text:</strong> Name, Notes</li>
        <li><strong>Lookup:</strong> Department, Role (dropdown)</li>
        <li><strong>Currency:</strong> Salary ($)</li>
        <li><strong>Percentage:</strong> Performance (%)</li>
        <li><strong>Rating:</strong> Star rating (1-5)</li>
        <li><strong>Date:</strong> Start Date</li>
        <li><strong>Boolean:</strong> Active (checkbox)</li>
      </ul>
    </template>

    <NuGrid
      theme="compact"
      :data="data"
      :columns="columns"
      :editing="{
        enabled: editingEnabled,
        startKeys: 'all',
        startClicks: 'double',
      }"
      :focus="{ mode: focusMode }"
      resize-columns
      class="max-h-[400px] rounded border border-default"
      @cell-value-changed="onCellValueChanged"
    />

    <template #code>
      <DemoCodeBlock title="Compact Theme with Editing:" :code="exampleCode" />
    </template>
  </DemoLayout>
</template>
