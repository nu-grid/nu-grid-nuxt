<script setup lang="ts">
/**
 * NuGridLazyCell - A wrapper component for deferring expensive cell content until scroll settles
 *
 * This component delays rendering its slot content while the grid is actively scrolling.
 * Useful for images, complex visualizations, or any content that is expensive to render.
 *
 * Features:
 * - IntersectionObserver for visibility detection
 * - Scroll state awareness (defers while scrolling)
 * - Preload distance (start loading before visible)
 * - Customizable placeholder via slot
 * - Smooth transition when content appears
 *
 * @example
 * ```vue
 * <NuGridLazyCell>
 *   <img :src="imageUrl" />
 *   <template #placeholder>
 *     <div class="skeleton" />
 *   </template>
 * </NuGridLazyCell>
 * ```
 */
import type { NuGridScrollStateContext } from '../types/_internal'
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /**
     * Distance in pixels before the viewport to start loading content
     * Higher values preload more aggressively
     * @default 100
     */
    preloadDistance?: number

    /**
     * Whether to wait for scroll to settle before showing content
     * If false, content shows immediately when in viewport
     * @default true
     */
    waitForSettle?: boolean

    /**
     * Minimum time in ms to show placeholder (prevents flash)
     * @default 0
     */
    minPlaceholderTime?: number

    /**
     * Transition duration in ms for content appearance
     * @default 150
     */
    transitionDuration?: number

    /**
     * Height hint for placeholder to prevent layout shift
     * Can be a number (px) or CSS string
     */
    height?: number | string

    /**
     * Width hint for placeholder
     * Can be a number (px) or CSS string
     */
    width?: number | string

    /**
     * Keep content mounted after first load (don't re-hide on scroll)
     * @default true
     */
    keepMounted?: boolean
  }>(),
  {
    preloadDistance: 100,
    waitForSettle: true,
    minPlaceholderTime: 0,
    transitionDuration: 150,
    height: undefined,
    width: undefined,
    keepMounted: true,
  },
)

defineSlots<{
  /** Content to render when visible and settled */
  default: () => any
  /** Placeholder shown while loading (optional) */
  placeholder: () => any
}>()

// Inject scroll state from NuGrid
const scrollStateContext = inject<NuGridScrollStateContext | null>('nugrid-scroll-state', null)

// Element ref for IntersectionObserver
const elementRef = ref<HTMLElement | null>(null)

// State
const isIntersecting = ref(false)
const hasBeenVisible = ref(false)
const showStartTime = ref<number | null>(null)
const isReady = ref(false)

// Computed: should we show the actual content?
const shouldShowContent = computed(() => {
  // If keep mounted and has been visible, always show
  if (props.keepMounted && hasBeenVisible.value) {
    return true
  }

  // Must be in/near viewport
  if (!isIntersecting.value) {
    return false
  }

  // If we don't wait for settle, show immediately when intersecting
  if (!props.waitForSettle) {
    return true
  }

  // If no scroll context (not in NuGrid), show immediately
  if (!scrollStateContext) {
    return true
  }

  // Wait for scroll to settle
  return scrollStateContext.isSettled.value
})

// Track when content becomes visible
watch(shouldShowContent, (show) => {
  if (show && !hasBeenVisible.value) {
    hasBeenVisible.value = true
    showStartTime.value = Date.now()

    // Handle minimum placeholder time
    if (props.minPlaceholderTime > 0) {
      setTimeout(() => {
        isReady.value = true
      }, props.minPlaceholderTime)
    } else {
      isReady.value = true
    }
  }
})

// Computed: final visibility state
const showContent = computed(() => {
  if (!shouldShowContent.value) return false
  if (props.minPlaceholderTime > 0 && !isReady.value) return false
  return true
})

// IntersectionObserver setup
let observer: IntersectionObserver | null = null

const setupObserver = () => {
  if (!elementRef.value) return

  // Clean up existing observer
  if (observer) {
    observer.disconnect()
  }

  // Create observer with root margin for preloading
  // Use null (viewport) as root - this works reliably in all cases
  // The scroll state from NuGrid handles the "wait for settle" logic
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry) {
        isIntersecting.value = entry.isIntersecting
      }
    },
    {
      // Use viewport as root (null) for reliable intersection detection
      root: null,
      // Preload distance creates a margin around the viewport
      rootMargin: `${props.preloadDistance}px`,
      threshold: 0,
    },
  )

  observer.observe(elementRef.value)
}

// Set up observer when mounted
onMounted(() => {
  setupObserver()
})

// Watch element ref in case it changes
watch(elementRef, (el) => {
  if (el) {
    setupObserver()
  }
})

// Re-setup observer if preload distance changes
watch(
  () => props.preloadDistance,
  () => {
    setupObserver()
  },
)

// Cleanup on unmount
onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})

// Dimension styles
const dimensionStyle = computed(() => {
  const style: Record<string, string> = {}

  if (props.height !== undefined) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }

  if (props.width !== undefined) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }

  return style
})

// Transition style
const transitionStyle = computed(() => ({
  transition: `opacity ${props.transitionDuration}ms ease-out`,
}))
</script>

<template>
  <div ref="elementRef" class="lazy-cell" :style="dimensionStyle">
    <!-- Actual content (with fade-in transition) -->
    <div
      v-if="showContent"
      class="lazy-cell-content"
      :style="{ ...transitionStyle, opacity: showContent ? 1 : 0 }"
    >
      <slot />
    </div>

    <!-- Placeholder (shown while waiting) -->
    <div v-else class="lazy-cell-placeholder" :style="dimensionStyle">
      <slot name="placeholder">
        <!-- Default placeholder: subtle skeleton -->
        <div class="lazy-cell-skeleton" />
      </slot>
    </div>
  </div>
</template>

<style scoped>
.lazy-cell {
  position: relative;
  min-height: 1em;
}

.lazy-cell-content {
  width: 100%;
  height: 100%;
}

.lazy-cell-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lazy-cell-skeleton {
  width: 100%;
  height: 100%;
  min-height: 1em;
  background: linear-gradient(
    90deg,
    rgba(128, 128, 128, 0.1) 25%,
    rgba(128, 128, 128, 0.2) 50%,
    rgba(128, 128, 128, 0.1) 75%
  );
  background-size: 200% 100%;
  animation: lazy-cell-shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes lazy-cell-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
