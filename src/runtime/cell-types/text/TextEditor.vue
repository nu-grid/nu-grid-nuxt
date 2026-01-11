<script setup lang="ts">
import type { NuGridCellEditorEmits, NuGridCellEditorProps, NuGridShowErrors } from '../../types'
import type { NuGridCoreContext, NuGridValidationContext } from '../../types/_internal'
import { computed, inject, ref } from 'vue'
import { useNuGridCellEditor } from '../../composables'
import { defaultValidationIcon } from '../../composables/_internal/useNuGridCellEditing'

defineOptions({ inheritAttrs: false })

const props = defineProps<NuGridCellEditorProps>()
const emit = defineEmits<NuGridCellEditorEmits>()

const inputRef = ref<{ inputRef: HTMLInputElement } | null>(null)
const isHovered = ref(false)

// Inject the core context for UI configuration
const coreContext = inject<NuGridCoreContext>('nugrid-core')!
// Inject validation context so error display toggle is reactive even without prop updates
const validationContext = inject<NuGridValidationContext | null>('nugrid-validation', null)

// Use the shared cell editor composable for focus management, keyboard handling, and blur handling
const { handleKeydown, handleBlur } = useNuGridCellEditor(props, emit, inputRef)

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
const errorUi = computed(() =>
  hasError.value ? { base: coreContext.ui.value.editorErrorRing() } : undefined,
)
</script>

<template>
  <UPopover :open="shouldShowPopover" :ui="popoverUi">
    <template #anchor>
      <UInput
        ref="inputRef"
        :model-value="modelValue"
        :color="hasError ? 'error' : undefined"
        :ui="errorUi"
        class="w-full pl-0.5!"
        @update:model-value="emit('update:modelValue', $event)"
        @pointerenter="isHovered = true"
        @pointerleave="isHovered = false"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />
    </template>
    <template #content>
      <div :class="[popoverInner, popoverOuter]">
        <UIcon :name="popoverIcon" class="size-3.5 shrink-0" />
        <span>{{ props.validationError }}</span>
      </div>
    </template>
  </UPopover>
</template>
