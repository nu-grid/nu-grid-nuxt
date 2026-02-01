/* eslint-disable perfectionist/sort-named-imports */
/* eslint-disable unused-imports/no-unused-imports */
/**
 * Public API Tests
 *
 * These tests lock down the public API to prevent accidental breaking changes.
 * If any of these tests fail, it means a public API contract has changed.
 *
 * This file tests all exports from:
 * - Main entry point (src/runtime/index.ts)
 * - Types entry point (src/runtime/types/index.ts)
 * - Themes entry point (src/runtime/themes/index.ts)
 * - Cells entry point (src/runtime/types/cells.ts)
 * - Composables entry point (src/runtime/composables/index.ts)
 * - Config entry point (src/runtime/config/index.ts)
 */

// Type-level verification (compile-time checks)
// These imports will cause TypeScript errors if types are removed
import type { NuGridStateSnapshot } from '../src/runtime/composables'
import type {
  // Action Menu types
  NuGridActionMenuItem,
  NuGridActionMenuOptions,
  // Add Row types
  NuGridAddRowFinalizeResult,
  NuGridAddRowState,
  // Option Group types
  NuGridLookupItem,
  NuGridActionsOptions,
  NuGridAnimationOptions,
  NuGridAnimationPreset,
  // Autosize types
  NuGridAutosize,
  NuGridAutoSizeStrategy,
  // Cell types
  NuGridCellEditorEmits,
  NuGridCellEditorProps,
  NuGridCellRenderContext,
  NuGridCellType,
  NuGridCellTypeContext,
  NuGridCellTypeKeyboardResult,
  // Column types
  NuGridColumn,
  NuGridColumnMenuItem,
  NuGridColumnMenuItemsCallback,
  NuGridColumnMenuOptions,
  NuGridColumnMenuPreset,
  NuGridColumnPlacement,
  NuGridEditingOptions,
  NuGridExcelExportOptions,
  NuGridFilterConfig,
  NuGridFilterContext,
  NuGridFilterOperator,
  NuGridFocusOptions,
  // Grouping types
  NuGridGroupingOptions,
  NuGridLayoutMode,
  NuGridLayoutOptions,
  NuGridLookupOptions,
  NuGridMultiRowOptions,
  // Validation types
  NuGridOnInvalid,
  NuGridPagingOptions,
  // Props types
  NuGridProps,
  NuGridRendererConfig,
  // Row types
  NuGridRow,
  // Row Selection types
  NuGridRowSelectOptions,
  NuGridScrollbars,
  NuGridSelectionOptions,
  NuGridShowErrors,
  // Sort Icon types
  NuGridSortIcon,
  NuGridStateOptions,
  NuGridStatePart,
  NuGridStorageType,
  // Theme types
  NuGridTheme,
  NuGridThemeDefinition,
  NuGridTooltipOptions,
  NuGridValidateOn,
  NuGridValidationOptions,
  NuGridValidationResult,
} from '../src/runtime/types'

import { describe, expect, it } from 'vitest'

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

describe('main entry point', () => {
  it('exports createColumnHelper function', async () => {
    const mainModule = await import('../src/runtime/index')
    expect(mainModule.createColumnHelper).toBeDefined()
    expect(typeof mainModule.createColumnHelper).toBe('function')
  })

  it('createColumnHelper returns an object with accessor, display, and group methods', async () => {
    const { createColumnHelper } = await import('../src/runtime/index')
    const helper = createColumnHelper<{ id: number; name: string }>()

    expect(helper).toBeDefined()
    expect(typeof helper.accessor).toBe('function')
    expect(typeof helper.display).toBe('function')
    expect(typeof helper.group).toBe('function')
  })

  it('main entry point exports exactly the expected items', async () => {
    const mainModule = await import('../src/runtime/index')
    const exportKeys = Object.keys(mainModule)

    // Currently exports: createColumnHelper
    expect(exportKeys).toContain('createColumnHelper')
    expect(exportKeys.length).toBe(1)
  })
})

// =============================================================================
// TYPES ENTRY POINT
// =============================================================================

describe('types entry point', () => {
  it('module imports successfully', async () => {
    const types = await import('../src/runtime/types')
    expect(types).toBeDefined()
  })
})

// Type assertion tests - verify the shape of key types at compile time
describe('type shape verification', () => {
  it('nuGridProps has expected structure', () => {
    const propsCheck: Partial<NuGridProps<any>> = {
      data: [],
      columns: [],
    }
    expect(propsCheck.data).toEqual([])
    expect(propsCheck.columns).toEqual([])
  })

  it('nuGridFocusOptions has expected properties', () => {
    const focusOptions: Partial<NuGridFocusOptions> = {
      mode: 'cell',
      retain: true,
      cmdArrows: 'paging',
    }
    expect(focusOptions.mode).toBe('cell')
  })

  it('nuGridEditingOptions has expected properties', () => {
    const editingOptions: Partial<NuGridEditingOptions<any>> = {
      enabled: true,
    }
    expect(editingOptions.enabled).toBe(true)
  })

  it('nuGridSelectionOptions has expected properties', () => {
    const selectionOptions: Partial<NuGridSelectionOptions<any>> = {
      enabled: true,
    }
    expect(selectionOptions.enabled).toBe(true)
  })

  it('nuGridValidationOptions has expected properties', () => {
    const validationOptions: Partial<NuGridValidationOptions> = {
      validateOn: 'reward',
    }
    expect(validationOptions.validateOn).toBe('reward')
  })

  it('nuGridLayoutOptions has expected properties', () => {
    const layoutOptions: Partial<NuGridLayoutOptions> = {
      stickyHeaders: true,
    }
    expect(layoutOptions.stickyHeaders).toBe(true)
  })

  it('nuGridStateOptions has expected properties', () => {
    const stateOptions: Partial<NuGridStateOptions> = {
      key: 'test-key',
    }
    expect(stateOptions.key).toBe('test-key')
  })

  it('nuGridPagingOptions has expected properties', () => {
    const pagingOptions: Partial<NuGridPagingOptions> = {
      pageSize: 10,
    }
    expect(pagingOptions.pageSize).toBe(10)
  })

  it('nuGridThemeDefinition has expected structure', () => {
    const themeDefinition: Partial<NuGridThemeDefinition> = {
      name: 'test-theme',
      displayName: 'Test Theme',
    }
    expect(themeDefinition.name).toBe('test-theme')
  })

  it('nuGridCellType has expected structure', () => {
    const cellType: Partial<NuGridCellType> = {
      name: 'custom',
      displayName: 'Custom Type',
    }
    expect(cellType.name).toBe('custom')
  })

  it('nuGridFilterOperator has expected structure', () => {
    const filterOperator: NuGridFilterOperator = {
      value: 'equals',
      label: 'Equals',
      filterFn: () => true,
    }
    expect(filterOperator.value).toBe('equals')
    expect(filterOperator.label).toBe('Equals')
    expect(typeof filterOperator.filterFn).toBe('function')
  })

  it('nuGridCellEditorProps has expected properties', () => {
    const editorProps: Partial<NuGridCellEditorProps> = {
      modelValue: 'test',
      isNavigating: false,
      shouldFocus: true,
    }
    expect(editorProps.modelValue).toBe('test')
    expect(editorProps.isNavigating).toBe(false)
    expect(editorProps.shouldFocus).toBe(true)
  })

  it('nuGridValidationResult has expected structure', () => {
    const validResult: NuGridValidationResult = {
      valid: true,
    }
    expect(validResult.valid).toBe(true)

    const invalidResult: NuGridValidationResult = {
      valid: false,
      message: 'Invalid value',
    }
    expect(invalidResult.valid).toBe(false)
    expect(invalidResult.message).toBe('Invalid value')
  })

  it('nuGridActionMenuItem has expected structure', () => {
    const menuItem: NuGridActionMenuItem = {
      label: 'Edit',
      icon: 'edit-icon',
    }
    expect(menuItem.label).toBe('Edit')
  })

  it('nuGridLookupItem has expected structure', () => {
    const lookupItem: NuGridLookupItem = {
      value: '1',
      label: 'Option 1',
    }
    expect(lookupItem.value).toBe('1')
    expect(lookupItem.label).toBe('Option 1')
  })

  it('nuGridGroupingOptions has expected structure', () => {
    const groupingOptions: Partial<NuGridGroupingOptions> = {
      groupedColumnMode: 'remove',
    }
    expect(groupingOptions.groupedColumnMode).toBe('remove')
  })

  it('nuGridAutosize has expected methods', () => {
    const autosize: Partial<NuGridAutosize> = {
      autoSizeColumns: () => {},
      autoSizeColumn: () => {},
    }
    expect(typeof autosize.autoSizeColumns).toBe('function')
    expect(typeof autosize.autoSizeColumn).toBe('function')
  })

  it('nuGridAnimationPreset type exists', () => {
    const preset: NuGridAnimationPreset = 'fade'
    expect(preset).toBe('fade')
  })

  it('nuGridLayoutMode type exists', () => {
    const mode: NuGridLayoutMode = 'div'
    expect(mode).toBe('div')
  })

  it('nuGridStatePart type exists', () => {
    const part: NuGridStatePart = 'columnOrder'
    expect(part).toBe('columnOrder')
  })

  it('nuGridStorageType type exists', () => {
    const storage: NuGridStorageType = 'local'
    expect(storage).toBe('local')
  })

  it('nuGridValidateOn type exists', () => {
    const validateOn: NuGridValidateOn = 'reward'
    expect(validateOn).toBe('reward')
  })

  it('nuGridShowErrors type exists', () => {
    const showErrors: NuGridShowErrors = 'always'
    expect(showErrors).toBe('always')
  })

  it('nuGridColumnPlacement type exists', () => {
    const placement: NuGridColumnPlacement = 'start'
    expect(placement).toBe('start')
  })

  it('nuGridStateSnapshot type exists', () => {
    const snapshot: Partial<NuGridStateSnapshot> = {}
    expect(snapshot).toBeDefined()
  })
})

// =============================================================================
// THEMES ENTRY POINT
// =============================================================================

describe('themes entry point', () => {
  it('exports registerTheme function', async () => {
    const { registerTheme } = await import('../src/runtime/themes')
    expect(registerTheme).toBeDefined()
    expect(typeof registerTheme).toBe('function')
  })

  it('exports getTheme function', async () => {
    const { getTheme } = await import('../src/runtime/themes')
    expect(getTheme).toBeDefined()
    expect(typeof getTheme).toBe('function')
  })

  it('exports getAvailableThemes function', async () => {
    const { getAvailableThemes } = await import('../src/runtime/themes')
    expect(getAvailableThemes).toBeDefined()
    expect(typeof getAvailableThemes).toBe('function')
  })

  it('exports getAllThemes function', async () => {
    const { getAllThemes } = await import('../src/runtime/themes')
    expect(getAllThemes).toBeDefined()
    expect(typeof getAllThemes).toBe('function')
  })

  it('exports createNuGridTheme function', async () => {
    const { createNuGridTheme } = await import('../src/runtime/themes')
    expect(createNuGridTheme).toBeDefined()
    expect(typeof createNuGridTheme).toBe('function')
  })

  it('exports nuGridTheme object', async () => {
    const { nuGridTheme } = await import('../src/runtime/themes')
    expect(nuGridTheme).toBeDefined()
    expect(typeof nuGridTheme).toBe('object')
  })

  it('exports nuGridThemeCompact object', async () => {
    const { nuGridThemeCompact } = await import('../src/runtime/themes')
    expect(nuGridThemeCompact).toBeDefined()
    expect(typeof nuGridThemeCompact).toBe('object')
  })

  describe('theme functions behavior', () => {
    it('getAvailableThemes returns array containing default and compact', async () => {
      const { getAvailableThemes } = await import('../src/runtime/themes')
      const themes = getAvailableThemes()
      expect(Array.isArray(themes)).toBe(true)
      expect(themes).toContain('default')
      expect(themes).toContain('compact')
    })

    it('getAllThemes returns array of theme definitions', async () => {
      const { getAllThemes } = await import('../src/runtime/themes')
      const themes = getAllThemes()
      expect(Array.isArray(themes)).toBe(true)
      expect(themes.length).toBeGreaterThanOrEqual(2)
    })

    it('getTheme returns theme by name', async () => {
      const { getTheme } = await import('../src/runtime/themes')
      const defaultTheme = getTheme('default')
      expect(defaultTheme).toBeDefined()
      expect(defaultTheme?.name).toBe('default')

      const compactTheme = getTheme('compact')
      expect(compactTheme).toBeDefined()
      expect(compactTheme?.name).toBe('compact')
    })

    it('getTheme returns undefined for unknown theme', async () => {
      const { getTheme } = await import('../src/runtime/themes')
      const unknownTheme = getTheme('non-existent-theme')
      expect(unknownTheme).toBeUndefined()
    })

    it('createNuGridTheme creates a theme definition', async () => {
      const { createNuGridTheme } = await import('../src/runtime/themes')
      const theme = createNuGridTheme({
        name: 'test-theme',
        displayName: 'Test Theme',
        description: 'A test theme',
      })
      expect(theme).toBeDefined()
      expect(theme.name).toBe('test-theme')
      expect(theme.displayName).toBe('Test Theme')
      expect(theme.description).toBe('A test theme')
    })

    it('createNuGridTheme can extend existing theme', async () => {
      const { createNuGridTheme } = await import('../src/runtime/themes')
      const theme = createNuGridTheme({
        name: 'extended-theme',
        baseTheme: 'default',
        slots: {
          base: 'custom-class',
        },
      })
      expect(theme).toBeDefined()
      expect(theme.name).toBe('extended-theme')
      expect(theme.theme.slots?.base).toBe('custom-class')
    })

    it('registerTheme adds theme to registry', async () => {
      const { registerTheme, getTheme, createNuGridTheme } = await import('../src/runtime/themes')
      const customTheme = createNuGridTheme({
        name: 'custom-registered-theme',
        displayName: 'Custom Registered',
      })
      registerTheme(customTheme)
      const retrieved = getTheme('custom-registered-theme')
      expect(retrieved).toBeDefined()
      expect(retrieved?.name).toBe('custom-registered-theme')
    })
  })

  describe('built-in theme structure', () => {
    it('nuGridTheme has required slots', async () => {
      const { nuGridTheme } = await import('../src/runtime/themes')
      expect(nuGridTheme.slots).toBeDefined()
      expect(typeof nuGridTheme.slots).toBe('object')
    })

    it('nuGridThemeCompact has required slots', async () => {
      const { nuGridThemeCompact } = await import('../src/runtime/themes')
      expect(nuGridThemeCompact.slots).toBeDefined()
      expect(typeof nuGridThemeCompact.slots).toBe('object')
    })
  })

  it('themes entry point has expected exports', async () => {
    const themesModule = await import('../src/runtime/themes')
    const exportKeys = Object.keys(themesModule)

    const expectedExports = [
      'registerTheme',
      'getTheme',
      'getAvailableThemes',
      'getAllThemes',
      'createNuGridTheme',
      'nuGridTheme',
      'nuGridThemeCompact',
    ]

    for (const exp of expectedExports) {
      expect(exportKeys).toContain(exp)
    }
  })
})

// =============================================================================
// CELLS ENTRY POINT (types/cells.ts)
// =============================================================================

describe('cells entry point', () => {
  it('exports useNuGridCellEditor function', async () => {
    const { useNuGridCellEditor } = await import('../src/runtime/types/cells')
    expect(useNuGridCellEditor).toBeDefined()
    expect(typeof useNuGridCellEditor).toBe('function')
  })

  it('exports useNuGridCellTypeRegistry function', async () => {
    const { useNuGridCellTypeRegistry } = await import('../src/runtime/types/cells')
    expect(useNuGridCellTypeRegistry).toBeDefined()
    expect(typeof useNuGridCellTypeRegistry).toBe('function')
  })

  it('exports nuGridCellTypeRegistry singleton', async () => {
    const { nuGridCellTypeRegistry } = await import('../src/runtime/types/cells')
    expect(nuGridCellTypeRegistry).toBeDefined()
    expect(typeof nuGridCellTypeRegistry).toBe('object')
  })

  describe('cell type registry API', () => {
    it('nuGridCellTypeRegistry has register method', async () => {
      const { nuGridCellTypeRegistry } = await import('../src/runtime/types/cells')
      expect(typeof nuGridCellTypeRegistry.register).toBe('function')
    })

    it('nuGridCellTypeRegistry has registerAll method', async () => {
      const { nuGridCellTypeRegistry } = await import('../src/runtime/types/cells')
      expect(typeof nuGridCellTypeRegistry.registerAll).toBe('function')
    })

    it('nuGridCellTypeRegistry has get method', async () => {
      const { nuGridCellTypeRegistry } = await import('../src/runtime/types/cells')
      expect(typeof nuGridCellTypeRegistry.get).toBe('function')
    })

    it('nuGridCellTypeRegistry has getEditor method', async () => {
      const { nuGridCellTypeRegistry } = await import('../src/runtime/types/cells')
      expect(typeof nuGridCellTypeRegistry.getEditor).toBe('function')
    })

    it('nuGridCellTypeRegistry has getRenderer method', async () => {
      const { nuGridCellTypeRegistry } = await import('../src/runtime/types/cells')
      expect(typeof nuGridCellTypeRegistry.getRenderer).toBe('function')
    })

    it('nuGridCellTypeRegistry has has method', async () => {
      const { nuGridCellTypeRegistry } = await import('../src/runtime/types/cells')
      expect(typeof nuGridCellTypeRegistry.has).toBe('function')
    })

    it('nuGridCellTypeRegistry has getAll method', async () => {
      const { nuGridCellTypeRegistry } = await import('../src/runtime/types/cells')
      expect(typeof nuGridCellTypeRegistry.getAll).toBe('function')
    })

    it('nuGridCellTypeRegistry has setBuiltInTypes method', async () => {
      const { nuGridCellTypeRegistry } = await import('../src/runtime/types/cells')
      expect(typeof nuGridCellTypeRegistry.setBuiltInTypes).toBe('function')
    })

    it('nuGridCellTypeRegistry has mergeCellTypes method', async () => {
      const { nuGridCellTypeRegistry } = await import('../src/runtime/types/cells')
      expect(typeof nuGridCellTypeRegistry.mergeCellTypes).toBe('function')
    })
  })

  describe('useNuGridCellTypeRegistry composable', () => {
    it('returns expected properties', async () => {
      const { useNuGridCellTypeRegistry } = await import('../src/runtime/types/cells')
      const result = useNuGridCellTypeRegistry()

      expect(result.registry).toBeDefined()
      expect(result.cellTypes).toBeDefined()
      expect(typeof result.getCellType).toBe('function')
      expect(typeof result.getDefaultEditor).toBe('function')
      expect(typeof result.getRenderer).toBe('function')
      expect(typeof result.getFilter).toBe('function')
      expect(typeof result.getFilterFn).toBe('function')
      expect(typeof result.getKeyboardHandler).toBe('function')
      expect(typeof result.getValidation).toBe('function')
      expect(typeof result.getFormatter).toBe('function')
      expect(typeof result.getColumnMenuItems).toBe('function')
      expect(typeof result.getDefaultCellRenderer).toBe('function')
      expect(typeof result.isFilteringEnabled).toBe('function')
    })
  })

  it('cells entry point has expected exports', async () => {
    const cellsModule = await import('../src/runtime/types/cells')
    const exportKeys = Object.keys(cellsModule)

    const expectedExports = [
      'useNuGridCellEditor',
      'useNuGridCellTypeRegistry',
      'nuGridCellTypeRegistry',
    ]

    for (const exp of expectedExports) {
      expect(exportKeys).toContain(exp)
    }
  })
})

// =============================================================================
// COMPOSABLES ENTRY POINT
// =============================================================================

describe('composables entry point', () => {
  it('exports useNuGridCellEditor function', async () => {
    const { useNuGridCellEditor } = await import('../src/runtime/composables')
    expect(useNuGridCellEditor).toBeDefined()
    expect(typeof useNuGridCellEditor).toBe('function')
  })

  it('exports useNuGridCellTypeRegistry function', async () => {
    const { useNuGridCellTypeRegistry } = await import('../src/runtime/composables')
    expect(useNuGridCellTypeRegistry).toBeDefined()
    expect(typeof useNuGridCellTypeRegistry).toBe('function')
  })

  it('exports nuGridCellTypeRegistry singleton', async () => {
    const { nuGridCellTypeRegistry } = await import('../src/runtime/composables')
    expect(nuGridCellTypeRegistry).toBeDefined()
    expect(typeof nuGridCellTypeRegistry).toBe('object')
  })

  it('exports NuGridCellTypeRegistry class', async () => {
    const { NuGridCellTypeRegistry } = await import('../src/runtime/composables')
    expect(NuGridCellTypeRegistry).toBeDefined()
    expect(typeof NuGridCellTypeRegistry).toBe('function') // Classes are functions
  })

  it('composables entry point has expected exports', async () => {
    const composablesModule = await import('../src/runtime/composables')
    const exportKeys = Object.keys(composablesModule)

    const expectedExports = [
      'useNuGridCellEditor',
      'useNuGridCellTypeRegistry',
      'nuGridCellTypeRegistry',
      'NuGridCellTypeRegistry',
    ]

    for (const exp of expectedExports) {
      expect(exportKeys).toContain(exp)
    }
  })
})

// =============================================================================
// CONFIG ENTRY POINT
// =============================================================================

describe('config entry point', () => {
  it('exports createNuGridConfig function', async () => {
    const { createNuGridConfig } = await import('../src/runtime/config')
    expect(createNuGridConfig).toBeDefined()
    expect(typeof createNuGridConfig).toBe('function')
  })

  it('exports getNuGridDefaults function', async () => {
    const { getNuGridDefaults } = await import('../src/runtime/config')
    expect(getNuGridDefaults).toBeDefined()
    expect(typeof getNuGridDefaults).toBe('function')
  })

  it('exports mergeNuGridConfig function', async () => {
    const { mergeNuGridConfig } = await import('../src/runtime/config')
    expect(mergeNuGridConfig).toBeDefined()
    expect(typeof mergeNuGridConfig).toBe('function')
  })

  it('exports applyNuGridPreset function', async () => {
    const { applyNuGridPreset } = await import('../src/runtime/config')
    expect(applyNuGridPreset).toBeDefined()
    expect(typeof applyNuGridPreset).toBe('function')
  })

  it('exports getNuGridPreset function', async () => {
    const { getNuGridPreset } = await import('../src/runtime/config')
    expect(getNuGridPreset).toBeDefined()
    expect(typeof getNuGridPreset).toBe('function')
  })

  describe('config functions behavior', () => {
    it('getNuGridDefaults returns default configuration', async () => {
      const { getNuGridDefaults } = await import('../src/runtime/config')
      const defaults = getNuGridDefaults()
      expect(defaults).toBeDefined()
      expect(typeof defaults).toBe('object')
    })

    it('createNuGridConfig creates a configuration object', async () => {
      const { createNuGridConfig } = await import('../src/runtime/config')
      const config = createNuGridConfig({
        preset: 'editable',
        config: {
          data: [],
          columns: [],
        },
      })
      expect(config).toBeDefined()
      expect(typeof config).toBe('object')
    })

    it('mergeNuGridConfig merges configurations', async () => {
      const { mergeNuGridConfig, getNuGridDefaults } = await import('../src/runtime/config')
      const defaults = getNuGridDefaults()
      const custom = { focus: { mode: 'row' as const } }
      const merged = mergeNuGridConfig(defaults, custom)
      expect(merged).toBeDefined()
    })

    it('getNuGridPreset returns preset by name', async () => {
      const { getNuGridPreset } = await import('../src/runtime/config')

      const readOnlyPreset = getNuGridPreset('readOnly')
      expect(readOnlyPreset).toBeDefined()

      const editablePreset = getNuGridPreset('editable')
      expect(editablePreset).toBeDefined()
    })

    it('applyNuGridPreset applies preset to configuration', async () => {
      const { applyNuGridPreset } = await import('../src/runtime/config')
      const withPreset = applyNuGridPreset('editable')
      expect(withPreset).toBeDefined()
    })

    it('available presets include readOnly, editable, kanban, forms, analytics', async () => {
      const { getNuGridPreset } = await import('../src/runtime/config')

      const presets = ['readOnly', 'editable', 'kanban', 'forms', 'analytics'] as const
      for (const preset of presets) {
        expect(getNuGridPreset(preset)).toBeDefined()
      }
    })
  })

  it('config entry point has expected exports', async () => {
    const configModule = await import('../src/runtime/config')
    const exportKeys = Object.keys(configModule)

    const expectedExports = [
      'createNuGridConfig',
      'getNuGridDefaults',
      'mergeNuGridConfig',
      'applyNuGridPreset',
      'getNuGridPreset',
    ]

    for (const exp of expectedExports) {
      expect(exportKeys).toContain(exp)
    }
  })
})

// =============================================================================
// BUILT-IN CELL TYPES VERIFICATION
// =============================================================================

describe('built-in cell types', () => {
  it('registry contains built-in cell types', async () => {
    const { nuGridCellTypeRegistry } = await import('../src/runtime/types/cells')

    const builtInTypes = ['text', 'number', 'date', 'boolean', 'currency', 'lookup', 'rating']

    for (const typeName of builtInTypes) {
      expect(nuGridCellTypeRegistry.has(typeName)).toBe(true)
    }
  })

  it('built-in cell types have required name property', async () => {
    const { nuGridCellTypeRegistry } = await import('../src/runtime/types/cells')

    const textType = nuGridCellTypeRegistry.get('text')
    expect(textType).toBeDefined()
    expect(textType?.name).toBe('text')

    const numberType = nuGridCellTypeRegistry.get('number')
    expect(numberType).toBeDefined()
    expect(numberType?.name).toBe('number')

    const booleanType = nuGridCellTypeRegistry.get('boolean')
    expect(booleanType).toBeDefined()
    expect(booleanType?.name).toBe('boolean')

    const dateType = nuGridCellTypeRegistry.get('date')
    expect(dateType).toBeDefined()
    expect(dateType?.name).toBe('date')

    const currencyType = nuGridCellTypeRegistry.get('currency')
    expect(currencyType).toBeDefined()
    expect(currencyType?.name).toBe('currency')

    const lookupType = nuGridCellTypeRegistry.get('lookup')
    expect(lookupType).toBeDefined()
    expect(lookupType?.name).toBe('lookup')

    const ratingType = nuGridCellTypeRegistry.get('rating')
    expect(ratingType).toBeDefined()
    expect(ratingType?.name).toBe('rating')
  })
})

// =============================================================================
// useNuGridCellEditor COMPOSABLE API
// =============================================================================

describe('useNuGridCellEditor composable API', () => {
  it('returns expected methods', async () => {
    const { useNuGridCellEditor } = await import('../src/runtime/composables/useNuGridCellEditor')
    const { ref } = await import('vue')

    const mockProps = {
      modelValue: 'test',
      cell: {},
      row: {} as any,
      isNavigating: false,
      shouldFocus: false,
    }

    const mockEmit = (() => {}) as any
    const inputRef = ref(null)

    const result = useNuGridCellEditor(mockProps, mockEmit, inputRef)

    expect(result).toBeDefined()
    expect(typeof result.handleKeydown).toBe('function')
    expect(typeof result.handleBlur).toBe('function')
    expect(typeof result.focusInput).toBe('function')
    expect(typeof result.scheduleNavigation).toBe('function')
  })
})

// =============================================================================
// COMPLETE TYPE EXPORT LIST VERIFICATION
// This section verifies that all documented public types are exported
// =============================================================================

describe('complete public types export verification', () => {
  describe('core types', () => {
    it('nuGridColumn type is usable', () => {
      const column: Partial<NuGridColumn<any>> = {
        id: 'test',
      }
      expect(column.id).toBe('test')
    })

    it('nuGridRow type is usable', () => {
      // NuGridRow is a type alias, verify it's importable
      type TestRow = NuGridRow<{ id: number }>
      const row: TestRow = { id: 1 } as any
      expect(row).toBeDefined()
    })

    it('nuGridScrollbars type is usable', () => {
      const scrollbars: NuGridScrollbars = 'scroll'
      expect(scrollbars).toBe('scroll')
    })
  })

  describe('cell editor types', () => {
    it('nuGridCellEditorEmits type is usable', () => {
      const emits: NuGridCellEditorEmits = (() => {}) as any
      expect(typeof emits).toBe('function')
    })
  })

  describe('action menu types', () => {
    it('nuGridActionMenuOptions type is usable', () => {
      const options: Partial<NuGridActionMenuOptions<any>> = {
        enabled: true,
      }
      expect(options.enabled).toBe(true)
    })
  })

  describe('column menu types', () => {
    it('nuGridColumnMenuItem type is usable', () => {
      const menuItem: NuGridColumnMenuItem<any> = {
        type: 'separator',
      }
      expect(menuItem.type).toBe('separator')
    })

    it('nuGridColumnMenuItemsCallback type is usable', () => {
      const callback: NuGridColumnMenuItemsCallback<any> = () => []
      expect(typeof callback).toBe('function')
    })

    it('nuGridColumnMenuPreset type is usable', () => {
      const preset: NuGridColumnMenuPreset = 'full'
      expect(preset).toBe('full')
    })
  })

  describe('add row types', () => {
    it('nuGridAddRowState type is usable', () => {
      // NuGridAddRowState is a union type: 'idle' | 'focused' | 'editing'
      const state: NuGridAddRowState = 'idle'
      expect(state).toBe('idle')
    })

    it('nuGridAddRowFinalizeResult type is usable', () => {
      const result: NuGridAddRowFinalizeResult = {
        success: true,
      }
      expect(result.success).toBe(true)
    })
  })

  describe('row selection types', () => {
    it('nuGridRowSelectOptions type is usable', () => {
      const options: Partial<NuGridRowSelectOptions<any>> = {
        mode: 'single',
      }
      expect(options.mode).toBe('single')
    })
  })

  describe('sort icon types', () => {
    it('nuGridSortIcon type is usable', () => {
      const sortIcon: Partial<NuGridSortIcon> = {
        asc: 'icon-asc',
      }
      expect(sortIcon.asc).toBe('icon-asc')
    })
  })

  describe('excel export types', () => {
    it('nuGridExcelExportOptions type is usable', () => {
      const options: Partial<NuGridExcelExportOptions> = {
        filename: 'export.xlsx',
      }
      expect(options.filename).toBe('export.xlsx')
    })
  })

  describe('multi row types', () => {
    it('nuGridMultiRowOptions type is usable', () => {
      const options: Partial<NuGridMultiRowOptions> = {
        enabled: true,
      }
      expect(options.enabled).toBe(true)
    })
  })

  describe('tooltip types', () => {
    it('nuGridTooltipOptions type is usable', () => {
      const options: Partial<NuGridTooltipOptions> = {
        truncatedOnly: true,
      }
      expect(options.truncatedOnly).toBe(true)
    })
  })

  describe('actions types', () => {
    it('nuGridActionsOptions type is usable', () => {
      const options: Partial<NuGridActionsOptions<any>> = {
        placement: 'end',
      }
      expect(options.placement).toBe('end')
    })
  })

  describe('lookup types', () => {
    it('nuGridLookupOptions type is usable', () => {
      const options: Partial<NuGridLookupOptions> = {
        items: [],
      }
      expect(options.items).toEqual([])
    })
  })

  describe('animation types', () => {
    it('nuGridAnimationOptions type is usable', () => {
      const options: Partial<NuGridAnimationOptions> = {
        preset: 'fade',
      }
      expect(options.preset).toBe('fade')
    })
  })

  describe('autosize types', () => {
    it('nuGridAutoSizeStrategy type is usable', () => {
      const strategy: NuGridAutoSizeStrategy = 'content'
      expect(strategy).toBe('content')
    })
  })

  describe('cell type system types', () => {
    it('nuGridCellRenderContext type is usable', () => {
      const context: Partial<NuGridCellRenderContext> = {
        getValue: () => 'test',
      }
      expect(context.getValue?.()).toBe('test')
    })

    it('nuGridCellTypeContext type is usable', () => {
      const context: Partial<NuGridCellTypeContext> = {
        isFocused: true,
      }
      expect(context.isFocused).toBe(true)
    })

    it('nuGridCellTypeKeyboardResult type is usable', () => {
      const result: NuGridCellTypeKeyboardResult = {
        handled: true,
        preventDefault: true,
      }
      expect(result.handled).toBe(true)
    })

    it('nuGridRendererConfig type is usable', () => {
      const config: NuGridRendererConfig = 'MyRenderer'
      expect(config).toBe('MyRenderer')
    })

    it('nuGridFilterConfig type is usable', () => {
      const config: Partial<NuGridFilterConfig> = {
        defaultValue: 'test',
      }
      expect(config.defaultValue).toBe('test')
    })

    it('nuGridFilterContext type is usable', () => {
      const context: Partial<NuGridFilterContext> = {
        isFiltered: false,
      }
      expect(context.isFiltered).toBe(false)
    })
  })

  describe('validation types', () => {
    it('nuGridOnInvalid type is usable', () => {
      const onInvalid: NuGridOnInvalid = 'block'
      expect(onInvalid).toBe('block')
    })
  })
})
