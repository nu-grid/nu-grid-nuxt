<script setup lang="ts">
import type { AppConfig } from '@nuxt/schema'
import type { ComponentConfig } from '@nuxt/ui'
import theme from '#build/ui/tooltip'
import { useAppConfig } from '#imports'
import { tv } from '@nuxt/ui/utils/tv'
import { Presence } from 'reka-ui'
import { computed } from 'vue'
import { useNuGridTooltip } from '../../composables/_internal/useNuGridTooltip'

type Tooltip = ComponentConfig<typeof theme, AppConfig, 'tooltip'>

const { tooltipState } = useNuGridTooltip()

const appConfig = useAppConfig() as Tooltip['AppConfig']

// Use the same UI styling as Nuxt UI's tooltip
const ui = computed(() =>
  tv({ extend: tv(theme), ...(appConfig.ui?.tooltip || {}) })({
    side: 'top',
  }),
)

const isOpen = computed(() => !!tooltipState.value)
</script>

<template>
  <Teleport to="body">
    <Presence :present="isOpen">
      <div
        v-if="tooltipState"
        :data-state="isOpen ? 'delayed-open' : 'closed'"
        data-slot="content"
        class="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full"
        :class="ui.content()"
        :style="{
          'left': `${tooltipState.x}px`,
          'top': `${tooltipState.y - 8}px`,
          '--reka-tooltip-content-transform-origin': 'bottom center',
        }"
      >
        <span data-slot="text" class="truncate" :class="ui.text()">{{ tooltipState.text }}</span>
      </div>
    </Presence>
  </Teleport>
</template>
