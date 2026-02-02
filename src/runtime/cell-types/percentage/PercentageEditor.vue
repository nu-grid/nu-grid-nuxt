<script setup lang="ts">
import type { NuGridCellEditorEmits, NuGridCellEditorProps } from '../../types'
import { computed, ref } from 'vue'
import { useNuGridCellEditor } from '../../composables'

defineOptions({ inheritAttrs: false })

const props = defineProps<NuGridCellEditorProps>()
const emit = defineEmits<NuGridCellEditorEmits>()

const inputRef = ref<{ inputRef: HTMLInputElement } | null>(null)

// Use the shared cell editor composable for focus management, keyboard handling, and blur handling
const { handleKeydown, handleBlur } = useNuGridCellEditor(props, emit, inputRef)

// Get storage mode from column definition (default: 'decimal' for 0-1, 'percent' for 0-100)
const storageMode = computed(
  () => (props.cell?.column?.columnDef as any)?.percentageStorage ?? 'decimal',
)

// Convert stored value to display value (percentage 0-100)
const displayValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) return ''
  const numValue = Number(props.modelValue)
  if (Number.isNaN(numValue)) return ''
  // If stored as decimal (0-1), convert to percentage for display
  return storageMode.value === 'decimal' ? numValue * 100 : numValue
})

// Convert display value back to storage format and emit
const handleInput = (value: number | string) => {
  if (value === '' || value === null || value === undefined) {
    emit('update:modelValue', null)
    return
  }
  const numValue = Number(value)
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
  <div class="flex items-center w-full">
    <UInput
      ref="inputRef"
      :model-value="displayValue"
      type="number"
      step="0.1"
      class="w-full pl-0.5!"
      @update:model-value="handleInput"
      @blur="handleBlur"
      @keydown="handleKeydown"
    />
    <span class="ml-1 text-gray-500 dark:text-gray-400 shrink-0">%</span>
  </div>
</template>
