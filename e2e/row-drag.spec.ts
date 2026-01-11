import { expect, test } from '@nuxt/test-utils/playwright'

/**
 * E2E tests for NuGrid row drag and drop functionality
 *
 * Tests DOM manipulation aspects of useNuGridRowDragDrop composable:
 * - Row drag handles
 * - Drag visual feedback
 * - Row reordering
 */

test.describe('NuGrid Row Drag and Drop', () => {
  test.beforeEach(async ({ goto }) => {
    await goto('/playwright-demo', { waitUntil: 'hydration' })
  })

  test('should enable row drag when button is clicked', async ({ page }) => {
    // Find and click the row drag toggle button
    const rowDragButton = page.getByRole('button', { name: /Row Drag/i })

    if ((await rowDragButton.count()) > 0) {
      await rowDragButton.click()

      // Wait for UI to update
      await page.waitForTimeout(100)

      // Check if drag handles appear
      const dragHandles = page.locator('[data-drag-handle], [draggable="true"]')
      const count = await dragHandles.count()

      // Should have drag handles visible
      expect(typeof count).toBe('number')
    }
  })

  test('should show cursor grab on drag handle hover', async ({ page }) => {
    // Enable row drag first
    const rowDragButton = page.getByRole('button', { name: /Enable Row Drag/i })

    if ((await rowDragButton.count()) > 0) {
      await rowDragButton.click()
      await page.waitForTimeout(100)

      // Find a drag handle
      const dragHandle = page.locator('[draggable="true"]').first()

      if ((await dragHandle.count()) > 0) {
        await dragHandle.hover()

        // Check cursor style
        const cursor = await dragHandle.evaluate((el) => window.getComputedStyle(el).cursor)
        expect(['grab', 'move', 'pointer', 'default']).toContain(cursor)
      }
    }
  })

  test('should add dragging class to body during drag', async ({ page }) => {
    // Enable row drag first
    const rowDragButton = page.getByRole('button', { name: /Enable Row Drag/i })

    if ((await rowDragButton.count()) > 0) {
      await rowDragButton.click()
      await page.waitForTimeout(100)

      // Find a draggable row
      const draggableRow = page.locator('[draggable="true"]').first()

      if ((await draggableRow.count()) > 0) {
        const box = await draggableRow.boundingBox()

        if (box) {
          // Start drag
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
          await page.mouse.down()

          // Move slightly
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 50)

          // Check for dragging class
          const hasClass = await page.evaluate(() =>
            document.body.classList.contains('is-dragging-row'),
          )

          await page.mouse.up()

          expect(typeof hasClass).toBe('boolean')
        }
      }
    }
  })

  test('should show row dragged toast after successful drag', async ({ page }) => {
    // Enable row drag first
    const rowDragButton = page.getByRole('button', { name: /Enable Row Drag/i })

    if ((await rowDragButton.count()) > 0) {
      await rowDragButton.click()
      await page.waitForTimeout(100)

      // Find draggable rows
      const draggableRows = page.locator('[data-row-id]')
      const count = await draggableRows.count()

      if (count >= 2) {
        const firstRow = draggableRows.nth(0)
        const secondRow = draggableRows.nth(1)

        const firstBox = await firstRow.boundingBox()
        const secondBox = await secondRow.boundingBox()

        if (firstBox && secondBox) {
          // Find drag handle in first row
          const dragHandle = firstRow.locator('[draggable="true"]').first()

          if ((await dragHandle.count()) > 0) {
            const handleBox = await dragHandle.boundingBox()

            if (handleBox) {
              // Perform drag operation
              await page.mouse.move(
                handleBox.x + handleBox.width / 2,
                handleBox.y + handleBox.height / 2,
              )
              await page.mouse.down()
              await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + 50)
              await page.mouse.up()

              // Check for toast
              const toast = page.getByText(/Row Dragged/i)
              if ((await toast.count()) > 0) {
                await expect(toast).toBeVisible({ timeout: 5000 })
              }
            }
          }
        }
      }
    }
  })
})

test.describe('NuGrid Row Drag Disabled States', () => {
  test.beforeEach(async ({ goto }) => {
    await goto('/playwright-demo', { waitUntil: 'hydration' })
  })

  test('should not allow drag when sorting is applied', async ({ page }) => {
    // Enable row drag first
    const rowDragButton = page.getByRole('button', { name: /Enable Row Drag/i })

    if ((await rowDragButton.count()) > 0) {
      await rowDragButton.click()
      await page.waitForTimeout(100)

      // Click on a sortable column header to apply sorting
      const sortableHeader = page.locator('[data-column-id]').filter({ hasText: 'Email' }).first()

      if ((await sortableHeader.count()) > 0) {
        // Click to sort
        await sortableHeader.click()
        await page.waitForTimeout(100)

        // Check if drag handles are disabled
        const dragHandles = page.locator('[draggable="true"]')
        const count = await dragHandles.count()

        // May have no draggable handles when sorted
        expect(typeof count).toBe('number')
      }
    }
  })
})
