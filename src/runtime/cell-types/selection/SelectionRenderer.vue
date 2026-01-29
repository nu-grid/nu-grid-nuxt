<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'

import { computed } from 'vue'
import NuGridCellCheckbox from '../../components/NuGridCellCheckbox.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<Props>(), {
  editable: false,
})

const emit = defineEmits<{
  'update:value': [value: boolean | 'indeterminate']
}>()

interface Props {
  row: Row<any>
  editable?: boolean
}

const isSelected = computed(() => props.row.getIsSelected())

// Use TanStack's built-in row.getCanSelect() which respects enableRowSelection option
const canRowBeSelected = computed(() => props.row.getCanSelect())

const handleUpdate = (newValue: boolean | 'indeterminate') => {
  // Only allow interaction if selection is enabled for this row
  if (!canRowBeSelected.value) return
  props.row.toggleSelected(!!newValue)
  emit('update:value', newValue)
}
</script>

<template>
  <NuGridCellCheckbox
    :model-value="isSelected"
    :disabled="!canRowBeSelected"
    :interactive="canRowBeSelected"
    @update:model-value="handleUpdate"
  />
</template>
