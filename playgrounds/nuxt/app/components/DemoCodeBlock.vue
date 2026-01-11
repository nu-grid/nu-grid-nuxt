<script setup lang="ts">
/**
 * DemoCodeBlock - Styled code block for demo pages
 *
 * Usage:
 * <DemoCodeBlock :code="codeString" />
 * or
 * <DemoCodeBlock title="Example:">{{ codeString }}</DemoCodeBlock>
 */

interface Props {
  /** Optional title/description above the code */
  title?: string
  /** Code content (alternative to slot) */
  code?: string
}

defineProps<Props>()
</script>

<template>
  <div class="space-y-2 text-sm">
    <p v-if="title" class="text-muted">
      <strong>{{ title }}</strong>
    </p>
    <pre
      class="overflow-x-auto rounded bg-default/50 p-3 text-xs"
    ><code>{{ code }}<slot v-if="!code" /></code></pre>
  </div>
</template>

<style scoped>
pre {
  white-space: pre;
  word-wrap: normal;
}

code {
  font-family: 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
  white-space: pre;
}
</style>
