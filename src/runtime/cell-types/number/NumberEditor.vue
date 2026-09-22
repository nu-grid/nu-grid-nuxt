<script setup lang="ts">
import { ref } from 'vue'

import type { NuGridCellEditorEmits, NuGridCellEditorProps } from '../../types'

import { useNuGridCellEditor } from '../../composables'

defineOptions({ inheritAttrs: false })

const props = defineProps<NuGridCellEditorProps>()
const emit = defineEmits<NuGridCellEditorEmits>()

const inputRef = ref<{ inputRef: HTMLInputElement } | null>(null)

// Use the shared cell editor composable for focus management, keyboard handling, and blur handling
const { handleKeydown, handleBlur } = useNuGridCellEditor(props, emit, inputRef)

// Local text ref so cursor positioning works for spreadsheet nav (type="number" doesn't support selectionStart/End)
const inputText = ref(props.modelValue != null ? String(props.modelValue) : '')

// Convert value to number and emit
const handleInput = (value: string) => {
  const filtered = value.replace(/[^0-9.-]/g, '')
  inputText.value = filtered
  const num = parseFloat(filtered)
  emit('update:modelValue', Number.isNaN(num) ? null : num)
}
</script>

<template>
  <UInput
    ref="inputRef"
    :model-value="inputText"
    type="text"
    inputmode="decimal"
    class="w-full pl-0.5!"
    @update:model-value="handleInput"
    @blur="handleBlur"
    @keydown="handleKeydown"
  />
</template>
