import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

// ============================================================================
// Sort engine integration tests
// ============================================================================
// We test the sort engine by importing useNuGridSorting and calling it with
// mock Row/Table objects that mimic TanStack's shape.
import { useNuGridSorting } from '../src/runtime/composables/_internal/useNuGridSorting'
import {
  compareAlphanumeric,
  compareBasic,
  resolveComparator,
  sortAlphanumeric,
  sortAlphanumericCaseSensitive,
  sortBasic,
  sortDatetime,
  sortText,
  sortTextCaseSensitive,
  toString,
} from '../src/runtime/utils/sortingFns'

// ---------------------------------------------------------------------------
// Reference implementations — copied verbatim from TanStack Table's sortingFns.ts
// (module-private, can't import directly). Used to assert parity.
// ---------------------------------------------------------------------------

function tanstackToString(a: any): string {
  if (typeof a === 'number') {
    if (isNaN(a) || a === Infinity || a === -Infinity) return ''
    return String(a)
  }
  if (typeof a === 'string') return a
  return ''
}

function tanstackCompareBasic(a: any, b: any): number {
  return a === b ? 0 : a > b ? 1 : -1
}

const tanstackReSplitAlphaNumeric = /([0-9]+)/gm

function tanstackCompareAlphanumeric(aStr: string, bStr: string): number {
  const a = aStr.split(tanstackReSplitAlphaNumeric).filter(Boolean)
  const b = bStr.split(tanstackReSplitAlphaNumeric).filter(Boolean)

  while (a.length && b.length) {
    const aa = a.shift()!
    const bb = b.shift()!
    const an = parseInt(aa, 10)
    const bn = parseInt(bb, 10)
    const combo = [an, bn].sort()

    if (isNaN(combo[0]!)) {
      if (aa > bb) return 1
      if (bb > aa) return -1
      continue
    }
    if (isNaN(combo[1]!)) {
      return isNaN(an) ? -1 : 1
    }
    if (an > bn) return 1
    if (bn > an) return -1
  }
  return a.length - b.length
}

// ---------------------------------------------------------------------------
// Helper: sort an array using a comparator (ascending)
// ---------------------------------------------------------------------------

function sortAsc<T>(arr: T[], fn: (a: T, b: T) => number): T[] {
  return [...arr].sort(fn)
}

function sortValues(values: unknown[], comparator: (a: unknown, b: unknown) => number): unknown[] {
  return sortAsc(values, comparator)
}

// ============================================================================
// A. Comparator parity tests
// ============================================================================

describe('toString — parity with TanStack', () => {
  const testCases: [unknown, string][] = [
    [42, '42'],
    [0, '0'],
    [-3.14, '-3.14'],
    [NaN, ''],
    [Infinity, ''],
    [-Infinity, ''],
    ['hello', 'hello'],
    ['', ''],
    [null, ''],
    [undefined, ''],
    [true, ''],
    [false, ''],
    [{}, ''],
    [[], ''],
  ]

  for (const [input, expected] of testCases) {
    it(`toString(${JSON.stringify(input)}) === ${JSON.stringify(expected)}`, () => {
      expect(toString(input)).toBe(expected)
      expect(tanstackToString(input)).toBe(expected)
      expect(toString(input)).toBe(tanstackToString(input))
    })
  }
})

describe('compareBasic — parity with TanStack', () => {
  const pairs: [unknown, unknown, number][] = [
    [1, 2, -1],
    [2, 1, 1],
    [1, 1, 0],
    ['a', 'b', -1],
    ['b', 'a', 1],
    ['a', 'a', 0],
    [true, false, 1],
    [false, true, -1],
    [0, 1, -1],
  ]

  for (const [a, b, expected] of pairs) {
    it(`compareBasic(${JSON.stringify(a)}, ${JSON.stringify(b)}) === ${expected}`, () => {
      expect(compareBasic(a, b)).toBe(expected)
      expect(tanstackCompareBasic(a, b)).toBe(expected)
    })
  }
})

describe('compareAlphanumeric — parity with TanStack', () => {
  const pairs: [string, string][] = [
    // Version strings
    ['v1.0', 'v2.0'],
    ['v2.0', 'v10.0'],
    ['v1.0', 'v10.0'],

    // Mixed text/numbers
    ['item1', 'item2'],
    ['item2', 'item10'],
    ['item1', 'item10'],

    // Pure numbers as strings
    ['3', '20'],
    ['20', '100'],
    ['3', '100'],

    // Prefixed numbers
    ['abc2', 'abc20'],
    ['abc20', 'abc123'],
    ['abc2', 'abc123'],

    // Same values
    ['abc', 'abc'],
    ['123', '123'],
    ['item10', 'item10'],

    // Empty strings
    ['', 'a'],
    ['a', ''],
    ['', ''],

    // Numbers at different positions
    ['a1b2', 'a1b10'],
    ['a2b1', 'a10b1'],

    // String vs number segment
    ['abc', '123'],
    ['123', 'abc'],

    // Case matters (these are raw, not lowercased)
    ['A', 'a'],
    ['a', 'A'],
    ['ABC', 'abc'],
  ]

  for (const [a, b] of pairs) {
    it(`compareAlphanumeric("${a}", "${b}") matches TanStack`, () => {
      const ours = compareAlphanumeric(a, b)
      const theirs = tanstackCompareAlphanumeric(a, b)
      expect(ours).toBe(theirs)
    })
  }
})

// ============================================================================
// High-level comparator tests
// ============================================================================

describe('sortAlphanumeric', () => {
  it('sorts version strings numerically', () => {
    const values = ['v10.0', 'v2.0', 'v1.0']
    expect(sortValues(values, sortAlphanumeric)).toEqual(['v1.0', 'v2.0', 'v10.0'])
  })

  it('sorts mixed text/numbers', () => {
    const values = ['item10', 'item2', 'item1']
    expect(sortValues(values, sortAlphanumeric)).toEqual(['item1', 'item2', 'item10'])
  })

  it('sorts prefixed numbers', () => {
    const values = ['abc123', 'abc2', 'abc20']
    expect(sortValues(values, sortAlphanumeric)).toEqual(['abc2', 'abc20', 'abc123'])
  })

  it('is case-insensitive', () => {
    const values = ['Banana', 'apple', 'Cherry']
    expect(sortValues(values, sortAlphanumeric)).toEqual(['apple', 'Banana', 'Cherry'])
  })

  it('handles empty strings', () => {
    const values = ['b', '', 'a']
    expect(sortValues(values, sortAlphanumeric)).toEqual(['', 'a', 'b'])
  })

  it('handles pure numbers as strings', () => {
    const values = ['100', '20', '3']
    expect(sortValues(values, sortAlphanumeric)).toEqual(['3', '20', '100'])
  })
})

describe('sortAlphanumericCaseSensitive', () => {
  it('distinguishes case', () => {
    const values = ['banana', 'Apple', 'cherry']
    const sorted = sortValues(values, sortAlphanumericCaseSensitive)
    // Uppercase letters come before lowercase in char code order
    expect(sorted).toEqual(['Apple', 'banana', 'cherry'])
  })
})

describe('sortText', () => {
  it('sorts alphabetically (case-insensitive)', () => {
    const values = ['cherry', 'Apple', 'banana']
    expect(sortValues(values, sortText)).toEqual(['Apple', 'banana', 'cherry'])
  })

  it('does NOT sort numbers in strings numerically', () => {
    // sortText uses lexicographic order — "10" < "2" because "1" < "2"
    const values = ['item10', 'item2', 'item1']
    expect(sortValues(values, sortText)).toEqual(['item1', 'item10', 'item2'])
  })
})

describe('sortTextCaseSensitive', () => {
  it('sorts case-sensitively', () => {
    const values = ['banana', 'Apple', 'cherry']
    expect(sortValues(values, sortTextCaseSensitive)).toEqual(['Apple', 'banana', 'cherry'])
  })
})

describe('sortDatetime', () => {
  it('sorts Date objects chronologically', () => {
    const d1 = new Date('2024-12-31')
    const d2 = new Date('2023-06-15')
    const d3 = new Date('2024-01-01')
    expect(sortValues([d1, d2, d3], sortDatetime)).toEqual([d2, d3, d1])
  })

  it('handles same dates', () => {
    const d1 = new Date('2024-01-01')
    const d2 = new Date('2024-01-01')
    expect(sortDatetime(d1, d2)).toBe(0)
  })

  it('handles null/undefined (compared as dates)', () => {
    // null < Date and undefined < Date with < operator
    const d1 = new Date('2024-01-01')
    expect(sortDatetime(null, d1)).toBe(-1)
    expect(sortDatetime(d1, null)).toBe(1)
  })
})

describe('sortBasic', () => {
  it('sorts integers', () => {
    expect(sortValues([3, 1, 2], sortBasic)).toEqual([1, 2, 3])
  })

  it('sorts decimals', () => {
    expect(sortValues([1.1, 1.001, 1.01], sortBasic)).toEqual([1.001, 1.01, 1.1])
  })

  it('sorts negative numbers', () => {
    expect(sortValues([-5, 3, -1, 0], sortBasic)).toEqual([-5, -1, 0, 3])
  })

  it('sorts booleans', () => {
    expect(sortValues([true, false, true, false], sortBasic)).toEqual([false, false, true, true])
  })

  it('handles NaN', () => {
    // NaN === NaN is false, NaN > anything is false, so NaN compares as -1 vs numbers
    const result = sortBasic(NaN, 1)
    expect(result).toBe(-1)
  })

  it('handles Infinity', () => {
    expect(sortValues([Infinity, 1, -Infinity, 0], sortBasic)).toEqual([-Infinity, 0, 1, Infinity])
  })
})

// ============================================================================
// resolveComparator tests
// ============================================================================

describe('resolveComparator', () => {
  it('returns custom function when provided', () => {
    const custom = (a: unknown, b: unknown) => 0
    expect(resolveComparator(custom, undefined)).toBe(custom)
  })

  it('resolves named string "alphanumeric"', () => {
    const fn = resolveComparator('alphanumeric', undefined)
    expect(fn).toBe(sortAlphanumeric)
  })

  it('resolves named string "text"', () => {
    const fn = resolveComparator('text', undefined)
    expect(fn).toBe(sortText)
  })

  it('resolves named string "datetime"', () => {
    const fn = resolveComparator('datetime', undefined)
    expect(fn).toBe(sortDatetime)
  })

  it('resolves named string "basic"', () => {
    const fn = resolveComparator('basic', undefined)
    expect(fn).toBe(sortBasic)
  })

  it('auto-detects date type', () => {
    expect(resolveComparator(undefined, 'date')).toBe(sortDatetime)
  })

  it('auto-detects number type', () => {
    expect(resolveComparator(undefined, 'number')).toBe(sortBasic)
  })

  it('auto-detects currency type', () => {
    expect(resolveComparator(undefined, 'currency')).toBe(sortBasic)
  })

  it('auto-detects percentage type', () => {
    expect(resolveComparator(undefined, 'percentage')).toBe(sortBasic)
  })

  it('auto-detects boolean type', () => {
    expect(resolveComparator(undefined, 'boolean')).toBe(sortBasic)
  })

  it('auto-detects text type → alphanumeric', () => {
    expect(resolveComparator(undefined, 'text')).toBe(sortAlphanumeric)
  })

  it('falls back to sortBasic for unknown type', () => {
    expect(resolveComparator(undefined, undefined)).toBe(sortBasic)
    expect(resolveComparator(undefined, 'unknown')).toBe(sortBasic)
  })

  it('custom function takes priority over inferred type', () => {
    const custom = (a: unknown, b: unknown) => 0
    expect(resolveComparator(custom, 'date')).toBe(custom)
  })

  it('named string takes priority over inferred type', () => {
    expect(resolveComparator('text', 'date')).toBe(sortText)
  })
})

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

interface MockRowData {
  [key: string]: unknown
}

function mockRow(index: number, data: MockRowData): any {
  return {
    id: String(index),
    index,
    original: data,
    getValue: (columnId: string) => data[columnId],
    subRows: [],
  }
}

function mockTable(columnDefs: Record<string, any>): any {
  return {
    getColumn: (id: string) => {
      const def = columnDefs[id]
      if (!def) return undefined
      return {
        columnDef: { enableSorting: true, ...def },
        getCanSort: () => def.enableSorting !== false,
      }
    },
  }
}

// ---------------------------------------------------------------------------
// C. Multi-column sort tests
// ---------------------------------------------------------------------------

describe('sortRows — multi-column sort', () => {
  const data = [
    { name: 'Charlie', age: 30, dept: 'Engineering' },
    { name: 'Alice', age: 25, dept: 'Engineering' },
    { name: 'Bob', age: 30, dept: 'Marketing' },
    { name: 'Alice', age: 35, dept: 'Marketing' },
    { name: 'Alice', age: 25, dept: 'Marketing' },
  ]
  const rows = ref(data.map((d, i) => mockRow(i, d)))

  it('sorts by single column ascending', () => {
    const sorting = ref([{ id: 'name', desc: false }])
    const table = mockTable({ name: { cellDataType: 'text' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.name)).toEqual([
      'Alice',
      'Alice',
      'Alice',
      'Bob',
      'Charlie',
    ])
  })

  it('sorts by single column descending', () => {
    const sorting = ref([{ id: 'age', desc: true }])
    const table = mockTable({ age: { cellDataType: 'number' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.age)).toEqual([35, 30, 30, 25, 25])
  })

  it('sorts by two columns (primary + secondary)', () => {
    const sorting = ref([
      { id: 'name', desc: false },
      { id: 'age', desc: false },
    ])
    const table = mockTable({
      name: { cellDataType: 'text' },
      age: { cellDataType: 'number' },
    })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    const result = sortedRows.value.map((r: any) => ({
      name: r.original.name,
      age: r.original.age,
    }))
    expect(result).toEqual([
      { name: 'Alice', age: 25 },
      { name: 'Alice', age: 25 },
      { name: 'Alice', age: 35 },
      { name: 'Bob', age: 30 },
      { name: 'Charlie', age: 30 },
    ])
  })

  it('sorts by three columns with mixed directions', () => {
    const sorting = ref([
      { id: 'name', desc: false },
      { id: 'age', desc: true },
      { id: 'dept', desc: false },
    ])
    const table = mockTable({
      name: { cellDataType: 'text' },
      age: { cellDataType: 'number' },
      dept: { cellDataType: 'text' },
    })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    const result = sortedRows.value.map((r: any) => ({
      name: r.original.name,
      age: r.original.age,
      dept: r.original.dept,
    }))
    expect(result).toEqual([
      { name: 'Alice', age: 35, dept: 'Marketing' },
      { name: 'Alice', age: 25, dept: 'Engineering' },
      { name: 'Alice', age: 25, dept: 'Marketing' },
      { name: 'Bob', age: 30, dept: 'Marketing' },
      { name: 'Charlie', age: 30, dept: 'Engineering' },
    ])
  })

  it('preserves original order for ties (stable sort)', () => {
    const tiedData = [
      { name: 'Alice', order: 1 },
      { name: 'Alice', order: 2 },
      { name: 'Alice', order: 3 },
    ]
    const tiedRows = ref(tiedData.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'name', desc: false }])
    const table = mockTable({ name: { cellDataType: 'text' } })
    const { sortedRows } = useNuGridSorting(tiedRows, sorting, table)

    // Should preserve original index order
    expect(sortedRows.value.map((r: any) => r.original.order)).toEqual([1, 2, 3])
  })
})

// ---------------------------------------------------------------------------
// D. invertSorting tests
// ---------------------------------------------------------------------------

describe('sortRows — invertSorting', () => {
  const data = [{ rank: 3 }, { rank: 1 }, { rank: 2 }]
  const rows = ref(data.map((d, i) => mockRow(i, d)))

  it('ascending with invertSorting = effectively descending', () => {
    const sorting = ref([{ id: 'rank', desc: false }])
    const table = mockTable({ rank: { cellDataType: 'number', invertSorting: true } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.rank)).toEqual([3, 2, 1])
  })

  it('descending with invertSorting = effectively ascending', () => {
    const sorting = ref([{ id: 'rank', desc: true }])
    const table = mockTable({ rank: { cellDataType: 'number', invertSorting: true } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.rank)).toEqual([1, 2, 3])
  })
})

// ---------------------------------------------------------------------------
// E. sortAccessor tests
// ---------------------------------------------------------------------------

describe('sortRows — sortAccessor', () => {
  it('sorts by string sortAccessor field', () => {
    const data = [
      { statusText: 'In Progress', statusSort: 2 },
      { statusText: 'Complete', statusSort: 3 },
      { statusText: 'Not Started', statusSort: 1 },
    ]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'statusText', desc: false }])
    const table = mockTable({
      statusText: { cellDataType: 'number', sortAccessor: 'statusSort' },
    })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.statusText)).toEqual([
      'Not Started',
      'In Progress',
      'Complete',
    ])
  })

  it('sorts by function sortAccessor', () => {
    const data = [
      { name: 'Charlie', nested: { sortKey: 3 } },
      { name: 'Alice', nested: { sortKey: 1 } },
      { name: 'Bob', nested: { sortKey: 2 } },
    ]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'name', desc: false }])
    const table = mockTable({
      name: { cellDataType: 'number', sortAccessor: (row: any) => row.nested.sortKey },
    })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.name)).toEqual(['Alice', 'Bob', 'Charlie'])
  })

  it('sorts by sortAccessor with descending', () => {
    const data = [
      { statusText: 'In Progress', statusSort: 2 },
      { statusText: 'Complete', statusSort: 3 },
      { statusText: 'Not Started', statusSort: 1 },
    ]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'statusText', desc: true }])
    const table = mockTable({
      statusText: { cellDataType: 'number', sortAccessor: 'statusSort' },
    })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.statusText)).toEqual([
      'Complete',
      'In Progress',
      'Not Started',
    ])
  })

  it('uses sortAccessor for one column and standard getValue for another in multi-sort', () => {
    const data = [
      { statusText: 'Active', statusSort: 1, name: 'Charlie' },
      { statusText: 'Active', statusSort: 1, name: 'Alice' },
      { statusText: 'Inactive', statusSort: 2, name: 'Bob' },
    ]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([
      { id: 'statusText', desc: false },
      { id: 'name', desc: false },
    ])
    const table = mockTable({
      statusText: { cellDataType: 'number', sortAccessor: 'statusSort' },
      name: { cellDataType: 'text' },
    })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.name)).toEqual(['Alice', 'Charlie', 'Bob'])
  })

  it('falls back to getValue when no sortAccessor', () => {
    const data = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'name', desc: false }])
    const table = mockTable({ name: { cellDataType: 'text' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.name)).toEqual(['Alice', 'Bob', 'Charlie'])
  })
})

// ---------------------------------------------------------------------------
// B. Null/undefined handling tests
// ---------------------------------------------------------------------------

describe('sortRows — null/undefined handling', () => {
  it('sortUndefined: "last" pushes undefined to end', () => {
    const data = [{ val: undefined }, { val: 2 }, { val: undefined }, { val: 1 }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number', sortUndefined: 'last' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([1, 2, undefined, undefined])
  })

  it('sortUndefined: "first" pushes undefined to start', () => {
    const data = [{ val: 2 }, { val: undefined }, { val: 1 }, { val: undefined }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number', sortUndefined: 'first' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([undefined, undefined, 1, 2])
  })

  it('sortUndefined: 1 pushes undefined to end (numeric form)', () => {
    const data = [{ val: undefined }, { val: 3 }, { val: 1 }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number', sortUndefined: 1 } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([1, 3, undefined])
  })

  it('sortUndefined: -1 pushes undefined to start (numeric form)', () => {
    const data = [{ val: 3 }, { val: undefined }, { val: 1 }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number', sortUndefined: -1 } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([undefined, 1, 3])
  })

  it('sortUndefined: false — undefined ties with each other, falls to next column', () => {
    // When sortUndefined is false, two undefined values tie (sortInt=0),
    // so sorting falls through to the next sort column.
    const data = [
      { val: undefined, name: 'Charlie' },
      { val: undefined, name: 'Alice' },
    ]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([
      { id: 'val', desc: false },
      { id: 'name', desc: false },
    ])
    const table = mockTable({
      val: { cellDataType: 'number', sortUndefined: false },
      name: { cellDataType: 'text' },
    })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    // Both undefined on val → falls to name → alphabetical
    const result = sortedRows.value.map((r: any) => r.original.name)
    expect(result).toEqual(['Alice', 'Charlie'])
  })
})

// ---------------------------------------------------------------------------
// F. Auto-detection tests (via resolveComparator in context)
// ---------------------------------------------------------------------------

describe('sortRows — auto-detection via cellDataType', () => {
  it('uses sortBasic for number columns', () => {
    const data = [{ val: 10 }, { val: 2 }, { val: 1 }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([1, 2, 10])
  })

  it('uses sortAlphanumeric for text columns', () => {
    const data = [{ val: 'item10' }, { val: 'item2' }, { val: 'item1' }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'text' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual(['item1', 'item2', 'item10'])
  })

  it('uses sortDatetime for date columns', () => {
    const d1 = new Date('2024-12-31')
    const d2 = new Date('2023-06-15')
    const d3 = new Date('2024-01-01')
    const data = [{ val: d1 }, { val: d2 }, { val: d3 }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'date' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([d2, d3, d1])
  })

  it('uses custom sortingFn when provided', () => {
    const data = [{ val: 'medium' }, { val: 'high' }, { val: 'low' }]
    const priority: Record<string, number> = { low: 1, medium: 2, high: 3 }
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({
      val: {
        sortingFn: (a: unknown, b: unknown) =>
          (priority[a as string] ?? 0) - (priority[b as string] ?? 0),
      },
    })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual(['low', 'medium', 'high'])
  })
})

// ---------------------------------------------------------------------------
// G. Edge cases
// ---------------------------------------------------------------------------

describe('sortRows — edge cases', () => {
  it('returns empty array for no rows', () => {
    const rows = ref([])
    const sorting = ref([{ id: 'name', desc: false }])
    const table = mockTable({ name: { cellDataType: 'text' } })
    const { sortedRows } = useNuGridSorting(rows as any, sorting, table)

    expect(sortedRows.value).toEqual([])
  })

  it('returns rows unchanged when no sorting', () => {
    const data = [{ name: 'Charlie' }, { name: 'Alice' }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([])
    const table = mockTable({ name: { cellDataType: 'text' } })
    const { sortedRows } = useNuGridSorting(rows, sorting as any, table)

    expect(sortedRows.value).toBe(rows.value) // Same reference
  })

  it('handles single row', () => {
    const rows = ref([mockRow(0, { name: 'Alice' })])
    const sorting = ref([{ id: 'name', desc: false }])
    const table = mockTable({ name: { cellDataType: 'text' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value).toHaveLength(1)
    expect(sortedRows.value[0].original.name).toBe('Alice')
  })

  it('handles all identical values', () => {
    const data = [{ val: 1 }, { val: 1 }, { val: 1 }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    // Stable: preserves original index order
    expect(sortedRows.value.map((r: any) => r.index)).toEqual([0, 1, 2])
  })

  it('handles all undefined values', () => {
    const data = [{ val: undefined }, { val: undefined }, { val: undefined }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value).toHaveLength(3)
  })

  it('skips columns that do not exist on table', () => {
    const data = [{ name: 'Charlie' }, { name: 'Alice' }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'nonexistent', desc: false }])
    const table = mockTable({}) // No columns
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    // No valid sort columns → returns rows in original order
    expect(sortedRows.value.map((r: any) => r.original.name)).toEqual(['Charlie', 'Alice'])
  })

  it('skips columns where enableSorting is false', () => {
    const data = [{ name: 'Charlie' }, { name: 'Alice' }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'name', desc: false }])
    const table = mockTable({ name: { cellDataType: 'text', enableSorting: false } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    // enableSorting: false → column skipped
    expect(sortedRows.value.map((r: any) => r.original.name)).toEqual(['Charlie', 'Alice'])
  })

  it('sorts sub-rows recursively', () => {
    const parentA = mockRow(0, { name: 'Group A' })
    const parentB = mockRow(1, { name: 'Group B' })
    parentA.subRows = [mockRow(0, { name: 'Charlie' }), mockRow(1, { name: 'Alice' })]
    parentB.subRows = [mockRow(0, { name: 'Zara' }), mockRow(1, { name: 'Bob' })]

    const rows = ref([parentA, parentB])
    const sorting = ref([{ id: 'name', desc: false }])
    const table = mockTable({ name: { cellDataType: 'text' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    // Parents sorted
    expect(sortedRows.value[0].original.name).toBe('Group A')
    expect(sortedRows.value[1].original.name).toBe('Group B')

    // Sub-rows sorted within each parent
    expect(sortedRows.value[0].subRows.map((r: any) => r.original.name)).toEqual([
      'Alice',
      'Charlie',
    ])
    expect(sortedRows.value[1].subRows.map((r: any) => r.original.name)).toEqual(['Bob', 'Zara'])
  })
})

// ============================================================================
// H. Row pinning tests
// ============================================================================

describe('sortRows — row pinning', () => {
  const data = [
    { id: '0', name: 'Charlie', price: 30 },
    { id: '1', name: 'Alice', price: 10 },
    { id: '2', name: 'Eve', price: 50 },
    { id: '3', name: 'Bob', price: 20 },
    { id: '4', name: 'Diana', price: 40 },
  ]

  function makeRows() {
    return data.map((d, i) => ({ ...mockRow(i, d), id: d.id }))
  }

  const table = mockTable({ name: { cellDataType: 'text' }, price: { cellDataType: 'number' } })

  it('pinned top rows stay at top regardless of sort', () => {
    const rows = ref(makeRows())
    const sorting = ref([{ id: 'name', desc: false }])
    const pinning = ref({ top: ['2'] }) // Eve pinned to top
    const { sortedRows } = useNuGridSorting(rows, sorting, table, pinning)

    const names = sortedRows.value.map((r: any) => r.original.name)
    // Eve pinned at top, rest sorted alphabetically
    expect(names).toEqual(['Eve', 'Alice', 'Bob', 'Charlie', 'Diana'])
  })

  it('pinned bottom rows stay at bottom regardless of sort', () => {
    const rows = ref(makeRows())
    const sorting = ref([{ id: 'name', desc: false }])
    const pinning = ref({ bottom: ['1'] }) // Alice pinned to bottom
    const { sortedRows } = useNuGridSorting(rows, sorting, table, pinning)

    const names = sortedRows.value.map((r: any) => r.original.name)
    // Rest sorted alphabetically, Alice at bottom
    expect(names).toEqual(['Bob', 'Charlie', 'Diana', 'Eve', 'Alice'])
  })

  it('pinned top + bottom together', () => {
    const rows = ref(makeRows())
    const sorting = ref([{ id: 'name', desc: false }])
    const pinning = ref({ top: ['2'], bottom: ['3'] }) // Eve top, Bob bottom
    const { sortedRows } = useNuGridSorting(rows, sorting, table, pinning)

    const names = sortedRows.value.map((r: any) => r.original.name)
    expect(names).toEqual(['Eve', 'Alice', 'Charlie', 'Diana', 'Bob'])
  })

  it('preserves pinned order as specified in arrays', () => {
    const rows = ref(makeRows())
    const sorting = ref([{ id: 'name', desc: false }])
    // Pin Eve then Charlie to top (order: Eve, Charlie, not alphabetical)
    const pinning = ref({ top: ['2', '0'] })
    const { sortedRows } = useNuGridSorting(rows, sorting, table, pinning)

    const names = sortedRows.value.map((r: any) => r.original.name)
    expect(names[0]).toBe('Eve')
    expect(names[1]).toBe('Charlie')
    // Rest sorted: Alice, Bob, Diana
    expect(names.slice(2)).toEqual(['Alice', 'Bob', 'Diana'])
  })

  it('empty pinning state is a no-op', () => {
    const rows = ref(makeRows())
    const sorting = ref([{ id: 'name', desc: false }])
    const pinning = ref({})
    const { sortedRows } = useNuGridSorting(rows, sorting, table, pinning)

    const names = sortedRows.value.map((r: any) => r.original.name)
    expect(names).toEqual(['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'])
  })

  it('pinned IDs that do not exist in data are silently skipped', () => {
    const rows = ref(makeRows())
    const sorting = ref([{ id: 'name', desc: false }])
    const pinning = ref({ top: ['999', '2'] }) // 999 doesn't exist
    const { sortedRows } = useNuGridSorting(rows, sorting, table, pinning)

    const names = sortedRows.value.map((r: any) => r.original.name)
    // Only Eve is pinned (999 skipped), rest sorted
    expect(names).toEqual(['Eve', 'Alice', 'Bob', 'Charlie', 'Diana'])
  })

  it('pinned rows work with descending sort', () => {
    const rows = ref(makeRows())
    const sorting = ref([{ id: 'name', desc: true }])
    const pinning = ref({ top: ['1'] }) // Alice pinned to top
    const { sortedRows } = useNuGridSorting(rows, sorting, table, pinning)

    const names = sortedRows.value.map((r: any) => r.original.name)
    // Alice pinned at top, rest sorted descending
    expect(names).toEqual(['Alice', 'Eve', 'Diana', 'Charlie', 'Bob'])
  })

  it('pinned rows work with no active sort (pinning only)', () => {
    const rows = ref(makeRows())
    const sorting = ref([]) // no sort
    const pinning = ref({ top: ['2'], bottom: ['0'] })
    const { sortedRows } = useNuGridSorting(rows, sorting, table, pinning)

    const names = sortedRows.value.map((r: any) => r.original.name)
    // Eve at top, Charlie at bottom, middle rows in original order
    expect(names[0]).toBe('Eve')
    expect(names[names.length - 1]).toBe('Charlie')
    // Middle: Alice, Bob, Diana (original order of non-pinned)
    expect(names.slice(1, -1)).toEqual(['Alice', 'Bob', 'Diana'])
  })

  it('pinned rows work with multi-column sort', () => {
    const rows = ref(makeRows())
    const sorting = ref([{ id: 'price', desc: false }])
    const pinning = ref({ top: ['2'] }) // Eve (price=50) pinned to top
    const { sortedRows } = useNuGridSorting(rows, sorting, table, pinning)

    const prices = sortedRows.value.map((r: any) => r.original.price)
    // Eve (50) pinned at top, rest sorted by price asc
    expect(prices).toEqual([50, 10, 20, 30, 40])
  })
})

// ============================================================================
// I. Pre-sorted detection + single-column fast path
// ============================================================================

describe('sortRows — pre-sorted detection', () => {
  it('returns same data when already sorted ascending', () => {
    const data = [{ val: 1 }, { val: 2 }, { val: 3 }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([1, 2, 3])
  })

  it('returns same data when already sorted descending', () => {
    const data = [{ val: 3 }, { val: 2 }, { val: 1 }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: true }])
    const table = mockTable({ val: { cellDataType: 'number' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([3, 2, 1])
  })

  it('detects unsorted data and sorts it correctly', () => {
    const data = [{ val: 3 }, { val: 1 }, { val: 2 }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([1, 2, 3])
  })

  it('handles already-sorted multi-column data', () => {
    const data = [
      { name: 'Alice', age: 25 },
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 20 },
    ]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([
      { id: 'name', desc: false },
      { id: 'age', desc: false },
    ])
    const table = mockTable({
      name: { cellDataType: 'text' },
      age: { cellDataType: 'number' },
    })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.name)).toEqual(['Alice', 'Alice', 'Bob'])
    expect(sortedRows.value.map((r: any) => r.original.age)).toEqual([25, 30, 20])
  })

  it('re-evaluates correctly after non-sorted column edit', () => {
    const data = [
      { name: 'Alice', val: 1, note: 'x' },
      { name: 'Bob', val: 2, note: 'y' },
    ]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([1, 2])

    // Edit non-sorted column — rows are still in correct order
    const newData = data.map((d) => (d.name === 'Alice' ? { ...d, note: 'changed' } : d))
    rows.value = newData.map((d, i) => mockRow(i, d))

    // Pre-sorted detection should skip the full sort
    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([1, 2])
    expect(sortedRows.value.map((r: any) => r.original.note)).toEqual(['changed', 'y'])
  })
})

describe('sortRows — single-column fast path', () => {
  it('produces same result as multi-column for single sort', () => {
    const data = [{ val: 30 }, { val: 10 }, { val: 20 }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([10, 20, 30])
  })

  it('single-column fast path handles descending', () => {
    const data = [{ val: 10 }, { val: 30 }, { val: 20 }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: true }])
    const table = mockTable({ val: { cellDataType: 'number' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([30, 20, 10])
  })

  it('single-column with invertSorting', () => {
    const data = [{ rank: 3 }, { rank: 1 }, { rank: 2 }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'rank', desc: false }])
    const table = mockTable({ rank: { cellDataType: 'number', invertSorting: true } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.rank)).toEqual([3, 2, 1])
  })

  it('single-column with sortUndefined: "last"', () => {
    const data = [{ val: undefined }, { val: 2 }, { val: 1 }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number', sortUndefined: 'last' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([1, 2, undefined])
  })

  it('single-column with sortUndefined: "first"', () => {
    const data = [{ val: 2 }, { val: undefined }, { val: 1 }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number', sortUndefined: 'first' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([undefined, 1, 2])
  })

  it('single-column preserves stability for ties', () => {
    const data = [
      { name: 'Alice', order: 1 },
      { name: 'Alice', order: 2 },
      { name: 'Alice', order: 3 },
    ]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'name', desc: false }])
    const table = mockTable({ name: { cellDataType: 'text' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.order)).toEqual([1, 2, 3])
  })

  it('single-column with text/alphanumeric sort', () => {
    const data = [{ val: 'item10' }, { val: 'item2' }, { val: 'item1' }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'text' } })
    const { sortedRows } = useNuGridSorting(rows, sorting, table)

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual(['item1', 'item2', 'item10'])
  })
})

// ============================================================================
// J. Incremental sort + movedRowIds tests
// ============================================================================

describe('incremental sort (notifyEditedRow)', () => {
  it('produces same result as full sort after single-cell edit', () => {
    // Start with sorted data
    const data = [
      { name: 'Alice', val: 10 },
      { name: 'Bob', val: 20 },
      { name: 'Charlie', val: 30 },
      { name: 'Diana', val: 40 },
    ]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number' } })
    const { sortedRows, notifyEditedRow } = useNuGridSorting(rows, sorting, table)

    // Trigger initial sort to populate lastSortedIds
    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([10, 20, 30, 40])

    // Simulate editing Bob's val from 20 to 50 (should move to end)
    notifyEditedRow('1') // Bob's row id
    const newData = data.map((d) => (d.name === 'Bob' ? { ...d, val: 50 } : d))
    rows.value = newData.map((d, i) => mockRow(i, d))

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([10, 30, 40, 50])
    expect(sortedRows.value.map((r: any) => r.original.name)).toEqual([
      'Alice',
      'Charlie',
      'Diana',
      'Bob',
    ])
  })

  it('incremental sort handles row moving to beginning', () => {
    const data = [
      { name: 'Alice', val: 10 },
      { name: 'Bob', val: 20 },
      { name: 'Charlie', val: 30 },
    ]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number' } })
    const { sortedRows, notifyEditedRow } = useNuGridSorting(rows, sorting, table)

    // Initial sort
    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([10, 20, 30])

    // Edit Charlie's val from 30 to 5 (should move to beginning)
    notifyEditedRow('2')
    const newData = data.map((d) => (d.name === 'Charlie' ? { ...d, val: 5 } : d))
    rows.value = newData.map((d, i) => mockRow(i, d))

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([5, 10, 20])
    expect(sortedRows.value.map((r: any) => r.original.name)).toEqual(['Charlie', 'Alice', 'Bob'])
  })

  it('incremental sort handles row staying in place', () => {
    const data = [
      { name: 'Alice', val: 10 },
      { name: 'Bob', val: 20 },
      { name: 'Charlie', val: 30 },
    ]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number' } })
    const { sortedRows, notifyEditedRow } = useNuGridSorting(rows, sorting, table)

    // Initial sort
    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([10, 20, 30])

    // Edit Bob's val from 20 to 25 (stays in middle)
    notifyEditedRow('1')
    const newData = data.map((d) => (d.name === 'Bob' ? { ...d, val: 25 } : d))
    rows.value = newData.map((d, i) => mockRow(i, d))

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([10, 25, 30])
  })

  it('falls back to full sort when row count changes', () => {
    const data = [
      { name: 'Alice', val: 10 },
      { name: 'Bob', val: 20 },
    ]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number' } })
    const { sortedRows, notifyEditedRow } = useNuGridSorting(rows, sorting, table)

    // Initial sort
    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([10, 20])

    // Notify edit, but also add a row (count changed → falls back to full sort)
    notifyEditedRow('0')
    const newData = [
      { name: 'Alice', val: 30 },
      { name: 'Bob', val: 20 },
      { name: 'Charlie', val: 5 },
    ]
    rows.value = newData.map((d, i) => mockRow(i, d))

    // Full sort should still produce correct result
    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([5, 20, 30])
  })

  it('incremental sort with descending order', () => {
    const data = [
      { name: 'Alice', val: 30 },
      { name: 'Bob', val: 20 },
      { name: 'Charlie', val: 10 },
    ]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: true }])
    const table = mockTable({ val: { cellDataType: 'number' } })
    const { sortedRows, notifyEditedRow } = useNuGridSorting(rows, sorting, table)

    // Initial sort (descending)
    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([30, 20, 10])

    // Edit Charlie's val from 10 to 50 (should move to first)
    notifyEditedRow('2')
    const newData = data.map((d) => (d.name === 'Charlie' ? { ...d, val: 50 } : d))
    rows.value = newData.map((d, i) => mockRow(i, d))

    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([50, 30, 20])
  })
})

describe('movedRowIds tracking', () => {
  it('tracks all rows as moved on first sort', () => {
    const data = [{ val: 30 }, { val: 10 }, { val: 20 }]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number' } })
    const { sortedRows, movedRowIds } = useNuGridSorting(rows, sorting, table)

    // Access sortedRows to trigger computed
    sortedRows.value
    // First sort → all rows are "moved"
    expect(movedRowIds.value.size).toBe(3)
  })

  it('tracks only rows that changed position', () => {
    const data = [
      { name: 'Alice', val: 10 },
      { name: 'Bob', val: 20 },
      { name: 'Charlie', val: 30 },
    ]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number' } })
    const { sortedRows, movedRowIds, notifyEditedRow } = useNuGridSorting(rows, sorting, table)

    // Initial sort — already in order
    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([10, 20, 30])

    // Edit Bob's val from 20 to 25 (stays in same position)
    notifyEditedRow('1')
    const newData = data.map((d) => (d.name === 'Bob' ? { ...d, val: 25 } : d))
    rows.value = newData.map((d, i) => mockRow(i, d))
    sortedRows.value // trigger

    // No rows moved (Bob stays in position 1)
    expect(movedRowIds.value.size).toBe(0)
  })

  it('tracks moved rows when positions change', () => {
    const data = [
      { name: 'Alice', val: 10 },
      { name: 'Bob', val: 20 },
      { name: 'Charlie', val: 30 },
    ]
    const rows = ref(data.map((d, i) => mockRow(i, d)))
    const sorting = ref([{ id: 'val', desc: false }])
    const table = mockTable({ val: { cellDataType: 'number' } })
    const { sortedRows, movedRowIds, notifyEditedRow } = useNuGridSorting(rows, sorting, table)

    // Initial sort
    expect(sortedRows.value.map((r: any) => r.original.val)).toEqual([10, 20, 30])

    // Edit Alice's val from 10 to 50 (moves from first to last)
    notifyEditedRow('0')
    const newData = data.map((d) => (d.name === 'Alice' ? { ...d, val: 50 } : d))
    rows.value = newData.map((d, i) => mockRow(i, d))
    sortedRows.value // trigger

    // Bob moved from index 1→0, Charlie from 2→1, Alice from 0→2
    // All three rows are at different positions
    expect(movedRowIds.value.size).toBe(3)
  })
})
