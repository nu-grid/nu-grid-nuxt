<script setup lang="ts">
import type { NuGridCellEditorEmits, NuGridCellEditorProps } from '../../types'

import { computed, ref } from 'vue'
import NuGridCellCheckbox from '../../components/NuGridCellCheckbox.vue'
import { useNuGridCellEditor } from '../../composables/useNuGridCellEditor'

defineOptions({ inheritAttrs: false })

const props = defineProps<NuGridCellEditorProps>()
const emit = defineEmits<NuGridCellEditorEmits>()

const checkboxRef = ref<any>(null)

// Get the row selection state
const isSelected = computed(() => props.row.getIsSelected())

// Use TanStack's built-in row.getCanSelect() which respects enableRowSelection option
const canRowBeSelected = computed(() => props.row.getCanSelect())

// Use the cell editor composable for keyboard handling and focus management
const { handleKeydown, handleBlur } = useNuGridCellEditor(props, emit, checkboxRef, () => {
  // Call the checkbox's exposed focus method (preventScroll to avoid browser interference)
  checkboxRef.value?.focus({ preventScroll: true })
})

// Handle checkbox toggle
const handleToggle = (value: boolean | 'indeterminate') => {
  // Don't toggle if this row's selection is disabled
  if (!canRowBeSelected.value) {
    return
  }
  props.row.toggleSelected(!!value)
  // Emit the change
  emit('update:modelValue', value)
}
</script>

<template>
  <NuGridCellCheckbox
    ref="checkboxRef"
    :model-value="isSelected"
    :interactive="canRowBeSelected"
    :disabled="!canRowBeSelected"
    @update:model-value="handleToggle"
    @keydown="handleKeydown"
    @blur="handleBlur"
  />
</template>
