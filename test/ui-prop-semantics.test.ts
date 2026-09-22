import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'

import NuGrid from '../src/runtime/components/NuGrid.vue'

/**
 * The `ui` prop follows Nuxt UI's rules on every slot: a class value merges with the theme's classes,
 * a function (Nuxt UI's SlotClassReplacer) receives the theme's classes and its result replaces them.
 *
 * Mounted end to end on the scrollbar slot, whose classes land on the grid's root element. The slot
 * used to bypass tv(), so this also guards against a call site dropping back to hand-rolled handling.
 */
const data = [{ id: 1, name: 'Ada' }]
const columns = [{ accessorKey: 'name', header: 'Name' }]

const rootClasses = async (ui: Record<string, unknown>) => {
  // The scrollbar theme applies in 'hover' mode (layout.scrollbars); other modes use fixed classes.
  const wrapper = await mountSuspended(NuGrid, {
    props: { data, columns, ui, layout: { scrollbars: 'hover' } } as any,
  })
  const root = wrapper.find('[data-slot="root"]').exists()
    ? wrapper.find('[data-slot="root"]')
    : wrapper.find('.overflow-auto')
  return root.classes()
}

describe('ui prop semantics', () => {
  it('merges a class value with the theme classes', async () => {
    const classes = await rootClasses({ scrollbar: 'marker-merged' })
    expect(classes).toContain('marker-merged')
    // The default theme's scrollbar classes are still there.
    expect(classes).toContain('scrollbar-thin')
  })

  it('lets a function replace the theme classes, and hands it the defaults', async () => {
    let received = ''
    const classes = await rootClasses({
      scrollbar: (defaults: string) => {
        received = defaults
        return 'marker-replaced'
      },
    })
    expect(received).toContain('scrollbar-thin')
    expect(classes).toContain('marker-replaced')
    expect(classes).not.toContain('scrollbar-thin')
  })
})
