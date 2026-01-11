import type { TableData } from '@nuxt/ui'
import type { NuGridInteractionRouter } from '../interaction-router'

export interface NuGridInteractionRouterContext<T extends TableData = TableData> {
  interactionRouter: NuGridInteractionRouter<T>
}
