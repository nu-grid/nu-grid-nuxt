<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

interface User {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive'
}

const data = ref<User[]>([
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', status: 'active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', status: 'inactive' },
  { id: 3, name: 'Carol White', email: 'carol@example.com', status: 'active' },
  { id: 4, name: 'David Brown', email: 'david@example.com', status: 'active' },
])

const columns: NuGridColumn<User>[] = [
  { accessorKey: 'id', header: 'ID', size: 60, enableEditing: false },
  { accessorKey: 'name', header: 'Name', size: 150 },
  { accessorKey: 'email', header: 'Email', size: 200 },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 100,
    cell: ({ row }) =>
      h(
        'span',
        { class: row.original.status === 'active' ? 'text-success' : 'text-muted' },
        row.original.status,
      ),
  },
]

const selectedRows = ref({})
const eventLog = ref<string[]>([])

function logEvent(type: string, message: string) {
  const time = new Date().toLocaleTimeString()
  eventLog.value.unshift(`[${time}] ${type}: ${message}`)
  if (eventLog.value.length > 8) eventLog.value.pop()
}

function onCellValueChanged(event: { row: any; column: any; oldValue: any; newValue: any }) {
  logEvent('cell-value-changed', `${event.column.id}: "${event.oldValue}" → "${event.newValue}"`)
}

function onSelectionChanged(selection: Record<string, boolean>) {
  const count = Object.values(selection).filter(Boolean).length
  logEvent('row-selection-changed', `${count} row(s) selected`)
}

function onFocusedCellChanged(event: { rowId: string | null; columnId: string | null }) {
  logEvent(
    'focused-cell-changed',
    `Row: ${event.rowId ?? 'none'}, Col: ${event.columnId ?? 'none'}`,
  )
}

function clearLog() {
  eventLog.value = []
}
</script>

<template>
  <div class="space-y-4">
    <div class="grid md:grid-cols-2 gap-4">
      <div>
        <NuGrid
          v-model:selected-rows="selectedRows"
          :data="data"
          :columns="columns"
          :row-selection="{ mode: 'multi' }"
          :editing="{ enabled: true, startClicks: 'double' }"
          :focus="{ mode: 'cell', retain: true }"
          @cell-value-changed="onCellValueChanged"
          @row-selection-changed="onSelectionChanged"
          @focused-cell-changed="onFocusedCellChanged"
        />
      </div>

      <div class="rounded-lg border border-default p-4 bg-elevated/30">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-sm">Event Log</h3>
          <UButton size="xs" variant="ghost" @click="clearLog">Clear</UButton>
        </div>

        <ul v-if="eventLog.length > 0" class="space-y-2 text-xs font-mono">
          <li v-for="(event, i) in eventLog" :key="i" class="p-2 bg-default/50 rounded text-muted">
            {{ event }}
          </li>
        </ul>

        <p v-else class="text-muted text-sm text-center py-4">
          Interact with the grid to see events logged here
        </p>
      </div>
    </div>

    <div class="rounded-lg border border-default p-3 bg-elevated/30 text-sm">
      <p class="font-medium mb-2">Try these interactions:</p>
      <ul class="text-xs text-muted space-y-1">
        <li>Click cells to change focus → <code>focused-cell-changed</code></li>
        <li>Double-click to edit, then Tab/Enter → <code>cell-value-changed</code></li>
        <li>Select/deselect rows → <code>row-selection-changed</code></li>
      </ul>
    </div>
  </div>
</template>
