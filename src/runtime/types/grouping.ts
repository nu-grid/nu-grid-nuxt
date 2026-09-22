/**
 * NuGrid grouping options.
 * Replaces TanStack's GroupingOptions (minus onGroupingChange which NuGrid handles internally).
 */
export interface NuGridGroupingOptions {
  manualGrouping?: boolean
  enableGrouping?: boolean
  groupedColumnMode?: false | 'reorder' | 'remove'
}
