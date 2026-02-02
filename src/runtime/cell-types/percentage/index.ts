import type { NuGridCellType, NuGridCellTypeContext } from '../../types/cells'
import PercentageEditor from './PercentageEditor.vue'
import PercentageFilter from './PercentageFilter.vue'

/**
 * Percentage cell type
 * Displays values as percentages with % suffix
 *
 * Storage modes (configurable via percentageStorage column option):
 * - 'decimal' (default): Values stored as 0-1, displayed as 0-100%
 * - 'percent': Values stored as 0-100, displayed as 0-100%
 */
export const percentageCellType: NuGridCellType = {
  name: 'percentage',
  displayName: 'Percentage',
  description: 'Percentage column with % formatting',
  editor: PercentageEditor,
  filter: {
    component: PercentageFilter,
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

    // Get storage mode from column definition
    const storageMode = (context.columnDef as any).percentageStorage ?? 'decimal'

    // Convert to percentage for display
    const displayValue = storageMode === 'decimal' ? numValue * 100 : numValue

    // Get decimal places from column definition or default to 1
    const decimals = (context.columnDef as any).percentageDecimals ?? 1

    return `${displayValue.toFixed(decimals)}%`
  },
  defaultColumnDef: {
    size: 100,
  },
}
