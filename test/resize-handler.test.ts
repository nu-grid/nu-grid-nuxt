import { describe, expect, it } from 'vitest'

/**
 * Tests for maintainTableWidth resize handler logic
 *
 * This test suite verifies that the column resize algorithm correctly:
 * 1. Maintains total table width when resizing columns
 * 2. Distributes size changes proportionally to following columns
 * 3. Respects min/max constraints on all columns
 */

interface Column {
  id: string
  size: number
  minSize: number
  maxSize: number
  enableResizing?: boolean
}

/**
 * Simulates the resize logic from createMaintainWidthResizeHandler
 * Uses shift resizing: only the immediately following column is adjusted
 */
function simulateResize(
  columns: Column[],
  resizedColumnIndex: number,
  deltaOffset: number,
): Column[] {
  const newColumns = [...columns]
  const startSize = columns[resizedColumnIndex].size

  // Get following columns
  const followingColumns = columns.slice(resizedColumnIndex + 1)

  // Get current size of the resized column
  const currentSize = columns[resizedColumnIndex].size

  // Calculate the desired new size based on the cumulative delta from start
  const desiredSize = Math.max(
    columns[resizedColumnIndex].minSize,
    Math.min(startSize + deltaOffset, columns[resizedColumnIndex].maxSize),
  )

  // Calculate the delta from current size to desired size
  const deltaFromCurrent = desiredSize - currentSize

  // Shift resizing: only the immediately following column is resized
  let constrainedNewSize = desiredSize
  if (followingColumns.length > 0 && deltaFromCurrent !== 0) {
    const nextColumn = followingColumns[0]

    // Safety check: if nextColumn is null/undefined, don't allow resize
    if (!nextColumn) {
      constrainedNewSize = currentSize
    } else {
      // Check if the next column is resizable
      const nextColumnResizable = nextColumn.enableResizing !== false

      if (!nextColumnResizable) {
        // Next column cannot be resized, so don't allow this resize
        constrainedNewSize = currentSize
      } else {
        const nextColumnSize = nextColumn.size
        const nextMinSize = nextColumn.minSize
        const nextMaxSize = nextColumn.maxSize

        if (deltaFromCurrent > 0) {
          // When growing, next column must shrink
          const maxNextCanShrink = Math.max(0, nextColumnSize - nextMinSize)

          if (maxNextCanShrink < 1) {
            constrainedNewSize = currentSize
          } else {
            constrainedNewSize = Math.min(desiredSize, currentSize + maxNextCanShrink)
          }
        } else if (deltaFromCurrent < 0) {
          // When shrinking, next column must grow
          const maxNextCanGrow = Math.max(0, nextMaxSize - nextColumnSize)

          if (maxNextCanGrow < 1) {
            constrainedNewSize = currentSize
          } else {
            constrainedNewSize = Math.max(desiredSize, currentSize - maxNextCanGrow)
          }
        }
      }
    }
  }

  // Calculate actual delta from current size
  const actualDelta = constrainedNewSize - currentSize
  newColumns[resizedColumnIndex] = { ...columns[resizedColumnIndex], size: constrainedNewSize }

  // Apply shift resizing: adjust only the immediately following column
  if (followingColumns.length > 0 && actualDelta !== 0) {
    const nextColumn = followingColumns[0]
    const nextColumnIndex = resizedColumnIndex + 1
    const nextColumnCurrentSize = nextColumn.size

    // The next column changes by exactly the opposite amount
    // No additional constraints here - we already constrained actualDelta above
    const nextColumnNewSize = nextColumnCurrentSize - actualDelta

    newColumns[nextColumnIndex] = { ...columns[nextColumnIndex], size: nextColumnNewSize }
  }

  return newColumns
}

describe('maintainTableWidth Resize Handler', () => {
  describe('basic functionality', () => {
    const initialColumns: Column[] = [
      { id: 'col1', size: 200, minSize: 50, maxSize: 1000 },
      { id: 'col2', size: 300, minSize: 50, maxSize: 1000 },
      { id: 'col3', size: 250, minSize: 50, maxSize: 1000 },
      { id: 'col4', size: 150, minSize: 50, maxSize: 1000 },
    ]

    it('should maintain total table width when increasing first column size', () => {
      const totalBefore = initialColumns.reduce((sum, col) => sum + col.size, 0)

      const result = simulateResize(initialColumns, 0, 100)

      const totalAfter = result.reduce((sum, col) => sum + col.size, 0)
      expect(totalAfter).toBe(totalBefore)
      expect(result[0].size).toBe(300) // 200 + 100
    })

    it('should maintain total table width when decreasing column size', () => {
      const totalBefore = initialColumns.reduce((sum, col) => sum + col.size, 0)

      const result = simulateResize(initialColumns, 1, -50)

      const totalAfter = result.reduce((sum, col) => sum + col.size, 0)
      expect(totalAfter).toBe(totalBefore)
      expect(result[1].size).toBe(250) // 300 - 50
    })

    it('should use shift resizing: only the next column is affected', () => {
      const result = simulateResize(initialColumns, 0, 100)

      // Shift resizing: only the immediately following column (col2) is affected
      // Col1: 200px -> 300px (+100px)
      // Col2: 300px -> 200px (-100px) - only this column changes
      // Col3: 250px -> 250px (unchanged)
      // Col4: 150px -> 150px (unchanged)
      expect(result[0].size).toBe(300)
      expect(result[1].size).toBe(200) // Only col2 changes
      expect(result[2].size).toBe(250) // Unchanged
      expect(result[3].size).toBe(150) // Unchanged
    })

    it('should handle decreasing column with only next column growing', () => {
      const result = simulateResize(initialColumns, 1, -50)

      // Shift resizing: only col3 (next column) grows
      expect(result[1].size).toBe(250) // 300 - 50
      expect(result[2].size).toBe(300) // 250 + 50 - only this column changes
      expect(result[3].size).toBe(150) // Unchanged
    })
  })

  describe('edge cases', () => {
    it('should handle resizing the last column (no following columns)', () => {
      const columns: Column[] = [
        { id: 'col1', size: 200, minSize: 50, maxSize: 1000 },
        { id: 'col2', size: 300, minSize: 50, maxSize: 1000 },
        { id: 'col3', size: 250, minSize: 50, maxSize: 1000 },
      ]

      const totalBefore = columns.reduce((sum, col) => sum + col.size, 0)
      const result = simulateResize(columns, 2, 50)
      const totalAfter = result.reduce((sum, col) => sum + col.size, 0)

      // When resizing the last column, there are no following columns
      // so the table width will change
      expect(result[2].size).toBe(300) // 250 + 50
      expect(totalAfter).toBe(totalBefore + 50)
    })

    it('should handle zero delta (no change)', () => {
      const columns: Column[] = [
        { id: 'col1', size: 200, minSize: 50, maxSize: 1000 },
        { id: 'col2', size: 300, minSize: 50, maxSize: 1000 },
      ]

      const result = simulateResize(columns, 0, 0)

      expect(result[0].size).toBe(200)
      expect(result[1].size).toBe(300)
    })

    it('should handle single column table', () => {
      const columns: Column[] = [{ id: 'col1', size: 200, minSize: 50, maxSize: 1000 }]

      const result = simulateResize(columns, 0, 100)

      // With only one column, no redistribution can occur
      expect(result[0].size).toBe(300)
    })
  })

  describe('constraint handling', () => {
    it('should respect minSize constraint on resized column', () => {
      const columns: Column[] = [
        { id: 'col1', size: 100, minSize: 80, maxSize: 1000 },
        { id: 'col2', size: 300, minSize: 50, maxSize: 1000 },
      ]

      // Try to shrink below minSize
      const result = simulateResize(columns, 0, -50)

      expect(result[0].size).toBe(80) // Constrained to minSize
    })

    it('should respect maxSize constraint on resized column', () => {
      const columns: Column[] = [
        { id: 'col1', size: 200, minSize: 50, maxSize: 250 },
        { id: 'col2', size: 300, minSize: 50, maxSize: 1000 },
      ]

      // Try to grow beyond maxSize
      const result = simulateResize(columns, 0, 100)

      expect(result[0].size).toBe(250) // Constrained to maxSize
    })

    it('should respect minSize constraints on following columns', () => {
      const columns: Column[] = [
        { id: 'col1', size: 200, minSize: 50, maxSize: 1000 },
        { id: 'col2', size: 100, minSize: 90, maxSize: 1000 },
        { id: 'col3', size: 100, minSize: 90, maxSize: 1000 },
      ]

      const result = simulateResize(columns, 0, 100)

      // Following columns should not shrink below their minSize
      expect(result[1].size).toBeGreaterThanOrEqual(columns[1].minSize)
      expect(result[2].size).toBeGreaterThanOrEqual(columns[2].minSize)
    })

    it('should respect maxSize constraints on following columns', () => {
      const columns: Column[] = [
        { id: 'col1', size: 200, minSize: 50, maxSize: 1000 },
        { id: 'col2', size: 100, minSize: 50, maxSize: 120 },
        { id: 'col3', size: 100, minSize: 50, maxSize: 120 },
      ]

      // Shrink first column to grow following columns
      const result = simulateResize(columns, 0, -50)

      // Following columns should not grow beyond their maxSize
      expect(result[1].size).toBeLessThanOrEqual(columns[1].maxSize)
      expect(result[2].size).toBeLessThanOrEqual(columns[2].maxSize)
    })
  })

  describe('shift resizing behavior', () => {
    it('should only affect the immediately following column', () => {
      const columns: Column[] = [
        { id: 'col1', size: 200, minSize: 50, maxSize: 1000 },
        { id: 'col2', size: 400, minSize: 50, maxSize: 1000 },
        { id: 'col3', size: 200, minSize: 50, maxSize: 1000 },
        { id: 'col4', size: 100, minSize: 50, maxSize: 1000 },
      ]

      const result = simulateResize(columns, 0, 100)

      // Only col2 (immediately following) should change
      expect(result[0].size).toBe(300) // +100
      expect(result[1].size).toBe(300) // -100 (only this one changes)
      expect(result[2].size).toBe(200) // unchanged
      expect(result[3].size).toBe(100) // unchanged
    })

    it('should maintain width through shift resizing', () => {
      const columns: Column[] = [
        { id: 'col1', size: 200, minSize: 50, maxSize: 1000 },
        { id: 'col2', size: 333, minSize: 50, maxSize: 1000 },
        { id: 'col3', size: 333, minSize: 50, maxSize: 1000 },
        { id: 'col4', size: 334, minSize: 50, maxSize: 1000 },
      ]

      const totalBefore = columns.reduce((sum, col) => sum + col.size, 0)
      const result = simulateResize(columns, 0, 100)
      const totalAfter = result.reduce((sum, col) => sum + col.size, 0)

      // Despite rounding, total should still be maintained
      expect(totalAfter).toBe(totalBefore)
    })
  })

  describe('multiple resizes', () => {
    it('should maintain width through multiple consecutive resizes', () => {
      const columns: Column[] = [
        { id: 'col1', size: 200, minSize: 50, maxSize: 1000 },
        { id: 'col2', size: 300, minSize: 50, maxSize: 1000 },
        { id: 'col3', size: 250, minSize: 50, maxSize: 1000 },
        { id: 'col4', size: 150, minSize: 50, maxSize: 1000 },
      ]

      const totalBefore = columns.reduce((sum, col) => sum + col.size, 0)

      // First resize: increase col1 by 100
      let result = simulateResize(columns, 0, 100)
      expect(result.reduce((sum, col) => sum + col.size, 0)).toBe(totalBefore)

      // Second resize: decrease col2 by 50
      result = simulateResize(result, 1, -50)
      expect(result.reduce((sum, col) => sum + col.size, 0)).toBe(totalBefore)

      // Third resize: increase col3 by 30
      result = simulateResize(result, 2, 30)
      expect(result.reduce((sum, col) => sum + col.size, 0)).toBe(totalBefore)
    })
  })

  describe('prevent glitches when resizing beyond available space', () => {
    it('should not exceed total width when following columns hit minSize', () => {
      const columns: Column[] = [
        { id: 'col1', size: 200, minSize: 50, maxSize: 1000 },
        { id: 'col2', size: 100, minSize: 80, maxSize: 1000 }, // Only 20px available to shrink
        { id: 'col3', size: 100, minSize: 80, maxSize: 1000 }, // Only 20px available to shrink
      ]

      const totalBefore = columns.reduce((sum, col) => sum + col.size, 0)

      // Try to grow col1 by 100px, but following columns can only shrink by 40px total
      const result = simulateResize(columns, 0, 100)
      const totalAfter = result.reduce((sum, col) => sum + col.size, 0)

      // Should maintain total width (or be very close due to rounding)
      expect(totalAfter).toBe(totalBefore)

      // Col1 should only grow by what following columns can provide
      expect(result[0].size).toBeLessThanOrEqual(240) // 200 + 40
      expect(result[1].size).toBeGreaterThanOrEqual(columns[1].minSize)
      expect(result[2].size).toBeGreaterThanOrEqual(columns[2].minSize)
    })

    it('should handle extreme case where following columns are already at minSize', () => {
      const columns: Column[] = [
        { id: 'col1', size: 200, minSize: 50, maxSize: 1000 },
        { id: 'col2', size: 80, minSize: 80, maxSize: 1000 }, // Already at minSize
        { id: 'col3', size: 80, minSize: 80, maxSize: 1000 }, // Already at minSize
      ]

      const totalBefore = columns.reduce((sum, col) => sum + col.size, 0)

      // Try to grow col1 - should not be possible without exceeding width
      const result = simulateResize(columns, 0, 100)
      const totalAfter = result.reduce((sum, col) => sum + col.size, 0)

      // Should maintain total width
      expect(totalAfter).toBe(totalBefore)

      // Col1 should not grow since following columns can't shrink
      expect(result[0].size).toBe(200)
      expect(result[1].size).toBe(80)
      expect(result[2].size).toBe(80)
    })

    it('should prevent flickering when shrinking beyond maxSize of following columns', () => {
      const columns: Column[] = [
        { id: 'col1', size: 200, minSize: 50, maxSize: 1000 },
        { id: 'col2', size: 100, minSize: 50, maxSize: 120 }, // Only 20px available to grow
        { id: 'col3', size: 100, minSize: 50, maxSize: 120 }, // Only 20px available to grow
      ]

      const totalBefore = columns.reduce((sum, col) => sum + col.size, 0)

      // Try to shrink col1 by 100px, but following columns can only grow by 40px total
      const result = simulateResize(columns, 0, -100)
      const totalAfter = result.reduce((sum, col) => sum + col.size, 0)

      // Should maintain total width (or be very close due to rounding)
      expect(totalAfter).toBe(totalBefore)

      // Col1 should only shrink by what following columns can accommodate
      expect(result[0].size).toBeGreaterThanOrEqual(160) // 200 - 40
      expect(result[1].size).toBeLessThanOrEqual(columns[1].maxSize)
      expect(result[2].size).toBeLessThanOrEqual(columns[2].maxSize)
    })

    it('should handle columns with minSize of 0', () => {
      const columns: Column[] = [
        { id: 'col1', size: 200, minSize: 0, maxSize: 1000 },
        { id: 'col2', size: 100, minSize: 0, maxSize: 1000 },
        { id: 'col3', size: 100, minSize: 0, maxSize: 1000 },
      ]

      const totalBefore = columns.reduce((sum, col) => sum + col.size, 0)

      // Grow col1 by 250px - with shift resizing, only col2 shrinks
      const result = simulateResize(columns, 0, 250)
      const totalAfter = result.reduce((sum, col) => sum + col.size, 0)

      // Should maintain total width
      expect(totalAfter).toBe(totalBefore)

      // Shift resizing: col1 can only grow by 100px (what col2 can provide)
      expect(result[0].size).toBe(300) // 200 + 100 (limited by col2's capacity)
      expect(result[1].size).toBe(0) // col2 shrinks to 0
      expect(result[2].size).toBe(100) // col3 unchanged
    })

    it('should not allow growth when next column is at zero', () => {
      const columns: Column[] = [
        { id: 'col1', size: 300, minSize: 0, maxSize: 1000 },
        { id: 'col2', size: 0, minSize: 0, maxSize: 1000 },
        { id: 'col3', size: 100, minSize: 0, maxSize: 1000 },
      ]

      const totalBefore = columns.reduce((sum, col) => sum + col.size, 0)

      // Try to grow col1 when col2 (next column) is already at 0
      const result = simulateResize(columns, 0, 50)
      const totalAfter = result.reduce((sum, col) => sum + col.size, 0)

      // Should maintain total width
      expect(totalAfter).toBe(totalBefore)

      // Col1 should not grow since next column (col2) is at its minimum (0)
      expect(result[0].size).toBe(300)
      expect(result[1].size).toBe(0)
      expect(result[2].size).toBe(100)
    })

    it('should not allow resize when next column is not resizable', () => {
      const columns: Column[] = [
        { id: 'col1', size: 200, minSize: 50, maxSize: 1000 },
        { id: 'col2', size: 300, minSize: 50, maxSize: 1000 },
        { id: 'actions', size: 60, minSize: 60, maxSize: 60, enableResizing: false },
      ]

      const totalBefore = columns.reduce((sum, col) => sum + col.size, 0)

      // Try to grow col2 when next column (actions) is not resizable
      const result = simulateResize(columns, 1, 100)
      const totalAfter = result.reduce((sum, col) => sum + col.size, 0)

      // Should maintain total width
      expect(totalAfter).toBe(totalBefore)

      // Col2 should not resize since next column cannot be resized
      expect(result[1].size).toBe(300)
      expect(result[2].size).toBe(60) // Actions column unchanged
    })

    it('should not allow resize in either direction when next column is not resizable', () => {
      const columns: Column[] = [
        { id: 'status', size: 150, minSize: 80, maxSize: 1000 },
        { id: 'actions', size: 60, minSize: 60, maxSize: 60, enableResizing: false },
      ]

      // Try to grow status column
      let result = simulateResize(columns, 0, 50)
      expect(result[0].size).toBe(150) // No change
      expect(result[1].size).toBe(60) // Actions unchanged

      // Try to shrink status column
      result = simulateResize(columns, 0, -50)
      expect(result[0].size).toBe(150) // No change
      expect(result[1].size).toBe(60) // Actions unchanged
    })
  })
})
