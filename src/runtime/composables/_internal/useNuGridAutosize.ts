import type { TableData } from '@nuxt/ui'
import type { Table } from '@tanstack/vue-table'
import type { Ref } from 'vue'

import type { NuGridProps } from '../../types'
import { useDebounceFn } from '@vueuse/core'
import { nextTick, ref, watch } from 'vue'
import { usePropWithDefault } from '../../config/_internal'

/**
 * Autosize functionality for tables similar to AG Grid
 * Supports two modes:
 * - content: Auto-size columns to fit cell contents
 * - fill: Auto-size columns to fit cell contents and scale up to fill grid width
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

  /**
   * Pre-set equal column widths for fill mode
   * This runs synchronously before first paint to minimize visual jump
   */
  function presetEqualColumnWidths() {
    if (!tableRef.value) return

    const containerWidth = tableRef.value.offsetWidth
    if (containerWidth <= 0) return

    const visibleColumns = tableApi.getVisibleLeafColumns()
    // Skip columns with grow: false (they use fixed size)
    const resizableColumns = visibleColumns.filter((col) => {
      const columnDef = col.columnDef as { grow?: boolean }
      return columnDef.grow !== false
    })

    if (resizableColumns.length === 0) return

    const equalWidth = containerWidth / resizableColumns.length
    const newSizing: Record<string, number> = {}

    resizableColumns.forEach((column) => {
      const minSize = column.columnDef.minSize ?? 20
      const maxSize = column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER
      newSizing[column.id] = Math.max(minSize, Math.min(equalWidth, maxSize))
    })

    tableApi.setColumnSizing((old) => ({
      ...old,
      ...newSizing,
    }))
  }

  function autoSizeColumns(mode?: 'content' | 'fill') {
    const effectiveMode = mode || autoSize.value
    if (!effectiveMode || !tableRef.value) return

    const visibleColumns = tableApi.getVisibleLeafColumns()
    const newSizing: Record<string, number> = {}

    // Skip columns with grow: false (they use fixed size)
    const columnsToMeasure = visibleColumns
      .filter((column) => {
        const columnDef = column.columnDef as { grow?: boolean }
        return columnDef.grow !== false
      })
      .map((column) => column.id)

    const measuredWidths = measureAllColumnsContentWidth(columnsToMeasure)

    const columnWidths = visibleColumns.map((column) => {
      const columnDef = column.columnDef as { grow?: boolean }
      if (columnDef.grow === false) {
        return { id: column.id, width: column.getSize(), skip: true }
      }

      const minSize = column.columnDef.minSize ?? 20
      const maxSize = column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER
      const measuredWidth = measuredWidths[column.id] || 150
      const constrainedWidth = Math.max(minSize, Math.min(measuredWidth, maxSize))

      return { id: column.id, width: constrainedWidth, skip: false }
    })

    const totalContentWidth = columnWidths.reduce((sum, col) => sum + col.width, 0)

    if (effectiveMode === 'fill' && tableRef.value) {
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

    // Skip columns with grow: false (they use fixed size)
    const columnDef = column.columnDef as { grow?: boolean }
    if (columnDef.grow === false) return

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

  // Track if initial autosize has run and grid is ready to show
  let initialAutosizeComplete = false
  let prevColumnCount = props.columns?.length ?? 0
  // For fill, CSS flex handles initial distribution so ready immediately
  // For content, need to wait for measurement
  const autosizeReady = ref(!autoSize.value || autoSize.value === 'fill')

  /**
   * Measure actual rendered widths of flex columns from the DOM
   * and sync them to TanStack's columnSizing (without marking as manually resized)
   * This allows resize to work correctly from the first click
   */
  function syncFlexColumnWidths() {
    if (!tableRef.value) return

    const visibleColumns = tableApi.getVisibleLeafColumns()
    const columnSizing = tableApi.getState().columnSizing
    const newSizing: Record<string, number> = {}

    // Find all header cells and measure their widths
    const headerCells = tableRef.value.querySelectorAll('[data-column-id]')
    const measuredWidths = new Map<string, number>()

    headerCells.forEach((cell) => {
      const columnId = cell.getAttribute('data-column-id')
      if (columnId && !measuredWidths.has(columnId)) {
        measuredWidths.set(columnId, (cell as HTMLElement).offsetWidth)
      }
    })

    // For flex columns (not already in columnSizing), set their measured width
    for (const column of visibleColumns) {
      const columnDef = column.columnDef as { grow?: boolean }
      const isFlexColumn = columnDef.grow !== false && !columnSizing[column.id]

      if (isFlexColumn) {
        const measuredWidth = measuredWidths.get(column.id)
        if (measuredWidth && measuredWidth > 0) {
          newSizing[column.id] = measuredWidth
        }
      }
    }

    // Set the measured widths in TanStack (this doesn't trigger visual change
    // because CSS styling checks manuallyResizedColumns, not columnSizing)
    if (Object.keys(newSizing).length > 0) {
      tableApi.setColumnSizing((old) => ({
        ...old,
        ...newSizing,
      }))
    }
  }

  // Auto-size on mount and when data or columns change if autoSize is set
  watch(
    [() => props.data, autoSize, () => props.columns?.length],
    () => {
      if (autoSize.value) {
        // Detect column count changes so fill mode can redistribute
        const currentColumnCount = props.columns?.length ?? 0
        const columnsChanged = currentColumnCount !== prevColumnCount
        prevColumnCount = currentColumnCount

        // For fill, CSS flex handles distribution - no JS measurement needed
        if (autoSize.value === 'fill') {
          autosizeReady.value = true
          initialAutosizeComplete = true

          // When columns change, clear stale sizing for flex columns so CSS flex
          // can redistribute all columns evenly within the container
          if (columnsChanged) {
            const visibleColumns = tableApi.getVisibleLeafColumns()
            const toRemove = visibleColumns
              .filter((col) => (col.columnDef as { grow?: boolean }).grow !== false)
              .map((col) => col.id)
            if (toRemove.length > 0) {
              tableApi.setColumnSizing((old) => {
                const next = { ...old }
                for (const id of toRemove) delete next[id]
                return next
              })
            }
          }

          // After first render, sync flex column widths to TanStack
          // so resize works correctly from the first click
          // Check both props.data AND tableApi rows (which includes empty group placeholders)
          const hasRows = (props.data && props.data.length > 0) || tableApi.getRowModel().rows.length > 0
          if (hasRows && typeof requestAnimationFrame !== 'undefined') {
            nextTick(() => {
              // Use requestAnimationFrame to ensure DOM is fully painted
              requestAnimationFrame(() => {
                syncFlexColumnWidths()
              })
            })
          }
          return
        }

        // For content mode, measure and set column widths
        if (!initialAutosizeComplete && props.data && props.data.length > 0) {
          nextTick(() => {
            autoSizeColumns()
            initialAutosizeComplete = true
            autosizeReady.value = true
          })
        } else if (initialAutosizeComplete) {
          // Debounce subsequent updates
          nextTick(debouncedAutosize)
        }
      } else {
        // If autoSize is disabled, mark as ready immediately
        autosizeReady.value = true
      }
    },
    { immediate: true, flush: 'post' },
  )

  return {
    autoSizeColumns,
    autoSizeColumn,
    presetEqualColumnWidths,
    autosizeReady,
    autoSizeMode: autoSize,
  }
}
