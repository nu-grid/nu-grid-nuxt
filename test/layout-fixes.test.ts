import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'

import NuGrid from '../src/runtime/components/NuGrid.vue'

/**
 * Mounted end to end.
 *
 * Grouping: only the 'group' / 'splitgroup' layouts render groups. A grid given `grouping` and no
 * layout mode used to stay flat while the row model grouped, so it showed one row per group and no
 * group bands. It now picks 'group'. A grid that asks for a flat layout shows every row ungrouped.
 *
 * Compact fill: the compact theme's `w-max!` survived next to the fill mode's `w-full` (tailwind-merge
 * keeps an !important and a plain class apart), and the !important one won, so fill never filled.
 */
const rows = [
  { id: 'a', name: 'Ada', team: 'design' },
  { id: 'b', name: 'Bo', team: 'platform' },
  { id: 'c', name: 'Cy', team: 'platform' },
  { id: 'd', name: 'Di', team: 'design' },
]
const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'team', header: 'Team' },
]

const mount = (props: Record<string, unknown>) =>
  mountSuspended(NuGrid, { props: { data: rows, columns, rowId: 'id', ...props } as any })

const dataRowIds = (wrapper: Awaited<ReturnType<typeof mount>>) =>
  wrapper.findAll('[data-row-id]').map((r) => r.attributes('data-row-id')).filter((id) => rows.some((r) => r.id === id))

afterEach(() => vi.restoreAllMocks())

describe('grouping without a layout mode', () => {
  it('renders group bands and every row', async () => {
    const wrapper = await mount({ grouping: ['team'] })
    expect(wrapper.findAll('[data-group-header]').length).toBe(2)
    expect(new Set(dataRowIds(wrapper))).toEqual(new Set(['a', 'b', 'c', 'd']))
  })

  it("shows every row, ungrouped, when the layout is explicitly 'div', and warns", async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = await mount({ grouping: ['team'], layout: { mode: 'div' } })
    expect(wrapper.findAll('[data-group-header]').length).toBe(0)
    expect(new Set(dataRowIds(wrapper))).toEqual(new Set(['a', 'b', 'c', 'd']))
    expect(warn.mock.calls.some((c) => String(c[0]).includes("layout: { mode: 'group' }"))).toBe(true)
  })
})

describe("compact theme with autoSize 'fill'", () => {
  it('fills: the base takes w-full, not w-max', async () => {
    const wrapper = await mount({ theme: 'compact', layout: { autoSize: 'fill' } })
    const base = wrapper.find('.nugrid-compact').find('.flex-col')
    expect(base.classes()).toContain('w-full')
    expect(base.classes()).not.toContain('w-max')
    expect(base.classes()).not.toContain('w-max!')
  })
})
