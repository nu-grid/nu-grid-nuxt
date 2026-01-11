import type { NuGridThemeDefinition } from '../types/theme'
import { nuGridTheme } from './nuGridTheme'
import { nuGridThemeCompact } from './nuGridThemeCompact'

// Re-export themes for direct import
export { nuGridTheme } from './nuGridTheme'
export { nuGridThemeCompact } from './nuGridThemeCompact'

const themeRegistry = new Map<string, NuGridThemeDefinition>()

/**
 * Register a custom theme with NuGrid
 * @param theme - The theme definition to register
 */
export function registerTheme(theme: NuGridThemeDefinition) {
  themeRegistry.set(theme.name, theme)
}

/**
 * Get a registered theme by name
 * @param name - The theme name to retrieve
 * @returns The theme definition or undefined if not found
 */
export function getTheme(name: string): NuGridThemeDefinition | undefined {
  return themeRegistry.get(name)
}

/**
 * Get all available theme names
 * @returns Array of registered theme names
 */
export function getAvailableThemes(): string[] {
  return Array.from(themeRegistry.keys())
}

/**
 * Get all registered themes
 * @returns Array of theme definitions
 */
export function getAllThemes(): NuGridThemeDefinition[] {
  return Array.from(themeRegistry.values())
}

/**
 * Helper to create a custom NuGrid theme
 * Supports extending existing themes with slot/variant overrides
 *
 * @example
 * // Create a theme extending the compact theme
 * const oceanTheme = createNuGridTheme({
 *   name: 'ocean',
 *   displayName: 'Ocean Blue',
 *   baseTheme: 'compact',
 *   slots: {
 *     base: 'flex flex-col bg-cyan-50 dark:bg-cyan-950',
 *     th: 'flex shrink-0 items-stretch overflow-hidden p-0! group bg-cyan-100 dark:bg-cyan-900 ...',
 *   }
 * })
 */
export function createNuGridTheme(config: {
  /** Unique theme identifier */
  name: string
  /** Human-readable display name */
  displayName?: string
  /** Theme description */
  description?: string
  /** Base theme to extend (e.g., 'default', 'compact', or custom theme name) */
  baseTheme?: string
  /** Custom slot classes (merged with base theme) */
  slots?: Partial<Record<string, string>>
  /** Custom variants (merged with base theme) */
  variants?: Record<string, any>
  /** Custom compound variants (appended to base theme) */
  compoundVariants?: any[]
}): NuGridThemeDefinition {
  // Get base theme if specified
  let baseThemeObj: NuGridThemeDefinition['theme'] | undefined
  if (config.baseTheme) {
    const baseThemeDef = getTheme(config.baseTheme)
    if (baseThemeDef) {
      baseThemeObj = baseThemeDef.theme
    } else if (import.meta.dev) {
      console.warn(`[createNuGridTheme] Base theme "${config.baseTheme}" not found`)
    }
  }

  // Merge with base theme, filtering out undefined slot values
  const mergedSlots: Record<string, string> = {
    ...(baseThemeObj?.slots || {}),
  }

  // Only add defined slot values from config
  if (config.slots) {
    for (const [key, value] of Object.entries(config.slots)) {
      if (value !== undefined) {
        mergedSlots[key] = value
      }
    }
  }

  const theme: NuGridThemeDefinition['theme'] = {
    ...(baseThemeObj || {}),
    slots: mergedSlots,
    variants: {
      ...(baseThemeObj?.variants || {}),
      ...(config.variants || {}),
    },
    compoundVariants: [
      ...(baseThemeObj?.compoundVariants || []),
      ...(config.compoundVariants || []),
    ],
  }

  return {
    name: config.name,
    displayName: config.displayName || config.name,
    description: config.description,
    theme,
  }
}

// Register default theme
registerTheme({
  name: 'default',
  displayName: 'Default',
  description: 'Standard NuGrid theme with primary color accents and comfortable spacing',
  theme: nuGridTheme,
})

// Register compact theme
registerTheme({
  name: 'compact',
  displayName: 'Compact',
  description: 'Compact theme with blue accents and tighter spacing for data-dense displays',
  theme: nuGridThemeCompact,
})
