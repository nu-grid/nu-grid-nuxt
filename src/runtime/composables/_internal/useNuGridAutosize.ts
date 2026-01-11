import type { TableData } from '@nuxt/ui'
import type { Table } from '@tanstack/vue-table'
import type { Ref } from 'vue'

import type { NuGridProps } from '../../types'
import { useDebounceFn } from '@vueuse/core'
import { nextTick, watch } from 'vue'
import { usePropWithDefault } from '../../config/_internal'

/**
 * Autosize functionality for tables similar to AG Grid
 * Supports two modes:
 * - fitCell: Auto-size columns to fit cell contents
 * - fitGrid: Auto-size columns to fit cell contents and scale up to fill grid width
 */
export function useNuGridAutosize<T extends TableData>(
  props: NuGridProps<T>,
  tableApi: Table<T>,
  tableRef: Ref<HTMLElement | null>,
) {
  /**
   * Measure the actual content width of a single column using a pre-created measurement element
   * @internal
   */
  function measureSingleColumnWidth(columnId: string, measureDiv: HTMLDivElement): number {
    let maxWidth = 0

    const column = tableApi.getColumn(columnId)
    if (!column) return 150

    const headerGroups = tableApi.getHeaderGroups()
    headerGroups.forEach((headerGroup) => {
      const header = headerGroup.headers.find((h) => h.column.id === columnId)
      if (header) {
        let headerText = ''
        if (typeof header.column.columnDef.header === 'string') {
          headerText = header.column.columnDef.header
        } else if (header.column.id) {
          headerText = header.column.id
        }

        if (headerText) {
          measureDiv.textContent = headerText
          const width = measureDiv.offsetWidth + 64
          maxWidth = Math.max(maxWidth, width)
        }
      }
    })

    const rows = tableApi.getRowModel().rows
    const sampleSize = Math.min(rows.length, 100)

    for (let i = 0; i < sampleSize; i++) {
      const row = rows[i]
      if (!row) continue

      const cell = row.getVisibleCells().find((c) => c.column.id === columnId)
      if (cell) {
        const value = cell.getValue()
        let cellText = ''

        if (value !== null && value !== undefined) {
          cellText = String(value)
        }

        if (cellText) {
          measureDiv.textContent = cellText
          const width = measureDiv.offsetWidth + 48
          maxWidth = Math.max(maxWidth, width)
        }
      }
    }

    return maxWidth || 150
  }

  function measureAllColumnsContentWidth(columnIds: string[]): Record<string, number> {
    if (!tableRef.value) return {}

    const measureDiv = document.createElement('div')
    measureDiv.style.cssText =
      'position: absolute; visibility: hidden; height: auto; width: auto; white-space: nowrap;'
    document.body.appendChild(measureDiv)

    const widths: Record<string, number> = {}

    try {
      for (const columnId of columnIds) {
        widths[columnId] = measureSingleColumnWidth(columnId, measureDiv)
      }
    } finally {
      document.body.removeChild(measureDiv)
    }

    return widths
  }

  /**
   * Measure the actual content width of a column by examining all visible cells
   * @deprecated Use measureAllColumnsContentWidth for batch measurements
   */
  function measureColumnContentWidth(columnId: string, _columnIndex: number): number {
    if (!tableRef.value) return 0

    // Create a temporary div to measure text width
    const measureDiv = document.createElement('div')
    measureDiv.style.cssText =
      'position: absolute; visibility: hidden; height: auto; width: auto; white-space: nowrap;'
    document.body.appendChild(measureDiv)

    try {
      return measureSingleColumnWidth(columnId, measureDiv)
    } finally {
      document.body.removeChild(measureDiv)
    }
  }

  const autoSize = usePropWithDefault(props, 'layout', 'autoSize')

  function autoSizeColumns(mode?: 'fitCell' | 'fitGrid') {
    const effectiveMode = mode || autoSize.value
    if (!effectiveMode || !tableRef.value) return

    const visibleColumns = tableApi.getVisibleLeafColumns()
    const skipColumns = props.skipAutoSizeColumns || []
    const newSizing: Record<string, number> = {}

    const columnsToMeasure = visibleColumns
      .filter((column) => !skipColumns.includes(column.id))
      .map((column) => column.id)

    const measuredWidths = measureAllColumnsContentWidth(columnsToMeasure)

    const columnWidths = visibleColumns.map((column) => {
      if (skipColumns.includes(column.id)) {
        return { id: column.id, width: column.getSize(), skip: true }
      }

      const minSize = column.columnDef.minSize ?? 20
      const maxSize = column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER
      const measuredWidth = measuredWidths[column.id] || 150
      const constrainedWidth = Math.max(minSize, Math.min(measuredWidth, maxSize))

      return { id: column.id, width: constrainedWidth, skip: false }
    })

    const totalContentWidth = columnWidths.reduce((sum, col) => sum + col.width, 0)

    if (effectiveMode === 'fitGrid' && tableRef.value) {
      const containerWidth = tableRef.value.offsetWidth

      // If content is smaller than container, scale up proportionally
      if (totalContentWidth < containerWidth && totalContentWidth > 0) {
        const scaleFactor = containerWidth / totalContentWidth

        columnWidths.forEach((col) => {
          if (!col.skip) {
            const column = tableApi.getColumn(col.id)
            if (column) {
              const scaledWidth = col.width * scaleFactor
              const maxSize = column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER
              newSizing[col.id] = Math.min(scaledWidth, maxSize)
            }
          }
        })
      } else {
        // Content is larger than container, use measured widths
        columnWidths.forEach((col) => {
          if (!col.skip) {
            newSizing[col.id] = col.width
          }
        })
      }
    } else {
      columnWidths.forEach((col) => {
        if (!col.skip) {
          newSizing[col.id] = col.width
        }
      })
    }

    // Apply the new sizing
    if (Object.keys(newSizing).length > 0) {
      tableApi.setColumnSizing((old) => ({
        ...old,
        ...newSizing,
      }))
    }
  }

  function autoSizeColumn(columnId: string) {
    const column = tableApi.getColumn(columnId)
    if (!column) return

    const skipColumns = props.skipAutoSizeColumns || []
    if (skipColumns.includes(columnId)) return

    const visibleColumns = tableApi.getVisibleLeafColumns()
    const columnIndex = visibleColumns.findIndex((col) => col.id === columnId)
    if (columnIndex === -1) return

    const minSize = column.columnDef.minSize ?? 20
    const maxSize = column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER
    const measuredWidth = measureColumnContentWidth(columnId, columnIndex)
    const constrainedWidth = Math.max(minSize, Math.min(measuredWidth, maxSize))

    tableApi.setColumnSizing((old) => ({
      ...old,
      [columnId]: constrainedWidth,
    }))
  }

  // Debounced autosize to prevent excessive DOM measurements during rapid data updates
  const debouncedAutosize = useDebounceFn(() => {
    autoSizeColumns()
  }, 100)

  // Auto-size on mount and when data changes if autoSize is set
  watch(
    [() => props.data, autoSize],
    () => {
      if (autoSize.value) {
        nextTick(debouncedAutosize)
      }
    },
    { immediate: true, flush: 'post' },
  )

  return {
    autoSizeColumns,
    autoSizeColumn,
  }
}
