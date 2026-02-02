<script setup lang="ts">
import type {
  NuGridCellClickEvent,
  NuGridCellEditingCancelledEvent,
  NuGridCellEditingStartedEvent,
  NuGridCellValueChangedEvent,
  NuGridColumn,
  NuGridFilterChangedEvent,
  NuGridFocusedCellChangedEvent,
  NuGridFocusedRowChangedEvent,
  NuGridKeydownEvent,
  NuGridRowClickEvent,
  NuGridSortChangedEvent,
} from '#nu-grid/types'

// Sample data
interface Employee {
  id: number
  name: string
  email: string
  department: string
  salary: number
}

const data = ref<Employee[]>([
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    department: 'Engineering',
    salary: 95000,
  },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', department: 'Marketing', salary: 75000 },
  {
    id: 3,
    name: 'Carol White',
    email: 'carol@example.com',
    department: 'Engineering',
    salary: 55000,
  },
  { id: 4, name: 'David Brown', email: 'david@example.com', department: 'HR', salary: 60000 },
  {
    id: 5,
    name: 'Emma Davis',
    email: 'emma@example.com',
    department: 'Engineering',
    salary: 110000,
  },
])

const columns: NuGridColumn<Employee>[] = [
  { accessorKey: 'id', header: 'ID', minSize: 60, maxSize: 80 },
  { accessorKey: 'name', header: 'Name', minSize: 150 },
  { accessorKey: 'email', header: 'Email', minSize: 200 },
  { accessorKey: 'department', header: 'Department', minSize: 120 },
  { accessorKey: 'salary', header: 'Salary', minSize: 100, cellDataType: 'number' },
]

// Event log
interface EventLogEntry {
  id: number
  name: string
  time: string
  payload: string
}

const eventLog = ref<EventLogEntry[]>([])
const maxLogEntries = 50
let eventCounter = 0

const toast = useToast()

// Intercept Enter key to demonstrate event.handled
const interceptEnter = ref(false)

// Event filters
const enabledEvents = ref({
  cellClicked: true,
  cellDoubleClicked: true,
  rowClicked: false,
  rowDoubleClicked: false,
  focusedCellChanged: true,
  focusedRowChanged: false,
  keydown: true,
  cellEditingStarted: true,
  cellEditingCancelled: true,
  cellValueChanged: true,
  sortChanged: true,
  filterChanged: true,
})

function logEvent(name: string, payload: any) {
  eventLog.value.unshift({
    id: ++eventCounter,
    name,
    time: new Date().toLocaleTimeString(),
    payload: JSON.stringify(
      payload,
      (key, value) => {
        // Avoid circular references and verbose objects
        if (key === 'row' || key === 'column' || key === 'cell' || key === 'previousRow') {
          if (value && typeof value === 'object') {
            return value.id ?? value.original?.id ?? '[Object]'
          }
        }
        if (key === 'event') return '[MouseEvent]'
        if (key === 'keyboardEvent') return '[KeyboardEvent]'
        return value
      },
      2,
    ),
  })
  if (eventLog.value.length > maxLogEntries) {
    eventLog.value.pop()
  }
}

function clearLog() {
  eventLog.value = []
}

// Event handlers
function onCellClicked(e: NuGridCellClickEvent<Employee>) {
  if (enabledEvents.value.cellClicked) {
    logEvent('cellClicked', { rowId: e.row.id, columnId: e.column.id, value: e.value })
  }
}

function onCellDoubleClicked(e: NuGridCellClickEvent<Employee>) {
  if (enabledEvents.value.cellDoubleClicked) {
    logEvent('cellDoubleClicked', { rowId: e.row.id, columnId: e.column.id, value: e.value })
  }
}

function onRowClicked(e: NuGridRowClickEvent<Employee>) {
  if (enabledEvents.value.rowClicked) {
    logEvent('rowClicked', { rowId: e.row.id })
  }
}

function onRowDoubleClicked(e: NuGridRowClickEvent<Employee>) {
  if (enabledEvents.value.rowDoubleClicked) {
    logEvent('rowDoubleClicked', { rowId: e.row.id })
  }
}

function onFocusedCellChanged(e: NuGridFocusedCellChangedEvent<Employee>) {
  if (enabledEvents.value.focusedCellChanged) {
    logEvent('focusedCellChanged', {
      rowId: e.rowId,
      columnId: e.columnId,
      rowIndex: e.rowIndex,
      columnIndex: e.columnIndex,
      previousRowIndex: e.previousRowIndex,
      previousColumnIndex: e.previousColumnIndex,
    })
  }
}

function onFocusedRowChanged(e: NuGridFocusedRowChangedEvent<Employee>) {
  if (enabledEvents.value.focusedRowChanged) {
    logEvent('focusedRowChanged', {
      rowId: e.rowId,
      rowIndex: e.rowIndex,
      previousRowIndex: e.previousRowIndex,
    })
  }
}

function onKeydown(e: NuGridKeydownEvent<Employee>) {
  if (enabledEvents.value.keydown) {
    logEvent('keydown', {
      key: e.event.key,
      rowData: e.rowData,
      columnName: e.columnName,
      value: e.value,
    })
  }

  // Demonstrate event.handled - intercept Enter key to prevent editing
  if (interceptEnter.value && e.event.key === 'Enter') {
    e.handled = true
    toast.add({
      title: 'Enter Intercepted',
      description: `Prevented editing "${e.columnName}" for ${e.rowData?.name}`,
      color: 'info',
    })
  }
}

function onCellEditingStarted(e: NuGridCellEditingStartedEvent<Employee>) {
  if (enabledEvents.value.cellEditingStarted) {
    logEvent('cellEditingStarted', { rowId: e.row.id, columnId: e.column.id, value: e.value })
  }
}

function onCellEditingCancelled(e: NuGridCellEditingCancelledEvent<Employee>) {
  if (enabledEvents.value.cellEditingCancelled) {
    logEvent('cellEditingCancelled', { rowId: e.row.id, columnId: e.column.id, value: e.value })
  }
}

function onCellValueChanged(e: NuGridCellValueChangedEvent<Employee>) {
  if (enabledEvents.value.cellValueChanged) {
    logEvent('cellValueChanged', {
      rowId: e.row.id,
      columnId: e.column.id,
      oldValue: e.oldValue,
      newValue: e.newValue,
    })
  }
}

function onSortChanged(e: NuGridSortChangedEvent) {
  if (enabledEvents.value.sortChanged) {
    logEvent('sortChanged', { sorting: e.sorting })
  }
}

function onFilterChanged(e: NuGridFilterChangedEvent) {
  if (enabledEvents.value.filterChanged) {
    logEvent('filterChanged', { columnFilters: e.columnFilters })
  }
}

// Color coding for event types
function getEventColor(name: string): string {
  const colors: Record<string, string> = {
    cellClicked: 'text-blue-500',
    cellDoubleClicked: 'text-blue-600',
    rowClicked: 'text-cyan-500',
    rowDoubleClicked: 'text-cyan-600',
    focusedCellChanged: 'text-purple-500',
    focusedRowChanged: 'text-purple-600',
    keydown: 'text-pink-500',
    cellEditingStarted: 'text-green-500',
    cellEditingCancelled: 'text-orange-500',
    cellValueChanged: 'text-emerald-500',
    sortChanged: 'text-amber-500',
    filterChanged: 'text-amber-600',
  }
  return colors[name] ?? 'text-muted'
}

const exampleCode = `<NuGrid
  :data="data"
  :columns="columns"
  @cell-clicked="onCellClicked"
  @cell-double-clicked="onCellDoubleClicked"
  @row-clicked="onRowClicked"
  @row-double-clicked="onRowDoubleClicked"
  @focused-cell-changed="onFocusedCellChanged"
  @focused-row-changed="onFocusedRowChanged"
  @keydown="onKeydown"
  @cell-editing-started="onCellEditingStarted"
  @cell-editing-cancelled="onCellEditingCancelled"
  @cell-value-changed="onCellValueChanged"
  @sort-changed="onSortChanged"
  @filter-changed="onFilterChanged"
/>`
</script>

<template>
  <DemoLayout id="events-demo" title="Events Demo" info-label="About Events">
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Events Logged" :value="eventLog.length" color="text-primary" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Click Events">
        <div class="space-y-1">
          <UButton
            block
            :color="enabledEvents.cellClicked ? 'primary' : 'neutral'"
            :variant="enabledEvents.cellClicked ? 'solid' : 'outline'"
            size="xs"
            @click="enabledEvents.cellClicked = !enabledEvents.cellClicked"
          >
            cellClicked
          </UButton>
          <UButton
            block
            :color="enabledEvents.cellDoubleClicked ? 'primary' : 'neutral'"
            :variant="enabledEvents.cellDoubleClicked ? 'solid' : 'outline'"
            size="xs"
            @click="enabledEvents.cellDoubleClicked = !enabledEvents.cellDoubleClicked"
          >
            cellDoubleClicked
          </UButton>
          <UButton
            block
            :color="enabledEvents.rowClicked ? 'primary' : 'neutral'"
            :variant="enabledEvents.rowClicked ? 'solid' : 'outline'"
            size="xs"
            @click="enabledEvents.rowClicked = !enabledEvents.rowClicked"
          >
            rowClicked
          </UButton>
          <UButton
            block
            :color="enabledEvents.rowDoubleClicked ? 'primary' : 'neutral'"
            :variant="enabledEvents.rowDoubleClicked ? 'solid' : 'outline'"
            size="xs"
            @click="enabledEvents.rowDoubleClicked = !enabledEvents.rowDoubleClicked"
          >
            rowDoubleClicked
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Focus Events">
        <div class="space-y-1">
          <UButton
            block
            :color="enabledEvents.focusedCellChanged ? 'primary' : 'neutral'"
            :variant="enabledEvents.focusedCellChanged ? 'solid' : 'outline'"
            size="xs"
            @click="enabledEvents.focusedCellChanged = !enabledEvents.focusedCellChanged"
          >
            focusedCellChanged
          </UButton>
          <UButton
            block
            :color="enabledEvents.focusedRowChanged ? 'primary' : 'neutral'"
            :variant="enabledEvents.focusedRowChanged ? 'solid' : 'outline'"
            size="xs"
            @click="enabledEvents.focusedRowChanged = !enabledEvents.focusedRowChanged"
          >
            focusedRowChanged
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Keyboard Events">
        <div class="space-y-1">
          <UButton
            block
            :color="enabledEvents.keydown ? 'primary' : 'neutral'"
            :variant="enabledEvents.keydown ? 'solid' : 'outline'"
            size="xs"
            @click="enabledEvents.keydown = !enabledEvents.keydown"
          >
            keydown
          </UButton>
          <UButton
            block
            :color="interceptEnter ? 'warning' : 'neutral'"
            :variant="interceptEnter ? 'solid' : 'outline'"
            size="xs"
            @click="interceptEnter = !interceptEnter"
          >
            Intercept Enter
          </UButton>
        </div>
        <p v-if="interceptEnter" class="mt-2 text-xs text-muted">
          Enter key will be intercepted via <code class="rounded bg-default/50 px-1">event.handled = true</code>
        </p>
      </DemoControlGroup>

      <DemoControlGroup label="Editing Events">
        <div class="space-y-1">
          <UButton
            block
            :color="enabledEvents.cellEditingStarted ? 'primary' : 'neutral'"
            :variant="enabledEvents.cellEditingStarted ? 'solid' : 'outline'"
            size="xs"
            @click="enabledEvents.cellEditingStarted = !enabledEvents.cellEditingStarted"
          >
            cellEditingStarted
          </UButton>
          <UButton
            block
            :color="enabledEvents.cellEditingCancelled ? 'primary' : 'neutral'"
            :variant="enabledEvents.cellEditingCancelled ? 'solid' : 'outline'"
            size="xs"
            @click="enabledEvents.cellEditingCancelled = !enabledEvents.cellEditingCancelled"
          >
            cellEditingCancelled
          </UButton>
          <UButton
            block
            :color="enabledEvents.cellValueChanged ? 'primary' : 'neutral'"
            :variant="enabledEvents.cellValueChanged ? 'solid' : 'outline'"
            size="xs"
            @click="enabledEvents.cellValueChanged = !enabledEvents.cellValueChanged"
          >
            cellValueChanged
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="State Events">
        <div class="space-y-1">
          <UButton
            block
            :color="enabledEvents.sortChanged ? 'primary' : 'neutral'"
            :variant="enabledEvents.sortChanged ? 'solid' : 'outline'"
            size="xs"
            @click="enabledEvents.sortChanged = !enabledEvents.sortChanged"
          >
            sortChanged
          </UButton>
          <UButton
            block
            :color="enabledEvents.filterChanged ? 'primary' : 'neutral'"
            :variant="enabledEvents.filterChanged ? 'solid' : 'outline'"
            size="xs"
            @click="enabledEvents.filterChanged = !enabledEvents.filterChanged"
          >
            filterChanged
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup v-if="eventLog.length > 0">
        <UButton
          block
          color="error"
          variant="subtle"
          icon="i-lucide-trash"
          size="sm"
          @click="clearLog"
        >
          Clear Log ({{ eventLog.length }})
        </UButton>
      </DemoControlGroup>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        This demo shows all the events emitted by NuGrid. Toggle events in the sidebar to see them
        logged in real-time.
      </p>
      <ul class="mb-3 list-inside list-disc space-y-1 text-sm text-muted">
        <li>
          <strong>Click Events:</strong> cellClicked, cellDoubleClicked, rowClicked,
          rowDoubleClicked
        </li>
        <li><strong>Focus Events:</strong> focusedCellChanged, focusedRowChanged</li>
        <li>
          <strong>Keyboard Events:</strong> keydown (for custom shortcuts like Enter-to-navigate)
        </li>
        <li>
          <strong>Editing Events:</strong> cellEditingStarted, cellEditingCancelled,
          cellValueChanged
        </li>
        <li><strong>State Events:</strong> sortChanged, filterChanged</li>
      </ul>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Tip:</strong> Double-click a cell to edit it, then press Escape to cancel or Enter
        to save. Press any unhandled key (like 'x') to see the keydown event logged.
      </div>
    </template>

    <!-- Grid -->
    <div class="mb-4 overflow-x-auto">
      <NuGrid
        :data="data"
        :columns="columns"
        :focus="{ mode: 'cell' }"
        :editing="{ enabled: true }"
        @cell-clicked="onCellClicked"
        @cell-double-clicked="onCellDoubleClicked"
        @row-clicked="onRowClicked"
        @row-double-clicked="onRowDoubleClicked"
        @focused-cell-changed="onFocusedCellChanged"
        @focused-row-changed="onFocusedRowChanged"
        @keydown="onKeydown"
        @cell-editing-started="onCellEditingStarted"
        @cell-editing-cancelled="onCellEditingCancelled"
        @cell-value-changed="onCellValueChanged"
        @sort-changed="onSortChanged"
        @filter-changed="onFilterChanged"
      />
    </div>

    <!-- Event Log -->
    <div class="rounded-lg border border-default">
      <div
        class="flex items-center justify-between border-b border-default bg-elevated/50 px-4 py-2"
      >
        <h3 class="font-semibold">Event Log</h3>
        <span class="text-sm text-muted">{{ eventLog.length }} events</span>
      </div>
      <div class="max-h-64 overflow-y-auto">
        <div v-if="eventLog.length === 0" class="p-8 text-center text-muted">
          <UIcon name="i-lucide-radio" class="mx-auto mb-2 size-8" />
          <p>No events logged yet. Interact with the grid to see events.</p>
        </div>
        <div v-else class="divide-y divide-default">
          <div
            v-for="entry in eventLog"
            :key="entry.id"
            class="flex items-start gap-3 px-4 py-2 text-sm hover:bg-elevated/30"
          >
            <span class="shrink-0 text-xs text-muted">{{ entry.time }}</span>
            <span :class="['shrink-0 font-medium', getEventColor(entry.name)]">{{
              entry.name
            }}</span>
            <pre class="flex-1 overflow-x-auto whitespace-pre-wrap text-xs text-muted">{{
              entry.payload
            }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Event Listeners:" :code="exampleCode" />
    </template>
  </DemoLayout>
</template>

<style scoped>
code {
  font-family: 'Monaco', 'Courier New', monospace;
}
</style>
