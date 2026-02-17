<!-- eslint-disable -->
<script lang="ts">
import type { AppConfig } from '@nuxt/schema'
import type {
  AcceptableValue,
  ArrayOrNested,
  AvatarProps,
  ButtonProps,
  ChipProps,
  ComponentConfig,
  EmitsToProps,
  GetItemKeys,
  GetItemValue,
  GetModelValue,
  GetModelValueEmits,
  IconProps,
  InputProps,
  LinkPropsKeys,
  NestedItem,
} from '@nuxt/ui'
import type {
  ComboboxArrowProps,
  ComboboxContentEmits,
  ComboboxContentProps,
  ComboboxRootEmits,
  ComboboxRootProps,
} from 'reka-ui'
import type { ButtonHTMLAttributes as VueButtonHTMLAttributes } from 'vue'
import theme from '#build/ui/select-menu'

// Internal types not exported from @nuxt/ui
type ButtonHTMLAttributes = Pick<
  VueButtonHTMLAttributes,
  | 'autofocus'
  | 'disabled'
  | 'form'
  | 'formaction'
  | 'formenctype'
  | 'formmethod'
  | 'formnovalidate'
  | 'formtarget'
  | 'name'
  | 'type'
>

interface ModelModifiers<T = any> {
  string?: string extends T ? boolean : never
  number?: number extends T ? boolean : never
  trim?: string extends T ? boolean : never
  lazy?: boolean
  nullable?: null extends T ? boolean : never
  optional?: boolean
}

interface UseComponentIconsProps {
  icon?: IconProps['name']
  avatar?: AvatarProps
  leading?: boolean
  leadingIcon?: IconProps['name']
  trailing?: boolean
  trailingIcon?: IconProps['name']
  loading?: boolean
  loadingIcon?: IconProps['name']
}

type SelectMenu = ComponentConfig<typeof theme, AppConfig, 'selectMenu'>

export type SelectMenuValue = AcceptableValue

export type SelectMenuItem =
  | SelectMenuValue
  | {
      label?: string
      description?: string
      icon?: IconProps['name']
      avatar?: AvatarProps
      chip?: ChipProps
      type?: 'label' | 'separator' | 'item'
      disabled?: boolean
      onSelect?: (e: Event) => void
      class?: any
      ui?: Pick<
        SelectMenu['slots'],
        | 'label'
        | 'separator'
        | 'item'
        | 'itemLeadingIcon'
        | 'itemLeadingAvatarSize'
        | 'itemLeadingAvatar'
        | 'itemLeadingChipSize'
        | 'itemLeadingChip'
        | 'itemWrapper'
        | 'itemLabel'
        | 'itemDescription'
        | 'itemTrailing'
        | 'itemTrailingIcon'
      >
      [key: string]: any
    }

export interface SelectMenuProps<
  T extends ArrayOrNested<SelectMenuItem> = ArrayOrNested<SelectMenuItem>,
  VK extends GetItemKeys<T> | undefined = undefined,
  M extends boolean = false,
>
  extends
    /* @vue-ignore */ Pick<
      ComboboxRootProps<T>,
      | 'open'
      | 'defaultOpen'
      | 'disabled'
      | 'name'
      | 'resetSearchTermOnBlur'
      | 'resetSearchTermOnSelect'
      | 'resetModelValueOnClear'
      | 'highlightOnHover'
      | 'by'
    >,
    /* @vue-ignore */ UseComponentIconsProps,
    /* @vue-ignore */ Omit<ButtonHTMLAttributes, 'type' | 'disabled' | 'name'> {
  id?: string
  placeholder?: string
  searchInput?: boolean | InputProps
  color?: SelectMenu['variants']['color']
  variant?: SelectMenu['variants']['variant']
  size?: SelectMenu['variants']['size']
  required?: boolean
  trailingIcon?: IconProps['name']
  selectedIcon?: IconProps['name']
  clear?: boolean | Partial<Omit<ButtonProps, LinkPropsKeys>>
  clearIcon?: IconProps['name']
  content?: Omit<ComboboxContentProps, 'as' | 'asChild' | 'forceMount'>
    & Partial<EmitsToProps<ComboboxContentEmits>>
  arrow?: boolean | Omit<ComboboxArrowProps, 'as' | 'asChild'>
  portal?: boolean | string | HTMLElement
  virtualize?:
    | boolean
    | {
        overscan?: number
        estimateSize?: number | ((index: number) => number)
      }
  valueKey?: VK
  labelKey?: GetItemKeys<T>
  descriptionKey?: GetItemKeys<T>
  items?: T
  defaultValue?: GetModelValue<T, VK, M>
  modelValue?: GetModelValue<T, VK, M>
  modelModifiers?: Omit<ModelModifiers<GetModelValue<T, VK, M>>, 'lazy'>
  multiple?: M & boolean
  highlight?: boolean
  /** When true, highlights the currently selected item when the dropdown opens (default: true) */
  highlightSelectedOnOpen?: boolean
  /** When true, Tab key closes the dropdown and selects the highlighted item (default: false) */
  closeOnTab?: boolean
  /** When true, dropdown opens automatically when the trigger receives focus (default: false) */
  openOnFocus?: boolean
  createItem?: boolean | 'always' | { position?: 'top' | 'bottom'; when?: 'empty' | 'always' }
  filterFields?: string[]
  ignoreFilter?: boolean
  autofocus?: boolean
  autofocusDelay?: number
  class?: any
  ui?: SelectMenu['slots']
}

export type SelectMenuEmits<
  A extends ArrayOrNested<SelectMenuItem>,
  VK extends GetItemKeys<A> | undefined,
  M extends boolean,
> = Pick<ComboboxRootEmits, 'update:open'> & {
  change: [event: Event]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  create: [item: string]
  clear: []
  highlight: [
    payload:
      | {
          ref: HTMLElement
          value: GetModelValue<A, VK, M>
        }
      | undefined,
  ]
} & GetModelValueEmits<A, VK, M>

type SlotProps<T extends SelectMenuItem> = (props: {
  item: T
  index: number
  ui: SelectMenu['ui']
}) => any

export interface SelectMenuSlots<
  A extends ArrayOrNested<SelectMenuItem> = ArrayOrNested<SelectMenuItem>,
  VK extends GetItemKeys<A> | undefined = undefined,
  M extends boolean = false,
  T extends NestedItem<A> = NestedItem<A>,
> {
  'leading': (props: {
    modelValue?: GetModelValue<A, VK, M>
    open: boolean
    ui: SelectMenu['ui']
  }) => any
  'default': (props: {
    modelValue?: GetModelValue<A, VK, M>
    open: boolean
    ui: SelectMenu['ui']
  }) => any
  'trailing': (props: {
    modelValue?: GetModelValue<A, VK, M>
    open: boolean
    ui: SelectMenu['ui']
  }) => any
  'empty': (props: { searchTerm?: string }) => any
  'item': SlotProps<T>
  'item-leading': SlotProps<T>
  'item-label': (props: { item: T; index: number }) => any
  'item-description': (props: { item: T; index: number }) => any
  'item-trailing': SlotProps<T>
  'content-top': (props?: {}) => any
  'content-bottom': (props?: {}) => any
  'create-item-label': (props: { item: string }) => any
}
</script>

<script
  setup
  lang="ts"
  generic="
    T extends ArrayOrNested<SelectMenuItem>,
    VK extends GetItemKeys<T> | undefined = undefined,
    M extends boolean = false
  "
>
/* eslint-disable import/first */
import { useAppConfig } from '#imports'
import { useComponentIcons } from '@nuxt/ui/composables/useComponentIcons'
import { useFieldGroup } from '@nuxt/ui/composables/useFieldGroup'
import { useFormField } from '@nuxt/ui/composables/useFormField'
import { useLocale } from '@nuxt/ui/composables/useLocale'
import { usePortal } from '@nuxt/ui/composables/usePortal'
import { compare, get, getDisplayValue, isArrayOfArray, looseToNumber } from '@nuxt/ui/utils'
import { tv } from '@nuxt/ui/utils/tv'
import { getEstimateSize } from '@nuxt/ui/utils/virtualizer'
import { createReusableTemplate, reactivePick } from '@vueuse/core'
import { defu } from 'defu'
import {
  ComboboxAnchor,
  ComboboxArrow,
  ComboboxCancel,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxVirtualizer,
  FocusScope,
  useFilter,
  useForwardPropsEmits,
} from 'reka-ui'
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  toRaw,
  toRef,
  useTemplateRef,
  watch,
} from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<SelectMenuProps<T, VK, M>>(), {
  portal: true,
  searchInput: true,
  labelKey: 'label',
  descriptionKey: 'description',
  resetSearchTermOnBlur: true,
  resetSearchTermOnSelect: true,
  resetModelValueOnClear: true,
  autofocusDelay: 0,
  virtualize: false,
  highlightSelectedOnOpen: true,
  closeOnTab: false,
  openOnFocus: false,
})
const emits = defineEmits<SelectMenuEmits<T, VK, M>>()
const slots = defineSlots<SelectMenuSlots<T, VK, M>>()

const searchTerm = defineModel<string>('searchTerm', { default: '' })

const { t } = useLocale()
const appConfig = useAppConfig() as SelectMenu['AppConfig']
const { contains } = useFilter({ sensitivity: 'base' })

const rootProps = useForwardPropsEmits(
  reactivePick(
    props,
    'modelValue',
    'defaultValue',
    'open',
    'defaultOpen',
    'required',
    'multiple',
    'resetSearchTermOnBlur',
    'resetSearchTermOnSelect',
    'resetModelValueOnClear',
    'highlightOnHover',
    'by',
  ),
  emits,
)
const portalProps = usePortal(toRef(() => props.portal))
const contentProps = toRef(
  () =>
    defu(props.content, {
      side: 'bottom',
      sideOffset: 4,
      collisionPadding: 8,
      position: 'popper',
    }) as ComboboxContentProps,
)
const arrowProps = toRef(() => props.arrow as ComboboxArrowProps)
const clearProps = computed(() =>
  typeof props.clear === 'object' ? props.clear : ({} as Partial<Omit<ButtonProps, LinkPropsKeys>>),
)

const virtualizerProps = toRef(() => {
  if (!props.virtualize) return false

  return defu(typeof props.virtualize === 'boolean' ? {} : props.virtualize, {
    estimateSize: getEstimateSize(
      filteredItems.value,
      selectSize.value || 'md',
      props.descriptionKey as string,
      !!slots['item-description'],
    ),
  })
})
const searchInputProps = toRef(
  () =>
    defu(props.searchInput, { placeholder: t('selectMenu.search'), variant: 'none' }) as InputProps,
)

const {
  emitFormBlur,
  emitFormFocus,
  emitFormInput,
  emitFormChange,
  size: formGroupSize,
  color,
  id,
  name,
  highlight,
  disabled,
  ariaAttrs,
} = useFormField<InputProps>(props)
const { orientation, size: fieldGroupSize } = useFieldGroup<InputProps>(props)
const { isLeading, isTrailing, leadingIconName, trailingIconName } = useComponentIcons(
  toRef(() => defu(props, { trailingIcon: appConfig.ui.icons.chevronDown })),
)

const selectSize = computed(() => fieldGroupSize.value || formGroupSize.value)

const [DefineCreateItemTemplate, ReuseCreateItemTemplate] = createReusableTemplate()
const [DefineItemTemplate, ReuseItemTemplate] = createReusableTemplate<{
  item: SelectMenuItem
  index: number
}>({
  props: {
    item: {
      type: [Object, String, Number, Boolean],
      required: true,
    },
    index: {
      type: Number,
      required: false,
    },
  },
})

const ui = computed(() =>
  tv({ extend: tv(theme), ...(appConfig.ui?.selectMenu || {}) })({
    color: color.value,
    variant: props.variant,
    size: selectSize?.value,
    loading: props.loading,
    highlight: highlight.value,
    leading: isLeading.value || !!props.avatar || !!slots.leading,
    trailing: isTrailing.value || !!slots.trailing,
    fieldGroup: orientation.value,
    virtualize: !!props.virtualize,
  }),
)

function displayValue(value: GetItemValue<T, VK> | GetItemValue<T, VK>[]): string | undefined {
  if (props.multiple && Array.isArray(value)) {
    const displayedValues = value
      .map((item) =>
        getDisplayValue<T[], GetItemValue<T, VK>>(items.value, item, {
          labelKey: props.labelKey,
          valueKey: props.valueKey,
          by: props.by,
        }),
      )
      .filter((v): v is string => v != null && v !== '')

    return displayedValues.length > 0 ? displayedValues.join(', ') : undefined
  }

  return getDisplayValue<T[], GetItemValue<T, VK>>(items.value, value as GetItemValue<T, VK>, {
    labelKey: props.labelKey,
    valueKey: props.valueKey,
    by: props.by,
  })
}

const groups = computed<SelectMenuItem[][]>(() =>
  props.items?.length ? (isArrayOfArray(props.items) ? props.items : [props.items]) : [],
)

const items = computed(() => groups.value.flatMap((group) => group) as T[])

const filteredGroups = computed(() => {
  if (props.ignoreFilter || !searchTerm.value) {
    return groups.value
  }

  const fields = Array.isArray(props.filterFields)
    ? props.filterFields
    : ([props.labelKey] as string[])

  return groups.value
    .map((items) =>
      items.filter((item) => {
        if (item === undefined || item === null) {
          return false
        }

        if (typeof item !== 'object') {
          return contains(String(item), searchTerm.value)
        }

        if (item.type && ['label', 'separator'].includes(item.type)) {
          return true
        }

        return fields.some((field) => {
          const value = get(item, field)
          return value !== undefined && value !== null && contains(String(value), searchTerm.value)
        })
      }),
    )
    .filter(
      (group) =>
        group.filter(
          (item) =>
            !isSelectItem(item) || !item.type || !['label', 'separator'].includes(item.type),
        ).length > 0,
    )
})
const filteredItems = computed(() => filteredGroups.value.flatMap((group) => group))

const createItem = computed(() => {
  if (!props.createItem || !searchTerm.value) {
    return false
  }

  const newItem = props.valueKey
    ? ({ [props.valueKey]: searchTerm.value } as NestedItem<T>)
    : searchTerm.value

  if (
    (typeof props.createItem === 'object' && props.createItem.when === 'always')
    || props.createItem === 'always'
  ) {
    return !filteredItems.value.find((item) =>
      compare(item, newItem, (props.by ?? props.valueKey) as string | undefined),
    )
  }

  return !filteredItems.value.length
})
const createItemPosition = computed(() =>
  typeof props.createItem === 'object' ? props.createItem.position : 'bottom',
)

const triggerRef = useTemplateRef('triggerRef')
const viewportRef = useTemplateRef('viewportRef')
const comboboxRootRef = useTemplateRef('comboboxRootRef')

// Track open state for Tab handling
const isOpen = ref(false)
// Prevent openOnFocus from firing when tabbing out
const isTabbing = ref(false)
// Track if focus came from pointer (mouse/touch) - don't auto-open on pointer focus
const focusFromPointer = ref(false)
// Track if dropdown just closed - prevent immediate reopen when focus returns
const justClosed = ref(false)

function autoFocus() {
  if (props.autofocus) {
    triggerRef.value?.$el?.focus({
      focusVisible: true,
    })
  }
}

/**
 * Handle Tab key to close dropdown and select highlighted item
 * Only active when closeOnTab prop is true and dropdown is open
 *
 * Like LookupEditor, we prevent default Tab and manually move focus after a delay
 * to ensure the dropdown is fully closed before focus moves
 */
function handleKeydown(e: KeyboardEvent) {
  if (e.key !== 'Tab') return

  // Only handle if this dropdown is open
  if (!isOpen.value) return

  // Set tabbing flag to prevent openOnFocus from reopening
  isTabbing.value = true

  // Prevent default Tab - we'll close the dropdown instead
  e.preventDefault()
  e.stopPropagation()

  // Dispatch Enter to select highlighted item and close dropdown
  // Dispatch to the active element (search input when open) where Reka UI handles key events
  const activeEl = document.activeElement as HTMLElement
  if (activeEl) {
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
    })
    activeEl.dispatchEvent(enterEvent)
  }

  // Reset tabbing flag after dropdown closes
  setTimeout(() => {
    isTabbing.value = false
  }, 150)
}

onMounted(() => {
  setTimeout(() => {
    autoFocus()
  }, props.autofocusDelay)

  // Add keydown handler for Tab if closeOnTab is enabled
  if (props.closeOnTab) {
    document.addEventListener('keydown', handleKeydown, true)
  }
})

onUnmounted(() => {
  if (props.closeOnTab) {
    document.removeEventListener('keydown', handleKeydown, true)
  }
})

// Watch for controlled open prop changes to highlight selected item
// This handles the case when parent controls open state (like LookupEditor)
watch(
  () => props.open,
  (newOpen) => {
    // Sync internal state with controlled prop
    isOpen.value = !!newOpen
    if (newOpen && props.highlightSelectedOnOpen) {
      // Use nextTick to ensure DOM is updated, then highlight
      nextTick(() => {
        highlightSelectedItem()
      })
    }
  },
)

function onUpdate(value: any) {
  if (toRaw(props.modelValue) === value) {
    return
  }

  if (props.modelModifiers?.trim) {
    value = value?.trim() ?? null
  }

  if (props.modelModifiers?.number) {
    value = looseToNumber(value)
  }

  if (props.modelModifiers?.nullable) {
    value ??= null
  }

  if (props.modelModifiers?.optional) {
    value ??= undefined
  }

  // @ts-expect-error - 'target' does not exist in type 'EventInit'
  const event = new Event('change', { target: { value } })
  emits('change', event)
  emitFormChange()
  emitFormInput()

  if (props.resetSearchTermOnSelect) {
    searchTerm.value = ''
  }
}

function onUpdateOpen(value: boolean) {
  // Track open state for Tab handling
  isOpen.value = value
  let timeoutId

  if (!value) {
    const event = new FocusEvent('blur')

    emits('blur', event)
    emitFormBlur()

    // Prevent openOnFocus from immediately reopening when focus returns to trigger
    justClosed.value = true
    setTimeout(() => {
      justClosed.value = false
    }, 150)

    // Since we use `displayValue` prop inside ComboboxInput we should reset searchTerm manually
    // https://reka-ui.com/docs/components/combobox#api-reference
    if (props.resetSearchTermOnBlur) {
      const STATE_ANIMATION_DELAY_MS = 100

      timeoutId = setTimeout(() => {
        searchTerm.value = ''
      }, STATE_ANIMATION_DELAY_MS)
    }
  } else {
    const event = new FocusEvent('focus')
    emits('focus', event)
    emitFormFocus()
    clearTimeout(timeoutId)

    // Highlight the selected item when dropdown opens
    if (props.highlightSelectedOnOpen) {
      highlightSelectedItem()
    }
  }
}

/**
 * Highlights the currently selected item in the dropdown.
 * Called when the dropdown opens to ensure the selected item is visible and highlighted.
 *
 * Uses ComboboxRoot's reactive highlightSelected() API which sets highlightedElement
 * through Vue's reactivity system, surviving any re-renders (unlike DOM manipulation
 * with setAttribute which gets overridden by Vue's reactive data-highlighted binding).
 */
function highlightSelectedItem(retryCount = 0) {
  const maxRetries = 10
  const delay = 50

  setTimeout(() => {
    const root = comboboxRootRef.value as any
    if (root?.highlightSelected) {
      root.highlightSelected()
      return
    }

    // Retry if ComboboxRoot ref or method not available yet
    if (retryCount < maxRetries) {
      highlightSelectedItem(retryCount + 1)
    }
  }, delay)
}

function onCreate(e: Event) {
  e.preventDefault()
  e.stopPropagation()

  emits('create', searchTerm.value)
}

function onSelect(e: Event, item: SelectMenuItem) {
  if (!isSelectItem(item)) {
    return
  }

  if (item.disabled) {
    e.preventDefault()
    return
  }

  item.onSelect?.(e)
}

function isSelectItem(item: SelectMenuItem): item is Exclude<SelectMenuItem, SelectMenuValue> {
  return typeof item === 'object' && item !== null
}

function isModelValueEmpty(modelValue: GetModelValue<T, VK, M>): boolean {
  if (props.multiple && Array.isArray(modelValue)) {
    return modelValue.length === 0
  }
  return modelValue === undefined || modelValue === null || modelValue === ''
}

function onClear() {
  emits('clear')
}

/**
 * Handle pointerdown on trigger - track that focus will come from pointer
 */
function onTriggerPointerdown() {
  focusFromPointer.value = true
}

/**
 * Handle focus on trigger - opens dropdown if openOnFocus is enabled
 * Only opens on keyboard focus (Tab), not mouse/pointer focus
 */
function onTriggerFocus() {
  // Only open on keyboard focus, not pointer focus, and not if just closed
  if (props.openOnFocus && !isTabbing.value && !focusFromPointer.value && !justClosed.value) {
    nextTick(() => {
      if (!isOpen.value) {
        triggerRef.value?.$el?.click()
      }
    })
  }
  // Reset pointer flag after focus is handled
  focusFromPointer.value = false
}

/**
 * Handle keyboard shortcuts on trigger to open dropdown
 * Space, Enter, ArrowDown, ArrowUp open the dropdown when closed
 */
function onTriggerKeydown(e: KeyboardEvent) {
  if (isOpen.value) return // Let Reka UI handle when open

  const openKeys = ['Enter', ' ', 'ArrowDown', 'ArrowUp']
  if (openKeys.includes(e.key)) {
    e.preventDefault()
    // Click the trigger to open - works in both controlled and uncontrolled modes
    triggerRef.value?.$el?.click()
  }
}

defineExpose({
  triggerRef: toRef(() => triggerRef.value?.$el as HTMLButtonElement),
  viewportRef: toRef(() => viewportRef.value),
  highlightSelectedItem,
})
</script>

<!-- eslint-disable vue/no-template-shadow -->
<template>
  <DefineCreateItemTemplate>
    <ComboboxItem
      data-slot="item"
      :class="ui.item({ class: props.ui?.item })"
      :value="searchTerm"
      @select="onCreate"
    >
      <span data-slot="itemLabel" :class="ui.itemLabel({ class: props.ui?.itemLabel })">
        <slot name="create-item-label" :item="searchTerm">
          {{ t('selectMenu.create', { label: searchTerm }) }}
        </slot>
      </span>
    </ComboboxItem>
  </DefineCreateItemTemplate>

  <DefineItemTemplate v-slot="{ item, index }">
    <ComboboxLabel
      v-if="isSelectItem(item) && item.type === 'label'"
      data-slot="label"
      :class="ui.label({ class: [props.ui?.label, item.ui?.label, item.class] })"
    >
      {{ get(item, props.labelKey as string) }}
    </ComboboxLabel>

    <ComboboxSeparator
      v-else-if="isSelectItem(item) && item.type === 'separator'"
      data-slot="separator"
      :class="ui.separator({ class: [props.ui?.separator, item.ui?.separator, item.class] })"
    />

    <ComboboxItem
      v-else
      data-slot="item"
      :class="
        ui.item({
          class: [
            props.ui?.item,
            isSelectItem(item) && item.ui?.item,
            isSelectItem(item) && item.class,
          ],
        })
      "
      :disabled="isSelectItem(item) && item.disabled"
      :value="props.valueKey && isSelectItem(item) ? get(item, props.valueKey as string) : item"
      @select="onSelect($event, item)"
    >
      <slot name="item" :item="item as NestedItem<T>" :index="index" :ui="ui">
        <slot name="item-leading" :item="item as NestedItem<T>" :index="index" :ui="ui">
          <UIcon
            v-if="isSelectItem(item) && item.icon"
            :name="item.icon"
            data-slot="itemLeadingIcon"
            :class="
              ui.itemLeadingIcon({ class: [props.ui?.itemLeadingIcon, item.ui?.itemLeadingIcon] })
            "
          />
          <UAvatar
            v-else-if="isSelectItem(item) && item.avatar"
            :size="
              (item.ui?.itemLeadingAvatarSize
                || props.ui?.itemLeadingAvatarSize
                || ui.itemLeadingAvatarSize()) as AvatarProps['size']
            "
            v-bind="item.avatar"
            data-slot="itemLeadingAvatar"
            :class="
              ui.itemLeadingAvatar({
                class: [props.ui?.itemLeadingAvatar, item.ui?.itemLeadingAvatar],
              })
            "
          />
          <UChip
            v-else-if="isSelectItem(item) && item.chip"
            :size="(props.ui?.itemLeadingChipSize || ui.itemLeadingChipSize()) as ChipProps['size']"
            inset
            standalone
            v-bind="item.chip"
            data-slot="itemLeadingChip"
            :class="
              ui.itemLeadingChip({ class: [props.ui?.itemLeadingChip, item.ui?.itemLeadingChip] })
            "
          />
        </slot>

        <span
          data-slot="itemWrapper"
          :class="
            ui.itemWrapper({
              class: [props.ui?.itemWrapper, isSelectItem(item) && item.ui?.itemWrapper],
            })
          "
        >
          <span
            data-slot="itemLabel"
            :class="
              ui.itemLabel({
                class: [props.ui?.itemLabel, isSelectItem(item) && item.ui?.itemLabel],
              })
            "
          >
            <slot name="item-label" :item="item as NestedItem<T>" :index="index">
              {{ isSelectItem(item) ? get(item, props.labelKey as string) : item }}
            </slot>
          </span>

          <span
            v-if="
              isSelectItem(item)
              && (get(item, props.descriptionKey as string) || !!slots['item-description'])
            "
            data-slot="itemDescription"
            :class="
              ui.itemDescription({
                class: [props.ui?.itemDescription, isSelectItem(item) && item.ui?.itemDescription],
              })
            "
          >
            <slot name="item-description" :item="item as NestedItem<T>" :index="index">
              {{ get(item, props.descriptionKey as string) }}
            </slot>
          </span>
        </span>

        <span
          data-slot="itemTrailing"
          :class="
            ui.itemTrailing({
              class: [props.ui?.itemTrailing, isSelectItem(item) && item.ui?.itemTrailing],
            })
          "
        >
          <slot name="item-trailing" :item="item as NestedItem<T>" :index="index" :ui="ui" />

          <ComboboxItemIndicator as-child>
            <UIcon
              :name="selectedIcon || appConfig.ui.icons.check"
              data-slot="itemTrailingIcon"
              :class="
                ui.itemTrailingIcon({
                  class: [
                    props.ui?.itemTrailingIcon,
                    isSelectItem(item) && item.ui?.itemTrailingIcon,
                  ],
                })
              "
            />
          </ComboboxItemIndicator>
        </span>
      </slot>
    </ComboboxItem>
  </DefineItemTemplate>

  <ComboboxRoot
    ref="comboboxRootRef"
    :id="id"
    v-slot="{ modelValue, open }"
    v-bind="{ ...rootProps, ...$attrs, ...ariaAttrs }"
    ignore-filter
    as-child
    :name="name"
    :disabled="disabled"
    @update:model-value="onUpdate"
    @update:open="onUpdateOpen"
  >
    <ComboboxAnchor as-child>
      <ComboboxTrigger
        ref="triggerRef"
        data-slot="base"
        :class="ui.base({ class: [props.ui?.base, props.class] })"
        tabindex="0"
        @pointerdown="onTriggerPointerdown"
        @focus="onTriggerFocus"
        @keydown="onTriggerKeydown"
      >
        <span
          v-if="isLeading || !!props.avatar || !!slots.leading"
          data-slot="leading"
          :class="ui.leading({ class: props.ui?.leading })"
        >
          <slot
            name="leading"
            :model-value="modelValue as GetModelValue<T, VK, M>"
            :open="open"
            :ui="ui"
          >
            <UIcon
              v-if="isLeading && leadingIconName"
              :name="leadingIconName"
              data-slot="leadingIcon"
              :class="ui.leadingIcon({ class: props.ui?.leadingIcon })"
            />
            <UAvatar
              v-else-if="!!props.avatar"
              :size="
                (props.ui?.itemLeadingAvatarSize
                  || ui.itemLeadingAvatarSize()) as AvatarProps['size']
              "
              v-bind="props.avatar"
              data-slot="itemLeadingAvatar"
              :class="ui.itemLeadingAvatar({ class: props.ui?.itemLeadingAvatar })"
            />
          </slot>
        </span>

        <slot :model-value="modelValue as GetModelValue<T, VK, M>" :open="open" :ui="ui">
          <template
            v-for="displayedModelValue in [displayValue(modelValue as GetModelValue<T, VK, M>)]"
            :key="displayedModelValue"
          >
            <span
              v-if="displayedModelValue !== undefined && displayedModelValue !== null"
              data-slot="value"
              :class="ui.value({ class: props.ui?.value })"
            >
              {{ displayedModelValue }}
            </span>
            <span
              v-else
              data-slot="placeholder"
              :class="ui.placeholder({ class: props.ui?.placeholder })"
            >
              {{ placeholder ?? '&nbsp;' }}
            </span>
          </template>
        </slot>

        <span
          v-if="isTrailing || !!slots.trailing || !!clear"
          data-slot="trailing"
          :class="ui.trailing({ class: props.ui?.trailing })"
        >
          <slot
            name="trailing"
            :model-value="modelValue as GetModelValue<T, VK, M>"
            :open="open"
            :ui="ui"
          >
            <ComboboxCancel
              v-if="!!clear && !isModelValueEmpty(modelValue as GetModelValue<T, VK, M>)"
              as-child
            >
              <UButton
                as="span"
                :icon="clearIcon || appConfig.ui.icons.close"
                :size="selectSize"
                variant="link"
                color="neutral"
                tabindex="-1"
                v-bind="clearProps"
                data-slot="trailingClear"
                :class="ui.trailingClear({ class: props.ui?.trailingClear })"
                @click.stop="onClear"
              />
            </ComboboxCancel>

            <UIcon
              v-else-if="trailingIconName"
              :name="trailingIconName"
              data-slot="trailingIcon"
              :class="ui.trailingIcon({ class: props.ui?.trailingIcon })"
            />
          </slot>
        </span>
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxPortal v-bind="portalProps">
      <ComboboxContent
        data-slot="content"
        :class="ui.content({ class: props.ui?.content })"
        v-bind="contentProps"
      >
        <FocusScope
          trapped
          data-slot="focusScope"
          :class="ui.focusScope({ class: props.ui?.focusScope })"
        >
          <slot name="content-top" />

          <ComboboxInput
            v-if="!!searchInput"
            v-model="searchTerm"
            :display-value="() => searchTerm"
            as-child
          >
            <UInput
              autofocus
              autocomplete="off"
              :size="selectSize"
              v-bind="searchInputProps"
              data-slot="input"
              :class="ui.input({ class: props.ui?.input })"
              @change.stop
            />
          </ComboboxInput>

          <ComboboxEmpty data-slot="empty" :class="ui.empty({ class: props.ui?.empty })">
            <slot name="empty" :search-term="searchTerm">
              {{ searchTerm ? t('selectMenu.noMatch', { searchTerm }) : t('selectMenu.noData') }}
            </slot>
          </ComboboxEmpty>

          <div
            ref="viewportRef"
            role="presentation"
            data-slot="viewport"
            :class="ui.viewport({ class: props.ui?.viewport })"
          >
            <template v-if="!!virtualize">
              <ReuseCreateItemTemplate v-if="createItem && createItemPosition === 'top'" />

              <ComboboxVirtualizer
                v-slot="{ option: item, virtualItem }"
                :options="filteredItems as any[]"
                :text-content="
                  (item) =>
                    isSelectItem(item) ? get(item, props.labelKey as string) : String(item)
                "
                v-bind="virtualizerProps"
              >
                <ReuseItemTemplate :item="item" :index="virtualItem.index" />
              </ComboboxVirtualizer>

              <ReuseCreateItemTemplate v-if="createItem && createItemPosition === 'bottom'" />
            </template>

            <template v-else>
              <ComboboxGroup
                v-if="createItem && createItemPosition === 'top'"
                data-slot="group"
                :class="ui.group({ class: props.ui?.group })"
              >
                <ReuseCreateItemTemplate />
              </ComboboxGroup>

              <ComboboxGroup
                v-for="(group, groupIndex) in filteredGroups"
                :key="`group-${groupIndex}`"
                data-slot="group"
                :class="ui.group({ class: props.ui?.group })"
              >
                <ReuseItemTemplate
                  v-for="(item, index) in group"
                  :key="`group-${groupIndex}-${index}`"
                  :item="item"
                  :index="index"
                />
              </ComboboxGroup>

              <ComboboxGroup
                v-if="createItem && createItemPosition === 'bottom'"
                data-slot="group"
                :class="ui.group({ class: props.ui?.group })"
              >
                <ReuseCreateItemTemplate />
              </ComboboxGroup>
            </template>
          </div>

          <slot name="content-bottom" />
        </FocusScope>

        <ComboboxArrow
          v-if="!!arrow"
          v-bind="arrowProps"
          data-slot="arrow"
          :class="ui.arrow({ class: props.ui?.arrow })"
        />
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
