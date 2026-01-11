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
 * Augment AppConfig to include NuGrid theme configuration
 */
declare module 'nuxt/schema' {
  interface AppConfig {
    nuGrid?: {
      /** Custom themes to register */
      themes?: NuGridThemeConfig[]
    }
  }
}
