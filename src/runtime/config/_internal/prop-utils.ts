import type { ComputedRef } from 'vue'
import type {
  NuGridAnimationOptions,
  NuGridEditingOptions,
  NuGridFocusOptions,
  NuGridLayoutOptions,
  NuGridMultiRowOptions,
  NuGridPagingOptions,
  NuGridSelectionOptions,
  NuGridTooltipOptions,
  NuGridValidationOptions,
} from '../../types'
import type { NuGridVirtualizerOptions } from '../../types/_internal/virtualization'
import { computed } from 'vue'
import { nuGridDefaults } from './options-defaults'

/**
 * Mapping from defaults keys to their corresponding config types.
 * Keys must match nuGridDefaults - TypeScript will error if they diverge.
 */
type OptionsTypeMap = {
  [K in keyof typeof nuGridDefaults]: K extends 'focus'
    ? NuGridFocusOptions
    : K extends 'editing'
      ? NuGridEditingOptions
      : K extends 'validation'
        ? NuGridValidationOptions
        : K extends 'rowSelection'
          ? NuGridSelectionOptions
          : K extends 'layout'
            ? NuGridLayoutOptions
            : K extends 'virtualization'
              ? NuGridVirtualizerOptions
              : K extends 'tooltip'
                ? NuGridTooltipOptions
                : K extends 'multiRow'
                  ? NuGridMultiRowOptions
                  : K extends 'animation'
                    ? NuGridAnimationOptions
                    : K extends 'paging'
                      ? NuGridPagingOptions
                      : never
}

// Only include keys that have a config type mapping (excludes 'theme', etc.)
type DefaultsKey = {
  [K in keyof OptionsTypeMap]: OptionsTypeMap[K] extends never ? never : K
}[keyof OptionsTypeMap]

type DefaultsGroup<K extends DefaultsKey> = NonNullable<(typeof nuGridDefaults)[K]>

/**
 * Type-safe accessor for nuGridDefaults groups.
 * Returns the defaults with proper typing (NonNullable).
 */
export function getDefaults<K extends DefaultsKey>(key: K): DefaultsGroup<K> {
  return nuGridDefaults[key] as DefaultsGroup<K>
}

/**
 * Normalize prop value that may be a boolean shorthand
 * - `true` → use defaults (return undefined so defaults are used)
 * - `false` → disabled (handled specially per prop)
 * - object → use the object's values
 */
function normalizePropGroup(propValue: unknown): Record<string, unknown> | undefined {
  if (propValue === true) {
    // Boolean true means "enable with defaults" - return empty object to use all defaults
    return {}
  }
  if (propValue === false || propValue === undefined || propValue === null) {
    // Disabled or not set
    return undefined
  }
  if (typeof propValue === 'object') {
    return propValue as Record<string, unknown>
  }
  return undefined
}

/**
 * Creates a computed ref that extracts a prop value with fallback to nuGridDefaults.
 * Defaults are automatically sourced from the centralized nuGridDefaults.
 *
 * Supports boolean shorthand for props like `editing: true` which means
 * "enable editing with default settings".
 *
 * @param props - The props object (reactive)
 * @param group - The defaults group key (e.g., 'focus', 'editing', 'validation')
 * @param key - The key to extract from the prop group
 * @returns ComputedRef with the resolved value
 *
 * @example
 * const focusMode = usePropWithDefault(props, 'focus', 'mode')
 * const enableEditing = usePropWithDefault(props, 'editing', 'enabled')
 */
export function usePropWithDefault<
  G extends DefaultsKey,
  K extends keyof OptionsTypeMap[G] & keyof DefaultsGroup<G>,
>(props: Record<string, any>, group: G, key: K): ComputedRef<NonNullable<OptionsTypeMap[G][K]>> {
  const defaults = nuGridDefaults[group] as DefaultsGroup<G>
  return computed(() => {
    const normalized = normalizePropGroup(props[group])
    return (normalized?.[key as string] ?? defaults[key]) as NonNullable<OptionsTypeMap[G][K]>
  })
}

/**
 * Creates multiple computed refs for a prop group with defaults from nuGridDefaults.
 * Useful when extracting several properties from the same group.
 *
 * Supports boolean shorthand for props like `editing: true` which means
 * "enable editing with default settings".
 *
 * @param props - The props object (reactive)
 * @param group - The defaults group key
 * @param keys - Array of keys to extract
 * @returns Object with computed refs for each key
 *
 * @example
 * const { mode, cmdArrows } = usePropsWithDefaults(
 *   props,
 *   'focus',
 *   ['mode', 'cmdArrows']
 * )
 */
export function usePropsWithDefaults<
  G extends DefaultsKey,
  K extends keyof OptionsTypeMap[G] & keyof DefaultsGroup<G>,
>(
  props: Record<string, any>,
  group: G,
  keys: K[],
): { [P in K]: ComputedRef<NonNullable<OptionsTypeMap[G][P]>> } {
  const defaults = nuGridDefaults[group] as DefaultsGroup<G>
  const result = {} as { [P in K]: ComputedRef<NonNullable<OptionsTypeMap[G][P]>> }
  for (const key of keys) {
    result[key] = computed(() => {
      const normalized = normalizePropGroup(props[group])
      return (normalized?.[key as string] ?? defaults[key]) as NonNullable<OptionsTypeMap[G][K]>
    })
  }
  return result
}
