<script setup lang="ts">
import type { NuGridCellEditorEmits, NuGridCellEditorProps } from '../../types'
import type { ComputedRef } from 'vue'
import { computed, inject, nextTick, onMounted, ref, watch } from 'vue'
import { useNuGridCellEditor } from '../../composables'

defineOptions({ inheritAttrs: false })

const props = defineProps<NuGridCellEditorProps>()
const emit = defineEmits<NuGridCellEditorEmits>()

const containerRef = ref<HTMLElement | null>(null)
const clearButtonRef = ref<HTMLElement | null>(null)
const hoveredStar = ref<number | null>(null)
const selectedStar = ref<number | null>(null)
const focusedIndex = ref<number | null>(null) // 0 = clear button, 1-5 = stars

// Inject enterBehavior from grid context
const injectedEnterBehavior = inject<ComputedRef<string>>('nugrid-enter-behavior', null)

function getEnterBehavior() {
  return injectedEnterBehavior?.value ?? props.enterBehavior ?? 'default'
}

// Use a dummy ref for the composable (we handle most keys manually)
const dummyRef = ref(null)
const {
  handleKeydown: baseHandleKeydown,
  handleBlur: baseHandleBlur,
  scheduleNavigation,
} = useNuGridCellEditor(props, emit, dummyRef)

const rating = computed({
  get: () => props.modelValue ?? null,
  set: (value) => emit('update:modelValue', value),
})

// Initialize selected star from current rating
watch(
  () => props.modelValue,
  (value) => {
    selectedStar.value = value ?? null
    // Initialize focused index based on current rating
    if (focusedIndex.value === null) {
      focusedIndex.value = value ?? 0 // 0 = clear button, 1-5 = stars
    }
  },
  { immediate: true },
)

// Focus container when shouldFocus becomes true
watch(
  () => props.shouldFocus,
  (shouldFocus) => {
    if (shouldFocus && containerRef.value) {
      nextTick(() => {
        containerRef.value?.focus({ preventScroll: true })
      })
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (props.shouldFocus && containerRef.value) {
    nextTick(() => {
      containerRef.value?.focus({ preventScroll: true })
    })
  }
})

function handleContainerBlur(event: FocusEvent) {
  const nextTarget = event.relatedTarget as HTMLElement | null
  if (nextTarget && containerRef.value?.contains(nextTarget)) return
  baseHandleBlur()
}

function setRating(value: number | null, closeEditor = false) {
  const selection = window.getSelection?.()
  if (selection && selection.type !== 'None') {
    selection.removeAllRanges()
  }
  rating.value = value
  selectedStar.value = value
  focusedIndex.value = value ?? 0 // 0 = clear button, 1-5 = stars
  if (closeEditor) {
    // eslint-disable-next-line vue/custom-event-name-casing
    emit('stop-editing')
  }
}

function handleKeydown(e: KeyboardEvent) {
  // Stop propagation to prevent focus system interference
  e.stopPropagation()

  // Handle arrow keys for navigation between stars and clear button
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    if (focusedIndex.value === null || focusedIndex.value === 0) {
      // Wrap from clear button to star 5
      focusedIndex.value = 5
      selectedStar.value = 5
      rating.value = 5
    } else if (focusedIndex.value === 1) {
      // Move from star 1 to clear button
      focusedIndex.value = 0
      selectedStar.value = null
      rating.value = null
    } else {
      // Move to previous star
      focusedIndex.value = focusedIndex.value - 1
      selectedStar.value = focusedIndex.value
      rating.value = focusedIndex.value
    }
    return
  }

  if (e.key === 'ArrowRight') {
    e.preventDefault()
    if (focusedIndex.value === null || focusedIndex.value === 0) {
      // Move from clear button to star 1
      focusedIndex.value = 1
      selectedStar.value = 1
      rating.value = 1
    } else if (focusedIndex.value >= 5) {
      // Wrap from star 5 to clear button
      focusedIndex.value = 0
      selectedStar.value = null
      rating.value = null
    } else {
      // Move to next star
      focusedIndex.value = focusedIndex.value + 1
      selectedStar.value = focusedIndex.value
      rating.value = focusedIndex.value
    }
    return
  }

  // Handle number keys 0-5 (0 clears, 1-5 sets rating)
  if (e.key === '0') {
    e.preventDefault()
    setRating(null, true) // Clear and close
    return
  }
  if (e.key >= '1' && e.key <= '5') {
    e.preventDefault()
    const value = Number.parseInt(e.key, 10)
    setRating(value, true) // Set and close
    return
  }

  // Handle Enter - activate current selection and close/navigate
  if (e.key === 'Enter') {
    e.preventDefault()
    if (focusedIndex.value === 0) {
      // Clear button is focused, clear the rating
      rating.value = null
      selectedStar.value = null
    }
    const behavior = getEnterBehavior()
    if (behavior === 'moveDown') {
      scheduleNavigation(e.shiftKey ? 'up' : 'down')
    } else if (behavior === 'moveCell') {
      scheduleNavigation(e.shiftKey ? 'previous' : 'next')
    } else {
      // eslint-disable-next-line vue/custom-event-name-casing
      emit('stop-editing')
    }
    return
  }

  // Handle Space - activate current selection (but don't close)
  if (e.key === ' ') {
    e.preventDefault()
    if (focusedIndex.value === 0) {
      // Clear button is focused, clear the rating
      setRating(null, false)
    } else if (focusedIndex.value !== null && focusedIndex.value >= 1 && focusedIndex.value <= 5) {
      // Star is focused, set rating
      setRating(focusedIndex.value, false)
    }
    return
  }

  // Handle Tab - use throttled navigation
  if (e.key === 'Tab') {
    e.preventDefault()
    scheduleNavigation(e.shiftKey ? 'previous' : 'next')
    return
  }

  // Handle Escape - cancel
  if (e.key === 'Escape') {
    e.preventDefault()
    // eslint-disable-next-line vue/custom-event-name-casing
    emit('cancel-editing')
    return
  }

  // Handle ArrowUp/ArrowDown - use throttled navigation to prevent overwhelming rendering
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    scheduleNavigation(e.key === 'ArrowUp' ? 'up' : 'down')
    return
  }

  // For all other keys, use base handler
  baseHandleKeydown(e)
}
</script>

<template>
  <div
    ref="containerRef"
    class="flex items-center gap-1 rounded border-2 border-transparent p-1 outline-none select-none
      focus-visible:border-primary-500"
    tabindex="0"
    @keydown="handleKeydown"
    @blur="handleContainerBlur"
    @mouseleave="hoveredStar = null"
    @focus="
      () => {
        if (focusedIndex === null) focusedIndex = selectedStar ?? 0
      }
    "
    @mousedown.prevent.stop
    @pointerdown.prevent.stop
    @selectstart.prevent
  >
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      class="rounded transition-all hover:scale-110 focus:outline-none"
      :class="[
        star <= (hoveredStar ?? selectedStar ?? rating ?? 0) ? 'text-yellow-400' : 'text-gray-300',
        focusedIndex === star ? 'ring-2 ring-primary-500 ring-offset-0' : '',
      ]"
      tabindex="0"
      @mousedown.prevent
      @click="setRating(star, true)"
      @mouseenter="hoveredStar = star"
      @mouseleave="hoveredStar = null"
      @focus="focusedIndex = star"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="h-5 w-5"
      >
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
      </svg>
    </button>
    <UButton
      ref="clearButtonRef"
      icon="i-heroicons-x-mark"
      size="xs"
      color="neutral"
      variant="ghost"
      class="ml-2"
      tabindex="0"
      :class="focusedIndex === 0 ? 'ring-2 ring-primary-500 ring-offset-0' : ''"
      @mousedown.prevent
      @click="setRating(null, true)"
      @focus="focusedIndex = 0"
    />
  </div>
</template>
