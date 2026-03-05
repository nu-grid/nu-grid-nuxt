/**
 * NuGrid Core Row Model.
 *
 * Converts a flat data array into EngineRow objects.
 */

import type { EngineColumn, EngineRow, EngineRowModel, EngineTable, StateAccessors } from './types'

import { createEngineRow } from './row'

// ---------------------------------------------------------------------------
// Build core row model
// ---------------------------------------------------------------------------

export function buildCoreRowModel<T>(
  data: T[],
  columns: EngineColumn<T>[],
  table: EngineTable<T>,
  state: StateAccessors,
): EngineRowModel<T> {
  const rows: EngineRow<T>[] = []
  const flatRows: EngineRow<T>[] = []
  const rowsById: Record<string, EngineRow<T>> = {}

  const getRowId = table.options.getRowId

  for (let i = 0; i < data.length; i++) {
    const original = data[i]!
    const id = getRowId ? getRowId(original, i) : String(i)

    const row = createEngineRow<T>({
      id,
      index: i,
      original,
      depth: 0,
      table,
      columns,
      state,
    })

    rows.push(row)
    flatRows.push(row)
    rowsById[id] = row
  }

  return { rows, flatRows, rowsById }
}
