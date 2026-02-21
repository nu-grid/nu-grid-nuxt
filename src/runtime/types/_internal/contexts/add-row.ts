import type { TableData } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import type { ComputedRef, Ref, VNode } from 'vue'

export type NuGridAddRowPosition = 'none' | 'top' | 'bottom'
export type NuGridAddRowState = 'idle' | 'focused' | 'editing'

export interface NuGridAddRowFinalizeResult {
  success: boolean
  messages?: string[]
}

export type NuGridAddRowIndicatorSlot<T extends TableData = TableData> = (props: {
  row: Row<T>
  text: string
}) => VNode[]

export interface NuGridAddRowContext<T extends TableData = TableData> {
  showAddNewRow: ComputedRef<boolean>
  addRowPosition: ComputedRef<NuGridAddRowPosition>
  addRowState: ComputedRef<NuGridAddRowState>
  addNewText: ComputedRef<string>
  indicatorSlot?: NuGridAddRowIndicatorSlot<T>
  isAddRowRow: (row: Row<T>) => boolean
  /** Check if a row is an empty group placeholder (used for emptyGroupValues feature) */
  isEmptyGroupPlaceholder: (row: Row<T>) => boolean
  finalizeAddRow: (row: Row<T>) => NuGridAddRowFinalizeResult
  resetAddRow: (row: Row<T>) => void
  isFinalizing?: Ref<boolean>
  finalizingRowId?: Ref<string | null>
  /** Version counter that increments when add row values change - used to trigger re-renders */
  valueVersion?: Ref<number>
  /** Increment the value version to trigger re-renders of add row cells */
  triggerValueUpdate?: () => void
  /** True while transitioning between add-row cells (pointerdown → click). Prevents blur from triggering finalization. */
  addRowTransitioning?: Ref<boolean>
}
