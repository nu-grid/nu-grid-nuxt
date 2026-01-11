import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useNuGridWheelSmoothing } from '../src/runtime/composables/_internal/useNuGridWheelSmoothing'

describe('useNuGridWheelSmoothing', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    container.scrollTop = 0
    container.scrollLeft = 0
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
    const scrollBySpy = vi.fn()
    container.scrollBy = scrollBySpy

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
    expect(scrollBySpy.mock.calls.length).toBeGreaterThanOrEqual(1)
    const call = scrollBySpy.mock.calls[0]?.[0]
    expect(call?.top).toBeGreaterThan(0)
  })

  it('ignores non-pixel deltaMode events', () => {
    const scrollBySpy = vi.fn()
    container.scrollBy = scrollBySpy

    useNuGridWheelSmoothing(ref(container), {
      threshold: 10,
      adaptive: false,
    })

    const preventSpy = dispatchWheel(200, { deltaMode: 1 })
    vi.runAllTimers()

    expect(preventSpy).not.toHaveBeenCalled()
    expect(scrollBySpy).not.toHaveBeenCalled()
  })

  it('applies velocity cap under adaptive high-speed band', () => {
    const scrollBySpy = vi.fn()
    container.scrollBy = scrollBySpy

    useNuGridWheelSmoothing(ref(container), {
      threshold: 10,
      maxVelocityPxPerSec: 4000,
      adaptive: true,
    })

    dispatchWheel(5000)
    vi.runAllTimers()

    expect(scrollBySpy).toHaveBeenCalled()
    const firstTop = scrollBySpy.mock.calls[0]?.[0]?.top as number | undefined
    // First frame should clamp to velocity cap (0.75 * 4000 * 0.016 = ~48; allow cushion)
    expect(firstTop).toBeDefined()
    expect(firstTop as number).toBeGreaterThan(0)
    expect(firstTop as number).toBeLessThanOrEqual(90)
  })

  it('preserves full cap in super-high band to allow very fast scrolls', () => {
    const scrollBySpy = vi.fn()
    container.scrollBy = scrollBySpy

    useNuGridWheelSmoothing(ref(container), {
      threshold: 10,
      maxVelocityPxPerSec: 20000,
      adaptive: true,
    })

    // Large wheel delta to drive EWMA into super-high band
    dispatchWheel(8000)
    vi.runAllTimers()

    expect(scrollBySpy).toHaveBeenCalled()
    const firstTop = scrollBySpy.mock.calls[0]?.[0]?.top as number | undefined
    // Full cap: 20000 * 0.016 = 320px per frame (allow some cushion)
    expect(firstTop).toBeDefined()
    expect(firstTop as number).toBeGreaterThanOrEqual(240)
    expect(firstTop as number).toBeLessThanOrEqual(360)
  })

  it('clears pending deltas after inactivity timeout', async () => {
    const scrollBySpy = vi.fn()
    container.scrollBy = scrollBySpy

    useNuGridWheelSmoothing(ref(container), {
      threshold: 10,
      adaptive: false,
      stopOnInactivityMs: 50,
    })

    dispatchWheel(300)
    vi.runAllTimers()

    // Advance timers past inactivity to clear any remaining momentum
    await vi.advanceTimersByTimeAsync(60)

    const callsAfterFirstWheel = scrollBySpy.mock.calls.length

    // Dispatch a small wheel; there should be no leftover pending scroll added
    dispatchWheel(12)
    vi.runAllTimers()

    const newCalls = scrollBySpy.mock.calls.length - callsAfterFirstWheel

    expect(newCalls).toBeGreaterThan(0)
    expect(newCalls).toBeLessThanOrEqual(6)
    const lastCall = scrollBySpy.mock.calls.at(-1)?.[0]
    expect((lastCall as any)?.top).toBeGreaterThan(0)
  })
})
