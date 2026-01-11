import type { TableData } from '@nuxt/ui'
import type { NuGridPreset, NuGridPresetOptions } from '../types/_internal'
import { defu } from 'defu'

/**
 * Preset configurations for common NuGrid use cases.
 * Only values that differ from nuGridDefaults are specified.
 * The config factory uses defu() to merge presets with defaults.
 */
const presets: Record<NuGridPreset, NuGridPresetOptions<TableData>> = {
  /**
   * Read-only grid with row navigation, no editing
   */
  readOnly: {
    focus: { mode: 'row' },
    editing: { enabled: false },
  },

  /**
   * Full-featured editable grid with cell navigation,
   * sticky headers, and auto-sizing columns
   */
  editable: {
    focus: { mode: 'cell', retain: true },
    editing: { enabled: true },
    layout: { stickyHeaders: true, autoSize: 'fitCell' },
  },

  /**
   * Kanban-style grouped grid with row navigation
   * and minimal keyboard editing triggers
   */
  kanban: {
    focus: { mode: 'row' },
    editing: { enabled: true, startKeys: 'minimal' },
    layout: { mode: 'group', stickyHeaders: true },
  },

  /**
   * Form-like grid optimized for data entry with
   * single-click editing and first/last navigation
   */
  forms: {
    focus: { mode: 'cell', retain: true, cmdArrows: 'firstlast', pageStep: 5 },
    editing: { enabled: true, startClicks: 'single' },
    validation: { validateOn: 'blur' },
    layout: { scrollbars: 'native', autoSize: 'fitGrid', maintainWidth: true },
  },

  /**
   * Analytics grid optimized for large read-only datasets
   * with virtualization and sticky headers
   */
  analytics: {
    focus: { mode: 'row' },
    editing: { enabled: false },
    virtualization: { estimateSize: 50, overscan: 20, dynamicRowHeights: false },
    layout: { stickyHeaders: true },
  },
}

/**
 * Get preset configuration for a given preset name
 * @param preset The preset name
 * @returns Configuration object for the preset
 */
export function getNuGridPreset<T extends TableData = TableData>(
  preset: NuGridPreset,
): NuGridPresetOptions<T> {
  return presets[preset] as NuGridPresetOptions<T>
}

/**
 * Apply a preset with optional overrides
 * @param preset The preset name
 * @param overrides Optional configuration overrides
 * @returns Merged configuration
 */
export function applyNuGridPreset<T extends TableData = TableData>(
  preset: NuGridPreset,
  overrides?: Partial<NuGridPresetOptions<T>>,
): NuGridPresetOptions<T> {
  const baseConfig = getNuGridPreset<T>(preset)

  if (!overrides) {
    return baseConfig
  }

  // Overrides take priority over base preset (defu gives priority to earlier args)
  return defu({}, overrides, baseConfig) as NuGridPresetOptions<T>
}
