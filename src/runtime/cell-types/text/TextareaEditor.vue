<script setup lang="ts">
import type { NuGridCellEditorEmits, NuGridCellEditorProps, NuGridShowErrors } from '../../types'
import type { NuGridCoreContext, NuGridValidationContext } from '../../types/_internal'
import type { ComputedRef } from 'vue'
import { computed, inject, ref } from 'vue'
import { useNuGridCellEditor } from '../../composables'
import { defaultValidationIcon } from '../../composables/_internal/useNuGridCellEditing'

defineOptions({ inheritAttrs: false })

const props = defineProps<NuGridCellEditorProps>()
const emit = defineEmits<NuGridCellEditorEmits>()

const textareaRef = ref<any>(null)
const isHovered = ref(false)

// Inject enterBehavior from grid context
const injectedEnterBehavior = inject<ComputedRef<string>>('nugrid-enter-behavior', null)

function getEnterBehavior() {
  return injectedEnterBehavior?.value ?? props.enterBehavior ?? 'default'
}

// Inject the core context for UI configuration
const coreContext = inject<NuGridCoreContext>('nugrid-core')!
// Inject validation context so error display toggle is reactive even without prop updates
const validationContext = inject<NuGridValidationContext | null>('nugrid-validation', null)

// Custom focus callback for UTextarea
function focusTextarea() {
  // UTextarea exposes the native element via textareaRef property
  const textarea =
    textareaRef.value?.textareaRef ?? textareaRef.value?.$el?.querySelector('textarea')
  if (textarea) {
    textarea.focus({ preventScroll: true })
    // Move cursor to end of text
    const len = textarea.value?.length ?? 0
    textarea.setSelectionRange(len, len)
  }
}

// Use the shared cell editor composable with custom focus callback
const { handleBlur } = useNuGridCellEditor(props, emit, textareaRef, focusTextarea)

/* eslint-disable vue/custom-event-name-casing -- Matches NuGridCellEditorEmits interface */
// Custom keydown handler for textarea (Enter creates new line, Cmd/Ctrl+Enter saves)
function handleKeydown(e: KeyboardEvent) {
  // For all keys (typing), stop propagation to prevent focus system interference
  e.stopPropagation()

  if (e.key === 'Enter') {
    // Cmd/Ctrl+Enter or Shift+Enter saves and exits
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      e.preventDefault()
      const behavior = getEnterBehavior()
      if (behavior === 'moveDown') {
        emit('update:isNavigating', true)
        emit('stop-editing', e.shiftKey ? 'up' : 'down')
      } else if (behavior === 'moveCell') {
        emit('update:isNavigating', true)
        emit('stop-editing', e.shiftKey ? 'previous' : 'next')
      } else {
        emit('stop-editing')
      }
    }
    // Plain Enter allows new line (default behavior)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    emit('cancel-editing')
  } else if (e.key === 'Tab') {
    e.preventDefault()
    emit('update:isNavigating', true)
    if (e.shiftKey) {
      emit('stop-editing', 'previous')
    } else {
      emit('stop-editing', 'next')
    }
  }
  // Note: Arrow keys are not intercepted to allow cursor movement within textarea
}
/* eslint-enable vue/custom-event-name-casing */

// Compute if there's a validation error to show
const hasError = computed(() => !!props.validationError)

// Resolve showErrors mode: always | hover | never
const resolveShowErrors = (value: unknown): NuGridShowErrors => {
  if (value === 'hover' || value === 'never' || value === 'always') return value
  return 'always'
}

const showErrorsMode = computed<NuGridShowErrors>(() => {
  if (props.showValidationErrors !== undefined) return resolveShowErrors(props.showValidationErrors)
  return resolveShowErrors(validationContext?.showErrors?.value)
})

const shouldShowPopover = computed(() => {
  if (!hasError.value) return false
  const mode = showErrorsMode.value
  if (mode === 'never') return false
  if (mode === 'hover') return isHovered.value
  return true
})

// Popover styling and error ring from theme
const popoverOuter = computed(() => coreContext.ui.value.validationPopoverContent?.())
const popoverInner = computed(() => coreContext.ui.value.validationPopoverInner?.())
const popoverUi = computed(() => ({ content: popoverOuter.value }))
const popoverIcon = computed(() => validationContext?.icon?.value ?? defaultValidationIcon)

// Focus is handled by the composable - no need for duplicate watch/onMounted
</script>

<template>
  <!-- @click.stop prevents cell click handler from firing when clicking inside textarea -->
  <UPopover :open="shouldShowPopover" :ui="popoverUi" class="size-full">
    <template #anchor>
      <div class="size-full" @click.stop>
        <UTextarea
          ref="textareaRef"
          :model-value="modelValue"
          :color="hasError ? 'error' : undefined"
          :rows="1"
          autoresize
          class="size-full"
          :ui="{ base: 'resize-none' }"
          @update:model-value="emit('update:modelValue', $event)"
          @pointerenter="isHovered = true"
          @pointerleave="isHovered = false"
          @blur="handleBlur"
          @keydown="handleKeydown"
        />
      </div>
    </template>
    <template #content>
      <div :class="[popoverInner, popoverOuter]">
        <UIcon :name="popoverIcon" class="size-3.5 shrink-0" />
        <span>{{ props.validationError }}</span>
      </div>
    </template>
  </UPopover>
</template>
