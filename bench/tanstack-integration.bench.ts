/**
 * TanStack Table Integration Benchmarks
 *
 * Creates real TanStack table instances with Vue reactivity to measure
 * the actual overhead of the TanStack runtime in NuGrid's data pipeline.
 *
 * Run with: pnpm bench
 */
import { bench, describe } from 'vitest'
import { computed, nextTick, ref, watch } from 'vue'
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type ExpandedState,
  type ColumnPinningState,
  type VisibilityState,
  type ColumnSizingState,
  getCoreRowModel,
  useVueTable,
} from '@tanstack/vue-table'

// ═══════════════════════════════════════════════════════════════════════════
// Test data
// ═══════════════════════════════════════════════════════════════════════════

interface TestRow {
  id: string
  name: string
  amount: number
  category: string
  status: string
  date: string
}

function generateRows(count: number): TestRow[] {
  const rows: TestRow[] = []
  for (let i = 0; i < count; i++) {
    rows.push({
      id: `row-${i}`,
      name: `Item ${i}`,
      amount: Math.round(Math.random() * 10000) / 100,
      category: ['A', 'B', 'C', 'D', 'E'][i % 5]!,
      status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'pending' : 'closed',
      date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    })
  }
  return rows
}

const columns: ColumnDef<TestRow>[] = [
  { accessorKey: 'id', header: 'ID', size: 60 },
  { accessorKey: 'name', header: 'Name', size: 200 },
  { accessorKey: 'amount', header: 'Amount', size: 120 },
  { accessorKey: 'category', header: 'Category', size: 100 },
  { accessorKey: 'status', header: 'Status', size: 100 },
  { accessorKey: 'date', header: 'Date', size: 120 },
]

const rows1K = generateRows(1_000)
const rows10K = generateRows(10_000)

// ═══════════════════════════════════════════════════════════════════════════
// Helper: create a TanStack table with NuGrid's state pattern
// ═══════════════════════════════════════════════════════════════════════════

function valueUpdater<T>(updaterOrValue: T | ((old: T) => T), target: { value: T }) {
  target.value = typeof updaterOrValue === 'function'
    ? (updaterOrValue as (old: T) => T)(target.value)
    : updaterOrValue
}

function createNuGridTable(data: TestRow[]) {
  const dataRef = ref(data) as { value: TestRow[] }
  const sortingState = ref<SortingState>([])
  const rowSelectionState = ref<RowSelectionState>({})
  const expandedState = ref<ExpandedState>({})
  const columnPinningState = ref<ColumnPinningState>({ left: [], right: [] })
  const columnVisibilityState = ref<VisibilityState>({})
  const columnSizingState = ref<ColumnSizingState>({})

  const tableApi = useVueTable({
    get data() { return dataRef.value },
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualFiltering: true,
    onSortingChange: (updater) => valueUpdater(updater, sortingState),
    onRowSelectionChange: (updater) => valueUpdater(updater, rowSelectionState),
    onExpandedChange: (updater) => valueUpdater(updater, expandedState),
    onColumnPinningChange: (updater) => valueUpdater(updater, columnPinningState),
    onColumnVisibilityChange: (updater) => valueUpdater(updater, columnVisibilityState),
    onColumnSizingChange: (updater) => valueUpdater(updater, columnSizingState),
    state: {
      get sorting() { return sortingState.value },
      get rowSelection() { return rowSelectionState.value },
      get expanded() { return expandedState.value },
      get columnPinning() { return columnPinningState.value },
      get columnVisibility() { return columnVisibilityState.value },
      get columnSizing() { return columnSizingState.value },
    },
  })

  return { tableApi, dataRef, sortingState, rowSelectionState, columnSizingState }
}

// ═══════════════════════════════════════════════════════════════════════════
// Benchmarks
// ═══════════════════════════════════════════════════════════════════════════

describe('TanStack Integration: table creation', () => {
  bench('create table with 1K rows', () => {
    createNuGridTable(rows1K)
  })

  bench('create table with 10K rows', () => {
    createNuGridTable(rows10K)
  })
})

describe('TanStack Integration: getRowModel()', () => {
  const { tableApi: table1K } = createNuGridTable(rows1K)
  const { tableApi: table10K } = createNuGridTable(rows10K)

  bench('getRowModel() 1K rows (cached)', () => {
    void table1K.getRowModel()
  })

  bench('getRowModel() 10K rows (cached)', () => {
    void table10K.getRowModel()
  })

  bench('getRowModel().rows iterate 1K', () => {
    const model = table1K.getRowModel()
    for (const row of model.rows) {
      void row.id
    }
  })

  bench('getRowModel().rows iterate 10K', () => {
    const model = table10K.getRowModel()
    for (const row of model.rows) {
      void row.id
    }
  })
})

describe('TanStack Integration: row.getVisibleCells()', () => {
  const { tableApi: table1K } = createNuGridTable(rows1K)

  // Warm up
  table1K.getRowModel()

  bench('getVisibleCells() × first 100 rows (allocates each call)', () => {
    const rows = table1K.getRowModel().rows
    for (let i = 0; i < 100; i++) {
      void rows[i]!.getVisibleCells()
    }
  })

  bench('getVisibleCells() × first 100 rows × 3 calls each (no cache)', () => {
    const rows = table1K.getRowModel().rows
    for (let i = 0; i < 100; i++) {
      // TanStack creates new array each call
      void rows[i]!.getVisibleCells()
      void rows[i]!.getVisibleCells()
      void rows[i]!.getVisibleCells()
    }
  })
})

describe('TanStack Integration: row.getValue()', () => {
  const { tableApi } = createNuGridTable(rows1K)
  const rows = tableApi.getRowModel().rows

  bench('getValue × 1K rows × 6 columns', () => {
    for (const row of rows) {
      row.getValue('id')
      row.getValue('name')
      row.getValue('amount')
      row.getValue('category')
      row.getValue('status')
      row.getValue('date')
    }
  })

  bench('direct data access × 1K rows × 6 columns', () => {
    for (const row of rows) {
      void row.original.id
      void row.original.name
      void row.original.amount
      void row.original.category
      void row.original.status
      void row.original.date
    }
  })
})

describe('TanStack Integration: getState() reactive overhead', () => {
  const { tableApi } = createNuGridTable(rows1K)

  bench('table.getState() — reads all state × 10K', () => {
    for (let i = 0; i < 10_000; i++) {
      void tableApi.getState()
    }
  })

  bench('table.getState().columnSizing — reads all but needs 1 × 10K', () => {
    for (let i = 0; i < 10_000; i++) {
      void tableApi.getState().columnSizing
    }
  })
})

describe('TanStack Integration: state writes (valueUpdater path)', () => {
  const { sortingState, rowSelectionState, tableApi } = createNuGridTable(rows1K)

  bench('setSorting via valueUpdater × 1K', () => {
    for (let i = 0; i < 1000; i++) {
      tableApi.setSorting([{ id: 'name', desc: i % 2 === 0 }])
    }
  })

  bench('direct ref.value write × 1K', () => {
    for (let i = 0; i < 1000; i++) {
      sortingState.value = [{ id: 'name', desc: i % 2 === 0 }]
    }
  })

  bench('setRowSelection via valueUpdater × 1K', () => {
    for (let i = 0; i < 1000; i++) {
      tableApi.setRowSelection({ [`row-${i}`]: true })
    }
  })

  bench('direct rowSelection ref.value write × 1K', () => {
    for (let i = 0; i < 1000; i++) {
      rowSelectionState.value = { [`row-${i}`]: true }
    }
  })
})

describe('TanStack Integration: data update path', () => {
  // This is the critical path: when a cell is edited, NuGrid must
  // notify TanStack that data changed. The old pattern was:
  //   data.value = [...data.value]  (O(n) spread)
  //   + tableApi.setOptions(prev => ({ ...prev, data: newData }))
  //
  // The new pattern:
  //   triggerRef(data)  (O(1))
  //   + engine reads data directly (no setOptions needed)

  bench('old: spread + setOptions for 1K row edit', () => {
    const { tableApi, dataRef } = createNuGridTable(rows1K)
    // Mutate a single row
    dataRef.value[500] = { ...dataRef.value[500]!, amount: 999 }
    // Old pattern: spread to trigger reactivity
    dataRef.value = [...dataRef.value]
    // TanStack requires setOptions to pick up new data
    tableApi.setOptions((prev) => ({ ...prev, data: dataRef.value }))
  })

  bench('old: spread + setOptions for 10K row edit', () => {
    const { tableApi, dataRef } = createNuGridTable(rows10K)
    dataRef.value[5000] = { ...dataRef.value[5000]!, amount: 999 }
    dataRef.value = [...dataRef.value]
    tableApi.setOptions((prev) => ({ ...prev, data: dataRef.value }))
  })
})

describe('TanStack Integration: computed derivation chain', () => {
  // NuGrid has a chain of computed values derived from table state:
  //   data ref → tableApi.getRowModel() → computed rows → template
  // Each link in the chain has overhead from Vue's dependency tracking.

  const { tableApi, dataRef } = createNuGridTable(rows1K)

  // Simulated NuGrid computed chain
  const rowModel = computed(() => tableApi.getRowModel())
  const sortedRows = computed(() => {
    const rows = [...rowModel.value.rows]
    // No actual sort — just the computed overhead
    return rows
  })
  const paginatedRows = computed(() => sortedRows.value.slice(0, 50))

  // Warm up
  void paginatedRows.value

  bench('read through 3-level computed chain × 1K', () => {
    for (let i = 0; i < 1000; i++) {
      void paginatedRows.value
    }
  })

  bench('read table.getRowModel() directly × 1K', () => {
    for (let i = 0; i < 1000; i++) {
      void tableApi.getRowModel()
    }
  })
})

describe('TanStack Integration: column operations', () => {
  const { tableApi } = createNuGridTable(rows1K)

  bench('getAllColumns() × 1K', () => {
    for (let i = 0; i < 1000; i++) {
      void tableApi.getAllColumns()
    }
  })

  bench('getVisibleLeafColumns() × 1K', () => {
    for (let i = 0; i < 1000; i++) {
      void tableApi.getVisibleLeafColumns()
    }
  })

  bench('getAllLeafColumns() × 1K', () => {
    for (let i = 0; i < 1000; i++) {
      void tableApi.getAllLeafColumns()
    }
  })

  bench('getHeaderGroups() × 1K', () => {
    for (let i = 0; i < 1000; i++) {
      void tableApi.getHeaderGroups()
    }
  })
})

describe('TanStack Integration: column.getSize() per render', () => {
  const { tableApi } = createNuGridTable(rows1K)
  const cols = tableApi.getVisibleLeafColumns()

  bench('column.getSize() × 6 cols × 1K renders', () => {
    for (let r = 0; r < 1000; r++) {
      for (const col of cols) {
        void col.getSize()
      }
    }
  })

  bench('column.columnDef.size direct × 6 cols × 1K renders', () => {
    for (let r = 0; r < 1000; r++) {
      for (const col of cols) {
        void col.columnDef.size
      }
    }
  })
})

describe('TanStack Integration: header rendering context', () => {
  const { tableApi } = createNuGridTable(rows1K)
  const headerGroups = tableApi.getHeaderGroups()

  bench('header.getContext() × all headers × 1K renders', () => {
    for (let r = 0; r < 1000; r++) {
      for (const group of headerGroups) {
        for (const header of group.headers) {
          void header.getContext()
        }
      }
    }
  })
})
