import type { NuGridCellType } from '../../types/cells'
import TextareaEditor from './TextareaEditor.vue'
import TextEditor from './TextEditor.vue'
import TextFilter from './TextFilter.vue'

/**
 * Text cell type
 * Standard text input with no special keyboard handling
 */
export const textCellType: NuGridCellType = {
  name: 'text',
  displayName: 'Text',
  description: 'Standard text input column',
  editor: TextEditor,
  filter: {
    component: TextFilter,
    defaultOperator: 'contains',
  },
  enableFiltering: true,
}

// Re-export textarea cell type
export { textareaCellType } from './textarea'

// Export editor components for custom use
export { TextareaEditor, TextEditor }
