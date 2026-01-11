import type { ComputedRef, Ref } from 'vue'

/**
 * Scroll state context - provides scroll position and settling information
 * Used by LazyCell to defer rendering until scroll settles
 */
export interface NuGridScrollStateContext {
  /** Whether the user is currently scrolling */
  isScrolling: Ref<boolean>
  /** Whether scrolling has settled (stopped for a brief delay) */
  isSettled: Ref<boolean>
  /** Current vertical scroll position */
  scrollTop: Ref<number>
  /** Current horizontal scroll position */
  scrollLeft: Ref<number>
  /** Viewport height of the container */
  viewportHeight: ComputedRef<number>
  /** Total scrollable height */
  scrollHeight: ComputedRef<number>
  /** Reference to the scroll container element */
  containerRef: Ref<HTMLElement | null>
}
