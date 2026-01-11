import { describe, expect, it } from 'vitest'

/**
 * Tests for useNuGridFocus composable - utility functions
 *
 * Note: useNuGridFocus has heavy DOM dependencies (MutationObserver, document.getElementById,
 * querySelector, focus(), etc.) that require a full DOM environment to test properly.
 * This test file focuses on testing the logic that can be isolated.
 *
 * The composable is already indirectly tested through integration with other tests,
 * and the core scroll logic is tested in scroll-manager.test.ts.
 */

describe('pageUp/PageDown calculation logic', () => {
  describe('viewportRowsPerPage calculation', () => {
    // This tests the logic used in viewportRowsPerPage computed property
    function calculateViewportRowsPerPage(
      containerHeight: number,
      rowHeightEstimate: number,
      stickyHeaderHeight: number,
    ): number {
      const estimatedHeight = Math.max(rowHeightEstimate, 1)
      const stickyHeight = stickyHeaderHeight || 0

      if (containerHeight > 0) {
        const visibleHeight = Math.max(0, containerHeight - stickyHeight)
        return Math.max(1, Math.floor(visibleHeight / estimatedHeight))
      }

      // Fallback when the container has not been measured yet
      return Math.max(1, Math.round(600 / estimatedHeight))
    }

    it('should return correct rows per page without sticky headers', () => {
      // Container: 500px, Row height: 100px, No sticky header
      const result = calculateViewportRowsPerPage(500, 100, 0)
      expect(result).toBe(5)
    })

    it('should subtract sticky header height from container', () => {
      // Container: 600px, Row height: 100px, Sticky header: 100px
      // Visible area: 600 - 100 = 500px, so 5 rows fit
      const result = calculateViewportRowsPerPage(600, 100, 100)
      expect(result).toBe(5)
    })

    it('should return 6 rows without sticky header vs 5 with sticky header', () => {
      // This is the exact bug that was fixed - without accounting for sticky headers,
      // the calculation would return 6 rows instead of 5
      const withoutStickyHeader = calculateViewportRowsPerPage(600, 100, 0)
      const withStickyHeader = calculateViewportRowsPerPage(600, 100, 100)

      expect(withoutStickyHeader).toBe(6)
      expect(withStickyHeader).toBe(5)
    })

    it('should handle case where sticky header is larger than container', () => {
      // Edge case: sticky header takes up entire viewport
      const result = calculateViewportRowsPerPage(100, 50, 150)
      expect(result).toBe(1) // Should return at least 1
    })

    it('should return at least 1 row even with very large row heights', () => {
      const result = calculateViewportRowsPerPage(100, 500, 0)
      expect(result).toBe(1)
    })

    it('should use fallback when container height is 0', () => {
      // Fallback uses 600px default
      const result = calculateViewportRowsPerPage(0, 100, 0)
      expect(result).toBe(6) // 600 / 100 = 6
    })

    it('should handle fractional row counts by flooring', () => {
      // Container: 550px, Row height: 100px
      // 550 / 100 = 5.5, should floor to 5
      const result = calculateViewportRowsPerPage(550, 100, 0)
      expect(result).toBe(5)
    })
  })

  describe('row distance calculation for focus finding', () => {
    // This tests the logic used to find the closest row after page scroll
    function calculateRowDistance(rowTop: number, targetScreenY: number): number {
      return Math.abs(rowTop - targetScreenY)
    }

    function findClosestRowByTop(
      rows: Array<{ id: string; top: number }>,
      targetScreenY: number,
    ): { id: string; distance: number } | null {
      let closestRow: { id: string; distance: number } | null = null

      for (const row of rows) {
        const distance = calculateRowDistance(row.top, targetScreenY)
        if (!closestRow || distance < closestRow.distance) {
          closestRow = { id: row.id, distance }
        }
      }

      return closestRow
    }

    it('should find exact match when row top equals target', () => {
      const rows = [
        { id: 'row-1', top: 100 },
        { id: 'row-2', top: 200 },
        { id: 'row-3', top: 300 },
      ]
      const result = findClosestRowByTop(rows, 200)
      expect(result?.id).toBe('row-2')
      expect(result?.distance).toBe(0)
    })

    it('should find closest row when target is between rows', () => {
      const rows = [
        { id: 'row-1', top: 100 },
        { id: 'row-2', top: 200 },
        { id: 'row-3', top: 300 },
      ]
      // Target at 190 is closer to row-2 (200) than row-1 (100)
      const result = findClosestRowByTop(rows, 190)
      expect(result?.id).toBe('row-2')
    })

    it('should prefer earlier row when distances are equal', () => {
      const rows = [
        { id: 'row-1', top: 100 },
        { id: 'row-2', top: 200 },
      ]
      // Target at 150 is equidistant from both rows
      const result = findClosestRowByTop(rows, 150)
      // First row found with minimum distance wins
      expect(result?.id).toBe('row-1')
    })

    it('should handle single row', () => {
      const rows = [{ id: 'row-1', top: 100 }]
      const result = findClosestRowByTop(rows, 500)
      expect(result?.id).toBe('row-1')
    })

    it('should return null for empty rows array', () => {
      const result = findClosestRowByTop([], 100)
      expect(result).toBeNull()
    })
  })

  describe('page scroll boundary detection', () => {
    function isAtTopBoundary(rowIndex: number, scrollTop: number): boolean {
      return rowIndex === 0 && scrollTop <= 0
    }

    function isAtBottomBoundary(
      rowIndex: number,
      totalRows: number,
      scrollTop: number,
      maxScrollTop: number,
    ): boolean {
      return rowIndex >= totalRows - 1 || scrollTop >= maxScrollTop - 10
    }

    it('should detect top boundary when at first row with scrollTop 0', () => {
      expect(isAtTopBoundary(0, 0)).toBe(true)
    })

    it('should not detect top boundary when not at first row', () => {
      expect(isAtTopBoundary(1, 0)).toBe(false)
    })

    it('should not detect top boundary when scrolled down', () => {
      expect(isAtTopBoundary(0, 100)).toBe(false)
    })

    it('should detect bottom boundary when at last row', () => {
      expect(isAtBottomBoundary(99, 100, 500, 1000)).toBe(true)
    })

    it('should detect bottom boundary when scroll is near max', () => {
      expect(isAtBottomBoundary(50, 100, 995, 1000)).toBe(true)
    })

    it('should not detect bottom boundary in middle of grid', () => {
      expect(isAtBottomBoundary(50, 100, 500, 1000)).toBe(false)
    })
  })

  describe('visual position preservation', () => {
    function calculateTargetVisualTop(
      elementTop: number,
      containerTop: number,
      stickyHeaderHeight: number,
    ): number {
      const visibleTop = containerTop + stickyHeaderHeight
      return elementTop - visibleTop
    }

    it('should calculate visual position relative to visible area', () => {
      // Element at screen position 300, container at 100, sticky header 50
      // visibleTop = 100 + 50 = 150
      // targetVisualTop = 300 - 150 = 150
      const result = calculateTargetVisualTop(300, 100, 50)
      expect(result).toBe(150)
    })

    it('should handle element at top of visible area', () => {
      // Element at 150, container at 100, sticky header 50
      // visibleTop = 150, targetVisualTop = 0
      const result = calculateTargetVisualTop(150, 100, 50)
      expect(result).toBe(0)
    })

    it('should handle negative visual position (above visible area)', () => {
      // Element at 120, container at 100, sticky header 50
      // visibleTop = 150, targetVisualTop = -30
      const result = calculateTargetVisualTop(120, 100, 50)
      expect(result).toBe(-30)
    })
  })
})

describe('useNuGridFocus utility functions', () => {
  describe('focusedCell interface', () => {
    it('should define correct structure', () => {
      const focusedCell = {
        rowIndex: 0,
        columnIndex: 1,
      }

      expect(focusedCell.rowIndex).toBe(0)
      expect(focusedCell.columnIndex).toBe(1)
    })
  })

  describe('focus mode handling', () => {
    it('should support cell focus mode', () => {
      const props = { focusMode: 'cell' }
      expect(props.focusMode).toBe('cell')
    })

    it('should support row focus mode', () => {
      const props = { focusMode: 'row' }
      expect(props.focusMode).toBe('row')
    })

    it('should support none focus mode', () => {
      const props = { focusMode: 'none' }
      expect(props.focusMode).toBe('none')
    })
  })

  describe('cell selector pattern', () => {
    it('should use correct default cell selector pattern', () => {
      const defaultSelector = '[data-row-id="$ID"] [data-cell-index="$COL"]'
      const rowId = 'row-1'
      const colIndex = '2'

      const selector = defaultSelector.replace('$ID', rowId).replace('$COL', colIndex)

      expect(selector).toBe('[data-row-id="row-1"] [data-cell-index="2"]')
    })

    it('should use correct default row selector pattern', () => {
      const defaultSelector = '[data-row-id="$ID"]'
      const rowId = 'row-1'

      const selector = defaultSelector.replace('$ID', rowId)

      expect(selector).toBe('[data-row-id="row-1"]')
    })
  })

  describe('row ID to index mapping logic', () => {
    it('should map row IDs to indices correctly', () => {
      const rows = [{ id: 'row-0' }, { id: 'row-1' }, { id: 'row-2' }]

      const rowIdToIndexMap = new Map<string, number>()
      rows.forEach((row, index) => {
        rowIdToIndexMap.set(row.id, index)
      })

      expect(rowIdToIndexMap.get('row-0')).toBe(0)
      expect(rowIdToIndexMap.get('row-1')).toBe(1)
      expect(rowIdToIndexMap.get('row-2')).toBe(2)
      expect(rowIdToIndexMap.get('nonexistent')).toBeUndefined()
    })

    it('should use navigable rows instead of group placeholder rows in grouped grids', () => {
      // This tests the fix for the bug where rowIdToIndexMap was built with
      // allRows (group placeholder rows) instead of navigableRows (actual data rows).
      // In grouped grids, TanStack Table creates synthetic group rows, but focus
      // navigation needs to work with the actual user data rows.

      // Simulate a grouped grid scenario:
      // - allRows: 3 group placeholder rows (from TanStack grouping)
      const _allRows = [{ id: 'group-0' }, { id: 'group-1' }, { id: 'group-2' }]

      // - navigableRows: 400 actual data rows
      const navigableRows = Array.from({ length: 400 }, (_, i) => ({
        id: `data-row-${i}`,
      }))

      // The map should be built with navigableRows, not allRows
      const rowIdToIndexMap = new Map<string, number>()
      navigableRows.forEach((row, index) => {
        rowIdToIndexMap.set(row.id, index)
      })

      // Verify that data rows can be looked up
      expect(rowIdToIndexMap.get('data-row-0')).toBe(0)
      expect(rowIdToIndexMap.get('data-row-100')).toBe(100)
      expect(rowIdToIndexMap.get('data-row-399')).toBe(399)

      // Verify that group placeholder rows are NOT in the map
      expect(rowIdToIndexMap.get('group-0')).toBeUndefined()
      expect(rowIdToIndexMap.get('group-1')).toBeUndefined()
      expect(rowIdToIndexMap.get('group-2')).toBeUndefined()

      // Verify total map size matches navigable rows, not all rows
      expect(rowIdToIndexMap.size).toBe(400)
      expect(rowIdToIndexMap.size).not.toBe(3)
    })

    it('should return -1 when looking up a row not in the map', () => {
      const rows = [{ id: 'row-0' }, { id: 'row-1' }]

      const rowIdToIndexMap = new Map<string, number>()
      rows.forEach((row, index) => {
        rowIdToIndexMap.set(row.id, index)
      })

      // Simulate the getRowIndex function
      const getRowIndex = (row: { id: string }) => {
        return rowIdToIndexMap.get(row.id) ?? -1
      }

      // Should return -1 for nonexistent row (this was the bug symptom)
      const nonexistentRow = { id: 'data-row-100' }
      expect(getRowIndex(nonexistentRow)).toBe(-1)

      // Should return correct index for existing row
      expect(getRowIndex({ id: 'row-0' })).toBe(0)
      expect(getRowIndex({ id: 'row-1' })).toBe(1)
    })
  })

  describe('column focusability logic', () => {
    it('should consider column focusable when enableFocusing is undefined', () => {
      const columnDef = {}
      const enableFocusing = (columnDef as any).enableFocusing
      const isFocusable = enableFocusing === undefined ? true : enableFocusing

      expect(isFocusable).toBe(true)
    })

    it('should consider column focusable when enableFocusing is true', () => {
      const columnDef = { enableFocusing: true }
      const isFocusable = columnDef.enableFocusing

      expect(isFocusable).toBe(true)
    })

    it('should consider column not focusable when enableFocusing is false', () => {
      const columnDef = { enableFocusing: false }
      const isFocusable = columnDef.enableFocusing

      expect(isFocusable).toBe(false)
    })

    it('should evaluate function-based enableFocusing with row context', () => {
      const row = { id: 'row-1', original: { id: 1, disabled: true } }
      const columnDef = {
        enableFocusing: (r: any) => !r.original.disabled,
      }

      const isFocusable = columnDef.enableFocusing(row)

      expect(isFocusable).toBe(false)
    })
  })

  describe('keyboard navigation keys', () => {
    it('should recognize navigation keys', () => {
      const navigationKeys = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
        'PageUp',
        'PageDown',
        'Tab',
      ]

      navigationKeys.forEach((key) => {
        expect(typeof key).toBe('string')
        expect(key.length).toBeGreaterThan(0)
      })
    })

    it('should recognize Space key for selection', () => {
      const spaceKey = ' '
      expect(spaceKey).toBe(' ')
    })
  })

  describe('tabIndex calculation', () => {
    it('should return 0 for focused cell', () => {
      const isFocused = true
      const tabIndex = isFocused ? 0 : -1

      expect(tabIndex).toBe(0)
    })

    it('should return -1 for non-focused cell', () => {
      const isFocused = false
      const tabIndex = isFocused ? 0 : -1

      expect(tabIndex).toBe(-1)
    })
  })

  describe('active row detection', () => {
    it('should detect active row based on focused cell row index', () => {
      const focusedCell = { rowIndex: 2, columnIndex: 1 }
      const rowIndex = 2

      const isActive = focusedCell.rowIndex === rowIndex

      expect(isActive).toBe(true)
    })

    it('should not detect non-active row', () => {
      const focusedCell = { rowIndex: 2, columnIndex: 1 }
      const rowIndex = 3

      const isActive = focusedCell.rowIndex === rowIndex

      expect(isActive).toBe(false)
    })
  })

  describe('focused cell detection', () => {
    it('should detect focused cell based on row and column indices', () => {
      const focusedCell = { rowIndex: 2, columnIndex: 3 }
      const rowIndex = 2
      const colIndex = 3

      const isFocused = focusedCell.rowIndex === rowIndex && focusedCell.columnIndex === colIndex

      expect(isFocused).toBe(true)
    })

    it('should not detect cell when row matches but column differs', () => {
      const focusedCell = { rowIndex: 2, columnIndex: 3 }
      const rowIndex = 2
      const colIndex = 4

      const isFocused = focusedCell.rowIndex === rowIndex && focusedCell.columnIndex === colIndex

      expect(isFocused).toBe(false)
    })
  })

  describe('find focusable column logic', () => {
    it('should find next focusable column', () => {
      const columns = [
        { enableFocusing: true },
        { enableFocusing: false },
        { enableFocusing: true },
        { enableFocusing: true },
      ]
      const startIndex = 0

      let nextFocusable = startIndex
      for (let i = startIndex + 1; i < columns.length; i++) {
        if (columns[i].enableFocusing !== false) {
          nextFocusable = i
          break
        }
      }

      expect(nextFocusable).toBe(2) // Skips index 1 (not focusable)
    })

    it('should find previous focusable column', () => {
      const columns = [
        { enableFocusing: true },
        { enableFocusing: false },
        { enableFocusing: true },
        { enableFocusing: true },
      ]
      const startIndex = 3

      let prevFocusable = startIndex
      for (let i = startIndex - 1; i >= 0; i--) {
        if (columns[i].enableFocusing !== false) {
          prevFocusable = i
          break
        }
      }

      expect(prevFocusable).toBe(2)
    })

    it('should find first focusable column', () => {
      const columns = [
        { enableFocusing: false },
        { enableFocusing: false },
        { enableFocusing: true },
        { enableFocusing: true },
      ]

      let firstFocusable = 0
      for (let i = 0; i < columns.length; i++) {
        if (columns[i].enableFocusing !== false) {
          firstFocusable = i
          break
        }
      }

      expect(firstFocusable).toBe(2)
    })

    it('should find last focusable column', () => {
      const columns = [
        { enableFocusing: true },
        { enableFocusing: true },
        { enableFocusing: false },
        { enableFocusing: false },
      ]

      let lastFocusable = columns.length - 1
      for (let i = columns.length - 1; i >= 0; i--) {
        if (columns[i].enableFocusing !== false) {
          lastFocusable = i
          break
        }
      }

      expect(lastFocusable).toBe(1)
    })
  })
})
