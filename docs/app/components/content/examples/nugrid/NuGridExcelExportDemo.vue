<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface Employee {
  id: number
  name: string
  email: string
  department: string
  salary: number
  hireDate: string
  active: boolean
}

const toast = useToast()
const gridRef = useTemplateRef<{
  excelExport: (filenameOrOptions?: string | object, sheetName?: string) => Promise<void>
}>('grid')

const data = ref<Employee[]>([
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    department: 'Engineering',
    salary: 125000,
    hireDate: '2020-03-15',
    active: true,
  },
  {
    id: 2,
    name: 'Michael Chen',
    email: 'michael@example.com',
    department: 'Design',
    salary: 95000,
    hireDate: '2021-07-22',
    active: true,
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    email: 'emily@example.com',
    department: 'Marketing',
    salary: 88000,
    hireDate: '2019-11-08',
    active: true,
  },
  {
    id: 4,
    name: 'James Wilson',
    email: 'james@example.com',
    department: 'Sales',
    salary: 75000,
    hireDate: '2022-01-10',
    active: true,
  },
  {
    id: 5,
    name: 'Amanda Foster',
    email: 'amanda@example.com',
    department: 'Engineering',
    salary: 115000,
    hireDate: '2020-09-01',
    active: true,
  },
  {
    id: 6,
    name: 'David Kim',
    email: 'david@example.com',
    department: 'Finance',
    salary: 105000,
    hireDate: '2018-04-20',
    active: true,
  },
  {
    id: 7,
    name: 'Lisa Thompson',
    email: 'lisa@example.com',
    department: 'HR',
    salary: 82000,
    hireDate: '2021-02-14',
    active: true,
  },
  {
    id: 8,
    name: 'Robert Brown',
    email: 'robert@example.com',
    department: 'Engineering',
    salary: 135000,
    hireDate: '2017-06-12',
    active: true,
  },
])

const columns: NuGridColumn<Employee>[] = [
  { accessorKey: 'id', header: 'ID', size: 60, cellDataType: 'number', enableEditing: false },
  { accessorKey: 'name', header: 'Name', size: 150, cellDataType: 'text' },
  { accessorKey: 'email', header: 'Email', size: 200, cellDataType: 'text' },
  { accessorKey: 'department', header: 'Department', size: 120, cellDataType: 'text' },
  {
    accessorKey: 'salary',
    header: 'Salary',
    size: 100,
    cellDataType: 'currency',
    cell: ({ row }) => `$${row.original.salary.toLocaleString()}`,
  },
  {
    accessorKey: 'hireDate',
    header: 'Hire Date',
    size: 110,
    cellDataType: 'date',
    cell: ({ row }) => new Date(row.original.hireDate).toLocaleDateString(),
  },
  { accessorKey: 'active', header: 'Active', size: 80, cellDataType: 'boolean' },
]

async function handleExport() {
  await gridRef.value?.excelExport('employee-data', 'Employees')
  toast.add({
    title: 'Export Complete',
    description: 'Employee data has been exported to Excel.',
    color: 'success',
  })
}

async function handleExportVisible() {
  await gridRef.value?.excelExport({
    filename: 'employee-data-visible',
    visibleColumnsOnly: true,
  })
  toast.add({
    title: 'Export Complete',
    description: 'Visible columns exported to Excel.',
    color: 'success',
  })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <UButton icon="i-lucide-file-spreadsheet" color="primary" @click="handleExport">
        Export to Excel
      </UButton>
      <UButton
        icon="i-lucide-filter"
        color="neutral"
        variant="outline"
        @click="handleExportVisible"
      >
        Export Visible Only
      </UButton>

      <span class="text-sm text-muted"> {{ data.length }} employees </span>
    </div>

    <div class="rounded-lg border border-default p-3 bg-elevated/30 text-sm">
      <p class="font-medium mb-2">Supported Data Types:</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted">
        <div><strong>text:</strong> Name, Email</div>
        <div><strong>currency:</strong> Salary</div>
        <div><strong>date:</strong> Hire Date</div>
        <div><strong>boolean:</strong> Active</div>
      </div>
    </div>

    <NuGrid
      ref="grid"
      :data="data"
      :columns="columns"
      :editing="{ enabled: true, startClicks: 'double' }"
      :focus="{ mode: 'cell', retain: true }"
    />
  </div>
</template>
