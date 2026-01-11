import type { NuGridShowErrors } from '../src/runtime/types'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import TextEditor from '../src/runtime/cell-types/text/TextEditor.vue'

const UPopoverStub = defineComponent({
  props: { open: { type: Boolean, default: false } },
  setup(props, { slots }) {
    return () =>
      h('div', { 'data-test': 'popover', 'data-open': props.open }, [
        slots.anchor?.(),
        slots.content?.(),
      ])
  },
})

const UInputStub = defineComponent({
  emits: ['pointerenter', 'pointerleave', 'blur', 'keydown', 'update:model-value'],
  props: { modelValue: { type: [String, Number, Boolean, Object], default: '' } },
  setup(props, { emit }) {
    return () =>
      h('input', {
        'data-test': 'input',
        'value': props.modelValue as any,
        'onPointerenter': () => emit('pointerenter'),
        'onPointerleave': () => emit('pointerleave'),
        'onBlur': () => emit('blur'),
        'onKeydown': (e: KeyboardEvent) => emit('keydown', e),
        'onInput': (e: Event) => emit('update:model-value', (e.target as HTMLInputElement).value),
      })
  },
})

const UIconStub = defineComponent({
  setup(_, { slots }) {
    return () => h('span', slots.default?.())
  },
})

function mockObservers() {
  const make = () => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() })
  globalThis.ResizeObserver = vi.fn().mockImplementation(function () {
    const impl = make()
    Object.setPrototypeOf(impl, ResizeObserver.prototype)
    return impl
  }) as unknown as typeof ResizeObserver
  globalThis.IntersectionObserver = vi.fn().mockImplementation(function () {
    const impl = make()
    Object.setPrototypeOf(impl, IntersectionObserver.prototype)
    return impl
  }) as unknown as typeof IntersectionObserver
}

beforeEach(() => {
  mockObservers()
})

function mountEditor(mode: NuGridShowErrors | boolean) {
  return mount(TextEditor, {
    props: {
      modelValue: '',
      cell: {} as any,
      row: {} as any,
      isNavigating: false,
      shouldFocus: false,
      validationError: 'err',
      showValidationErrors: mode as any,
    },
    global: {
      provide: {
        'nugrid-core': { ui: ref({ editorErrorRing: () => '' }) },
        'nugrid-validation': { showErrors: ref(mode as NuGridShowErrors) },
      },
      components: {
        UPopover: UPopoverStub,
        UInput: UInputStub,
        UIcon: UIconStub,
      },
      stubs: {
        'UPopover': UPopoverStub,
        'u-popover': UPopoverStub,
        'UInput': UInputStub,
        'u-input': UInputStub,
        'UIcon': UIconStub,
        'u-icon': UIconStub,
        'teleport': true,
      },
    },
  })
}

describe('textEditor validation popover modes', () => {
  it('shows popover always when mode is always', () => {
    const wrapper = mountEditor('always')
    expect(wrapper.find('[data-test="popover"]').attributes('data-open')).toBe('true')
  })

  it('never shows popover when mode is never', () => {
    const wrapper = mountEditor('never')
    expect(wrapper.find('[data-test="popover"]').attributes('data-open')).toBe('false')
  })

  it('shows popover on hover when mode is hover', async () => {
    const wrapper = mountEditor('hover')
    const popover = () => wrapper.find('[data-test="popover"]').attributes('data-open')
    expect(popover()).toBe('false')
    await wrapper.find('[data-test="input"]').trigger('pointerenter')
    await wrapper.vm.$nextTick()
    expect(popover()).toBe('true')
    await wrapper.find('[data-test="input"]').trigger('pointerleave')
    await wrapper.vm.$nextTick()
    expect(popover()).toBe('false')
  })

  it('treats legacy boolean true as always', () => {
    const wrapper = mountEditor(true)
    expect(wrapper.find('[data-test="popover"]').attributes('data-open')).toBe('true')
  })
})
