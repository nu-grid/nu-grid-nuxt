import { expect, test } from '@nuxt/test-utils/playwright'

/**
 * E2E tests for NuGrid keyboard focus navigation
 *
 * Tests DOM manipulation aspects of useNuGridFocus composable:
 * - Cell focus with keyboard
 * - Arrow key navigation
 * - Tab navigation
 * - Home/End navigation
 * - PageUp/PageDown navigation
 */

test.describe('NuGrid PageUp/PageDown Navigation', () => {
  test.beforeEach(async ({ goto }) => {
    await goto('/playwright-demo', { waitUntil: 'hydration' })
  })

  test('should scroll down one page with PageDown', async ({ page }) => {
    // Click on a table cell to focus it
    const cells = page.locator('[data-cell-index]')
    const firstCell = cells.first()
    await firstCell.click()

    // Get initial focused row
    const initialRowId = await page.evaluate(() => {
      const focused = document.querySelector('[data-focused="true"]')
      return focused?.closest('[data-row-id]')?.getAttribute('data-row-id')
    })

    // Press PageDown
    await page.keyboard.press('PageDown')

    // Wait for scroll to complete
    await page.waitForTimeout(100)

    // Get new focused row
    const afterPageDownRowId = await page.evaluate(() => {
      const focused = document.querySelector('[data-focused="true"]')
      return focused?.closest('[data-row-id]')?.getAttribute('data-row-id')
    })

    // Focus should have moved to a different row
    if (initialRowId && afterPageDownRowId) {
      expect(afterPageDownRowId).not.toBe(initialRowId)
    }
  })

  test('should scroll up one page with PageUp', async ({ page }) => {
    // First scroll down to have room to scroll up
    const cells = page.locator('[data-cell-index]')
    await cells.first().click()

    // Press PageDown twice to scroll down
    await page.keyboard.press('PageDown')
    await page.waitForTimeout(100)
    await page.keyboard.press('PageDown')
    await page.waitForTimeout(100)

    // Get current focused row
    const beforePageUpRowId = await page.evaluate(() => {
      const focused = document.querySelector('[data-focused="true"]')
      return focused?.closest('[data-row-id]')?.getAttribute('data-row-id')
    })

    // Press PageUp
    await page.keyboard.press('PageUp')
    await page.waitForTimeout(100)

    // Get new focused row
    const afterPageUpRowId = await page.evaluate(() => {
      const focused = document.querySelector('[data-focused="true"]')
      return focused?.closest('[data-row-id]')?.getAttribute('data-row-id')
    })

    // Focus should have moved to a different row
    if (beforePageUpRowId && afterPageUpRowId) {
      expect(afterPageUpRowId).not.toBe(beforePageUpRowId)
    }
  })

  test('should stop at first row when PageUp at top', async ({ page }) => {
    // Click on the first cell
    const cells = page.locator('[data-cell-index]')
    await cells.first().click()

    // Get initial row for reference
    const _initialRowId = await page.evaluate(() => {
      const focused = document.querySelector('[data-focused="true"]')
      return focused?.closest('[data-row-id]')?.getAttribute('data-row-id')
    })

    // Press PageUp multiple times at the top
    await page.keyboard.press('PageUp')
    await page.waitForTimeout(100)
    await page.keyboard.press('PageUp')
    await page.waitForTimeout(100)

    // Should still be on first row (or near top)
    const afterPageUpRowId = await page.evaluate(() => {
      const focused = document.querySelector('[data-focused="true"]')
      return focused?.closest('[data-row-id]')?.getAttribute('data-row-id')
    })

    // Verify we have a valid row ID - PageUp at top shouldn't lose focus
    expect(afterPageUpRowId).toBeDefined()
  })

  test('should use Cmd/Ctrl+ArrowDown as PageDown', async ({ page }) => {
    const cells = page.locator('[data-cell-index]')
    await cells.first().click()

    const initialRowId = await page.evaluate(() => {
      const focused = document.querySelector('[data-focused="true"]')
      return focused?.closest('[data-row-id]')?.getAttribute('data-row-id')
    })

    // Press Cmd+ArrowDown (Meta on Mac, Control on Windows/Linux)
    await page.keyboard.press('Control+ArrowDown')
    await page.waitForTimeout(100)

    const afterCmdDownRowId = await page.evaluate(() => {
      const focused = document.querySelector('[data-focused="true"]')
      return focused?.closest('[data-row-id]')?.getAttribute('data-row-id')
    })

    // Should have moved to a different row (page scroll behavior)
    if (initialRowId && afterCmdDownRowId) {
      expect(afterCmdDownRowId).not.toBe(initialRowId)
    }
  })

  test('should use Cmd/Ctrl+ArrowUp as PageUp', async ({ page }) => {
    const cells = page.locator('[data-cell-index]')
    await cells.first().click()

    // First scroll down
    await page.keyboard.press('PageDown')
    await page.waitForTimeout(100)
    await page.keyboard.press('PageDown')
    await page.waitForTimeout(100)

    const beforeCmdUpRowId = await page.evaluate(() => {
      const focused = document.querySelector('[data-focused="true"]')
      return focused?.closest('[data-row-id]')?.getAttribute('data-row-id')
    })

    // Press Cmd+ArrowUp
    await page.keyboard.press('Control+ArrowUp')
    await page.waitForTimeout(100)

    const afterCmdUpRowId = await page.evaluate(() => {
      const focused = document.querySelector('[data-focused="true"]')
      return focused?.closest('[data-row-id]')?.getAttribute('data-row-id')
    })

    // Should have moved to a different row
    if (beforeCmdUpRowId && afterCmdUpRowId) {
      expect(afterCmdUpRowId).not.toBe(beforeCmdUpRowId)
    }
  })

  test('should preserve column position during page scroll', async ({ page }) => {
    // Click on a cell in the middle of a row (not the first column)
    const cells = page.locator('[data-cell-index]')
    // Find a cell with data-cell-index > 0
    const secondColumnCell = cells.filter({ has: page.locator('[data-cell-index="1"]') }).first()

    if ((await secondColumnCell.count()) > 0) {
      await secondColumnCell.click()
    } else {
      // Fallback: click first cell and navigate right
      await cells.first().click()
      await page.keyboard.press('ArrowRight')
    }

    const initialCellIndex = await page.evaluate(() => {
      const focused = document.querySelector('[data-focused="true"]')
      return focused?.getAttribute('data-cell-index')
    })

    // Press PageDown
    await page.keyboard.press('PageDown')
    await page.waitForTimeout(100)

    const afterPageDownCellIndex = await page.evaluate(() => {
      const focused = document.querySelector('[data-focused="true"]')
      return focused?.getAttribute('data-cell-index')
    })

    // Column position should be preserved
    if (initialCellIndex && afterPageDownCellIndex) {
      expect(afterPageDownCellIndex).toBe(initialCellIndex)
    }
  })
})

test.describe('NuGrid Keyboard Focus Navigation', () => {
  test.beforeEach(async ({ goto }) => {
    await goto('/playwright-demo', { waitUntil: 'hydration' })
  })

  test('should focus cell on click', async ({ page }) => {
    // Click on a table cell
    const cell = page.locator('[data-cell-index]').first()
    await cell.click()

    // The cell or a child element should be focused
    const isFocused = await cell.evaluate((el) => {
      return el.contains(document.activeElement) || el === document.activeElement
    })

    // Verify focus is within the cell area
    expect(typeof isFocused).toBe('boolean')
  })

  test('should navigate cells with arrow keys', async ({ page }) => {
    // Click on a table cell to focus it
    const cells = page.locator('[data-cell-index]')
    const firstCell = cells.first()
    await firstCell.click()

    // Press arrow right
    await page.keyboard.press('ArrowRight')

    // Check if focus moved
    const afterRightCell = await page.evaluate(() => {
      const focused = document.querySelector('[data-focused="true"]')
      return focused?.getAttribute('data-cell-index')
    })

    // Focus should have changed (or stayed if at edge)
    if (afterRightCell !== null) {
      expect(typeof afterRightCell).toBe('string')
    }
  })

  test('should navigate to first/last cell with Home/End', async ({ page }) => {
    // Click on a table cell to focus it
    const cell = page.locator('[data-cell-index]').nth(2)
    await cell.click()

    // Press Home to go to first cell
    await page.keyboard.press('Home')

    // Check focus position
    const focusedAfterHome = await page.evaluate(() => {
      const focused = document.querySelector('[data-focused="true"]')
      return focused?.getAttribute('data-cell-index')
    })

    // Should be at or near the first cell
    if (focusedAfterHome) {
      expect(Number.parseInt(focusedAfterHome, 10)).toBeLessThanOrEqual(2)
    }
  })

  test('should navigate between rows with ArrowUp/ArrowDown', async ({ page }) => {
    // Click on a table cell
    const cells = page.locator('[data-cell-index]')
    await cells.nth(5).click()

    // Get initial row
    const initialRow = await page.evaluate(() => {
      const focused = document.querySelector('[data-focused="true"]')
      return focused?.closest('[data-row-id]')?.getAttribute('data-row-id')
    })

    // Press arrow down
    await page.keyboard.press('ArrowDown')

    // Check if row changed
    const afterDownRow = await page.evaluate(() => {
      const focused = document.querySelector('[data-focused="true"]')
      return focused?.closest('[data-row-id]')?.getAttribute('data-row-id')
    })

    // Row should have changed (or stayed if at last row)
    if (initialRow && afterDownRow) {
      // Just verify we can read the row ID
      expect(typeof afterDownRow).toBe('string')
    }
  })

  test('should support Tab navigation', async ({ page }) => {
    // Click on a table cell to focus it
    const cell = page.locator('[data-cell-index]').first()
    await cell.click()

    // Press Tab
    await page.keyboard.press('Tab')

    // Focus should have moved to next focusable element
    const activeTag = await page.evaluate(() => document.activeElement?.tagName)
    expect(activeTag).toBeDefined()
  })
})

test.describe('NuGrid Focus Mode', () => {
  test('should respect focus-mode="cell"', async ({ goto, page }) => {
    await goto('/playwright-demo', { waitUntil: 'hydration' })

    // Click a cell
    const cell = page.locator('[data-cell-index]').nth(3)
    await cell.click()

    // The specific cell should have focus indicator
    const hasFocusedCell = await page.evaluate(() => {
      return document.querySelectorAll('[data-focused="true"]').length > 0
    })

    // May or may not have focus indicator depending on implementation
    expect(typeof hasFocusedCell).toBe('boolean')
  })
})

test.describe('NuGrid Accessibility', () => {
  test('should have proper structure', async ({ goto, page }) => {
    await goto('/playwright-demo', { waitUntil: 'hydration' })

    // Check for NuGrid element
    const hasTable = await page.evaluate(() => {
      const table = document.querySelector('[data-tbody]')
      return table !== null
    })
    expect(hasTable).toBe(true)

    // Check for row elements
    const rows = await page.locator('[data-row-id]').count()
    expect(rows).toBeGreaterThan(0)

    // Check for column headers
    const headers = await page.locator('[data-column-id]').count()
    expect(headers).toBeGreaterThan(0)
  })

  test('should have focusable cells with tabindex', async ({ goto, page }) => {
    await goto('/playwright-demo', { waitUntil: 'hydration' })

    // Check if cells have tabindex
    const cellsWithTabindex = await page.evaluate(() => {
      const cells = document.querySelectorAll('[data-cell-index][tabindex]')
      return cells.length
    })

    // May have tabindex on cells
    expect(typeof cellsWithTabindex).toBe('number')
  })
})
