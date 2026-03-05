/**
 * NuGrid Performance Benchmarks
 *
 * Tests the critical hot paths in the grid engine.
 * Run with: pnpm bench
 *
 * These benchmarks compare:
 * - Sorting comparators at scale
 * - Data reactivity patterns (spread copy vs triggerRef)
 * - Visible cells resolution (allocating vs identity-cached)
 * - Range extractor (Set dedup vs linear merge)
 * - State access (eager read-all vs lazy getters)
 * - Filtering at scale
 */
import { bench, describe } from 'vitest'
import { computed, ref } from 'vue'

import {
  compareAlphanumeric,
  compareBasic,
  sortAlphanumeric,
  sortBasic,
  sortText,
} from '../src/runtime/utils/sortingFns'

// ═══════════════════════════════════════════════════════════════════════════
// Test data generators
// ═══════════════════════════════════════════════════════════════════════════

function generateRows(count: number) {
  const rows = []
  for (let i = 0; i < count; i++) {
    rows.push({
      id: `row-${i}`,
      name: `Item ${i} - ${Math.random().toString(36).slice(2, 8)}`,
      amount: Math.round(Math.random() * 10000) / 100,
      date: new Date(2020, 0, 1 + Math.floor(Math.random() * 1500)),
      category: ['A', 'B', 'C', 'D', 'E'][i % 5],
      status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'pending' : 'closed',
      nested: { value: Math.random() * 1000 },
    })
  }
  return rows
}

function generateColumns(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `col-${i}`,
    accessorKey: `field${i}`,
    size: 100 + Math.floor(Math.random() * 200),
  }))
}

// Pre-generate datasets
const rows1K = generateRows(1_000)
const rows10K = generateRows(10_000)
const rows50K = generateRows(50_000)

const alphanumericPairs = rows10K.map((r, i) =>
  [r.name, rows10K[(i + 1) % rows10K.length]!.name] as [string, string],
)

// ═══════════════════════════════════════════════════════════════════════════
// 1. Sorting comparators
// ═══════════════════════════════════════════════════════════════════════════

describe('Sorting: compareBasic', () => {
  const numbers = rows10K.map(r => r.amount)

  bench('sort 10K numbers', () => {
    const arr = [...numbers]
    arr.sort(compareBasic)
  })

  bench('sort 50K numbers', () => {
    const arr = rows50K.map(r => r.amount)
    arr.sort(compareBasic)
  })
})

describe('Sorting: sortAlphanumeric', () => {
  const strings = rows10K.map(r => r.name)

  bench('sort 10K mixed alphanumeric strings', () => {
    const arr = [...strings]
    arr.sort(sortAlphanumeric)
  })
})

describe('Sorting: compareAlphanumeric hot path', () => {
  bench('10K compareAlphanumeric calls', () => {
    for (const [a, b] of alphanumericPairs) {
      compareAlphanumeric(a, b)
    }
  })
})

describe('Sorting: sortText vs sortAlphanumeric', () => {
  const strings = rows10K.map(r => r.name)

  bench('sortText (simple lowercase compare) 10K', () => {
    const arr = [...strings]
    arr.sort(sortText)
  })

  bench('sortAlphanumeric (split + numeric parse) 10K', () => {
    const arr = [...strings]
    arr.sort(sortAlphanumeric)
  })
})

describe('Sorting: full Array.sort pipeline', () => {
  bench('sort 1K rows by numeric field', () => {
    const arr = [...rows1K]
    arr.sort((a, b) => sortBasic(a.amount, b.amount))
  })

  bench('sort 10K rows by numeric field', () => {
    const arr = [...rows10K]
    arr.sort((a, b) => sortBasic(a.amount, b.amount))
  })

  bench('sort 10K rows by string field (alphanumeric)', () => {
    const arr = [...rows10K]
    arr.sort((a, b) => sortAlphanumeric(a.name, b.name))
  })

  bench('multi-sort 10K rows (2 columns)', () => {
    const arr = [...rows10K]
    arr.sort((a, b) => {
      const primary = sortText(a.category, b.category)
      if (primary !== 0) return primary
      return sortBasic(a.amount, b.amount)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 2. Data reactivity patterns — array copy vs in-place trigger
// ═══════════════════════════════════════════════════════════════════════════

describe('Data reactivity: cell edit trigger', () => {
  // Before optimization: data.value = [...data.value] (O(n) shallow copy)
  // After optimization: triggerRef(data) (O(1))
  // We benchmark the array operations themselves (not Vue reactivity)

  bench('spread copy 1K rows (old pattern)', () => {
    const copy = [...rows1K]
    // Simulate mutation
    copy[500] = { ...copy[500]!, amount: 999 }
    // Old: re-spread to trigger reactivity
    void ([...copy])
  })

  bench('spread copy 10K rows (old pattern)', () => {
    const copy = [...rows10K]
    copy[5000] = { ...copy[5000]!, amount: 999 }
    void ([...copy])
  })

  bench('spread copy 50K rows (old pattern)', () => {
    const copy = [...rows50K]
    copy[25000] = { ...copy[25000]!, amount: 999 }
    void ([...copy])
  })

  bench('in-place mutate (new pattern — no copy)', () => {
    // New: mutate in place, then triggerRef() — O(1)
    rows10K[5000] = { ...rows10K[5000]!, amount: 999 }
    // triggerRef is O(1) — just marks the ref dirty
  })
})

describe('Data reactivity: props.data watch', () => {
  // Before: data.value = props.data ? [...props.data] : []
  // After: data.value = props.data ?? []
  // The spread breaks identity for downstream caches

  bench('spread on prop change 10K (old pattern)', () => {
    void ([...rows10K])
  })

  bench('direct assign on prop change (new pattern — zero cost)', () => {
    void (rows10K ?? [])
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 3. getVisibleCells — allocating vs identity-cached
// ═══════════════════════════════════════════════════════════════════════════

describe('getVisibleCells: allocation patterns', () => {
  const columns = generateColumns(30) // typical grid width
  const visibleColumnIds = columns.slice(0, 20).map(c => c.id) // 20 visible
  const allCellsByColumnId: Record<string, { column: { id: string } }> = {}
  for (const col of columns) {
    allCellsByColumnId[col.id] = { column: { id: col.id } }
  }

  // Old TanStack pattern: allocate new array every call
  bench('allocating filter+map per row (old) × 1K rows', () => {
    for (let i = 0; i < 1000; i++) {
      const result = []
      for (const colId of visibleColumnIds) {
        const cell = allCellsByColumnId[colId]
        if (cell) result.push(cell)
      }
      // No cache — always allocates
    }
  })

  // New: identity-cached — skip if visible columns ref unchanged
  let cachedCols: string[] | null = null
  let cachedResult: any[] | null = null

  bench('identity-cached per row (new) × 1K rows', () => {
    for (let i = 0; i < 1000; i++) {
      // Identity check: same reference = return cached
      if (cachedCols === visibleColumnIds) {
        void cachedResult
        continue
      }
      const result = []
      for (const colId of visibleColumnIds) {
        const cell = allCellsByColumnId[colId]
        if (cell) result.push(cell)
      }
      cachedCols = visibleColumnIds
      cachedResult = result
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 4. Range extractor — Set dedup vs linear merge
// ═══════════════════════════════════════════════════════════════════════════

describe('Range extractor: sticky row merging', () => {
  // Simulate a typical scroll frame — viewport of ~20 rows + 3-5 sticky headers
  const viewportRange = Array.from({ length: 25 }, (_, i) => i + 100) // indices 100-124
  const stickyIndexes = [0, 15, 45, 80] // group headers

  bench('Set dedup (old pattern) × 1K frames', () => {
    for (let i = 0; i < 1000; i++) {
      const merged = new Set([...stickyIndexes, ...viewportRange])
      void ([...merged])
    }
  })

  bench('linear merge (new pattern) × 1K frames', () => {
    for (let i = 0; i < 1000; i++) {
      const result = [...viewportRange]
      for (const idx of stickyIndexes) {
        if (!result.includes(idx)) {
          result.push(idx)
        }
      }
      void result
    }
  })

  // Worst case: many sticky rows
  const manyStickyIndexes = Array.from({ length: 20 }, (_, i) => i * 50) // 20 sticky headers
  const largeViewport = Array.from({ length: 50 }, (_, i) => i + 200) // 50 visible rows

  bench('Set dedup large (20 sticky + 50 viewport) × 1K', () => {
    for (let i = 0; i < 1000; i++) {
      const merged = new Set([...manyStickyIndexes, ...largeViewport])
      void ([...merged])
    }
  })

  bench('linear merge large (20 sticky + 50 viewport) × 1K', () => {
    for (let i = 0; i < 1000; i++) {
      const result = [...largeViewport]
      for (const idx of manyStickyIndexes) {
        if (!result.includes(idx)) {
          result.push(idx)
        }
      }
      void result
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 5. getState() — eager vs lazy (Vue reactive context)
// ═══════════════════════════════════════════════════════════════════════════

describe('getState: eager vs lazy with Vue refs', () => {
  // NOTE: The real win from lazy getters is in Vue's reactive dependency tracking.
  // When a computed calls getState().columnSizing, the eager version subscribes
  // to ALL 9 state refs (columnSizing, sorting, selection, expanded, etc.),
  // causing re-evaluation on ANY state change. Lazy getters only subscribe to
  // the accessed property.
  //
  // This benchmark uses real Vue refs to demonstrate the difference.

  // Create 9 independent state refs (simulating StateAccessors)
  const columnSizing = ref({ col1: 100, col2: 200 })
  const columnSizingInfo = ref({ startOffset: 0 })
  const columnPinning = ref({ left: ['col1'], right: [] as string[] })
  const columnVisibility = ref({ col3: false })
  const columnOrder = ref(['col1', 'col2', 'col3'])
  const sorting = ref([{ id: 'col1', desc: false }])
  const grouping = ref([] as string[])
  const rowSelection = ref({} as Record<string, boolean>)
  const expanded = ref({} as Record<string, boolean>)

  // Eager getState: reads all refs, creating deps on all 9
  function eagerGetState() {
    return {
      columnSizing: columnSizing.value,
      columnSizingInfo: columnSizingInfo.value,
      columnPinning: columnPinning.value,
      columnVisibility: columnVisibility.value,
      columnOrder: columnOrder.value,
      sorting: sorting.value,
      grouping: grouping.value,
      rowSelection: rowSelection.value,
      expanded: expanded.value,
    }
  }

  // Lazy getState: only accessed properties create deps
  function lazyGetState() {
    return {
      get columnSizing() { return columnSizing.value },
      get columnSizingInfo() { return columnSizingInfo.value },
      get columnPinning() { return columnPinning.value },
      get columnVisibility() { return columnVisibility.value },
      get columnOrder() { return columnOrder.value },
      get sorting() { return sorting.value },
      get grouping() { return grouping.value },
      get rowSelection() { return rowSelection.value },
      get expanded() { return expanded.value },
    }
  }

  bench('eager: computed reads all 9 refs (only needs columnSizing)', () => {
    const c = computed(() => eagerGetState().columnSizing)
    void c.value
  })

  bench('lazy: computed reads only columnSizing ref', () => {
    const c = computed(() => lazyGetState().columnSizing)
    void c.value
  })

  // Simulate the real impact: how many false re-evaluations happen
  // when unrelated state changes
  bench('eager: 100 unrelated sorting changes trigger recompute', () => {
    let evalCount = 0
    const c = computed(() => {
      evalCount++
      return eagerGetState().columnSizing
    })
    void c.value // initial
    for (let i = 0; i < 100; i++) {
      sorting.value = [{ id: 'col1', desc: i % 2 === 0 }]
      void c.value // forces re-evaluation because sorting ref changed
    }
  })

  bench('lazy: 100 unrelated sorting changes — no recompute', () => {
    let evalCount = 0
    const c = computed(() => {
      evalCount++
      return lazyGetState().columnSizing
    })
    void c.value // initial
    for (let i = 0; i < 100; i++) {
      sorting.value = [{ id: 'col1', desc: i % 2 === 0 }]
      void c.value // should NOT re-evaluate — no dep on sorting
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 6. Filtering at scale
// ═══════════════════════════════════════════════════════════════════════════

describe('Filtering: string includes', () => {
  const filterValue = 'item 5'

  bench('filter 10K rows — string includes (case insensitive)', () => {
    const result = rows10K.filter(row =>
      row.name.toLowerCase().includes(filterValue.toLowerCase()),
    )
    void result.length
  })

  bench('filter 50K rows — string includes (case insensitive)', () => {
    const result = rows50K.filter(row =>
      row.name.toLowerCase().includes(filterValue.toLowerCase()),
    )
    void result.length
  })
})

describe('Filtering: number range', () => {
  bench('filter 10K rows — number range', () => {
    const result = rows10K.filter(row => row.amount >= 20 && row.amount <= 80)
    void result.length
  })

  bench('filter 50K rows — number range', () => {
    const result = rows50K.filter(row => row.amount >= 20 && row.amount <= 80)
    void result.length
  })
})

describe('Filtering: equality check', () => {
  bench('filter 10K rows — string equality', () => {
    const result = rows10K.filter(row => row.category === 'A')
    void result.length
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 7. Row model operations
// ═══════════════════════════════════════════════════════════════════════════

describe('Row model: shallow copy vs direct reference', () => {
  // NuGridBase.vue used to ALWAYS shallow copy the rows array for animation
  // Now it only copies when animation is enabled

  bench('shallow copy 1K rows (animation path)', () => {
    void ([...rows1K])
  })

  bench('shallow copy 10K rows (animation path)', () => {
    void ([...rows10K])
  })

  bench('direct reference (non-animation path — zero cost)', () => {
    void rows10K
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 8. Object allocation patterns (tooltip mouse follow)
// ═══════════════════════════════════════════════════════════════════════════

describe('Tooltip: mouse follow update (60fps mousemove)', () => {
  // mouseFollow enabled = ~60 updates/sec
  // Old: spread new object each time
  // New: mutate x/y in place

  const state = { text: 'Hello', x: 100, y: 200 }

  bench('spread new object × 1K moves (old — 16.7sec @ 60fps)', () => {
    for (let i = 0; i < 1000; i++) {
      void ({ ...state, x: i, y: i + 50 })
    }
  })

  bench('mutate in place × 1K moves (new — 16.7sec @ 60fps)', () => {
    for (let i = 0; i < 1000; i++) {
      state.x = i
      state.y = i + 50
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 9. Column sizing — proportional resize calculation
// ═══════════════════════════════════════════════════════════════════════════

describe('Column sizing: proportional resize', () => {
  const columnSizingStart: [string, number][] = Array.from(
    { length: 20 },
    (_, i) => [`col-${i}`, 100 + Math.random() * 200],
  )
  const deltaPercentage = 0.15

  bench('calculate proportional sizes for 20 columns × 1K', () => {
    for (let i = 0; i < 1000; i++) {
      const result: Record<string, number> = {}
      for (const [columnId, headerSize] of columnSizingStart) {
        result[columnId] = Math.round(
          Math.max(headerSize + headerSize * deltaPercentage, 0) * 100,
        ) / 100
      }
      void result
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 10. End-to-end: full data pipeline simulation
// ═══════════════════════════════════════════════════════════════════════════

describe('Pipeline: filter → sort → paginate (simulated)', () => {
  bench('10K rows → filter → sort → take 50', () => {
    // Filter
    const filtered = rows10K.filter(r => r.category === 'A' || r.category === 'B')
    // Sort
    filtered.sort((a, b) => sortBasic(a.amount, b.amount))
    // Paginate
    const page = filtered.slice(0, 50)
    void page.length
  })

  bench('50K rows → filter → sort → take 50', () => {
    const filtered = rows50K.filter(r => r.category === 'A' || r.category === 'B')
    filtered.sort((a, b) => sortBasic(a.amount, b.amount))
    const page = filtered.slice(0, 50)
    void page.length
  })

  bench('10K rows → multi-sort → paginate', () => {
    const arr = [...rows10K]
    arr.sort((a, b) => {
      const c1 = sortText(a.category, b.category)
      if (c1 !== 0) return c1
      const c2 = sortBasic(a.amount, b.amount)
      if (c2 !== 0) return c2
      return sortAlphanumeric(a.name, b.name)
    })
    const page = arr.slice(0, 50)
    void page.length
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 11. TanStack vs NuGrid data manipulation paths
// ═══════════════════════════════════════════════════════════════════════════

describe('TanStack: valueUpdater pattern overhead', () => {
  // TanStack's state write path:
  //   tableApi.setSorting(newValue)
  //   → onSortingChange(updater)
  //   → valueUpdater(updater, ref)
  //
  // NuGrid's direct path:
  //   ref.value = newValue
  //
  // The valueUpdater function checks if the argument is a function (updater)
  // or a value, then applies it. This adds function-call overhead per state write.

  // Vue ref already imported at top level

  function valueUpdater<T>(updaterOrValue: T | ((old: T) => T), target: { value: T }) {
    target.value = typeof updaterOrValue === 'function'
      ? (updaterOrValue as (old: T) => T)(target.value)
      : updaterOrValue
  }

  const sortingRef = ref([{ id: 'col1', desc: false }])

  bench('TanStack path: valueUpdater(value, ref) × 10K', () => {
    for (let i = 0; i < 10_000; i++) {
      valueUpdater([{ id: 'col1', desc: i % 2 === 0 }], sortingRef)
    }
  })

  bench('direct path: ref.value = value × 10K', () => {
    for (let i = 0; i < 10_000; i++) {
      sortingRef.value = [{ id: 'col1', desc: i % 2 === 0 }]
    }
  })

  // TanStack's setOptions spread pattern
  // On every data/column change, TanStack requires:
  //   tableApi.setOptions(prev => ({ ...prev, data: newData }))
  // This spreads the entire options object (50+ properties)

  const bigOptions: Record<string, any> = {}
  for (let i = 0; i < 50; i++) bigOptions[`option${i}`] = i

  bench('TanStack setOptions spread 50-prop object × 10K', () => {
    for (let i = 0; i < 10_000; i++) {
      void ({ ...bigOptions, data: rows1K })
    }
  })

  bench('direct ref assignment (no spread) × 10K', () => {
    const dataRef = ref(rows1K)
    for (let i = 0; i < 10_000; i++) {
      dataRef.value = rows1K
    }
  })
})

describe('TanStack: Row object creation overhead', () => {
  // TanStack creates Row<T> objects with methods like getVisibleCells(),
  // getValue(), getIsSelected(), etc. Each Row wraps the original data.
  // This measures the cost of wrapping vs direct access.

  // Simulated TanStack Row object (simplified)
  function createTanStackRow(original: any, index: number) {
    return {
      id: String(index),
      index,
      original,
      depth: 0,
      _valuesCache: {} as Record<string, any>,
      getValue(columnId: string) {
        if (this._valuesCache[columnId] !== undefined) return this._valuesCache[columnId]
        const val = this.original[columnId]
        this._valuesCache[columnId] = val
        return val
      },
      getVisibleCells() {
        // TanStack allocates a new array every call
        return [{ id: `${index}_name`, getValue: () => original.name }]
      },
      getIsSelected() { return false },
      getIsExpanded() { return false },
      getCanSelect() { return true },
    }
  }

  bench('create 10K TanStack-style Row objects', () => {
    const tanstackRows = []
    for (let i = 0; i < 10_000; i++) {
      tanstackRows.push(createTanStackRow(rows10K[i], i))
    }
    void tanstackRows.length
  })

  bench('create 10K plain index-based row references', () => {
    // NuGrid engine can reference rows directly without wrapping
    const plainRows = []
    for (let i = 0; i < 10_000; i++) {
      plainRows.push({ index: i, data: rows10K[i] })
    }
    void plainRows.length
  })

  // getValue through TanStack Row vs direct access
  const tanstackRows = rows1K.map((r, i) => createTanStackRow(r, i))

  bench('getValue via TanStack Row × 1K rows × 5 columns', () => {
    const cols = ['id', 'name', 'amount', 'category', 'status']
    for (const row of tanstackRows) {
      for (const col of cols) {
        row.getValue(col)
      }
    }
  })

  bench('direct property access × 1K rows × 5 columns', () => {
    const cols = ['id', 'name', 'amount', 'category', 'status'] as const
    for (const row of rows1K) {
      for (const col of cols) {
        void (row as any)[col]
      }
    }
  })
})

describe('TanStack: getCoreRowModel memo overhead', () => {
  // TanStack uses a memo() pattern that:
  // 1. Checks deps array for changes
  // 2. If changed, re-runs the row model factory
  // 3. The factory iterates all rows, creates Row objects
  //
  // NuGrid's engine uses identity caching on the input array reference.
  // If the array ref hasn't changed, return cached result immediately.

  // Simulated TanStack memo with deps checking
  function tanstackMemo<T>(
    getDeps: () => any[],
    factory: () => T,
  ): () => T {
    let lastDeps: any[] | null = null
    let lastResult: T | undefined
    return () => {
      const deps = getDeps()
      if (lastDeps && deps.every((d, i) => d === lastDeps![i])) {
        return lastResult!
      }
      lastDeps = deps
      lastResult = factory()
      return lastResult
    }
  }

  // Simulated identity cache (NuGrid engine pattern)
  function identityCache<T>(getInput: () => any, factory: () => T): () => T {
    let lastInput: any = undefined
    let lastResult: T | undefined
    return () => {
      const input = getInput()
      if (input === lastInput) return lastResult!
      lastInput = input
      lastResult = factory()
      return lastResult
    }
  }

  const data = rows10K

  const tanstackGetRowModel = tanstackMemo(
    () => [data, data.length],
    () => data.map((r, i) => ({ id: String(i), original: r })),
  )

  const engineGetRowModel = identityCache(
    () => data,
    () => data.map((r, i) => ({ id: String(i), original: r })),
  )

  // Warm up both caches
  tanstackGetRowModel()
  engineGetRowModel()

  bench('TanStack memo: cache hit check (deps array compare) × 100K', () => {
    for (let i = 0; i < 100_000; i++) {
      tanstackGetRowModel()
    }
  })

  bench('identity cache: reference equality check × 100K', () => {
    for (let i = 0; i < 100_000; i++) {
      engineGetRowModel()
    }
  })
})

describe('TanStack: column getSize() overhead', () => {
  // TanStack's column.getSize() reads from columnSizingState, then
  // falls back to column.columnDef.size, then to defaultColumnSize.
  // It does this through multiple function calls and property lookups.

  const columnSizing: Record<string, number> = {}
  for (let i = 0; i < 30; i++) columnSizing[`col-${i}`] = 100 + i * 10

  // TanStack-style: multiple function calls, state lookups
  function tanstackGetSize(columnId: string, defaultSize: number) {
    const stateSize = columnSizing[columnId]
    return stateSize ?? defaultSize
  }

  // Direct lookup
  const sizes = new Float64Array(30)
  for (let i = 0; i < 30; i++) sizes[i] = 100 + i * 10

  bench('TanStack getSize: object lookup × 30 cols × 1K renders', () => {
    for (let r = 0; r < 1000; r++) {
      let total = 0
      for (let i = 0; i < 30; i++) {
        total += tanstackGetSize(`col-${i}`, 150)
      }
      void total
    }
  })

  bench('direct array lookup × 30 cols × 1K renders', () => {
    for (let r = 0; r < 1000; r++) {
      let total = 0
      for (let i = 0; i < 30; i++) {
        total += sizes[i]!
      }
      void total
    }
  })
})
