<script setup lang="ts">
import type { NuGridColumn, NuGridRow, NuGridRowSelectOptions } from '#nu-grid/types'

const table = useTemplateRef<{ getSelectedRows: <T>() => T[] }>('table')

// Sample data for the demo
interface Employee {
  id: number
  name: string
  email: string
  department: string
  role: string
  salary: number
  status: 'active' | 'inactive' | 'pending'
}

const data = ref<Employee[]>([
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    department: 'Engineering',
    role: 'Senior Developer',
    salary: 95000,
    status: 'active',
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    department: 'Marketing',
    role: 'Marketing Manager',
    salary: 75000,
    status: 'active',
  },
  {
    id: 3,
    name: 'Carol White',
    email: 'carol@example.com',
    department: 'Engineering',
    role: 'Junior Developer',
    salary: 55000,
    status: 'pending',
  },
  {
    id: 4,
    name: 'David Brown',
    email: 'david@example.com',
    department: 'HR',
    role: 'HR Specialist',
    salary: 60000,
    status: 'active',
  },
  {
    id: 5,
    name: 'Emma Davis',
    email: 'emma@example.com',
    department: 'Engineering',
    role: 'Tech Lead',
    salary: 110000,
    status: 'active',
  },
  {
    id: 6,
    name: 'Frank Miller',
    email: 'frank@example.com',
    department: 'Sales',
    role: 'Sales Representative',
    salary: 50000,
    status: 'inactive',
  },
  {
    id: 7,
    name: 'Grace Wilson',
    email: 'grace@example.com',
    department: 'Finance',
    role: 'Financial Analyst',
    salary: 70000,
    status: 'active',
  },
  {
    id: 8,
    name: 'Henry Taylor',
    email: 'henry@example.com',
    department: 'Engineering',
    role: 'DevOps Engineer',
    salary: 85000,
    status: 'active',
  },
])

// Row selection mode control
const selectionMode = ref<'none' | 'single' | 'multi'>('multi')
const selectionHidden = ref(false)
const selectionEnabled = ref(true)
const disableInactiveSelection = ref(true)

// Function to determine if a row can be selected
const rowSelectionEnabledFn = (row: NuGridRow<Employee>): boolean => {
  if (!disableInactiveSelection.value) {
    return true
  }
  return row.original.status !== 'inactive'
}

// Computed row selection options object
const rowSelectionMode = computed<false | NuGridRowSelectOptions<Employee>>(() => {
  if (selectionMode.value === 'none') return false
  return {
    mode: selectionMode.value,
    hidden: selectionHidden.value,
    enabled: selectionEnabled.value,
    rowSelectionEnabled: rowSelectionEnabledFn,
  }
})

// Row selection state
const selectionState = ref({})

// Focus mode control
const focusMode = ref<'cell' | 'row'>('cell')

// Retain focus control
const retainFocus = ref(false)

// Define columns
const columns: NuGridColumn<Employee>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    minSize: 60,
    maxSize: 80,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    minSize: 150,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    minSize: 200,
  },
  {
    accessorKey: 'department',
    header: 'Department',
    minSize: 120,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    minSize: 150,
  },
  {
    accessorKey: 'salary',
    header: 'Salary',
    minSize: 100,
    cell: ({ row }) => `$${row.original.salary.toLocaleString()}`,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    minSize: 100,
    cell: ({ row }) => {
      const colors: Record<string, string> = {
        active: 'text-success',
        inactive: 'text-error',
        pending: 'text-warning',
      }
      return h('span', { class: colors[row.original.status] }, row.original.status)
    },
  },
]

// Computed property to get selected rows
const selectedRows = computed((): Employee[] => {
  return table.value?.getSelectedRows<Employee>() ?? []
})

// Clear selection
function clearSelection() {
  selectionState.value = {}
}

// Handle selection mode change
function onSelectionModeChange(newMode: 'none' | 'single' | 'multi') {
  selectionMode.value = newMode
}

const exampleCode = `<NuGrid
  v-model:selected-rows="selectedRowState"
  :row-selection="{
    mode: 'multi',
    hidden: false,
    enabled: true,
    rowSelectionEnabled: (row) => row.original.status !== 'inactive'
  }"
  :data="data"
  :columns="columns"
/>`
</script>

<template>
  <DemoLayout id="row-selection-demo" title="Row Selection Demo" info-label="About Row Selection">
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Mode" :value="selectionMode" />
      <DemoStatusItem
        label="Hidden"
        :value="selectionHidden"
        :color="selectionHidden ? 'text-warning' : 'text-success'"
      />
      <DemoStatusItem
        label="Enabled"
        :value="selectionEnabled"
        :color="selectionEnabled ? 'text-success' : 'text-warning'"
      />
      <DemoStatusItem label="Focus Mode" :value="focusMode" />
      <DemoStatusItem
        label="Retain Focus"
        :value="retainFocus"
        :color="retainFocus ? 'text-success' : 'text-muted'"
      />
      <DemoStatusItem label="Selected" :value="selectedRows.length" color="text-primary" />
      <DemoStatusItem
        label="Inactive Disabled"
        :value="disableInactiveSelection"
        :color="disableInactiveSelection ? 'text-warning' : 'text-muted'"
      />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Selection Mode">
        <div class="grid grid-cols-3 gap-1">
          <UButton
            :color="selectionMode === 'none' ? 'primary' : 'neutral'"
            :variant="selectionMode === 'none' ? 'solid' : 'outline'"
            icon="i-lucide-x"
            size="xs"
            @click="onSelectionModeChange('none')"
          >
            None
          </UButton>
          <UButton
            :color="selectionMode === 'single' ? 'primary' : 'neutral'"
            :variant="selectionMode === 'single' ? 'solid' : 'outline'"
            icon="i-lucide-square-check"
            size="xs"
            @click="onSelectionModeChange('single')"
          >
            Single
          </UButton>
          <UButton
            :color="selectionMode === 'multi' ? 'primary' : 'neutral'"
            :variant="selectionMode === 'multi' ? 'solid' : 'outline'"
            icon="i-lucide-list-checks"
            size="xs"
            @click="onSelectionModeChange('multi')"
          >
            Multi
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Focus Mode">
        <div class="grid grid-cols-2 gap-1">
          <UButton
            :color="focusMode === 'cell' ? 'primary' : 'neutral'"
            :variant="focusMode === 'cell' ? 'solid' : 'outline'"
            icon="i-lucide-grid-2x2"
            size="xs"
            @click="focusMode = 'cell'"
          >
            Cell
          </UButton>
          <UButton
            :color="focusMode === 'row' ? 'primary' : 'neutral'"
            :variant="focusMode === 'row' ? 'solid' : 'outline'"
            icon="i-lucide-rows-3"
            size="xs"
            @click="focusMode = 'row'"
          >
            Row
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Retain Focus">
        <UButton
          block
          :color="retainFocus ? 'success' : 'neutral'"
          :variant="retainFocus ? 'solid' : 'outline'"
          :icon="retainFocus ? 'i-lucide-keyboard' : 'i-lucide-keyboard-off'"
          size="sm"
          @click="retainFocus = !retainFocus"
        >
          {{ retainFocus ? 'Retain Focus' : 'Normal Focus' }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Column Visibility">
        <UButton
          block
          :color="selectionHidden ? 'warning' : 'neutral'"
          :variant="selectionHidden ? 'solid' : 'outline'"
          :icon="selectionHidden ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          :disabled="selectionMode === 'none'"
          size="sm"
          @click="selectionHidden = !selectionHidden"
        >
          {{ selectionHidden ? 'Hidden' : 'Visible' }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Checkbox State">
        <UButton
          block
          :color="selectionEnabled ? 'success' : 'warning'"
          :variant="selectionEnabled ? 'solid' : 'outline'"
          :icon="selectionEnabled ? 'i-lucide-check' : 'i-lucide-ban'"
          :disabled="selectionMode === 'none'"
          size="sm"
          @click="selectionEnabled = !selectionEnabled"
        >
          {{ selectionEnabled ? 'Enabled' : 'Disabled' }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Per-Row Selection">
        <UButton
          block
          :color="disableInactiveSelection ? 'warning' : 'neutral'"
          :variant="disableInactiveSelection ? 'solid' : 'outline'"
          :icon="disableInactiveSelection ? 'i-lucide-user-x' : 'i-lucide-users'"
          :disabled="selectionMode === 'none'"
          size="sm"
          @click="disableInactiveSelection = !disableInactiveSelection"
        >
          {{ disableInactiveSelection ? 'Inactive Disabled' : 'All Selectable' }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup v-if="selectedRows.length > 0">
        <UButton
          block
          color="error"
          variant="subtle"
          icon="i-lucide-trash"
          size="sm"
          @click="clearSelection"
        >
          Clear Selection ({{ selectedRows.length }})
        </UButton>
      </DemoControlGroup>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        This page demonstrates the enhanced
        <code class="rounded bg-default px-1 py-0.5 text-xs">rowSelectionMode</code>
        property for NuGrid. This property accepts an options object with the following properties:
      </p>
      <ul class="mb-3 list-inside list-disc space-y-1 text-sm text-muted">
        <li><strong>mode:</strong> 'single' or 'multi' - controls how many rows can be selected</li>
        <li>
          <strong>hidden:</strong> boolean - hides the selection column while keeping it in the
          columns collection
        </li>
        <li><strong>enabled:</strong> boolean - controls whether checkboxes are clickable</li>
        <li>
          <strong>rowSelectionEnabled:</strong> (row) =&gt; boolean - function to determine if a
          specific row can be selected. Returns false to disable selection for that row.
        </li>
      </ul>
      <div class="mb-3 rounded bg-warning/10 p-2 text-sm text-muted">
        <strong>Demo:</strong> The "Inactive Disabled" button demonstrates
        <code class="rounded bg-default px-1 py-0.5 text-xs">rowSelectionEnabled</code>. When
        enabled, rows with status "inactive" (Frank Miller) cannot be selected via checkbox click or
        spacebar.
      </div>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Tip:</strong> Use the controls in the sidebar to experiment with different
        combinations of selection options.
      </div>
    </template>

    <!-- Grid -->
    <div class="overflow-x-auto">
      <NuGrid
        ref="table"
        v-model:selected-rows="selectionState"
        :row-selection="rowSelectionMode"
        :data="data"
        :columns="columns"
        :focus="{ mode: focusMode, retain: retainFocus }"
      />
    </div>

    <!-- Selected Rows Display -->
    <div v-if="selectedRows.length > 0" class="mt-6">
      <h3 class="mb-3 text-lg font-semibold">Selected Rows</h3>
      <div class="overflow-x-auto rounded-lg border border-default">
        <table class="w-full text-sm">
          <thead class="bg-elevated/50">
            <tr>
              <th class="px-4 py-2 text-left font-medium">ID</th>
              <th class="px-4 py-2 text-left font-medium">Name</th>
              <th class="px-4 py-2 text-left font-medium">Email</th>
              <th class="px-4 py-2 text-left font-medium">Department</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="employee in selectedRows" :key="employee.id" class="border-t border-default">
              <td class="px-4 py-2">{{ employee.id }}</td>
              <td class="px-4 py-2">{{ employee.name }}</td>
              <td class="px-4 py-2">{{ employee.email }}</td>
              <td class="px-4 py-2">{{ employee.department }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-else
      class="mt-6 rounded-lg border border-dashed border-default p-8 text-center text-muted"
    >
      <UIcon name="i-lucide-mouse-pointer-click" class="mx-auto mb-2 size-8" />
      <p>No rows selected. Click on the checkboxes to select rows.</p>
    </div>

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Basic Usage:" :code="exampleCode" />
    </template>
  </DemoLayout>
</template>

<style scoped>
code {
  font-family: 'Monaco', 'Courier New', monospace;
}
</style>
