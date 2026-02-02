import type { NuGridCellType, NuGridCellTypeContext } from '../../types/cells'
import DateEditor from './DateEditor.vue'
import DateFilter from './DateFilter.vue'

/**
 * Date cell type
 * Date picker input with short date formatting
 */
export const dateCellType: NuGridCellType = {
  name: 'date',
  displayName: 'Date',
  description: 'Date picker column',
  editor: DateEditor,
  filter: {
    component: DateFilter,
    defaultOperator: 'equals',
  },
  enableFiltering: true,
  formatter: (value: any, context: NuGridCellTypeContext) => {
    if (value === null || value === undefined) return ''

    // Convert to Date if needed
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)

    // Get locale from column definition or default to en-US
    const locale = (context.columnDef as any).locale || 'en-US'

    // Use short date format by default
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
  },
  defaultColumnDef: {
    size: 100,
  },
}
