/**
 * NuGridFlexRender — replacement for TanStack's FlexRender component.
 *
 * Renders dynamic content that can be a string, number, function (functional component),
 * or object (defineComponent). This is the universal renderer for column def templates
 * (cell, header, footer renderers).
 */
import { defineComponent, h } from 'vue'

export { NuGridFlexRender as FlexRender }

export const NuGridFlexRender = defineComponent({
  name: 'NuGridFlexRender',
  props: ['render', 'props'],
  setup(props: { render: any; props: any }) {
    return () => {
      if (
        typeof props.render === 'function'
        || typeof props.render === 'object'
      ) {
        return h(props.render, props.props)
      }
      return props.render
    }
  },
})
