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
const pageSize = ref(20)
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

// Grouping state
const groupingState = ref<string[]>(['category'])
const groupingOptions = ['category', 'status', 'assignee'] as const

// Layout mode
type LayoutMode = 'group' | 'splitgroup'
const layoutMode = ref<LayoutMode>('group')
const stickyHeadersEnabled = ref(true)

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

function toggleGroupBy(field: string) {
  if (groupingState.value.includes(field)) {
    groupingState.value = groupingState.value.filter((g) => g !== field)
  } else {
    groupingState.value = [...groupingState.value, field]
  }
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
  v-model:grouping="groupingState"
  :layout="{ mode: 'group', stickyHeaders: true }"
  :paging="{
    pageSize: 20,
    pageSizeSelector: [10, 20, 50, 100]
  }"
/>

<!-- Split group mode with paging -->
<NuGrid
  :data="data"
  :columns="columns"
  v-model:grouping="groupingState"
  :layout="{ mode: 'splitgroup', stickyHeaders: true }"
  :paging="true"
/>`
</script>

<template>
  <DemoLayout id="group-paging-demo" title="Group Paging Demo" info-label="About Group Paging">
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Total Rows" :value="data.length" />
      <DemoStatusItem label="Layout" :value="layoutMode" />
      <DemoStatusItem
        label="Grouped By"
        :value="groupingState.length > 0 ? groupingState.join(', ') : 'None'"
      />
      <DemoStatusItem
        label="Paging"
        :value="paginationEnabled ? 'Enabled' : 'Disabled'"
        :color="paginationEnabled ? 'text-success' : 'text-warning'"
      />
      <template v-if="paginationEnabled">
        <DemoStatusItem label="Page Size" :value="pageSize" />
      </template>
      <DemoStatusItem label="Focus Mode" :value="focusModeLabel" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Layout Mode">
        <div class="grid grid-cols-2 gap-1">
          <UButton
            :color="layoutMode === 'group' ? 'primary' : 'neutral'"
            :variant="layoutMode === 'group' ? 'solid' : 'outline'"
            size="xs"
            @click="layoutMode = 'group'"
          >
            Group
          </UButton>
          <UButton
            :color="layoutMode === 'splitgroup' ? 'primary' : 'neutral'"
            :variant="layoutMode === 'splitgroup' ? 'solid' : 'outline'"
            size="xs"
            @click="layoutMode = 'splitgroup'"
          >
            Split
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Sticky Headers">
        <UButton
          block
          :color="stickyHeadersEnabled ? 'primary' : 'neutral'"
          :variant="stickyHeadersEnabled ? 'solid' : 'outline'"
          icon="i-lucide-pin"
          size="sm"
          @click="stickyHeadersEnabled = !stickyHeadersEnabled"
        >
          {{ stickyHeadersEnabled ? 'Enabled' : 'Disabled' }}
        </UButton>
      </DemoControlGroup>

      <DemoControlGroup label="Group By">
        <div class="flex flex-wrap gap-1">
          <UButton
            v-for="option in groupingOptions"
            :key="option"
            :color="groupingState.includes(option) ? 'primary' : 'neutral'"
            :variant="groupingState.includes(option) ? 'solid' : 'outline'"
            size="xs"
            @click="toggleGroupBy(option)"
          >
            {{ option }}
          </UButton>
        </div>
      </DemoControlGroup>

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
              v-for="size in [10, 20, 50, 100]"
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
            <UButton color="neutral" size="xs" @click="goToPage(3)"> Page 3 </UButton>
            <UButton color="neutral" size="xs" @click="goToPage(5)"> Page 5 </UButton>
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
        This page demonstrates paging combined with grouped data. Paging works with both 'group' and
        'splitgroup' layout modes.
      </p>

      <div class="mb-3 rounded bg-default/50 p-2 text-sm text-dimmed">
        <strong>How Paging Works with Groups:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li>Pagination respects the expanded/collapsed state of groups</li>
          <li>When a group is collapsed, only the group header counts toward the page</li>
          <li>When a group is expanded, all child rows count toward the page</li>
          <li>Page navigation may show partial groups at page boundaries</li>
        </ul>
      </div>

      <div class="rounded bg-default/50 p-2 text-sm text-dimmed">
        <strong>Layout Modes:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li><strong>group:</strong> Single table with collapsible group headers</li>
          <li><strong>splitgroup:</strong> Separate tables per group with their own headers</li>
        </ul>
      </div>
    </template>

    <!-- Grid -->
    <NuGrid
      ref="table"
      v-model:sorting="sorting"
      v-model:grouping="groupingState"
      :data="data"
      :columns="columns"
      :paging="paginationOptions"
      :focus="{ mode: focusMode }"
      :layout="{ mode: layoutMode, stickyHeaders: stickyHeadersEnabled }"
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
                <strong>TanStack Integration:</strong> Uses TanStack Table's pagination row model
                which works after the grouping/expand pipeline
              </li>
              <li>
                <strong>Expand State Awareness:</strong> The page count depends on which groups are
                expanded
              </li>
              <li>
                <strong>Keyboard Navigation:</strong> PageUp/PageDown and Cmd+Arrow keys work for
                page navigation
              </li>
              <li>
                <strong>State Persistence:</strong> Both grouping and paging state can be persisted
              </li>
              <li>
                <strong>Row Count Display:</strong> Shows total data rows, not including group
                headers
              </li>
            </ul>
          </div>
        </template>
      </UAccordion>
    </template>
  </DemoLayout>
</template>
