<script setup lang="ts">
import type { ComputedRef } from 'vue'
import { computed, inject } from 'vue'
import type { NuGridSearchContext } from '../../composables/_internal/useNuGridSearch'
import { useNuGridSearchHighlight } from '../../composables/_internal/useNuGridSearchHighlight'

interface Props {
  /** Text to display with highlighting */
  text: string
}

const props = defineProps<Props>()

// Inject search context
const searchContext = inject<NuGridSearchContext | null>('nugrid-search', null)

// Inject UI config for highlight class
const uiConfig = inject<{ searchHighlight?: ComputedRef<string> } | null>('nugrid-ui-config', null)

// Get highlight class from theme
const highlightClass = computed(
  () => uiConfig?.searchHighlight?.value ?? 'text-inherit bg-yellow-200 dark:bg-yellow-500/30 rounded-sm px-0.5 -mx-0.5',
)

// Use highlight composable - highlight matches from either the search panel or type-ahead buffer
const { highlightText, isActive } = useNuGridSearchHighlight({
  searchQuery: computed(() => searchContext?.searchQuery.value || searchContext?.typeAheadBuffer.value || ''),
  enabled: computed(() => (searchContext?.enabled.value ?? false) || (searchContext?.typeAheadBuffer.value?.length ?? 0) > 0),
})

// Get text segments with highlighting info - short-circuit when search is not active
const segments = computed(() => {
  if (!isActive.value) {
    return [] // Skip processing when search is inactive
  }
  return highlightText(props.text)
})

// Check if any segment is a match (for conditional rendering)
const hasMatchingSegment = computed(() => segments.value.some(s => s.isMatch))
</script>

<template>
  <template v-if="isActive && hasMatchingSegment">
    <template v-for="(segment, index) in segments" :key="index">
      <mark v-if="segment.isMatch" :class="highlightClass">{{ segment.text }}</mark>
      <template v-else>{{ segment.text }}</template>
    </template>
  </template>
  <template v-else>{{ text }}</template>
</template>
