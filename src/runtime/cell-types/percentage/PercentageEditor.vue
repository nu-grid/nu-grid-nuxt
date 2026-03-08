<script setup lang="ts">
import { computed, ref } from 'vue'

import type { NuGridCellEditorEmits, NuGridCellEditorProps } from '../../types'

import { useNuGridCellEditor } from '../../composables'

defineOptions({ inheritAttrs: false })

const props = defineProps<NuGridCellEditorProps>()
const emit = defineEmits<NuGridCellEditorEmits>()

const inputRef = ref<{ inputRef: HTMLInputElement } | null>(null)

// Use the shared cell editor composable for focus management, keyboard handling, and blur handling
const { handleKeydown, handleBlur } = useNuGridCellEditor(props, emit, inputRef)

// Get storage mode from column definition (default: 'decimal' for 0-1, 'percent' for 0-100)
const storageMode = computed(() => props.cell?.column?.columnDef?.percentageStorage ?? 'decimal')

// Convert stored value to display percentage string
function toDisplayString(value: any): string {
  if (value === null || value === undefined) return ''
  const numValue = Number(value)
  if (Number.isNaN(numValue)) return ''
  const display = storageMode.value === 'decimal' ? numValue * 100 : numValue
  return String(display)
}

// Local text ref so cursor positioning works for spreadsheet nav (type="number" doesn't support selectionStart/End)
const inputText = ref(toDisplayString(props.modelValue))

// Convert display value back to storage format and emit
const handleInput = (value: string) => {
  const filtered = value.replace(/[^0-9.-]/g, '')
  inputText.value = filtered
  const numValue = parseFloat(filtered)
  if (Number.isNaN(numValue)) {
    emit('update:modelValue', null)
    return
  }
  // If storing as decimal, convert percentage back to 0-1
  const storageValue = storageMode.value === 'decimal' ? numValue / 100 : numValue
  emit('update:modelValue', storageValue)
}
</script>

<template>
  <div class="flex w-full items-center">
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
    <span class="ml-1 shrink-0 text-gray-500 dark:text-gray-400">%</span>
  </div>
</template>
