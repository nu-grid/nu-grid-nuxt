<script setup lang="ts">
import type { NuGrid } from '#components'
import type { NuGridColumn } from '#nu-grid/types'

// Sample data - enough rows to demonstrate scrolling
interface Employee {
  id: number
  name: string
  email: string
  department: string
  salary: number
}

// Generate 50 rows for scrolling demonstration
const departments: [string, ...string[]] = [
  'Engineering',
  'Marketing',
  'HR',
  'Sales',
  'Finance',
  'Operations',
  'Legal',
  'Support',
]
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
  'Kate',
  'Leo',
  'Mia',
  'Noah',
  'Olivia',
  'Paul',
  'Quinn',
  'Rose',
  'Sam',
  'Tina',
]
const lastNames = [
  'Johnson',
  'Smith',
  'White',
  'Brown',
  'Davis',
  'Wilson',
  'Taylor',
  'Anderson',
  'Thomas',
  'Garcia',
]

// Deterministic salary based on index to avoid SSR hydration mismatch
const getSalary = (i: number) => 50000 + ((i * 7919) % 80000)

const data = ref<Employee[]>(
  Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    email: `user${i + 1}@example.com`,
    department: departments[i % departments.length] ?? departments[0],
    salary: getSalary(i),
  })),
)

const columns: NuGridColumn<Employee>[] = [
  { accessorKey: 'id', header: 'ID', minSize: 60, maxSize: 80 },
  { accessorKey: 'name', header: 'Name', minSize: 150 },
  { accessorKey: 'email', header: 'Email', minSize: 200 },
  { accessorKey: 'department', header: 'Department', minSize: 120 },
  { accessorKey: 'salary', header: 'Salary', minSize: 100, cellDataType: 'number' },
]

// Two-way bound focused row ID
const focusedRowId = ref<string | null>(null)

// Grid ref for calling focusRowById directly with options
const gridRef = ref<{
  focusRowById: (id: string, options?: { align?: 'nearest' | 'top' | 'center' }) => void
} | null>(null)

// Scroll alignment option
const scrollAlign = ref<'nearest' | 'top' | 'center'>('nearest')

// Sticky headers toggle
const stickyHeaders = ref(true)

// Manual ID input
const manualRowId = ref('')

// Computed display value
const focusedRowDisplay = computed(() => {
  if (!focusedRowId.value) return 'None'
  const row = data.value.find((r) => String(r.id) === focusedRowId.value)
  return row ? `${row.name} (ID: ${row.id})` : focusedRowId.value
})

// Control functions - use focusRowById for alignment support
function focusFirstRow() {
  gridRef.value?.focusRowById('1', { align: scrollAlign.value })
}

function focusLastRow() {
  if (!data.value.length) return

  const lastId = String(data.value[data.value.length - 1]?.id)
  gridRef.value?.focusRowById(lastId, { align: scrollAlign.value })
}

function focusMiddleRow() {
  if (!data.value.length) return

  const middleIndex = Math.floor(data.value.length / 2)
  const middleId = String(data.value[middleIndex]?.id)
  gridRef.value?.focusRowById(middleId, { align: scrollAlign.value })
}

function focusRandomRow() {
  if (!data.value.length) return

  const randomIndex = Math.floor(Math.random() * data.value.length)
  const randomId = String(data.value[randomIndex]?.id)
  gridRef.value?.focusRowById(randomId, { align: scrollAlign.value })
}

function clearFocus() {
  focusedRowId.value = null
}

function tryInvalidId() {
  focusedRowId.value = 'invalid-id-999'
}

function applyManualId() {
  if (manualRowId.value.trim()) {
    gridRef.value?.focusRowById(manualRowId.value.trim(), { align: scrollAlign.value })
  }
}

const exampleCode = `<script setup>
const focusedRowId = ref<string | null>(null)
const gridRef = ref()

// Focus a row with scroll alignment
function focusRow(id: string) {
  gridRef.value?.focusRowById(id, { align: 'top' })
}
<\/script>

<template>
  <NuGrid
    ref="gridRef"
    v-model:focused-row-id="focusedRowId"
    :data="data"
    :columns="columns"
    :focus="{ mode: 'cell' }"
  />
</template>`
</script>

<template>
  <DemoLayout
    id="focused-row-demo"
    title="Focused Row ID Demo"
    info-label="About Focused Row Binding"
  >
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Focused Row" :value="focusedRowDisplay" color="text-primary" />
      <DemoStatusItem label="Raw ID" :value="focusedRowId ?? 'null'" />
      <DemoStatusItem label="Scroll Align" :value="scrollAlign" />
      <DemoStatusItem label="Sticky Headers" :value="stickyHeaders ? 'On' : 'Off'" />
      <DemoStatusItem label="Total Rows" :value="data.length" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Focus Control">
        <div class="space-y-1">
          <UButton block color="primary" variant="solid" size="xs" @click="focusFirstRow">
            Focus First Row
          </UButton>
          <UButton block color="primary" variant="solid" size="xs" @click="focusMiddleRow">
            Focus Middle Row
          </UButton>
          <UButton block color="primary" variant="solid" size="xs" @click="focusLastRow">
            Focus Last Row
          </UButton>
          <UButton block color="primary" variant="outline" size="xs" @click="focusRandomRow">
            Focus Random Row
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Clear Focus">
        <div class="space-y-1">
          <UButton block color="warning" variant="subtle" size="xs" @click="clearFocus">
            Clear Focus (null)
          </UButton>
          <UButton block color="error" variant="subtle" size="xs" @click="tryInvalidId">
            Try Invalid ID
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Scroll Alignment">
        <div class="space-y-1">
          <UButton
            block
            :color="scrollAlign === 'nearest' ? 'primary' : 'neutral'"
            :variant="scrollAlign === 'nearest' ? 'solid' : 'outline'"
            size="xs"
            @click="scrollAlign = 'nearest'"
          >
            Nearest (default)
          </UButton>
          <UButton
            block
            :color="scrollAlign === 'top' ? 'primary' : 'neutral'"
            :variant="scrollAlign === 'top' ? 'solid' : 'outline'"
            size="xs"
            @click="scrollAlign = 'top'"
          >
            Scroll to Top
          </UButton>
          <UButton
            block
            :color="scrollAlign === 'center' ? 'primary' : 'neutral'"
            :variant="scrollAlign === 'center' ? 'solid' : 'outline'"
            size="xs"
            @click="scrollAlign = 'center'"
          >
            Center
          </UButton>
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Grid Options">
        <div class="flex items-center justify-between">
          <span class="text-sm">Sticky Headers</span>
          <USwitch v-model="stickyHeaders" />
        </div>
      </DemoControlGroup>

      <DemoControlGroup label="Manual ID Input">
        <div class="space-y-2">
          <UInput
            v-model="manualRowId"
            placeholder="Enter row ID (1-50)..."
            size="sm"
            @keyup.enter="applyManualId"
          />
          <UButton
            block
            color="neutral"
            variant="outline"
            size="xs"
            :disabled="!manualRowId.trim()"
            @click="applyManualId"
          >
            Apply ID
          </UButton>
        </div>
      </DemoControlGroup>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        This demo shows the
        <code class="rounded bg-default/50 px-1">v-model:focused-row-id</code> two-way binding and
        the <code class="rounded bg-default/50 px-1">focusRowById()</code> method with scroll
        alignment options.
      </p>
      <ul class="mb-3 list-inside list-disc space-y-1 text-sm text-muted">
        <li>Setting the ID externally scrolls to and focuses that row</li>
        <li>
          Use <code class="rounded bg-default/50 px-1">focusRowById(id, { align: 'top' })</code> to
          scroll row to top
        </li>
        <li>
          Alignment options: <code class="rounded bg-default/50 px-1">nearest</code>,
          <code class="rounded bg-default/50 px-1">top</code>,
          <code class="rounded bg-default/50 px-1">center</code>
        </li>
        <li>Invalid IDs are logged as warnings and ignored</li>
      </ul>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Tip:</strong> Select an alignment mode, then use the focus buttons to see the
        difference in scroll behavior.
      </div>
    </template>

    <!-- Grid -->
    <div class="h-96 overflow-hidden rounded-lg border border-default">
      <NuGrid
        ref="gridRef"
        v-model:focused-row-id="focusedRowId"
        :data="data"
        :columns="columns"
        :focus="{ mode: 'cell', alignOnModel: 'top' }"
        :layout="{ stickyHeaders }"
      />
    </div>

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Two-Way Binding:" :code="exampleCode" />
    </template>
  </DemoLayout>
</template>
