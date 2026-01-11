import type { TableData } from '@nuxt/ui'
import type { Table } from '@tanstack/vue-table'
import type { ComputedRef, MaybeRef, ShallowRef } from 'vue'
import type { NuGridColumn } from '../../types'
import type { ExcelExportOptions, GroupedExcelExportOptions } from '../../utils/excelExport'
import { defu } from 'defu'

// Dynamic import to avoid SSR issues with write-excel-file (uses navigator.userAgent)
const getExcelExport = () => import('../../utils/excelExport')

export interface UseNuGridExcelOptions<T = any> {
  /**
   * Reference to the NuGrid component
   */
  tableRef: ShallowRef<{ tableApi: Table<T> } | null | undefined>

  /**
   * Column definitions for the grid
   */
  columns: MaybeRef<NuGridColumn<any>[]>

  /**
   * Default export options
   */
  defaultOptions?: ExcelExportOptions
}

export interface UseNuGridExcelReturn {
  /**
   * Export the grid data to an Excel file
   */
  exportExcel: (options?: ExcelExportOptions) => Promise<void>

  /**
   * Export grouped grid data to an Excel file with group headers
   */
  exportGroupedExcel: (options?: GroupedExcelExportOptions) => Promise<void>

  /**
   * Whether export is available (table API exists)
   */
  canExport: ComputedRef<boolean>
}

/**
 * Composable for exporting NuGrid data to Excel
 *
 * @example
 * ```vue
 * <script setup>
 * const table = useTemplateRef('table')
 * const columns = ref([...])
 *
 * const { exportExcel, canExport } = useNuGridExcel({
 *   tableRef: table,
 *   columns,
 *   defaultOptions: { filename: 'my-export' }
 * })
 * </script>
 *
 * <template>
 *   <UButton @click="exportExcel()" :disabled="!canExport">
 *     Export to Excel
 *   </UButton>
 *   <NuGrid ref="table" :columns="columns" :data="data" />
 * </template>
 * ```
 */
export function useNuGridExcel<T extends TableData>(
  options: UseNuGridExcelOptions<T>,
): UseNuGridExcelReturn {
  const { tableRef, columns, defaultOptions = {} } = options

  const canExport: ComputedRef<boolean> = computed(() => {
    return !!tableRef.value?.tableApi
  })

  const exportExcel = async (exportOptions: ExcelExportOptions = {}): Promise<void> => {
    const tableApi = tableRef.value?.tableApi
    if (!tableApi) {
      console.warn('Cannot export: table API not available')
      return
    }

    const resolvedColumns = unref(columns) as NuGridColumn<T>[]

    // Merge options with defu (exportOptions override defaultOptions)
    const mergedOptions = defu(exportOptions, defaultOptions)

    // Dynamic import to avoid SSR issues
    const { exportToExcel } = await getExcelExport()
    await exportToExcel(tableApi, resolvedColumns, mergedOptions)
  }

  const exportGroupedExcel = async (
    exportOptions: GroupedExcelExportOptions = {},
  ): Promise<void> => {
    const tableApi = tableRef.value?.tableApi
    if (!tableApi) {
      console.warn('Cannot export: table API not available')
      return
    }

    const resolvedColumns = unref(columns) as NuGridColumn<T>[]

    // Merge options with defu (exportOptions override defaultOptions)
    const mergedOptions = defu(exportOptions, defaultOptions)

    // Dynamic import to avoid SSR issues
    const { exportGroupedToExcel } = await getExcelExport()
    await exportGroupedToExcel(tableApi, resolvedColumns, mergedOptions)
  }

  return {
    exportExcel,
    exportGroupedExcel,
    canExport,
  }
}
