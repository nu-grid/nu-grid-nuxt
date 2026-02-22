<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

const toast = useToast()

interface Employee {
  id: number
  name: string
  department: string
  role: string
  salary: number
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
  { id: 1, name: 'Alice Chen', department: 'engineering', role: 'senior', salary: 125000, rating: 5, startDate: '2021-03-15', active: true, notes: 'Tech lead candidate' },
  { id: 2, name: 'Bob Martinez', department: 'design', role: 'mid', salary: 95000, rating: 4, startDate: '2022-06-01', active: true, notes: 'UI specialist' },
  { id: 3, name: 'Carol Kim', department: 'marketing', role: 'lead', salary: 110000, rating: 3, startDate: '2020-11-20', active: true, notes: 'Campaign manager' },
  { id: 4, name: 'David Patel', department: 'engineering', role: 'junior', salary: 75000, rating: 4, startDate: '2024-01-10', active: true, notes: 'Fast learner' },
  { id: 5, name: 'Emma Wilson', department: 'sales', role: 'manager', salary: 130000, rating: 5, startDate: '2019-08-05', active: true, notes: 'Top performer' },
  { id: 6, name: 'Frank Lopez', department: 'hr', role: 'senior', salary: 100000, rating: 3, startDate: '2021-02-28', active: false, notes: 'On leave' },
  { id: 7, name: 'Grace Tanaka', department: 'finance', role: 'mid', salary: 92000, rating: 4, startDate: '2023-04-12', active: true, notes: 'Audit specialist' },
  { id: 8, name: 'Henry Davis', department: 'engineering', role: 'lead', salary: 140000, rating: 5, startDate: '2020-06-15', active: true, notes: 'Backend architect' },
])

const enterBehavior = ref<'default' | 'moveDown' | 'moveCell'>('default')
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
    cellDataType: 'textarea',
  },
]

function onCellValueChanged(event: { row: any; column: any; oldValue: any; newValue: any }) {
  const columnLabel = event.column.header || event.column.id
  toast.add({
    title: 'Cell Updated',
    description: `${columnLabel}: "${event.oldValue}" \u2192 "${event.newValue}"`,
    color: 'success',
  })
}

const enterBehaviorOptions = [
  { value: 'default', label: 'Default', description: 'Save and stay on cell' },
  { value: 'moveDown', label: 'Move Down', description: 'Save and move down' },
  { value: 'moveCell', label: 'Move Cell', description: 'Save and move to next cell' },
]

const exampleCode = computed(() => `<NuGrid
  :data="data"
  :columns="columns"
  :editing="{
    enabled: true,
    startClicks: 'double',
    enterBehavior: '${enterBehavior.value}',
  }"
  :focus="{ mode: 'cell' }"
/>`)
</script>

<template>
  <DemoLayout
    id="enter-behavior-demo"
    title="Enter Key Behavior Demo"
    info-label="About Enter Behavior"
  >
    <template #status>
      <DemoStatusItem label="Enter" :value="enterBehavior" />
      <DemoStatusItem label="Focus" :value="focusModeLabel" />
      <DemoStatusItem label="Rows" :value="data.length" />
    </template>

    <template #controls>
      <DemoControlGroup label="Enter Behavior">
        <UButton
          v-for="option in enterBehaviorOptions"
          :key="option.value"
          :color="enterBehavior === option.value ? 'primary' : 'neutral'"
          :variant="enterBehavior === option.value ? 'solid' : 'outline'"
          size="xs"
          block
          @click="enterBehavior = option.value as any"
        >
          {{ option.label }}
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
        Controls what happens when Enter is pressed during editing. Double-click any cell to start editing.
      </p>
      <ul class="list-inside list-disc space-y-1 text-sm text-muted">
        <li><strong>Default:</strong> Enter saves and stays on the current cell</li>
        <li><strong>Move Down:</strong> Enter saves and moves to the cell below (Shift+Enter moves up)</li>
        <li><strong>Move Cell:</strong> Enter saves and moves to the next editable cell (Shift+Enter moves to previous)</li>
      </ul>
    </template>

    <NuGrid
      :data="data"
      :columns="columns"
      :editing="{
        enabled: true,
        startKeys: 'all',
        startClicks: 'double',
        enterBehavior: enterBehavior,
      }"
      :focus="{ mode: focusMode }"
      resize-columns
      class="max-h-[400px] rounded border border-default"
      @cell-value-changed="onCellValueChanged"
    />

    <template #code>
      <DemoCodeBlock title="Enter Behavior Configuration:" :code="exampleCode" />
    </template>
  </DemoLayout>
</template>
