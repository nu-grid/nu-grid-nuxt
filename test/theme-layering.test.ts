import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { NuGridProps } from '../src/runtime/types'

import { useNuGridUI } from '../src/runtime/composables/_internal/useNuGridUI'

/**
 * Theme resolution and layering, against the REAL tv() and theme registry. Only app.config is mocked,
 * so a wrong layer order or a dropped layer changes the classes these assertions read.
 *
 * Layers, lowest first: theme -> app.config ui.table -> app.config nuGrid.ui -> `ui` prop.
 */
const appConfig = vi.hoisted(() => ({ value: {} as Record<string, any> }))

// useAppConfig is a Nuxt auto-import; vi.mock('#imports') does not reach it in the nuxt environment.
mockNuxtImport('useAppConfig', () => () => appConfig.value)

const grid = (props: Partial<NuGridProps> = {}) =>
  useNuGridUI({ data: [], columns: [], ...props } as unknown as NuGridProps)

describe('theme resolution', () => {
  beforeEach(() => {
    appConfig.value = { ui: { table: {} } }
  })

  it('uses the default theme when neither the prop nor app.config names one', () => {
    const { ui } = grid()
    expect(ui.value.root()).not.toContain('nugrid-compact')
  })

  it('uses app.config nuGrid.theme for grids without a theme prop', () => {
    appConfig.value = { ui: { table: {} }, nuGrid: { theme: 'compact' } }
    const { ui } = grid()
    // The compact theme's root carries the marker its editor CSS is scoped to.
    expect(ui.value.root()).toContain('nugrid-compact')
  })

  it('lets the theme prop win over app.config', () => {
    appConfig.value = { ui: { table: {} }, nuGrid: { theme: 'compact' } }
    const { ui } = grid({ theme: 'default' })
    expect(ui.value.root()).not.toContain('nugrid-compact')
  })

  it('falls back to the default theme when app.config names an unknown one', () => {
    appConfig.value = { ui: { table: {} }, nuGrid: { theme: 'no-such-theme' } }
    const { ui } = grid()
    expect(ui.value.root()).toContain('overflow-auto')
    expect(ui.value.root()).not.toContain('nugrid-compact')
  })
})

describe('app.config nuGrid.ui layer', () => {
  it('adds classes to NuGrid-only slots on top of the theme', () => {
    appConfig.value = { ui: { table: {} }, nuGrid: { ui: { slots: { colResizer: 'marker-grid' } } } }
    const { ui } = grid()
    const resizer = ui.value.colResizer()
    expect(resizer).toContain('marker-grid')
    // The theme's own classes for that slot are still there.
    expect(resizer).toContain('col-resizer')
  })

  it('stacks on ui.table: both apply, and nuGrid.ui wins a conflict', () => {
    appConfig.value = {
      ui: { table: { slots: { th: 'marker-table text-left' } } },
      nuGrid: { ui: { slots: { th: 'marker-grid text-right' } } },
    }
    const { ui } = grid()
    const th = ui.value.th()
    expect(th).toContain('marker-table')
    expect(th).toContain('marker-grid')
    expect(th).toContain('text-right')
    expect(th).not.toContain('text-left')
  })

  it('leaves the result unchanged when nuGrid.ui is absent', () => {
    appConfig.value = { ui: { table: {} } }
    const without = grid().ui.value.th()
    appConfig.value = { ui: { table: {} }, nuGrid: {} }
    const withEmpty = grid().ui.value.th()
    expect(withEmpty).toBe(without)
  })

  it('accepts a replacer function, which receives the classes below it', () => {
    let received = ''
    appConfig.value = {
      ui: { table: {} },
      nuGrid: {
        ui: {
          slots: {
            colResizer: (defaults: string) => {
              received = defaults
              return 'marker-replaced'
            },
          },
        },
      },
    }
    const resizer = grid().ui.value.colResizer()
    expect(received).toContain('col-resizer')
    expect(resizer).toContain('marker-replaced')
    expect(resizer).not.toContain('col-resizer')
  })

  it('reaches the checkbox slots', () => {
    appConfig.value = { ui: { table: {} }, nuGrid: { ui: { slots: { checkboxBase: 'marker-checkbox' } } } }
    const { checkboxTheme } = grid()
    expect(checkboxTheme.value.slots.base).toContain('marker-checkbox')
  })
})
