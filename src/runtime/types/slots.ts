import type { Cell, Column, Row } from '@tanstack/vue-table'

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
  /** TanStack cell object */
  cell: Cell<T, unknown>
  /** TanStack row object */
  row: Row<T>
  /** TanStack column definition */
  column: Column<T, unknown>
  /** Index of cell in the row */
  cellIndex: number
  /** Cell value (shortcut for cell.getValue()) */
  value: unknown
  /** Whether cell is currently in edit mode */
  isEditing: boolean
  /** Whether cell has validation error */
  isInvalid: boolean
}
