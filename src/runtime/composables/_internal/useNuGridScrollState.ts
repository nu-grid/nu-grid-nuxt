import type { Ref } from 'vue'
import { computed, onUnmounted, ref, watch } from 'vue'

export interface UseNuGridScrollStateOptions {
  /** Reference to the scrollable container element */
  containerRef: Ref<HTMLElement | null>
  /** Delay in ms after scrolling stops before considering scroll "settled" (default: 150) */
  settleDelay?: number
}

export interface UseNuGridScrollStateReturn {
  /** Whether the user is currently scrolling */
  isScrolling: Ref<boolean>
  /** Whether scrolling has settled (stopped for settleDelay ms) */
  isSettled: Ref<boolean>
  /** Current scroll position */
  scrollTop: Ref<number>
  /** Current scroll left position */
  scrollLeft: Ref<number>
  /** Viewport height of the container */
  viewportHeight: Ref<number>
  /** Total scrollable height */
  scrollHeight: Ref<number>
}

/**
 * Composable for tracking NuGrid scroll state
 *
 * Provides reactive scroll state including:
 * - Whether user is actively scrolling
 * - Whether scrolling has "settled" (stopped for a configurable delay)
 * - Current scroll positions and viewport dimensions
 *
 * Used by LazyCell to defer rendering expensive content during scroll
 */
export function useNuGridScrollState(
  options: UseNuGridScrollStateOptions,
): UseNuGridScrollStateReturn {
  const { containerRef, settleDelay = 150 } = options

  const isScrolling = ref(false)
  const isSettled = ref(true)
  const scrollTop = ref(0)
  const scrollLeft = ref(0)
  const viewportHeight = ref(0)
  const scrollHeight = ref(0)

  let scrollTimeout: ReturnType<typeof setTimeout> | null = null

  const onScroll = () => {
    const container = containerRef.value
    if (!container) return

    // Update scroll positions
    scrollTop.value = container.scrollTop
    scrollLeft.value = container.scrollLeft
    viewportHeight.value = container.clientHeight
    scrollHeight.value = container.scrollHeight

    // Mark as scrolling
    isScrolling.value = true
    isSettled.value = false

    // Clear existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }

    // Set settled after delay
    scrollTimeout = setTimeout(() => {
      isScrolling.value = false
      isSettled.value = true
    }, settleDelay)
  }

  // Set up scroll listener
  watch(
    containerRef,
    (container, oldContainer) => {
      // Clean up old listener
      if (oldContainer && oldContainer !== container) {
        oldContainer.removeEventListener('scroll', onScroll)
      }

      // Set up new listener
      if (container) {
        container.addEventListener('scroll', onScroll, { passive: true })

        // Initialize values
        scrollTop.value = container.scrollTop
        scrollLeft.value = container.scrollLeft
        viewportHeight.value = container.clientHeight
        scrollHeight.value = container.scrollHeight
      }
    },
    { immediate: true },
  )

  // Clean up on unmount
  onUnmounted(() => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', onScroll)
    }
  })

  return {
    isScrolling,
    isSettled,
    scrollTop,
    scrollLeft,
    viewportHeight: computed(() => viewportHeight.value),
    scrollHeight: computed(() => scrollHeight.value),
  }
}
