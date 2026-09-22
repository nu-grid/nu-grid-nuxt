<script setup lang="ts">
import type { ComputedRef } from 'vue'

import {
  computed,
  inject,
  isRef,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
  watchEffect,
} from 'vue'

import type { NuGridCellEditorEmits, NuGridCellEditorProps, NuGridLookupItem } from '../../types'
import type { NuGridKeyboardContext } from '../../types/_internal'

import NuGridSelectMenu from '../../components/NuGridSelectMenu.vue'
import { nuGridDefaults } from '../../config/_internal'
import { ROUTER_PRIORITIES } from '../../types/_internal'

// Inject spreadsheet nav flag — when enabled, ArrowLeft/Right navigate between cells when menu is closed
const spreadsheetNavEnabled = inject<ComputedRef<boolean> | null>('nugrid-spreadsheet-nav', null)

defineOptions({ inheritAttrs: false })

const props = defineProps<NuGridCellEditorProps>()
const emit = defineEmits<NuGridCellEditorEmits>()

// Inject enterBehavior from grid context
const injectedEnterBehavior = inject<ComputedRef<string> | null>('nugrid-enter-behavior', null)

function getEnterBehavior() {
  return injectedEnterBehavior?.value ?? props.enterBehavior ?? 'default'
}

const containerRef = ref<HTMLElement | null>(null)
const selectMenuRef = ref<InstanceType<any> | null>(null)
let unregisterKeyboardHandler: (() => void) | null = null

// Access lookup config from column definition
const columnDef = computed(() => props.cell.column.columnDef)
const lookupConfig = computed(() => columnDef.value.lookup)

// Control dropdown open state
const isOpen = ref(false)

// Resolve items (static, reactive, or async)
const resolvedItems = ref<NuGridLookupItem[]>([])
const isLoading = ref(false)
const loadError = ref<string | null>(null)

// Load items on mount and when config changes
watchEffect(async () => {
  const config = lookupConfig.value
  if (!config?.items) {
    resolvedItems.value = []
    return
  }

  try {
    loadError.value = null

    if (typeof config.items === 'function') {
      // Async function
      isLoading.value = true
      resolvedItems.value = await config.items()
    } else if (isRef(config.items)) {
      // Reactive ref
      resolvedItems.value = config.items.value
    } else {
      // Static array
      resolvedItems.value = config.items
    }
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Failed to load items'
    resolvedItems.value = []
  } finally {
    isLoading.value = false
  }
})

// Computed config values with defaults from nuGridDefaults
const valueKey = computed(
  () => lookupConfig.value?.valueKey ?? nuGridDefaults.columnDefaults.lookup.valueKey,
)
const labelKey = computed(
  () => lookupConfig.value?.labelKey ?? nuGridDefaults.columnDefaults.lookup.labelKey,
)
const descriptionKey = computed(() => lookupConfig.value?.descriptionKey)
const searchable = computed(
  () => lookupConfig.value?.searchable ?? nuGridDefaults.columnDefaults.lookup.searchable,
)
const filterFields = computed(() => lookupConfig.value?.filterFields ?? [labelKey.value])
const placeholder = computed(
  () => lookupConfig.value?.placeholder ?? nuGridDefaults.columnDefaults.lookup.placeholder,
)
const clearable = computed(
  () => lookupConfig.value?.clearable ?? nuGridDefaults.columnDefaults.lookup.clearable,
)
const autoOpen = computed(
  () => lookupConfig.value?.autoOpen ?? nuGridDefaults.columnDefaults.lookup.autoOpen,
)
const createItem = computed(() => lookupConfig.value?.createItem ?? false)
const commitOnSelect = computed(() => lookupConfig.value?.commitOnSelect ?? false)

const valueJustChanged = ref(false) // Prevents exit when value is being changed via selection
const navigatingViaTab = ref(false) // Indicates Tab navigation in progress
const escapingMenu = ref(false) // Prevents exit when first Escape closes menu
const lastKeyPressed = ref<string | null>(null) // Tracks last key pressed to detect Enter-based exits
const lastKeyShift = ref(false) // Tracks Shift state of last key press

/** Dispatch Enter to the open listbox to commit the currently highlighted item */
function commitHighlightedItem() {
  const enterEvent = new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  })
  const trigger = containerRef.value?.querySelector(
    'button[aria-haspopup="listbox"]',
  ) as HTMLElement
  if (trigger) {
    const listboxId = trigger.getAttribute('aria-controls')
    if (listboxId) {
      const listbox = document.getElementById(listboxId)
      if (listbox) {
        listbox.dispatchEvent(enterEvent)
      }
    }
  }
}

function handleValueChange(value: any) {
  if (commitOnSelect.value) {
    // Immediately commit and exit edit mode
    emit('update:modelValue', value)
    // If navigating via Tab or arrow keys, let the navigation handler emit stopEditing with direction
    if (!navigatingViaTab.value) {
      nextTick(() => emit('stopEditing'))
    }
    return
  }

  // Set flag BEFORE emitting to ensure handleMenuClose sees it
  valueJustChanged.value = true
  emit('update:modelValue', value)

  // USelectMenu will close the menu itself after selection
  // Just reset the flag after a delay
  setTimeout(() => {
    valueJustChanged.value = false
  }, 100)
}

function handleCreate(value: string) {
  // Treat create as a value selection with the typed text
  handleValueChange(value)
}

function handleMenuClose(open: boolean) {
  // Special handling for Enter key - always exit edit mode after selection
  if (!open && lastKeyPressed.value === 'Enter') {
    const shiftHeld = lastKeyShift.value
    lastKeyPressed.value = null
    lastKeyShift.value = false
    setTimeout(() => {
      if (getEnterBehavior() === 'moveDown') {
        emit('update:isNavigating', true)

        emit('stopEditing', shiftHeld ? 'up' : 'down')
      } else if (getEnterBehavior() === 'moveCell') {
        emit('update:isNavigating', true)

        emit('stopEditing', shiftHeld ? 'previous' : 'next')
      } else {
        emit('stopEditing')
      }
    }, 100)
    return
  }

  if (!open && !valueJustChanged.value && !navigatingViaTab.value && !escapingMenu.value) {
    setTimeout(() => {
      emit('stopEditing')
    }, 100)
  }

  // Reset escape flag after menu closes
  if (!open && escapingMenu.value) {
    escapingMenu.value = false
  }
}

/**
 * Keyboard event handler for lookup editor
 * Manages dropdown open/close state and edit mode transitions
 *
 * Key behaviors:
 * - **Tab**: Closes menu if open, navigates to next/previous cell, exits edit mode
 * - **Escape**: Two-stage - first closes menu (stays in edit mode), second cancels editing
 * - **Space**: Opens menu when closed; when open, sets flag and passes through to USelectMenu for selection
 * - **ArrowDown/ArrowUp**: Programmatically clicks trigger to open menu with proper item highlighting
 * - **Enter**: When menu open, lets USelectMenu handle selection then exits edit mode; when closed, just exits
 *
 * Behavioral flags used:
 * - `valueJustChanged`: Prevents exit when value selection triggers menu close
 * - `navigatingViaTab`: Indicates Tab navigation is in progress
 * - `escapingMenu`: Prevents exit when Escape closes menu (first stage)
 * - `lastKeyPressed`: Detects Enter key to exit edit mode after selection
 */
function handleKeydown(ctx: NuGridKeyboardContext<any>) {
  const e = ctx.event

  // Track last key pressed for behavior coordination
  lastKeyPressed.value = e.key
  lastKeyShift.value = e.shiftKey

  if (e.key === 'Tab') {
    if (isOpen.value) {
      // Menu is open - select the highlighted item, then navigate
      navigatingViaTab.value = true
      const direction = e.shiftKey ? 'previous' : 'next'
      commitHighlightedItem()

      // Wait for selection to complete, then navigate
      setTimeout(() => {
        emit('update:isNavigating', true)
        emit('stopEditing', direction)
      }, 50)
    } else {
      // Menu already closed - just navigate
      emit('update:isNavigating', true)
      emit('stopEditing', e.shiftKey ? 'previous' : 'next')
    }
    return { handled: true, preventDefault: true, stopPropagation: true }
  }

  if (e.key === 'Escape') {
    if (isOpen.value) {
      // First escape: close the menu, stay in edit mode
      // Set flag to prevent handleMenuClose from exiting edit mode
      escapingMenu.value = true

      // Close the menu by dispatching Escape to the active element (uncontrolled mode)
      const activeEl = document.activeElement as HTMLElement
      if (activeEl) {
        const escapeEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          which: 27,
          bubbles: true,
          cancelable: true,
        })
        activeEl.dispatchEvent(escapeEvent)
      }

      return { handled: true, preventDefault: true, stopPropagation: true }
    } else {
      // Second escape: menu already closed, cancel editing

      emit('cancelEditing')
      return { handled: true, preventDefault: true, stopPropagation: true }
    }
  }

  // Handle Space
  if (e.key === ' ') {
    if (!isOpen.value) {
      // Menu closed - open it
      const trigger = containerRef.value?.querySelector('button, [tabindex]') as HTMLElement
      if (trigger) {
        trigger.click()
      }
      return { handled: true, preventDefault: true, stopPropagation: true }
    } else {
      // Menu is open - Space will select an item
      // Set flag BEFORE Space reaches USelectMenu to prevent exit on selection
      valueJustChanged.value = true
      // Let Space pass through to USelectMenu for selection
      return { handled: false }
    }
  }

  // Block page navigation keys - they don't make sense in a lookup editor
  // and allowing them through would cause focus/scroll issues
  if (e.key === 'PageUp' || e.key === 'PageDown') {
    return { handled: true, preventDefault: true, stopPropagation: true }
  }

  // Spreadsheet nav: ArrowLeft/Right navigate to adjacent cells
  if (spreadsheetNavEnabled?.value && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    if (!e.metaKey && !e.ctrlKey && !e.altKey) {
      const direction = e.key === 'ArrowRight' ? 'right' : 'left'
      if (isOpen.value) {
        // Commit the highlighted item before navigating
        navigatingViaTab.value = true
        commitHighlightedItem()
        setTimeout(() => {
          emit('update:isNavigating', true)
          emit('stopEditing', direction)
        }, 50)
      } else {
        emit('update:isNavigating', true)
        emit('stopEditing', direction)
      }
      return { handled: true, preventDefault: true, stopPropagation: true }
    }
  }

  // Handle arrow keys when menu is closed - trigger click to open with native handling
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    // Cmd/Ctrl+Arrow: commit and move focus by row
    if (e.metaKey || e.ctrlKey) {
      const direction = e.key === 'ArrowDown' ? 'down' : 'up'
      if (isOpen.value) {
        navigatingViaTab.value = true
        commitHighlightedItem()
        setTimeout(() => {
          emit('update:isNavigating', true)
          emit('stopEditing', direction)
        }, 50)
      } else {
        emit('update:isNavigating', true)
        emit('stopEditing', direction)
      }
      return { handled: true, preventDefault: true, stopPropagation: true }
    }
    if (!isOpen.value) {
      // Click the trigger to open dropdown with proper highlighting
      const trigger = containerRef.value?.querySelector('button, [tabindex]') as HTMLElement
      if (trigger) {
        trigger.click()
      }
      return { handled: true, preventDefault: true, stopPropagation: true }
    }
  }

  // Handle Enter
  if (e.key === 'Enter') {
    if (isOpen.value) {
      // Menu is open - let USelectMenu handle Enter to select the highlighted item
      // Don't prevent default or stop propagation
      // USelectMenu will select the item and close the menu
      // handleMenuClose will detect Enter was pressed and exit edit mode
      return { handled: false }
    } else {
      // Menu is closed - just exit edit mode
      if (getEnterBehavior() === 'moveDown') {
        emit('update:isNavigating', true)

        emit('stopEditing', e.shiftKey ? 'up' : 'down')
      } else if (getEnterBehavior() === 'moveCell') {
        emit('update:isNavigating', true)

        emit('stopEditing', e.shiftKey ? 'previous' : 'next')
      } else {
        emit('stopEditing')
      }
      return { handled: true, preventDefault: true, stopPropagation: true }
    }
  }

  return { handled: false }
}

/**
 * Register keyboard handler with the interaction router
 * Uses documentLevel: true to capture events on teleported dropdown elements
 */
function registerKeyboardHandler() {
  if (!props.interactionRouter || unregisterKeyboardHandler) return

  const cellId = props.cell.id
  const rowId = props.row.id

  unregisterKeyboardHandler = props.interactionRouter.registerKeyboardHandler({
    id: `lookup-editor-${rowId}-${cellId}`,
    priority: ROUTER_PRIORITIES.GUARD_MIN, // Highest priority - editors should handle keys first
    documentLevel: true, // Need document-level to capture events on teleported dropdown
    // No 'when' needed - handler is only registered while this editor is mounted
    handle: handleKeydown,
  })
}

function unregisterHandler() {
  if (unregisterKeyboardHandler) {
    unregisterKeyboardHandler()
    unregisterKeyboardHandler = null
  }
}

// Focus management
onMounted(() => {
  registerKeyboardHandler()

  if (props.shouldFocus) {
    nextTick(() => {
      const trigger = containerRef.value?.querySelector('button, [tabindex]') as HTMLElement
      trigger?.focus({ preventScroll: true })
    })
  }

  // Handle autoOpen setting - open dropdown after mount if enabled
  // For async items, wait until they're loaded before opening
  if (autoOpen.value) {
    const config = lookupConfig.value
    const isAsync = typeof config?.items === 'function'

    if (isAsync) {
      // Wait for items to load before opening
      const unwatch = watch(isLoading, (loading) => {
        if (!loading && resolvedItems.value.length > 0) {
          nextTick(() => {
            // Click trigger to open (uncontrolled mode)
            const trigger = containerRef.value?.querySelector('button, [tabindex]') as HTMLElement
            trigger?.click()
          })
          unwatch()
        }
      })
    } else {
      // Static or reactive items - open immediately
      nextTick(() => {
        // Click trigger to open (uncontrolled mode)
        const trigger = containerRef.value?.querySelector('button, [tabindex]') as HTMLElement
        trigger?.click()
      })
    }
  }
})

onUnmounted(() => {
  unregisterHandler()
})

// Watch shouldFocus prop
watch(
  () => props.shouldFocus,
  (shouldFocus) => {
    if (shouldFocus) {
      nextTick(() => {
        const trigger = containerRef.value?.querySelector('button, [tabindex]') as HTMLElement
        trigger?.focus({ preventScroll: true })
      })
    }
  },
)

// Note: highlightSelectedOnOpen prop handles highlighting internally in uncontrolled mode
</script>

<template>
  <div ref="containerRef" class="ml-0.5 w-full">
    <NuGridSelectMenu
      ref="selectMenuRef"
      :model-value="modelValue"
      :items="resolvedItems"
      :value-key="valueKey"
      :label-key="labelKey"
      :description-key="descriptionKey"
      :search-input="searchable"
      :filter-fields="filterFields"
      :placeholder="placeholder"
      :create-item="createItem || undefined"
      :loading="isLoading"
      :disabled="isLoading"
      :ui="{
        base: 'ring-2 ring-offset-0 outline-none focus:ring-2 focus:ring-offset-0',
        content: 'outline-none',
      }"
      highlight
      highlight-selected-on-open
      class="w-full outline-none"
      @update:model-value="handleValueChange"
      @create="handleCreate"
      @update:open="
        (open: boolean) => {
          isOpen = open
          handleMenuClose(open)
        }
      "
    >
      <template v-if="clearable && modelValue != null" #trailing>
        <UButton
          icon="i-lucide-x"
          size="xs"
          color="neutral"
          variant="ghost"
          class="size-4"
          @click.stop="handleValueChange(null)"
        />
      </template>
    </NuGridSelectMenu>

    <div v-if="loadError" class="mt-1 text-xs text-error">
      {{ loadError }}
    </div>
  </div>
</template>

<style scoped>
/* Prevent focus outline on dropdown container */
:deep([role='listbox']) {
  outline: none !important;
}

:deep([role='listbox']:focus) {
  outline: none !important;
}
</style>
