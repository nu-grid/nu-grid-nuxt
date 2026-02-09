import type { ClassValue } from 'tailwind-variants'
import type { Ref } from 'vue'
import type { NuGridScrollbars } from '../../types'
import { computed, onUnmounted, ref, watch } from 'vue'
import { usePropWithDefault } from '../../config/_internal'

export interface UseNuGridScrollbarsOptions {
  /** NuGrid props object */
  props: Record<string, any>
  containerRef: Ref<HTMLElement | null>
  /** Theme scrollbar class from ui slot */
  themeClass?: Ref<ClassValue | undefined>
}

export interface UseNuGridScrollbarsReturn {
  scrollbarClass: ComputedRef<string>
  scrollbarThemeClass: ComputedRef<string>
  scrollbarAttr: ComputedRef<NuGridScrollbars>
}

/**
 * Composable for handling NuGrid scrollbar styling modes
 *
 * Supports three modes:
 * - 'native': Browser default scrollbar behavior
 * - 'hover': Show styled scrollbar on hover
 * - 'scroll': Show styled scrollbar when scrolling (macOS-like)
 */
export function useNuGridScrollbars(
  options: UseNuGridScrollbarsOptions,
): UseNuGridScrollbarsReturn {
  const { props, containerRef } = options
  const resolvedMode = usePropWithDefault(props, 'layout', 'scrollbars')

  // For scroll mode: track scrolling state
  const isScrolling = ref(false)
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null
  const HIDE_DELAY = 700

  // Handle scroll events for scroll mode
  const onScroll = () => {
    if (resolvedMode.value !== 'scroll') return

    isScrolling.value = true

    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }

    scrollTimeout = setTimeout(() => {
      isScrolling.value = false
    }, HIDE_DELAY)
  }

  // Set up scroll listener for scroll mode
  watch(
    [containerRef, resolvedMode],
    ([container, currentMode], [oldContainer]) => {
      // Clean up old listener
      if (oldContainer && oldContainer !== container) {
        oldContainer.removeEventListener('scroll', onScroll)
      }

      // Set up new listener for scroll mode
      if (container && currentMode === 'scroll') {
        container.addEventListener('scroll', onScroll, { passive: true })
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

  // Computed class for scroll mode scrolling state
  const scrollbarClass = computed(() => {
    if (resolvedMode.value === 'scroll' && isScrolling.value) {
      return 'is-scrolling'
    }
    return ''
  })

  // Data attribute for CSS targeting
  const scrollbarAttr = computed(() => resolvedMode.value)

  // Theme classes based on mode
  const scrollbarThemeClass = computed(() => {
    const currentMode = resolvedMode.value
    if (currentMode === 'hover') {
      const themeValue = options.themeClass?.value
      // Convert ClassValue to string (handle arrays, false, etc.)
      if (!themeValue) return ''
      if (typeof themeValue === 'string') return themeValue
      if (Array.isArray(themeValue)) return themeValue.filter(Boolean).join(' ')
      return ''
    }
    if (currentMode === 'scroll') {
      // Scroll mode: dynamic thumb color based on scrolling state
      const base = 'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-rounded'
      if (!isScrolling.value) {
        return `${base} scrollbar-thumb-gray-400/50 dark:scrollbar-thumb-gray-500/50`
      }
      return `${base} scrollbar-thumb-transparent`
    }
    return ''
  })

  return {
    scrollbarClass,
    scrollbarThemeClass,
    scrollbarAttr,
  }
}
