<script setup lang="ts">
import type { NuGridColumn, NuGridRow, NuGridRowSelectOptions } from '#nu-grid/types'

interface Employee {
  id: number
  name: string
  email: string
  department: string
  status: 'active' | 'inactive' | 'pending'
}

const gridRef = useTemplateRef<{ getSelectedRows: <T>() => T[] }>('grid')

const data = ref<Employee[]>([
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    department: 'Engineering',
    status: 'active',
  },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', department: 'Marketing', status: 'active' },
  {
    id: 3,
    name: 'Carol White',
    email: 'carol@example.com',
    department: 'Engineering',
    status: 'pending',
  },
  { id: 4, name: 'David Brown', email: 'david@example.com', department: 'HR', status: 'active' },
  {
    id: 5,
    name: 'Emma Davis',
    email: 'emma@example.com',
    department: 'Engineering',
    status: 'active',
  },
  {
    id: 6,
    name: 'Frank Miller',
    email: 'frank@example.com',
    department: 'Sales',
    status: 'inactive',
  },
  {
    id: 7,
    name: 'Grace Wilson',
    email: 'grace@example.com',
    department: 'Finance',
    status: 'active',
  },
  {
    id: 8,
    name: 'Henry Taylor',
    email: 'henry@example.com',
    department: 'Engineering',
    status: 'active',
  },
])

const columns: NuGridColumn<Employee>[] = [
  { accessorKey: 'id', header: 'ID', size: 60 },
  { accessorKey: 'name', header: 'Name', size: 150 },
  { accessorKey: 'email', header: 'Email', size: 200 },
  { accessorKey: 'department', header: 'Department', size: 120 },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 100,
    cell: ({ row }) => {
      const colors: Record<string, string> = {
        active: 'text-success',
        inactive: 'text-error',
        pending: 'text-warning',
      }
      return h('span', { class: `capitalize ${colors[row.original.status]}` }, row.original.status)
    },
  },
]

const selectionMode = ref<'none' | 'single' | 'multi'>('multi')
const disableInactive = ref(true)
const selectedRows = ref({})

function canSelectRow(row: NuGridRow<Employee>): boolean {
  if (!disableInactive.value) return true
  return row.original.status !== 'inactive'
}

const selectionOptions = computed<false | NuGridRowSelectOptions<Employee>>(() => {
  if (selectionMode.value === 'none') return false
  return {
    mode: selectionMode.value,
    rowSelectionEnabled: canSelectRow,
  }
})

const selectedRows = computed(() => gridRef.value?.getSelectedRows<Employee>() ?? [])

function clearSelection() {
  selectedRows.value = {}
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <span class="text-sm font-medium">Mode:</span>
      <UFieldGroup>
        <UButton
          :color="selectionMode === 'none' ? 'primary' : 'neutral'"
          :variant="selectionMode === 'none' ? 'solid' : 'outline'"
          size="sm"
          @click="selectionMode = 'none'"
        >
          None
        </UButton>
        <UButton
          :color="selectionMode === 'single' ? 'primary' : 'neutral'"
          :variant="selectionMode === 'single' ? 'solid' : 'outline'"
          size="sm"
          @click="selectionMode = 'single'"
        >
          Single
        </UButton>
        <UButton
          :color="selectionMode === 'multi' ? 'primary' : 'neutral'"
          :variant="selectionMode === 'multi' ? 'solid' : 'outline'"
          size="sm"
          @click="selectionMode = 'multi'"
        >
          Multi
        </UButton>
      </UFieldGroup>

      <UButton
        :color="disableInactive ? 'warning' : 'neutral'"
        :variant="disableInactive ? 'solid' : 'outline'"
        size="sm"
        @click="disableInactive = !disableInactive"
      >
        {{ disableInactive ? 'Inactive Disabled' : 'All Selectable' }}
      </UButton>

      <UButton
        v-if="selectedRows.length > 0"
        color="error"
        variant="subtle"
        size="sm"
        @click="clearSelection"
      >
        Clear ({{ selectedRows.length }})
      </UButton>
    </div>

    <NuGrid
      ref="grid"
      v-model:selected-rows="selectedRows"
      :data="data"
      :columns="columns"
      :row-selection="selectionOptions"
      :focus="{ mode: 'cell', retain: true }"
    />

    <div v-if="selectedRows.length > 0" class="rounded-lg border border-default p-3 bg-elevated/30">
      <p class="text-sm font-medium mb-2">Selected Employees:</p>
      <ul class="text-sm text-muted space-y-1">
        <li v-for="emp in selectedRows" :key="emp.id">{{ emp.name }} ({{ emp.department }})</li>
      </ul>
    </div>

    <div v-else class="rounded-lg border border-dashed border-default p-6 text-center text-muted">
      <p class="text-sm">No rows selected. Click checkboxes to select rows.</p>
      <p class="text-xs mt-1">
        Note: Frank Miller (inactive) cannot be selected when "Inactive Disabled" is on.
      </p>
    </div>
  </div>
</template>
