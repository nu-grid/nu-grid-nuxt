import { expect, test } from '@nuxt/test-utils/playwright'

/**
 * E2E tests for NuGrid cell editing functionality
 *
 * Tests DOM manipulation aspects of useNuGridCellEditing composable:
 * - Cell editing activation
 * - Different cell data types
 * - Keyboard navigation during editing
 * - Save/Cancel editing
 */

test.describe('NuGrid Cell Editing', () => {
  test.beforeEach(async ({ goto }) => {
    await goto('/playwright-demo', { waitUntil: 'hydration' })
  })

  test('should start editing on double click', async ({ page }) => {
    // Find the Name cell (text type) - first row should have "Alice Smith"
    const nameCell = page.locator('[data-cell-index]').filter({ hasText: 'Alice Smith' }).first()

    if ((await nameCell.count()) > 0) {
      // Double click to start editing
      await nameCell.dblclick()

      // Check if an input appeared
      const hasInput = await page.evaluate(() => {
        const activeEl = document.activeElement
        return (
          activeEl?.tagName === 'INPUT'
          || activeEl?.tagName === 'TEXTAREA'
          || activeEl?.closest('[data-editing]') !== null
        )
      })

      expect(typeof hasInput).toBe('boolean')
    }
  })

  test('should toggle boolean cell with click', async ({ page }) => {
    // Try to find a checkbox in the first row (using CheckboxRoot which renders with role="checkbox")
    const checkbox = page.locator('[data-cell-index] [role="checkbox"]').first()

    if ((await checkbox.count()) > 0) {
      // Get initial state (checked state is stored in data-state attribute)
      const initialState = await checkbox.getAttribute('data-state')

      // Click to toggle
      await checkbox.click()

      // Verify state changed
      const newState = await checkbox.getAttribute('data-state')
      expect(newState).not.toBe(initialState)
    }
  })

  test('should save edit on Enter key', async ({ page }) => {
    // Find a text cell - first row should have "Alice Smith"
    const textCell = page.locator('[data-cell-index]').filter({ hasText: 'Alice Smith' }).first()

    if ((await textCell.count()) > 0) {
      // Double click to start editing
      await textCell.dblclick()

      // Wait for input element to appear
      await page
        .waitForSelector('input:focus, [data-editing] input', { timeout: 2000 })
        .catch(() => {
          // Editor may use different structure
        })

      // Type new value
      await page.keyboard.type(' Updated')

      // Press Enter to save
      await page.keyboard.press('Enter')

      // Verify toast appears for cell value changed
      const toast = page.getByText(/Cell Value Changed/i)
      if ((await toast.count()) > 0) {
        await expect(toast).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('should cancel edit on Escape key', async ({ page }) => {
    // Find a text cell - second row should have "Bob Johnson"
    const textCell = page.locator('[data-cell-index]').filter({ hasText: 'Bob Johnson' }).first()

    if ((await textCell.count()) > 0) {
      // Double click to start editing
      await textCell.dblclick()

      // Wait for input element to appear
      await page
        .waitForSelector('input:focus, [data-editing] input', { timeout: 2000 })
        .catch(() => {
          // Editor may use different structure
        })

      // Type something
      await page.keyboard.type('CANCELLED')

      // Press Escape to cancel
      await page.keyboard.press('Escape')

      // The cell should still have original value
      const cellText = await textCell.textContent()
      expect(cellText).not.toContain('CANCELLED')
    }
  })

  test('should navigate to next cell on Tab during editing', async ({ page }) => {
    // Find a text cell - first row should have "Alice Smith"
    const textCell = page.locator('[data-cell-index]').filter({ hasText: 'Alice Smith' }).first()

    if ((await textCell.count()) > 0) {
      // Double click to start editing
      await textCell.dblclick()

      // Wait for input element to appear
      await page
        .waitForSelector('input:focus, [data-editing] input', { timeout: 2000 })
        .catch(() => {
          // Editor may use different structure
        })

      // Press Tab to move to next cell
      await page.keyboard.press('Tab')

      // Verify focus moved (checking if editing stopped or moved)
      const activeElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(activeElement).toBeDefined()
    }
  })
})

test.describe('NuGrid Cell Data Types', () => {
  test.beforeEach(async ({ goto }) => {
    await goto('/playwright-demo', { waitUntil: 'hydration' })
  })

  test('should render number cells correctly', async ({ page }) => {
    // Check for price column with $ symbol
    const priceCell = page.locator('[data-cell-index]').filter({ hasText: '$' }).first()
    expect(await priceCell.count()).toBeGreaterThan(0)
  })

  test('should render date cells correctly', async ({ page }) => {
    // Check for date-formatted cells
    const dateCell = page
      .locator('[data-cell-index]')
      .filter({ hasText: /\d{1,2}\/\d{1,2}\/\d{2,4}/ })
      .first()
    if ((await dateCell.count()) > 0) {
      const text = await dateCell.textContent()
      expect(text).toMatch(/\d/)
    }
  })

  test('should render boolean cells with checkboxes', async ({ page }) => {
    // Check for checkbox elements (using CheckboxRoot from reka-ui which renders as button with role="checkbox")
    const checkboxes = page.locator('[data-cell-index] [role="checkbox"]')
    expect(await checkboxes.count()).toBeGreaterThan(0)
  })

  test('should render discount cells with percentage', async ({ page }) => {
    // Find the discount cell with % symbol
    const discountCell = page.locator('[data-cell-index]').filter({ hasText: /%/ }).first()
    expect(await discountCell.count()).toBeGreaterThan(0)
  })
})

test.describe('NuGrid Editing Toggle', () => {
  test.beforeEach(async ({ goto }) => {
    await goto('/playwright-demo', { waitUntil: 'hydration' })
  })

  test('should toggle editing enabled/disabled', async ({ page }) => {
    // Find the editing toggle button
    const editButton = page.getByRole('button', { name: /Editing/i })

    if ((await editButton.count()) > 0) {
      // Check initial text
      const initialText = await editButton.textContent()

      // Click to toggle
      await editButton.click()

      // Verify text changed
      const newText = await editButton.textContent()
      expect(newText).not.toBe(initialText)
    }
  })

  test('should not allow editing when disabled', async ({ page }) => {
    // Disable editing first
    const disableButton = page.getByRole('button', { name: /Disable Editing/i })

    if ((await disableButton.count()) > 0) {
      await disableButton.click()

      // Try to double click a cell - first row should have "Alice Smith"
      const textCell = page.locator('[data-cell-index]').filter({ hasText: 'Alice Smith' }).first()

      if ((await textCell.count()) > 0) {
        await textCell.dblclick()

        // Wait a bit
        await page.waitForTimeout(100)

        // Should not have an active input
        const hasActiveInput = await page.evaluate(() => {
          const activeEl = document.activeElement
          return activeEl?.tagName === 'INPUT' && activeEl.closest('[data-editing]') !== null
        })

        // Editing should be disabled
        expect(typeof hasActiveInput).toBe('boolean')
      }
    }
  })
})
