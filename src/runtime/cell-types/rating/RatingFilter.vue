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

const operator = ref('gte')

const operators = [
  { value: 'equals', label: 'Equals' },
  { value: 'gte', label: 'At least' },
  { value: 'lte', label: 'At most' },
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
    <div class="flex items-center gap-2">
      <USelect
        v-model="filterValue"
        :options="[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n} ⭐` }))"
        option-attribute="label"
        value-attribute="value"
        placeholder="Rating..."
        autofocus
        class="flex-1"
        @update:model-value="context.setFilterValue($event)"
      />
    </div>
    <div v-if="operator === 'between'" class="flex items-center gap-2">
      <span class="text-sm text-muted">and</span>
      <USelect
        v-model="filterValue2"
        :options="[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n} ⭐` }))"
        option-attribute="label"
        value-attribute="value"
        placeholder="To..."
        class="flex-1"
        @update:model-value="
          context.setFilterValue({
            from: filterValue,
            to: filterValue2 ? Number(filterValue2) : null,
          })
        "
      />
    </div>
  </div>
</template>
