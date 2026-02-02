<script setup lang="ts">
import type { NuGridPagingContext } from '../../types/_internal'
import { computed, inject } from 'vue'

const paging = inject<NuGridPagingContext>('nugrid-paging')!

// Page options for UPagination
const currentPage = computed({
  get: () => (paging.pageIndex.value ?? 0) + 1,
  set: (val: number) => paging.setPageIndex(val - 1),
})

// Page size selector options
const pageSizeSelectOptions = computed(() =>
  paging.pageSizeOptions.value.map((size) => ({
    label: `${size} per page`,
    value: size,
  })),
)

const selectedPageSize = computed({
  get: () => paging.pageSize.value,
  set: (val: number) => paging.setPageSize(val),
})

// Row range display
const startRow = computed(() => {
  if (paging.totalRows.value === 0) return 0
  return paging.pageIndex.value * paging.pageSize.value + 1
})

const endRow = computed(() => {
  const end = (paging.pageIndex.value + 1) * paging.pageSize.value
  return Math.min(end, paging.totalRows.value)
})

const showPageSizeSelector = computed(() => paging.pageSizeOptions.value.length > 0)
</script>

<template>
  <div
    v-if="paging.enabled.value"
    class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-default
      sm:gap-4"
  >
    <div class="hidden text-sm text-muted sm:block">
      <template v-if="paging.totalRows.value > 0">
        Showing {{ startRow }} to {{ endRow }} of {{ paging.totalRows.value }} rows
      </template>
      <template v-else> No rows </template>
    </div>

    <div class="flex flex-1 items-center justify-end gap-2 sm:flex-none sm:gap-4">
      <USelect
        v-if="showPageSizeSelector"
        v-model="selectedPageSize"
        :items="pageSizeSelectOptions"
        size="sm"
        class="hidden w-32 md:block"
      />

      <UPagination
        v-model:page="currentPage"
        :total="paging.totalRows.value"
        :items-per-page="paging.pageSize.value"
        size="sm"
        :sibling-count="1"
        :show-edges="true"
      />
    </div>
  </div>
</template>
