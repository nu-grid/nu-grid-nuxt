<script setup lang="ts">
import type { NuGridColumn, NuGridColumnMenuItemsCallback } from '#nu-grid/types'

const table = useTemplateRef('table')
const toast = useToast()

// Sample data for column menu demonstration
interface Employee {
  id: number
  name: string
  department: string
  position: string
  salary: number
  startDate: string
  status: 'active' | 'on-leave' | 'terminated'
}

const data = ref<Employee[]>([
  {
    id: 1,
    name: 'John Doe',
    department: 'Engineering',
    position: 'Senior Developer',
    salary: 95000,
    startDate: '2020-01-15',
    status: 'active',
  },
  {
    id: 2,
    name: 'Jane Smith',
    department: 'Marketing',
    position: 'Marketing Manager',
    salary: 85000,
    startDate: '2019-03-20',
    status: 'active',
  },
  {
    id: 3,
    name: 'Bob Johnson',
    department: 'Sales',
    position: 'Sales Representative',
    salary: 65000,
    startDate: '2021-06-10',
    status: 'active',
  },
  {
    id: 4,
    name: 'Alice Williams',
    department: 'Engineering',
    position: 'Junior Developer',
    salary: 70000,
    startDate: '2022-09-01',
    status: 'active',
  },
  {
    id: 5,
    name: 'Charlie Brown',
    department: 'HR',
    position: 'HR Manager',
    salary: 80000,
    startDate: '2018-11-05',
    status: 'on-leave',
  },
  {
    id: 6,
    name: 'Diana Prince',
    department: 'Engineering',
    position: 'Tech Lead',
    salary: 120000,
    startDate: '2017-04-12',
    status: 'active',
  },
  {
    id: 7,
    name: 'Edward Norton',
    department: 'Finance',
    position: 'Financial Analyst',
    salary: 75000,
    startDate: '2020-08-22',
    status: 'active',
  },
  {
    id: 8,
    name: 'Fiona Apple',
    department: 'Marketing',
    position: 'Content Writer',
    salary: 60000,
    startDate: '2021-02-14',
    status: 'terminated',
  },
])

// Grid-level menu customization toggle
const useGridLevelCustomization = ref(false)

// Grid-level menu items callback
const getColumnMenuItems: NuGridColumnMenuItemsCallback<Employee> = (defaultItems, column) => {
  if (!useGridLevelCustomization.value) return defaultItems
  return [
    ...defaultItems,
    { type: 'separator' },
    {
      label: 'Export Column Data',
      icon: 'i-lucide-download',
      onSelect: (event, col) => {
        const columnName =
          typeof col?.columnDef.header === 'string' ? col.columnDef.header : col?.id || column.id
        toast.add({
          title: 'Export Column',
          description: `Exporting data for column: ${columnName}`,
          color: 'primary',
        })
      },
    },
  ]
}

// Define columns with various configurations
const columns: NuGridColumn<Employee>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    minSize: 60,
    maxSize: 80,
    enableSorting: true,
    enableResizing: true,
    enableColumnMenu: false,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    minSize: 150,
    enableSorting: true,
    enableResizing: true,
    columnMenuItems: [
      {
        label: 'Sort Ascending',
        icon: 'i-lucide-arrow-up',
        onSelect: (event, column) => column?.toggleSorting(false, false),
      },
      {
        label: 'Sort Descending',
        icon: 'i-lucide-arrow-down',
        onSelect: (event, column) => column?.toggleSorting(true, false),
      },
      { type: 'separator' },
      {
        label: 'Copy Column Name',
        icon: 'i-lucide-copy',
        onSelect: (event, column) => {
          const columnName =
            typeof column?.columnDef.header === 'string'
              ? column.columnDef.header
              : column?.id || 'Name'
          navigator.clipboard.writeText(columnName)
          toast.add({
            title: 'Copied',
            description: `Column name "${columnName}" copied to clipboard`,
            color: 'success',
          })
        },
      },
    ],
  },
  {
    accessorKey: 'department',
    header: 'Department',
    minSize: 120,
    enableSorting: true,
    enableResizing: true,
    columnMenuItems: (defaultItems) => [
      ...defaultItems,
      { type: 'separator' },
      {
        label: 'Filter by Department',
        icon: 'i-lucide-filter',
        onSelect: () =>
          toast.add({
            title: 'Filter Department',
            description: 'Opening filter for department',
            color: 'info',
          }),
      },
      {
        label: 'Group by Department',
        icon: 'i-lucide-group',
        onSelect: () =>
          toast.add({
            title: 'Group by Department',
            description: 'Grouping rows by department',
            color: 'primary',
          }),
      },
    ],
  },
  {
    accessorKey: 'position',
    header: 'Position',
    minSize: 150,
    enableSorting: true,
    enableResizing: true,
    showColumnVisibility: false,
    columnMenuItems: [
      {
        label: 'View All Positions',
        icon: 'i-lucide-briefcase',
        onSelect: () =>
          toast.add({
            title: 'View Positions',
            description: 'Opening positions directory...',
            color: 'info',
          }),
      },
      {
        label: 'Filter by Position',
        icon: 'i-lucide-filter',
        onSelect: () =>
          toast.add({
            title: 'Filter Positions',
            description: 'Opening position filter',
            color: 'primary',
          }),
      },
      { type: 'separator' },
      {
        label: 'Export Position Data',
        icon: 'i-lucide-download',
        onSelect: () =>
          toast.add({
            title: 'Export Positions',
            description: `Exporting ${new Set(data.value.map((e) => e.position)).size} unique positions`,
            color: 'success',
          }),
      },
    ],
  },
  {
    accessorKey: 'salary',
    header: 'Salary',
    minSize: 100,
    enableSorting: true,
    enableResizing: true,
    cell: ({ row }) => `$${row.original.salary.toLocaleString()}`,
    columnMenuItems: (defaultItems) => [
      ...defaultItems,
      { type: 'separator' },
      {
        label: 'Calculate Average',
        icon: 'i-lucide-calculator',
        onSelect: () => {
          const avg = data.value.reduce((sum, emp) => sum + emp.salary, 0) / data.value.length
          toast.add({
            title: 'Average Salary',
            description: `$${avg.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            color: 'success',
          })
        },
      },
    ],
  },
  {
    accessorKey: 'startDate',
    header: 'Start Date',
    minSize: 120,
    enableSorting: true,
    enableResizing: true,
    showColumnVisibility: false,
    cell: ({ row }) =>
      new Date(row.original.startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    minSize: 120,
    enableSorting: true,
    enableResizing: true,
    cell: ({ row }) => {
      const colors: Record<string, string> = {
        'active': 'text-success',
        'on-leave': 'text-warning',
        'terminated': 'text-error',
      }
      return h(
        'span',
        { class: ['capitalize', colors[row.original.status]] },
        row.original.status.replace('-', ' '),
      )
    },
  },
]

const columnVisibility = ref<Record<string, boolean>>()
const columnSizing = ref<Record<string, number>>({})
const columnPinning = ref<{ left?: string[]; right?: string[] }>({})
const sorting = ref([])
const selectedRows = ref<Record<string, boolean>>({})

// Grid configuration
const resizeColumns = ref(true)
const reorderColumns = ref(true)
const stickyHeaders = ref(false)
const rowSelectionMode = ref<'multi' | 'single' | false>('multi')
const showColumnVisibility = ref(true)

const exampleCode = `// Disable menu for a column
{ accessorKey: 'id', enableColumnMenu: false }

// Replace menu items (array)
{
  accessorKey: 'name',
  columnMenuItems: [
    {
      label: 'Sort Ascending',
      icon: 'i-lucide-arrow-up',
      onSelect: (e, col) => col?.toggleSorting(false)
    },
    {
      label: 'Custom Action',
      icon: 'i-lucide-star',
      onSelect: () => {}
    }
  ]
}

// Add to defaults (callback)
{
  accessorKey: 'department',
  columnMenuItems: (defaults) => [
    ...defaults,
    { type: 'separator' },
    { label: 'Custom Action', onSelect: () => {} }
  ]
}`
</script>

<template>
  <DemoLayout
    id="column-menu-demo"
    title="Column Menu Demo"
    info-label="About Column Menu"
    sidebar-width="320px"
  >
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem
        label="Visible Columns"
        :value="`${Object.values(columnVisibility || {}).filter((v) => v !== false).length || columns.length} / ${columns.length}`"
      />
      <DemoStatusItem
        label="Pinned Columns"
        :value="(columnPinning?.left?.length || 0) + (columnPinning?.right?.length || 0)"
      />
      <DemoStatusItem label="Active Sorts" :value="sorting.length" />
      <DemoStatusItem
        label="Selected Rows"
        :value="Object.keys(selectedRows || {}).filter((k) => selectedRows[k]).length"
      />
      <DemoStatusItem label="Grid Customization" :value="useGridLevelCustomization" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Column Features">
        <div class="space-y-2">
          <UButton
            block
            size="sm"
            :color="resizeColumns ? 'primary' : 'neutral'"
            :variant="resizeColumns ? 'solid' : 'outline'"
            icon="i-lucide-arrow-left-right"
            @click="resizeColumns = !resizeColumns"
          >
            {{ resizeColumns ? 'Resize Enabled' : 'Resize Disabled' }}
          </UButton>
          <UButton
            block
            size="sm"
            :color="reorderColumns ? 'primary' : 'neutral'"
            :variant="reorderColumns ? 'solid' : 'outline'"
            icon="i-lucide-arrow-left-right"
            @click="reorderColumns = !reorderColumns"
          >
            {{ reorderColumns ? 'Reorder Enabled' : 'Reorder Disabled' }}
          </UButton>
          <UButton
            block
            size="sm"
            :color="stickyHeaders ? 'primary' : 'neutral'"
            :variant="stickyHeaders ? 'solid' : 'outline'"
            icon="i-lucide-pin"
            @click="stickyHeaders = !stickyHeaders"
          >
            {{ stickyHeaders ? 'Sticky Headers' : 'Normal Headers' }}
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Grid-Level Menu">
        <USwitch v-model="useGridLevelCustomization" label="Add 'Export Column' to all" />
      </DemoControlGroup>

      <DemoControlGroup label="Column Visibility">
        <USwitch v-model="showColumnVisibility" label="Show visibility toggle" />
      </DemoControlGroup>

      <DemoControlGroup label="Row Selection">
        <div class="grid grid-cols-3 gap-1">
          <UButton
            size="xs"
            :color="rowSelectionMode === 'multi' ? 'primary' : 'neutral'"
            :variant="rowSelectionMode === 'multi' ? 'solid' : 'outline'"
            @click="rowSelectionMode = 'multi'"
          >
            Multi
          </UButton>
          <UButton
            size="xs"
            :color="rowSelectionMode === 'single' ? 'primary' : 'neutral'"
            :variant="rowSelectionMode === 'single' ? 'solid' : 'outline'"
            @click="rowSelectionMode = 'single'"
          >
            Single
          </UButton>
          <UButton
            size="xs"
            :color="!rowSelectionMode ? 'primary' : 'neutral'"
            :variant="!rowSelectionMode ? 'solid' : 'outline'"
            @click="rowSelectionMode = false"
          >
            None
          </UButton>
        </div>
      </DemoControlGroup>

      <UButton
        v-if="sorting.length > 0"
        block
        size="sm"
        color="warning"
        variant="outline"
        icon="i-lucide-x"
        @click="sorting = []"
      >
        Clear Sorting
      </UButton>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        The column menu provides quick access to column operations directly from the column header.
        Hover over any column header to see the menu button appear.
      </p>
      <ul class="mb-3 list-inside list-disc space-y-1 text-sm text-muted">
        <li><strong>Sort:</strong> Sort ascending, descending, or clear</li>
        <li><strong>Pin:</strong> Pin column to left or right</li>
        <li><strong>Autosize:</strong> Fit column width to content</li>
        <li><strong>Column Visibility:</strong> Show/hide columns via submenu</li>
      </ul>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Note:</strong> ID column has menu disabled. Name has custom menu items. Position
        replaces all defaults. Department/Salary add to defaults.
      </div>
    </template>

    <!-- Grid -->
    <NuGrid
      ref="table"
      v-model:column-visibility="columnVisibility"
      v-model:column-sizing="columnSizing"
      v-model:column-pinning="columnPinning"
      v-model:sorting="sorting"
      v-model:selected-rows="selectedRows"
      :row-selection="rowSelectionMode"
      :layout="{ stickyHeaders }"
      :column-defaults="{
        resize: resizeColumns,
        reorder: reorderColumns,
        menu: { items: getColumnMenuItems, visibilityToggle: showColumnVisibility },
      }"
      :data="data"
      :columns="columns"
      :ui="{
        root: 'h-full w-full',
        base: 'w-max min-w-full border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default',
        separator: 'h-0',
      }"
    />

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Column Menu Customization:" :code="exampleCode" />
    </template>
  </DemoLayout>
</template>
