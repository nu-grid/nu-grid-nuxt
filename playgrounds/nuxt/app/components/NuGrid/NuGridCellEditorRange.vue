<script setup lang="ts">
import type { NuGridCellEditorEmits, NuGridCellEditorProps } from '#nu-grid/types'

// Extended props with range configuration
const props = withDefaults(
  defineProps<
    NuGridCellEditorProps & {
      min?: number
      max?: number
      step?: number
    }
  >(),
  {
    min: 0,
    max: 100,
    step: 1,
  },
)

const emit = defineEmits<NuGridCellEditorEmits>()

const inputRef = ref<{ inputRef: HTMLInputElement } | null>(null)

// Use the shared cell editor composable for focus management, keyboard handling, and blur handling
const { handleKeydown, handleBlur } = useNuGridCellEditor(props, emit, inputRef)

// Convert value to number and emit
const handleInput = (value: string) => {
  const numValue = value === '' ? null : Number(value)
  emit('update:modelValue', numValue)
}
</script>

<template>
  <div class="flex w-full items-center gap-2" tabindex="-1" @keydown="handleKeydown">
    <USlider
      ref="inputRef"
      :model-value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      class="flex-1"
      @update:model-value="handleInput"
      @blur="handleBlur"
    />
    <span class="min-w-[3ch] text-right text-xs text-muted">{{ modelValue }}</span>
  </div>
</template>
