import type { User } from '../data/gridTestData'
import { gridTestData } from '../data/gridTestData'

export interface PaginatedResponse<T> {
  data: T[]
  totalCount: number
  pageIndex: number
  pageSize: number
  totalPages: number
}

interface SortingItem {
  id: string
  desc: boolean
}

export default defineEventHandler((event): PaginatedResponse<User> => {
  const query = getQuery(event)

  // Parse pagination parameters with defaults
  const pageIndex = Number(query.pageIndex) || 0
  const pageSize = Number(query.pageSize) || 20

  // Parse sorting (JSON string from query)
  let sorting: SortingItem[] = []
  if (query.sorting) {
    try {
      sorting = JSON.parse(query.sorting as string)
    } catch {
      // Invalid JSON, ignore
    }
  }

  // Parse global filter
  const globalFilter = (query.globalFilter as string) || ''

  // Start with all data
  let filteredData = [...gridTestData]

  // Apply global filter (search across name, email, location)
  if (globalFilter) {
    const searchLower = globalFilter.toLowerCase()
    filteredData = filteredData.filter(
      (user) =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.location.toLowerCase().includes(searchLower),
    )
  }

  // Apply sorting
  if (sorting.length > 0) {
    filteredData.sort((a, b) => {
      for (const sort of sorting) {
        const aVal = a[sort.id as keyof User]
        const bVal = b[sort.id as keyof User]

        let comparison = 0
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal)
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal
        }

        if (comparison !== 0) {
          return sort.desc ? -comparison : comparison
        }
      }
      return 0
    })
  }

  // Calculate total after filtering but before pagination
  const totalCount = filteredData.length

  // Apply pagination
  const startIndex = pageIndex * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = filteredData.slice(startIndex, endIndex)

  return {
    data: paginatedData,
    totalCount,
    pageIndex,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  }
})
