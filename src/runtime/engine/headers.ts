/**
 * NuGrid Header/HeaderGroup building.
 *
 * Turns a column tree into HeaderGroup[] with Header objects.
 */

import type {
  EngineColumn,
  EngineHeader,
  EngineHeaderGroup,
  EngineTable,
} from './types'

// ---------------------------------------------------------------------------
// Header creation
// ---------------------------------------------------------------------------

function createEngineHeader<T>(
  column: EngineColumn<T>,
  table: EngineTable<T>,
  options: {
    id?: string
    isPlaceholder?: boolean
    placeholderId?: string
    index: number
    depth: number
  },
): EngineHeader<T> {
  const id = options.id ?? column.id

  const header: EngineHeader<T> = {
    id,
    column,
    index: options.index,
    isPlaceholder: !!options.isPlaceholder,
    placeholderId: options.placeholderId,
    depth: options.depth,
    subHeaders: [],
    colSpan: 0,
    rowSpan: 0,
    headerGroup: null!,

    getLeafHeaders(): EngineHeader<T>[] {
      const leafHeaders: EngineHeader<T>[] = []
      const recurse = (h: EngineHeader<T>) => {
        if (h.subHeaders && h.subHeaders.length) {
          h.subHeaders.forEach(recurse)
        }
        leafHeaders.push(h)
      }
      recurse(header)
      return leafHeaders
    },

    getContext() {
      return {
        table,
        header,
        column,
      }
    },

    getSize() {
      // Header size = sum of leaf column sizes:
      // Recurse subHeaders, only sum actual leaves (no subHeaders).
      let sum = 0
      const recurse = (h: EngineHeader<T>) => {
        if (h.subHeaders.length) {
          h.subHeaders.forEach(recurse)
        }
        else {
          sum += h.column.getSize()
        }
      }
      recurse(header)
      return sum
    },
  }

  return header
}

// ---------------------------------------------------------------------------
// Build header groups
// ---------------------------------------------------------------------------

/**
 * Build header groups from columns.
 * Builds header groups from a flat/nested column tree.
 *
 * @param allColumns - All columns (including groups)
 * @param columnsToGroup - Visible leaf columns in display order
 * @param table - Table instance (for getContext)
 * @param headerFamily - Optional: 'center', 'left', 'right' for pinned sections
 */
export function buildEngineHeaderGroups<T>(
  allColumns: EngineColumn<T>[],
  columnsToGroup: EngineColumn<T>[],
  table: EngineTable<T>,
  headerFamily?: 'center' | 'left' | 'right',
): EngineHeaderGroup<T>[] {
  // Find the max depth of the columns
  let maxDepth = 0

  const findMaxDepth = (columns: EngineColumn<T>[], depth = 1) => {
    maxDepth = Math.max(maxDepth, depth)
    columns
      .filter(column => column.getIsVisible())
      .forEach((column) => {
        if (column.columns?.length) {
          findMaxDepth(column.columns, depth + 1)
        }
      })
  }

  findMaxDepth(allColumns)

  const headerGroups: EngineHeaderGroup<T>[] = []

  const createHeaderGroup = (
    headersToGroup: EngineHeader<T>[],
    depth: number,
  ) => {
    const headerGroup: EngineHeaderGroup<T> = {
      depth,
      id: [headerFamily, `${depth}`].filter(Boolean).join('_'),
      headers: [],
    }

    const pendingParentHeaders: EngineHeader<T>[] = []

    headersToGroup.forEach((headerToGroup) => {
      const latestPendingParentHeader = [...pendingParentHeaders].reverse()[0]
      const isLeafHeader = headerToGroup.column.depth === headerGroup.depth

      let column: EngineColumn<T>
      let isPlaceholder = false

      if (isLeafHeader && headerToGroup.column.parent) {
        column = headerToGroup.column.parent
      }
      else {
        column = headerToGroup.column
        isPlaceholder = true
      }

      if (
        latestPendingParentHeader
        && latestPendingParentHeader.column === column
      ) {
        latestPendingParentHeader.subHeaders.push(headerToGroup)
      }
      else {
        const header = createEngineHeader(column, table, {
          id: [headerFamily, depth, column.id, headerToGroup?.id]
            .filter(Boolean)
            .join('_'),
          isPlaceholder,
          placeholderId: isPlaceholder
            ? `${pendingParentHeaders.filter(d => d.column === column).length}`
            : undefined,
          depth,
          index: pendingParentHeaders.length,
        })

        header.subHeaders.push(headerToGroup)
        pendingParentHeaders.push(header)
      }

      headerGroup.headers.push(headerToGroup)
      headerToGroup.headerGroup = headerGroup
    })

    headerGroups.push(headerGroup)

    if (depth > 0) {
      createHeaderGroup(pendingParentHeaders, depth - 1)
    }
  }

  const bottomHeaders = columnsToGroup.map((column, index) =>
    createEngineHeader(column, table, {
      depth: maxDepth,
      index,
    }),
  )

  createHeaderGroup(bottomHeaders, maxDepth - 1)

  headerGroups.reverse()

  // Calculate colSpan and rowSpan
  const recurseHeadersForSpans = (
    headers: EngineHeader<T>[],
  ): { colSpan: number; rowSpan: number }[] => {
    const filteredHeaders = headers.filter(header =>
      header.column.getIsVisible(),
    )

    return filteredHeaders.map((header) => {
      let colSpan = 0
      let rowSpan = 0
      let childRowSpans = [0]

      if (header.subHeaders && header.subHeaders.length) {
        childRowSpans = []
        recurseHeadersForSpans(header.subHeaders).forEach(
          ({ colSpan: childColSpan, rowSpan: childRowSpan }) => {
            colSpan += childColSpan
            childRowSpans.push(childRowSpan)
          },
        )
      }
      else {
        colSpan = 1
      }

      const minChildRowSpan = Math.min(...childRowSpans)
      rowSpan = rowSpan + minChildRowSpan

      header.colSpan = colSpan
      header.rowSpan = rowSpan

      return { colSpan, rowSpan }
    })
  }

  recurseHeadersForSpans(headerGroups[0]?.headers ?? [])

  return headerGroups
}
