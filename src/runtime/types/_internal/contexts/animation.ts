import type { ComputedRef } from 'vue'

/**
 * Animation context
 * Provides animation configuration to child components
 */
export interface NuGridAnimationContext {
  /**
   * Whether row animations are enabled
   */
  enabled: ComputedRef<boolean>

  /**
   * Animation duration in milliseconds
   */
  duration: ComputedRef<number>

  /**
   * CSS easing function
   */
  easing: ComputedRef<string>

  /**
   * Trigger a row reorder animation
   * Called automatically when row order changes, but can be called manually
   */
  animateReorder: () => Promise<void>
}
