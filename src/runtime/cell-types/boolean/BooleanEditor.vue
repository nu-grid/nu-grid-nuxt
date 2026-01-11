<script setup lang="ts">
import type { NuGridCellEditorEmits, NuGridCellEditorProps } from '../../types'
import { ref } from 'vue'
import NuGridCellCheckbox from '../../components/NuGridCellCheckbox.vue'
import { useNuGridCellEditor } from '../../composables/useNuGridCellEditor'

defineOptions({ inheritAttrs: false })

const props = defineProps<NuGridCellEditorProps>()
const emit = defineEmits<NuGridCellEditorEmits>()

const checkboxRef = ref<any>(null)

// Use the cell editor composable for keyboard handling and focus management
const { handleKeydown, handleBlur } = useNuGridCellEditor(props, emit, checkboxRef, () => {
  // Call the checkbox's exposed focus method (preventScroll to avoid browser interference)
  checkboxRef.value?.focus({ preventScroll: true })
})
</script>

<template>
  <NuGridCellCheckbox
    ref="checkboxRef"
    :model-value="modelValue"
    :interactive="true"
    @update:model-value="emit('update:modelValue', $event)"
    @keydown="handleKeydown"
    @blur="handleBlur"
  />
</template>
