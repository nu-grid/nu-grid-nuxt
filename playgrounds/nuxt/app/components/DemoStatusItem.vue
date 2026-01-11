<script setup lang="ts">
/**
 * DemoStatusItem - Display a status indicator in the demo sidebar
 */

interface Props {
  /** Label for the status item */
  label: string
  /** Value to display */
  value?: string | number | boolean
  /** Color class for the value (e.g., 'text-success', 'text-error') */
  color?: string
  /** Whether the value represents an "active" state (uses green/red coloring) */
  boolean?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: 'text-primary',
})

const displayValue = computed(() => {
  if (typeof props.value === 'boolean') {
    return props.value ? 'Yes' : 'No'
  }
  return String(props.value ?? '-')
})

const valueColor = computed(() => {
  if (props.boolean !== undefined || typeof props.value === 'boolean') {
    return props.value ? 'text-success' : 'text-dimmed'
  }
  return props.color
})
</script>

<template>
  <div class="flex items-center justify-between gap-2">
    <span class="text-dimmed">{{ label }}</span>
    <strong :class="valueColor" class="text-right">
      <slot>{{ displayValue }}</slot>
    </strong>
  </div>
</template>

<style scoped>
.text-dimmed {
  color: var(--ui-text-dimmed, var(--ui-text-muted, rgb(107 114 128)));
}
</style>
