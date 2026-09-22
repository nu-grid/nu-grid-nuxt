import type { ComputedRef } from 'vue'

import { tv } from '@nuxt/ui/runtime/utils/tv.js'
import { twMerge } from 'tailwind-merge'
import { computed } from 'vue'

import baseCheckboxTheme from '#build/ui/checkbox'
import { useAppConfig } from '#imports'

import type { NuGridProps } from '../../types'
import type { NuGridConfig } from '../../types/_internal'
import type { NuGridAppConfig } from '../../types/config'

import { getTheme } from '../../themes'

/**
 * UI theme configuration for tables
 */
export function useNuGridUI(props: NuGridProps) {
  // Typed as NuGrid's config so `ui` keeps NuGrid's own slots. Since Nuxt UI 4.11 its AppConfig
  // type no longer overlaps NuGrid's extended table config, so the assertion goes through unknown;
  // at runtime it is the same object.
  const appConfig = useAppConfig() as unknown as NuGridConfig['AppConfig']
  // NuGrid's own app.config key, read with its declared shape (see types/config.ts).
  const gridConfig = (): NuGridAppConfig | undefined => (appConfig as { nuGrid?: NuGridAppConfig }).nuGrid

  // Theme choice: the grid's `theme` prop, else app.config `nuGrid.theme`, else 'default'.
  const themeName = computed(() => props.theme || gridConfig()?.theme || 'default')

  const themeDefinition = computed(() => {
    const found = getTheme(themeName.value)
    if (!found && import.meta.dev) {
      console.warn(`[NuGrid] Theme "${themeName.value}" not found. Using "default" theme.`)
    }
    return found || getTheme('default')!
  })

  /**
   * Layers, lowest first:
   *   1. the selected theme (registered via registerTheme or app.config nuGrid.themes)
   *   2. app.config ui.table   — shared with Nuxt UI's UTable, so a grid styles like a table
   *   3. app.config nuGrid.ui  — app-wide overrides for NuGrid, including its own slots
   *   4. the `ui` prop         — applied per slot by the components
   */
  const ui = computed(() => {
    const withTable = tv({ extend: tv(themeDefinition.value.theme as any), ...(appConfig.ui?.table || {}) })
    const gridOverrides = gridConfig()?.ui
    // Extending adds classes; it never removes slots, so the result has withTable's shape.
    const layered = (
      gridOverrides ? tv({ extend: withTable, ...gridOverrides } as any) : withTable
    ) as typeof withTable
    const virtualization = props.virtualization

    return layered({
      sticky: virtualization ? false : props.sticky,
      loading: props.loading,
      loadingColor: props.loadingColor,
      loadingAnimation: props.loadingAnimation,
      virtualize: !!virtualization,
    } as any)
  })

  // Pre-merge checkbox theme with grid theme slots (computed once per theme change).
  // app.config nuGrid.ui can override the checkbox slots too, after the theme.
  const checkboxTheme = computed(() => {
    const themeSlots = themeDefinition.value.theme.slots
    const appSlots = (gridConfig()?.ui?.slots || {}) as Record<string, string | undefined>
    const slot = (base: string, themeKey: string) =>
      twMerge(base, themeSlots[themeKey as keyof typeof themeSlots], appSlots[themeKey])

    return {
      ...baseCheckboxTheme,
      slots: {
        ...baseCheckboxTheme.slots,
        base: slot(baseCheckboxTheme.slots.base, 'checkboxBase'),
        indicator: slot(baseCheckboxTheme.slots.indicator, 'checkboxIndicator'),
        container: slot(baseCheckboxTheme.slots.container, 'checkboxContainer'),
        icon: slot(baseCheckboxTheme.slots.icon, 'checkboxIcon'),
      },
    }
  })

  return { ui, checkboxTheme }
}

// Export the inferred return type for use in type definitions
export type NuGridUIReturn = ReturnType<typeof useNuGridUI>
export type NuGridUISlots = NuGridUIReturn['ui'] extends ComputedRef<infer T> ? T : never
