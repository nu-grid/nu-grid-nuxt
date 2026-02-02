<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

/**
 * Props for the standalone NuGridSearch component
 */
interface Props {
  /** The search query value (v-model) */
  modelValue?: string
  /** Placeholder text for the input */
  placeholder?: string
  /** Debounce delay in milliseconds */
  debounce?: number
  /** Whether to auto-focus the input on mount */
  autofocus?: boolean
  /** Show/hide the clear button */
  clearable?: boolean
  /** Icon to display (leading icon) */
  icon?: string
  /** Icon for the clear button */
  clearIcon?: string
  /** Size variant matching Nuxt UI */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Loading state (shows spinner instead of search icon) */
  loading?: boolean
  /** Disabled state */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Search...',
  debounce: 300,
  autofocus: false,
  clearable: true,
  icon: 'i-lucide-search',
  clearIcon: 'i-lucide-x',
  size: 'sm',
  loading: false,
  disabled: false,
})

const emit = defineEmits<{
  /** Emitted immediately on input change */
  'update:modelValue': [value: string]
  /** Emitted after debounce completes */
  'search': [value: string]
  /** Emitted when clear button is clicked */
  'clear': []
}>()

// Ref for input element
const inputRef = ref<{ inputRef: HTMLInputElement } | null>(null)

// Local value for immediate feedback
const localValue = ref(props.modelValue ?? '')

// Sync from external modelValue changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (localValue.value !== newValue) {
      localValue.value = newValue ?? ''
    }
  },
)

// Debounced emit for search event
const debouncedSearch = useDebounceFn((value: string) => {
  emit('search', value)
}, computed(() => props.debounce))

// Handle input changes
function handleInput(value: string | number) {
  const strValue = String(value ?? '')
  localValue.value = strValue
  emit('update:modelValue', strValue)
  debouncedSearch(strValue)
}

// Clear search
function handleClear() {
  localValue.value = ''
  emit('update:modelValue', '')
  emit('search', '')
  emit('clear')
  focus()
}

// Handle escape key
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && localValue.value) {
    handleClear()
    event.preventDefault()
  }
}

// Whether clear button should show
const showClearButton = computed(() => props.clearable && localValue.value.length > 0)

// Public method to focus the input
function focus() {
  inputRef.value?.inputRef?.focus()
}

// Expose methods for parent components
defineExpose({ focus })
</script>

<template>
  <div class="nugrid-search relative flex items-center">
    <UInput
      ref="inputRef"
      :model-value="localValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :size="size"
      :autofocus="autofocus"
      class="w-full min-w-[200px]"
      @update:model-value="handleInput"
      @keydown="handleKeydown"
    >
      <template #leading>
        <slot name="leading">
          <UIcon
            v-if="loading"
            name="i-lucide-loader-2"
            class="animate-spin text-muted"
          />
          <UIcon v-else :name="icon" class="text-muted" />
        </slot>
      </template>
      <template #trailing>
        <slot name="trailing">
          <UButton
            v-if="showClearButton"
            :icon="clearIcon"
            color="neutral"
            variant="ghost"
            size="xs"
            :padded="false"
            @click.stop="handleClear"
          />
        </slot>
      </template>
    </UInput>
  </div>
</template>
