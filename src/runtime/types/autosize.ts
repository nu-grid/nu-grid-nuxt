import type { Ref } from 'vue'

/**
 * Type for nugrid-autosizefns injection
 * Provides column autosize functionality
 */
export interface NuGridAutosize {
  autoSizeColumns: (mode?: 'content' | 'fill') => void
  autoSizeColumn: (columnId: string) => void
  /** Whether the initial autosize has completed (grid is ready to show) */
  autosizeReady: Ref<boolean>
}
