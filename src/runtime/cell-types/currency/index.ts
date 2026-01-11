import type { NuGridCellType, NuGridCellTypeContext } from '../../types/cells'
import CurrencyEditor from './CurrencyEditor.vue'
import CurrencyFilter from './CurrencyFilter.vue'

/**
 * Currency cell type
 * Currency formatting with range filter
 */
export const currencyCellType: NuGridCellType = {
  name: 'currency',
  displayName: 'Currency',
  description: 'Currency column with formatting and range filter',
  editor: CurrencyEditor,
  filter: {
    component: CurrencyFilter,
    defaultOperator: 'equals',
  },
  enableFiltering: true,
  validation: (value: any) => {
    if (value === null || value === undefined) {
      return { valid: true } // Allow empty values
    }
    const numValue = Number(value)
    if (Number.isNaN(numValue)) {
      return {
        valid: false,
        message: 'Value must be a valid number',
      }
    }
    return { valid: true }
  },
  formatter: (value: any, context: NuGridCellTypeContext) => {
    if (value === null || value === undefined) return ''
    const numValue = Number(value)
    if (Number.isNaN(numValue)) return String(value)

    // Get currency from column definition or default to USD
    const currency = (context.columnDef as any).currency || 'USD'
    const locale = (context.columnDef as any).locale || 'en-US'

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue)
  },
  defaultColumnDef: {
    size: 120,
  },
}
