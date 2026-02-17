<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface User {
  id: number
  name: string
  email: string
  department: string
  role: string
}

const data = ref<User[]>([
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    department: 'Engineering',
    role: 'Developer',
  },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', department: 'Marketing', role: 'Manager' },
  {
    id: 3,
    name: 'Carol White',
    email: 'carol@example.com',
    department: 'Engineering',
    role: 'Lead',
  },
  {
    id: 4,
    name: 'David Brown',
    email: 'david@example.com',
    department: 'Sales',
    role: 'Representative',
  },
  { id: 5, name: 'Emma Davis', email: 'emma@example.com', department: 'HR', role: 'Coordinator' },
  {
    id: 6,
    name: 'Frank Miller',
    email: 'frank@example.com',
    department: 'Engineering',
    role: 'Developer',
  },
  { id: 7, name: 'Grace Lee', email: 'grace@example.com', department: 'Finance', role: 'Analyst' },
  {
    id: 8,
    name: 'Henry Wilson',
    email: 'henry@example.com',
    department: 'Marketing',
    role: 'Designer',
  },
])

const columns: NuGridColumn<User>[] = [
  { accessorKey: 'id', header: 'ID', size: 60 },
  { accessorKey: 'name', header: 'Name', size: 150 },
  { accessorKey: 'email', header: 'Email', size: 200 },
  { accessorKey: 'department', header: 'Department', size: 120 },
  { accessorKey: 'role', header: 'Role', size: 120 },
]

const focusMode = ref<'cell' | 'row'>('cell')
const focusedRowId = ref<string | null>(null)
const focusedColumnId = ref<string | null>(null)

const focusOptions = computed(() => ({
  mode: focusMode.value,
}))

function onFocusedCellChanged(event: { rowId: string | null; columnId: string | null }) {
  focusedColumnId.value = event.columnId
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <span class="text-sm font-medium">Focus Mode:</span>
      <UFieldGroup>
        <UButton
          :color="focusMode === 'cell' ? 'primary' : 'neutral'"
          :variant="focusMode === 'cell' ? 'solid' : 'outline'"
          size="sm"
          @click="focusMode = 'cell'"
        >
          Cell
        </UButton>
        <UButton
          :color="focusMode === 'row' ? 'primary' : 'neutral'"
          :variant="focusMode === 'row' ? 'solid' : 'outline'"
          size="sm"
          @click="focusMode = 'row'"
        >
          Row
        </UButton>
      </UFieldGroup>
    </div>

    <div class="rounded-lg border border-default p-3 bg-elevated/30 text-sm">
      <div class="flex items-center gap-6">
        <div>
          <span class="text-muted">Focused Row:</span>
          <span class="ml-2 font-mono">{{ focusedRowId ?? 'none' }}</span>
        </div>
        <div v-if="focusMode === 'cell'">
          <span class="text-muted">Focused Column:</span>
          <span class="ml-2 font-mono">{{ focusedColumnId ?? 'none' }}</span>
        </div>
      </div>
      <div class="mt-2 text-xs text-muted">
        Click a cell to focus, then use Arrow keys, Tab, Home, End, Page Up/Down to navigate.
      </div>
    </div>

    <NuGrid
      v-model:focused-row-id="focusedRowId"
      :data="data"
      :columns="columns"
      :focus="focusOptions"
      @focused-cell-changed="onFocusedCellChanged"
    />
  </div>
</template>
