import type { Column, ColumnSizingState, Header } from '../../engine'

interface ColumnDefWithFlex {
  grow?: boolean
  widthPercentage?: number
  size?: number
  minSize?: number
  maxSize?: number
}

interface FlexStyleOptions {
  /** Whether CSS flex distribution is enabled (autoSize === 'fill') */
  useCssFlexDistribution: boolean
  /** Set of column IDs that have been manually resized */
  manuallyResizedColumns: Set<string>
  /** Column sizing state (for SSR - detects restored sizing) */
  columnSizing?: ColumnSizingState
}

/**
 * Get style object for a header with flex distribution support.
 * In fill mode, uses flex distribution instead of fixed widths.
 * Respects column-level `grow` and `widthPercentage` properties.
 * Once a column is manually resized, it switches to fixed width.
 */
export function getFlexHeaderStyle<T>(
  header: Header<T>,
  options: FlexStyleOptions,
): Record<string, string | number> {
  const { useCssFlexDistribution, manuallyResizedColumns, columnSizing } = options
  const isPinned = header.column.getIsPinned()
  const columnDef = header.column.columnDef as ColumnDefWithFlex
  const minSize = columnDef.minSize ?? 50
  const maxSize = columnDef.maxSize
  const grow = columnDef.grow
  const widthPercentage = columnDef.widthPercentage
  const fixedSize = columnDef.size ?? header.getSize()
  // Check both runtime Set and persisted columnSizing state (for SSR)
  const hasBeenResized =
    manuallyResizedColumns.has(header.column.id) ||
    (columnSizing !== undefined && header.column.id in columnSizing)

  // Pinned columns always use fixed width
  if (isPinned) {
    return {
      width: `${header.getSize()}px`,
      minWidth: `${header.getSize()}px`,
      maxWidth: `${header.getSize()}px`,
    }
  }

  // fill mode: use flex with min/max constraints
  if (useCssFlexDistribution) {
    // grow: false OR manually resized = fixed width, no flex participation
    if (grow === false || hasBeenResized) {
      const size = hasBeenResized ? header.getSize() : fixedSize
      return {
        width: `${size}px`,
        minWidth: `${minSize}px`,
        maxWidth: `${size}px`,
        flexShrink: 0,
      }
    }

    // widthPercentage provides weighted flex-grow
    const flexGrow = widthPercentage ?? 1

    return {
      flexGrow,
      flexShrink: 1,
      flexBasis: 0,
      minWidth: `${minSize}px`,
      ...(maxSize && maxSize < Number.MAX_SAFE_INTEGER ? { maxWidth: `${maxSize}px` } : {}),
    }
  }

  // Default: fixed widths from columnSizing
  return {
    width: `${header.getSize()}px`,
    minWidth: `${header.getSize()}px`,
    maxWidth: `${header.getSize()}px`,
  }
}

/**
 * Get style object for a cell with flex distribution support.
 * Mirrors the header style logic for consistent column widths.
 */
export function getFlexCellStyle<T>(
  column: Column<T>,
  options: FlexStyleOptions,
): Record<string, string | number> {
  const { useCssFlexDistribution, manuallyResizedColumns, columnSizing } = options
  const isPinned = column.getIsPinned()
  const columnDef = column.columnDef as ColumnDefWithFlex
  const minSize = columnDef.minSize ?? 50
  const maxSize = columnDef.maxSize
  const grow = columnDef.grow
  const widthPercentage = columnDef.widthPercentage
  const fixedSize = columnDef.size ?? column.getSize()
  // Check both runtime Set and persisted columnSizing state (for SSR)
  const hasBeenResized =
    manuallyResizedColumns.has(column.id) ||
    (columnSizing !== undefined && column.id in columnSizing)

  // Pinned columns always use fixed width
  if (isPinned) {
    const size = `${column.getSize()}px`
    return { width: size, minWidth: size, maxWidth: size }
  }

  // fill mode: use flex with min/max constraints
  if (useCssFlexDistribution) {
    if (grow === false || hasBeenResized) {
      const size = hasBeenResized ? column.getSize() : fixedSize
      return {
        width: `${size}px`,
        minWidth: `${minSize}px`,
        maxWidth: `${size}px`,
        flexShrink: 0,
      }
    }

    const flexGrow = widthPercentage ?? 1

    return {
      flexGrow,
      flexShrink: 1,
      flexBasis: 0,
      minWidth: `${minSize}px`,
      ...(maxSize && maxSize < Number.MAX_SAFE_INTEGER ? { maxWidth: `${maxSize}px` } : {}),
    }
  }

  // Default: fixed widths from columnSizing
  return {
    width: `${column.getSize()}px`,
    minWidth: `${column.getSize()}px`,
    maxWidth: `${column.getSize()}px`,
  }
}
