<script setup lang="ts">
import type { NuGridFilterContext } from '../../types/cells'
import { computed } from 'vue'

interface Props {
  context: NuGridFilterContext
}

const props = defineProps<Props>()

const filterValue = computed({
  get: () => props.context.filterValue.value,
  set: (value) => props.context.setFilterValue(value),
})

const options = [
  { value: true, label: 'True' },
  { value: false, label: 'False' },
  { value: null, label: 'All' },
]

function clearFilter() {
  filterValue.value = null
  props.context.clearFilter()
}
</script>

<template>
  <div class="min-w-[200px] space-y-2 p-2">
    <div class="flex items-center gap-2">
      <USelect
        v-model="filterValue"
        :options="options"
        option-attribute="label"
        value-attribute="value"
        class="flex-1"
        autofocus
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
  </div>
</template>
