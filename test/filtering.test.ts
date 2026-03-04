import { describe, expect, it } from 'vitest'

// ============================================================================
// Reference implementations — copied verbatim from TanStack Table's filterFns.ts
// (module-private, can't import directly). Used to assert parity.
// ============================================================================

function tanstackTestFalsey(val: any) {
  return val === undefined || val === null || val === ''
}

const tanstackIncludesString = (
  row: any,
  columnId: string,
  filterValue: string,
) => {
  const search = filterValue?.toString()?.toLowerCase()
  return Boolean(
    row
      .getValue(columnId)
      ?.toString()
      ?.toLowerCase()
      ?.includes(search),
  )
}

const tanstackIncludesStringSensitive = (
  row: any,
  columnId: string,
  filterValue: string,
) => {
  return Boolean(
    row.getValue(columnId)?.toString()?.includes(filterValue),
  )
}

const tanstackEqualsString = (
  row: any,
  columnId: string,
  filterValue: string,
) => {
  return (
    row.getValue(columnId)?.toString()?.toLowerCase()
    === filterValue?.toLowerCase()
  )
}

const tanstackArrIncludes = (
  row: any,
  columnId: string,
  filterValue: unknown,
) => {
  return row.getValue(columnId)?.includes(filterValue)
}

const tanstackArrIncludesAll = (
  row: any,
  columnId: string,
  filterValue: unknown[],
) => {
  return !filterValue.some(
    (val: unknown) => !row.getValue(columnId)?.includes(val),
  )
}

const tanstackArrIncludesSome = (
  row: any,
  columnId: string,
  filterValue: unknown[],
) => {
  return filterValue.some((val: unknown) =>
    row.getValue(columnId)?.includes(val),
  )
}

const tanstackEquals = (row: any, columnId: string, filterValue: unknown) => {
  return row.getValue(columnId) === filterValue
}

const tanstackWeakEquals = (row: any, columnId: string, filterValue: unknown) => {
  // eslint-disable-next-line eqeqeq
  return row.getValue(columnId) == filterValue
}

const tanstackInNumberRange = (
  row: any,
  columnId: string,
  filterValue: [number, number],
) => {
  const [min, max] = filterValue
  const rowValue = row.getValue(columnId)
  return rowValue >= min && rowValue <= max
}

function tanstackResolveInNumberRange(val: [any, any]) {
  const [unsafeMin, unsafeMax] = val
  let parsedMin
    = typeof unsafeMin !== 'number' ? parseFloat(unsafeMin as string) : unsafeMin
  let parsedMax
    = typeof unsafeMax !== 'number' ? parseFloat(unsafeMax as string) : unsafeMax
  let min
    = unsafeMin === null || Number.isNaN(parsedMin) ? -Infinity : parsedMin
  let max = unsafeMax === null || Number.isNaN(parsedMax) ? Infinity : parsedMax
  if (min > max) {
    const temp = min
    min = max
    max = temp
  }
  return [min, max] as const
}

// TanStack autoRemove functions for each filterFn
const tanstackAutoRemove = {
  includesString: (val: any) => tanstackTestFalsey(val),
  includesStringSensitive: (val: any) => tanstackTestFalsey(val),
  equalsString: (val: any) => tanstackTestFalsey(val),
  arrIncludes: (val: any) => tanstackTestFalsey(val),
  arrIncludesAll: (val: any) => tanstackTestFalsey(val) || !val?.length,
  arrIncludesSome: (val: any) => tanstackTestFalsey(val) || !val?.length,
  equals: (val: any) => tanstackTestFalsey(val),
  weakEquals: (val: any) => tanstackTestFalsey(val),
  inNumberRange: (val: any) =>
    tanstackTestFalsey(val) || (tanstackTestFalsey(val[0]) && tanstackTestFalsey(val[1])),
}

// TanStack auto-detection of filterFn from data type
function tanstackAutoDetect(value: any): string {
  if (typeof value === 'string') return 'includesString'
  if (typeof value === 'number') return 'inNumberRange'
  if (typeof value === 'boolean') return 'equals'
  if (value !== null && typeof value === 'object') return 'equals'
  if (Array.isArray(value)) return 'arrIncludes'
  return 'weakEquals'
}

// ---------------------------------------------------------------------------
// Reference: NuGrid's globalFilterFn — copied from useNuGridCore.ts lines 413-441
// ---------------------------------------------------------------------------

function tanstackGlobalFilterFn(
  row: any,
  _columnId: string,
  filterValue: string,
  columns: Array<{ accessorKey?: string, id?: string, enableSearching?: boolean }>,
) {
  if (!filterValue || filterValue.length === 0) return true

  const searchLower = filterValue.toLowerCase()

  const searchableColumns = columns.filter((col) => {
    if (!('accessorKey' in col) && !('id' in col)) return false
    return col.enableSearching !== false
  })

  for (const col of searchableColumns) {
    const key = ('accessorKey' in col ? col.accessorKey : col.id) as string
    if (!key) continue

    const cellValue = row.getValue(key)
    if (cellValue == null) continue

    const stringValue = String(cellValue).toLowerCase()
    if (stringValue.includes(searchLower)) {
      return true
    }
  }

  return false
}

// ---------------------------------------------------------------------------
// Helper: create a mock row with getValue function (TanStack Row shape)
// ---------------------------------------------------------------------------

function mockFilterRow(data: Record<string, any>) {
  return {
    getValue: (colId: string) => data[colId],
    original: data,
  }
}

// ============================================================================
// NuGrid imports — import from the new filteringFns.ts
// ============================================================================

import {
  autoDetectFilterFn,
  filterFns,
} from '../src/runtime/utils/filteringFns'

// ============================================================================
// A. Filter function parity tests
// ============================================================================

describe('includesString — parity with TanStack', () => {
  const cases: [any, string, boolean][] = [
    // [cellValue, filterValue, expected]
    ['Hello World', 'hello', true],
    ['Hello World', 'WORLD', true],
    ['Hello World', 'xyz', false],
    ['Hello World', '', true],
    [123, '12', true],
    [123, '123', true],
    [123, '4', false],
    [0, '0', true],
    [null, 'test', false],
    [undefined, 'test', false],
    ['', 'test', false],
    ['', '', true],
    ['Test', 'test', true],
    ['café', 'café', true],
    ['café', 'CAFÉ', true],
  ]

  for (const [cellValue, filterValue, expected] of cases) {
    it(`(${JSON.stringify(cellValue)}, ${JSON.stringify(filterValue)}) === ${expected}`, () => {
      const row = mockFilterRow({ col: cellValue })
      const tanstackResult = tanstackIncludesString(row, 'col', filterValue)
      const nuGridResult = filterFns.includesString(row, 'col', filterValue, () => {})
      expect(tanstackResult).toBe(expected)
      expect(nuGridResult).toBe(expected)
      expect(nuGridResult).toBe(tanstackResult)
    })
  }
})

describe('includesStringSensitive — parity with TanStack', () => {
  const cases: [any, string, boolean][] = [
    ['Hello World', 'Hello', true],
    ['Hello World', 'hello', false],
    ['Hello World', 'World', true],
    ['Hello World', 'WORLD', false],
    ['abc', 'abc', true],
    ['ABC', 'abc', false],
    [null, 'test', false],
    [123, '12', true],
  ]

  for (const [cellValue, filterValue, expected] of cases) {
    it(`(${JSON.stringify(cellValue)}, ${JSON.stringify(filterValue)}) === ${expected}`, () => {
      const row = mockFilterRow({ col: cellValue })
      const tanstackResult = tanstackIncludesStringSensitive(row, 'col', filterValue)
      const nuGridResult = filterFns.includesStringSensitive(row, 'col', filterValue, () => {})
      expect(tanstackResult).toBe(expected)
      expect(nuGridResult).toBe(expected)
      expect(nuGridResult).toBe(tanstackResult)
    })
  }
})

describe('equalsString — parity with TanStack', () => {
  const cases: [any, string, boolean][] = [
    ['hello', 'hello', true],
    ['Hello', 'hello', true],
    ['HELLO', 'hello', true],
    ['hello', 'HELLO', true],
    ['hello', 'hell', false],
    ['hello', 'helloo', false],
    ['', '', true],
    [null, 'test', false],
    [123, '123', true],
    [123, '12', false],
  ]

  for (const [cellValue, filterValue, expected] of cases) {
    it(`(${JSON.stringify(cellValue)}, ${JSON.stringify(filterValue)}) === ${expected}`, () => {
      const row = mockFilterRow({ col: cellValue })
      const tanstackResult = tanstackEqualsString(row, 'col', filterValue)
      const nuGridResult = filterFns.equalsString(row, 'col', filterValue, () => {})
      expect(tanstackResult).toBe(expected)
      expect(nuGridResult).toBe(expected)
      expect(nuGridResult).toBe(tanstackResult)
    })
  }
})

describe('arrIncludes — parity with TanStack', () => {
  const cases: [any, unknown, boolean][] = [
    [['a', 'b', 'c'], 'a', true],
    [['a', 'b', 'c'], 'd', false],
    [[1, 2, 3], 2, true],
    [[1, 2, 3], 4, false],
    [[], 'a', false],
    [null, 'a', undefined as any],
  ]

  for (const [cellValue, filterValue, expected] of cases) {
    it(`(${JSON.stringify(cellValue)}, ${JSON.stringify(filterValue)}) === ${JSON.stringify(expected)}`, () => {
      const row = mockFilterRow({ col: cellValue })
      const tanstackResult = tanstackArrIncludes(row, 'col', filterValue)
      const nuGridResult = filterFns.arrIncludes(row, 'col', filterValue, () => {})
      expect(tanstackResult).toBe(expected)
      expect(nuGridResult).toBe(expected)
      expect(nuGridResult).toBe(tanstackResult)
    })
  }
})

describe('arrIncludesAll — parity with TanStack', () => {
  const cases: [any, unknown[], boolean][] = [
    [['a', 'b', 'c'], ['a', 'b'], true],
    [['a', 'b', 'c'], ['a', 'b', 'c'], true],
    [['a', 'b', 'c'], ['a', 'd'], false],
    [['a', 'b', 'c'], [], true],
    [[1, 2, 3], [1, 3], true],
    [[1, 2, 3], [1, 4], false],
  ]

  for (const [cellValue, filterValue, expected] of cases) {
    it(`(${JSON.stringify(cellValue)}, ${JSON.stringify(filterValue)}) === ${expected}`, () => {
      const row = mockFilterRow({ col: cellValue })
      const tanstackResult = tanstackArrIncludesAll(row, 'col', filterValue)
      const nuGridResult = filterFns.arrIncludesAll(row, 'col', filterValue, () => {})
      expect(tanstackResult).toBe(expected)
      expect(nuGridResult).toBe(expected)
      expect(nuGridResult).toBe(tanstackResult)
    })
  }
})

describe('arrIncludesSome — parity with TanStack', () => {
  const cases: [any, unknown[], boolean][] = [
    [['a', 'b', 'c'], ['a', 'x'], true],
    [['a', 'b', 'c'], ['x', 'y'], false],
    [['a', 'b', 'c'], [], false],
    [[1, 2, 3], [3, 4], true],
    [[1, 2, 3], [4, 5], false],
  ]

  for (const [cellValue, filterValue, expected] of cases) {
    it(`(${JSON.stringify(cellValue)}, ${JSON.stringify(filterValue)}) === ${expected}`, () => {
      const row = mockFilterRow({ col: cellValue })
      const tanstackResult = tanstackArrIncludesSome(row, 'col', filterValue)
      const nuGridResult = filterFns.arrIncludesSome(row, 'col', filterValue, () => {})
      expect(tanstackResult).toBe(expected)
      expect(nuGridResult).toBe(expected)
      expect(nuGridResult).toBe(tanstackResult)
    })
  }
})

describe('equals — parity with TanStack', () => {
  const cases: [any, unknown, boolean][] = [
    [42, 42, true],
    [42, '42', false],
    ['hello', 'hello', true],
    [true, true, true],
    [true, false, false],
    [false, false, true],
    [null, null, true],
    [null, undefined, false],
    [0, false, false],
    [0, '', false],
    ['', 0, false],
    [undefined, undefined, true],
  ]

  for (const [cellValue, filterValue, expected] of cases) {
    it(`(${JSON.stringify(cellValue)}, ${JSON.stringify(filterValue)}) === ${expected}`, () => {
      const row = mockFilterRow({ col: cellValue })
      const tanstackResult = tanstackEquals(row, 'col', filterValue)
      const nuGridResult = filterFns.equals(row, 'col', filterValue, () => {})
      expect(tanstackResult).toBe(expected)
      expect(nuGridResult).toBe(expected)
      expect(nuGridResult).toBe(tanstackResult)
    })
  }
})

describe('weakEquals — parity with TanStack', () => {
  const cases: [any, unknown, boolean][] = [
    [42, 42, true],
    [42, '42', true],
    [0, '', true],
    [0, false, true],
    [null, undefined, true],
    [null, null, true],
    ['hello', 'hello', true],
    [1, true, true],
    [0, null, false],
    ['', null, false],
    ['1', 1, true],
  ]

  for (const [cellValue, filterValue, expected] of cases) {
    it(`(${JSON.stringify(cellValue)}, ${JSON.stringify(filterValue)}) === ${expected}`, () => {
      const row = mockFilterRow({ col: cellValue })
      const tanstackResult = tanstackWeakEquals(row, 'col', filterValue)
      const nuGridResult = filterFns.weakEquals(row, 'col', filterValue, () => {})
      expect(tanstackResult).toBe(expected)
      expect(nuGridResult).toBe(expected)
      expect(nuGridResult).toBe(tanstackResult)
    })
  }
})

describe('inNumberRange — parity with TanStack', () => {
  const cases: [number, [number, number], boolean][] = [
    [25, [20, 30], true],
    [20, [20, 30], true],
    [30, [20, 30], true],
    [19, [20, 30], false],
    [31, [20, 30], false],
    [0, [-10, 10], true],
    [-5, [-10, 0], true],
    [100, [100, 100], true],
  ]

  for (const [cellValue, filterValue, expected] of cases) {
    it(`(${cellValue}, ${JSON.stringify(filterValue)}) === ${expected}`, () => {
      const row = mockFilterRow({ col: cellValue })
      const tanstackResult = tanstackInNumberRange(row, 'col', filterValue)
      const nuGridResult = filterFns.inNumberRange(row, 'col', filterValue, () => {})
      expect(tanstackResult).toBe(expected)
      expect(nuGridResult).toBe(expected)
      expect(nuGridResult).toBe(tanstackResult)
    })
  }
})

// ---------------------------------------------------------------------------
// A2. resolveFilterValue parity (inNumberRange)
// ---------------------------------------------------------------------------

describe('inNumberRange.resolveFilterValue — parity with TanStack', () => {
  const cases: [[any, any], [number, number]][] = [
    [[10, 20], [10, 20]],
    [['10', '20'], [10, 20]],
    [[null, 20], [-Infinity, 20]],
    [[10, null], [10, Infinity]],
    [[null, null], [-Infinity, Infinity]],
    [['abc', 'xyz'], [-Infinity, Infinity]],
    [[30, 10], [10, 30]], // swapped
    [['5', '3'], [3, 5]], // swapped strings
  ]

  for (const [input, expected] of cases) {
    it(`resolveFilterValue(${JSON.stringify(input)}) === ${JSON.stringify(expected)}`, () => {
      const tanstackResult = tanstackResolveInNumberRange(input)
      const nuGridResult = filterFns.inNumberRange.resolveFilterValue!(input)
      expect([...tanstackResult]).toEqual(expected)
      expect([...nuGridResult]).toEqual(expected)
      expect([...nuGridResult]).toEqual([...tanstackResult])
    })
  }
})

// ---------------------------------------------------------------------------
// A3. autoRemove parity
// ---------------------------------------------------------------------------

describe('autoRemove — parity with TanStack', () => {
  const simpleAutoRemoveFns = [
    'includesString',
    'includesStringSensitive',
    'equalsString',
    'arrIncludes',
    'equals',
    'weakEquals',
  ] as const

  const simpleValues = [undefined, null, '', 0, false, 'hello', 42, true]

  for (const fnName of simpleAutoRemoveFns) {
    describe(fnName, () => {
      for (const val of simpleValues) {
        it(`autoRemove(${JSON.stringify(val)})`, () => {
          const tanstackResult = tanstackAutoRemove[fnName](val)
          const nuGridResult = filterFns[fnName].autoRemove!(val)
          expect(nuGridResult).toBe(tanstackResult)
        })
      }
    })
  }

  describe('arrIncludesAll', () => {
    const values = [undefined, null, '', [], [1], [1, 2], 0, false]
    for (const val of values) {
      it(`autoRemove(${JSON.stringify(val)})`, () => {
        const tanstackResult = tanstackAutoRemove.arrIncludesAll(val)
        const nuGridResult = filterFns.arrIncludesAll.autoRemove!(val)
        expect(nuGridResult).toBe(tanstackResult)
      })
    }
  })

  describe('arrIncludesSome', () => {
    const values = [undefined, null, '', [], [1], [1, 2], 0, false]
    for (const val of values) {
      it(`autoRemove(${JSON.stringify(val)})`, () => {
        const tanstackResult = tanstackAutoRemove.arrIncludesSome(val)
        const nuGridResult = filterFns.arrIncludesSome.autoRemove!(val)
        expect(nuGridResult).toBe(tanstackResult)
      })
    }
  })

  describe('inNumberRange', () => {
    const values: any[] = [
      undefined, null, '',
      [null, null], [undefined, undefined], ['', ''],
      [10, 20], [null, 20], [10, null],
      0, false,
    ]
    for (const val of values) {
      it(`autoRemove(${JSON.stringify(val)})`, () => {
        const tanstackResult = tanstackAutoRemove.inNumberRange(val)
        const nuGridResult = filterFns.inNumberRange.autoRemove!(val)
        expect(nuGridResult).toBe(tanstackResult)
      })
    }
  })
})

// ============================================================================
// B. Auto-detection parity tests
// ============================================================================

describe('autoDetectFilterFn — parity with TanStack', () => {
  const cases: [any, string][] = [
    ['hello', 'includesString'],
    ['', 'includesString'],
    [42, 'inNumberRange'],
    [0, 'inNumberRange'],
    [-1.5, 'inNumberRange'],
    [NaN, 'inNumberRange'],
    [true, 'equals'],
    [false, 'equals'],
    [{ key: 'value' }, 'equals'],
    [{}, 'equals'],
    // Note: TanStack has a bug where Array.isArray check comes after typeof === 'object',
    // so arrays get detected as 'equals' not 'arrIncludes'. We match TanStack's behavior.
    [null, 'weakEquals'],
    [undefined, 'weakEquals'],
  ]

  for (const [value, expected] of cases) {
    it(`autoDetect(${JSON.stringify(value)}) === ${JSON.stringify(expected)}`, () => {
      const tanstackResult = tanstackAutoDetect(value)
      const nuGridResult = autoDetectFilterFn(value)
      expect(tanstackResult).toBe(expected)
      expect(nuGridResult).toBe(expected)
      expect(nuGridResult).toBe(tanstackResult)
    })
  }
})

// ============================================================================
// C. Column filter pipeline tests
// ============================================================================

import { ref } from 'vue'

import { useNuGridFiltering } from '../src/runtime/composables/_internal/useNuGridFiltering'

describe('useNuGridFiltering — column filters', () => {
  const rawData = [
    { id: '1', name: 'Alice', age: 30, active: true, tags: ['admin', 'user'] },
    { id: '2', name: 'Bob', age: 25, active: false, tags: ['user'] },
    { id: '3', name: 'Charlie', age: 35, active: true, tags: ['admin'] },
    { id: '4', name: 'Diana', age: 28, active: false, tags: ['guest'] },
    { id: '5', name: 'Eve', age: 30, active: true, tags: ['admin', 'user', 'guest'] },
    { id: '6', name: null as any, age: null as any, active: null as any, tags: null as any },
  ]

  function createFiltering(
    columnFilters: { id: string, value: any }[] = [],
    globalFilter: string | undefined = undefined,
    columnsOverride?: any[],
  ) {
    const data = ref([...rawData])
    const columns = ref(columnsOverride ?? [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'age', header: 'Age' },
      { accessorKey: 'active', header: 'Active' },
      { accessorKey: 'tags', header: 'Tags' },
    ])
    const globalFilterRef = ref(globalFilter)
    const columnFiltersRef = ref(columnFilters)

    const { filteredData } = useNuGridFiltering(data, columns as any, globalFilterRef, columnFiltersRef)
    return { filteredData, data, globalFilterRef, columnFiltersRef, columns }
  }

  it('returns all data when no filters active', () => {
    const { filteredData } = createFiltering()
    expect(filteredData.value).toHaveLength(rawData.length)
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '2', '3', '4', '5', '6'])
  })

  it('returns same array reference when no filters active', () => {
    const { filteredData, data } = createFiltering()
    expect(filteredData.value).toBe(data.value)
  })

  it('filters by text column (includesString auto-detected)', () => {
    const { filteredData } = createFiltering([{ id: 'name', value: 'ali' }])
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1'])
  })

  it('filters by text column case-insensitively', () => {
    const { filteredData } = createFiltering([{ id: 'name', value: 'ALI' }])
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1'])
  })

  it('filters by number column (inNumberRange auto-detected)', () => {
    const { filteredData } = createFiltering([{ id: 'age', value: [25, 30] }])
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '2', '4', '5'])
  })

  it('filters by boolean column (equals auto-detected)', () => {
    const { filteredData } = createFiltering([{ id: 'active', value: true }])
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '3', '5'])
  })

  it('combines multiple column filters with AND logic', () => {
    const { filteredData } = createFiltering([
      { id: 'active', value: true },
      { id: 'age', value: [28, 32] },
    ])
    // active=true AND age in [28,32]: Alice(30,true) and Eve(30,true)
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '5'])
  })

  it('handles null cell values gracefully', () => {
    const { filteredData } = createFiltering([{ id: 'name', value: 'test' }])
    // Row 6 has null name — should not match
    expect(filteredData.value.map((d: any) => d.id)).not.toContain('6')
  })

  it('removes filter when value triggers autoRemove (empty string)', () => {
    const { filteredData } = createFiltering([{ id: 'name', value: '' }])
    // autoRemove should kick in — empty string means no filter
    expect(filteredData.value).toHaveLength(rawData.length)
  })

  it('removes filter when value is undefined', () => {
    const { filteredData } = createFiltering([{ id: 'name', value: undefined }])
    expect(filteredData.value).toHaveLength(rawData.length)
  })

  it('removes filter when value is null', () => {
    const { filteredData } = createFiltering([{ id: 'name', value: null }])
    expect(filteredData.value).toHaveLength(rawData.length)
  })

  it('ignores filter for unknown column ID', () => {
    const { filteredData } = createFiltering([{ id: 'nonexistent', value: 'test' }])
    expect(filteredData.value).toHaveLength(rawData.length)
  })

  it('supports custom filterFn on column definition', () => {
    const customFilterFn = (row: any, columnId: string, filterValue: any) => {
      const val = row.getValue(columnId)
      return typeof val === 'number' && val > filterValue
    }
    const { filteredData } = createFiltering(
      [{ id: 'age', value: 29 }],
      undefined,
      [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'age', header: 'Age', filterFn: customFilterFn },
        { accessorKey: 'active', header: 'Active' },
        { accessorKey: 'tags', header: 'Tags' },
      ],
    )
    // Custom filterFn: age > 29 → Alice(30), Charlie(35), Eve(30)
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '3', '5'])
  })

  it('reacts to filter state changes', () => {
    const { filteredData, columnFiltersRef } = createFiltering()
    expect(filteredData.value).toHaveLength(rawData.length)

    columnFiltersRef.value = [{ id: 'name', value: 'bob' }]
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['2'])

    columnFiltersRef.value = []
    expect(filteredData.value).toHaveLength(rawData.length)
  })

  it('reacts to data changes', () => {
    const { filteredData, data } = createFiltering([{ id: 'name', value: 'ali' }])
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1'])

    data.value = [
      ...data.value,
      { id: '7', name: 'Alicia', age: 22, active: true, tags: ['user'] } as any,
    ]
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '7'])
  })
})

// ============================================================================
// D. Global filter parity tests
// ============================================================================

describe('useNuGridFiltering — global filter', () => {
  const rawData = [
    { id: '1', name: 'Alice', age: 30, dept: 'Engineering' },
    { id: '2', name: 'Bob', age: 25, dept: 'Marketing' },
    { id: '3', name: 'Charlie', age: 35, dept: 'Engineering' },
    { id: '4', name: 'Diana', age: 28, dept: 'Sales' },
  ]

  const columns = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'age', header: 'Age' },
    { accessorKey: 'dept', header: 'Department' },
  ]

  function createGlobalFilter(globalFilter: string | undefined, columnsOverride?: any[]) {
    const data = ref([...rawData])
    const cols = ref(columnsOverride ?? columns)
    const globalFilterRef = ref(globalFilter)
    const columnFiltersRef = ref([] as { id: string, value: any }[])

    const { filteredData } = useNuGridFiltering(data, cols as any, globalFilterRef, columnFiltersRef)
    return { filteredData, globalFilterRef }
  }

  it('returns all rows when global filter is empty', () => {
    const { filteredData } = createGlobalFilter('')
    expect(filteredData.value).toHaveLength(4)
  })

  it('returns all rows when global filter is undefined', () => {
    const { filteredData } = createGlobalFilter(undefined)
    expect(filteredData.value).toHaveLength(4)
  })

  it('matches in name column', () => {
    const { filteredData } = createGlobalFilter('ali')
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1'])
  })

  it('matches in dept column', () => {
    const { filteredData } = createGlobalFilter('engineering')
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '3'])
  })

  it('matches numeric values as strings', () => {
    const { filteredData } = createGlobalFilter('25')
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['2'])
  })

  it('returns empty when no match', () => {
    const { filteredData } = createGlobalFilter('zzz')
    expect(filteredData.value).toHaveLength(0)
  })

  it('is case-insensitive', () => {
    const { filteredData } = createGlobalFilter('ALICE')
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1'])
  })

  it('excludes columns with enableSearching: false', () => {
    const { filteredData } = createGlobalFilter('engineering', [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'age', header: 'Age' },
      { accessorKey: 'dept', header: 'Department', enableSearching: false },
    ])
    // 'engineering' only appears in dept, but dept is excluded from search
    expect(filteredData.value).toHaveLength(0)
  })

  it('parity with reference globalFilterFn', () => {
    const searchValues = ['ali', 'engineering', '25', 'zzz', '', 'a']
    for (const search of searchValues) {
      const { filteredData } = createGlobalFilter(search)
      const nuGridIds = filteredData.value.map((d: any) => d.id)

      // Run reference implementation
      const referenceIds = rawData
        .filter((item) => {
          const row = mockFilterRow(item)
          return tanstackGlobalFilterFn(row, '', search, columns)
        })
        .map((d) => d.id)

      expect(nuGridIds).toEqual(referenceIds)
    }
  })

  it('handles null cell values', () => {
    const dataWithNulls = [
      ...rawData,
      { id: '5', name: null as any, age: null as any, dept: null as any },
    ]
    const data = ref(dataWithNulls)
    const cols = ref(columns)
    const globalFilterRef = ref('ali')
    const columnFiltersRef = ref([] as { id: string, value: any }[])

    const { filteredData } = useNuGridFiltering(data, cols as any, globalFilterRef, columnFiltersRef)
    // Null row should not match
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1'])
  })

  it('reacts to global filter changes', () => {
    const { filteredData, globalFilterRef } = createGlobalFilter(undefined)
    expect(filteredData.value).toHaveLength(4)

    globalFilterRef.value = 'bob'
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['2'])

    globalFilterRef.value = undefined
    expect(filteredData.value).toHaveLength(4)
  })
})

// ============================================================================
// E. Integration: global filter + column filters combined
// ============================================================================

describe('useNuGridFiltering — combined global + column filters', () => {
  const rawData = [
    { id: '1', name: 'Alice', age: 30, dept: 'Engineering' },
    { id: '2', name: 'Bob', age: 25, dept: 'Marketing' },
    { id: '3', name: 'Charlie', age: 35, dept: 'Engineering' },
    { id: '4', name: 'Diana', age: 28, dept: 'Sales' },
    { id: '5', name: 'Eve', age: 30, dept: 'Engineering' },
  ]

  const columns = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'age', header: 'Age' },
    { accessorKey: 'dept', header: 'Department' },
  ]

  function createCombined(
    columnFilters: { id: string, value: any }[],
    globalFilter: string | undefined,
  ) {
    const data = ref([...rawData])
    const cols = ref(columns)
    const globalFilterRef = ref(globalFilter)
    const columnFiltersRef = ref(columnFilters)

    const { filteredData } = useNuGridFiltering(data, cols as any, globalFilterRef, columnFiltersRef)
    return { filteredData }
  }

  it('applies column filter AND global filter', () => {
    // Column filter: age in [25, 30] → Alice, Bob, Diana, Eve
    // Global filter: 'engineering' matches dept → Alice, Charlie, Eve
    // Combined (AND): Alice, Eve
    const { filteredData } = createCombined(
      [{ id: 'age', value: [25, 30] }],
      'engineering',
    )
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '5'])
  })

  it('column filter narrows, global filter narrows further', () => {
    // Column filter: dept includes 'engin' → rows in Engineering
    // Global filter: 'ali' → Alice
    const { filteredData } = createCombined(
      [{ id: 'dept', value: 'engin' }],
      'ali',
    )
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1'])
  })

  it('non-overlapping filters return empty', () => {
    // Column filter: dept includes 'sales' → Diana
    // Global filter: 'alice' → Alice
    // No overlap → empty
    const { filteredData } = createCombined(
      [{ id: 'dept', value: 'sales' }],
      'alice',
    )
    expect(filteredData.value).toHaveLength(0)
  })

  it('empty global filter with active column filter', () => {
    const { filteredData } = createCombined(
      [{ id: 'dept', value: 'engin' }],
      '',
    )
    // Only column filter applies
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '3', '5'])
  })

  it('active global filter with auto-removed column filter', () => {
    const { filteredData } = createCombined(
      [{ id: 'name', value: '' }], // autoRemove kicks in → no column filter
      'engineering',
    )
    // Only global filter applies
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '3', '5'])
  })
})

// ============================================================================
// F. Edge cases
// ============================================================================

describe('useNuGridFiltering — edge cases', () => {
  it('handles empty data array', () => {
    const data = ref([] as any[])
    const columns = ref([{ accessorKey: 'name', header: 'Name' }])
    const globalFilter = ref('test')
    const columnFilters = ref([{ id: 'name', value: 'test' }])

    const { filteredData } = useNuGridFiltering(data, columns as any, globalFilter, columnFilters)
    expect(filteredData.value).toHaveLength(0)
  })

  it('handles columns with no accessorKey', () => {
    const data = ref([{ id: '1', name: 'Alice' }])
    const columns = ref([
      { id: 'display', header: 'Display' }, // no accessorKey
      { accessorKey: 'name', header: 'Name' },
    ])
    const globalFilter = ref('alice')
    const columnFilters = ref([] as any[])

    const { filteredData } = useNuGridFiltering(data, columns as any, globalFilter, columnFilters)
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1'])
  })

  it('handles data items with missing fields', () => {
    const data = ref([
      { id: '1', name: 'Alice' },
      { id: '2' }, // no name field
    ])
    const columns = ref([{ accessorKey: 'name', header: 'Name' }])
    const globalFilter = ref(undefined)
    const columnFilters = ref([{ id: 'name', value: 'ali' }])

    const { filteredData } = useNuGridFiltering(data, columns as any, globalFilter, columnFilters)
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1'])
  })
})

// ============================================================================
// G. Incremental cell edit optimization
// ============================================================================

describe('useNuGridFiltering — incremental cell edit', () => {
  const rawData = [
    { id: '1', name: 'Alice', age: 30, dept: 'Engineering' },
    { id: '2', name: 'Bob', age: 25, dept: 'Marketing' },
    { id: '3', name: 'Charlie', age: 35, dept: 'Engineering' },
    { id: '4', name: 'Diana', age: 28, dept: 'Sales' },
  ]

  const columns = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'age', header: 'Age' },
    { accessorKey: 'dept', header: 'Department' },
  ]

  function createWithNotify(
    columnFilters: { id: string, value: any }[] = [],
    globalFilter?: string,
  ) {
    const data = ref(rawData.map(d => ({ ...d })))
    const cols = ref(columns)
    const globalFilterRef = ref(globalFilter)
    const columnFiltersRef = ref(columnFilters)

    const { filteredData, notifyEditedCell } = useNuGridFiltering(
      data, cols as any, globalFilterRef, columnFiltersRef,
    )
    return { filteredData, notifyEditedCell, data }
  }

  it('returns same array reference when editing non-filtered column', () => {
    const { filteredData, notifyEditedCell, data } = createWithNotify(
      [{ id: 'name', value: 'ali' }],
    )
    // Initial filter: only Alice passes
    const firstResult = filteredData.value
    expect(firstResult.map((d: any) => d.id)).toEqual(['1'])

    // Edit 'dept' (not in any filter) — signal, then mutate
    notifyEditedCell('dept')
    ;(data.value[0] as any).dept = 'Sales'
    data.value = [...data.value]

    const secondResult = filteredData.value
    expect(secondResult.map((d: any) => d.id)).toEqual(['1'])
    // Same reference — no recomputation
    expect(secondResult).toBe(firstResult)
  })

  it('refilters when editing a filtered column', () => {
    const { filteredData, notifyEditedCell, data } = createWithNotify(
      [{ id: 'name', value: 'ali' }],
    )
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1'])

    // Edit 'name' (in an active filter) — change Bob to Alison
    notifyEditedCell('name')
    ;(data.value[1] as any).name = 'Alison'
    data.value = [...data.value]

    // Should refilter and now include both
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '2'])
  })

  it('refilters when editing a column in global search', () => {
    const { filteredData, notifyEditedCell, data } = createWithNotify(
      [],
      'engineering',
    )
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '3'])

    // Edit 'dept' (searchable column, global filter active)
    notifyEditedCell('dept')
    ;(data.value[1] as any).dept = 'Engineering'
    data.value = [...data.value]

    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '2', '3'])
  })

  it('returns same reference when editing non-searchable column with global filter', () => {
    const cols = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'age', header: 'Age', enableSearching: false },
      { accessorKey: 'dept', header: 'Department' },
    ]
    const data = ref(rawData.map(d => ({ ...d })))
    const globalFilterRef = ref('engineering')
    const columnFiltersRef = ref([] as { id: string, value: any }[])

    const { filteredData, notifyEditedCell } = useNuGridFiltering(
      data, ref(cols) as any, globalFilterRef, columnFiltersRef,
    )
    const firstResult = filteredData.value
    expect(firstResult.map((d: any) => d.id)).toEqual(['1', '3'])

    // Edit 'age' (not searchable) — should return same reference
    notifyEditedCell('age')
    ;(data.value[0] as any).age = 99
    data.value = [...data.value]

    expect(filteredData.value).toBe(firstResult)
  })

  it('does full filter without notifyEditedCell (external data change)', () => {
    const { filteredData, data } = createWithNotify(
      [{ id: 'name', value: 'ali' }],
    )
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1'])

    // External data change (no notifyEditedCell) — change Bob to Alina
    ;(data.value[1] as any).name = 'Alina'
    data.value = [...data.value]

    // Full filter should pick up the change
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '2'])
  })
})

// ============================================================================
// H. Pre-computed search index
// ============================================================================

describe('useNuGridFiltering — search index optimization', () => {
  it('global filter uses pre-computed lowercased strings', () => {
    const data = ref([
      { id: '1', name: 'Alice', dept: 'Engineering' },
      { id: '2', name: 'Bob', dept: 'Marketing' },
      { id: '3', name: 'Charlie', dept: 'Engineering' },
    ])
    const columns = ref([
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'dept', header: 'Department' },
    ])
    const globalFilterRef = ref('engin')
    const columnFiltersRef = ref([] as any[])

    const { filteredData } = useNuGridFiltering(data, columns as any, globalFilterRef, columnFiltersRef)
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '3'])

    // Change search — search index doesn't rebuild, only filter value changes
    globalFilterRef.value = 'market'
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['2'])

    // Change search again
    globalFilterRef.value = 'alice'
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1'])
  })

  it('search index rebuilds when data changes', () => {
    const data = ref([
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ])
    const columns = ref([{ accessorKey: 'name', header: 'Name' }])
    const globalFilterRef = ref('ali')
    const columnFiltersRef = ref([] as any[])

    const { filteredData } = useNuGridFiltering(data, columns as any, globalFilterRef, columnFiltersRef)
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1'])

    // Add new matching data
    data.value = [...data.value, { id: '3', name: 'Alicia' }]
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '3'])
  })

  it('search index respects enableSearching: false', () => {
    const data = ref([
      { id: '1', name: 'Alice', secret: 'hidden-match' },
      { id: '2', name: 'Bob', secret: 'hidden-match' },
    ])
    const columns = ref([
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'secret', header: 'Secret', enableSearching: false },
    ])
    const globalFilterRef = ref('hidden')
    const columnFiltersRef = ref([] as any[])

    const { filteredData } = useNuGridFiltering(data, columns as any, globalFilterRef, columnFiltersRef)
    // 'hidden' only exists in non-searchable column
    expect(filteredData.value).toHaveLength(0)
  })
})

// ============================================================================
// I. Single-filter fast path
// ============================================================================

describe('useNuGridFiltering — single-filter fast path', () => {
  const rawData = [
    { id: '1', name: 'Alice', age: 30 },
    { id: '2', name: 'Bob', age: 25 },
    { id: '3', name: 'Charlie', age: 35 },
    { id: '4', name: 'Alicia', age: 28 },
    { id: '5', name: 'Diana', age: 30 },
  ]

  function createSingleFilter(filter: { id: string, value: any }, columnsOverride?: any[]) {
    const data = ref([...rawData])
    const columns = ref(columnsOverride ?? [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'age', header: 'Age' },
    ])
    const globalFilterRef = ref(undefined as string | undefined)
    const columnFiltersRef = ref([filter])

    const { filteredData } = useNuGridFiltering(data, columns as any, globalFilterRef, columnFiltersRef)
    return { filteredData, data, columnFiltersRef }
  }

  it('single includesString filter (inlined fast path)', () => {
    const { filteredData } = createSingleFilter({ id: 'name', value: 'ali' })
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '4'])
  })

  it('single inNumberRange filter', () => {
    const { filteredData } = createSingleFilter({ id: 'age', value: [25, 30] })
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '2', '4', '5'])
  })

  it('single custom filterFn', () => {
    const customFn = (row: any, colId: string, filterValue: any) => {
      return row.getValue(colId) > filterValue
    }
    const { filteredData } = createSingleFilter(
      { id: 'age', value: 28 },
      [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'age', header: 'Age', filterFn: customFn },
      ],
    )
    // age > 28: Alice(30), Charlie(35), Diana(30)
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '3', '5'])
  })

  it('falls back to general path when global filter is also active', () => {
    const data = ref([...rawData])
    const columns = ref([
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'age', header: 'Age' },
    ])
    const globalFilterRef = ref('ali')
    const columnFiltersRef = ref([{ id: 'age', value: [25, 30] }])

    const { filteredData } = useNuGridFiltering(data, columns as any, globalFilterRef, columnFiltersRef)
    // Column: age in [25,30] → Alice, Bob, Alicia, Diana
    // Global: 'ali' matches Alice, Alicia
    // Combined: Alice, Alicia
    expect(filteredData.value.map((d: any) => d.id)).toEqual(['1', '4'])
  })

  it('produces same results as general path', () => {
    // Compare single-filter output with multi-filter output (add a dummy auto-removed filter)
    const data1 = ref([...rawData])
    const data2 = ref([...rawData])
    const columns = ref([
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'age', header: 'Age' },
    ])

    // Single filter path
    const single = useNuGridFiltering(
      data1, columns as any, ref(undefined), ref([{ id: 'name', value: 'ali' }]),
    )

    // Force general path by adding a second filter
    const multi = useNuGridFiltering(
      data2, columns as any, ref(undefined),
      ref([
        { id: 'name', value: 'ali' },
        { id: 'age', value: [0, 100] }, // passes everything
      ]),
    )

    expect(single.filteredData.value.map((d: any) => d.id))
      .toEqual(multi.filteredData.value.map((d: any) => d.id))
  })
})
