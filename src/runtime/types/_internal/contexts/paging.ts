import type { ComputedRef } from 'vue'

/**
 * Paging context
 * Provides paging state and controls to child components
 */
export interface NuGridPagingContext {
  /** Whether paging is enabled */
  enabled: ComputedRef<boolean>
  /** Current page size (rows per page) */
  pageSize: ComputedRef<number>
  /** Current page index (0-based) */
  pageIndex: ComputedRef<number>
  /** Total number of rows (after filtering, or from server in manual mode) */
  totalRows: ComputedRef<number>
  /** Total number of pages */
  totalPages: ComputedRef<number>
  /** Page size selector options */
  pageSizeOptions: ComputedRef<number[]>
  /** Whether to show the built-in paging panel */
  showPanel: ComputedRef<boolean>
  /** Whether auto page size is enabled */
  autoPageSize: ComputedRef<boolean>
  /** Whether server-side (manual) pagination is enabled */
  manualPagination: ComputedRef<boolean>
  /** Navigate to a specific page (0-based index) */
  setPageIndex: (index: number) => void
  /** Set the page size */
  setPageSize: (size: number) => void
  /** Navigate to the first page */
  firstPage: () => void
  /** Navigate to the last page */
  lastPage: () => void
  /** Navigate to the next page */
  nextPage: () => void
  /** Navigate to the previous page */
  previousPage: () => void
  /** Check if can go to next page */
  canNextPage: ComputedRef<boolean>
  /** Check if can go to previous page */
  canPreviousPage: ComputedRef<boolean>
}
