// ============================================================================
// PUBLIC API UTILITIES
// These utilities are part of the stable public API for nu-grid users.
// ============================================================================

// Column helper for type-safe column definitions
export * from './columnHelper'

// Data type inference utility
// Allows custom inference logic or understanding of how types are detected
export { extractColumnValues, inferCellDataType } from './inferCellDataType'

// Standard Schema validation utilities
// NOTE: excelExport is intentionally NOT exported here to avoid SSR issues.
// The write-excel-file dependency uses file-saver which accesses navigator.userAgent
// on module load, breaking SSR. Use the useNuGridExcel composable instead,
// which uses dynamic imports to load the excel functionality only on the client.
export * from './standardSchema'
