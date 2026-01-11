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

// Format date value for input (expects YYYY-MM-DD)
const formattedValue = computed(() => {
  if (!props.modelValue) return ''

  // If already a string in YYYY-MM-DD format, use it directly
  if (typeof props.modelValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(props.modelValue)) {
    return props.modelValue
  }

  // Otherwise convert to Date and format
  const date = new Date(props.modelValue)
  if (Number.isNaN(date.getTime())) return ''

  return date.toISOString().split('T')[0]
})

// Convert date input to proper format and emit
const handleInput = (value: string) => {
  emit('update:modelValue', value || null)
}
</script>

<template>
  <UInput
    ref="inputRef"
    :model-value="formattedValue"
    type="date"
    class="w-full pl-0.5!"
    @update:model-value="handleInput"
    @blur="handleBlur"
    @keydown="handleKeydown"
  />
</template>
