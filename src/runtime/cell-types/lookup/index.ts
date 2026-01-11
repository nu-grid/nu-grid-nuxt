import type { Ref } from 'vue'
import type { NuGridCellType, NuGridCellTypeContext } from '../../types/cells'
import type { NuGridLookupItem, NuGridLookupOptions } from '../../types/option-groups'
import { isRef } from 'vue'
import { nuGridDefaults } from '../../config/_internal'
import LookupEditor from './LookupEditor.vue'
import LookupRenderer from './LookupRenderer.vue'

/**
 * Helper to resolve items synchronously (for formatter)
 * Returns empty array for async items since we can't await in formatter
 */
function resolveItemsSync(items: NuGridLookupOptions['items'] | undefined): NuGridLookupItem[] {
  if (!items) return []
  if (typeof items === 'function') return [] // Can't resolve async
  if (isRef(items)) return (items as Ref<NuGridLookupItem[]>).value
  return items
}

/**
 * Lookup cell type
 * Provides dropdown selection using Nuxt UI's SelectMenu component
 * Supports static, reactive, and async item sources
 *
 * Keyboard interactions in edit mode:
 * - **Space**: Opens dropdown when closed; selects highlighted item when open (stays in edit mode)
 * - **Enter**: Selects highlighted item and exits edit mode (closes dropdown if open, then stops editing)
 * - **Escape**: Two-stage behavior - first press closes dropdown, second press cancels editing
 * - **Tab/Shift+Tab**: Closes dropdown and navigates to next/previous cell
 * - **Arrow Up/Down**: Opens dropdown with native item highlighting when closed; navigates items when open
 * - **Arrow Left/Right**: Navigate items when open (USelectMenu native behavior)
 *
 * Keyboard interactions in view mode:
 * - **Space**: Opens the dropdown editor (via keyboardHandler)
 * - **Enter**: Opens the dropdown editor (default grid behavior)
 *
 * Usage:
 * ```ts
 * {
 *   accessorKey: 'status',
 *   cellDataType: 'lookup',
 *   lookup: {
 *     items: [
 *       { value: 'active', label: 'Active' },
 *       { value: 'inactive', label: 'Inactive' },
 *     ],
 *     valueKey: 'value',
 *     labelKey: 'label',
 *     searchable: true,
 *   }
 * }
 * ```
 */
export const lookupCellType: NuGridCellType = {
  name: 'lookup',
  displayName: 'Lookup',
  description: 'Dropdown selection with search support',
  editor: LookupEditor,
  renderer: LookupRenderer,

  /**
   * Format value for display (used in clipboard, export, etc.)
   * Looks up the label from items based on the stored value
   */
  formatter: (value: any, context: NuGridCellTypeContext) => {
    if (value === null || value === undefined) return ''

    const lookup = context.columnDef?.lookup
    if (!lookup) return String(value)

    const items = resolveItemsSync(lookup.items)
    if (!items.length) return String(value)

    const valueKey = lookup.valueKey ?? nuGridDefaults.columnDefaults.lookup.valueKey
    const labelKey = lookup.labelKey ?? nuGridDefaults.columnDefaults.lookup.labelKey

    const item = items.find((i) => i[valueKey] === value)
    return item?.[labelKey] ?? String(value)
  },

  /**
   * Keyboard handler for lookup cells in view mode
   * Space opens the dropdown editor (like native select behavior)
   * Enter also opens the dropdown (default grid behavior)
   */
  keyboardHandler: (event: KeyboardEvent, context: NuGridCellTypeContext) => {
    const { isFocused, canEdit, startEditing } = context

    // Space opens the dropdown (like native select behavior)
    if (isFocused && canEdit && event.key === ' ') {
      event.preventDefault()
      startEditing()
      return { handled: true, preventDefault: true, stopPropagation: true }
    }

    // Let default behavior handle Enter (starts editing)
    return { handled: false }
  },

  // Default column settings
  defaultColumnDef: {
    size: 150,
  },
}
