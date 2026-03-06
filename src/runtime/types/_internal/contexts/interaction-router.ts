import type { TableData } from '../../table-data'
import type { NuGridInteractionRouter } from '../interaction-router'

export interface NuGridInteractionRouterContext<T extends TableData = TableData> {
  interactionRouter: NuGridInteractionRouter<T>
}
