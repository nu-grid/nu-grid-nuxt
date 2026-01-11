import type { ComputedRef } from 'vue'
import type { NuGridProps } from '../../types'
import type { NuGridConfig } from '../../types/_internal'
import baseCheckboxTheme from '#build/ui/checkbox'
import { useAppConfig } from '#imports'
import { tv } from '@nuxt/ui/runtime/utils/tv.js'
import { twMerge } from 'tailwind-merge'
import { computed } from 'vue'
import { getTheme } from '../../themes'

/**
 * UI theme configuration for tables
 */
export function useNuGridUI(props: NuGridProps) {
  const appConfig = useAppConfig() as NuGridConfig['AppConfig']

  const ui = computed(() => {
    // Get theme from registry (with fallback to default)
    const themeName = props.theme || 'default'
    const themeDefinition = getTheme(themeName)

    if (!themeDefinition) {
      if (import.meta.dev) {
        console.warn(`[NuGrid] Theme "${themeName}" not found. Using "default" theme.`)
      }
      const defaultThemeDef = getTheme('default')!
      const virtualization = props.virtualization

      return tv({ extend: tv(defaultThemeDef.theme as any), ...(appConfig.ui?.table || {}) })({
        sticky: virtualization ? false : props.sticky,
        loading: props.loading,
        loadingColor: props.loadingColor,
        loadingAnimation: props.loadingAnimation,
        virtualize: !!virtualization,
      } as any)
    }

    const selectedTheme = themeDefinition.theme
    const virtualization = props.virtualization

    return tv({ extend: tv(selectedTheme as any), ...(appConfig.ui?.table || {}) })({
      sticky: virtualization ? false : props.sticky,
      loading: props.loading,
      loadingColor: props.loadingColor,
      loadingAnimation: props.loadingAnimation,
      virtualize: !!virtualization,
    } as any)
  })

  // Pre-merge checkbox theme with grid theme slots (computed once per theme change)
  const checkboxTheme = computed(() => {
    const themeName = props.theme || 'default'
    const themeDefinition = getTheme(themeName) || getTheme('default')!
    const selectedTheme = themeDefinition.theme

    return {
      ...baseCheckboxTheme,
      slots: {
        ...baseCheckboxTheme.slots,
        base: twMerge(baseCheckboxTheme.slots.base, selectedTheme.slots.checkboxBase),
        indicator: twMerge(
          baseCheckboxTheme.slots.indicator,
          selectedTheme.slots.checkboxIndicator,
        ),
        container: twMerge(
          baseCheckboxTheme.slots.container,
          selectedTheme.slots.checkboxContainer,
        ),
        icon: twMerge(baseCheckboxTheme.slots.icon, selectedTheme.slots.checkboxIcon),
      },
    }
  })

  return { ui, checkboxTheme }
}

// Export the inferred return type for use in type definitions
export type NuGridUIReturn = ReturnType<typeof useNuGridUI>
export type NuGridUISlots = NuGridUIReturn['ui'] extends ComputedRef<infer T> ? T : never
