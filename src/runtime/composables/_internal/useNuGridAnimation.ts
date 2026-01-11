import type { TableData } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import type { ComputedRef, Ref } from 'vue'
import type { NuGridAnimationPreset, NuGridProps } from '../../types'
import type { NuGridAnimationContext } from '../../types/_internal'
import { usePreferredReducedMotion } from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { usePropWithDefault } from '../../config/_internal'

interface NuGridAnimationOptions<T extends TableData> {
  /** Root element ref for finding row elements */
  rootRef: Ref<HTMLElement | null>
  /** Rows that trigger animation when order changes (sorted/filtered output from TanStack) */
  rows: ComputedRef<Row<T>[]>
  /** Animation class from theme (overrides preset if provided) */
  animationClass?: ComputedRef<string>
}

/** Map preset names to Tailwind animation classes */
const presetClasses: Record<NuGridAnimationPreset, string> = {
  refresh: 'animate-nugrid-refresh',
  fade: 'animate-nugrid-fade',
  slide: 'animate-nugrid-slide',
  scale: 'animate-nugrid-scale',
}

/**
 * Composable for NuGrid row animations
 *
 * Provides:
 * - Animation configuration from props
 * - Row animation execution (refresh effect on reorder)
 * - Accessibility support (prefers-reduced-motion)
 * - Animation presets and customization
 *
 * Animations are triggered by:
 * - Sorting changes
 * - Filtering changes
 * - Row additions/removals
 *
 * @param props - NuGrid props
 * @param options - Animation options (rootRef, rows)
 * @returns Animation context with computed values
 */
export function useNuGridAnimation<T extends TableData = TableData>(
  props: NuGridProps<T>,
  options?: NuGridAnimationOptions<T>,
): NuGridAnimationContext {
  // Use computed refs to access animation options reactively
  const enabledProp = usePropWithDefault(props, 'animation', 'enabled')
  const presetProp = usePropWithDefault(props, 'animation', 'preset')
  const durationProp = usePropWithDefault(props, 'animation', 'duration')
  const easingProp = usePropWithDefault(props, 'animation', 'easing')
  const staggerProp = usePropWithDefault(props, 'animation', 'stagger')
  const maxStaggerProp = usePropWithDefault(props, 'animation', 'maxStagger')

  // Reactive reduced-motion preference
  const preferredMotion = usePreferredReducedMotion()
  const prefersReducedMotion = computed(() => preferredMotion.value === 'reduce')

  // Track if component has fully mounted and settled
  // Animation only enabled after mount + delay to skip initial data load
  // The 250ms delay ensures async data fetching during mount is complete
  const isMounted = ref(false)
  let mountTimer: ReturnType<typeof setTimeout> | undefined
  onMounted(() => {
    mountTimer = setTimeout(() => {
      isMounted.value = true
    }, 250)
  })
  onBeforeUnmount(() => {
    if (mountTimer) {
      clearTimeout(mountTimer)
      mountTimer = undefined
    }
  })

  // Check if animations are explicitly disabled via `animation: false` or user preference
  // Also require component to be mounted and settled to prevent initial load animation
  const enabled = computed(() => {
    if (!isMounted.value) return false
    if (prefersReducedMotion.value) return false
    if (props.animation === false) return false
    return enabledProp.value
  })

  const duration = computed(() => durationProp.value)
  const easing = computed(() => easingProp.value)
  const stagger = computed(() => staggerProp.value)
  const maxStagger = computed(() => maxStaggerProp.value)

  // Get animation class - theme override takes precedence, then preset
  const presetExplicit = computed(() => {
    const anim = props.animation
    if (!anim || typeof anim !== 'object') return false
    return Object.prototype.hasOwnProperty.call(anim, 'preset')
  })

  const animationClass = computed(() => {
    // Theme override wins unless caller explicitly sets a preset
    if (options?.animationClass?.value && !presetExplicit.value) {
      return options.animationClass.value
    }
    return presetClasses[presetProp.value] ?? presetClasses.refresh
  })

  // Track animation state
  let currentAnimationId = 0
  const isAnimating = ref(false)
  let cleanupTimer: ReturnType<typeof setTimeout> | null = null
  let activeAnimationListeners: Array<{
    el: HTMLElement
    handler: (event: AnimationEvent) => void
  }> = []

  // Track previous row IDs to calculate change count
  let previousRowIds: string[] = []

  /**
   * Cancel any in-progress animation
   */
  function cancelAnimation() {
    currentAnimationId++
    if (cleanupTimer) {
      clearTimeout(cleanupTimer)
      cleanupTimer = null
    }
    if (activeAnimationListeners.length) {
      activeAnimationListeners.forEach(({ el, handler }) =>
        el.removeEventListener('animationend', handler),
      )
      activeAnimationListeners = []
    }
    if (options?.rootRef.value) {
      const rowElements = options.rootRef.value.querySelectorAll('[data-row-id]')
      rowElements.forEach((el) => {
        const htmlEl = el as HTMLElement
        htmlEl.classList.remove(animationClass.value)
        htmlEl.style.animationDelay = ''
      })
    }
    isAnimating.value = false
  }

  /**
   * Animate data reorder with configurable effect
   *
   * Since virtualized rows reuse the same DOM elements, we use a quick
   * fade + translate that doesn't leave empty space in the grid.
   */
  async function animateReorder() {
    if (!enabled.value || !options?.rootRef.value) return

    // Cancel any in-progress animation
    if (isAnimating.value) {
      cancelAnimation()
    }

    const root = options.rootRef.value
    const cssClass = animationClass.value
    const animationId = ++currentAnimationId
    isAnimating.value = true

    // Wait for Vue to update the DOM with new data
    await nextTick()

    // Check if this animation was cancelled
    if (animationId !== currentAnimationId) return

    const rowElements = Array.from(root.querySelectorAll('[data-row-id]')) as HTMLElement[]
    if (!rowElements.length) {
      isAnimating.value = false
      return
    }

    const staggerMs = stagger.value
    const maxStaggerMs = maxStagger.value
    const cleanupElement = (el: HTMLElement) => {
      el.classList.remove(cssClass)
      el.style.animationDelay = ''
    }

    const schedule =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (fn: FrameRequestCallback) => setTimeout(fn, 16)

    activeAnimationListeners = []

    schedule(() => {
      if (animationId !== currentAnimationId) return

      const total = rowElements.length
      let finished = 0

      const handleDone = () => {
        finished++
        if (finished >= total) {
          if (cleanupTimer) {
            clearTimeout(cleanupTimer)
            cleanupTimer = null
          }
          activeAnimationListeners = []
          isAnimating.value = false
        }
      }

      rowElements.forEach((el, index) => {
        const delay = Math.min(index * staggerMs, maxStaggerMs)
        const handler = () => {
          if (animationId !== currentAnimationId) return
          cleanupElement(el)
          handleDone()
        }
        activeAnimationListeners.push({ el, handler })
        el.addEventListener('animationend', handler, { once: true })
        el.style.animationDelay = `${delay}ms`
        el.classList.add(cssClass)
      })

      cleanupTimer = setTimeout(
        () => {
          if (animationId !== currentAnimationId) return
          if (activeAnimationListeners.length) {
            activeAnimationListeners.forEach(({ el, handler }) =>
              el.removeEventListener('animationend', handler),
            )
            activeAnimationListeners = []
          }
          rowElements.forEach(cleanupElement)
          isAnimating.value = false
        },
        duration.value + maxStaggerMs + 50,
      )
    })
  }

  // Watch for row order changes (triggered by sorting, filtering, or data changes)
  if (options) {
    watch(
      () => options.rows.value.map((row) => row.id),
      (newIds) => {
        // Skip animation until component is fully mounted and settled
        // This prevents animation during initial data load
        if (!isMounted.value) {
          previousRowIds = [...newIds]
          return
        }

        // Check if any rows changed position
        let hasChanged = newIds.length !== previousRowIds.length
        if (!hasChanged) {
          for (let i = 0; i < newIds.length; i++) {
            if (newIds[i] !== previousRowIds[i]) {
              hasChanged = true
              break
            }
          }
        }
        previousRowIds = [...newIds]

        if (hasChanged) {
          animateReorder()
        }
      },
      { immediate: true },
    )
  }

  return {
    enabled,
    duration,
    easing,
    animateReorder,
  }
}
