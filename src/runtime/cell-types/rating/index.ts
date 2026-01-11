import type { NuGridCellType, NuGridCellTypeContext } from '../../types/cells'
import RatingEditor from './RatingEditor.vue'
import RatingFilter from './RatingFilter.vue'
import RatingRenderer from './RatingRenderer.vue'

/**
 * Rating cell type
 * 1-5 star rating with visual stars and range filter
 */
export const ratingCellType: NuGridCellType = {
  name: 'rating',
  displayName: 'Rating',
  description: '1-5 star rating column with visual stars',
  editor: RatingEditor,
  renderer: RatingRenderer,
  filter: {
    component: RatingFilter,
    defaultOperator: 'gte',
  },
  enableFiltering: true,
  validation: (value: any) => {
    if (value === null || value === undefined) {
      return { valid: true } // Allow empty ratings
    }
    const numValue = Number(value)
    if (Number.isNaN(numValue) || numValue < 0 || numValue > 5) {
      return {
        valid: false,
        message: 'Rating must be between 0 and 5',
      }
    }
    return { valid: true }
  },
  formatter: (value: any) => {
    if (value === null || value === undefined) return ''
    const numValue = Number(value)
    if (Number.isNaN(numValue)) return String(value)
    return `${numValue} ⭐`
  },
  keyboardHandler: (event: KeyboardEvent, context: NuGridCellTypeContext) => {
    const { isFocused, canEdit, getValue, row, columnDef, data, tableApi, emitChange } = context

    // Number keys 0-5 set rating directly (0 clears/null)
    if (isFocused && canEdit) {
      if (event.key === '0') {
        const oldValue = getValue()
        const rowIndex = data.findIndex((r: any, index: number) => {
          return tableApi.options.getRowId?.(r, index) === row.id || r === row.original
        })

        if (rowIndex !== -1 && columnDef.accessorKey) {
          const key = columnDef.accessorKey as string
          ;(data[rowIndex] as any)[key] = null
          emitChange(oldValue, null)
        }

        return { handled: true, preventDefault: true, stopPropagation: true }
      } else if (event.key >= '1' && event.key <= '5') {
        const newValue = Number.parseInt(event.key)
        const oldValue = getValue()

        // Update the data directly
        const rowIndex = data.findIndex((r: any, index: number) => {
          return tableApi.options.getRowId?.(r, index) === row.id || r === row.original
        })

        if (rowIndex !== -1 && columnDef.accessorKey) {
          const key = columnDef.accessorKey as string
          ;(data[rowIndex] as any)[key] = newValue
          emitChange(oldValue, newValue)
        }

        return { handled: true, preventDefault: true, stopPropagation: true }
      }
    }

    return { handled: false }
  },
  defaultColumnDef: {
    size: 120,
  },
}
