/**
 * Default column sizing values — matches TanStack Table's defaults.
 */
export const defaultColumnSizing = {
  size: 150,
  minSize: 20,
  maxSize: Number.MAX_SAFE_INTEGER,
}

/**
 * Resolve the effective size of a column.
 * Mirrors TanStack's `column.getSize()` logic:
 *   columnSizing[id] ?? columnDef.size ?? 150, clamped to [minSize, maxSize]
 */
export function resolveColumnSize(
  columnId: string,
  columnSizing: Record<string, number>,
  columnDef: { size?: number; minSize?: number; maxSize?: number },
): number {
  const columnSize = columnSizing[columnId]
  return Math.min(
    Math.max(
      columnDef.minSize ?? defaultColumnSizing.minSize,
      columnSize ?? columnDef.size ?? defaultColumnSizing.size,
    ),
    columnDef.maxSize ?? defaultColumnSizing.maxSize,
  )
}

/**
 * Check if a column can be resized.
 * Mirrors TanStack's `column.getCanResize()` logic:
 *   (columnDef.enableResizing ?? true) && (table.enableColumnResizing ?? true)
 */
export function canColumnResize(
  columnDef: { enableResizing?: boolean },
  tableEnableResizing?: boolean,
): boolean {
  return (
    (columnDef.enableResizing ?? true)
    && (tableEnableResizing ?? true)
  )
}

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
    result[columnId] = Math.round(
      Math.max(headerSize + headerSize * deltaPercentage, 0) * 100,
    ) / 100
  }
  return result
}
