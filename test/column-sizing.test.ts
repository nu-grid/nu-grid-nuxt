import { describe, expect, it } from 'vitest'

import { calculateProportionalSizes } from '../src/runtime/utils/columnSizingFns'

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
    result[columnId] =
      Math.round(Math.max(headerSize + headerSize * deltaPercentage, 0) * 100) / 100
  })
  return result
}

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
      columnSizingStart: [
        ['col1', 100],
        ['col2', 200],
        ['col3', 50],
      ],
      deltaPercentage: 0.3,
    },
    {
      name: 'shrink multiple columns proportionally',
      columnSizingStart: [
        ['col1', 100],
        ['col2', 200],
        ['col3', 50],
      ],
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
      columnSizingStart: [
        ['col1', 100],
        ['col2', 200],
      ],
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
      columnSizingStart: [
        ['col1', 133.33],
        ['col2', 66.67],
      ],
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
