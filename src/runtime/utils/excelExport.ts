import type { Column, Table } from '@tanstack/vue-table'
import type { Cell, Row } from 'write-excel-file'
import type { NuGridColumn } from '../types'
import writeXlsxFile from 'write-excel-file'

export interface ExcelExportOptions {
  /**
   * Filename for the exported file (without extension)
   * @defaultValue 'export'
   */
  filename?: string

  /**
   * Sheet name in the Excel file
   * @defaultValue 'Sheet1'
   */
  sheetName?: string

  /**
   * Whether to include column headers in the export
   * @defaultValue true
   */
  includeHeaders?: boolean

  /**
   * Whether to export only visible columns (respects column visibility state)
   * @defaultValue true
   */
  visibleColumnsOnly?: boolean

  /**
   * Custom column width overrides (column id -> width in characters)
   */
  columnWidths?: Record<string, number>
}

interface ColumnInfo {
  id: string
  header: string
  accessorKey?: string
  cellDataType?: string
}

/**
 * Extracts the raw value from a cell based on the column definition
 */
function getCellValue<T>(row: T, column: ColumnInfo): unknown {
  const key = column.accessorKey || column.id
  if (!key) return undefined

  // Handle nested accessor keys (e.g., 'user.name')
  if (key.includes('.')) {
    return key.split('.').reduce((obj: any, k) => obj?.[k], row)
  }

  return (row as Record<string, unknown>)[key]
}

/**
 * Formats a cell value for Excel export based on its data type
 */
function formatCellForExcel(value: unknown, cellDataType?: string): Cell {
  if (value === null || value === undefined) {
    return { value: '', type: String }
  }

  switch (cellDataType) {
    case 'date':
      if (typeof value === 'string') {
        const date = new Date(value)
        if (!Number.isNaN(date.getTime())) {
          return { value: date, type: Date, format: 'yyyy-mm-dd' }
        }
      }
      return { value: String(value), type: String }

    case 'boolean':
      return { value: value ? 'Yes' : 'No', type: String }

    case 'currency':
      if (typeof value === 'number') {
        return { value, type: Number, format: '$#,##0.00' }
      }
      return { value: String(value), type: String }

    case 'number':
      if (typeof value === 'number') {
        return { value, type: Number }
      }
      if (typeof value === 'string') {
        const num = Number.parseFloat(value)
        if (!Number.isNaN(num)) {
          return { value: num, type: Number }
        }
      }
      return { value: String(value), type: String }

    case 'lookup':
      if (typeof value === 'object' && value !== null) {
        const label =
          (value as Record<string, unknown>).label || (value as Record<string, unknown>).value
        return { value: String(label ?? value), type: String }
      }
      return { value: String(value), type: String }

    default:
      if (typeof value === 'object') {
        return { value: JSON.stringify(value), type: String }
      }
      return { value: String(value), type: String }
  }
}

/**
 * Calculates display width for a value (for column width estimation)
 */
function getDisplayWidth(value: unknown, cellDataType?: string): number {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  switch (cellDataType) {
    case 'date':
      return 10 // yyyy-mm-dd

    case 'currency':
      if (typeof value === 'number') {
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value)
        return formatted.length
      }
      return String(value).length

    case 'number':
      return String(value).length

    case 'boolean':
      return 3 // "Yes" or "No"

    default:
      return String(value).length
  }
}

/**
 * Calculates the optimal column width based on content
 */
function calculateColumnWidth(header: string, values: unknown[], cellDataType?: string): number {
  const headerLength = header.length
  const maxValueLength = values.reduce((max: number, val) => {
    const displayLen = getDisplayWidth(val, cellDataType)
    return Math.max(max, displayLen)
  }, 0)

  const isTextType = !cellDataType || cellDataType === 'text' || cellDataType === 'textarea'
  const multiplier = isTextType ? 1.2 : 1.0
  const maxWidth = isTextType ? 80 : 50

  const baseWidth = Math.max(headerLength, maxValueLength)
  return Math.min(Math.ceil(baseWidth * multiplier) + 2, maxWidth)
}

/**
 * Gets column info from a TanStack column
 */
function getColumnInfo<T>(
  tableColumn: Column<T, unknown>,
  columnDefinitions: NuGridColumn<T>[],
): ColumnInfo | null {
  const colId = tableColumn.id
  const colDef = tableColumn.columnDef
  const cellDataType = (colDef as any).cellDataType

  // Skip special columns
  if (cellDataType === 'selection' || cellDataType === 'action-menu') {
    return null
  }

  const originalCol = columnDefinitions.find(
    (c) => (c as any).accessorKey === colId || (c as any).id === colId,
  )

  let header = colId
  if (typeof colDef.header === 'string') {
    header = colDef.header
  } else if (originalCol && typeof originalCol.header === 'string') {
    header = originalCol.header
  }

  return {
    id: colId,
    header,
    accessorKey: (colDef as any).accessorKey || colId,
    cellDataType: originalCol?.cellDataType || cellDataType,
  }
}

/**
 * Exports grid data to an Excel file
 * Respects current grid state: column visibility, column order, sorting, and filtering
 */
export async function exportToExcel<T>(
  tableApi: Table<T>,
  columns: NuGridColumn<T>[],
  options: ExcelExportOptions = {},
): Promise<void> {
  const {
    filename = 'export',
    sheetName = 'Sheet1',
    includeHeaders = true,
    visibleColumnsOnly = true,
    columnWidths = {},
  } = options

  // Get columns in their current visual order
  const tableColumns = visibleColumnsOnly
    ? tableApi.getVisibleLeafColumns()
    : tableApi.getAllLeafColumns()

  // Build export columns from table columns
  const exportColumns: ColumnInfo[] = []
  for (const tableCol of tableColumns) {
    const colInfo = getColumnInfo(tableCol, columns)
    if (colInfo) {
      exportColumns.push(colInfo)
    }
  }

  // Get rows in current sorted/filtered order
  const rows = tableApi.getSortedRowModel().rows.map((r) => r.original)

  // Build data array for write-excel-file
  const data: Row[] = []

  // Add headers if requested
  if (includeHeaders) {
    const headerRow: Row = exportColumns.map((col) => ({
      value: col.header,
      type: String,
      fontWeight: 'bold' as const,
    }))
    data.push(headerRow)
  }

  // Add data rows
  for (const row of rows) {
    const rowData: Row = exportColumns.map((col) => {
      const rawValue = getCellValue(row, col)
      return formatCellForExcel(rawValue, col.cellDataType)
    })
    data.push(rowData)
  }

  // Calculate column widths
  const columnWidthsArray = exportColumns.map((col) => {
    if (columnWidths[col.id]) {
      return { width: columnWidths[col.id] }
    }
    const columnValues = rows.map((row) => getCellValue(row, col))
    const width = calculateColumnWidth(col.header, columnValues, col.cellDataType)
    return { width }
  })

  // Write the file
  await writeXlsxFile(data, {
    columns: columnWidthsArray,
    fileName: `${filename}.xlsx`,
    sheet: sheetName,
  })
}

export interface GroupedExcelExportOptions extends ExcelExportOptions {
  /**
   * Whether to include group header rows
   * @defaultValue true
   */
  includeGroupHeaders?: boolean

  /**
   * Indent data cells under groups (number of spaces)
   * @defaultValue 2
   */
  groupIndent?: number

  /**
   * Format for group header text
   * @defaultValue '{groupName}: {groupValue} ({count})'
   */
  groupHeaderFormat?: string
}

/**
 * Recursively processes grouped rows for Excel export
 */
function processGroupedRows(
  rows: any[],
  exportColumns: ColumnInfo[],
  options: {
    includeGroupHeaders: boolean
    groupIndent: number
    groupHeaderFormat: string
  },
  depth: number = 0,
): Row[] {
  const result: Row[] = []

  for (const row of rows) {
    if (row.getIsGrouped?.()) {
      if (options.includeGroupHeaders) {
        const groupColumnId = row.groupingColumnId
        const groupValue = row.getGroupingValue?.(groupColumnId)
        const count = row.subRows?.length ?? 0

        // Format group header text
        let headerText = options.groupHeaderFormat
          .replace('{groupName}', groupColumnId)
          .replace('{groupValue}', String(groupValue ?? 'Unknown'))
          .replace('{count}', String(count))

        // Add indentation for nested groups
        if (depth > 0) {
          headerText = ' '.repeat(options.groupIndent * depth) + headerText
        }

        // Create group header row spanning all columns
        const groupRow: Row = exportColumns.map((_, index) => {
          if (index === 0) {
            return {
              value: headerText,
              type: String,
              fontWeight: 'bold' as const,
              backgroundColor: '#E8E8E8',
            }
          }
          return {
            value: '',
            type: String,
            backgroundColor: '#E8E8E8',
          }
        })
        result.push(groupRow)
      }

      // Process sub-rows recursively
      if (row.subRows && row.subRows.length > 0) {
        const subRowsData = processGroupedRows(row.subRows, exportColumns, options, depth + 1)
        result.push(...subRowsData)
      }
    } else {
      const indent =
        options.includeGroupHeaders && depth > 0 ? ' '.repeat(options.groupIndent * depth) : ''

      const rowData: Row = exportColumns.map((col, index) => {
        const rawValue = getCellValue(row.original, col)
        const cell = formatCellForExcel(rawValue, col.cellDataType)

        // Add indent to first column for visual hierarchy
        if (index === 0 && indent && cell && typeof cell.value === 'string') {
          return { ...cell, value: indent + cell.value }
        }
        return cell
      })
      result.push(rowData)
    }
  }

  return result
}

/**
 * Exports grouped grid data to an Excel file
 * Preserves group hierarchy with group header rows
 */
export async function exportGroupedToExcel<T>(
  tableApi: Table<T>,
  columns: NuGridColumn<T>[],
  options: GroupedExcelExportOptions = {},
): Promise<void> {
  const {
    filename = 'export',
    sheetName = 'Sheet1',
    includeHeaders = true,
    visibleColumnsOnly = true,
    columnWidths = {},
    includeGroupHeaders = true,
    groupIndent = 2,
    groupHeaderFormat = '{groupName}: {groupValue} ({count})',
  } = options

  // Get columns in their current visual order
  const tableColumns = visibleColumnsOnly
    ? tableApi.getVisibleLeafColumns()
    : tableApi.getAllLeafColumns()

  // Build export columns from table columns
  const exportColumns: ColumnInfo[] = []
  for (const tableCol of tableColumns) {
    const colInfo = getColumnInfo(tableCol, columns)
    if (colInfo) {
      exportColumns.push(colInfo)
    }
  }

  // Build data array for write-excel-file
  const data: Row[] = []

  // Add headers if requested
  if (includeHeaders) {
    const headerRow: Row = exportColumns.map((col) => ({
      value: col.header,
      type: String,
      fontWeight: 'bold' as const,
    }))
    data.push(headerRow)
  }

  // Get rows - use getRowModel() to get the expanded/grouped structure
  const rowModel = tableApi.getRowModel()

  // Process grouped rows recursively
  const groupedData = processGroupedRows(
    rowModel.rows,
    exportColumns,
    { includeGroupHeaders, groupIndent, groupHeaderFormat },
    0,
  )
  data.push(...groupedData)

  // Calculate column widths (sample from all original data for consistency)
  const allRows = tableApi.getSortedRowModel().rows.map((r) => r.original)
  const columnWidthsArray = exportColumns.map((col) => {
    if (columnWidths[col.id]) {
      return { width: columnWidths[col.id] }
    }
    const columnValues = allRows.map((row) => getCellValue(row, col))
    const width = calculateColumnWidth(col.header, columnValues, col.cellDataType)
    return { width }
  })

  // Write the file
  await writeXlsxFile(data, {
    columns: columnWidthsArray,
    fileName: `${filename}.xlsx`,
    sheet: sheetName,
  })
}

/**
 * Exports data array directly to Excel (without table API)
 */
export async function exportDataToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: Array<{
    key: string
    header: string
    cellDataType?: string
  }>,
  options: ExcelExportOptions = {},
): Promise<void> {
  const {
    filename = 'export',
    sheetName = 'Sheet1',
    includeHeaders = true,
    columnWidths = {},
  } = options

  const excelData: Row[] = []

  // Add headers if requested
  if (includeHeaders) {
    const headerRow: Row = columns.map((col) => ({
      value: col.header,
      type: String,
      fontWeight: 'bold' as const,
    }))
    excelData.push(headerRow)
  }

  // Add data rows
  for (const row of data) {
    const rowData: Row = columns.map((col) => {
      const rawValue = row[col.key]
      return formatCellForExcel(rawValue, col.cellDataType)
    })
    excelData.push(rowData)
  }

  // Calculate column widths
  const columnWidthsArray = columns.map((col) => {
    if (columnWidths[col.key]) {
      return { width: columnWidths[col.key] }
    }
    const columnValues = data.map((row) => row[col.key])
    const width = calculateColumnWidth(col.header, columnValues, col.cellDataType)
    return { width }
  })

  // Write the file
  await writeXlsxFile(excelData, {
    columns: columnWidthsArray,
    fileName: `${filename}.xlsx`,
    sheet: sheetName,
  })
}
