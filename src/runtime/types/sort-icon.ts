/**
 * Sort icon configuration for a column header
 * Allows customizing the icons shown for each sort state
 */
export interface NuGridSortIcon {
  /**
   * Icon to show when column is not sorted
   * @defaultValue 'i-lucide-chevrons-up-down'
   */
  unsorted?: string

  /**
   * Icon to show when column is sorted in ascending order
   * @defaultValue 'i-lucide-arrow-up'
   */
  asc?: string

  /**
   * Icon to show when column is sorted in descending order
   * @defaultValue 'i-lucide-arrow-down'
   */
  desc?: string

  /**
   * Only show unsorted icon on hover
   * When true, the unsorted icon will only appear when hovering over the header
   * @defaultValue true
   */
  unsortedHover?: boolean

  /**
   * Placement of the sort icon relative to header content
   * - 'edge': Icon renders at the far edge of the header cell
   * - 'inline': Icon renders directly after the header label
   * - 'none': Icon omitted entirely (use custom UI)
   * @defaultValue 'edge'
   */
  position?: 'edge' | 'inline' | 'none'
}
