/**
 * Return type interfaces for internal composables.
 * These explicit types solve TS4058 errors where TypeScript cannot name
 * 'GroupColumnDefBase' from @tanstack/table-core in generated declarations.
 *
 * By using these explicit return types, TypeScript emits our type names
 * instead of expanding TableColumn and encountering the unexported type.
 * @internal
 */
import type { TableData } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import type { ComputedRef } from 'vue'
import type { NuGridActionMenuOptions, NuGridColumn, NuGridRowSelectOptions } from '../index'

/**
 * Return type for useNuGridActionMenu composable
 * @internal
 */
export interface UseNuGridActionMenuReturn<T extends TableData> {
  isEnabled: ComputedRef<boolean>
  hasActionMenuColumn: ComputedRef<boolean>
  actionMenuColumn: NuGridColumn<T> | null
  appendActionMenuColumn: (columns: NuGridColumn<T>[]) => NuGridColumn<T>[]
  isHidden: ComputedRef<boolean>
  isInteractive: ComputedRef<boolean>
  parsedOptions: ComputedRef<NuGridActionMenuOptions<T> | null>
}

/**
 * Return type for useNuGridRowSelection composable
 * @internal
 */
export interface UseNuGridRowSelectionReturn<T extends TableData> {
  isEnabled: ComputedRef<boolean>
  hasSelectionColumn: ComputedRef<boolean>
  normalizedMode: ComputedRef<'single' | 'multi' | null>
  enableMultiRowSelection: ComputedRef<boolean>
  enableRowSelection: ComputedRef<boolean | ((row: Row<T>) => boolean)>
  selectionColumn: NuGridColumn<T> | null
  prependSelectionColumn: (columns: NuGridColumn<T>[]) => NuGridColumn<T>[]
  isHidden: ComputedRef<boolean>
  isInteractive: ComputedRef<boolean>
  rowSelectionEnabled: ComputedRef<((row: Row<T>) => boolean) | undefined>
  parsedOptions: ComputedRef<NuGridRowSelectOptions<T> | null>
}

/**
 * Return type for useNuGridColumns composable
 * @internal
 */
export interface UseNuGridColumnsReturn<T extends TableData> {
  columns: ComputedRef<NuGridColumn<T>[]>
  rowSelection: UseNuGridRowSelectionReturn<T> | null
  actionMenu: UseNuGridActionMenuReturn<T> | null
}
