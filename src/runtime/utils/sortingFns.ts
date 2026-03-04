/**
 * NuGrid sorting comparator functions.
 *
 * Ported from TanStack Table's sortingFns with one key difference:
 * these operate on raw values (not Row objects), making them testable
 * without TanStack scaffolding and reusable outside the grid.
 */

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

/** Regex for splitting strings on numeric groups: "item10" → ["item", "10"] */
export const reSplitAlphaNumeric = /([0-9]+)/gm

/**
 * Convert a value to a string for comparison purposes.
 * Numbers that are NaN, Infinity, or -Infinity become empty string.
 */
export function toString(a: unknown): string {
  if (typeof a === 'number') {
    if (isNaN(a) || a === Infinity || a === -Infinity) {
      return ''
    }
    return String(a)
  }
  if (typeof a === 'string') {
    return a
  }
  return ''
}

/**
 * Simple three-way comparator using JS operators.
 * Works for numbers, strings, booleans — anything comparable with > and ===.
 */
export function compareBasic(a: unknown, b: unknown): number {
  return a === b ? 0 : (a as any) > (b as any) ? 1 : -1
}

/**
 * Alphanumeric comparator — splits strings on digit groups and compares
 * numeric chunks numerically, text chunks lexicographically.
 *
 * "item2" < "item10" (not lexicographic order)
 * "v1.0" < "v2.0" < "v10.0"
 */
export function compareAlphanumeric(aStr: string, bStr: string): number {
  const a = aStr.split(reSplitAlphaNumeric).filter(Boolean)
  const b = bStr.split(reSplitAlphaNumeric).filter(Boolean)

  while (a.length && b.length) {
    const aa = a.shift()!
    const bb = b.shift()!

    const an = parseInt(aa, 10)
    const bn = parseInt(bb, 10)

    const combo = [an, bn].sort()

    // Both are strings (both NaN)
    if (isNaN(combo[0]!)) {
      if (aa > bb) return 1
      if (bb > aa) return -1
      continue
    }

    // One is a string, one is a number
    if (isNaN(combo[1]!)) {
      return isNaN(an) ? -1 : 1
    }

    // Both are numbers
    if (an > bn) return 1
    if (bn > an) return -1
  }

  return a.length - b.length
}

// ---------------------------------------------------------------------------
// High-level comparators — take raw values, return sort integer
// ---------------------------------------------------------------------------

/** Case-insensitive alphanumeric sort (smart number handling in strings) */
export function sortAlphanumeric(a: unknown, b: unknown): number {
  return compareAlphanumeric(
    toString(a).toLowerCase(),
    toString(b).toLowerCase(),
  )
}

/** Case-sensitive alphanumeric sort */
export function sortAlphanumericCaseSensitive(a: unknown, b: unknown): number {
  return compareAlphanumeric(toString(a), toString(b))
}

/** Fast case-insensitive text sort (no numeric awareness) */
export function sortText(a: unknown, b: unknown): number {
  return compareBasic(toString(a).toLowerCase(), toString(b).toLowerCase())
}

/** Fast case-sensitive text sort */
export function sortTextCaseSensitive(a: unknown, b: unknown): number {
  return compareBasic(toString(a), toString(b))
}

/** Date sort — handles Date objects, nullish values */
export function sortDatetime(a: unknown, b: unknown): number {
  // Use > and < because === doesn't work with Date objects
  return (a as Date) > (b as Date) ? 1 : (a as Date) < (b as Date) ? -1 : 0
}

/** Basic sort — works for numbers, booleans, any comparable type */
export function sortBasic(a: unknown, b: unknown): number {
  return compareBasic(a, b)
}

// ---------------------------------------------------------------------------
// Comparator registry — named string → function mapping
// ---------------------------------------------------------------------------

export type SortingFnName =
  | 'alphanumeric'
  | 'alphanumericCaseSensitive'
  | 'text'
  | 'textCaseSensitive'
  | 'datetime'
  | 'basic'

const sortingFnMap: Record<SortingFnName, (a: unknown, b: unknown) => number> = {
  alphanumeric: sortAlphanumeric,
  alphanumericCaseSensitive: sortAlphanumericCaseSensitive,
  text: sortText,
  textCaseSensitive: sortTextCaseSensitive,
  datetime: sortDatetime,
  basic: sortBasic,
}

// ---------------------------------------------------------------------------
// Comparator resolver — column config → comparator function
// ---------------------------------------------------------------------------

/**
 * Resolve a comparator function from column configuration.
 *
 * @param sortingFn - Column's sortingFn: a named string, custom function, or undefined
 * @param inferredType - The inferred cell data type (from inferCellDataType)
 * @returns A comparator function (a, b) => number
 */
export function resolveComparator(
  sortingFn: string | ((a: unknown, b: unknown) => number) | undefined,
  inferredType: string | undefined,
): (a: unknown, b: unknown) => number {
  // Custom function takes priority
  if (typeof sortingFn === 'function') {
    return sortingFn
  }

  // Named string → lookup in registry
  if (typeof sortingFn === 'string' && sortingFn in sortingFnMap) {
    return sortingFnMap[sortingFn as SortingFnName]
  }

  // Auto-detect from inferred cell type
  if (inferredType) {
    switch (inferredType) {
      case 'date':
        return sortDatetime
      case 'number':
      case 'currency':
      case 'percentage':
      case 'boolean':
        return sortBasic
      case 'text':
        return sortAlphanumeric
    }
  }

  // Fallback
  return sortBasic
}
