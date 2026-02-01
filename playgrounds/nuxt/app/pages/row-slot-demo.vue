<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

// Sample data for the demo
interface Employee {
  id: number
  name: string
  email: string
  department: string
  role: string
  salary: number
  status: 'active' | 'inactive' | 'pending'
  avatar: string
}

const departments = ['Engineering', 'Marketing', 'HR', 'Sales', 'Finance', 'Design'] as const
const roles = [
  'Developer',
  'Manager',
  'Analyst',
  'Designer',
  'Lead',
  'Specialist',
  'Director',
] as const
const statuses: Employee['status'][] = ['active', 'inactive', 'pending']

function generateData(count: number): Employee[] {
  const employees: Employee[] = []
  const firstNames = [
    'Alice',
    'Bob',
    'Carol',
    'David',
    'Emma',
    'Frank',
    'Grace',
    'Henry',
    'Ivy',
    'Jack',
  ]
  const lastNames = [
    'Johnson',
    'Smith',
    'White',
    'Brown',
    'Davis',
    'Miller',
    'Wilson',
    'Taylor',
    'Anderson',
    'Thomas',
  ]

  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[i % firstNames.length]!
    const lastName = lastNames[(i * 3) % lastNames.length]!
    employees.push({
      id: i,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      department: departments[i % departments.length]!,
      role: roles[i % roles.length]!,
      salary: 50000 + (i % 10) * 10000,
      status: statuses[i % statuses.length]!,
      avatar: `https://i.pravatar.cc/40?u=${i}`,
    })
  }
  return employees
}

const data = ref<Employee[]>(generateData(20))

// Toggle between custom row slot and default rendering
const useRowSlot = ref(true)

// Focus mode toggle (only 'row' or 'none' allowed with row slot)
const focusMode = ref<'row' | 'none'>('row')

// Row selection
const selectedRows = ref({})

// Status colors
const statusColors: Record<string, string> = {
  active: 'bg-success/20 text-success',
  inactive: 'bg-error/20 text-error',
  pending: 'bg-warning/20 text-warning',
}

// Columns (still needed for default rendering comparison)
const columns: NuGridColumn<Employee>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 60,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 150,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    size: 200,
  },
  {
    accessorKey: 'department',
    header: 'Department',
    size: 120,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    size: 120,
  },
  {
    accessorKey: 'salary',
    header: 'Salary',
    size: 100,
    cell: ({ row }) => `$${row.original.salary.toLocaleString()}`,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 100,
  },
]

const exampleCode = `<NuGrid :data="data" :columns="columns">
  <template #row="{ row }">
    <div class="flex items-center gap-4 p-3">
      <img :src="row.original.avatar" class="size-10 rounded-full" />
      <div class="flex-1">
        <div class="font-semibold">{{ row.original.name }}</div>
        <div class="text-sm text-muted">{{ row.original.email }}</div>
      </div>
      <div class="text-right">
        <div>{{ row.original.role }}</div>
        <div class="text-sm text-muted">{{ row.original.department }}</div>
      </div>
      <span :class="statusColors[row.original.status]" class="rounded-full px-2 py-1 text-xs">
        {{ row.original.status }}
      </span>
    </div>
  </template>
</NuGrid>`
</script>

<template>
  <DemoLayout id="row-slot-demo" title="Row Slot Demo" info-label="About Row Slot">
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Rows" :value="data.length" />
      <DemoStatusItem
        label="Row Slot"
        :value="useRowSlot ? 'Custom' : 'Default'"
        :color="useRowSlot ? 'text-primary' : 'text-muted'"
      />
      <DemoStatusItem
        label="Focus"
        :value="focusMode === 'none' ? 'Off' : 'Row'"
        :color="focusMode === 'none' ? 'text-muted' : 'text-info'"
      />
      <DemoStatusItem
        label="Selected"
        :value="useRowSlot ? 'N/A' : Object.keys(selectedRows).length"
        :color="useRowSlot ? 'text-muted' : 'text-info'"
      />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Row Rendering">
        <div class="grid grid-cols-2 gap-1">
          <UButton
            :color="useRowSlot ? 'primary' : 'neutral'"
            :variant="useRowSlot ? 'solid' : 'outline'"
            icon="i-lucide-layout-template"
            size="xs"
            @click="useRowSlot = true"
          >
            Custom
          </UButton>
          <UButton
            :color="!useRowSlot ? 'primary' : 'neutral'"
            :variant="!useRowSlot ? 'solid' : 'outline'"
            icon="i-lucide-table"
            size="xs"
            @click="useRowSlot = false"
          >
            Default
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Focus Mode">
        <div class="grid grid-cols-2 gap-1">
          <UButton
            :color="focusMode === 'row' ? 'primary' : 'neutral'"
            :variant="focusMode === 'row' ? 'solid' : 'outline'"
            icon="i-lucide-rows-3"
            size="xs"
            @click="focusMode = 'row'"
          >
            Row
          </UButton>
          <UButton
            :color="focusMode === 'none' ? 'primary' : 'neutral'"
            :variant="focusMode === 'none' ? 'solid' : 'outline'"
            icon="i-lucide-circle-off"
            size="xs"
            @click="focusMode = 'none'"
          >
            Off
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup v-if="!useRowSlot && Object.keys(selectedRows).length > 0">
        <UButton
          block
          color="error"
          variant="subtle"
          icon="i-lucide-trash"
          size="sm"
          @click="selectedRows = {}"
        >
          Clear Selection ({{ Object.keys(selectedRows).length }})
        </UButton>
      </DemoControlGroup>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        The <code class="rounded bg-default px-1 py-0.5 text-xs">#row</code> slot allows you to
        completely replace the default cell rendering with your own custom layout.
      </p>

      <div class="mb-3 rounded bg-warning/10 p-2 text-sm text-muted">
        <strong>Important:</strong> When using the row slot:
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li>Cell editing is automatically disabled</li>
          <li>Row selection is automatically disabled</li>
          <li>Cell focus mode is forced to row focus (or can be disabled)</li>
          <li>You still get keyboard navigation and other row-level features</li>
        </ul>
      </div>

      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Slot Props:</strong>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li>
            <code class="rounded bg-default px-1 py-0.5 text-xs">row</code> - TanStack Row object
          </li>
          <li>
            <code class="rounded bg-default px-1 py-0.5 text-xs">cells</code> - Array of visible
            cells
          </li>
        </ul>
      </div>
    </template>

    <!-- Grid -->
    <div class="h-[400px] overflow-auto">
      <NuGrid
        :key="useRowSlot ? 'custom' : 'default'"
        v-model:selected-rows="selectedRows"
        :data="data"
        :columns="columns"
        :row-selection="{ mode: 'multi' }"
        :focus="{ mode: focusMode }"
        :ui="{
          base: 'w-max min-w-full border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          tr: useRowSlot ? 'hover:bg-elevated/50' : '',
        }"
      >
        <template v-if="useRowSlot" #row="{ row }">
          <div class="flex w-full items-center gap-4 px-4 py-3">
            <img
              :src="row.original.avatar"
              :alt="row.original.name"
              class="size-10 rounded-full ring-2 ring-default"
            />
            <div class="min-w-0 flex-1">
              <div class="truncate font-semibold">{{ row.original.name }}</div>
              <div class="truncate text-sm text-muted">{{ row.original.email }}</div>
            </div>
            <div class="hidden text-right sm:block">
              <div class="font-medium">{{ row.original.role }}</div>
              <div class="text-sm text-muted">{{ row.original.department }}</div>
            </div>
            <div class="hidden text-right md:block">
              <div class="font-medium">${{ row.original.salary.toLocaleString() }}</div>
            </div>
            <span
              :class="statusColors[row.original.status]"
              class="shrink-0 rounded-full px-2 py-1 text-xs font-medium capitalize"
            >
              {{ row.original.status }}
            </span>
          </div>
        </template>
      </NuGrid>
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
