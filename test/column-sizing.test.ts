import { describe, expect, it } from 'vitest'

import {
  calculateProportionalSizes,
  canColumnResize,
  resolveColumnSize,
} from '../src/runtime/utils/columnSizingFns'

// ============================================================================
// Reference implementations — copied verbatim from TanStack Table's ColumnSizing.ts
// (module-private, can't import directly). Used to assert parity.
// ============================================================================

const tanstackDefaultColumnSizing = {
  size: 150,
  minSize: 20,
  maxSize: Number.MAX_SAFE_INTEGER,
}

/**
 * Reference: TanStack's column.getSize() — verbatim from ColumnSizing.ts
 */
function tanstackGetSize(
  columnId: string,
  columnSizing: Record<string, number>,
  columnDef: { size?: number; minSize?: number; maxSize?: number },
): number {
  const columnSize = columnSizing[columnId]
  return Math.min(
    Math.max(
      columnDef.minSize ?? tanstackDefaultColumnSizing.minSize,
      columnSize ?? columnDef.size ?? tanstackDefaultColumnSizing.size,
    ),
    columnDef.maxSize ?? tanstackDefaultColumnSizing.maxSize,
  )
}

/**
 * Reference: TanStack's column.getCanResize() — verbatim from ColumnSizing.ts
 */
function tanstackGetCanResize(
  columnDef: { enableResizing?: boolean },
  tableEnableResizing?: boolean,
): boolean {
  return (
    (columnDef.enableResizing ?? true)
    && (tableEnableResizing ?? true)
  )
}

/**
 * Reference: TanStack's proportional resize formula — verbatim from getResizeHandler's updateOffset
 *
 * For each [columnId, headerSize] in columnSizingStart:
 *   newSize = Math.round(Math.max(headerSize + headerSize * deltaPercentage, 0) * 100) / 100
 */
function tanstackCalculateProportionalSizes(
  columnSizingStart: [string, number][],
  deltaPercentage: number,
): Record<string, number> {
  const result: Record<string, number> = {}
  columnSizingStart.forEach(([columnId, headerSize]) => {
    result[columnId] = Math.round(
      Math.max(headerSize + headerSize * deltaPercentage, 0) * 100,
    ) / 100
  })
  return result
}

// ============================================================================
// A. resolveColumnSize — parity with TanStack's column.getSize()
// ============================================================================

describe('resolveColumnSize — parity with TanStack column.getSize()', () => {
  const cases: Array<{
    name: string
    columnId: string
    columnSizing: Record<string, number>
    columnDef: { size?: number; minSize?: number; maxSize?: number }
  }> = [
    {
      name: 'uses columnSizing value when present',
      columnId: 'col1',
      columnSizing: { col1: 200 },
      columnDef: { size: 100 },
    },
    {
      name: 'falls back to columnDef.size when no sizing',
      columnId: 'col1',
      columnSizing: {},
      columnDef: { size: 100 },
    },
    {
      name: 'falls back to default 150 when no sizing or def',
      columnId: 'col1',
      columnSizing: {},
      columnDef: {},
    },
    {
      name: 'clamps to minSize when value is below minimum',
      columnId: 'col1',
      columnSizing: { col1: 10 },
      columnDef: { minSize: 50 },
    },
    {
      name: 'clamps to maxSize when value is above maximum',
      columnId: 'col1',
      columnSizing: { col1: 500 },
      columnDef: { maxSize: 300 },
    },
    {
      name: 'uses default minSize (20) when not specified',
      columnId: 'col1',
      columnSizing: { col1: 5 },
      columnDef: {},
    },
    {
      name: 'uses default maxSize (MAX_SAFE_INTEGER) when not specified',
      columnId: 'col1',
      columnSizing: { col1: 99999 },
      columnDef: {},
    },
    {
      name: 'clamps columnDef.size to minSize',
      columnId: 'col1',
      columnSizing: {},
      columnDef: { size: 10, minSize: 50 },
    },
    {
      name: 'clamps columnDef.size to maxSize',
      columnId: 'col1',
      columnSizing: {},
      columnDef: { size: 500, maxSize: 300 },
    },
    {
      name: 'sizing value exactly at minSize boundary',
      columnId: 'col1',
      columnSizing: { col1: 50 },
      columnDef: { minSize: 50 },
    },
    {
      name: 'sizing value exactly at maxSize boundary',
      columnId: 'col1',
      columnSizing: { col1: 300 },
      columnDef: { maxSize: 300 },
    },
    {
      name: 'sizing for column ID not in sizing state',
      columnId: 'col2',
      columnSizing: { col1: 200 },
      columnDef: { size: 120 },
    },
    {
      name: 'zero sizing value clamps to minSize',
      columnId: 'col1',
      columnSizing: { col1: 0 },
      columnDef: {},
    },
    {
      name: 'negative sizing value clamps to minSize',
      columnId: 'col1',
      columnSizing: { col1: -100 },
      columnDef: { minSize: 50 },
    },
    {
      name: 'minSize equals maxSize forces exact size',
      columnId: 'col1',
      columnSizing: { col1: 200 },
      columnDef: { minSize: 100, maxSize: 100 },
    },
    {
      name: 'default 150 clamps when minSize > 150',
      columnId: 'col1',
      columnSizing: {},
      columnDef: { minSize: 200 },
    },
  ]

  for (const { name, columnId, columnSizing, columnDef } of cases) {
    it(name, () => {
      const expected = tanstackGetSize(columnId, columnSizing, columnDef)
      const actual = resolveColumnSize(columnId, columnSizing, columnDef)
      expect(actual).toBe(expected)
    })
  }
})

// ============================================================================
// B. canColumnResize — parity with TanStack's column.getCanResize()
// ============================================================================

describe('canColumnResize — parity with TanStack column.getCanResize()', () => {
  const cases: Array<{
    name: string
    columnDef: { enableResizing?: boolean }
    tableEnableResizing?: boolean
  }> = [
    {
      name: 'both default (undefined) → true',
      columnDef: {},
    },
    {
      name: 'both explicitly true → true',
      columnDef: { enableResizing: true },
      tableEnableResizing: true,
    },
    {
      name: 'column disabled → false',
      columnDef: { enableResizing: false },
      tableEnableResizing: true,
    },
    {
      name: 'table disabled → false',
      columnDef: { enableResizing: true },
      tableEnableResizing: false,
    },
    {
      name: 'both disabled → false',
      columnDef: { enableResizing: false },
      tableEnableResizing: false,
    },
    {
      name: 'column disabled, table default → false',
      columnDef: { enableResizing: false },
    },
    {
      name: 'column default, table disabled → false',
      columnDef: {},
      tableEnableResizing: false,
    },
  ]

  for (const { name, columnDef, tableEnableResizing } of cases) {
    it(name, () => {
      const expected = tanstackGetCanResize(columnDef, tableEnableResizing)
      const actual = canColumnResize(columnDef, tableEnableResizing)
      expect(actual).toBe(expected)
    })
  }
})

// ============================================================================
// C. calculateProportionalSizes — parity with TanStack's resize formula
// ============================================================================

describe('calculateProportionalSizes — parity with TanStack resize formula', () => {
  const cases: Array<{
    name: string
    columnSizingStart: [string, number][]
    deltaPercentage: number
  }> = [
    {
      name: 'grow single column by 50%',
      columnSizingStart: [['col1', 100]],
      deltaPercentage: 0.5,
    },
    {
      name: 'shrink single column by 25%',
      columnSizingStart: [['col1', 200]],
      deltaPercentage: -0.25,
    },
    {
      name: 'grow multiple columns proportionally',
      columnSizingStart: [['col1', 100], ['col2', 200], ['col3', 50]],
      deltaPercentage: 0.3,
    },
    {
      name: 'shrink multiple columns proportionally',
      columnSizingStart: [['col1', 100], ['col2', 200], ['col3', 50]],
      deltaPercentage: -0.4,
    },
    {
      name: 'near-zero delta (very small grow)',
      columnSizingStart: [['col1', 100]],
      deltaPercentage: 0.001,
    },
    {
      name: 'delta at clamp boundary (-0.999999)',
      columnSizingStart: [['col1', 100]],
      deltaPercentage: -0.999999,
    },
    {
      name: 'zero delta (no change)',
      columnSizingStart: [['col1', 100], ['col2', 200]],
      deltaPercentage: 0,
    },
    {
      name: 'large grow (200%)',
      columnSizingStart: [['col1', 50]],
      deltaPercentage: 2.0,
    },
    {
      name: 'column with zero start size',
      columnSizingStart: [['col1', 0]],
      deltaPercentage: 0.5,
    },
    {
      name: 'fractional start sizes',
      columnSizingStart: [['col1', 133.33], ['col2', 66.67]],
      deltaPercentage: 0.15,
    },
    {
      name: 'delta causing sub-pixel result (rounding test)',
      columnSizingStart: [['col1', 101]],
      deltaPercentage: 0.333,
    },
    {
      name: 'very small start size with large delta',
      columnSizingStart: [['col1', 1]],
      deltaPercentage: -0.5,
    },
    {
      name: 'negative delta beyond -0.999999 clamps to near-zero',
      columnSizingStart: [['col1', 100]],
      deltaPercentage: -0.999999, // TanStack clamps to this
    },
  ]

  for (const { name, columnSizingStart, deltaPercentage } of cases) {
    it(name, () => {
      const expected = tanstackCalculateProportionalSizes(columnSizingStart, deltaPercentage)
      const actual = calculateProportionalSizes(columnSizingStart, deltaPercentage)
      expect(actual).toEqual(expected)
    })
  }

  // Additional edge case: verify clamping works at the caller level
  it('deltaPercentage should be clamped to -0.999999 by caller (delta formula)', () => {
    const startSize = 100
    const deltaOffset = -200 // would make delta -2.0, but TanStack clamps to -0.999999
    const deltaPercentage = Math.max(deltaOffset / startSize, -0.999999)

    const expected = tanstackCalculateProportionalSizes([['col1', startSize]], deltaPercentage)
    const actual = calculateProportionalSizes([['col1', startSize]], deltaPercentage)
    expect(actual).toEqual(expected)
    // With clamping, result should be near zero, not negative
    expect(actual.col1).toBeGreaterThanOrEqual(0)
  })
})
