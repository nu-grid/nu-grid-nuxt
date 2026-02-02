<script setup lang="ts">
import type { ComputedRef } from 'vue'
import type { NuGridSearchContext } from '../../composables/_internal/useNuGridSearch'
import { inject, onMounted, ref, watch } from 'vue'
import NuGridSearch from '../NuGridSearch.vue'

// Inject search context from parent NuGrid
const searchContext = inject<NuGridSearchContext>('nugrid-search')!

// Inject UI config for theme classes
const uiConfig = inject<{ searchPanel: ComputedRef<string>; searchInput: ComputedRef<string> } | null>(
  'nugrid-ui-config',
  null,
)

// Compute search panel classes
const panelClass = uiConfig?.searchPanel?.value ?? 'flex items-center gap-2 px-4 py-2 border-b border-default bg-elevated'
const inputClass = uiConfig?.searchInput?.value ?? 'w-full min-w-[200px] max-w-sm'

// Local ref to the search component
const searchComponentRef = ref<InstanceType<typeof NuGridSearch> | null>(null)

// Connect the search component ref to the context's searchInputRef
// This enables focusSearchInput() to work from the context
onMounted(() => {
  if (searchComponentRef.value) {
    // Store the component instance so we can call focus() on it
    searchContext.searchInputRef.value = searchComponentRef.value as any
  }
})

// Handle search updates
function handleSearch(value: string) {
  searchContext.setQuery(value)
}

// Handle clear
function handleClear() {
  searchContext.clear()
}
</script>

<template>
  <div v-if="searchContext.showPanel.value" :class="panelClass">
    <NuGridSearch
      ref="searchComponentRef"
      :model-value="searchContext.rawSearchQuery.value"
      :placeholder="searchContext.placeholder.value"
      :debounce="searchContext.debounceMs.value"
      :icon="searchContext.icon.value"
      :clear-icon="searchContext.clearIcon.value"
      :class="inputClass"
      @update:model-value="handleSearch"
      @clear="handleClear"
    />
  </div>
</template>
