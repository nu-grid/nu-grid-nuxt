import type { TableData } from '@nuxt/ui'
import type { Ref } from 'vue'
import type { NuGridCellType } from '../types/cells'
import { computed } from 'vue'
import { builtInCellTypes } from '../cell-types'

/**
 * Cell type registry for managing cell types
 * Provides centralized registration, lookup, and merging of cell types
 */
export class NuGridCellTypeRegistry {
  private cellTypes = new Map<string, NuGridCellType>()
  private builtInTypes: NuGridCellType[] = []
  // Cache for cell type lookups to improve performance
  private typeCache = new Map<string, NuGridCellType | undefined>()
  // Cache for cell type properties to avoid repeated lookups
  private editorCache = new Map<string, NuGridCellType['editor']>()
  private rendererCache = new Map<string, NuGridCellType['renderer']>()

  constructor() {
    // Initialize with built-in cell types
    // Safety check: ensure builtInCellTypes is defined and is an array
    if (builtInCellTypes && Array.isArray(builtInCellTypes)) {
      this.setBuiltInTypes(builtInCellTypes)
    } else {
      console.warn(
        '[NuGrid] builtInCellTypes is not available or not an array. Cell types may not be registered.',
      )
    }
  }

  /**
   * Register a cell type
   * If a cell type with the same name already exists, it will be replaced
   */
  register(cellType: NuGridCellType): void {
    this.cellTypes.set(cellType.name, cellType)
    // Clear caches for this cell type name
    this.typeCache.delete(cellType.name)
    this.editorCache.delete(cellType.name)
    this.rendererCache.delete(cellType.name)
  }

  /**
   * Register multiple cell types at once
   */
  registerAll(cellTypes: NuGridCellType[]): void {
    for (const cellType of cellTypes) {
      this.register(cellType)
    }
  }

  /**
   * Get a cell type by name
   * Returns undefined if not found
   * Uses cache for performance
   */
  get(name: string): NuGridCellType | undefined {
    // Check cache first
    if (this.typeCache.has(name)) {
      return this.typeCache.get(name)
    }
    // Lookup and cache
    const cellType = this.cellTypes.get(name)
    this.typeCache.set(name, cellType)
    return cellType
  }

  /**
   * Get editor for a cell type (cached)
   */
  getEditor(name: string): NuGridCellType['editor'] {
    if (this.editorCache.has(name)) {
      return this.editorCache.get(name)
    }
    const cellType = this.get(name)
    const editor = cellType?.editor
    this.editorCache.set(name, editor)
    return editor
  }

  /**
   * Get renderer for a cell type (cached)
   */
  getRenderer(name: string): NuGridCellType['renderer'] {
    if (this.rendererCache.has(name)) {
      return this.rendererCache.get(name)
    }
    const cellType = this.get(name)
    const renderer = cellType?.renderer
    this.rendererCache.set(name, renderer)
    return renderer
  }

  /**
   * Check if a cell type is registered
   */
  has(name: string): boolean {
    return this.cellTypes.has(name)
  }

  /**
   * Get all registered cell types
   */
  getAll(): NuGridCellType[] {
    return Array.from(this.cellTypes.values())
  }

  /**
   * Set built-in cell types
   * These are merged with custom cell types, with custom types taking precedence
   */
  setBuiltInTypes(cellTypes: NuGridCellType[]): void {
    // Safety check: ensure cellTypes is an array
    if (!Array.isArray(cellTypes)) {
      console.warn('setBuiltInTypes: cellTypes must be an array')
      return
    }
    this.builtInTypes = cellTypes
    // Register built-in types if they don't already exist
    for (const cellType of cellTypes) {
      if (!this.cellTypes.has(cellType.name)) {
        this.register(cellType)
      }
    }
  }

  /**
   * Merge custom cell types with built-in types
   * Custom types override built-in types with the same name
   * New custom types are added
   */
  mergeCellTypes(customTypes?: NuGridCellType[]): NuGridCellType[] {
    if (!customTypes || customTypes.length === 0) {
      return this.builtInTypes
    }

    // Create a map of custom types by name for efficient lookup
    const customTypeMap = new Map(customTypes.map((t) => [t.name, t]))

    // Start with built-in types, replacing any that have custom overrides
    const mergedTypes = this.builtInTypes.map(
      (builtIn) => customTypeMap.get(builtIn.name) || builtIn,
    )

    // Add any custom types that don't override built-in ones
    for (const custom of customTypes) {
      if (!this.builtInTypes.some((b) => b.name === custom.name)) {
        mergedTypes.push(custom)
      }
    }

    return mergedTypes
  }
}

/**
 * Global cell type registry instance
 */
const globalRegistry = new NuGridCellTypeRegistry()

/**
 * Composable for accessing the cell type registry
 * Provides reactive access to cell types
 * Optimized for performance with caching
 */
export function useNuGridCellTypeRegistry<T extends TableData = TableData>(
  customTypes?: Ref<NuGridCellType<T>[] | undefined>,
) {
  const registry = globalRegistry

  // Cache custom type map for faster lookups (only recompute when customTypes changes)
  const customTypeMap = computed(() => {
    if (!customTypes?.value) return null
    return new Map(customTypes.value.map((t) => [t.name, t]))
  })

  // Reactive cell type list that merges built-in and custom types
  const cellTypes = computed(() => {
    if (customTypes?.value) {
      return registry.mergeCellTypes(customTypes.value as NuGridCellType[]) as NuGridCellType<T>[]
    }
    return registry.getAll() as NuGridCellType<T>[]
  })

  /**
   * Get a cell type by name (optimized with cache)
   */
  const getCellType = (name: string): NuGridCellType<T> | undefined => {
    // First check custom types map (O(1) lookup)
    const customMap = customTypeMap.value
    if (customMap) {
      const custom = customMap.get(name)
      if (custom) return custom as NuGridCellType<T>
    }
    // Then check registry (uses internal cache)
    return registry.get(name) as NuGridCellType<T> | undefined
  }

  /**
   * Get default editor for a cell type
   * Checks custom types first, then falls back to global registry
   */
  const getDefaultEditor = (cellDataType: string): NuGridCellType['editor'] => {
    const cellType = getCellType(cellDataType)
    return cellType?.editor
  }

  /**
   * Get renderer for a cell type
   * Checks custom types first, then falls back to global registry
   */
  const getRenderer = (cellDataType: string): NuGridCellType['renderer'] => {
    const cellType = getCellType(cellDataType)
    return cellType?.renderer
  }

  /**
   * Get filter configuration for a cell type
   */
  const getFilter = (cellDataType: string): NuGridCellType['filter'] => {
    const cellType = getCellType(cellDataType)
    return cellType?.filter
  }

  /**
   * Get filter function for a cell type
   */
  const getFilterFn = (cellDataType: string): NuGridCellType<T>['filterFn'] => {
    const cellType = getCellType(cellDataType)
    return cellType?.filterFn as NuGridCellType<T>['filterFn']
  }

  /**
   * Get keyboard handler for a cell type
   */
  const getKeyboardHandler = (cellDataType: string): NuGridCellType<T>['keyboardHandler'] => {
    const cellType = getCellType(cellDataType)
    return cellType?.keyboardHandler as NuGridCellType<T>['keyboardHandler']
  }

  /**
   * Get validation function for a cell type
   */
  const getValidation = (cellDataType: string): NuGridCellType<T>['validation'] => {
    const cellType = getCellType(cellDataType)
    return cellType?.validation as NuGridCellType<T>['validation']
  }

  /**
   * Get formatter function for a cell type
   */
  const getFormatter = (cellDataType: string): NuGridCellType<T>['formatter'] => {
    const cellType = getCellType(cellDataType)
    return cellType?.formatter as NuGridCellType<T>['formatter']
  }

  /**
   * Get column menu items callback for a cell type
   */
  const getColumnMenuItems = (cellDataType: string): NuGridCellType<T>['columnMenuItems'] => {
    const cellType = getCellType(cellDataType)
    return cellType?.columnMenuItems as NuGridCellType<T>['columnMenuItems']
  }

  /**
   * Get default cell renderer for a cell type
   */
  const getDefaultCellRenderer = (
    cellDataType: string,
  ): NuGridCellType<T>['defaultCellRenderer'] => {
    const cellType = getCellType(cellDataType)
    return cellType?.defaultCellRenderer as NuGridCellType<T>['defaultCellRenderer']
  }

  /**
   * Check if filtering is enabled for a cell type
   */
  const isFilteringEnabled = (cellDataType: string): boolean => {
    const cellType = getCellType(cellDataType)
    if (cellType?.enableFiltering !== undefined) {
      return cellType.enableFiltering
    }
    // Default to true if filter config exists
    return !!cellType?.filter
  }

  return {
    registry,
    cellTypes,
    getCellType,
    getDefaultEditor,
    getRenderer,
    getFilter,
    getFilterFn,
    getKeyboardHandler,
    getValidation,
    getFormatter,
    getColumnMenuItems,
    getDefaultCellRenderer,
    isFilteringEnabled,
  }
}

/**
 * Export the global registry for direct access if needed
 */
export { globalRegistry as nuGridCellTypeRegistry }
