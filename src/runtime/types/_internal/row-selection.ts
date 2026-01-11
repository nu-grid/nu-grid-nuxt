/**
 * @internal
 */

import type { TableColumn, TableData } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import type { Ref } from 'vue'
import type { NuGridRowSelectOptions } from '../row-selection'

/**
 * Column definition overrides for the selection column
 * Excludes properties that are required for the selection column to function correctly
 * @internal
 */
export type NuGridSelectionColumnDef<T extends TableData = TableData> = Partial<
  Omit<TableColumn<T>, 'id' | 'header' | 'cell' | 'accessorFn' | 'meta' | 'cellDataType'>
>

/**
 * Meta data stored on the selection column
 * @internal
 */
export interface NuGridSelectionColumnMeta<T extends TableData = TableData> {
  selectionEnabled: boolean
  enabledRef?: Ref<boolean>
  rowSelectionEnabledRef?: Ref<((row: Row<T>) => boolean) | undefined>
}

/**
 * Row selection mode type - supports legacy boolean/'single'/'multi' or new options object
 * @internal
 */
export type NuGridRowSelectionMode<T extends TableData = TableData> =
  | boolean
  | 'single'
  | 'multi'
  | NuGridRowSelectOptions<T>
  | undefined
