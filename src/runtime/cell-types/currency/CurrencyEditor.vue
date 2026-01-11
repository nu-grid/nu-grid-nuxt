<script setup lang="ts">
import type { NuGridCellEditorEmits, NuGridCellEditorProps } from '../../types'
import { computed, ref } from 'vue'
import { useNuGridCellEditor } from '../../composables'

defineOptions({ inheritAttrs: false })

const props = defineProps<NuGridCellEditorProps>()
const emit = defineEmits<NuGridCellEditorEmits>()

const inputRef = ref<{ inputRef: HTMLInputElement } | null>(null)

const { handleKeydown, handleBlur } = useNuGridCellEditor(props, emit, inputRef)

// Format value for display but keep raw number for editing
const displayValue = computed(() => {
  const value = props.modelValue
  if (value === null || value === undefined) return ''
  return String(value)
})
</script>

<template>
  <div class="flex items-center gap-1">
    <span class="text-gray-500">$</span>
    <UInput
      ref="inputRef"
      :model-value="displayValue"
      type="number"
      step="0.01"
      min="0"
      class="flex-1 pl-0.5!"
      @update:model-value="emit('update:modelValue', $event ? Number($event) : null)"
      @blur="handleBlur"
      @keydown="handleKeydown"
    />
  </div>
</template>
