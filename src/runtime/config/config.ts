import type { TableData } from '@nuxt/ui'
import type { NuGridProps } from '../types'
import type { NuGridCreateConfigOptions } from '../types/_internal'
import { defu } from 'defu'
import { nuGridDefaults } from './_internal/options-defaults'
import { applyNuGridPreset } from './presets'

/**
 * Create a fully typed NuGrid configuration
 * This factory function helps with type inference and provides a convenient way to build configurations
 *
 * @example
 * // Create a config with a preset
 * const config = createNuGridConfig({
 *   preset: 'editable',
 *   config: {
 *     columns: myColumns,
 *     data: myData
 *   }
 * })
 *
 * @example
 * // Create a config from scratch
 * const config = createNuGridConfig({
 *   config: {
 *     columns: myColumns,
 *     data: myData,
 *     focus: { mode: 'cell' }
 *   }
 * })
 */
export function createNuGridConfig<T extends TableData = TableData>(
  options: NuGridCreateConfigOptions<T> = {},
): Partial<NuGridProps<T>> {
  const { preset, config = {} } = options

  const layers: Array<Partial<NuGridProps<T>>> = [nuGridDefaults as Partial<NuGridProps<T>>]

  if (preset) {
    layers.push(applyNuGridPreset<T>(preset))
  }

  layers.push(config)

  return mergeNuGridConfig<T>(...layers)
}

/**
 * Merge multiple NuGrid configurations
 * Later configurations override earlier ones
 *
 * @example
 * const base = { focus: { mode: 'cell' } }
 * const override = { focus: { retain: true } }
 * const merged = mergeNuGridConfig(base, override)
 * // Result: { focus: { mode: 'cell', retain: true } }
 */
export function mergeNuGridConfig<T extends TableData = TableData>(
  ...configs: Array<Partial<NuGridProps<T>>>
): Partial<NuGridProps<T>> {
  // Reverse order so later configs override earlier ones (defu gives priority to earlier args)
  return defu({}, ...configs.toReversed()) as Partial<NuGridProps<T>>
}

/**
 * Get default values for NuGrid configuration
 * Useful for documentation and understanding defaults
 */
export function getNuGridDefaults<T extends TableData = TableData>(): Partial<NuGridProps<T>> {
  return nuGridDefaults as Partial<NuGridProps<T>>
}
