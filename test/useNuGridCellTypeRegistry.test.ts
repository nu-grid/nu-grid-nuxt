import type { NuGridCellType } from '../src/runtime/types/cells'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import {
  NuGridCellTypeRegistry,
  useNuGridCellTypeRegistry,
} from '../src/runtime/composables/useNuGridCellTypeRegistry'

// Mock builtInCellTypes
vi.mock('../src/runtime/cell-types', () => ({
  builtInCellTypes: [
    { name: 'text', editor: 'TextEditor', renderer: 'TextRenderer' },
    { name: 'number', editor: 'NumberEditor', renderer: 'NumberRenderer' },
    { name: 'boolean', editor: 'BooleanEditor', renderer: 'BooleanRenderer' },
    { name: 'date', editor: 'DateEditor', renderer: 'DateRenderer' },
  ],
}))

describe('cellTypeRegistry', () => {
  describe('constructor', () => {
    it('should initialize with built-in cell types', () => {
      const registry = new NuGridCellTypeRegistry()

      expect(registry.has('text')).toBe(true)
      expect(registry.has('number')).toBe(true)
      expect(registry.has('boolean')).toBe(true)
      expect(registry.has('date')).toBe(true)
    })

    it('should have built-in types available via get', () => {
      const registry = new NuGridCellTypeRegistry()

      expect(registry.get('text')?.name).toBe('text')
      expect(registry.get('number')?.name).toBe('number')
    })
  })

  describe('register', () => {
    it('should register a new cell type', () => {
      const registry = new NuGridCellTypeRegistry()
      const customType: NuGridCellType = {
        name: 'custom',
        editor: 'CustomEditor' as any,
        renderer: 'CustomRenderer' as any,
      }

      registry.register(customType)

      expect(registry.has('custom')).toBe(true)
      expect(registry.get('custom')).toEqual(customType)
    })

    it('should replace existing cell type with same name', () => {
      const registry = new NuGridCellTypeRegistry()
      const customType: NuGridCellType = {
        name: 'text',
        editor: 'CustomTextEditor' as any,
        renderer: 'CustomTextRenderer' as any,
      }

      registry.register(customType)

      expect(registry.get('text')?.editor).toBe('CustomTextEditor')
    })

    it('should clear cache when registering', () => {
      const registry = new NuGridCellTypeRegistry()

      // First get to populate cache
      registry.get('text')
      registry.getEditor('text')
      registry.getRenderer('text')

      // Register new type
      const customType: NuGridCellType = {
        name: 'text',
        editor: 'NewEditor' as any,
        renderer: 'NewRenderer' as any,
      }
      registry.register(customType)

      // Cache should be cleared, get should return new type
      expect(registry.get('text')?.editor).toBe('NewEditor')
      expect(registry.getEditor('text')).toBe('NewEditor')
      expect(registry.getRenderer('text')).toBe('NewRenderer')
    })
  })

  describe('registerAll', () => {
    it('should register multiple cell types', () => {
      const registry = new NuGridCellTypeRegistry()
      const customTypes: NuGridCellType[] = [
        { name: 'custom1', editor: 'Editor1' as any },
        { name: 'custom2', editor: 'Editor2' as any },
      ]

      registry.registerAll(customTypes)

      expect(registry.has('custom1')).toBe(true)
      expect(registry.has('custom2')).toBe(true)
    })
  })

  describe('get', () => {
    it('should return undefined for non-existent type', () => {
      const registry = new NuGridCellTypeRegistry()

      expect(registry.get('nonexistent')).toBeUndefined()
    })

    it('should cache results', () => {
      const registry = new NuGridCellTypeRegistry()

      const first = registry.get('text')
      const second = registry.get('text')

      expect(first).toBe(second)
    })
  })

  describe('getEditor', () => {
    it('should return editor for cell type', () => {
      const registry = new NuGridCellTypeRegistry()

      expect(registry.getEditor('text')).toBe('TextEditor')
    })

    it('should return undefined for non-existent type', () => {
      const registry = new NuGridCellTypeRegistry()

      expect(registry.getEditor('nonexistent')).toBeUndefined()
    })

    it('should cache editor lookups', () => {
      const registry = new NuGridCellTypeRegistry()

      registry.getEditor('text')
      registry.getEditor('text')

      // Cache is working if we get same result
      expect(registry.getEditor('text')).toBe('TextEditor')
    })
  })

  describe('getRenderer', () => {
    it('should return renderer for cell type', () => {
      const registry = new NuGridCellTypeRegistry()

      expect(registry.getRenderer('text')).toBe('TextRenderer')
    })

    it('should return undefined for non-existent type', () => {
      const registry = new NuGridCellTypeRegistry()

      expect(registry.getRenderer('nonexistent')).toBeUndefined()
    })

    it('should cache renderer lookups', () => {
      const registry = new NuGridCellTypeRegistry()

      registry.getRenderer('text')
      registry.getRenderer('text')

      expect(registry.getRenderer('text')).toBe('TextRenderer')
    })
  })

  describe('has', () => {
    it('should return true for registered types', () => {
      const registry = new NuGridCellTypeRegistry()

      expect(registry.has('text')).toBe(true)
    })

    it('should return false for non-existent types', () => {
      const registry = new NuGridCellTypeRegistry()

      expect(registry.has('nonexistent')).toBe(false)
    })
  })

  describe('getAll', () => {
    it('should return all registered cell types', () => {
      const registry = new NuGridCellTypeRegistry()
      const all = registry.getAll()

      expect(all.length).toBeGreaterThanOrEqual(4)
      expect(all.some((t) => t.name === 'text')).toBe(true)
      expect(all.some((t) => t.name === 'number')).toBe(true)
    })
  })

  describe('setBuiltInTypes', () => {
    it('should set built-in types', () => {
      const registry = new NuGridCellTypeRegistry()
      const newBuiltIns: NuGridCellType[] = [{ name: 'newBuiltin', editor: 'NewEditor' as any }]

      registry.setBuiltInTypes(newBuiltIns)

      expect(registry.has('newBuiltin')).toBe(true)
    })

    it('should not override already registered types', () => {
      const registry = new NuGridCellTypeRegistry()
      const customType: NuGridCellType = {
        name: 'text',
        editor: 'CustomEditor' as any,
      }
      registry.register(customType)

      // Try to set built-in with same name
      registry.setBuiltInTypes([{ name: 'text', editor: 'BuiltInEditor' as any }])

      // Should keep the custom type
      expect(registry.get('text')?.editor).toBe('CustomEditor')
    })

    it('should handle non-array input gracefully', () => {
      const registry = new NuGridCellTypeRegistry()
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      registry.setBuiltInTypes(null as any)

      expect(consoleWarnSpy).toHaveBeenCalledWith('setBuiltInTypes: cellTypes must be an array')
      consoleWarnSpy.mockRestore()
    })
  })

  describe('mergeCellTypes', () => {
    it('should return built-in types when no custom types', () => {
      const registry = new NuGridCellTypeRegistry()
      const merged = registry.mergeCellTypes(undefined)

      expect(merged.length).toBeGreaterThanOrEqual(4)
    })

    it('should return built-in types when custom types is empty', () => {
      const registry = new NuGridCellTypeRegistry()
      const merged = registry.mergeCellTypes([])

      expect(merged.length).toBeGreaterThanOrEqual(4)
    })

    it('should override built-in types with custom types of same name', () => {
      const registry = new NuGridCellTypeRegistry()
      const customTypes: NuGridCellType[] = [{ name: 'text', editor: 'CustomTextEditor' as any }]

      const merged = registry.mergeCellTypes(customTypes)
      const textType = merged.find((t) => t.name === 'text')

      expect(textType?.editor).toBe('CustomTextEditor')
    })

    it('should add new custom types', () => {
      const registry = new NuGridCellTypeRegistry()
      const customTypes: NuGridCellType[] = [{ name: 'custom', editor: 'CustomEditor' as any }]

      const merged = registry.mergeCellTypes(customTypes)
      const customType = merged.find((t) => t.name === 'custom')

      expect(customType).toBeDefined()
      expect(customType?.editor).toBe('CustomEditor')
    })

    it('should preserve built-in types not overridden', () => {
      const registry = new NuGridCellTypeRegistry()
      const customTypes: NuGridCellType[] = [{ name: 'text', editor: 'CustomTextEditor' as any }]

      const merged = registry.mergeCellTypes(customTypes)
      const numberType = merged.find((t) => t.name === 'number')

      expect(numberType?.editor).toBe('NumberEditor')
    })
  })
})

describe('useNuGridCellTypeRegistry', () => {
  describe('without custom types', () => {
    it('should return registry and functions', () => {
      const { registry, cellTypes, getCellType, getDefaultEditor } = useNuGridCellTypeRegistry()

      expect(registry).toBeDefined()
      expect(cellTypes.value).toBeDefined()
      expect(typeof getCellType).toBe('function')
      expect(typeof getDefaultEditor).toBe('function')
    })

    it('should return all built-in cell types in cellTypes computed', () => {
      const { cellTypes } = useNuGridCellTypeRegistry()

      expect(cellTypes.value.length).toBeGreaterThanOrEqual(4)
    })

    it('should get cell type by name', () => {
      const { getCellType } = useNuGridCellTypeRegistry()

      const textType = getCellType('text')
      expect(textType?.name).toBe('text')
    })

    it('should return undefined for non-existent type', () => {
      const { getCellType } = useNuGridCellTypeRegistry()

      const nonexistent = getCellType('nonexistent')
      expect(nonexistent).toBeUndefined()
    })

    it('should get default editor', () => {
      const { getDefaultEditor } = useNuGridCellTypeRegistry()

      const editor = getDefaultEditor('text')
      expect(editor).toBe('TextEditor')
    })

    it('should get renderer', () => {
      const { getRenderer } = useNuGridCellTypeRegistry()

      const renderer = getRenderer('text')
      expect(renderer).toBe('TextRenderer')
    })
  })

  describe('with custom types', () => {
    it('should merge custom types with built-in types', () => {
      const customTypes = ref<NuGridCellType[]>([{ name: 'custom', editor: 'CustomEditor' as any }])

      const { cellTypes } = useNuGridCellTypeRegistry(customTypes)

      expect(cellTypes.value.some((t) => t.name === 'custom')).toBe(true)
      expect(cellTypes.value.some((t) => t.name === 'text')).toBe(true)
    })

    it('should prioritize custom types over built-in', () => {
      const customTypes = ref<NuGridCellType[]>([
        { name: 'text', editor: 'CustomTextEditor' as any },
      ])

      const { getCellType } = useNuGridCellTypeRegistry(customTypes)

      const textType = getCellType('text')
      expect(textType?.editor).toBe('CustomTextEditor')
    })

    it('should update when custom types change', () => {
      const customTypes = ref<NuGridCellType[]>([])

      const { getCellType } = useNuGridCellTypeRegistry(customTypes)

      // Initially no custom type
      expect(getCellType('custom')).toBeUndefined()

      // Add custom type
      customTypes.value = [{ name: 'custom', editor: 'Editor' as any }]

      // Now it should exist (from custom types map)
      expect(getCellType('custom')?.name).toBe('custom')
    })
  })

  describe('additional getters', () => {
    it('should get filter configuration', () => {
      const customTypes = ref<NuGridCellType[]>([
        { name: 'custom', filter: { type: 'text' } as any },
      ])

      const { getFilter } = useNuGridCellTypeRegistry(customTypes)

      expect(getFilter('custom')).toEqual({ type: 'text' })
    })

    it('should get keyboard handler', () => {
      const keyboardHandler = vi.fn()
      const customTypes = ref<NuGridCellType[]>([{ name: 'custom', keyboardHandler }])

      const { getKeyboardHandler } = useNuGridCellTypeRegistry(customTypes)

      expect(getKeyboardHandler('custom')).toBe(keyboardHandler)
    })

    it('should get validation function', () => {
      const validation = vi.fn()
      const customTypes = ref<NuGridCellType[]>([{ name: 'custom', validation }])

      const { getValidation } = useNuGridCellTypeRegistry(customTypes)

      expect(getValidation('custom')).toBe(validation)
    })

    it('should get formatter function', () => {
      const formatter = vi.fn()
      const customTypes = ref<NuGridCellType[]>([{ name: 'custom', formatter }])

      const { getFormatter } = useNuGridCellTypeRegistry(customTypes)

      expect(getFormatter('custom')).toBe(formatter)
    })

    it('should check if filtering is enabled', () => {
      const customTypes = ref<NuGridCellType[]>([
        { name: 'filterable', filter: {} as any, enableFiltering: true },
        { name: 'notFilterable', enableFiltering: false },
      ])

      const { isFilteringEnabled } = useNuGridCellTypeRegistry(customTypes)

      expect(isFilteringEnabled('filterable')).toBe(true)
      expect(isFilteringEnabled('notFilterable')).toBe(false)
    })

    it('should default filtering to true if filter config exists', () => {
      const customTypes = ref<NuGridCellType[]>([
        { name: 'hasFilter', filter: { type: 'text' } as any },
      ])

      const { isFilteringEnabled } = useNuGridCellTypeRegistry(customTypes)

      expect(isFilteringEnabled('hasFilter')).toBe(true)
    })

    it('should default filtering to false if no filter config', () => {
      const customTypes = ref<NuGridCellType[]>([{ name: 'noFilter' }])

      const { isFilteringEnabled } = useNuGridCellTypeRegistry(customTypes)

      expect(isFilteringEnabled('noFilter')).toBe(false)
    })
  })
})
