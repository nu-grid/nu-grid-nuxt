<script setup lang="ts">
import type { NuGridColumn, NuGridPagingOptions } from '#nu-grid/types'

const toast = useToast()
const table = useTemplateRef('table')

// Sample data for demonstration
interface Task {
  id: number
  name: string
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  priority: number
  assignee: string
  dueDate: string
  category: string
}

const categories = [
  'Design',
  'Backend',
  'Testing',
  'Review',
  'Docs',
  'Security',
  'Frontend',
  'DevOps',
  'Database',
  'API',
] as const
const assignees = [
  'Alice',
  'Bob',
  'Charlie',
  'Diana',
  'Eve',
  'Frank',
  'Grace',
  'Henry',
  'Ivy',
  'Jack',
  'Kate',
  'Leo',
] as const
const statuses: Task['status'][] = ['pending', 'in-progress', 'completed', 'cancelled']

// Generate rows of data
function generateData(count: number): Task[] {
  const tasks: Task[] = []
  for (let i = 1; i <= count; i++) {
    tasks.push({
      id: i,
      name: `Task ${i}: ${['Implement', 'Fix', 'Update', 'Refactor', 'Test', 'Review', 'Deploy', 'Document'][i % 8]} ${categories[i % categories.length]}`,
      status: statuses[i % statuses.length]!,
      priority: i,
      assignee: assignees[i % assignees.length]!,
      dueDate: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      category: categories[i % categories.length]!,
    })
  }
  return tasks
}

const initialData = generateData(100)
const data = ref<Task[]>([...initialData])

// Pagination options
const paginationEnabled = ref(true)
const pageSize = ref(10)
const autoPageSize = ref(false)
const suppressPanel = ref(false)
const pageSizeSelector = ref<number[] | boolean>([10, 20, 50, 100])

const paginationOptions = computed<NuGridPagingOptions | boolean>(() => {
  if (!paginationEnabled.value) return false
  return {
    enabled: true,
    pageSize: pageSize.value,
    pageSizeSelector: pageSizeSelector.value,
    autoPageSize: autoPageSize.value,
    suppressPanel: suppressPanel.value,
  }
})

const { focusMode, toggleFocusMode, focusModeIcon, focusModeLabel } = useFocusModeToggle()

// Status colors for display
const statusColors: Record<string, string> = {
  'pending': 'text-warning',
  'in-progress': 'text-info',
  'completed': 'text-success',
  'cancelled': 'text-error',
}

const statusLabels: Record<string, string> = {
  'pending': 'Pending',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
}

// Columns
const columns = computed<NuGridColumn<Task>[]>(() => [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 60,
    enableEditing: false,
    enableSorting: true,
  },
  {
    accessorKey: 'name',
    header: 'Task Name',
    size: 280,
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    enableSorting: true,
    cell: ({ row }) =>
      h('span', { class: statusColors[row.original.status] }, statusLabels[row.original.status]),
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    size: 80,
    enableSorting: true,
  },
  {
    accessorKey: 'assignee',
    header: 'Assignee',
    size: 120,
    enableSorting: true,
  },
  {
    accessorKey: 'category',
    header: 'Category',
    size: 100,
    enableSorting: true,
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    size: 120,
    enableSorting: true,
  },
])

const sorting = ref([])

// Demo actions
function addRows(count: number) {
  const startId = Math.max(...data.value.map((d) => d.id)) + 1
  const newTasks: Task[] = []

  for (let i = 0; i < count; i++) {
    const id = startId + i
    newTasks.push({
      id,
      name: `New Task ${id}`,
      status: statuses[Math.floor(Math.random() * statuses.length)]!,
      priority: id,
      assignee: assignees[Math.floor(Math.random() * assignees.length)]!,
      dueDate: '2024-02-15',
      category: categories[Math.floor(Math.random() * categories.length)]!,
    })
  }

  data.value = [...data.value, ...newTasks]
  toast.add({
    title: 'Rows Added',
    description: `Added ${count} new rows`,
    color: 'success',
  })
}

function resetData() {
  data.value = [...initialData]
  toast.add({
    title: 'Data Reset',
    description: `Reset to ${initialData.length} rows`,
    color: 'neutral',
  })
}

function goToPage(page: number) {
  table.value?.pagingGoToPage(page - 1)
  toast.add({
    title: 'Navigated',
    description: `Navigated to page ${page}`,
    color: 'info',
  })
}

const pageSizeSelectorOptions = [
  { label: 'Default [10, 20, 50, 100]', value: 'default' },
  { label: 'Custom [5, 15, 25]', value: 'custom' },
  { label: 'Hidden', value: 'hidden' },
]

const selectedPageSizeSelector = ref('default')

watch(selectedPageSizeSelector, (val) => {
  if (val === 'default') {
    pageSizeSelector.value = [10, 20, 50, 100]
  } else if (val === 'custom') {
    pageSizeSelector.value = [5, 15, 25]
  } else {
    pageSizeSelector.value = false
  }
})

const exampleCode = `<NuGrid
  :data="data"
  :columns="columns"
  :paging="{
    pageSize: 20,
    pageSizeSelector: [10, 20, 50, 100]
  }"
/>

<!-- Enable with defaults -->
<NuGrid
  :data="data"
  :columns="columns"
  :paging="true"
/>

<!-- Auto page size (fit rows to container) -->
<NuGrid
  :data="data"
  :columns="columns"
  :paging="{
    autoPageSize: true
  }"
/>

<!-- Hide built-in panel (use custom controls) -->
<NuGrid
  :data="data"
  :columns="columns"
  :paging="{
    suppressPanel: true
  }"
/>`
</script>

<template>
  <DemoLayout id="paging-demo" title="Paging Demo" info-label="About Paging">
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Total Rows" :value="data.length" />
      <DemoStatusItem
        label="Paging"
        :value="paginationEnabled ? 'Enabled' : 'Disabled'"
        :color="paginationEnabled ? 'text-success' : 'text-warning'"
      />
      <template v-if="paginationEnabled">
        <DemoStatusItem label="Page Size" :value="pageSize" />
        <DemoStatusItem
          label="Auto Size"
          :value="autoPageSize ? 'On' : 'Off'"
          :color="autoPageSize ? 'text-info' : 'text-dimmed'"
        />
        <DemoStatusItem
          label="Panel"
          :value="suppressPanel ? 'Hidden' : 'Visible'"
          :color="suppressPanel ? 'text-warning' : 'text-success'"
        />
      </template>
      <DemoStatusItem label="Focus Mode" :value="focusModeLabel" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Paging">
        <UButton
          block
          :color="paginationEnabled ? 'success' : 'warning'"
          :variant="paginationEnabled ? 'solid' : 'outline'"
          icon="i-lucide-book-open"
          size="sm"
          @click="paginationEnabled = !paginationEnabled"
        >
          {{ paginationEnabled ? 'Enabled' : 'Disabled' }}
        </UButton>
      </DemoControlGroup>

      <template v-if="paginationEnabled">
        <DemoControlGroup label="Page Size">
          <div class="grid grid-cols-4 gap-1">
            <UButton
              v-for="size in [5, 10, 20, 50]"
              :key="size"
              :color="pageSize === size ? 'primary' : 'neutral'"
              :variant="pageSize === size ? 'solid' : 'outline'"
              size="xs"
              @click="pageSize = size"
            >
              {{ size }}
            </UButton>
          </div>
        </DemoControlGroup>

        <DemoControlGroup label="Page Size Selector">
          <USelectMenu
            v-model="selectedPageSizeSelector"
            :items="pageSizeSelectorOptions"
            value-key="value"
            size="sm"
          />
        </DemoControlGroup>

        <DemoControlGroup label="Auto Page Size">
          <UButton
            block
            :color="autoPageSize ? 'info' : 'neutral'"
            :variant="autoPageSize ? 'solid' : 'outline'"
            icon="i-lucide-maximize-2"
            size="sm"
            @click="autoPageSize = !autoPageSize"
          >
            {{ autoPageSize ? 'Auto' : 'Manual' }}
          </UButton>
        </DemoControlGroup>

        <DemoControlGroup label="Panel Visibility">
          <UButton
            block
            :color="suppressPanel ? 'warning' : 'success'"
            :variant="suppressPanel ? 'outline' : 'solid'"
            icon="i-lucide-panel-bottom"
            size="sm"
            @click="suppressPanel = !suppressPanel"
          >
            {{ suppressPanel ? 'Hidden' : 'Visible' }}
          </UButton>
        </DemoControlGroup>

        <DemoControlGroup label="Navigate">
          <div class="grid grid-cols-3 gap-1">
            <UButton color="neutral" size="xs" @click="goToPage(1)"> First </UButton>
            <UButton color="neutral" size="xs" @click="goToPage(5)"> Page 5 </UButton>
            <UButton color="neutral" size="xs" @click="goToPage(10)"> Page 10 </UButton>
          </div>
        </DemoControlGroup>
      </template>

      <DemoControlGroup label="Focus Mode">
        <UButton
          block
          color="neutral"
          variant="outline"
          :icon="focusModeIcon"
          size="sm"
          @click="toggleFocusMode"
        >
          {{ focusModeLabel }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Data Actions">
        <div class="grid grid-cols-2 gap-1">
          <UButton color="success" icon="i-lucide-plus" size="xs" @click="addRows(10)">
            Add 10
          </UButton>
          <UButton color="success" icon="i-lucide-plus" size="xs" @click="addRows(50)">
            Add 50
          </UButton>
        </div>
        <UButton
          block
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
          size="sm"
          @click="resetData"
        >
          Reset Data
        </UButton>
      </DemoControlGroup>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-dimmed">
        This page demonstrates the paging feature for NuGrid. Paging divides large datasets into
        pages for better performance and usability.
      </p>

      <div class="mb-3 rounded bg-default/50 p-2 text-sm text-dimmed">
        <strong>Paging Options:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li><strong>enabled:</strong> Enable or disable paging (default: false)</li>
          <li><strong>pageSize:</strong> Number of rows per page (default: 20)</li>
          <li>
            <strong>pageSizeSelector:</strong> Page size dropdown options or false to hide (default:
            [10, 20, 50, 100])
          </li>
          <li><strong>autoPageSize:</strong> Auto-fit rows to container height (default: false)</li>
          <li><strong>suppressPanel:</strong> Hide the built-in paging panel (default: false)</li>
        </ul>
      </div>

      <div class="rounded bg-default/50 p-2 text-sm text-dimmed">
        <strong>How It Works:</strong>
        <p class="mt-1">
          NuGrid uses TanStack Table's pagination model with NuxtUI's UPagination component for the
          UI. The paging prop accepts either a boolean or an options object for fine-grained
          control.
        </p>
      </div>
    </template>

    <!-- Grid -->
    <NuGrid
      ref="table"
      v-model:sorting="sorting"
      :data="data"
      :columns="columns"
      :paging="paginationOptions"
      :focus="{ mode: focusMode }"
      :layout="{ mode: 'div', stickyHeaders: true }"
      :editing="{ enabled: true, startClicks: 'double' }"
    />

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Basic Usage:" :code="exampleCode" />
    </template>

    <!-- Extra: Implementation Notes -->
    <template #extra>
      <UAccordion
        :items="[{ label: 'Implementation Notes', icon: 'i-lucide-file-text', slot: 'notes' }]"
      >
        <template #notes>
          <div class="space-y-2 p-4 text-sm text-dimmed">
            <p><strong>Key Points:</strong></p>
            <ul class="list-inside list-disc space-y-1">
              <li>
                <strong>Disabled by default:</strong> Paging is off by default to show all data
              </li>
              <li>
                <strong>Simple enable:</strong> Use <code>:paging="true"</code> to enable with
                defaults
              </li>
              <li>
                <strong>Custom page sizes:</strong> Provide an array of numbers for the page size
                selector
              </li>
              <li>
                <strong>Auto page size:</strong> The grid automatically calculates how many rows fit
                in the container
              </li>
              <li>
                <strong>Programmatic control:</strong> Use exposed methods like
                <code>pagingGoToPage()</code> for external navigation
              </li>
              <li>
                <strong>State persistence:</strong> Paging state is automatically persisted when
                state persistence is enabled
              </li>
            </ul>
          </div>
        </template>
      </UAccordion>
    </template>
  </DemoLayout>
</template>
