<script setup lang="ts">
import { computed, ref } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<Props>()

interface Props {
  value: any
  row: any
  cell: any
  editable: boolean
  onUpdateValue?: (value: any) => void
}

const hoveredStar = ref<number | null>(null)

const rating = computed(() => {
  const value = props.value
  if (value === null || value === undefined || value === '') return null
  const numValue = Number(value)
  if (Number.isNaN(numValue)) return null
  return Math.max(1, Math.min(5, Math.round(numValue)))
})

const displayValue = computed(() => hoveredStar.value ?? rating.value)

const isInteractive = computed(() => props.editable && typeof props.onUpdateValue === 'function')

function handleSet(value: number | null) {
  if (!isInteractive.value) return
  props.onUpdateValue?.(value)
}

function starClass(star: number) {
  return star <= (displayValue.value ?? 0) ? 'text-yellow-400' : 'text-gray-300'
}
</script>

<template>
  <div class="flex items-center gap-1" :class="isInteractive ? 'cursor-pointer' : 'opacity-70'">
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      class="rounded transition-all hover:scale-105 focus-visible:ring-2
        focus-visible:ring-primary-500 focus-visible:outline-none"
      :class="starClass(star)"
      :disabled="!isInteractive"
      :tabindex="isInteractive ? 0 : -1"
      :aria-label="`Set rating to ${star}`"
      @mouseenter="isInteractive && (hoveredStar = star)"
      @mouseleave="isInteractive && (hoveredStar = null)"
      @focus="isInteractive && (hoveredStar = star)"
      @blur="isInteractive && (hoveredStar = null)"
      @click.stop="handleSet(star)"
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
      icon="i-heroicons-x-mark"
      size="xs"
      color="neutral"
      variant="ghost"
      class="ml-1"
      :disabled="!isInteractive"
      :tabindex="isInteractive ? 0 : -1"
      aria-label="Clear rating"
      @click.stop="handleSet(null)"
    />
    <span v-if="displayValue !== null" class="ml-1 text-sm text-gray-500"
      >{{ displayValue }}/5</span
    >
    <span v-else class="ml-1 text-sm text-gray-400">—</span>
  </div>
</template>
