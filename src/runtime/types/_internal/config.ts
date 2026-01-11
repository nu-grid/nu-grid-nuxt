/**
 * @internal
 */

import type { ComponentConfig } from '@nuxt/ui'
import type { AppConfig } from 'nuxt/schema'
import type { nuGridTheme } from '../../themes'

/**
 * NuGrid component configuration type
 * @internal
 */
export type NuGridConfig = ComponentConfig<typeof nuGridTheme, AppConfig, 'table'>

/**
 * UI slots type - re-exported from useNuGridUI for convenience
 * @internal
 */
export type { NuGridUISlots } from '../../composables/_internal/useNuGridUI'
