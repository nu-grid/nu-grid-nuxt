/**
 * Theme definition for NuGrid
 */
export interface NuGridThemeDefinition {
  /** Unique theme identifier (used in theme prop) */
  name: string
  /** Human-readable display name */
  displayName?: string
  /** Theme description */
  description?: string
  /** The actual theme object (slots, variants, compoundVariants) */
  theme: {
    slots: Record<string, string>
    variants?: Record<string, any>
    compoundVariants?: any[]
    [key: string]: any
  }
}

/**
 * Theme prop type - accepts built-in theme names ('default', 'compact') or custom theme names
 */
export type NuGridTheme = 'default' | 'compact' | (string & {})
