import { onUnmounted, watch } from 'vue'

export interface UseNuGridWheelSmoothingOptions {
  threshold?: number
  /** Maximum scroll speed in px/sec for intercepted wheel input */
  maxVelocityPxPerSec?: number
  /** Maximum scroll speed in px/sec for touchpad input (small deltas) */
  maxVelocityPxPerSecTouchpad?: number
  /** Delta threshold to distinguish touchpad (below) from mouse wheel (above) */
  touchpadDeltaThreshold?: number
  /** How long (ms) after the last wheel event before we cancel any remaining momentum */
  stopOnInactivityMs?: number
  /** Fraction of pending delta applied each frame (lower = smoother) */
  smoothingFactor?: number
  /** Minimum px to apply per frame when pending exists (avoids stutter) */
  minStepPx?: number
  /** Enable adaptive smoothing based on recent velocity */
  adaptive?: boolean
}

/**
 * Smooths bursty mouse-wheel events by batching them into rAF-driven scrolls and
 * optionally caps their speed so mouse wheels cannot spike scroll velocity.
 * Only intercepts large pixel-mode deltas to avoid affecting trackpads.
 */
export function useNuGridWheelSmoothing(
  containerRef: { value: HTMLElement | null },
  options: UseNuGridWheelSmoothingOptions = {},
) {
  const {
    threshold = 100,
    maxVelocityPxPerSec = 10000,
    maxVelocityPxPerSecTouchpad,
    touchpadDeltaThreshold = 20,
    stopOnInactivityMs = 70,
    smoothingFactor = 0.35,
    minStepPx = 1,
    adaptive = true,
  } = options

  let pendingX = 0
  let pendingY = 0
  let rafId: number | null = null
  let lastFlushTime: number | null = null
  let inactivityTimer: ReturnType<typeof setTimeout> | null = null
  let velocityEwma = 0
  let isTouchpad = false

  const clampByVelocity = (delta: number, allowed: number) => {
    if (allowed <= 0) return 0
    const absDelta = Math.abs(delta)
    if (absDelta <= allowed) return delta
    return Math.sign(delta) * allowed
  }

  const flushScroll = () => {
    rafId = null
    const now = performance.now()
    const dtMs = lastFlushTime ? now - lastFlushTime : 16
    lastFlushTime = now

    const dtSec = dtMs / 1000
    const currentVelocity = dtSec > 0 ? Math.max(Math.abs(pendingX), Math.abs(pendingY)) / dtSec : 0
    velocityEwma = adaptive ? 0.2 * currentVelocity + 0.8 * velocityEwma : velocityEwma

    const resolveAdaptive = () => {
      // Choose velocity cap based on input device
      const effectiveMaxVelocity =
        isTouchpad && maxVelocityPxPerSecTouchpad !== undefined
          ? maxVelocityPxPerSecTouchpad
          : maxVelocityPxPerSec

      if (!adaptive) {
        return {
          smoothing: smoothingFactor,
          minStep: minStepPx,
          velocityCap: effectiveMaxVelocity,
        }
      }

      if (velocityEwma < 800) {
        return {
          smoothing: 0.55,
          minStep: 0.5,
          velocityCap: effectiveMaxVelocity,
        }
      }

      if (velocityEwma < 2200) {
        return {
          smoothing: 0.4,
          minStep: 1,
          velocityCap: effectiveMaxVelocity,
        }
      }

      if (velocityEwma < 8000) {
        return {
          smoothing: 0.32,
          minStep: 1.5,
          velocityCap: effectiveMaxVelocity * 0.85,
        }
      }

      // Super-high band targets very fast scrolls (e.g., ~18k px/s); keep full cap
      return {
        smoothing: 0.45,
        minStep: 1.5,
        velocityCap: effectiveMaxVelocity,
      }
    }

    const adaptiveParams = resolveAdaptive()

    const allowedDelta = adaptiveParams.velocityCap * dtSec
    const el = containerRef.value
    if (!el) {
      pendingX = 0
      pendingY = 0
      return
    }

    const applyX = clampByVelocity(pendingX, allowedDelta)
    const applyY = clampByVelocity(pendingY, allowedDelta)

    const applyWithSmoothing = (pending: number, apply: number) => {
      if (apply === 0 || pending === 0) return 0
      const softened = pending * adaptiveParams.smoothing
      const signedMin = Math.sign(pending) * adaptiveParams.minStep
      const target = Math.abs(softened) < Math.abs(signedMin) ? signedMin : softened
      return Math.abs(target) > Math.abs(apply) ? apply : target
    }

    const finalX = applyWithSmoothing(pendingX, applyX)
    const finalY = applyWithSmoothing(pendingY, applyY)

    if (finalX !== 0 || finalY !== 0) {
      el.scrollBy({ left: finalX, top: finalY })
      pendingX -= finalX
      pendingY -= finalY
    }

    if ((pendingX !== 0 || pendingY !== 0) && rafId === null) {
      rafId = requestAnimationFrame(flushScroll)
    }
  }

  const resetInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer)
    }
    inactivityTimer = setTimeout(() => {
      pendingX = 0
      pendingY = 0
      lastFlushTime = null
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }, stopOnInactivityMs)
  }

  const scheduleFlush = () => {
    if (rafId === null) {
      rafId = requestAnimationFrame(flushScroll)
    }
  }

  const handleWheel = (event: WheelEvent) => {
    const el = containerRef.value
    if (!el) return

    // Only intercept pixel-mode deltas (mouse wheels). Line/page deltas fall back to native.
    if (event.deltaMode !== 0) return

    const magnitude = Math.max(Math.abs(event.deltaY), Math.abs(event.deltaX))
    if (magnitude < threshold) return

    // Detect touchpad vs mouse wheel based on delta magnitude
    // Touchpads typically send small deltas (3-20px), mouse wheels send larger deltas (40-120px)
    isTouchpad = maxVelocityPxPerSecTouchpad !== undefined && magnitude < touchpadDeltaThreshold

    event.preventDefault()

    pendingY += event.deltaY
    pendingX += event.deltaX
    scheduleFlush()
    resetInactivityTimer()
  }

  const addListener = (el: HTMLElement | null) => {
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
  }

  const removeListener = (el: HTMLElement | null) => {
    if (!el) return
    el.removeEventListener('wheel', handleWheel)
  }

  watch(
    () => containerRef.value,
    (el, prev) => {
      if (prev && prev !== el) removeListener(prev)
      addListener(el)
    },
    { immediate: true },
  )

  onUnmounted(() => {
    removeListener(containerRef.value)
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    if (inactivityTimer) {
      clearTimeout(inactivityTimer)
      inactivityTimer = null
    }
  })
}
