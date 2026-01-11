import type { NuGridCellType } from '../../types/cells'
import NumberEditor from './NumberEditor.vue'
import NumberFilter from './NumberFilter.vue'

/**
 * Number cell type
 * Number input with step controls, no special keyboard handling
 */
export const numberCellType: NuGridCellType = {
  name: 'number',
  displayName: 'Number',
  description: 'Number input column',
  editor: NumberEditor,
  filter: {
    component: NumberFilter,
    defaultOperator: 'equals',
  },
  enableFiltering: true,
}
