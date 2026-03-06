import type { FilterFn } from '../engine'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function testFalsey(val: any): boolean {
  return val === undefined || val === null || val === ''
}

// ---------------------------------------------------------------------------
// Built-in filter functions — ported from TanStack Table's filterFns.ts
// Same signatures so they can be used as TanStack FilterFn drop-ins.
// ---------------------------------------------------------------------------

const includesString: FilterFn<any> = (row, columnId: string, filterValue: string) => {
  const search = filterValue?.toString()?.toLowerCase()
  return Boolean(row.getValue<string | null>(columnId)?.toString()?.toLowerCase()?.includes(search))
}
includesString.autoRemove = (val: any) => testFalsey(val)

const includesStringSensitive: FilterFn<any> = (row, columnId: string, filterValue: string) => {
  return Boolean(row.getValue<string | null>(columnId)?.toString()?.includes(filterValue))
}
includesStringSensitive.autoRemove = (val: any) => testFalsey(val)

const equalsString: FilterFn<any> = (row, columnId: string, filterValue: string) => {
  return (
    row.getValue<string | null>(columnId)?.toString()?.toLowerCase() === filterValue?.toLowerCase()
  )
}
equalsString.autoRemove = (val: any) => testFalsey(val)

const arrIncludes: FilterFn<any> = (row, columnId: string, filterValue: unknown) => {
  return row.getValue<unknown[]>(columnId)?.includes(filterValue)
}
arrIncludes.autoRemove = (val: any) => testFalsey(val)

const arrIncludesAll: FilterFn<any> = (row, columnId: string, filterValue: unknown[]) => {
  return !filterValue.some((val: unknown) => !row.getValue<unknown[]>(columnId)?.includes(val))
}
arrIncludesAll.autoRemove = (val: any) => testFalsey(val) || !val?.length

const arrIncludesSome: FilterFn<any> = (row, columnId: string, filterValue: unknown[]) => {
  return filterValue.some((val: unknown) => row.getValue<unknown[]>(columnId)?.includes(val))
}
arrIncludesSome.autoRemove = (val: any) => testFalsey(val) || !val?.length

const equals: FilterFn<any> = (row, columnId: string, filterValue: unknown) => {
  return row.getValue(columnId) === filterValue
}
equals.autoRemove = (val: any) => testFalsey(val)

const weakEquals: FilterFn<any> = (row, columnId: string, filterValue: unknown) => {
  return row.getValue(columnId) == filterValue
}
weakEquals.autoRemove = (val: any) => testFalsey(val)

const inNumberRange: FilterFn<any> & {
  resolveFilterValue: (val: [any, any]) => readonly [number, number]
} = Object.assign(
  ((row: any, columnId: string, filterValue: [number, number]) => {
    const [min, max] = filterValue
    const rowValue = row.getValue(columnId) as number
    return rowValue >= min && rowValue <= max
  }) as FilterFn<any>,
  {
    resolveFilterValue: (val: [any, any]): readonly [number, number] => {
      const [unsafeMin, unsafeMax] = val
      let parsedMin = typeof unsafeMin !== 'number' ? parseFloat(unsafeMin as string) : unsafeMin
      let parsedMax = typeof unsafeMax !== 'number' ? parseFloat(unsafeMax as string) : unsafeMax
      let min = unsafeMin === null || Number.isNaN(parsedMin) ? -Infinity : parsedMin
      let max = unsafeMax === null || Number.isNaN(parsedMax) ? Infinity : parsedMax
      if (min > max) {
        const temp = min
        min = max
        max = temp
      }
      return [min, max] as const
    },
    autoRemove: (val: any) => testFalsey(val) || (testFalsey(val[0]) && testFalsey(val[1])),
  },
)

// ---------------------------------------------------------------------------
// Exported registry
// ---------------------------------------------------------------------------

export const filterFns = {
  includesString,
  includesStringSensitive,
  equalsString,
  arrIncludes,
  arrIncludesAll,
  arrIncludesSome,
  equals,
  weakEquals,
  inNumberRange,
}

export type BuiltInFilterFn = keyof typeof filterFns

// ---------------------------------------------------------------------------
// Auto-detection — mirrors TanStack's column.getAutoFilterFn()
// ---------------------------------------------------------------------------

export function autoDetectFilterFn(value: any): BuiltInFilterFn {
  if (typeof value === 'string') return 'includesString'
  if (typeof value === 'number') return 'inNumberRange'
  if (typeof value === 'boolean') return 'equals'
  // Note: TanStack checks typeof === 'object' before Array.isArray,
  // so arrays get 'equals' not 'arrIncludes'. We match this behavior.
  if (value !== null && typeof value === 'object') return 'equals'
  if (Array.isArray(value)) return 'arrIncludes'
  return 'weakEquals'
}

// ---------------------------------------------------------------------------
// Resolve a filter function from column config or auto-detect
// ---------------------------------------------------------------------------

export function resolveFilterFn(
  columnFilterFn: string | FilterFn<any> | undefined,
  firstValue: any,
): FilterFn<any> {
  // 1. Direct function reference
  if (typeof columnFilterFn === 'function') return columnFilterFn

  // 2. String name → look up in built-in registry
  if (typeof columnFilterFn === 'string') {
    const fn = filterFns[columnFilterFn as BuiltInFilterFn]
    if (fn) return fn
  }

  // 3. Auto-detect from first data value
  const detected = autoDetectFilterFn(firstValue)
  return filterFns[detected]
}
