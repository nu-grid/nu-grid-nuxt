# Replace TanStack sorting with NuGrid-owned sorting

## Why
TanStack's sorting is memoized internally and doesn't integrate cleanly with Vue's reactivity. This causes:
- `dataVersion` counter hack to force re-evaluation of `getRowModel()`
- Reference cloning trick (`sortingState.value = [...]`) to invalidate sort memo
- Reactive timing mismatches between sync/pre-flush watchers
- No seam between "data changed" and "rows re-sorted" for animation/focus preservation

Sorting is the simplest part of TanStack's pipeline — ~80 lines of comparator logic. We already own sort stability, FLIP animation, focus preservation. Owning the sort itself removes the last reactive coupling.

## Approach

### New composable: `useNuGridSorting.ts`
A standalone composable that takes unsorted rows + sorting state and returns sorted rows. No TanStack memo dependency. Runs as a normal Vue computed — no memo invalidation tricks needed.

### Comparator functions
Port TanStack's 6 built-in sort functions (~115 lines total, pure functions, no framework coupling). Use NuGrid's existing `inferCellDataType` for auto-detection instead of TanStack's first-10-rows heuristic.

### `sortAccessor` — sort by a different field
New column option: `sortAccessor: string | ((row: T) => unknown)`. Lets a column display one field but sort by another.

Example — display `statusText` but sort by `statusSort`:
```ts
{ accessorKey: 'statusText', header: 'Status', sortAccessor: 'statusSort' }
// or with a function:
{ accessorKey: 'statusText', header: 'Status', sortAccessor: (row) => row.statusSort }
```

Currently in Buoy this requires the workaround of setting `accessorKey: 'statusSort'` and using a custom cell template to render the display value. With `sortAccessor`, the column accessor points to the display field naturally.

### Test-first: parity with TanStack
Write vitest tests that run both TanStack's comparator helpers and ours against identical inputs, asserting identical output. This guarantees behavioral parity before we swap.

## Changes

### 1. Column type: add `sortAccessor`
**Files:** `src/runtime/types/column.ts`, `src/runtime/types/tanstack-table.d.ts`

```ts
/**
 * Override which value is used for sorting.
 * When a string, reads that key from the row data.
 * When a function, calls it with the row to get the sort value.
 * Useful when a column displays one field (e.g. statusText) but should
 * sort by another (e.g. statusSort).
 */
sortAccessor?: string | ((row: T) => unknown)
```

### 2. Sort comparator functions
**New file:** `src/runtime/utils/sortingFns.ts`

Port from TanStack — pure functions, no Row dependency:
```ts
export function compareBasic(a: unknown, b: unknown): number
export function compareAlphanumeric(aStr: string, bStr: string): number
export function toString(a: unknown): string

// High-level comparators (take raw values, handle toString internally)
export function sortText(a: unknown, b: unknown): number
export function sortAlphanumeric(a: unknown, b: unknown): number
export function sortDatetime(a: unknown, b: unknown): number
export function sortBasic(a: unknown, b: unknown): number
```

Key difference from TanStack: our functions take raw values, not Row objects. Testable without TanStack scaffolding. Reusable outside the grid.

Also export a `resolveComparator` function that maps column type → comparator:
```ts
export function resolveComparator(
  sortingFn: string | ((a: unknown, b: unknown) => number) | undefined,
  inferredType: string | undefined,
): (a: unknown, b: unknown) => number
```

Auto-detection mapping (uses NuGrid's existing `inferCellDataType` results):
- `'date'` → `sortDatetime`
- `'number'` / `'currency'` / `'percentage'` → `sortBasic`
- `'text'` → `sortAlphanumeric` (matches TanStack's auto behavior for text with numbers)
- `'boolean'` → `sortBasic`
- Custom function passed → use directly
- Named string (`'alphanumeric'`, `'text'`, `'datetime'`, `'basic'`) → map to our function
- fallback → `sortBasic`

### 3. Sort engine composable
**New file:** `src/runtime/composables/_internal/useNuGridSorting.ts`

```ts
export function useNuGridSorting<T extends TableData>(
  rows: Ref<Row<T>[]>,
  sortingState: Ref<SortingState>,
  table: Table<T>,  // to access column.columnDef for sortingFn, sortAccessor, sortUndefined, invertSorting
) {
  const sortedRows = computed(() => {
    if (!sortingState.value.length) return rows.value
    return sortRows(rows.value, sortingState.value, table)
  })
  return { sortedRows }
}
```

The `sortRows` function:
- Builds comparator chain from `sortingState` + column config
- For each column, resolves the sort value:
  - If `sortAccessor` is a string → `row.original[sortAccessor]`
  - If `sortAccessor` is a function → `sortAccessor(row.original)`
  - Otherwise → `row.getValue(columnId)` (standard TanStack accessor)
- Handles `sortUndefined` (all 5 forms: `false`, `-1`, `1`, `'first'`, `'last'`)
- Applies `isDesc` and `invertSorting` flags
- Stable sort fallback: `rowA.index - rowB.index` for ties
- Recursively sorts sub-rows (needed for grouping)

### 4. Wire into NuGrid pipeline
**File:** `src/runtime/composables/_internal/useNuGridCore.ts`
- Remove `getSortedRowModel: getSortedRowModel()` from TanStack options
- Add `manualSorting: true` to tell TanStack to skip its internal sort step
- TanStack pipeline becomes: Core → Filtered → Grouped → ~~Sorted~~ → Expanded → Paginated
- Our sort slots in between grouped and the rest

**File:** `src/runtime/components/NuGrid.vue`
- `tableRows` computed now returns grouped-but-unsorted rows (TanStack's `getRowModel()` skips sorting with `manualSorting: true`)
- Pipe `tableRows` through `useNuGridSorting` to get `sortedRows`
- Feed `sortedRows` into `useNuGridSortStability` (replacing current `tableRows` input)
- Keep `dataVersion` hack for now — still needed for filtering/grouping pipeline stages

### 5. Simplify sort stability
**File:** `src/runtime/composables/_internal/useNuGridSortStability.ts`

With sorting as a Vue computed:
- **Resort mode `onAfterSortedCellEdit`**: remove `sortingState.value = [...sortingState.value]` — the computed will naturally re-evaluate when data changes propagate through the reactive chain
- **Resort mode `watch(data)`**: same — remove the reference cloning hack
- The rest of sort stability (snapshots, stale tracking, FLIP, focus) stays the same

### 6. Tests — parity with TanStack
**New file:** `test/sorting.test.ts`

#### A. Comparator parity tests
Import both TanStack's raw helpers and ours, assert identical output:

**Strings:**
- Basic alphabetical: `['banana', 'apple', 'cherry']`
- Case insensitivity: `['Banana', 'apple', 'Cherry']`
- Empty strings: `['', 'a', '']`

**Alphanumeric:**
- Version strings: `['v2.0', 'v10.0', 'v1.0']` → `v1.0, v2.0, v10.0`
- Mixed text/numbers: `['item2', 'item10', 'item1']`
- Pure numbers as strings: `['100', '20', '3']`
- Prefixed numbers: `['abc123', 'abc2', 'abc20']`

**Numbers:**
- Integers: `[3, 1, 2]`
- Decimals: `[1.1, 1.01, 1.001]`
- Negative: `[-5, 3, -1, 0]`
- Special: `NaN`, `Infinity`, `-Infinity`

**Dates:**
- Date objects with various dates
- Same dates (stability)

**Booleans:**
- `[true, false, true, false]`

#### B. Null/undefined handling tests
- `sortUndefined: 'first'` → undefined values sort first
- `sortUndefined: 'last'` → undefined values sort last
- `sortUndefined: 1` / `-1` (numeric form)
- `sortUndefined: false` → tie, fall through to next column
- Mixed null/undefined with real values

#### C. Multi-column sort tests
- Primary + secondary sort
- Three-level sort
- Ascending + descending mix
- Tie-breaking falls to next column then original index (stability)

#### D. `invertSorting` tests
- Ascending with invert = effectively descending
- Descending with invert = effectively ascending

#### E. `sortAccessor` tests
- String accessor: column displays `statusText`, sorts by `statusSort` field
- Function accessor: `(row) => row.nested.value`
- Combined with desc/asc
- Combined with multi-column sort (one column with sortAccessor, one without)
- Undefined sortAccessor → falls back to standard `row.getValue()`

#### F. Auto-detection tests
- Number column → `sortBasic`
- Text column → `sortAlphanumeric`
- Date column → `sortDatetime`
- Custom `sortingFn` on column → uses provided function
- Named string `sortingFn` → maps to correct comparator

#### G. Edge cases
- Empty array (no rows)
- Single row
- All values identical
- All values null/undefined
- Sub-row sorting (grouped data)

#### Parity assertion pattern
```ts
import { sortingFns as tanstackFns } from '@tanstack/table-core'
import { compareAlphanumeric, compareBasic, toString } from '../src/runtime/utils/sortingFns'

// Test raw helpers produce identical output
it('compareAlphanumeric matches TanStack', () => {
  const pairs = [['v2.0', 'v10.0'], ['item1', 'item2'], ...]
  for (const [a, b] of pairs) {
    expect(compareAlphanumeric(a, b)).toBe(tanstackCompareAlphanumeric(a, b))
  }
})
```

Note: TanStack's `compareAlphanumeric` and `compareBasic` aren't exported directly (they're module-private). We'll import the full sorting functions and test through a thin Row mock, or duplicate TanStack's helpers in the test file as a reference implementation.

### 7. Sub-row sorting
TanStack recursively sorts sub-rows (for grouping). Our `sortRows` does the same:
```ts
function sortRows(rows, sorting, table) {
  const sorted = [...rows].sort(comparator)
  for (const row of sorted) {
    if (row.subRows?.length) {
      row.subRows = sortRows(row.subRows, sorting, table)
    }
  }
  return sorted
}
```

## Files summary
1. `src/runtime/types/column.ts` — add `sortAccessor` option
2. `src/runtime/types/tanstack-table.d.ts` — add `sortAccessor` to TanStack augmentation
3. `src/runtime/utils/sortingFns.ts` — **new** — comparator functions + `resolveComparator`
4. `src/runtime/composables/_internal/useNuGridSorting.ts` — **new** — sort engine composable
5. `src/runtime/composables/_internal/useNuGridCore.ts` — remove `getSortedRowModel`, add `manualSorting: true`
6. `src/runtime/components/NuGrid.vue` — wire `useNuGridSorting` between `tableRows` and sort stability
7. `src/runtime/composables/_internal/useNuGridSortStability.ts` — remove reference cloning hacks
8. `test/sorting.test.ts` — **new** — comprehensive parity + edge case tests

## Execution order
1. Add `sortAccessor` to column types
2. Write `src/runtime/utils/sortingFns.ts` (pure functions, no deps)
3. Write `test/sorting.test.ts` — comparator parity tests first (sections A-B)
4. Run tests, ensure parity with TanStack helpers
5. Write `useNuGridSorting.ts` composable
6. Add integration tests: multi-column, sortAccessor, sub-row, edge cases (sections C-G)
7. Wire into NuGrid pipeline (useNuGridCore.ts + NuGrid.vue)
8. Simplify sort stability (remove reference cloning)
9. Run full test suite + typecheck

## What stays the same
- `SortingState` type — still `{ id: string, desc: boolean }[]` from TanStack (re-exported)
- `onSortingChange` callback — TanStack still manages the toggle cycle (asc → desc → none)
- `sortChanged` event — still fires
- `enableSorting` per column — still respected (checked in our sort engine)
- Column header click behavior — TanStack still manages UI state
- `sorting` v-model — same interface
- `sortingFn` per column — still supported (custom comparator functions)
- `sortUndefined` per column — still supported
- `invertSorting` per column — still supported

## Verification
- `pnpm test` — all existing tests pass + new sorting tests pass
- `pnpm typecheck` — no type errors
- Manual: sort columns in playground, verify identical behavior to current
- Manual: edit cells in sorted columns, verify sort stability still works
- Manual: external data mutation with `dataChangeBehavior: 'resort'`, verify FLIP animation + focus preservation
- Manual: column with `sortAccessor` sorts by alternate field while displaying primary field
