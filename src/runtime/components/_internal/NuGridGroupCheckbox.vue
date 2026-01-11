<script setup lang="ts">
import type theme from '#build/ui/checkbox'
import type { AppConfig } from '@nuxt/schema'
import type { CheckboxEmits, CheckboxProps, CheckboxSlots, ComponentConfig } from '@nuxt/ui'
import type { NuGridUIConfigContext } from '../../types/_internal'
import { useAppConfig } from '#imports'
import { tv } from '@nuxt/ui/runtime/utils/tv.js'
import { reactivePick } from '@vueuse/core'
import { CheckboxIndicator, CheckboxRoot, Label, Primitive, useForwardProps } from 'reka-ui'
import { computed, inject, useId } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<CheckboxProps>()

const emits = defineEmits<CheckboxEmits>()

const slots = defineSlots<CheckboxSlots>()

// Inject the pre-merged checkbox theme from NuGrid
const uiConfig = inject<NuGridUIConfigContext>('nugrid-ui-config', null as any)

type Checkbox = ComponentConfig<typeof theme, AppConfig, 'checkbox'>

const modelValue = defineModel<boolean | 'indeterminate'>({ default: undefined })

const appConfig = useAppConfig() as Checkbox['AppConfig']

const rootProps = useForwardProps(reactivePick(props, 'required', 'value', 'defaultValue'))

const {
  id: _id,
  emitFormChange,
  emitFormInput,
  size,
  color,
  name,
  disabled,
  ariaAttrs,
} = useFormField<CheckboxProps>(props)
const id = _id.value ?? useId()

const ui = computed(() => {
  // Use pre-merged checkbox theme from NuGrid context (includes default/compact theme)
  const mergedTheme = uiConfig?.checkboxTheme?.value

  return tv({
    extend: mergedTheme ? tv(mergedTheme) : undefined,
    ...(appConfig.ui?.checkbox || {}),
  })({
    size: size.value,
    color: color.value,
    variant: props.variant,
    indicator: props.indicator,
    required: props.required,
    disabled: disabled.value,
  })
})

function onUpdate(value: any) {
  // @ts-expect-error - 'target' does not exist in type 'EventInit'
  const event = new Event('change', { target: { value } })
  emits('change', event)
  emitFormChange()
  emitFormInput()
}
</script>

<!-- eslint-disable vue/no-template-shadow -->
<template>
  <Primitive
    :as="!variant || variant === 'list' ? as : Label"
    data-slot="root"
    :class="ui.root({ class: [props.ui?.root, props.class] })"
  >
    <div data-slot="container" :class="ui.container({ class: props.ui?.container })">
      <CheckboxRoot
        :id="id"
        v-bind="{ ...rootProps, ...$attrs, ...ariaAttrs }"
        v-model="modelValue"
        :name="name"
        :disabled="disabled"
        data-slot="base"
        :class="ui.base({ class: props.ui?.base })"
        @update:model-value="onUpdate"
      >
        <template #default="{ modelValue }">
          <CheckboxIndicator
            data-slot="indicator"
            :class="ui.indicator({ class: props.ui?.indicator })"
          >
            <UIcon
              v-if="modelValue === 'indeterminate'"
              :name="indeterminateIcon || appConfig.ui.icons.minus"
              data-slot="icon"
              :class="ui.icon({ class: props.ui?.icon })"
            />
            <UIcon
              v-else
              :name="icon || appConfig.ui.icons.check"
              data-slot="icon"
              :class="ui.icon({ class: props.ui?.icon })"
            />
          </CheckboxIndicator>
        </template>
      </CheckboxRoot>
    </div>

    <div
      v-if="label || !!slots.label || description || !!slots.description"
      data-slot="wrapper"
      :class="ui.wrapper({ class: props.ui?.wrapper })"
    >
      <component
        :is="!variant || variant === 'list' ? Label : 'p'"
        v-if="label || !!slots.label"
        :for="id"
        data-slot="label"
        :class="ui.label({ class: props.ui?.label })"
      >
        <slot name="label" :label="label">
          {{ label }}
        </slot>
      </component>
      <p
        v-if="description || !!slots.description"
        data-slot="description"
        :class="ui.description({ class: props.ui?.description })"
      >
        <slot name="description" :description="description">
          {{ description }}
        </slot>
      </p>
    </div>
  </Primitive>
</template>
