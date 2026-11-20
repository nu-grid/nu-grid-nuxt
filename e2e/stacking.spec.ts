import type { Page } from '@playwright/test'

import { expect, test } from '@nuxt/test-utils/playwright'

/**
 * E2E tests for NuGrid's stacking context
 *
 * The grid's root is `isolate`, so its internal layers (sticky column header z-20,
 * sticky group header z-30, group labels z-50, header controls and pinned cells z-10)
 * are scoped to the grid and never paint over the host page's own chrome.
 *
 * - A page-level `sticky top-0 z-10` header stays on top when the page scrolls a grid under it
 * - Inside the grid, sticky column and group headers still stick at the grid's own top
 */

// The compact theme has no splitGroupGap slot, so splitgroup mode does not render with it yet
const cases = [
  { theme: 'default', mode: 'div' },
  { theme: 'default', mode: 'group' },
  { theme: 'default', mode: 'splitgroup' },
  { theme: 'compact', mode: 'div' },
  { theme: 'compact', mode: 'group' },
] as const

async function openDemo(
  goto: (url: string, options: any) => Promise<unknown>,
  page: Page,
  theme: string,
  mode: string,
) {
  await goto(`/stacking-demo?theme=${theme}&mode=${mode}`, { waitUntil: 'hydration' })
  await expect(page.locator('[data-row-id]').first()).toBeVisible()
}

for (const { theme, mode } of cases) {
  test.describe(`NuGrid stacking (${theme} theme, ${mode} mode)`, () => {
    test('page sticky header stays above the grid when the page scrolls', async ({
      goto,
      page,
    }) => {
      await openDemo(goto, page, theme, mode)

      // Scroll the page so the top of the grid (its column header and first group) sits under
      // the lower part of the page header, which is 64px tall
      const gridTop = await page
        .getByTestId('grid-container')
        .evaluate((el) => el.getBoundingClientRect().top + window.scrollY)
      await page.evaluate((y) => window.scrollTo(0, y), gridTop - 32)

      const hits = await page.evaluate(() => {
        const header = document.querySelector('[data-testid="page-header"]')!
        const grid = document.querySelector('[data-testid="grid-container"]')!
        const h = header.getBoundingClientRect()
        const g = grid.getBoundingClientRect()
        const results: { x: number; y: number; inHeader: boolean }[] = []
        // Sample the band of the header the grid's top edge passes under
        for (let y = Math.max(g.top, h.top) + 2; y < h.bottom; y += 6) {
          for (let x = g.left + 10; x < Math.min(g.right, h.right) - 5; x += 60) {
            const el = document.elementFromPoint(x, y)
            results.push({ x, y, inHeader: !!el && header.contains(el) })
          }
        }
        return { overlaps: g.top < h.bottom, results }
      })

      // The grid really is under the header at these points
      expect(hits.overlaps).toBe(true)
      expect(hits.results.length).toBeGreaterThan(10)
      expect(hits.results.filter((r) => !r.inHeader)).toEqual([])
    })

    test('in-grid sticky headers stick at the grid top when the grid scrolls', async ({
      goto,
      page,
    }) => {
      // Unrelated to stacking: splitgroup's sticky group header is wrapped with only its own
      // column headers, not the group's rows, so it has nowhere to stick as the grid scrolls
      test.fixme(mode === 'splitgroup', 'splitgroup group headers do not stick past their wrapper')
      await openDemo(goto, page, theme, mode)

      const result = await page.evaluate(async () => {
        // The grid's root is its scroll container
        const root = [
          ...document.querySelectorAll<HTMLElement>('[data-testid="grid-container"] *'),
        ].find((el) => el.scrollHeight > el.clientHeight + 100)!
        root.scrollTop = 600
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        const r = root.getBoundingClientRect()
        const el = document.elementFromPoint(r.left + 40, r.top + 4)
        // The topmost thing at the grid's top edge must be inside a top-stuck element
        let stuck: Element | null = null
        for (let n: Element | null = el; n && n !== root; n = n.parentElement) {
          const s = getComputedStyle(n)
          if (s.position === 'sticky' && s.top !== 'auto') {
            stuck = n
            break
          }
        }
        return {
          scrollTop: root.scrollTop,
          stuckAtTop: !!stuck && Math.abs(stuck.getBoundingClientRect().top - r.top) <= 2,
          hitRow: !!el?.closest('[data-row-id]'),
        }
      })

      expect(result.scrollTop).toBeGreaterThan(0)
      expect(result.hitRow).toBe(false)
      expect(result.stuckAtTop).toBe(true)
    })
  })
}
