import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useNuGridWheelSmoothing } from '../src/runtime/composables/_internal/useNuGridWheelSmoothing'

describe('useNuGridWheelSmoothing', () => {
  let container: HTMLElement
  // Every position the composable moved to, and the step each move represents.
  let moves: { top: number; left: number }[]
  let steps: number[]
  let scrollToSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    container = document.createElement('div')
    // Real position state: happy-dom neither lays out nor clamps, so model a 20000px tall list in
    // a 500px viewport and let scrollTop/scrollLeft be plain fields the tests can also move.
    let top = 0
    let left = 0
    Object.defineProperty(container, 'scrollTop', {
      get: () => top,
      set: (v: number) => (top = v),
      configurable: true,
    })
    Object.defineProperty(container, 'scrollLeft', {
      get: () => left,
      set: (v: number) => (left = v),
      configurable: true,
    })
    Object.defineProperty(container, 'scrollHeight', { value: 20000, configurable: true })
    Object.defineProperty(container, 'clientHeight', { value: 500, configurable: true })
    Object.defineProperty(container, 'scrollWidth', { value: 500, configurable: true })
    Object.defineProperty(container, 'clientWidth', { value: 500, configurable: true })
    moves = []
    steps = []
    scrollToSpy = vi.fn((opts: ScrollToOptions) => {
      steps.push((opts.top ?? top) - top)
      top = opts.top ?? top
      left = opts.left ?? left
      moves.push({ top, left })
    })
    container.scrollTo = scrollToSpy as unknown as HTMLElement['scrollTo']
    // Relative scrolling is exactly what this composable must never do.
    container.scrollBy = vi.fn(() => {
      throw new Error('scrollBy called: wheel smoothing must move to absolute positions')
    }) as unknown as HTMLElement['scrollBy']
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = (cb: FrameRequestCallback) =>
        setTimeout(() => cb(performance.now()), 16) as unknown as number
    }
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = (id: number) =>
        clearTimeout(id as unknown as ReturnType<typeof setTimeout>)
    }
    // Run rAF via timers so we can advance time deterministically
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      const id = setTimeout(() => cb(performance.now()), 0)
      return id as unknown as number
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      clearTimeout(id as unknown as ReturnType<typeof setTimeout>)
    })

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  const dispatchWheel = (deltaY: number, options?: Partial<WheelEventInit>) => {
    const event = new WheelEvent('wheel', {
      deltaY,
      deltaX: 0,
      deltaMode: 0,
      cancelable: true,
      ...options,
    })
    const preventSpy = vi.spyOn(event, 'preventDefault')
    container.dispatchEvent(event)
    return preventSpy
  }

  it('scrolls for pixel-mode wheel events over threshold and prevents default', () => {
    useNuGridWheelSmoothing(ref(container), {
      threshold: 50,
      maxVelocityPxPerSec: 5000,
      stopOnInactivityMs: 100,
      adaptive: false,
      smoothingFactor: 1,
      minStepPx: 1,
    })

    const preventSpy = dispatchWheel(120)
    vi.runAllTimers()

    expect(preventSpy).toHaveBeenCalled()
    expect(steps.length).toBeGreaterThanOrEqual(1)
    expect(steps[0]).toBeGreaterThan(0)
  })

  it('ignores non-pixel deltaMode events', () => {
    useNuGridWheelSmoothing(ref(container), {
      threshold: 10,
      adaptive: false,
    })

    const preventSpy = dispatchWheel(200, { deltaMode: 1 })
    vi.runAllTimers()

    expect(preventSpy).not.toHaveBeenCalled()
    expect(scrollToSpy).not.toHaveBeenCalled()
  })

  it('applies velocity cap under adaptive high-speed band', () => {
    useNuGridWheelSmoothing(ref(container), {
      threshold: 10,
      maxVelocityPxPerSec: 4000,
      adaptive: true,
    })

    dispatchWheel(5000)
    vi.runAllTimers()

    expect(scrollToSpy).toHaveBeenCalled()
    const firstTop = steps[0]
    // First frame should clamp to velocity cap (0.75 * 4000 * 0.016 = ~48; allow cushion)
    expect(firstTop).toBeDefined()
    expect(firstTop as number).toBeGreaterThan(0)
    expect(firstTop as number).toBeLessThanOrEqual(90)
  })

  it('preserves full cap in super-high band to allow very fast scrolls', () => {
    useNuGridWheelSmoothing(ref(container), {
      threshold: 10,
      maxVelocityPxPerSec: 20000,
      adaptive: true,
    })

    // Large wheel delta to drive EWMA into super-high band
    dispatchWheel(8000)
    vi.runAllTimers()

    expect(scrollToSpy).toHaveBeenCalled()
    const firstTop = steps[0]
    // Full cap: 20000 * 0.016 = 320px per frame (allow some cushion)
    expect(firstTop).toBeDefined()
    expect(firstTop as number).toBeGreaterThanOrEqual(240)
    expect(firstTop as number).toBeLessThanOrEqual(360)
  })

  it('clears pending deltas after inactivity timeout', async () => {
    useNuGridWheelSmoothing(ref(container), {
      threshold: 10,
      adaptive: false,
      stopOnInactivityMs: 50,
    })

    dispatchWheel(300)
    vi.runAllTimers()

    // Advance timers past inactivity to clear any remaining momentum
    await vi.advanceTimersByTimeAsync(60)

    const callsAfterFirstWheel = steps.length

    // Dispatch a small wheel; there should be no leftover pending scroll added
    dispatchWheel(12)
    vi.runAllTimers()

    const newCalls = steps.length - callsAfterFirstWheel

    expect(newCalls).toBeGreaterThan(0)
    expect(newCalls).toBeLessThanOrEqual(6)
    expect(steps.at(-1)).toBeGreaterThan(0)
  })

  describe('moves to absolute positions (buoysoft/buoy-server#565)', () => {
    const smoothing = {
      threshold: 10,
      adaptive: false,
      smoothingFactor: 0.35,
      maxVelocityPxPerSec: 100000,
      stopOnInactivityMs: 1000,
    }

    it('states every position outright, and the positions are the running sum of the steps', () => {
      useNuGridWheelSmoothing(ref(container), smoothing)

      dispatchWheel(120)
      vi.runAllTimers()

      expect(moves.length).toBeGreaterThan(1)
      let sum = 0
      moves.forEach((move, i) => {
        sum += steps[i]!
        expect(move.top).toBeCloseTo(sum, 6)
      })
    })

    it('keeps its own position when the browser reports a slightly different one', () => {
      useNuGridWheelSmoothing(ref(container), smoothing)
      dispatchWheel(300)
      // First frame only: the burst now has a position of its own.
      vi.advanceTimersToNextTimer()
      const afterFirst = moves.at(-1)!.top
      // A browser rounding the fractional position it was given (within the 1px tolerance) must
      // not become the new base, or rounding error compounds exactly as scrollBy's did.
      expect(afterFirst).toBe(105) // 300 * 0.35
      container.scrollTop = afterFirst + 0.5
      vi.advanceTimersToNextTimer()

      // Next step is 0.35 of what is still pending (300 - 105), applied to OUR position. Taken from
      // the browser's figure instead, it would land 0.5px further on.
      expect(moves.at(-1)!.top).toBeCloseTo(105 + 0.35 * (300 - 105), 6)
    })

    it('adopts the position when something else moved the container mid-burst', () => {
      useNuGridWheelSmoothing(ref(container), smoothing)
      dispatchWheel(300)
      vi.advanceTimersToNextTimer()

      // Focus scrolled a cell into view, far from where the wheel had us.
      container.scrollTop = 5000
      vi.advanceTimersToNextTimer()

      const last = moves.at(-1)!.top
      expect(last).toBeGreaterThan(5000)
      expect(last).toBeLessThan(5000 + 300)
    })

    it('never moves past either end', () => {
      useNuGridWheelSmoothing(ref(container), smoothing)

      container.scrollTop = 19490 // 10px from the bottom of 20000 - 500
      dispatchWheel(400)
      vi.runAllTimers()
      expect(Math.max(...moves.map((m) => m.top))).toBe(19500)

      moves.length = 0
      container.scrollTop = 5
      dispatchWheel(-400)
      vi.runAllTimers()
      expect(Math.min(...moves.map((m) => m.top))).toBe(0)
    })

    it('starts each burst from where the container actually is', () => {
      useNuGridWheelSmoothing(ref(container), { ...smoothing, stopOnInactivityMs: 50 })
      dispatchWheel(120)
      vi.runAllTimers()

      // Between bursts the user drags the scrollbar well past the tolerance.
      container.scrollTop = 8000
      moves.length = 0
      dispatchWheel(120)
      vi.runAllTimers()

      expect(moves[0]!.top).toBeGreaterThan(8000)
      expect(moves.at(-1)!.top).toBeLessThanOrEqual(8000 + 120)
    })
  })
})
