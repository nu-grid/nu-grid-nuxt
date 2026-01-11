<script setup lang="ts">
import type { NuGridFilterContext } from '../../types/cells'
import { computed, ref } from 'vue'

interface Props {
  context: NuGridFilterContext
}

const props = defineProps<Props>()

const filterValue = computed({
  get: () => props.context.filterValue.value,
  set: (value) => props.context.setFilterValue(value),
})

const operator = ref('contains')

const operators = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'startsWith', label: 'Starts with' },
  { value: 'endsWith', label: 'Ends with' },
  { value: 'notContains', label: 'Does not contain' },
]

function clearFilter() {
  filterValue.value = ''
  props.context.clearFilter()
}
</script>

<template>
  <div class="min-w-[200px] space-y-2 p-2">
    <div class="flex items-center gap-2">
      <USelect
        v-model="operator"
        :options="operators"
        option-attribute="label"
        value-attribute="value"
        class="flex-1"
      />
      <UButton
        v-if="context.isFiltered"
        icon="i-heroicons-x-mark"
        size="xs"
        color="neutral"
        variant="ghost"
        @click="clearFilter"
      />
    </div>
    <UInput
      v-model="filterValue"
      placeholder="Filter..."
      autofocus
      @update:model-value="context.setFilterValue($event)"
    />
  </div>
</template>
