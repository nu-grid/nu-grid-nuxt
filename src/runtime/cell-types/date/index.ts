import type { NuGridCellType } from '../../types/cells'
import DateEditor from './DateEditor.vue'
import DateFilter from './DateFilter.vue'

/**
 * Date cell type
 * Date picker input, no special keyboard handling
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
}
