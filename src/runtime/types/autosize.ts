/**
 * Type for nugrid-autosizefns injection
 * Provides column autosize functionality
 */
export interface NuGridAutosize {
  autoSizeColumns: (mode?: 'fitCell' | 'fitGrid') => void
  autoSizeColumn: (columnId: string) => void
}
