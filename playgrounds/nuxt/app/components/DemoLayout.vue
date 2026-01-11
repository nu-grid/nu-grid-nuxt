<script setup lang="ts">
/**
 * DemoLayout - Standardized layout for demo pages
 *
 * Layout structure:
 * - Left sidebar: Toolbar controls and status indicators
 * - Right side: Grid (scrollable in both directions)
 * - Top: Collapsed info block
 * - Bottom: Collapsed code example
 */

interface Props {
  /** Page title displayed in the navbar */
  title: string
  /** ID for the UDashboardPanel */
  id: string
  /** Label for the info accordion (default: "About This Demo") */
  infoLabel?: string
  /** Label for the code accordion (default: "Code Example") */
  codeLabel?: string
  /** Icon for the info accordion */
  infoIcon?: string
  /** Icon for the code accordion */
  codeIcon?: string
  /** Width of the sidebar (default: 280px) */
  sidebarWidth?: string
  /** Height of the grid container (default: 600px) */
  gridHeight?: string
}

const _props = withDefaults(defineProps<Props>(), {
  infoLabel: 'About This Demo',
  codeLabel: 'Code Example',
  infoIcon: 'i-lucide-info',
  codeIcon: 'i-lucide-code',
  sidebarWidth: '280px',
  gridHeight: '600px',
})

const slots = defineSlots<{
  /** Status indicators showing current settings */
  status?: () => any
  /** Toolbar controls for changing options */
  controls?: () => any
  /** Info/documentation content for the collapsed accordion */
  info?: () => any
  /** Main content area (typically the grid) */
  default?: () => any
  /** Code example content for the collapsed accordion */
  code?: () => any
  /** Additional content after the code accordion */
  extra?: () => any
}>()

const hasInfo = computed(() => !!slots.info)
const hasCode = computed(() => !!slots.code)
const hasStatus = computed(() => !!slots.status)
const hasControls = computed(() => !!slots.controls)
const hasSidebar = computed(() => hasStatus.value || hasControls.value)
</script>

<template>
  <UDashboardPanel :id="id">
    <template #header>
      <UDashboardNavbar :title="title">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Info Accordion at top -->
      <UAccordion
        v-if="hasInfo"
        :items="[{ label: infoLabel, icon: infoIcon, slot: 'info' }]"
        class="mb-4"
      >
        <template #info>
          <div class="p-4">
            <slot name="info" />
          </div>
        </template>
      </UAccordion>

      <!-- Main layout: Sidebar + Grid -->
      <div class="flex gap-4">
        <!-- Left Sidebar: Toolbar & Status -->
        <aside
          v-if="hasSidebar"
          class="shrink-0 space-y-4 overflow-y-auto"
          :style="{ width: sidebarWidth, maxHeight: gridHeight }"
        >
          <!-- Status Indicators -->
          <div v-if="hasStatus" class="rounded-lg border border-default bg-elevated/30 p-3">
            <h3
              class="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-dimmed
                uppercase"
            >
              <UIcon name="i-lucide-activity" class="size-3.5" />
              Current Settings
            </h3>
            <div class="space-y-1.5 text-sm">
              <slot name="status" />
            </div>
          </div>

          <!-- Toolbar Controls -->
          <div v-if="hasControls" class="rounded-lg border border-default bg-elevated/30 p-3">
            <h3
              class="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-dimmed
                uppercase"
            >
              <UIcon name="i-lucide-sliders-horizontal" class="size-3.5" />
              Controls
            </h3>
            <div class="space-y-3">
              <slot name="controls" />
            </div>
          </div>
        </aside>

        <!-- Right Side: Grid (scrollable in both directions) -->
        <div
          class="min-w-0 flex-1 overflow-auto rounded-lg border border-default"
          :style="{ height: gridHeight }"
        >
          <slot />
        </div>
      </div>

      <!-- Code Accordion at bottom -->
      <UAccordion
        v-if="hasCode"
        :items="[{ label: codeLabel, icon: codeIcon, slot: 'code' }]"
        class="mt-4"
      >
        <template #code>
          <div class="p-4">
            <slot name="code" />
          </div>
        </template>
      </UAccordion>

      <!-- Extra Content -->
      <div v-if="slots.extra" class="mt-4">
        <slot name="extra" />
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
/* Text dimmed fallback if not available */
.text-dimmed {
  color: var(--ui-text-dimmed, var(--ui-text-muted, rgb(107 114 128)));
}
</style>
