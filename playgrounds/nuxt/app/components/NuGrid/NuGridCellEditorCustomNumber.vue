<script setup lang="ts">
import type { NuGridCellEditorEmits, NuGridCellEditorProps } from '#nu-grid/types'

const props = defineProps<NuGridCellEditorProps>()
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
  <div class="flex w-full items-center gap-1">
    <UInput
      ref="inputRef"
      :model-value="modelValue"
      type="number"
      class="flex-1 pl-0.5"
      placeholder="Custom number editor"
      @update:model-value="handleInput"
      @blur="handleBlur"
      @keydown="handleKeydown"
    />
    <span class="text-xs font-semibold text-primary">✨</span>
  </div>
</template>
