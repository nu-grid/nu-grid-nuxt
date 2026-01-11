import type { TableData } from '@nuxt/ui'
import type { Row, Table } from '@tanstack/vue-table'
import type { NuGridProps } from '../../types'
import { computed } from 'vue'

/**
 * Navigation result containing target row and column indices
 */
export interface NavigationTarget {
  rowIndex: number
  columnIndex: number
}

/**
 * Predicate function to determine if a cell is a valid navigation target
 * Parameters: (columnIndex, row) to match existing isColumnFocusable/isCellEditable signatures
 */
export type IsValidTargetFn<T> = (columnIndex: number, row: Row<T>) => boolean

/**
 * Shared keyboard navigation logic for NuGrid
 * Used by both focus and editing systems to navigate between cells
 *
 * @example
 * ```typescript
 * const nav = useNuGridKeyboardNavigation(props, tableApi)
 *
 * // Navigate with custom validity check
 * const target = nav.navigateVertical('down', rowIndex, colIndex, rows, (row, col) => {
 *   return isCellEditable(row, cells[col])
 * })
 * if (target) {
 *   startEditing(rows[target.rowIndex], cells[target.columnIndex])
 * }
 * ```
 */
export function useNuGridKeyboardNavigation<T extends TableData>(
  props: NuGridProps<T>,
  tableApi: Table<T>,
) {
  // Multi-row configuration from props
  const multiRowEnabled = computed(() => {
    if (props.multiRow === false) return false
    return props.multiRow?.enabled ?? false
  })

  const multiRowCount = computed(() => {
    if (props.multiRow === false) return 1
    return props.multiRow?.rowCount ?? 1
  })

  const alignColumns = computed(() => {
    if (props.multiRow === false) return false
    return props.multiRow?.alignColumns ?? false
  })

  // Get visible columns from table API
  const visibleColumns = computed(() => tableApi.getVisibleLeafColumns())

  // Cache column -> visual row and per-row column buckets to avoid repeated scans
  const columnToVisualRow = computed(() => {
    if (!multiRowEnabled.value || multiRowCount.value <= 1) return []
    const cols = visibleColumns.value
    const mapping: number[] = []
    const maxRow = Math.max(1, multiRowCount.value) - 1
    for (let i = 0; i < cols.length; i++) {
      const rowNum = (cols[i]!.columnDef as any).row ?? 0
      mapping[i] = Math.max(0, Math.min(rowNum, maxRow))
    }
    return mapping
  })

  const columnsByVisualRow = computed(() => {
    if (!multiRowEnabled.value || multiRowCount.value <= 1) {
      return [visibleColumns.value.map((_, idx) => idx)]
    }
    const rows: number[][] = Array.from({ length: multiRowCount.value }, () => [])
    columnToVisualRow.value.forEach((row, idx) => {
      rows[row]?.push(idx)
    })
    return rows
  })

  const nonPinnedColumnsByVisualRow = computed(() => {
    if (!multiRowEnabled.value || multiRowCount.value <= 1) {
      const all = visibleColumns.value.map((_, idx) => idx)
      return [all]
    }
    const cols = visibleColumns.value
    return columnsByVisualRow.value.map((rowCols) =>
      rowCols.filter((idx) => {
        const pin = cols[idx]?.getIsPinned()
        return !pin
      }),
    )
  })

  const pinnedColumnsByVisualRow = computed(() => {
    if (!multiRowEnabled.value || multiRowCount.value <= 1) {
      return [{ left: [] as number[], right: [] as number[] }]
    }
    const cols = visibleColumns.value
    return columnsByVisualRow.value.map((rowCols) => ({
      left: rowCols.filter((idx) => cols[idx]?.getIsPinned() === 'left'),
      right: rowCols.filter((idx) => cols[idx]?.getIsPinned() === 'right'),
    }))
  })

  /**
   * Get the visual row index for a given column index
   */
  function getVisualRowForColumn(columnIndex: number): number {
    if (!multiRowEnabled.value || multiRowCount.value <= 1) return 0
    return columnToVisualRow.value[columnIndex] ?? 0
  }

  /**
   * Get all column indices that belong to a specific visual row
   */
  function getColumnsInVisualRow(visualRow: number): number[] {
    if (!multiRowEnabled.value || multiRowCount.value <= 1) {
      return visibleColumns.value.map((_, idx) => idx)
    }
    return columnsByVisualRow.value[visualRow] ?? []
  }

  /**
   * Get non-pinned columns from a visual row (for aligned mode navigation)
   */
  function getNonPinnedColumnsInVisualRow(visualRow: number): number[] {
    if (!multiRowEnabled.value || multiRowCount.value <= 1) {
      return visibleColumns.value.map((_, idx) => idx)
    }
    return nonPinnedColumnsByVisualRow.value[visualRow] ?? []
  }

  /**
   * Find the best matching column in a target visual row based on position
   */
  function findColumnInVisualRow(
    currentColumnIndex: number,
    targetVisualRow: number,
    _row: Row<T>,
  ): number {
    const targetColumns = getColumnsInVisualRow(targetVisualRow)
    if (targetColumns.length === 0) return currentColumnIndex

    // Get current column's position within its visual row
    const currentVisualRow = getVisualRowForColumn(currentColumnIndex)
    const currentRowColumns = getColumnsInVisualRow(currentVisualRow)

    // In aligned mode, calculate position based on non-pinned columns only
    if (alignColumns.value) {
      const currentNonPinned = getNonPinnedColumnsInVisualRow(currentVisualRow)
      const targetNonPinned = getNonPinnedColumnsInVisualRow(targetVisualRow)

      // Check if current column is pinned
      const currentCol = visibleColumns.value[currentColumnIndex]
      const isPinned = currentCol?.getIsPinned()
      const currentPins = pinnedColumnsByVisualRow.value[currentVisualRow]
      const targetPins = pinnedColumnsByVisualRow.value[targetVisualRow]

      if (isPinned === 'left') {
        // For left-pinned columns, find matching left-pinned column in target row
        const leftPinnedInCurrent = currentPins?.left ?? []
        const leftPinnedInTarget = targetPins?.left ?? []
        const posInPinned = leftPinnedInCurrent.indexOf(currentColumnIndex)
        if (posInPinned !== -1 && posInPinned < leftPinnedInTarget.length) {
          return leftPinnedInTarget[posInPinned]!
        }
        // Fallback to first non-pinned if no matching pinned column
        return targetNonPinned[0] ?? targetColumns[0] ?? currentColumnIndex
      }

      if (isPinned === 'right') {
        // For right-pinned columns, find matching right-pinned column in target row
        const rightPinnedInCurrent = currentPins?.right ?? []
        const rightPinnedInTarget = targetPins?.right ?? []
        const posInPinned = rightPinnedInCurrent.indexOf(currentColumnIndex)
        if (posInPinned !== -1 && posInPinned < rightPinnedInTarget.length) {
          return rightPinnedInTarget[posInPinned]!
        }
        // Fallback to last non-pinned if no matching pinned column
        return targetNonPinned[targetNonPinned.length - 1] ?? targetColumns[0] ?? currentColumnIndex
      }

      // For non-pinned columns, map by position within non-pinned columns
      const posInNonPinned = currentNonPinned.indexOf(currentColumnIndex)
      if (posInNonPinned !== -1 && posInNonPinned < targetNonPinned.length) {
        return targetNonPinned[posInNonPinned]!
      }
      // Fallback to last non-pinned column in target row
      return targetNonPinned[targetNonPinned.length - 1] ?? targetColumns[0] ?? currentColumnIndex
    }

    // Non-aligned mode: simple position mapping
    const currentPosInRow = currentRowColumns.indexOf(currentColumnIndex)
    if (currentPosInRow !== -1 && currentPosInRow < targetColumns.length) {
      return targetColumns[currentPosInRow]!
    }

    // Fallback to last column in target row
    return targetColumns[targetColumns.length - 1] ?? currentColumnIndex
  }

  /**
   * Find the first valid column in a visual row
   */
  function findFirstInVisualRow(
    visualRow: number,
    row: Row<T>,
    isValidTarget?: IsValidTargetFn<T>,
  ): number | null {
    const columnsInRow = getColumnsInVisualRow(visualRow)
    for (const colIdx of columnsInRow) {
      if (!isValidTarget || isValidTarget(colIdx, row)) {
        return colIdx
      }
    }
    return columnsInRow[0] ?? null
  }

  /**
   * Find the last valid column in a visual row
   */
  function findLastInVisualRow(
    visualRow: number,
    row: Row<T>,
    isValidTarget?: IsValidTargetFn<T>,
  ): number | null {
    const columnsInRow = getColumnsInVisualRow(visualRow)
    for (let i = columnsInRow.length - 1; i >= 0; i--) {
      const colIdx = columnsInRow[i]!
      if (!isValidTarget || isValidTarget(colIdx, row)) {
        return colIdx
      }
    }
    return columnsInRow[columnsInRow.length - 1] ?? null
  }

  /**
   * Find the next valid column within the same visual row
   */
  function findNextInVisualRow(
    startIndex: number,
    visualRow: number,
    row: Row<T>,
    isValidTarget?: IsValidTargetFn<T>,
  ): number | null {
    const columnsInRow = getColumnsInVisualRow(visualRow)
    const currentPosInRow = columnsInRow.indexOf(startIndex)
    if (currentPosInRow === -1) return null

    for (let i = currentPosInRow + 1; i < columnsInRow.length; i++) {
      const colIdx = columnsInRow[i]!
      if (!isValidTarget || isValidTarget(colIdx, row)) {
        return colIdx
      }
    }
    return null
  }

  /**
   * Find the previous valid column within the same visual row
   */
  function findPreviousInVisualRow(
    startIndex: number,
    visualRow: number,
    row: Row<T>,
    isValidTarget?: IsValidTargetFn<T>,
  ): number | null {
    const columnsInRow = getColumnsInVisualRow(visualRow)
    const currentPosInRow = columnsInRow.indexOf(startIndex)
    if (currentPosInRow === -1) return null

    for (let i = currentPosInRow - 1; i >= 0; i--) {
      const colIdx = columnsInRow[i]!
      if (!isValidTarget || isValidTarget(colIdx, row)) {
        return colIdx
      }
    }
    return null
  }

  /**
   * Find the first valid column across all columns
   */
  function findFirstColumn(row: Row<T>, isValidTarget?: IsValidTargetFn<T>): number {
    const cols = visibleColumns.value
    for (let i = 0; i < cols.length; i++) {
      if (!isValidTarget || isValidTarget(i, row)) {
        return i
      }
    }
    return 0
  }

  /**
   * Find the last valid column across all columns
   */
  function findLastColumn(row: Row<T>, isValidTarget?: IsValidTargetFn<T>): number {
    const cols = visibleColumns.value
    for (let i = cols.length - 1; i >= 0; i--) {
      if (!isValidTarget || isValidTarget(i, row)) {
        return i
      }
    }
    return cols.length - 1
  }

  /**
   * Find the next valid column (simple left-to-right)
   */
  function findNextColumn(
    currentIndex: number,
    row: Row<T>,
    isValidTarget?: IsValidTargetFn<T>,
  ): number {
    const cols = visibleColumns.value
    for (let i = currentIndex + 1; i < cols.length; i++) {
      if (!isValidTarget || isValidTarget(i, row)) {
        return i
      }
    }
    return currentIndex
  }

  /**
   * Find the previous valid column (simple right-to-left)
   */
  function findPreviousColumn(
    currentIndex: number,
    row: Row<T>,
    isValidTarget?: IsValidTargetFn<T>,
  ): number {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (!isValidTarget || isValidTarget(i, row)) {
        return i
      }
    }
    return currentIndex
  }

  /**
   * Navigate vertically (up/down)
   * In multi-row mode, first navigates between visual rows within the same data row
   */
  function navigateVertical(
    direction: 'up' | 'down',
    currentRowIndex: number,
    currentColumnIndex: number,
    rows: Row<T>[],
    isValidTarget?: IsValidTargetFn<T>,
  ): NavigationTarget | null {
    const currentRow = rows[currentRowIndex]
    if (!currentRow) return null

    // Multi-row mode: navigate between visual rows first
    if (multiRowEnabled.value && multiRowCount.value > 1) {
      const currentVisualRow = getVisualRowForColumn(currentColumnIndex)
      const lastVisualRow = multiRowCount.value - 1

      if (direction === 'up') {
        if (currentVisualRow > 0) {
          // Move to previous visual row within same data row
          const targetColIdx = findColumnInVisualRow(
            currentColumnIndex,
            currentVisualRow - 1,
            currentRow,
          )
          if (!isValidTarget || isValidTarget(targetColIdx, currentRow)) {
            return { rowIndex: currentRowIndex, columnIndex: targetColIdx }
          }
        }
        // At top visual row or target not valid - move to previous data row's last visual row
        if (currentRowIndex > 0) {
          const targetRow = rows[currentRowIndex - 1]
          if (targetRow) {
            const targetColIdx = findColumnInVisualRow(currentColumnIndex, lastVisualRow, targetRow)
            // If target not valid, try to find a valid one in that visual row
            if (!isValidTarget || isValidTarget(targetColIdx, targetRow)) {
              return { rowIndex: currentRowIndex - 1, columnIndex: targetColIdx }
            }
            // Fallback: find any valid column in the last visual row
            const fallback = findLastInVisualRow(lastVisualRow, targetRow, isValidTarget)
            if (fallback !== null) {
              return { rowIndex: currentRowIndex - 1, columnIndex: fallback }
            }
          }
        }
      } else {
        // direction === 'down'
        if (currentVisualRow < lastVisualRow) {
          // Move to next visual row within same data row
          const targetColIdx = findColumnInVisualRow(
            currentColumnIndex,
            currentVisualRow + 1,
            currentRow,
          )
          if (!isValidTarget || isValidTarget(targetColIdx, currentRow)) {
            return { rowIndex: currentRowIndex, columnIndex: targetColIdx }
          }
        }
        // At bottom visual row or target not valid - move to next data row's first visual row
        if (currentRowIndex < rows.length - 1) {
          const targetRow = rows[currentRowIndex + 1]
          if (targetRow) {
            const targetColIdx = findColumnInVisualRow(currentColumnIndex, 0, targetRow)
            if (!isValidTarget || isValidTarget(targetColIdx, targetRow)) {
              return { rowIndex: currentRowIndex + 1, columnIndex: targetColIdx }
            }
            // Fallback: find any valid column in the first visual row
            const fallback = findFirstInVisualRow(0, targetRow, isValidTarget)
            if (fallback !== null) {
              return { rowIndex: currentRowIndex + 1, columnIndex: fallback }
            }
          }
        }
      }
    } else {
      // Standard single-row vertical navigation
      const targetRowIndex = direction === 'up' ? currentRowIndex - 1 : currentRowIndex + 1
      if (targetRowIndex >= 0 && targetRowIndex < rows.length) {
        const targetRow = rows[targetRowIndex]
        if (targetRow) {
          // Try same column first
          if (!isValidTarget || isValidTarget(currentColumnIndex, targetRow)) {
            return { rowIndex: targetRowIndex, columnIndex: currentColumnIndex }
          }
          // Fallback: find nearest valid column
          const fallbackCol =
            direction === 'up'
              ? findPreviousColumn(currentColumnIndex, targetRow, isValidTarget)
              : findNextColumn(currentColumnIndex, targetRow, isValidTarget)
          if (
            fallbackCol !== currentColumnIndex
            || (isValidTarget && isValidTarget(fallbackCol, targetRow))
          ) {
            return { rowIndex: targetRowIndex, columnIndex: fallbackCol }
          }
        }
      }
    }

    return null
  }

  /**
   * Navigate horizontally (left/right)
   * In multi-row mode, wraps between visual rows at boundaries
   */
  function navigateHorizontal(
    direction: 'left' | 'right',
    currentRowIndex: number,
    currentColumnIndex: number,
    rows: Row<T>[],
    isValidTarget?: IsValidTargetFn<T>,
  ): NavigationTarget | null {
    const currentRow = rows[currentRowIndex]
    if (!currentRow) return null

    // Multi-row mode: wrap between visual rows
    if (multiRowEnabled.value && multiRowCount.value > 1) {
      const currentVisualRow = getVisualRowForColumn(currentColumnIndex)
      const lastVisualRow = multiRowCount.value - 1

      if (direction === 'left') {
        // Try previous column in current visual row
        const prevCol = findPreviousInVisualRow(
          currentColumnIndex,
          currentVisualRow,
          currentRow,
          isValidTarget,
        )
        if (prevCol !== null) {
          return { rowIndex: currentRowIndex, columnIndex: prevCol }
        }

        // At start of visual row - wrap to previous visual row
        if (currentVisualRow > 0) {
          const lastInPrevRow = findLastInVisualRow(currentVisualRow - 1, currentRow, isValidTarget)
          if (lastInPrevRow !== null) {
            return { rowIndex: currentRowIndex, columnIndex: lastInPrevRow }
          }
        }

        // At first visual row - wrap to previous data row's last visual row
        if (currentRowIndex > 0) {
          const prevDataRow = rows[currentRowIndex - 1]
          if (prevDataRow) {
            const lastInLastRow = findLastInVisualRow(lastVisualRow, prevDataRow, isValidTarget)
            if (lastInLastRow !== null) {
              return { rowIndex: currentRowIndex - 1, columnIndex: lastInLastRow }
            }
          }
        }
      } else {
        // direction === 'right'
        // Try next column in current visual row
        const nextCol = findNextInVisualRow(
          currentColumnIndex,
          currentVisualRow,
          currentRow,
          isValidTarget,
        )
        if (nextCol !== null) {
          return { rowIndex: currentRowIndex, columnIndex: nextCol }
        }

        // At end of visual row - wrap to next visual row
        if (currentVisualRow < lastVisualRow) {
          const firstInNextRow = findFirstInVisualRow(
            currentVisualRow + 1,
            currentRow,
            isValidTarget,
          )
          if (firstInNextRow !== null) {
            return { rowIndex: currentRowIndex, columnIndex: firstInNextRow }
          }
        }

        // At last visual row - wrap to next data row's first visual row
        if (currentRowIndex < rows.length - 1) {
          const nextDataRow = rows[currentRowIndex + 1]
          if (nextDataRow) {
            const firstInFirstRow = findFirstInVisualRow(0, nextDataRow, isValidTarget)
            if (firstInFirstRow !== null) {
              return { rowIndex: currentRowIndex + 1, columnIndex: firstInFirstRow }
            }
          }
        }
      }
    } else {
      // Standard single-row horizontal navigation
      if (direction === 'left') {
        const prevCol = findPreviousColumn(currentColumnIndex, currentRow, isValidTarget)
        if (prevCol !== currentColumnIndex) {
          return { rowIndex: currentRowIndex, columnIndex: prevCol }
        }
      } else {
        const nextCol = findNextColumn(currentColumnIndex, currentRow, isValidTarget)
        if (nextCol !== currentColumnIndex) {
          return { rowIndex: currentRowIndex, columnIndex: nextCol }
        }
      }
    }

    return null
  }

  /**
   * Navigate via Tab/Shift+Tab
   * Similar to horizontal but can wrap to next/previous row
   */
  function navigateTab(
    direction: 'next' | 'previous',
    currentRowIndex: number,
    currentColumnIndex: number,
    rows: Row<T>[],
    isValidTarget?: IsValidTargetFn<T>,
  ): NavigationTarget | null {
    const currentRow = rows[currentRowIndex]
    if (!currentRow) return null

    if (direction === 'next') {
      // Try next column in current row (across all visual rows in multi-row mode)
      const nextCol = findNextColumn(currentColumnIndex, currentRow, isValidTarget)
      if (nextCol !== currentColumnIndex) {
        return { rowIndex: currentRowIndex, columnIndex: nextCol }
      }

      // Wrap to next row's first column
      if (currentRowIndex < rows.length - 1) {
        const nextRow = rows[currentRowIndex + 1]
        if (nextRow) {
          const firstCol = findFirstColumn(nextRow, isValidTarget)
          return { rowIndex: currentRowIndex + 1, columnIndex: firstCol }
        }
      }
    } else {
      // direction === 'previous'
      // Try previous column in current row
      const prevCol = findPreviousColumn(currentColumnIndex, currentRow, isValidTarget)
      if (prevCol !== currentColumnIndex) {
        return { rowIndex: currentRowIndex, columnIndex: prevCol }
      }

      // Wrap to previous row's last column
      if (currentRowIndex > 0) {
        const prevRow = rows[currentRowIndex - 1]
        if (prevRow) {
          const lastCol = findLastColumn(prevRow, isValidTarget)
          return { rowIndex: currentRowIndex - 1, columnIndex: lastCol }
        }
      }
    }

    return null
  }

  /**
   * Jump to first/last column (Cmd/Ctrl + Left/Right)
   */
  function navigateToEdge(
    edge: 'first' | 'last',
    currentRowIndex: number,
    rows: Row<T>[],
    isValidTarget?: IsValidTargetFn<T>,
  ): NavigationTarget | null {
    const currentRow = rows[currentRowIndex]
    if (!currentRow) return null

    const columnIndex =
      edge === 'first'
        ? findFirstColumn(currentRow, isValidTarget)
        : findLastColumn(currentRow, isValidTarget)

    return { rowIndex: currentRowIndex, columnIndex }
  }

  return {
    // Configuration (reactive)
    multiRowEnabled,
    multiRowCount,
    alignColumns,
    visibleColumns,

    // Core multi-row helpers
    getVisualRowForColumn,
    getColumnsInVisualRow,
    getNonPinnedColumnsInVisualRow,
    findColumnInVisualRow,

    // Visual row finders
    findFirstInVisualRow,
    findLastInVisualRow,
    findNextInVisualRow,
    findPreviousInVisualRow,

    // Column finders
    findFirstColumn,
    findLastColumn,
    findNextColumn,
    findPreviousColumn,

    // High-level navigation
    navigateVertical,
    navigateHorizontal,
    navigateTab,
    navigateToEdge,
  }
}
