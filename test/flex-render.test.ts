import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import { NuGridFlexRender } from '../src/runtime/utils/flexRender'

/**
 * Tests for NuGridFlexRender — replacement for TanStack's FlexRender.
 *
 * TanStack reference (vue-table/src/index.ts):
 *   export const FlexRender = defineComponent({
 *     props: ['render', 'props'],
 *     setup: (props) => {
 *       return () => {
 *         if (typeof props.render === 'function' || typeof props.render === 'object') {
 *           return h(props.render, props.props)
 *         }
 *         return props.render
 *       }
 *     },
 *   })
 */

describe('NuGridFlexRender', () => {
  it('should render a plain string', () => {
    const wrapper = mount(NuGridFlexRender, {
      props: { render: 'Hello World', props: {} },
    })
    expect(wrapper.text()).toBe('Hello World')
  })

  it('should render a number', () => {
    const wrapper = mount(NuGridFlexRender, {
      props: { render: 42, props: {} },
    })
    expect(wrapper.text()).toBe('42')
  })

  it('should render a functional component', () => {
    const MyComponent = (props: { label: string }) => h('span', props.label)
    const wrapper = mount(NuGridFlexRender, {
      props: { render: MyComponent, props: { label: 'test-label' } },
    })
    expect(wrapper.find('span').text()).toBe('test-label')
  })

  it('should render a defineComponent object', () => {
    const MyComponent = defineComponent({
      props: { value: String },
      setup(props) {
        return () => h('div', { class: 'custom' }, props.value)
      },
    })
    const wrapper = mount(NuGridFlexRender, {
      props: { render: MyComponent, props: { value: 'obj-render' } },
    })
    expect(wrapper.find('.custom').text()).toBe('obj-render')
  })

  it('should pass props to function render', () => {
    const render = (props: { a: number; b: number }) => h('span', `${props.a + props.b}`)
    const wrapper = mount(NuGridFlexRender, {
      props: { render, props: { a: 3, b: 7 } },
    })
    expect(wrapper.find('span').text()).toBe('10')
  })

  it('should handle undefined render gracefully', () => {
    const wrapper = mount(NuGridFlexRender, {
      props: { render: undefined, props: {} },
    })
    expect(wrapper.text()).toBe('')
  })

  it('should handle null render gracefully', () => {
    const wrapper = mount(NuGridFlexRender, {
      props: { render: null, props: {} },
    })
    expect(wrapper.text()).toBe('')
  })
})
