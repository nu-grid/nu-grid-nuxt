import type { GroupingOptions } from '@tanstack/vue-table'

/**
 * NuGridGroupingOptions extends TanStack's GroupingOptions type.
 * This wrapper type allows for future NuGrid-specific extensions
 * without breaking changes to the public API.
 */
export type NuGridGroupingOptions = Omit<GroupingOptions, 'onGroupingChange'>
