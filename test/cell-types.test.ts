import type { NuGridCellType, NuGridCellTypeContext } from '../src/runtime/types/cells'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  booleanCellType,
  builtInCellTypes,
  dateCellType,
  numberCellType,
  textCellType,
} from '../src/runtime/cell-types'
// Import the registry class and built-in cell types
import { NuGridCellTypeRegistry } from '../src/runtime/composables/useNuGridCellTypeRegistry'

// Mock Vue component imports to avoid Nuxt import issues in test environment
// These components are imported by the cell types but don't need to be fully rendered in unit tests
vi.mock('../src/runtime/cell-types/text/TextEditor.vue', () => ({
  default: { name: 'TextEditor' },
}))
vi.mock('../src/runtime/cell-types/number/NumberEditor.vue', () => ({
  default: { name: 'NumberEditor' },
}))
vi.mock('../src/runtime/cell-types/date/DateEditor.vue', () => ({
  default: { name: 'DateEditor' },
}))
vi.mock('../src/runtime/cell-types/boolean/BooleanEditor.vue', () => ({
  default: { name: 'BooleanEditor' },
}))
vi.mock('../src/runtime/cell-types/boolean/BooleanRenderer.vue', () => ({
  default: { name: 'BooleanRenderer' },
}))
vi.mock('../src/runtime/cell-types/selection/SelectionEditor.vue', () => ({
  default: { name: 'SelectionEditor' },
}))
vi.mock('../src/runtime/cell-types/selection/SelectionRenderer.vue', () => ({
  default: { name: 'SelectionRenderer' },
}))
vi.mock('../src/runtime/cell-types/action-menu/ActionMenuRenderer.vue', () => ({
  default: { name: 'ActionMenuRenderer' },
}))

/**
 * Tests for the cell type system
 *
 * This test suite verifies that:
 * 1. Built-in cell types are correctly defined
 * 2. Cell type registry registration and lookup work correctly
 * 3. Editor and keyboard handler lookups work
 * 4. Boolean cell type keyboard handling works as expected
 * 5. Cell type merging works correctly
 */

describe('cell Types', () => {
  describe('built-in cell types', () => {
    it('should have all built-in cell types', () => {
      expect(builtInCellTypes.length).toBeGreaterThanOrEqual(6)
      const cellTypeNames = builtInCellTypes.map((p) => p.name)
      expect(cellTypeNames).toContain('text')
      expect(cellTypeNames).toContain('number')
      expect(cellTypeNames).toContain('date')
      expect(cellTypeNames).toContain('boolean')
      expect(cellTypeNames).toContain('selection')
      expect(cellTypeNames).toContain('action-menu')
    })

    it('should have text cell type with correct name and editor', () => {
      expect(textCellType.name).toBe('text')
      expect(textCellType.editor).toBeDefined()
      expect(textCellType.keyboardHandler).toBeUndefined()
    })

    it('should have number cell type with correct name and editor', () => {
      expect(numberCellType.name).toBe('number')
      expect(numberCellType.editor).toBeDefined()
      expect(numberCellType.keyboardHandler).toBeUndefined()
    })

    it('should have date cell type with correct name and editor', () => {
      expect(dateCellType.name).toBe('date')
      expect(dateCellType.editor).toBeDefined()
      expect(dateCellType.keyboardHandler).toBeUndefined()
    })

    it('should have boolean cell type with correct name, editor, and keyboard handler', () => {
      expect(booleanCellType.name).toBe('boolean')
      expect(booleanCellType.editor).toBeDefined()
      expect(booleanCellType.keyboardHandler).toBeDefined()
    })
  })

  describe('cellTypeRegistry', () => {
    let registry: NuGridCellTypeRegistry

    beforeEach(() => {
      registry = new NuGridCellTypeRegistry()
    })

    describe('cell type registration and lookup', () => {
      it('should register and retrieve a cell type', () => {
        const customCellType: NuGridCellType = {
          name: 'custom',
          displayName: 'Custom Cell Type',
        }
        registry.register(customCellType)
        expect(registry.has('custom')).toBe(true)
        expect(registry.get('custom')).toBe(customCellType)
      })

      it('should return undefined for unregistered cell type', () => {
        expect(registry.get('unknown')).toBeUndefined()
        expect(registry.has('unknown')).toBe(false)
      })

      it('should replace existing cell type when registering with same name', () => {
        const cellType1: NuGridCellType = { name: 'test', displayName: 'Test 1' }
        const cellType2: NuGridCellType = { name: 'test', displayName: 'Test 2' }
        registry.register(cellType1)
        registry.register(cellType2)
        expect(registry.get('test')?.displayName).toBe('Test 2')
      })

      it('should register multiple cell types at once', () => {
        const cellTypes: NuGridCellType[] = [
          { name: 'cellType1', displayName: 'Cell Type 1' },
          { name: 'cellType2', displayName: 'Cell Type 2' },
        ]
        registry.registerAll(cellTypes)
        expect(registry.has('cellType1')).toBe(true)
        expect(registry.has('cellType2')).toBe(true)
      })
    })

    describe('getEditor', () => {
      it('should return editor for registered cell type', () => {
        const cellType: NuGridCellType = {
          name: 'test',
          editor: { name: 'TestEditor' } as any,
        }
        registry.register(cellType)
        const editor = registry.getEditor('test')
        expect(editor).toBe(cellType.editor)
      })

      it('should return undefined for cell type without editor', () => {
        const cellType: NuGridCellType = {
          name: 'test',
        }
        registry.register(cellType)
        expect(registry.getEditor('test')).toBeUndefined()
      })

      it('should cache editor lookups', () => {
        const cellType: NuGridCellType = {
          name: 'test',
          editor: { name: 'TestEditor' } as any,
        }
        registry.register(cellType)
        const editor1 = registry.getEditor('test')
        const editor2 = registry.getEditor('test')
        expect(editor1).toBe(editor2)
      })
    })

    describe('getRenderer', () => {
      it('should return renderer for registered cell type', () => {
        const cellType: NuGridCellType = {
          name: 'test',
          renderer: { name: 'TestRenderer' } as any,
        }
        registry.register(cellType)
        const renderer = registry.getRenderer('test')
        expect(renderer).toBe(cellType.renderer)
      })

      it('should return undefined for cell type without renderer', () => {
        const cellType: NuGridCellType = {
          name: 'test',
        }
        registry.register(cellType)
        expect(registry.getRenderer('test')).toBeUndefined()
      })
    })

    describe('mergeCellTypes', () => {
      it('should return built-in cell types when no custom cell types provided', () => {
        const result = registry.mergeCellTypes()
        expect(result.length).toBeGreaterThanOrEqual(6)
        expect(result.map((p) => p.name)).toContain('text')
      })

      it('should return built-in cell types when empty array provided', () => {
        const result = registry.mergeCellTypes([])
        expect(result.length).toBeGreaterThanOrEqual(6)
      })

      it('should add custom cell type to built-in cell types', () => {
        const customCellType: NuGridCellType = {
          name: 'rating',
          displayName: 'Rating',
        }
        const result = registry.mergeCellTypes([customCellType])
        expect(result.map((p) => p.name)).toContain('rating')
        expect(result.map((p) => p.name)).toContain('text')
      })

      it('should override built-in cell type with custom cell type of same name', () => {
        const customNumberCellType: NuGridCellType = {
          name: 'number',
          displayName: 'Custom Number',
          keyboardHandler: () => ({ handled: true }),
        }
        const result = registry.mergeCellTypes([customNumberCellType])
        const numberCellType = result.find((p) => p.name === 'number')
        expect(numberCellType).toBe(customNumberCellType)
        expect(numberCellType?.keyboardHandler).toBeDefined()
      })

      it('should preserve built-in order for overridden cell types, add new ones at end', () => {
        const customNumberCellType: NuGridCellType = {
          name: 'number',
          displayName: 'Custom Number',
        }
        const customRatingCellType: NuGridCellType = {
          name: 'rating',
          displayName: 'Rating',
        }
        const result = registry.mergeCellTypes([customNumberCellType, customRatingCellType])
        // Built-in order should be preserved
        const textIndex = result.findIndex((p) => p.name === 'text')
        const numberIndex = result.findIndex((p) => p.name === 'number')
        const ratingIndex = result.findIndex((p) => p.name === 'rating')
        expect(textIndex).toBeLessThan(numberIndex)
        expect(numberIndex).toBeLessThan(ratingIndex)
      })
    })
  })

  describe('boolean cell type keyboard handling', () => {
    const createMockContext = (
      overrides: Partial<NuGridCellTypeContext> = {},
    ): NuGridCellTypeContext => ({
      cell: {},
      row: { id: 'row-1', original: { id: 1, active: false } } as any,
      columnDef: { accessorKey: 'active' },
      column: {} as any,
      getValue: () => false,
      isFocused: true,
      canEdit: true,
      data: [{ id: 1, active: false }],
      tableApi: {
        options: {
          getRowId: (r: any) => `row-${r.id}`,
        },
      } as any,
      startEditing: () => {},
      stopEditing: () => {},
      emitChange: () => {},
      ...overrides,
    })

    it('should handle space key when focused and editable', () => {
      const mockEmitChange = {
        called: false,
        oldValue: undefined as any,
        newValue: undefined as any,
      }
      const context = createMockContext({
        emitChange: (oldValue: any, newValue: any) => {
          mockEmitChange.called = true
          mockEmitChange.oldValue = oldValue
          mockEmitChange.newValue = newValue
        },
      })

      const event = new KeyboardEvent('keydown', { key: ' ' })
      const result = booleanCellType.keyboardHandler!(event, context)

      expect(result.handled).toBe(true)
      expect(result.preventDefault).toBe(true)
      expect(result.stopPropagation).toBe(true)
      expect(mockEmitChange.called).toBe(true)
      expect(mockEmitChange.oldValue).toBe(false)
      expect(mockEmitChange.newValue).toBe(true)
    })

    it('should not handle space key when not focused', () => {
      const context = createMockContext({ isFocused: false })
      const event = new KeyboardEvent('keydown', { key: ' ' })
      const result = booleanCellType.keyboardHandler!(event, context)

      expect(result.handled).toBe(false)
    })

    it('should not handle space key when not editable', () => {
      const context = createMockContext({ canEdit: false })
      const event = new KeyboardEvent('keydown', { key: ' ' })
      const result = booleanCellType.keyboardHandler!(event, context)

      expect(result.handled).toBe(false)
    })

    it('should not handle Enter key (let default behavior handle it)', () => {
      const context = createMockContext()
      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      const result = booleanCellType.keyboardHandler!(event, context)

      expect(result.handled).toBe(false)
    })

    it('should not handle other keys', () => {
      const context = createMockContext()
      const event = new KeyboardEvent('keydown', { key: 'a' })
      const result = booleanCellType.keyboardHandler!(event, context)

      expect(result.handled).toBe(false)
    })

    it('should toggle value from true to false', () => {
      const mockEmitChange = { oldValue: undefined as any, newValue: undefined as any }
      const data = [{ id: 1, active: true }]
      const context = createMockContext({
        getValue: () => true,
        data,
        emitChange: (oldValue: any, newValue: any) => {
          mockEmitChange.oldValue = oldValue
          mockEmitChange.newValue = newValue
        },
      })

      const event = new KeyboardEvent('keydown', { key: ' ' })
      booleanCellType.keyboardHandler!(event, context)

      expect(mockEmitChange.oldValue).toBe(true)
      expect(mockEmitChange.newValue).toBe(false)
      expect(data[0].active).toBe(false)
    })
  })

  describe('custom cell type example', () => {
    it('should allow creating custom cell types with keyboard handlers', () => {
      // Example: Rating cell type that responds to 1-5 keys
      const ratingCellType: NuGridCellType = {
        name: 'rating',
        displayName: 'Rating',
        keyboardHandler: (event, context) => {
          if (event.key >= '1' && event.key <= '5' && context.isFocused && context.canEdit) {
            const newValue = Number.parseInt(event.key)
            const oldValue = context.getValue()

            // Find row and update
            const rowIndex = context.data.findIndex((r: any) => r === context.row.original)
            if (rowIndex !== -1 && context.columnDef.accessorKey) {
              ;(context.data[rowIndex] as any)[context.columnDef.accessorKey] = newValue
              context.emitChange(oldValue, newValue)
            }

            return { handled: true, preventDefault: true, stopPropagation: true }
          }
          return { handled: false }
        },
      }

      const mockEmitChange = {
        called: false,
        oldValue: undefined as any,
        newValue: undefined as any,
      }
      const data = [{ id: 1, rating: 3 }]
      const context: NuGridCellTypeContext = {
        cell: {},
        row: { id: 'row-1', original: data[0] } as any,
        columnDef: { accessorKey: 'rating' },
        column: {} as any,
        getValue: () => 3,
        isFocused: true,
        canEdit: true,
        data,
        tableApi: {} as any,
        startEditing: () => {},
        stopEditing: () => {},
        emitChange: (oldValue: any, newValue: any) => {
          mockEmitChange.called = true
          mockEmitChange.oldValue = oldValue
          mockEmitChange.newValue = newValue
        },
      }

      const event = new KeyboardEvent('keydown', { key: '5' })
      const result = ratingCellType.keyboardHandler!(event, context)

      expect(result.handled).toBe(true)
      expect(mockEmitChange.called).toBe(true)
      expect(mockEmitChange.oldValue).toBe(3)
      expect(mockEmitChange.newValue).toBe(5)
      expect(data[0].rating).toBe(5)
    })
  })
})
