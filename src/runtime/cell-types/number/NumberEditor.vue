<script setup lang="ts">
import type { NuGridCellEditorEmits, NuGridCellEditorProps } from '../../types'
import { ref } from 'vue'
import { useNuGridCellEditor } from '../../composables'

defineOptions({ inheritAttrs: false })

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
  <UInput
    ref="inputRef"
    :model-value="modelValue"
    type="number"
    class="w-full pl-0.5!"
    @update:model-value="handleInput"
    @blur="handleBlur"
    @keydown="handleKeydown"
  />
</template>
