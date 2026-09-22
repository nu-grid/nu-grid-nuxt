/**
 * NuGrid Cell factory.
 */

import type { EngineCell, EngineColumn, EngineRow, EngineTable } from './types'

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createEngineCell<T>(
  row: EngineRow<T>,
  column: EngineColumn<T>,
  table: EngineTable<T>,
): EngineCell<T> {
  const cell: EngineCell<T> = {
    id: `${row.id}_${column.id}`,
    row,
    column,

    getValue<TValue = unknown>(): TValue {
      return row.getValue<TValue>(column.id)
    },

    renderValue<TValue = unknown>(): TValue | null {
      return cell.getValue<TValue>() ?? table.options.renderFallbackValue ?? null
    },

    getContext() {
      return {
        table,
        column,
        row,
        cell,
        getValue: cell.getValue,
        renderValue: cell.renderValue,
      }
    },

    // -- Grouping --

    getIsGrouped(): boolean {
      return column.getIsGrouped() && column.id === row.groupingColumnId
    },

    getIsPlaceholder(): boolean {
      return !cell.getIsGrouped() && column.getIsGrouped()
    },

    getIsAggregated(): boolean {
      return !cell.getIsGrouped() && !cell.getIsPlaceholder() && !!row.subRows?.length
    },
  }

  return cell
}
