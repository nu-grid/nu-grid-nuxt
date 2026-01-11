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

const operator = ref('equals')

const operators = [
  { value: 'equals', label: 'Equals' },
  { value: 'greaterThan', label: 'Greater than' },
  { value: 'lessThan', label: 'Less than' },
  { value: 'greaterThanOrEqual', label: 'Greater than or equal' },
  { value: 'lessThanOrEqual', label: 'Less than or equal' },
  { value: 'between', label: 'Between' },
]

const filterValue2 = ref<number | null>(null)

function clearFilter() {
  filterValue.value = null
  filterValue2.value = null
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
      type="number"
      placeholder="Value..."
      autofocus
      @update:model-value="context.setFilterValue($event ? Number($event) : null)"
    />
    <UInput
      v-if="operator === 'between'"
      v-model="filterValue2"
      type="number"
      placeholder="To..."
      @update:model-value="
        context.setFilterValue({
          from: filterValue,
          to: filterValue2 ? Number(filterValue2) : null,
        })
      "
    />
  </div>
</template>
