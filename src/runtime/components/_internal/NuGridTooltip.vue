<script setup lang="ts">
import type { AppConfig } from '@nuxt/schema'
import type { ComponentConfig } from '@nuxt/ui'
import theme from '#build/ui/tooltip'
import { useAppConfig } from '#imports'
import { tv } from '@nuxt/ui/utils/tv'
import { computed } from 'vue'
import { useNuGridTooltip } from '../../composables/_internal/useNuGridTooltip'

type Tooltip = ComponentConfig<typeof theme, AppConfig, 'tooltip'>

const { tooltipState } = useNuGridTooltip()

const appConfig = useAppConfig() as Tooltip['AppConfig']

// Use the same UI styling as Nuxt UI's tooltip
const ui = computed(() =>
  tv({ extend: tv(theme), ...(appConfig.ui?.tooltip || {}) })({
    side: 'bottom',
  }),
)

const isOpen = computed(() => !!tooltipState.value)
</script>

<template>
  <Teleport to="body">
    <Transition name="tooltip-fade">
      <div
        v-if="tooltipState && isOpen"
        :data-state="isOpen ? 'delayed-open' : 'closed'"
        data-slot="content"
        class="pointer-events-none fixed z-50 -translate-x-1/2"
        :class="ui.content()"
        :style="{
          'left': `${tooltipState.x}px`,
          'top': `${tooltipState.y + 20}px`,
          'width': 'max-content',
          'max-width': '20rem',
          'height': 'auto',
          '--reka-tooltip-content-transform-origin': 'top center',
        }"
      >
        <span data-slot="text" class="whitespace-pre-wrap break-words" :class="ui.text()">{{ tooltipState.text }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tooltip-fade-enter-active {
  transition: opacity 0.15s ease-out;
}

.tooltip-fade-leave-active {
  transition: opacity 0.1s ease-in;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}
</style>
