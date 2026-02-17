<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface Employee {
  id: number
  name: string
  email: string
  department: string
  salary: number
  hireDate: string
  notes: string
}

const data = ref<Employee[]>([
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    department: 'Engineering',
    salary: 125000,
    hireDate: '2020-03-15',
    notes: 'Senior engineer with expertise in distributed systems.',
  },
  {
    id: 2,
    name: 'Michael Chen',
    email: 'michael@example.com',
    department: 'Design',
    salary: 95000,
    hireDate: '2021-07-22',
    notes: 'Creative lead for mobile app redesign.',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    email: 'emily@example.com',
    department: 'Marketing',
    salary: 88000,
    hireDate: '2019-11-08',
    notes: 'Manages content strategy and social media presence.',
  },
  {
    id: 4,
    name: 'James Wilson',
    email: 'james@example.com',
    department: 'Sales',
    salary: 75000,
    hireDate: '2022-01-10',
    notes: 'Top performer in enterprise sales.',
  },
])

const multiRowEnabled = ref(true)

const columns = computed<NuGridColumn<Employee>[]>(() => [
  // Row 0 - Identity
  { accessorKey: 'id', header: 'ID', size: 50, row: 0, enableEditing: false },
  { accessorKey: 'name', header: 'Name', size: 140, row: 0 },
  { accessorKey: 'email', header: 'Email', size: 180, row: 0 },
  { accessorKey: 'department', header: 'Dept', size: 100, row: 0 },

  // Row 1 - Compensation (or row 0 if multi-row disabled)
  {
    accessorKey: 'salary',
    header: 'Salary',
    size: 100,
    row: multiRowEnabled.value ? 1 : 0,
    cell: ({ row }) => `$${row.original.salary.toLocaleString()}`,
  },
  {
    accessorKey: 'hireDate',
    header: 'Hire Date',
    size: 100,
    row: multiRowEnabled.value ? 1 : 0,
    cell: ({ row }) => new Date(row.original.hireDate).toLocaleDateString(),
  },

  // Row 2 - Notes (spans full width in multi-row mode)
  {
    accessorKey: 'notes',
    header: 'Notes',
    size: multiRowEnabled.value ? 350 : 200,
    row: multiRowEnabled.value ? 2 : 0,
    span: multiRowEnabled.value ? '*' : undefined,
    wrapText: multiRowEnabled.value,
  },
])

const multiRowOptions = computed(() =>
  multiRowEnabled.value ? { enabled: true, rowCount: 3, alignColumns: true } : false,
)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <UButton
        :color="multiRowEnabled ? 'primary' : 'neutral'"
        :variant="multiRowEnabled ? 'solid' : 'outline'"
        size="sm"
        @click="multiRowEnabled = !multiRowEnabled"
      >
        Multi-Row {{ multiRowEnabled ? 'On' : 'Off' }}
      </UButton>

      <span class="text-sm text-muted">
        {{ multiRowEnabled ? '3 visual rows per data row' : 'Standard single-row layout' }}
      </span>
    </div>

    <div class="rounded-lg border border-default p-3 bg-elevated/30 text-sm">
      <p class="font-medium mb-2">Row Layout:</p>
      <div v-if="multiRowEnabled" class="text-xs text-muted space-y-1">
        <p><strong>Row 0:</strong> ID, Name, Email, Department</p>
        <p><strong>Row 1:</strong> Salary, Hire Date</p>
        <p><strong>Row 2:</strong> Notes (spans full width)</p>
      </div>
      <p v-else class="text-xs text-muted">All columns on a single row</p>
    </div>

    <NuGrid
      :data="data"
      :columns="columns"
      :multi-row="multiRowOptions"
      :editing="{ enabled: true, startClicks: 'double' }"
      :focus="{ mode: 'cell' }"
    />
  </div>
</template>
