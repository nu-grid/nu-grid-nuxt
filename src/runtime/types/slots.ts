import type { Cell, Column, EngineRow, Row } from '../engine'

import type { NuGridCellContext, NuGridHeaderContext } from './column'
import type { TableData } from './table-data'

// ---------------------------------------------------------------------------
// Cell Slot Props (used by NuGridRow for #[columnId]-cell slots)
// ---------------------------------------------------------------------------

/**
 * Props passed to cell template slots (#[columnId]-cell)
 *
 * @example
 * ```vue
 * <NuGrid :columns="columns" :data="data">
 *   <template #name-cell="{ value, row }">
 *     <div class="flex items-center gap-2">
 *       <UAvatar :src="row.original.avatar" size="xs" />
 *       <span>{{ value }}</span>
 *     </div>
 *   </template>
 * </NuGrid>
 * ```
 */
export interface NuGridCellSlotProps<T> {
  /** Engine cell object */
  cell: Cell<T>
  /** Engine row object */
  row: Row<T>
  /** Engine column object */
  column: Column<T>
  /** Index of cell in the row */
  cellIndex: number
  /** Cell value (shortcut for cell.getValue()) */
  value: unknown
  /** Whether cell is currently in edit mode */
  isEditing: boolean
  /** Whether cell has validation error */
  isInvalid: boolean
}

// ---------------------------------------------------------------------------
// Component Slot Types (used by defineSlots<>() in Vue components)
// ---------------------------------------------------------------------------

/**
 * Slot type definitions for NuGrid components.
 * Uses NuGrid engine context types.
 */
export type NuGridSlots<T extends TableData = TableData> = {
  'expanded': (props: { row: EngineRow<T> }) => any
  'empty': (props?: {}) => any
  'loading': (props?: {}) => any
  'caption': (props?: {}) => any
  'body-top': (props?: {}) => any
  'body-bottom': (props?: {}) => any
  [key: string]: ((...args: any[]) => any) | undefined
} & Record<`${string}-header`, (props: NuGridHeaderContext<T>) => any>
  & Record<`${string}-footer`, (props: NuGridHeaderContext<T>) => any>
  & Record<`${string}-cell`, (props: NuGridCellContext<T>) => any>
