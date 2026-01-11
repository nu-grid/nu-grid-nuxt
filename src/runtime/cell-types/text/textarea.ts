import type { NuGridCellType } from '../../types/cells'
import TextareaEditor from './TextareaEditor.vue'
import TextFilter from './TextFilter.vue'

/**
 * Textarea cell type
 * Multi-line text input for long text content
 *
 * Keyboard behavior:
 * - Enter: Creates a new line
 * - Cmd/Ctrl+Enter or Shift+Enter: Saves and exits
 * - Escape: Cancels editing
 * - Tab/Shift+Tab: Saves and navigates to next/previous cell
 * - Arrow keys: Move cursor within textarea (not intercepted for cell navigation)
 */
export const textareaCellType: NuGridCellType = {
  name: 'textarea',
  displayName: 'Textarea',
  description: 'Multi-line text input for long content',
  editor: TextareaEditor,
  filter: {
    component: TextFilter,
    defaultOperator: 'contains',
  },
  enableFiltering: true,
}
