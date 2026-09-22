import type { Row } from '../engine'

/**
 * NuGridRow extends the engine's Row type.
 * This wrapper type allows for future NuGrid-specific extensions
 * without breaking changes to the public API.
 */
export type NuGridRow<TData = unknown> = Row<TData>
