import { expect, test } from '@nuxt/test-utils/playwright'

/**
 * NuGrid Performance E2E Benchmarks
 *
 * Measures real-world performance of NuGrid operations in a browser
 * with full Vue reactivity and DOM rendering.
 *
 * Run with: pnpm test:e2e -- e2e/performance.spec.ts
 *
 * Compare results before and after TanStack removal:
 *   1. Run on main (TanStack): pnpm test:e2e -- e2e/performance.spec.ts
 *   2. Switch to optimized branch and run again
 *   3. Compare timing outputs
 */

interface PerfResult {
  name: string
  ms: number
}

// Helper: run a perf API method and return the timing
async function runPerf(page: any, method: string, ...args: any[]): Promise<number> {
  return page.evaluate(
    ({ method, args }: { method: string; args: any[] }) => {
      return (window as any).__PERF__[method](...args)
    },
    { method, args },
  )
}

// Helper: get all results from the perf API
async function getResults(page: any): Promise<PerfResult[]> {
  return page.evaluate(() => (window as any).__PERF__.getResults())
}

// Helper: run the full benchmark suite
async function runSuite(page: any, rowCount: number): Promise<PerfResult[]> {
  return page.evaluate(
    (count: number) => (window as any).__PERF__.runSuite(count),
    rowCount,
  )
}

// Helper: format results as a table
function formatResults(results: PerfResult[], label: string) {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  ${label}`)
  console.log(`${'═'.repeat(60)}`)
  const maxName = Math.max(...results.map(r => r.name.length))
  for (const r of results) {
    const indicator = r.ms > 100 ? '🔴' : r.ms > 16 ? '🟡' : '🟢'
    console.log(`  ${indicator} ${r.name.padEnd(maxName + 2)} ${String(r.ms).padStart(8)}ms`)
  }
  const total = results.reduce((sum, r) => sum + r.ms, 0)
  console.log(`${'─'.repeat(60)}`)
  console.log(`  TOTAL${' '.repeat(maxName - 3)} ${String(Math.round(total * 100) / 100).padStart(8)}ms`)
  console.log(`${'═'.repeat(60)}\n`)
}

test.describe('NuGrid Performance Benchmarks', () => {
  test.beforeEach(async ({ goto }) => {
    await goto('/perf-benchmark', { waitUntil: 'hydration' })
  })

  // ── Full Suite ──────────────────────────────────────────────

  test('full suite: 1K rows', async ({ page }) => {
    const results = await runSuite(page, 1000)
    formatResults(results, 'Full Suite — 1,000 rows')
    expect(results.length).toBeGreaterThan(0)
    // Sanity: load should complete in under 2 seconds
    const loadResult = results.find(r => r.name.includes('load'))
    expect(loadResult?.ms).toBeLessThan(2000)
  })

  test('full suite: 5K rows', async ({ page }) => {
    const results = await runSuite(page, 5000)
    formatResults(results, 'Full Suite — 5,000 rows')
    expect(results.length).toBeGreaterThan(0)
    const loadResult = results.find(r => r.name.includes('load'))
    expect(loadResult?.ms).toBeLessThan(5000)
  })

  test('full suite: 10K rows', async ({ page }) => {
    const results = await runSuite(page, 10000)
    formatResults(results, 'Full Suite — 10,000 rows')
    expect(results.length).toBeGreaterThan(0)
    const loadResult = results.find(r => r.name.includes('load'))
    expect(loadResult?.ms).toBeLessThan(10000)
  })

  // ── Individual Operations (for focused comparison) ─────────

  test('initial render: 1K rows', async ({ page }) => {
    const ms = await runPerf(page, 'loadData', 1000)
    console.log(`  Initial render 1K: ${ms}ms`)
    expect(ms).toBeLessThan(2000)
  })

  test('initial render: 5K rows', async ({ page }) => {
    const ms = await runPerf(page, 'loadData', 5000)
    console.log(`  Initial render 5K: ${ms}ms`)
    expect(ms).toBeLessThan(5000)
  })

  test('initial render: 10K rows', async ({ page }) => {
    const ms = await runPerf(page, 'loadData', 10000)
    console.log(`  Initial render 10K: ${ms}ms`)
    expect(ms).toBeLessThan(10000)
  })

  test('cell edit: single cell in 10K grid', async ({ page }) => {
    await runPerf(page, 'loadData', 10000)
    // Settle
    await page.waitForTimeout(200)
    const ms = await runPerf(page, 'editCell', 5000)
    console.log(`  Single cell edit in 10K grid: ${ms}ms`)
    expect(ms).toBeLessThan(500)
  })

  test('batch edit: 100 cells in 10K grid', async ({ page }) => {
    await runPerf(page, 'loadData', 10000)
    await page.waitForTimeout(200)
    const ms = await runPerf(page, 'batchEdit', 100)
    console.log(`  Batch edit 100 cells in 10K grid: ${ms}ms`)
    expect(ms).toBeLessThan(1000)
  })

  test('sort: 10K rows by name', async ({ page }) => {
    await runPerf(page, 'loadData', 10000)
    await page.waitForTimeout(200)
    const ms = await runPerf(page, 'toggleSort', 'name')
    console.log(`  Sort 10K rows by name: ${ms}ms`)
    expect(ms).toBeLessThan(2000)
  })

  test('select: 1000 rows in 10K grid', async ({ page }) => {
    await runPerf(page, 'loadData', 10000)
    await page.waitForTimeout(200)
    const ms = await runPerf(page, 'selectRows', 1000)
    console.log(`  Select 1000 rows in 10K grid: ${ms}ms`)
    expect(ms).toBeLessThan(1000)
  })

  test('replace: full data replacement 10K rows', async ({ page }) => {
    await runPerf(page, 'loadData', 10000)
    await page.waitForTimeout(200)
    const ms = await runPerf(page, 'replaceData')
    console.log(`  Full data replace 10K: ${ms}ms`)
    expect(ms).toBeLessThan(5000)
  })

  // ── Scroll performance (FPS) ───────────────────────────────

  test('scroll performance: 10K rows virtualized', async ({ page }) => {
    await runPerf(page, 'loadData', 10000)
    await page.waitForTimeout(500)

    // Measure scroll performance by scrolling down in chunks
    const scrollTiming = await page.evaluate(async () => {
      // Find the NuGrid scroll container — it's the element with overflow: auto
      const allDivs = document.querySelectorAll('div')
      let gridEl: Element | null = null
      for (const div of allDivs) {
        const style = getComputedStyle(div)
        if ((style.overflow === 'auto' || style.overflowY === 'auto')
          && div.scrollHeight > div.clientHeight
          && div.clientHeight > 100) {
          gridEl = div
          break
        }
      }

      if (!gridEl) return { totalMs: 0, avgFrameMs: 0, maxFrameMs: 0, estimatedFps: 0, frameCount: 0, error: 'no scroll container' }

      const frames: number[] = []
      let lastTime = performance.now()

      // Measure frame times during scroll
      const measureFrame = () => {
        const now = performance.now()
        frames.push(now - lastTime)
        lastTime = now
      }

      // Scroll down in increments
      const scrollSteps = 20
      const scrollDistance = 500
      const start = performance.now()

      for (let i = 0; i < scrollSteps; i++) {
        gridEl.scrollTop += scrollDistance
        measureFrame()
        // Wait for next frame
        await new Promise(r => requestAnimationFrame(r))
      }

      const totalMs = performance.now() - start
      const avgFrameMs = frames.length > 0
        ? frames.reduce((a, b) => a + b, 0) / frames.length
        : 0
      const maxFrameMs = frames.length > 0 ? Math.max(...frames) : 0
      const estimatedFps = avgFrameMs > 0 ? Math.round(1000 / avgFrameMs) : 0

      return {
        totalMs: Math.round(totalMs * 100) / 100,
        avgFrameMs: Math.round(avgFrameMs * 100) / 100,
        maxFrameMs: Math.round(maxFrameMs * 100) / 100,
        estimatedFps,
        frameCount: frames.length,
      }
    })

    console.log('  Scroll performance (10K rows):')
    console.log(`    Total scroll time: ${(scrollTiming as any).totalMs}ms`)
    console.log(`    Avg frame time: ${(scrollTiming as any).avgFrameMs}ms`)
    console.log(`    Max frame time: ${(scrollTiming as any).maxFrameMs}ms`)
    console.log(`    Estimated FPS: ${(scrollTiming as any).estimatedFps}`)
    console.log(`    Frames measured: ${(scrollTiming as any).frameCount}`)

    // Scroll should not be terribly slow
    expect((scrollTiming as any).totalMs).toBeLessThan(5000)
  })

  // ── Memory snapshot ────────────────────────────────────────

  test('memory: 10K row grid', async ({ page }) => {
    // Take baseline measurement
    const baselineMemory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        }
      }
      return null
    })

    // Load 10K rows
    await runPerf(page, 'loadData', 10000)
    await page.waitForTimeout(500)

    const loadedMemory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        }
      }
      return null
    })

    if (baselineMemory && loadedMemory) {
      const deltaBytes = loadedMemory.usedJSHeapSize - baselineMemory.usedJSHeapSize
      const deltaMB = Math.round(deltaBytes / 1024 / 1024 * 100) / 100
      console.log(`  Memory delta for 10K rows: ${deltaMB}MB`)
      console.log(`    Baseline: ${Math.round(baselineMemory.usedJSHeapSize / 1024 / 1024)}MB`)
      console.log(`    After load: ${Math.round(loadedMemory.usedJSHeapSize / 1024 / 1024)}MB`)
    }
    else {
      console.log('  Memory API not available (non-Chromium or flag not set)')
    }

    // Just ensure the grid loaded
    expect(await getResults(page)).toHaveLength(1)
  })

  // ── Repeated operations (stress test) ──────────────────────

  test('stress: 50 consecutive cell edits in 5K grid', async ({ page }) => {
    await runPerf(page, 'loadData', 5000)
    await page.waitForTimeout(200)

    const totalMs = await page.evaluate(async () => {
      const perf = (window as any).__PERF__
      const start = performance.now()
      for (let i = 0; i < 50; i++) {
        await perf.editCell(i * 100)
      }
      return performance.now() - start
    })

    console.log(`  50 consecutive edits in 5K grid: ${Math.round(totalMs)}ms`)
    console.log(`  Average per edit: ${Math.round(totalMs / 50)}ms`)
    expect(totalMs).toBeLessThan(10000)
  })
})
