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

// Convert percentage display value to storage value
function toStorageValue(displayValue: string | number | null): number | null {
  if (displayValue === null || displayValue === '') return null
  const num = Number(displayValue)
  if (Number.isNaN(num)) return null
  return num / 100 // Convert percentage to decimal
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
    <div class="flex items-center gap-1">
      <UInput
        v-model="filterValue"
        type="number"
        placeholder="Value..."
        autofocus
        class="flex-1"
        @update:model-value="context.setFilterValue(toStorageValue($event))"
      />
      <span class="text-gray-500 dark:text-gray-400 shrink-0">%</span>
    </div>
    <div v-if="operator === 'between'" class="flex items-center gap-1">
      <UInput
        v-model="filterValue2"
        type="number"
        placeholder="To..."
        class="flex-1"
        @update:model-value="
          context.setFilterValue({
            from: toStorageValue(filterValue),
            to: toStorageValue(filterValue2),
          })
        "
      />
      <span class="text-gray-500 dark:text-gray-400 shrink-0">%</span>
    </div>
  </div>
</template>
