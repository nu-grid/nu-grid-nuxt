import type { ComponentConfig } from '@nuxt/ui'
import type { AppConfig } from 'nuxt/schema'

import type { nuGridTheme } from '../themes'

export type NuGridConfig = ComponentConfig<typeof nuGridTheme, AppConfig, 'table'>

// Re-export the UI slots type from useNuGridUI for convenience
export type { NuGridUISlots } from '../composables/_internal/useNuGridUI'

/**
 * Custom theme configuration for app.config.ts
 */
export interface NuGridThemeConfig {
  /** Unique theme identifier */
  name: string
  /** Human-readable display name */
  displayName?: string
  /** Theme description */
  description?: string
  /** Base theme to extend */
  baseTheme?: string
  /** Custom slot classes */
  slots?: Record<string, string>
  /** Custom variants */
  variants?: Record<string, any>
  /** Custom compound variants */
  compoundVariants?: any[]
}

/**
 * app.config.ts `nuGrid` key
 */
export interface NuGridAppConfig {
  /**
   * Theme for every grid that doesn't set its own `theme` prop.
   * Any registered theme name: 'default', 'compact', or one from `themes` / registerTheme().
   * @defaultValue 'default'
   */
  theme?: string
  /**
   * App-wide overrides applied on top of the selected theme and `ui.table`, in the same shape as
   * a Nuxt UI component's app.config entry. Covers NuGrid's own slots (resize handles, group
   * headers, focus, editing…) that `ui.table` doesn't know about. The `ui` prop still wins.
   */
  ui?: {
    slots?: Record<string, string>
    variants?: Record<string, any>
    compoundVariants?: any[]
  }
  /** Custom themes to register */
  themes?: NuGridThemeConfig[]
}

/**
 * Augment AppConfig to include NuGrid theme configuration
 */
declare module 'nuxt/schema' {
  interface AppConfig {
    nuGrid?: NuGridAppConfig
  }
}
