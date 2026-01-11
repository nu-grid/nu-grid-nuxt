import type { TableData } from '@nuxt/ui'
import type { Row, Table } from '@tanstack/vue-table'
import type { Primitive } from 'reka-ui'
import type { MaybeRefOrGetter, Ref } from 'vue'
import type { NuGridProps } from '../../types'
import { computed, toValue, watch } from 'vue'
import {
  useNuGridGroupVirtualization,
  useNuGridStandardGroupVirtualization,
} from './useNuGridVirtualization'

export function useNuGridGrouping<T extends TableData>(
  propsInput: MaybeRefOrGetter<NuGridProps<T>>,
  tableApi: Table<T>,
  rootRef: Ref<InstanceType<typeof Primitive> | null | undefined>,
  stickyEnabled?: Ref<boolean>,
  mode: 'group' | 'splitgroup' = 'splitgroup',
  addRowOptions?: {
    addRowPosition: Ref<'top' | 'bottom' | 'none'>
    isAddRowRow: (row: Row<T>) => boolean
    getAddRowForGroup?: (groupId: string) => Row<T> | null
  },
) {
  // Unwrap props to handle both plain objects and refs/computed
  const props = computed(() => toValue(propsInput))
  // Use Tanstack's row model pipeline: Core → Filtered → Grouped → Sorted → Expanded → Pagination
  // Always use getRowModel() which is the final row model that respects all features including pagination

  const rows = computed(() => {
    return tableApi.getRowModel().rows
  })

  // Recursively collect all group rows (top-level and nested)
  // Defined early because it's used by setRowExpanded and groupExpanded
  function collectAllGroupRows(rowsToProcess: Row<T>[]): Row<T>[] {
    const allGroups: Row<T>[] = []

    rowsToProcess.forEach((row) => {
      if (row.getIsGrouped()) {
        allGroups.push(row)
        // Recursively process subgroups
        if (row.subRows && row.subRows.length > 0) {
          allGroups.push(...collectAllGroupRows(row.subRows))
        }
      }
    })

    return allGroups
  }

  // Get list of all group rows (headers) - top-level and nested
  const groupRows = computed(() => {
    return collectAllGroupRows(rows.value)
  })

  // Use TanStack's expansion state for group expansion
  // This ensures pagination counts rows correctly based on expanded/collapsed state
  // TanStack's ExpandedState can be true (all expanded), Record<string, boolean>, or ExpandedStateList
  const isRowExpanded = (groupId: string): boolean => {
    const expanded = tableApi.getState().expanded
    if (expanded === true) return true
    if (typeof expanded === 'object' && expanded !== null) {
      return (expanded as Record<string, boolean>)[groupId] !== false
    }
    return true // Default to expanded
  }

  const setRowExpanded = (groupId: string, expanded: boolean) => {
    const currentState = tableApi.getState().expanded
    if (currentState === true) {
      // All were expanded, now we need to track individually
      const newState: Record<string, boolean> = {}
      groupRows.value.forEach((gr) => {
        newState[gr.id] = gr.id === groupId ? expanded : true
      })
      tableApi.setExpanded(newState)
    } else if (typeof currentState === 'object' && currentState !== null) {
      tableApi.setExpanded({
        ...(currentState as Record<string, boolean>),
        [groupId]: expanded,
      })
    } else {
      tableApi.setExpanded({ [groupId]: expanded })
    }
  }

  // Computed ref for expansion state (for compatibility with components expecting a ref)
  const groupExpanded = computed(() => {
    const expanded = tableApi.getState().expanded
    if (expanded === true) {
      // All expanded - build a record
      const result: Record<string, boolean> = {}
      groupRows.value.forEach((gr) => {
        result[gr.id] = true
      })
      return result
    }
    return (expanded as Record<string, boolean>) || {}
  })

  // Organize rows by groups using Tanstack's row structure
  // The subRows are already sorted since we use getSortedRowModel() above
  const reorderGroup = (groupId: string, rowsForGroup: Row<T>[]) => {
    if (!addRowOptions || addRowOptions.addRowPosition.value === 'none') {
      return rowsForGroup
    }

    const placeholder = addRowOptions.getAddRowForGroup?.(groupId) || null
    const regularRows = rowsForGroup

    if (placeholder && addRowOptions.addRowPosition.value === 'top') {
      return [placeholder, ...regularRows]
    }

    if (placeholder && addRowOptions.addRowPosition.value === 'bottom') {
      return [...regularRows, placeholder]
    }

    return regularRows
  }

  // Recursively extract data rows from a group, handling nested subgroups
  function extractDataRows(groupRow: Row<T>): Row<T>[] {
    const dataRows: Row<T>[] = []

    if (!groupRow.subRows || groupRow.subRows.length === 0) {
      return dataRows
    }

    groupRow.subRows.forEach((subRow) => {
      if (subRow.getIsGrouped()) {
        dataRows.push(...extractDataRows(subRow))
      } else {
        dataRows.push(subRow)
      }
    })

    return dataRows
  }

  // Recursively process all groups (top-level and nested) to build groupedRows
  function processGroupsRecursively(
    rowsToProcess: Row<T>[],
    groups: Record<string, Row<T>[]>,
  ): void {
    rowsToProcess.forEach((row) => {
      if (row.getIsGrouped()) {
        const groupId = row.id
        // Extract only data rows (not subgroups) from this group
        const dataRows = extractDataRows(row)
        groups[groupId] = reorderGroup(groupId, dataRows)
        // Recursively process nested groups
        if (row.subRows && row.subRows.length > 0) {
          processGroupsRecursively(row.subRows, groups)
        }
      }
    })
  }

  const groupedRows = computed(() => {
    const groups: Record<string, Row<T>[]> = {}
    // Process all group rows recursively (top-level and nested)
    processGroupsRecursively(rows.value, groups)
    return groups
  })

  // Initialize group expansion state (default to expanded)
  // When groups are first detected, expand them all by default
  watch(
    groupRows,
    (newGroupRows) => {
      if (newGroupRows.length === 0) return

      const currentState = tableApi.getState().expanded
      // If expanded state is empty or undefined, initialize all groups as expanded
      if (
        !currentState
        || (typeof currentState === 'object' && Object.keys(currentState).length === 0)
      ) {
        // Set all groups to expanded
        tableApi.setExpanded(true)
      }
    },
    { immediate: true },
  )

  // Toggle group expansion
  function toggleGroup(groupId: string) {
    setRowExpanded(groupId, !isRowExpanded(groupId))
  }

  // Check if group is expanded (default to true)
  function isGroupExpanded(groupId: string): boolean {
    return isRowExpanded(groupId)
  }

  // Use appropriate virtualization based on mode
  const virtualizationFn =
    mode === 'group' ? useNuGridStandardGroupVirtualization : useNuGridGroupVirtualization

  const {
    groupingRowHeights,
    headerGroupCount,
    virtualRowItems,
    virtualizer,
    virtualizationEnabled,
    activeStickyIndexes,
    activeStickyHeight,
    measuredVirtualSizes,
    getVirtualItemHeight,
    stickyOffsets,
  } = virtualizationFn({
    props,
    tableApi,
    rootRef,
    stickyEnabled,
    groupRows,
    groupedRows,
    isGroupExpanded,
    topLevelRows: rows,
    addRowOptions,
  })

  // Helper to find parent group ID for a nested group
  function findParentGroupId(groupRow: Row<T>, allRows: Row<T>[]): string | null {
    // Check if this group is nested under any top-level group
    for (const row of allRows) {
      if (row.getIsGrouped() && row.subRows) {
        // Check if groupRow is in this row's subRows
        if (row.subRows.some((subRow) => subRow.id === groupRow.id)) {
          return row.id
        }
        // Recursively check nested groups
        const parentId = findParentGroupId(groupRow, row.subRows)
        if (parentId) {
          return parentId
        }
      }
    }
    return null
  }

  // Check if a group is visible (all its ancestors are expanded)
  function isGroupVisible(groupId: string, allRows: Row<T>[]): boolean {
    const groupRow = groupRows.value.find((gr) => gr.id === groupId)
    if (!groupRow) {
      return false
    }

    const parentId = findParentGroupId(groupRow, allRows)
    if (parentId === null) {
      // Top-level group, always visible
      return true
    }

    // Check if parent is expanded and visible
    if (!isGroupExpanded(parentId)) {
      return false
    }

    // Recursively check parent visibility
    return isGroupVisible(parentId, allRows)
  }

  // Create a flattened list of navigable rows for keyboard navigation
  // This list respects the grouped structure and skips collapsed groups
  const navigableRows = computed<Row<T>[]>(() => {
    // If there are no groups, just use the flat rows
    if (groupRows.value.length === 0) {
      return rows.value
    }

    // Build a flat list of data rows respecting group expansion state
    // IMPORTANT: Only iterate through LEAF groups (groups with no subgroups)
    // because intermediate groups contain nested group headers, not data rows
    const navRows: Row<T>[] = []
    groupRows.value.forEach((groupRow) => {
      const groupId = groupRow.id
      const visible = isGroupVisible(groupId, rows.value)
      const expanded = isGroupExpanded(groupId)

      // Check if this is a leaf group (has no subgroups)
      const hasSubgroups = groupRow.subRows?.some((subRow) => subRow.getIsGrouped())

      // Only include rows from expanded LEAF groups that are visible
      if (visible && expanded && !hasSubgroups) {
        const dataRows = groupedRows.value[groupId] || []
        navRows.push(...dataRows)
      }
    })

    return navRows
  })

  return {
    rows,
    groupRows,
    groupedRows,
    groupExpanded,
    toggleGroup,
    isGroupExpanded,
    virtualRowItems,
    virtualizer,
    virtualizationEnabled,
    navigableRows,
    groupingRowHeights,
    headerGroupCount,
    activeStickyIndexes,
    activeStickyHeight,
    measuredVirtualSizes,
    getVirtualItemHeight,
    stickyOffsets,
  }
}
