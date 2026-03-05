/**
 * Calculate proportional column sizes for standard resize mode.
 * Mirrors TanStack's getResizeHandler updateOffset formula:
 *   newSize = Math.round(Math.max(startSize + startSize * deltaPercentage, 0) * 100) / 100
 *
 * The deltaPercentage should be pre-clamped to >= -0.999999 by the caller
 * (matching TanStack's `Math.max(deltaOffset / startSize, -0.999999)`).
 */
export function calculateProportionalSizes(
  columnSizingStart: [string, number][],
  deltaPercentage: number,
): Record<string, number> {
  const result: Record<string, number> = {}
  for (const [columnId, headerSize] of columnSizingStart) {
    result[columnId] =
      Math.round(Math.max(headerSize + headerSize * deltaPercentage, 0) * 100) / 100
  }
  return result
}
