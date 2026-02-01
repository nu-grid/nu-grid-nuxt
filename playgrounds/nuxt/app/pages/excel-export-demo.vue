<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

// Sample data with different data types for export demonstration
interface Employee {
  id: number
  name: string
  email: string
  department: string
  salary: number
  bonus: number
  hireDate: string
  lastReview: string
  active: boolean
  notes: string
}

const toast = useToast()
const table = useTemplateRef<{
  excelExport: (filenameOrOptions?: string | object, sheetName?: string) => Promise<void>
  tableApi: any
}>('table')

const data = ref<Employee[]>([
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    department: 'Engineering',
    salary: 125000,
    bonus: 15000,
    hireDate: '2020-03-15',
    lastReview: '2024-11-01',
    active: true,
    notes:
      'Senior engineer with expertise in distributed systems. Leads the infrastructure team and mentors junior developers.',
  },
  {
    id: 2,
    name: 'Michael Chen',
    email: 'michael.chen@company.com',
    department: 'Design',
    salary: 95000,
    bonus: 8000,
    hireDate: '2021-07-22',
    lastReview: '2024-10-15',
    active: true,
    notes:
      'Creative lead for the mobile app redesign. Specializes in user experience and accessibility standards.',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@company.com',
    department: 'Marketing',
    salary: 88000,
    bonus: 12000,
    hireDate: '2019-11-08',
    lastReview: '2024-09-20',
    active: true,
    notes:
      'Manages the content strategy and social media presence. Has driven 40% increase in organic reach.',
  },
  {
    id: 4,
    name: 'James Wilson',
    email: 'james.wilson@company.com',
    department: 'Sales',
    salary: 75000,
    bonus: 25000,
    hireDate: '2022-01-10',
    lastReview: '2024-11-10',
    active: true,
    notes:
      'Top performer in enterprise sales. Closed three major deals in Q4 totaling $2.5M in revenue.',
  },
  {
    id: 5,
    name: 'Amanda Foster',
    email: 'amanda.foster@company.com',
    department: 'Engineering',
    salary: 115000,
    bonus: 10000,
    hireDate: '2020-09-01',
    lastReview: '2024-08-25',
    active: true,
    notes:
      'Backend specialist focusing on API development and database optimization. Key contributor to the new microservices architecture.',
  },
  {
    id: 6,
    name: 'David Kim',
    email: 'david.kim@company.com',
    department: 'Finance',
    salary: 105000,
    bonus: 9500,
    hireDate: '2018-04-20',
    lastReview: '2024-10-05',
    active: true,
    notes:
      'Financial analyst responsible for quarterly reporting and budget forecasting. Implemented new cost tracking system.',
  },
  {
    id: 7,
    name: 'Lisa Thompson',
    email: 'lisa.thompson@company.com',
    department: 'HR',
    salary: 82000,
    bonus: 6000,
    hireDate: '2021-02-14',
    lastReview: '2024-09-15',
    active: true,
    notes:
      'Leads recruitment efforts and employee engagement initiatives. Reduced time-to-hire by 25%.',
  },
  {
    id: 8,
    name: 'Robert Brown',
    email: 'robert.brown@company.com',
    department: 'Engineering',
    salary: 135000,
    bonus: 18000,
    hireDate: '2017-06-12',
    lastReview: '2024-11-05',
    active: true,
    notes:
      'Principal architect with 15+ years experience. Designed the core platform architecture and leads technical strategy.',
  },
  {
    id: 9,
    name: 'Jennifer Lee',
    email: 'jennifer.lee@company.com',
    department: 'Product',
    salary: 110000,
    bonus: 11000,
    hireDate: '2019-08-30',
    lastReview: '2024-10-20',
    active: false,
    notes:
      'Product manager for the enterprise suite. Currently on extended leave for personal reasons.',
  },
  {
    id: 10,
    name: 'Christopher Martinez',
    email: 'chris.martinez@company.com',
    department: 'Support',
    salary: 65000,
    bonus: 4000,
    hireDate: '2023-03-01',
    lastReview: '2024-09-01',
    active: true,
    notes:
      'Customer success specialist with excellent feedback ratings. Handles tier 2 technical support escalations.',
  },
])

const editingEnabled = ref(true)
const multiRowEnabled = ref(false)

const { focusMode, toggleFocusMode, focusModeIcon, focusModeLabel, focusModeStatus } =
  useFocusModeToggle()

// Define columns with various data types
const columns = computed<NuGridColumn<Employee>[]>(() => {
  const baseColumns: NuGridColumn<Employee>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      minSize: 60,
      size: 70,
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
      minSize: 180,
      size: 220,
      cellDataType: 'text',
      row: 0,
    },
    {
      accessorKey: 'department',
      header: 'Department',
      minSize: 100,
      size: 120,
      cellDataType: 'text',
      row: 0,
    },
    {
      accessorKey: 'salary',
      header: 'Salary',
      minSize: 100,
      size: 110,
      cellDataType: 'currency',
      cell: ({ row }) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(row.original.salary)
      },
      row: multiRowEnabled.value ? 1 : 0,
    },
    {
      accessorKey: 'bonus',
      header: 'Bonus',
      minSize: 90,
      size: 100,
      cellDataType: 'currency',
      cell: ({ row }) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(row.original.bonus)
      },
      row: multiRowEnabled.value ? 1 : 0,
    },
    {
      accessorKey: 'hireDate',
      header: 'Hire Date',
      minSize: 110,
      size: 120,
      cellDataType: 'date',
      cell: ({ row }) => {
        const date = new Date(row.original.hireDate)
        return date.toLocaleDateString()
      },
      row: multiRowEnabled.value ? 1 : 0,
    },
    {
      accessorKey: 'lastReview',
      header: 'Last Review',
      minSize: 110,
      size: 120,
      cellDataType: 'date',
      cell: ({ row }) => {
        const date = new Date(row.original.lastReview)
        return date.toLocaleDateString()
      },
      row: multiRowEnabled.value ? 1 : 0,
    },
    {
      accessorKey: 'active',
      header: 'Active',
      minSize: 80,
      size: 90,
      cellDataType: 'boolean',
      row: multiRowEnabled.value ? 1 : 0,
    },
  ]

  // Add notes column for multi-row or regular view
  if (multiRowEnabled.value) {
    baseColumns.push({
      accessorKey: 'notes',
      header: 'Notes',
      minSize: 200,
      size: 400,
      cellDataType: 'textarea',
      wrapText: true,
      row: 2,
      span: '*',
    })
  } else {
    baseColumns.push({
      accessorKey: 'notes',
      header: 'Notes',
      minSize: 200,
      size: 300,
      cellDataType: 'text',
      wrapText: false,
      row: 0,
    })
  }

  return baseColumns
})

const columnVisibility = ref()
const selectedRows = ref({})
const columnSizing = ref({})
const columnPinning = ref({})

// Check if table is ready for export
const canExport = computed(() => !!table.value)

async function handleExport() {
  await table.value?.excelExport('employee-data', 'Employees')
  toast.add({
    title: 'Export Complete',
    description: 'Employee data has been exported to Excel.',
    color: 'success',
    icon: 'i-lucide-file-spreadsheet',
  })
}

async function handleExportFiltered() {
  await table.value?.excelExport({
    filename: 'employee-data-filtered',
    visibleColumnsOnly: true,
  })
  toast.add({
    title: 'Export Complete',
    description: 'Filtered data has been exported to Excel.',
    color: 'success',
    icon: 'i-lucide-file-spreadsheet',
  })
}

function onCellValueChanged(event: { row: any; column: any; oldValue: any; newValue: any }) {
  const columnLabel = event.column.header || event.column.id
  toast.add({
    title: 'Cell Value Changed',
    description: `${columnLabel}: Updated successfully`,
    color: 'success',
  })
}

const basicExportCode = `const table = useTemplateRef('table')

// Export with filename and sheet name
table.excelExport('my-export', 'Data')

// In template:
<UButton @click="table?.excelExport('my-export', 'Data')">
  Export to Excel
</UButton>

<NuGrid ref="table" :columns="columns" :data="data" />`

const optionsCode = `// Simple: just filename
table.excelExport('my-export')

// With sheet name
table.excelExport('my-export', 'My Sheet')

// Full options object
table.excelExport({
  filename: 'custom-name',
  sheetName: 'My Sheet',
  includeHeaders: true,
  visibleColumnsOnly: true,
  columnWidths: { name: 30 },
})`
</script>

<template>
  <DemoLayout id="excel-export-demo" title="Excel Export Demo" info-label="About Excel Export">
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem
        label="Multi-Row"
        :value="multiRowEnabled ? 'Enabled' : 'Disabled'"
        :color="multiRowEnabled ? 'text-success' : 'text-muted'"
      />
      <DemoStatusItem
        label="Editing"
        :value="editingEnabled ? 'Enabled' : 'Disabled'"
        :color="editingEnabled ? 'text-success' : 'text-error'"
      />
      <DemoStatusItem label="Focus Mode" :value="focusModeLabel" />
      <DemoStatusItem label="Rows" :value="data.length" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Export">
        <UButton
          block
          color="primary"
          icon="i-lucide-file-spreadsheet"
          :disabled="!canExport"
          size="sm"
          @click="handleExport"
        >
          Export to Excel
        </UButton>
        <UButton
          block
          color="neutral"
          variant="outline"
          icon="i-lucide-filter"
          :disabled="!canExport"
          size="sm"
          @click="handleExportFiltered"
        >
          Export Visible Only
        </UButton>
      </DemoControlGroup>

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
        This page demonstrates the Excel export functionality for NuGrid. The export properly
        handles different field types and ensures each data row becomes a single Excel row
        (regardless of multi-row display mode).
      </p>
      <div class="mb-3 rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Supported Field Types:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li><strong>Text:</strong> Name, Email, Department, Notes</li>
          <li><strong>Number:</strong> ID (read-only)</li>
          <li><strong>Currency:</strong> Salary, Bonus (formatted with $ symbol)</li>
          <li><strong>Date:</strong> Hire Date, Last Review (yyyy-mm-dd format)</li>
          <li><strong>Boolean:</strong> Active (exports as Yes/No)</li>
          <li><strong>Long Text:</strong> Notes (textarea with wrap)</li>
        </ul>
      </div>
      <div class="mb-3 rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Export Features:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li>Exports to .xlsx format (native Excel)</li>
          <li>Includes column headers</li>
          <li>Auto-sizes column widths based on content</li>
          <li>Respects column visibility (hidden columns are excluded)</li>
          <li>Multi-row display items export as single Excel rows</li>
          <li>Proper formatting for dates and currency values</li>
        </ul>
      </div>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Usage:</strong> Click the "Export to Excel" button to download the data. Enable
        multi-row mode to see how the export handles multiple visual rows per data item.
      </div>
    </template>

    <!-- Grid -->
    <NuGrid
      ref="table"
      v-model:column-visibility="columnVisibility"
      v-model:selected-rows="selectedRows"
      v-model:column-sizing="columnSizing"
      v-model:column-pinning="columnPinning"
      :multi-row="multiRowEnabled ? { enabled: true, rowCount: 3, alignColumns: true } : false"
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
      <DemoCodeBlock title="Using the Excel Export via NuGrid ref:" :code="basicExportCode" />
      <DemoCodeBlock
        title="Export Options (multiple call signatures):"
        :code="optionsCode"
        class="mt-4"
      />
    </template>
  </DemoLayout>
</template>

<style scoped>
code {
  font-family: 'Monaco', 'Courier New', monospace;
}
</style>
