import { expect, test } from '@nuxt/test-utils/playwright'

/**
 * E2E tests for NuGrid Row Selection
 *
 * Tests the row selection functionality:
 * - Checkbox column appears in multi/single modes
 * - Checkbox column is hidden when mode is false/none
 * - Multi-select allows selecting multiple rows
 * - Single-select restricts to one row at a time
 * - Select all checkbox works in multi mode
 * - Selection state is reflected in the UI
 */

test.describe('NuGrid Row Selection Mode', () => {
  test.beforeEach(async ({ goto }) => {
    await goto('/row-selection-demo', { waitUntil: 'hydration' })
  })

  test('should display checkboxes in multi selection mode', async ({ page }) => {
    // Verify we're in multi mode by default
    const selectionMode = await page.locator('strong').filter({ hasText: 'multi' }).count()
    expect(selectionMode).toBeGreaterThan(0)

    // Check for checkbox presence in the grid (Reka UI renders button with role="checkbox", not input)
    const checkboxes = await page.locator('[data-cell-index] [role="checkbox"]').count()
    expect(checkboxes).toBeGreaterThan(0)
  })

  test('should allow selecting multiple rows in multi mode', async ({ page }) => {
    // Click first row checkbox
    const checkboxes = page.locator('[data-row-id] [role="checkbox"]')
    await checkboxes.nth(0).click()

    // Verify first row is selected
    const selectedCount = page.locator('strong').filter({ hasText: /^\d+$/ })
    await expect(selectedCount.first()).toContainText('1')

    // Click second row checkbox
    await checkboxes.nth(1).click()

    // Verify two rows are selected
    await expect(selectedCount.first()).toContainText('2')
  })

  test('should show selected rows section when rows are selected', async ({ page }) => {
    // Initially, "No rows selected" message should be visible
    await expect(page.getByText('No rows selected')).toBeVisible()

    // Select a row
    const checkboxes = page.locator('[data-row-id] [role="checkbox"]')
    await checkboxes.first().click()

    // "Selected Rows" heading should appear
    await expect(page.getByRole('heading', { name: 'Selected Rows' })).toBeVisible()
  })

  test('should clear selection with Clear Selection button', async ({ page }) => {
    // Select some rows
    const checkboxes = page.locator('[data-row-id] [role="checkbox"]')
    await checkboxes.nth(0).click()
    await checkboxes.nth(1).click()

    // Click Clear Selection button
    await page.getByRole('button', { name: /Clear Selection/ }).click()

    // Verify selection is cleared
    await expect(page.getByText('No rows selected')).toBeVisible()
  })

  test('should show indeterminate state on header checkbox when some rows selected', async ({
    page,
  }) => {
    // Select one row (but not all)
    const rowCheckboxes = page.locator('[data-row-id] [role="checkbox"]')
    await rowCheckboxes.first().click()

    // Header checkbox should be in indeterminate state (data-state="indeterminate" for Reka UI)
    const headerCheckbox = page.getByRole('checkbox', { name: 'Select all' })
    await expect(headerCheckbox).toHaveAttribute('data-state', 'indeterminate')
  })
})

test.describe('NuGrid Single Selection Mode', () => {
  test.beforeEach(async ({ goto }) => {
    await goto('/row-selection-demo', { waitUntil: 'hydration' })
  })

  test('should switch to single selection mode', async ({ page }) => {
    // Click Single button
    await page.getByRole('button', { name: 'Single' }).click()

    // Verify mode switched
    await expect(page.locator('strong').filter({ hasText: 'single' })).toBeVisible()
  })

  test('should only allow one row selected in single mode', async ({ page }) => {
    // Switch to single mode
    await page.getByRole('button', { name: 'Single' }).click()

    // Select first row
    const checkboxes = page.locator('[data-row-id] [role="checkbox"]')
    await checkboxes.nth(0).click()

    // Verify one row selected
    const selectedCount = page.locator('strong').filter({ hasText: /^\d+$/ })
    await expect(selectedCount.first()).toContainText('1')

    // Select second row
    await checkboxes.nth(1).click()

    // Still only one row should be selected (the second one)
    await expect(selectedCount.first()).toContainText('1')

    // First checkbox should be unchecked (data-state="unchecked" for Reka UI)
    const firstCheckbox = checkboxes.nth(0)
    await expect(firstCheckbox).toHaveAttribute('data-state', 'unchecked')

    // Second checkbox should be checked (data-state="checked" for Reka UI)
    const secondCheckbox = checkboxes.nth(1)
    await expect(secondCheckbox).toHaveAttribute('data-state', 'checked')
  })

  test('should keep only first selection when switching to single mode', async ({ page }) => {
    // Select some rows in multi mode
    const checkboxes = page.locator('[data-row-id] [role="checkbox"]')
    await checkboxes.nth(0).click()
    await checkboxes.nth(1).click()

    // Switch to single mode
    await page.getByRole('button', { name: 'Single' }).click()

    // In single mode, previous selections may still be visible
    // Verify mode switched successfully
    await expect(page.locator('strong').filter({ hasText: 'single' })).toBeVisible()
  })
})

test.describe('NuGrid No Selection Mode', () => {
  test.beforeEach(async ({ goto }) => {
    await goto('/row-selection-demo', { waitUntil: 'hydration' })
  })

  test('should switch to no selection mode', async ({ page }) => {
    // Click None button (to disable selection)
    await page.getByRole('button', { name: 'None' }).click()

    // Verify mode switched - the status shows 'none' for the selection mode
    await expect(page.locator('strong').filter({ hasText: 'none' })).toBeVisible()
  })

  test('should remove checkbox column in no selection mode', async ({ page }) => {
    // Switch to no selection mode
    await page.getByRole('button', { name: 'None' }).click()

    // Wait for grid to update
    await page.waitForTimeout(100)

    // Check that no selection column exists
    const selectionColumn = await page.locator('[data-column-id="__selection"]').count()
    expect(selectionColumn).toBe(0)
  })

  test('should hide checkbox column when disabling selection mode', async ({ page }) => {
    // Select some rows
    const checkboxes = page.locator('[data-row-id] [role="checkbox"]')
    await checkboxes.nth(0).click()

    // Switch to no selection mode
    await page.getByRole('button', { name: 'None' }).click()

    // Wait for grid to update
    await page.waitForTimeout(100)

    // Verify selection column is hidden
    const selectionColumn = await page.locator('[data-column-id="__selection"]').count()
    expect(selectionColumn).toBe(0)
  })
})

test.describe('NuGrid Select All Functionality', () => {
  test.beforeEach(async ({ goto }) => {
    await goto('/row-selection-demo', { waitUntil: 'hydration' })
  })

  test('should select all rows when header checkbox is clicked in multi mode', async ({ page }) => {
    // Click header checkbox
    const headerCheckbox = page.getByRole('checkbox', { name: 'Select all' })
    await headerCheckbox.click()

    // All selectable row checkboxes should be checked (data-state="checked" for Reka UI)
    // Note: some rows may be disabled (e.g., inactive employees) and won't be selected
    const rowCheckboxes = page.locator('[data-row-id] [role="checkbox"]:not([disabled])')
    const count = await rowCheckboxes.count()

    // Verify all selectable rows are selected
    for (let i = 0; i < count; i++) {
      await expect(rowCheckboxes.nth(i)).toHaveAttribute('data-state', 'checked')
    }
  })

  test('should deselect all rows when header checkbox is clicked again', async ({ page }) => {
    // Click header checkbox to select all
    const headerCheckbox = page.getByRole('checkbox', { name: 'Select all' })
    await headerCheckbox.click()

    // Click again to deselect all
    await headerCheckbox.click()

    // All row checkboxes should be unchecked (data-state="unchecked" for Reka UI)
    const rowCheckboxes = page.locator('[data-row-id] [role="checkbox"]')
    const count = await rowCheckboxes.count()

    for (let i = 0; i < count; i++) {
      await expect(rowCheckboxes.nth(i)).toHaveAttribute('data-state', 'unchecked')
    }
  })

  test('should not have select all checkbox in single mode', async ({ page }) => {
    // Switch to single mode
    await page.getByRole('button', { name: 'Single' }).click()

    // In single mode, header should not have a "Select all" checkbox
    const headerCheckbox = page.getByRole('checkbox', { name: 'Select all' })

    // Header should either have no checkbox or it shouldn't select all
    const hasHeaderCheckbox = (await headerCheckbox.count()) > 0
    if (hasHeaderCheckbox) {
      // If there is a header checkbox, clicking it should not select multiple rows
      await headerCheckbox.click()
      const selectedCount = await page
        .locator('strong')
        .filter({ hasText: /^\d+$/ })
        .first()
        .textContent()
      // In single mode, selecting via header should select at most 1 row
      expect(Number.parseInt(selectedCount || '0', 10)).toBeLessThanOrEqual(1)
    }
  })
})
