<script setup lang="ts">
import type { NuGridLookupItem } from '../../types'

import { computed, isRef } from 'vue'
import { nuGridDefaults } from '../../config/_internal'

defineOptions({ inheritAttrs: false })

const props = defineProps<Props>()

interface Props {
  value: any
  cell: any
  editable?: boolean
}

// Get lookup config from column definition
const lookupConfig = computed(() => props.cell?.column?.columnDef?.lookup)

// Resolve items - handle static, reactive, and async items
// For the renderer, we can only use static or reactive items synchronously
// Async items will show the raw value until loaded
const resolvedItems = computed((): NuGridLookupItem[] => {
  const config = lookupConfig.value
  if (!config?.items) return []

  if (typeof config.items === 'function') {
    // Async function - can't resolve synchronously in renderer
    // Return empty array, the value will be shown as-is
    return []
  } else if (isRef(config.items)) {
    // Reactive ref
    return config.items.value
  } else {
    // Static array
    return config.items
  }
})

const valueKey = computed(
  () => lookupConfig.value?.valueKey ?? nuGridDefaults.columnDefaults.lookup.valueKey,
)
const labelKey = computed(
  () => lookupConfig.value?.labelKey ?? nuGridDefaults.columnDefaults.lookup.labelKey,
)

const displayLabel = computed(() => {
  if (props.value === null || props.value === undefined) {
    return ''
  }

  const items = resolvedItems.value
  if (!items.length) {
    // No items available (async loading or empty), show raw value
    return String(props.value)
  }

  const item = items.find((i) => i[valueKey.value] === props.value)
  return item?.[labelKey.value] ?? String(props.value)
})
</script>

<template>
  <div class="truncate">{{ displayLabel }}</div>
</template>
