<script setup lang="ts">
import type { Cell, Row } from '@tanstack/vue-table'
import type { Ref } from 'vue'

import type { NuGridActionMenuColumnMeta } from '../../types/_internal'
import { computed, ref, watch } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<Props>()

interface Props {
  row: Row<any>
  cell?: Cell<any, unknown>
}

// Get column meta for action menu configuration
const meta = computed(
  () => props.cell?.column.columnDef.meta as NuGridActionMenuColumnMeta | undefined,
)

// Check if actions are enabled for this row
const isActionsEnabled = computed(() => {
  if (!meta.value) return false
  // Use the ref if available for reactive updates
  if (meta.value.enabledRef?.value === false) return false
  // Use the isRowEnabled function if provided
  if (meta.value.isRowEnabledFn) {
    return meta.value.isRowEnabledFn(props.row)
  }
  return meta.value.actionMenuEnabled ?? true
})

// Get menu items for this row
const menuItems = computed(() => {
  if (!meta.value?.getActions || !isActionsEnabled.value) return []
  return meta.value.getActions(props.row)
})

// Button configuration with defaults
const buttonConfig = computed(() => ({
  icon: meta.value?.button?.icon ?? 'i-lucide-ellipsis-vertical',
  color: meta.value?.button?.color ?? 'neutral',
  variant: meta.value?.button?.variant ?? 'ghost',
  class: meta.value?.button?.class ?? 'ml-auto',
}))

// Shared button props to avoid duplication in template
const buttonProps = computed(() => ({
  'icon': buttonConfig.value.icon,
  'color': buttonConfig.value.color,
  'variant': buttonConfig.value.variant,
  'class': buttonConfig.value.class,
  'disabled': !isActionsEnabled.value,
  'tabindex': -1,
  'aria-label': 'Actions',
}))

// Reference to the container element
const containerRef = ref<HTMLElement | null>(null)

// Helper function to get or create the ref for a row's menu open state
function getOrCreateMenuOpenRef(rowId: string): Ref<boolean> | null {
  const states = meta.value?.menuOpenStates
  if (!states) return null
  if (!states.has(rowId)) {
    states.set(rowId, ref(false))
  }
  return states.get(rowId)!
}

// Get or create the menu open state for this row from the shared map
const menuOpen = computed({
  get: () => {
    const rowId = String(props.row.id)
    const menuRef = getOrCreateMenuOpenRef(rowId)
    return menuRef?.value ?? false
  },
  set: (value: boolean) => {
    const rowId = String(props.row.id)
    const menuRef = getOrCreateMenuOpenRef(rowId)
    if (menuRef) {
      menuRef.value = value
    }
  },
})

// When the menu closes, return focus to the parent cell element
// This prevents UDropdownMenu from keeping focus on the button,
// which would cause ArrowDown to reopen the menu instead of navigating
watch(
  () => menuOpen.value,
  (isOpen, wasOpen) => {
    if (wasOpen && !isOpen) {
      // Menu just closed - return focus to the parent cell
      nextTick(() => {
        const cell = containerRef.value?.closest('[data-cell-index]') as HTMLElement | null
        if (cell) {
          cell.focus({ preventScroll: true })
        }
      })
    }
  },
)

// Prevent arrow keys from being handled by UDropdownMenu when menu is closed
// This allows grid navigation to work properly
function handleKeyDown(event: KeyboardEvent) {
  if (!menuOpen.value && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    // Don't let UDropdownMenu intercept arrow keys when the menu is closed
    event.stopPropagation()
    event.preventDefault()
  }
}

// Handle click on the lightweight button (when menu is not yet rendered)
function openMenuOnClick() {
  if (isActionsEnabled.value) {
    menuOpen.value = true
  }
}

// Handle keyboard activation (Enter/Space) on the lightweight button
function openMenuOnKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    if (isActionsEnabled.value) {
      menuOpen.value = true
    }
  }
}

// Expose methods for external access if needed
defineExpose({
  openMenu: () => {
    if (isActionsEnabled.value) menuOpen.value = true
  },
  closeMenu: () => {
    menuOpen.value = false
  },
  isOpen: menuOpen,
})
</script>

<template>
  <div
    ref="containerRef"
    class="flex items-center justify-end"
    data-action-menu-cell
    @keydown.capture="handleKeyDown"
  >
    <!-- Performance optimization: Only render UDropdownMenu when menu is open -->
    <!-- When closed, render a simple button that's much lighter weight -->
    <UDropdownMenu
      v-if="menuOpen"
      v-model:open="menuOpen"
      :content="{ align: 'end' }"
      :items="menuItems"
    >
      <UButton v-bind="buttonProps" />
    </UDropdownMenu>
    <!-- Lightweight button when menu is closed - no UDropdownMenu overhead -->
    <UButton v-else v-bind="buttonProps" @click="openMenuOnClick" @keydown="openMenuOnKeydown" />
  </div>
</template>
