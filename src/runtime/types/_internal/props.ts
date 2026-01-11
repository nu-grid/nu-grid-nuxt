/**
 * @internal
 */

import type { TableData } from '@nuxt/ui'
import type { NuGridProps } from '../props'

/**
 * Available NuGrid preset configurations
 * - 'readOnly': Read-only grid with basic navigation
 * - 'editable': Editable grid with validation and editing features
 * - 'kanban': Kanban-style grid with drag-and-drop
 * - 'forms': Form-like grid optimized for data entry
 * - 'analytics': Analytics-focused grid with virtualization
 * @internal
 */
export type NuGridPreset = 'readOnly' | 'editable' | 'kanban' | 'forms' | 'analytics'

/**
 * Preset options configuration
 * @internal
 */
export type { NuGridPresetOptions } from '../props'

/**
 * Options for creating NuGrid configuration
 * @internal
 */
export interface NuGridCreateConfigOptions<T extends TableData = TableData> {
  preset?: NuGridPreset
  config?: Partial<NuGridProps<T>>
}
