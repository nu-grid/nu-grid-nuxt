<script setup lang="ts">
import NuGridCellCheckbox from '../../components/NuGridCellCheckbox.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<Props>(), {
  editable: false,
})

const emit = defineEmits<{
  'update:value': [value: boolean | 'indeterminate']
}>()

interface Props {
  value: boolean
  editable?: boolean
}

const handleUpdate = (newValue: boolean | 'indeterminate') => {
  if (props.editable) {
    emit('update:value', newValue)
  }
}
</script>

<template>
  <NuGridCellCheckbox
    :model-value="value"
    :disabled="!editable"
    :interactive="editable"
    @update:model-value="handleUpdate"
  />
</template>
