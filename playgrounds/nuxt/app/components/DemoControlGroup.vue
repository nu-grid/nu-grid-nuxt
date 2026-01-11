<script setup lang="ts">
/**
 * DemoControlGroup - Group related controls with a label in the demo sidebar
 */

interface Props {
  /** Label for the control group */
  label?: string
}

defineProps<Props>()
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-xs font-medium text-dimmed">{{ label }}</label>
    <slot />
  </div>
</template>

<style scoped>
.text-dimmed {
  color: var(--ui-text-dimmed, var(--ui-text-muted, rgb(107 114 128)));
}
</style>
