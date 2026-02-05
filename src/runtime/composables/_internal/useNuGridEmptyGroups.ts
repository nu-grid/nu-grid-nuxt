import type { TableData } from '@nuxt/ui'
import type { GroupingState } from '@tanstack/vue-table'
import type { ComputedRef, Ref } from 'vue'
import { computed } from 'vue'

export const EMPTY_GROUP_PLACEHOLDER_FLAG = '__nugridEmptyGroupPlaceholder'

/**
 * Check if a row is an empty group placeholder
 */
export function isEmptyGroupPlaceholder<T>(row: T): boolean {
  return !!(row as any)?.[EMPTY_GROUP_PLACEHOLDER_FLAG]
}

/**
 * Create an empty group placeholder row with the given grouping values
 */
function createPlaceholderRow<T extends TableData>(
  groupingValues: Partial<T>,
  index: number,
): T {
  const placeholder: any = { ...groupingValues }
  placeholder[EMPTY_GROUP_PLACEHOLDER_FLAG] = true
  placeholder.id = `__empty-group-placeholder-${index}-${Object.values(groupingValues).join('-')}`
  return placeholder as T
}

/**
 * Generate all combinations of values for the given grouping columns
 */
function generateGroupCombinations(
  groupingState: string[],
  emptyGroupValues: Record<string, unknown[]>,
): Record<string, unknown>[] {
  if (groupingState.length === 0) {
    return []
  }

  // Get values for each grouping column
  const columnValues: { columnId: string; values: unknown[] }[] = []
  for (const columnId of groupingState) {
    const values = emptyGroupValues[columnId]
    if (values && values.length > 0) {
      columnValues.push({ columnId, values })
    }
  }

  if (columnValues.length === 0) {
    return []
  }

  // Generate all combinations using cartesian product
  let combinations: Record<string, unknown>[] = [{}]

  for (const { columnId, values } of columnValues) {
    const newCombinations: Record<string, unknown>[] = []
    for (const combo of combinations) {
      for (const value of values) {
        newCombinations.push({ ...combo, [columnId]: value })
      }
    }
    combinations = newCombinations
  }

  return combinations
}

/**
 * Check if a combination exists in the data
 */
function combinationExistsInData<T extends TableData>(
  data: T[],
  combination: Record<string, unknown>,
): boolean {
  return data.some((row) => {
    // Skip placeholder rows when checking
    if (isEmptyGroupPlaceholder(row)) {
      return false
    }
    // Check if all values in the combination match
    for (const [key, value] of Object.entries(combination)) {
      if ((row as any)[key] !== value) {
        return false
      }
    }
    return true
  })
}

/**
 * Sort data by the order defined in emptyGroupValues config
 * This ensures groups appear in the expected order (e.g., Electronics, Audio, Furniture, Gaming, Office)
 * rather than based on which groups have data first
 */
function sortByGroupOrder<T extends TableData>(
  data: T[],
  groupingState: string[],
  emptyGroupValues: Record<string, unknown[]>,
): T[] {
  if (groupingState.length === 0) {
    return data
  }

  // Build order maps for each grouping column
  const orderMaps: Map<string, Map<unknown, number>> = new Map()
  for (const columnId of groupingState) {
    const values = emptyGroupValues[columnId]
    if (values) {
      const orderMap = new Map<unknown, number>()
      values.forEach((value, index) => {
        orderMap.set(value, index)
      })
      orderMaps.set(columnId, orderMap)
    }
  }

  // Sort by grouping columns in order
  return [...data].sort((a, b) => {
    for (const columnId of groupingState) {
      const orderMap = orderMaps.get(columnId)
      if (!orderMap) continue

      const aValue = (a as any)[columnId]
      const bValue = (b as any)[columnId]
      const aOrder = orderMap.get(aValue) ?? Number.MAX_SAFE_INTEGER
      const bOrder = orderMap.get(bValue) ?? Number.MAX_SAFE_INTEGER

      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }
    }
    return 0
  })
}

export interface UseNuGridEmptyGroupsOptions<T extends TableData> {
  /** Original data array */
  data: Ref<T[]>
  /** Current grouping state (column IDs being grouped by) */
  groupingState: Ref<GroupingState>
  /** All possible values for each grouping column */
  emptyGroupValues: ComputedRef<Record<string, unknown[]> | undefined>
}

export interface UseNuGridEmptyGroupsReturn<T extends TableData> {
  /** Enhanced data with placeholder rows for empty groups */
  enhancedData: ComputedRef<T[]>
  /** Check if a row is an empty group placeholder */
  isEmptyGroupPlaceholder: (row: T) => boolean
}

/**
 * Composable to handle empty groups in grouped views.
 * Generates placeholder rows for group value combinations that don't exist in the data,
 * ensuring that empty groups are still displayed with add-row functionality.
 */
export function useNuGridEmptyGroups<T extends TableData>(
  options: UseNuGridEmptyGroupsOptions<T>,
): UseNuGridEmptyGroupsReturn<T> {
  const enhancedData = computed<T[]>(() => {
    const originalData = options.data.value
    const grouping = options.groupingState.value
    const emptyGroupValuesConfig = options.emptyGroupValues.value

    // If no grouping or no emptyGroupValues config, return original data
    if (!grouping.length || !emptyGroupValuesConfig || Object.keys(emptyGroupValuesConfig).length === 0) {
      return originalData
    }

    // Generate all possible combinations
    const allCombinations = generateGroupCombinations(grouping, emptyGroupValuesConfig)

    if (allCombinations.length === 0) {
      return originalData
    }

    // Find combinations that don't exist in the data
    const missingCombinations = allCombinations.filter(
      (combo) => !combinationExistsInData(originalData, combo),
    )

    if (missingCombinations.length === 0) {
      return originalData
    }

    // Create placeholder rows for missing combinations
    const placeholders = missingCombinations.map((combo, index) =>
      createPlaceholderRow<T>(combo as Partial<T>, index),
    )

    // Combine original data with placeholders
    const combined = [...originalData, ...placeholders]

    // Sort by the order defined in emptyGroupValues to maintain consistent group ordering
    // Groups should appear in the order specified in emptyGroupValues config
    return sortByGroupOrder(combined, grouping, emptyGroupValuesConfig)
  })

  return {
    enhancedData,
    isEmptyGroupPlaceholder,
  }
}
