<script setup lang="ts">
import type { NuGridAnimationOptions, NuGridAnimationPreset, NuGridColumn } from '#nu-grid/types'

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

// Generate 500 rows of data
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

const initialData = generateData(50)
const data = ref<Task[]>([...initialData])

// Animation options
const animationEnabled = ref(true)
const animationDuration = ref(300)
const animationEasing = ref<'ease-out' | 'ease-in-out' | 'ease-in' | 'linear'>('ease-out')
const animationPreset = ref<NuGridAnimationPreset>('refresh')

const animationOptions = computed<NuGridAnimationOptions | false>(() => {
  if (!animationEnabled.value) return false
  return {
    enabled: true,
    preset: animationPreset.value,
    duration: animationDuration.value,
    easing: animationEasing.value,
  }
})

const { focusMode, toggleFocusMode, focusModeIcon, focusModeLabel } = useFocusModeToggle()

// Virtualization toggle
const virtualizationEnabled = ref(true)

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
function shuffleRows() {
  const shuffled = [...data.value]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]!
    shuffled[i] = shuffled[j]!
    shuffled[j] = temp
  }
  data.value = shuffled
  toast.add({
    title: 'Rows Shuffled',
    description: `${data.value.length} rows shuffled`,
    color: 'info',
  })
}

function sortByPriority() {
  data.value = [...data.value].sort((a, b) => a.priority - b.priority)
  toast.add({
    title: 'Sorted by Priority',
    description: 'Rows sorted by priority order',
    color: 'success',
  })
}

function sortByStatus() {
  const statusOrder = ['completed', 'in-progress', 'pending', 'cancelled']
  data.value = [...data.value].sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
  )
  toast.add({
    title: 'Sorted by Status',
    description: 'Rows sorted by status order',
    color: 'success',
  })
}

function reverseRows() {
  data.value = [...data.value].reverse()
  toast.add({
    title: 'Rows Reversed',
    description: 'Row order has been reversed',
    color: 'info',
  })
}

function addRow() {
  const newId = Math.max(...data.value.map((d) => d.id)) + 1
  const newTask: Task = {
    id: newId,
    name: `New Task ${newId}`,
    status: statuses[Math.floor(Math.random() * statuses.length)]!,
    priority: newId,
    assignee: assignees[Math.floor(Math.random() * assignees.length)]!,
    dueDate: '2024-02-15',
    category: categories[Math.floor(Math.random() * categories.length)]!,
  }

  data.value = [...data.value, newTask]
  toast.add({
    title: 'Row Added',
    description: `Task ${newId} has been added`,
    color: 'success',
  })
}

function removeLastRow() {
  if (data.value.length > 0) {
    const removed = data.value[data.value.length - 1]!
    data.value = data.value.slice(0, -1)
    toast.add({
      title: 'Row Removed',
      description: `Task ${removed.id} has been removed`,
      color: 'warning',
    })
  }
}

function resetData() {
  data.value = [...initialData]
  toast.add({
    title: 'Data Reset',
    description: `Reset to ${initialData.length} rows`,
    color: 'neutral',
  })
}

const easingOptions = [
  { label: 'Ease Out', value: 'ease-out' },
  { label: 'Ease In-Out', value: 'ease-in-out' },
  { label: 'Ease In', value: 'ease-in' },
  { label: 'Linear', value: 'linear' },
]

const presetOptions: Array<{ label: string; value: NuGridAnimationPreset }> = [
  { label: 'Refresh (default)', value: 'refresh' },
  { label: 'Fade', value: 'fade' },
  { label: 'Slide', value: 'slide' },
  { label: 'Scale', value: 'scale' },
]

const exampleCode = `<NuGrid
  :data="data"
  :columns="columns"
  :animation="{
    enabled: true,
    duration: 300,
    easing: 'ease-out'
  }"
/>

<!-- Or disable animations -->
<NuGrid
  :data="data"
  :columns="columns"
  :animation="false"
/>`
</script>

<template>
  <DemoLayout id="animation-demo" title="Row Animation Demo" info-label="About Row Animations">
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Rows" :value="data.length" />
      <DemoStatusItem
        label="Animation"
        :value="animationEnabled ? 'Enabled' : 'Disabled'"
        :color="animationEnabled ? 'text-success' : 'text-warning'"
      />
      <DemoStatusItem
        label="Virtualization"
        :value="virtualizationEnabled ? 'On' : 'Off'"
        :color="virtualizationEnabled ? 'text-info' : 'text-dimmed'"
      />
      <template v-if="animationEnabled">
        <DemoStatusItem label="Preset" :value="animationPreset" />
        <DemoStatusItem label="Duration" :value="`${animationDuration}ms`" />
        <DemoStatusItem label="Easing" :value="animationEasing" />
      </template>
      <DemoStatusItem label="Focus Mode" :value="focusModeLabel" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Animation">
        <UButton
          block
          :color="animationEnabled ? 'success' : 'warning'"
          :variant="animationEnabled ? 'solid' : 'outline'"
          icon="i-lucide-sparkles"
          size="sm"
          @click="animationEnabled = !animationEnabled"
        >
          {{ animationEnabled ? 'Enabled' : 'Disabled' }}
        </UButton>
      </DemoControlGroup>

      <template v-if="animationEnabled">
        <DemoControlGroup label="Duration">
          <div class="grid grid-cols-4 gap-1">
            <UButton
              v-for="dur in [150, 300, 500, 1000]"
              :key="dur"
              :color="animationDuration === dur ? 'primary' : 'neutral'"
              :variant="animationDuration === dur ? 'solid' : 'outline'"
              size="xs"
              @click="animationDuration = dur"
            >
              {{ dur === 1000 ? '1s' : `${dur}ms` }}
            </UButton>
          </div>
        </DemoControlGroup>

        <DemoControlGroup label="Easing">
          <USelectMenu
            v-model="animationEasing"
            :items="easingOptions"
            value-key="value"
            size="sm"
          />
        </DemoControlGroup>

        <DemoControlGroup label="Preset">
          <USelectMenu
            v-model="animationPreset"
            :items="presetOptions"
            value-key="value"
            size="sm"
          />
        </DemoControlGroup>
      </template>

      <DemoControlGroup label="Virtualization">
        <UButton
          block
          :color="virtualizationEnabled ? 'info' : 'neutral'"
          :variant="virtualizationEnabled ? 'solid' : 'outline'"
          icon="i-lucide-layers"
          size="sm"
          @click="virtualizationEnabled = !virtualizationEnabled"
        >
          {{ virtualizationEnabled ? 'Virtual' : 'Standard' }}
        </UButton>
      </DemoControlGroup>

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
          <UButton color="primary" icon="i-lucide-shuffle" size="xs" @click="shuffleRows">
            Shuffle
          </UButton>
          <UButton color="info" icon="i-lucide-arrow-up-down" size="xs" @click="sortByPriority">
            Priority
          </UButton>
          <UButton color="info" icon="i-lucide-filter" size="xs" @click="sortByStatus">
            Status
          </UButton>
          <UButton color="neutral" icon="i-lucide-arrow-down-up" size="xs" @click="reverseRows">
            Reverse
          </UButton>
          <UButton color="success" icon="i-lucide-plus" size="xs" @click="addRow"> Add </UButton>
          <UButton color="warning" icon="i-lucide-minus" size="xs" @click="removeLastRow">
            Remove
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
        This page demonstrates the row animation feature for NuGrid. Animations are triggered when
        rows change position due to sorting, filtering, or data changes.
      </p>

      <div class="mb-3 rounded bg-default/50 p-2 text-sm text-dimmed">
        <strong>Animation Options:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li><strong>enabled:</strong> Enable or disable row animations (default: false)</li>
          <li><strong>duration:</strong> Animation duration in milliseconds (default: 300ms)</li>
          <li><strong>easing:</strong> CSS easing function for animations (default: 'ease-out')</li>
        </ul>
      </div>

      <div class="rounded bg-default/50 p-2 text-sm text-dimmed">
        <strong>How It Works:</strong>
        <p class="mt-1">
          NuGrid uses Vue's TransitionGroup with FLIP animations. When the data order changes, Vue
          tracks each row by its key and smoothly animates it from its old to new position.
        </p>
      </div>
    </template>

    <!-- Grid (scrollable in both directions via DemoLayout container) -->
    <NuGrid
      ref="table"
      v-model:sorting="sorting"
      :data="data"
      :columns="columns"
      :animation="animationOptions"
      :virtualization="virtualizationEnabled ? { enabled: true, estimateSize: 40 } : false"
      :focus="{ mode: focusMode }"
      :layout="{ mode: 'div', stickyHeaders: true }"
      :editing="{ enabled: true, startClicks: 'double' }"
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
                <strong>Disabled by default:</strong> Animations are off by default to match the
                current behavior and avoid unexpected performance impact
              </li>
              <li>
                <strong>Works with virtualization:</strong> Visible rows animate smoothly when data
                order changes. Rows scrolling into view appear instantly.
              </li>
              <li>
                <strong>FLIP technique:</strong> Non-virtualized grids use Vue's TransitionGroup
                FLIP. Virtualized grids use CSS transitions on transforms.
              </li>
              <li>
                <strong>Customizable timing:</strong> Duration and easing can be adjusted to match
                your design requirements
              </li>
              <li>
                <strong>Enter/Leave animations:</strong> New rows fade in, removed rows fade out
                (non-virtualized mode only)
              </li>
            </ul>
          </div>
        </template>
      </UAccordion>
    </template>
  </DemoLayout>
</template>
