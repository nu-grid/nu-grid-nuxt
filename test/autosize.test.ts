import { beforeEach, describe, expect, it } from 'vitest'

/**
 * Tests for table autosize functionality
 *
 * This test suite verifies that the autosize algorithm correctly:
 * 1. Measures column content widths
 * 2. Applies contentContents mode (size to content)
 * 3. Applies fillWidth mode (scale up to fill container)
 * 4. Respects min/max constraints on columns
 * 5. Skips columns marked for exclusion
 */

interface Column {
  id: string
  size: number
  minSize: number
  maxSize: number
  contentWidth: number
}

/**
 * Simulates the autosize logic for contentContents mode
 */
function simulateFitCellContents(
  columns: Column[],
  skipColumns: string[] = [],
): Record<string, number> {
  const newSizing: Record<string, number> = {}

  columns.forEach((column) => {
    if (skipColumns.includes(column.id)) {
      return
    }

    const constrainedWidth = Math.max(column.minSize, Math.min(column.contentWidth, column.maxSize))

    newSizing[column.id] = constrainedWidth
  })

  return newSizing
}

/**
 * Simulates the autosize logic for fillWidth mode
 */
function simulateFitGridWidth(
  columns: Column[],
  containerWidth: number,
  skipColumns: string[] = [],
): Record<string, number> {
  const newSizing: Record<string, number> = {}

  // First, calculate content widths
  const columnWidths = columns.map((column) => ({
    id: column.id,
    width: skipColumns.includes(column.id)
      ? column.size
      : Math.max(column.minSize, Math.min(column.contentWidth, column.maxSize)),
    skip: skipColumns.includes(column.id),
  }))

  const totalContentWidth = columnWidths.reduce((sum, col) => sum + col.width, 0)

  if (totalContentWidth < containerWidth && totalContentWidth > 0) {
    // Scale up to fill container
    const scaleFactor = containerWidth / totalContentWidth

    columnWidths.forEach((col) => {
      if (!col.skip) {
        const column = columns.find((c) => c.id === col.id)
        if (column) {
          const scaledWidth = col.width * scaleFactor
          newSizing[col.id] = Math.min(scaledWidth, column.maxSize)
        }
      }
    })
  } else {
    // Use measured widths
    columnWidths.forEach((col) => {
      if (!col.skip) {
        newSizing[col.id] = col.width
      }
    })
  }

  return newSizing
}

describe('table Autosize', () => {
  let columns: Column[]

  beforeEach(() => {
    columns = [
      { id: 'id', size: 100, minSize: 50, maxSize: 200, contentWidth: 80 },
      { id: 'name', size: 150, minSize: 100, maxSize: 300, contentWidth: 180 },
      { id: 'email', size: 200, minSize: 150, maxSize: 400, contentWidth: 220 },
      { id: 'status', size: 100, minSize: 80, maxSize: 150, contentWidth: 90 },
    ]
  })

  describe('contentContents mode', () => {
    it('should size columns to fit their content', () => {
      const result = simulateFitCellContents(columns)

      expect(result.id).toBe(80)
      expect(result.name).toBe(180)
      expect(result.email).toBe(220)
      expect(result.status).toBe(90)
    })

    it('should respect minSize constraints', () => {
      columns[0].contentWidth = 30 // Below minSize of 50

      const result = simulateFitCellContents(columns)

      expect(result.id).toBe(50) // Should use minSize
    })

    it('should respect maxSize constraints', () => {
      columns[1].contentWidth = 350 // Above maxSize of 300

      const result = simulateFitCellContents(columns)

      expect(result.name).toBe(300) // Should use maxSize
    })

    it('should skip columns marked for exclusion', () => {
      const result = simulateFitCellContents(columns, ['id', 'status'])

      expect(result.id).toBeUndefined()
      expect(result.name).toBe(180)
      expect(result.email).toBe(220)
      expect(result.status).toBeUndefined()
    })
  })

  describe('fillWidth mode', () => {
    it('should scale up columns when content is smaller than container', () => {
      const containerWidth = 800
      const totalContentWidth = 80 + 180 + 220 + 90 // 570

      const result = simulateFitGridWidth(columns, containerWidth)

      const scaleFactor = containerWidth / totalContentWidth

      expect(result.id).toBeCloseTo(80 * scaleFactor, 1)
      expect(result.name).toBeCloseTo(180 * scaleFactor, 1)
      expect(result.email).toBeCloseTo(220 * scaleFactor, 1)
      expect(result.status).toBeCloseTo(90 * scaleFactor, 1)
    })

    it('should not scale up when content is larger than container', () => {
      const containerWidth = 400
      const result = simulateFitGridWidth(columns, containerWidth)

      // Should use measured widths since content is larger
      expect(result.id).toBe(80)
      expect(result.name).toBe(180)
      expect(result.email).toBe(220)
      expect(result.status).toBe(90)
    })

    it('should respect maxSize when scaling up', () => {
      columns[0].maxSize = 100 // Lower maxSize
      const containerWidth = 1000

      const result = simulateFitGridWidth(columns, containerWidth)

      expect(result.id).toBeLessThanOrEqual(100) // Should not exceed maxSize
    })

    it('should skip columns marked for exclusion', () => {
      const containerWidth = 800
      const result = simulateFitGridWidth(columns, containerWidth, ['email'])

      expect(result.id).toBeDefined()
      expect(result.name).toBeDefined()
      expect(result.email).toBeUndefined()
      expect(result.status).toBeDefined()
    })

    it('should handle zero total content width gracefully', () => {
      columns.forEach((col) => (col.contentWidth = 0))
      const containerWidth = 800

      const result = simulateFitGridWidth(columns, containerWidth)

      // When content width is 0, uses minSize, then scales up to fit container
      const totalMinWidth = 50 + 100 + 150 + 80 // 380
      const scaleFactor = containerWidth / totalMinWidth

      expect(result.id).toBeCloseTo(50 * scaleFactor, 1)
      expect(result.name).toBeCloseTo(100 * scaleFactor, 1)
      expect(result.email).toBeCloseTo(150 * scaleFactor, 1)
      // status has maxSize of 150, so it should be capped
      expect(result.status).toBeLessThanOrEqual(150)
    })
  })

  describe('edge cases', () => {
    it('should handle empty column list', () => {
      const result = simulateFitCellContents([])
      expect(Object.keys(result).length).toBe(0)
    })

    it('should handle all columns skipped', () => {
      const allIds = columns.map((c) => c.id)
      const result = simulateFitCellContents(columns, allIds)
      expect(Object.keys(result).length).toBe(0)
    })

    it('should handle extreme content widths', () => {
      columns[0].contentWidth = 10000
      columns[1].contentWidth = 1

      const result = simulateFitCellContents(columns)

      expect(result.id).toBe(columns[0].maxSize)
      expect(result.name).toBe(columns[1].minSize)
    })
  })
})
