<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'

/**
 * Performance Benchmark Page
 *
 * Renders a real NuGrid with configurable row count and exposes
 * timing measurement functions on window.__PERF__ for Playwright.
 *
 * Works on both the TanStack branch and the NuGrid engine branch.
 */

interface BenchRow {
  id: number
  name: string
  amount: number
  category: string
  status: string
  date: string
}

const ROW_COUNTS = [1000, 5000, 10000] as const
const route = useRoute()
const rowCount = ref(Number(route.query.rows) || 1000)
const data = ref<BenchRow[]>([])
const table = useTemplateRef('table')

// Timing results
const results = ref<{ name: string; ms: number }[]>([])

function generateData(count: number): BenchRow[] {
  const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Sports']
  const statuses = ['active', 'inactive', 'pending']
  const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller']
  const rows: BenchRow[] = []
  for (let i = 0; i < count; i++) {
    rows.push({
      id: i,
      name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
      amount: Math.round(Math.random() * 10000) / 100,
      category: categories[i % categories.length]!,
      status: statuses[i % statuses.length]!,
      date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    })
  }
  return rows
}

const columns: NuGridColumn<BenchRow>[] = [
  { accessorKey: 'id', header: 'ID', size: 60, enableEditing: false },
  { accessorKey: 'name', header: 'Name', size: 200, cellDataType: 'text' },
  { accessorKey: 'amount', header: 'Amount', size: 120, cellDataType: 'number' },
  { accessorKey: 'category', header: 'Category', size: 120, cellDataType: 'text' },
  { accessorKey: 'status', header: 'Status', size: 100, cellDataType: 'text' },
  { accessorKey: 'date', header: 'Date', size: 120, cellDataType: 'text' },
]

const columnSizing = ref({})
const selectedRows = ref<Record<string, boolean>>({})
const sortingState = ref<{ id: string; desc: boolean }[]>([])

// ----- Measurement helpers -----

async function measure(name: string, fn: () => void | Promise<void>) {
  // Force Vue to flush pending updates
  await nextTick()
  const start = performance.now()
  await fn()
  // Wait for Vue to process reactive updates and paint
  await nextTick()
  await nextTick()
  // Wait for one animation frame to ensure paint
  await new Promise(r => requestAnimationFrame(r))
  const elapsed = performance.now() - start
  results.value.push({ name, ms: Math.round(elapsed * 100) / 100 })
  return elapsed
}

// ----- Benchmark operations exposed to Playwright -----

const perfApi = {
  /** Load data and measure initial render time */
  async loadData(count: number) {
    results.value = []
    rowCount.value = count
    return measure(`load ${count} rows`, () => {
      data.value = generateData(count)
    })
  },

  /** Measure single cell edit (mutate + reactivity trigger) */
  async editCell(rowIndex: number) {
    return measure(`edit cell [${rowIndex}]`, () => {
      const row = data.value[rowIndex]
      if (row) {
        data.value[rowIndex] = { ...row, amount: row.amount + 1 }
        // Trigger reactivity the same way NuGrid does
        data.value = [...data.value]
      }
    })
  },

  /** Measure batch edit (update 100 cells at once) */
  async batchEdit(count: number) {
    return measure(`batch edit ${count} cells`, () => {
      for (let i = 0; i < count && i < data.value.length; i++) {
        const row = data.value[i]!
        data.value[i] = { ...row, amount: row.amount + 1 }
      }
      data.value = [...data.value]
    })
  },

  /** Measure sort toggle */
  async toggleSort(columnId: string) {
    return measure(`sort by ${columnId}`, () => {
      const current = sortingState.value.find(s => s.id === columnId)
      if (current) {
        sortingState.value = [{ id: columnId, desc: !current.desc }]
      }
      else {
        sortingState.value = [{ id: columnId, desc: false }]
      }
    })
  },

  /** Measure row selection (select N rows) */
  async selectRows(count: number) {
    return measure(`select ${count} rows`, () => {
      const sel: Record<string, boolean> = {}
      for (let i = 0; i < count && i < data.value.length; i++) {
        sel[String(i)] = true
      }
      selectedRows.value = sel
    })
  },

  /** Measure clear selection */
  async clearSelection() {
    return measure('clear selection', () => {
      selectedRows.value = {}
    })
  },

  /** Measure full data replacement (simulates prop change) */
  async replaceData() {
    const count = data.value.length
    return measure(`replace ${count} rows`, () => {
      data.value = generateData(count)
    })
  },

  /** Measure column resize (update sizing state) */
  async resizeColumn(columnId: string, newSize: number) {
    return measure(`resize ${columnId} to ${newSize}px`, () => {
      columnSizing.value = { ...columnSizing.value, [columnId]: newSize }
    })
  },

  /** Get all collected results */
  getResults() {
    return results.value
  },

  /** Run full benchmark suite */
  async runSuite(count: number) {
    results.value = []

    // 1. Initial load
    await this.loadData(count)
    // Small settle delay
    await new Promise(r => setTimeout(r, 100))

    // 2. Single cell edit
    await this.editCell(Math.floor(count / 2))

    // 3. Batch edit (100 cells)
    await this.batchEdit(100)

    // 4. Sort by name
    await this.toggleSort('name')
    await new Promise(r => setTimeout(r, 50))

    // 5. Sort by amount (second sort)
    await this.toggleSort('amount')
    await new Promise(r => setTimeout(r, 50))

    // 6. Select 100 rows
    await this.selectRows(100)

    // 7. Clear selection
    await this.clearSelection()

    // 8. Column resize
    await this.resizeColumn('name', 300)

    // 9. Full data replace
    await this.replaceData()

    return results.value
  },
}

// Expose API on window for Playwright
onMounted(() => {
  ;(window as any).__PERF__ = perfApi
})

onUnmounted(() => {
  delete (window as any).__PERF__
})

// Auto-load if rows query param is set
onMounted(() => {
  if (route.query.rows) {
    data.value = generateData(rowCount.value)
  }
})
</script>

<template>
  <div class="flex h-screen flex-col">
    <!-- Header with controls -->
    <div class="border-default flex items-center gap-4 border-b p-4">
      <h1 class="text-lg font-bold">
        NuGrid Performance Benchmark
      </h1>
      <div class="flex gap-2">
        <UButton
          v-for="count in ROW_COUNTS"
          :key="count"
          :color="rowCount === count ? 'primary' : 'neutral'"
          :variant="rowCount === count ? 'solid' : 'outline'"
          size="sm"
          @click="perfApi.loadData(count)"
        >
          {{ count.toLocaleString() }} rows
        </UButton>
      </div>
      <UButton color="success" size="sm" @click="perfApi.runSuite(rowCount)">
        Run Suite
      </UButton>
      <span class="text-muted text-sm">{{ data.length.toLocaleString() }} rows loaded</span>
    </div>

    <!-- Results panel -->
    <div v-if="results.length" class="border-default border-b bg-gray-50 p-4 dark:bg-gray-900">
      <div class="flex flex-wrap gap-3">
        <div
          v-for="r in results"
          :key="r.name"
          class="rounded-md bg-white px-3 py-1.5 text-sm shadow-sm dark:bg-gray-800"
        >
          <span class="text-muted">{{ r.name }}:</span>
          <span class="ml-1 font-mono font-bold" :class="r.ms > 100 ? 'text-red-500' : r.ms > 16 ? 'text-amber-500' : 'text-green-500'">
            {{ r.ms }}ms
          </span>
        </div>
      </div>
    </div>

    <!-- Grid -->
    <div class="min-h-0 flex-1">
      <NuGrid
        ref="table"
        v-model:column-sizing="columnSizing"
        v-model:selected-rows="selectedRows"
        :data="data"
        :columns="columns"
        :sorting-options="{ sorting: sortingState }"
        :layout="{ mode: 'div', stickyHeaders: true }"
        virtualization
        row-id="id"
      />
    </div>
  </div>
</template>
