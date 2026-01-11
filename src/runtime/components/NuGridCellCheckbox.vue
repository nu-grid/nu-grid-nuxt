<script setup lang="ts">
import type theme from '#build/ui/checkbox'
import type { ComponentConfig } from '@nuxt/ui'
import type { AppConfig } from 'nuxt/schema'
import type { NuGridUIConfigContext } from '../types/_internal'
import { useAppConfig } from '#imports'
import { tv } from '@nuxt/ui/runtime/utils/tv.js'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { computed, inject, nextTick, ref, useId } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    interactive?: boolean
  }>(),
  {
    disabled: false,
    interactive: false,
  },
)

const emit = defineEmits<{
  keydown: [event: KeyboardEvent]
  blur: [event: FocusEvent]
}>()

// Inject the pre-merged checkbox theme from NuGrid
const uiConfig = inject<NuGridUIConfigContext>('nugrid-ui-config', null as any)

const modelValue = defineModel<boolean | 'indeterminate'>({ required: true })

type Checkbox = ComponentConfig<typeof theme, AppConfig, 'checkbox'>

const appConfig = useAppConfig() as Checkbox['AppConfig']
const checkboxRef = ref<InstanceType<typeof CheckboxRoot> | null>(null)
const id = useId()
const showFocusRing = ref(false)
const isMouseInteraction = ref(false)

const ui = computed(() => {
  // Use pre-merged checkbox theme from NuGrid context (includes default/compact theme)
  const mergedTheme = uiConfig?.checkboxTheme?.value

  return tv({
    extend: mergedTheme ? tv(mergedTheme) : undefined,
    ...(appConfig.ui?.checkbox || {}),
  })({
    size: 'md',
    color: 'primary',
    disabled: props.disabled,
  })
})

const onUpdate = (value: boolean | 'indeterminate') => {
  if (!props.disabled && props.interactive) {
    modelValue.value = value
  }
}

const handleMouseDown = () => {
  isMouseInteraction.value = true
}

const handleClick = (event: MouseEvent) => {
  if (props.interactive) {
    event.stopPropagation()
  }
}

const handleFocus = () => {
  showFocusRing.value = !isMouseInteraction.value
  isMouseInteraction.value = false
}

const handleBlur = (event: FocusEvent) => {
  showFocusRing.value = false
  emit('blur', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
}

defineExpose({
  focus: () => {
    nextTick(() => {
      const element = document.getElementById(id)
      if (element instanceof HTMLElement) {
        element.focus({ preventScroll: true })
      }
    })
  },
})
</script>

<template>
  <div class="flex h-full w-full items-center justify-center">
    <div :class="ui.container()">
      <!-- Wrapper for custom focus ring controlled by keyboard/mouse detection -->
      <div
        :class="[
          'inline-flex rounded-sm',
          interactive
            && showFocusRing
            && 'outline-2 outline-offset-2 outline-primary-500 dark:outline-primary-400',
          !interactive && 'cursor-default',
        ]"
      >
        <CheckboxRoot
          :id="id"
          ref="checkboxRef"
          v-bind="$attrs"
          :model-value="modelValue"
          :disabled="disabled || !interactive"
          :class="[ui.base(), !interactive && 'pointer-events-none cursor-default!']"
          @update:model-value="onUpdate"
          @mousedown="handleMouseDown"
          @focus="handleFocus"
          @blur="handleBlur"
          @keydown="handleKeydown"
          @click="handleClick"
        >
          <template #default>
            <CheckboxIndicator :class="ui.indicator()">
              <UIcon
                :name="
                  modelValue === 'indeterminate'
                    ? appConfig.ui.icons.minus
                    : appConfig.ui.icons.check
                "
                :class="ui.icon()"
              />
            </CheckboxIndicator>
          </template>
        </CheckboxRoot>
      </div>
    </div>
  </div>
</template>
