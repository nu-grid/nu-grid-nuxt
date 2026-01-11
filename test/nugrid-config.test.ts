import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { nuGridDefaults } from '../src/runtime/config/_internal/options-defaults'
import {
  getDefaults,
  usePropsWithDefaults,
  usePropWithDefault,
} from '../src/runtime/config/_internal/prop-utils'
import {
  createNuGridConfig,
  getNuGridDefaults,
  mergeNuGridConfig,
} from '../src/runtime/config/config'
import { applyNuGridPreset, getNuGridPreset } from '../src/runtime/config/presets'

/**
 * Tests for NuGrid configuration system
 *
 * This test suite verifies:
 * 1. nuGridDefaults has expected structure and values
 * 2. Config factory functions work correctly
 * 3. Presets apply correct overrides
 * 4. Prop utilities extract defaults correctly
 */

describe('nuGridDefaults', () => {
  describe('structure', () => {
    it('should have focus options', () => {
      expect(nuGridDefaults.focus).toBeDefined()
      expect(typeof nuGridDefaults.focus).toBe('object')
    })

    it('should have editing options', () => {
      expect(nuGridDefaults.editing).toBeDefined()
      expect(typeof nuGridDefaults.editing).toBe('object')
    })

    it('should have validation options', () => {
      expect(nuGridDefaults.validation).toBeDefined()
      expect(typeof nuGridDefaults.validation).toBe('object')
    })

    it('should have selection options', () => {
      expect(nuGridDefaults.selection).toBeDefined()
      expect(typeof nuGridDefaults.selection).toBe('object')
    })

    it('should have layout options', () => {
      expect(nuGridDefaults.layout).toBeDefined()
      expect(typeof nuGridDefaults.layout).toBe('object')
    })

    it('should have virtualization option', () => {
      expect(nuGridDefaults).toHaveProperty('virtualization')
    })

    it('should have theme option', () => {
      expect(nuGridDefaults).toHaveProperty('theme')
    })

    it('should have columnDefaults with resize option', () => {
      expect(nuGridDefaults.columnDefaults).toHaveProperty('resize')
    })

    it('should have columnDefaults with reorder option', () => {
      expect(nuGridDefaults.columnDefaults).toHaveProperty('reorder')
    })
  })

  describe('focus defaults', () => {
    it('should default mode to cell', () => {
      expect(nuGridDefaults.focus.mode).toBe('cell')
    })

    it('should default retain to false', () => {
      expect(nuGridDefaults.focus.retain).toBe(false)
    })

    it('should default cmdArrows to paging', () => {
      expect(nuGridDefaults.focus.cmdArrows).toBe('paging')
    })

    it('should default loopNavigation to false', () => {
      expect(nuGridDefaults.focus.loopNavigation).toBe(false)
    })

    it('should default pageStep to 10', () => {
      expect(nuGridDefaults.focus.pageStep).toBe(10)
    })
  })

  describe('editing defaults', () => {
    it('should default enabled to false', () => {
      expect(nuGridDefaults.editing.enabled).toBe(false)
    })

    it('should default startKeys to all', () => {
      expect(nuGridDefaults.editing.startKeys).toBe('all')
    })

    it('should default startClicks to double', () => {
      expect(nuGridDefaults.editing.startClicks).toBe('double')
    })

    it('should default commitOnBlur to true', () => {
      expect(nuGridDefaults.editing.commitOnBlur).toBe(true)
    })
  })

  describe('validation defaults', () => {
    it('should default validateOn to reward', () => {
      expect(nuGridDefaults.validation.validateOn).toBe('reward')
    })

    it('should default showErrors to always', () => {
      expect(nuGridDefaults.validation.showErrors).toBe('always')
    })

    it('should default onInvalid to block', () => {
      expect(nuGridDefaults.validation.onInvalid).toBe('block')
    })

    it('should default validateOnAddRow to true', () => {
      expect(nuGridDefaults.validation.validateOnAddRow).toBe(true)
    })

    it('should have default icon', () => {
      expect(nuGridDefaults.validation.icon).toBe('i-lucide-alert-circle')
    })
  })

  describe('selection defaults', () => {
    it('should default mode to multi', () => {
      expect(nuGridDefaults.selection.mode).toBe('multi')
    })

    it('should default placement to start', () => {
      expect(nuGridDefaults.selection.placement).toBe('start')
    })

    it('should default enabled to true', () => {
      expect(nuGridDefaults.selection.enabled).toBe(true)
    })

    it('should default hidden to false', () => {
      expect(nuGridDefaults.selection.hidden).toBe(false)
    })
  })

  describe('layout defaults', () => {
    it('should default mode to div', () => {
      expect(nuGridDefaults.layout.mode).toBe('div')
    })

    it('should default stickyHeaders to false', () => {
      expect(nuGridDefaults.layout.stickyHeaders).toBe(false)
    })

    it('should default scrollbars to scroll', () => {
      expect(nuGridDefaults.layout.scrollbars).toBe('scroll')
    })

    it('should default autoSize to false', () => {
      expect(nuGridDefaults.layout.autoSize).toBe(false)
    })

    it('should default maintainWidth to false', () => {
      expect(nuGridDefaults.layout.maintainWidth).toBe(false)
    })
  })

  describe('other defaults', () => {
    it('should default virtualization config to disabled with defaults merged', () => {
      expect(nuGridDefaults.virtualization).toEqual({
        enabled: false,
        estimateSize: 65,
        overscan: 20,
        dynamicRowHeights: true,
        rowHeights: {
          groupHeader: 50,
          columnHeader: 50,
          dataRow: 80,
          footer: 45,
        },
      })
    })

    it('should default theme to default', () => {
      expect(nuGridDefaults.theme).toBe('default')
    })

    it('should default columnDefaults.resize to false', () => {
      expect(nuGridDefaults.columnDefaults.resize).toBe(false)
    })

    it('should default columnDefaults.reorder to false', () => {
      expect(nuGridDefaults.columnDefaults.reorder).toBe(false)
    })
  })
})

describe('config factory', () => {
  describe('getNuGridDefaults', () => {
    it('should return defaults object', () => {
      const defaults = getNuGridDefaults()
      expect(defaults).toEqual(nuGridDefaults)
    })

    it('should return typed defaults', () => {
      const defaults = getNuGridDefaults()
      expect(defaults.focus?.mode).toBe('cell')
      expect(defaults.editing?.enabled).toBe(false)
    })
  })

  describe('mergeNuGridConfig', () => {
    it('should merge empty configs', () => {
      const result = mergeNuGridConfig({}, {})
      expect(result).toEqual({})
    })

    it('should merge single config', () => {
      const config = { focus: { mode: 'cell' as const } }
      const result = mergeNuGridConfig(config)
      expect(result).toEqual(config)
    })

    it('should merge multiple configs with later values winning', () => {
      const base = { focus: { mode: 'cell' as const, retain: false } }
      const override = { focus: { retain: true } }
      const result = mergeNuGridConfig(base, override)

      expect(result.focus?.mode).toBe('cell')
      expect(result.focus?.retain).toBe(true)
    })

    it('should deep merge nested objects', () => {
      const base = {
        focus: { mode: 'cell' as const, pageStep: 10 },
        editing: { enabled: false },
      }
      const override = {
        focus: { retain: true },
        layout: { stickyHeaders: true },
      }
      const result = mergeNuGridConfig(base, override)

      expect(result.focus?.mode).toBe('cell')
      expect(result.focus?.pageStep).toBe(10)
      expect(result.focus?.retain).toBe(true)
      expect(result.editing?.enabled).toBe(false)
      expect(result.layout?.stickyHeaders).toBe(true)
    })

    it('should merge three or more configs', () => {
      const config1 = { focus: { mode: 'row' as const } }
      const config2 = { editing: { enabled: true } }
      const config3 = { layout: { stickyHeaders: true } }
      const result = mergeNuGridConfig(config1, config2, config3)

      expect(result.focus?.mode).toBe('row')
      expect(result.editing?.enabled).toBe(true)
      expect(result.layout?.stickyHeaders).toBe(true)
    })
  })

  describe('createNuGridConfig', () => {
    it('should return defaults when called with no options', () => {
      const result = createNuGridConfig()
      expect(result.focus?.mode).toBe('cell')
      expect(result.editing?.enabled).toBe(false)
    })

    it('should merge config with defaults', () => {
      const result = createNuGridConfig({
        config: { focus: { mode: 'cell' } },
      })

      expect(result.focus?.mode).toBe('cell')
      expect(result.focus?.retain).toBe(false) // From defaults
      expect(result.editing?.enabled).toBe(false) // From defaults
    })

    it('should apply preset before config', () => {
      const result = createNuGridConfig({
        preset: 'editable',
        config: { focus: { pageStep: 20 } },
      })

      // From preset
      expect(result.focus?.mode).toBe('cell')
      expect(result.focus?.retain).toBe(true)
      expect(result.editing?.enabled).toBe(true)
      // From config override
      expect(result.focus?.pageStep).toBe(20)
    })

    it('should allow config to override preset values', () => {
      const result = createNuGridConfig({
        preset: 'editable',
        config: { focus: { retain: false } },
      })

      expect(result.focus?.mode).toBe('cell') // From preset
      expect(result.focus?.retain).toBe(false) // Overridden by config
    })
  })
})

describe('presets', () => {
  describe('getNuGridPreset', () => {
    it('should return readOnly preset', () => {
      const preset = getNuGridPreset('readOnly')
      expect(preset.focus?.mode).toBe('row')
      expect(preset.editing?.enabled).toBe(false)
    })

    it('should return editable preset', () => {
      const preset = getNuGridPreset('editable')
      expect(preset.focus?.mode).toBe('cell')
      expect(preset.focus?.retain).toBe(true)
      expect(preset.editing?.enabled).toBe(true)
      expect(preset.layout?.stickyHeaders).toBe(true)
      expect(preset.layout?.autoSize).toBe('fitCell')
    })

    it('should return kanban preset', () => {
      const preset = getNuGridPreset('kanban')
      expect(preset.focus?.mode).toBe('row')
      expect(preset.editing?.enabled).toBe(true)
      expect(preset.editing?.startKeys).toBe('minimal')
      expect(preset.layout?.mode).toBe('group')
      expect(preset.layout?.stickyHeaders).toBe(true)
    })

    it('should return forms preset', () => {
      const preset = getNuGridPreset('forms')
      expect(preset.focus?.mode).toBe('cell')
      expect(preset.focus?.retain).toBe(true)
      expect(preset.focus?.cmdArrows).toBe('firstlast')
      expect(preset.focus?.pageStep).toBe(5)
      expect(preset.editing?.enabled).toBe(true)
      expect(preset.editing?.startClicks).toBe('single')
      expect(
        preset.validation && typeof preset.validation === 'object' && preset.validation.validateOn,
      ).toBe('blur')
      expect(preset.layout?.scrollbars).toBe('native')
      expect(preset.layout?.autoSize).toBe('fitGrid')
      expect(preset.layout?.maintainWidth).toBe(true)
    })

    it('should return analytics preset', () => {
      const preset = getNuGridPreset('analytics')
      expect(preset.focus?.mode).toBe('row')
      expect(preset.editing?.enabled).toBe(false)
      expect(preset.virtualization).toBeDefined()
      expect(preset.layout?.stickyHeaders).toBe(true)
    })
  })

  describe('applyNuGridPreset', () => {
    it('should return preset config when no overrides', () => {
      const result = applyNuGridPreset('readOnly')
      const preset = getNuGridPreset('readOnly')
      expect(result).toEqual(preset)
    })

    it('should merge overrides with preset', () => {
      const result = applyNuGridPreset('editable', {
        focus: { pageStep: 15 },
      })

      expect(result.focus?.mode).toBe('cell') // From preset
      expect(result.focus?.retain).toBe(true) // From preset
      expect(result.focus?.pageStep).toBe(15) // From override
    })

    it('should allow overriding preset values', () => {
      const result = applyNuGridPreset('editable', {
        editing: { enabled: false },
      })

      expect(result.focus?.mode).toBe('cell') // From preset
      expect(result.editing?.enabled).toBe(false) // Overridden
    })

    it('should handle undefined overrides', () => {
      const result = applyNuGridPreset('kanban', undefined)
      const preset = getNuGridPreset('kanban')
      expect(result).toEqual(preset)
    })
  })
})

describe('prop-utils', () => {
  describe('getDefaults', () => {
    it('should return focus defaults', () => {
      const focusDefaults = getDefaults('focus')
      expect(focusDefaults.mode).toBe('cell')
      expect(focusDefaults.retain).toBe(false)
      expect(focusDefaults.cmdArrows).toBe('paging')
      expect(focusDefaults.loopNavigation).toBe(false)
      expect(focusDefaults.pageStep).toBe(10)
    })

    it('should return editing defaults', () => {
      const editingDefaults = getDefaults('editing')
      expect(editingDefaults.enabled).toBe(false)
      expect(editingDefaults.commitOnBlur).toBe(true)
    })

    it('should return validation defaults', () => {
      const validationDefaults = getDefaults('validation')
      expect(validationDefaults.validateOn).toBe('reward')
      expect(validationDefaults.showErrors).toBe('always')
      expect(validationDefaults.onInvalid).toBe('block')
    })

    it('should return selection defaults', () => {
      const selectionDefaults = getDefaults('selection')
      expect(selectionDefaults.mode).toBe('multi')
      expect(selectionDefaults.placement).toBe('start')
      expect(selectionDefaults.enabled).toBe(true)
    })

    it('should return layout defaults', () => {
      const layoutDefaults = getDefaults('layout')
      expect(layoutDefaults.mode).toBe('div')
      expect(layoutDefaults.stickyHeaders).toBe(false)
      expect(layoutDefaults.scrollbars).toBe('scroll')
    })
  })

  describe('usePropWithDefault', () => {
    it('should return prop value when provided', () => {
      const props = { focus: { mode: 'cell' } }
      const mode = usePropWithDefault(props, 'focus', 'mode')
      expect(mode.value).toBe('cell')
    })

    it('should return default value when prop is undefined', () => {
      const props = { focus: {} }
      const mode = usePropWithDefault(props, 'focus', 'mode')
      expect(mode.value).toBe('cell')
    })

    it('should return default value when group is undefined', () => {
      const props = {}
      const mode = usePropWithDefault(props, 'focus', 'mode')
      expect(mode.value).toBe('cell')
    })

    it('should return computed ref that updates with props', () => {
      const props = ref({ focus: { mode: 'cell' as const } })
      const mode = usePropWithDefault(props.value, 'focus', 'mode')
      expect(mode.value).toBe('cell')
    })

    it('should work with editing props', () => {
      const props = { editing: { enabled: true } }
      const enabled = usePropWithDefault(props, 'editing', 'enabled')
      expect(enabled.value).toBe(true)
    })

    it('should work with validation props', () => {
      const props = { validation: { validateOn: 'blur' } }
      const validateOn = usePropWithDefault(props, 'validation', 'validateOn')
      expect(validateOn.value).toBe('blur')
    })

    it('should work with selection props', () => {
      const props = { selection: { mode: 'single' } }
      const mode = usePropWithDefault(props, 'selection', 'mode')
      expect(mode.value).toBe('single')
    })

    it('should work with layout props', () => {
      const props = { layout: { stickyHeaders: true } }
      const stickyHeaders = usePropWithDefault(props, 'layout', 'stickyHeaders')
      expect(stickyHeaders.value).toBe(true)
    })
  })

  describe('usePropsWithDefaults', () => {
    it('should return multiple computed refs', () => {
      const props = { focus: { mode: 'cell' } }
      const { mode, retain, pageStep } = usePropsWithDefaults(props, 'focus', [
        'mode',
        'retain',
        'pageStep',
      ])

      expect(mode.value).toBe('cell')
      expect(retain.value).toBe(false) // Default
      expect(pageStep.value).toBe(10) // Default
    })

    it('should handle all props from group', () => {
      const props = {
        focus: {
          mode: 'row',
          retain: true,
          cmdArrows: 'firstlast',
          loopNavigation: true,
          pageStep: 20,
        },
      }
      const result = usePropsWithDefaults(props, 'focus', [
        'mode',
        'retain',
        'cmdArrows',
        'loopNavigation',
        'pageStep',
      ])

      expect(result.mode.value).toBe('row')
      expect(result.retain.value).toBe(true)
      expect(result.cmdArrows.value).toBe('firstlast')
      expect(result.loopNavigation.value).toBe(true)
      expect(result.pageStep.value).toBe(20)
    })

    it('should work with editing group', () => {
      const props = { editing: { enabled: true } }
      const { enabled, commitOnBlur } = usePropsWithDefaults(props, 'editing', [
        'enabled',
        'commitOnBlur',
      ])

      expect(enabled.value).toBe(true)
      expect(commitOnBlur.value).toBe(true) // Default
    })

    it('should work with validation group', () => {
      const props = { validation: {} }
      const { validateOn, showErrors, onInvalid } = usePropsWithDefaults(props, 'validation', [
        'validateOn',
        'showErrors',
        'onInvalid',
      ])

      expect(validateOn.value).toBe('reward')
      expect(showErrors.value).toBe('always')
      expect(onInvalid.value).toBe('block')
    })

    it('should work with selection group', () => {
      const props = { selection: { mode: 'single', hidden: true } }
      const { mode, placement, enabled, hidden } = usePropsWithDefaults(props, 'selection', [
        'mode',
        'placement',
        'enabled',
        'hidden',
      ])

      expect(mode.value).toBe('single')
      expect(placement.value).toBe('start') // Default
      expect(enabled.value).toBe(true) // Default
      expect(hidden.value).toBe(true)
    })

    it('should work with layout group', () => {
      const props = { layout: { stickyHeaders: true, autoSize: 'fitGrid' } }
      const { mode, stickyHeaders, scrollbars, autoSize, maintainWidth } = usePropsWithDefaults(
        props,
        'layout',
        ['mode', 'stickyHeaders', 'scrollbars', 'autoSize', 'maintainWidth'],
      )

      expect(mode.value).toBe('div') // Default
      expect(stickyHeaders.value).toBe(true)
      expect(scrollbars.value).toBe('scroll') // Default
      expect(autoSize.value).toBe('fitGrid')
      expect(maintainWidth.value).toBe(false) // Default
    })

    it('should handle empty props object', () => {
      const props = {}
      const { mode, retain } = usePropsWithDefaults(props, 'focus', ['mode', 'retain'])

      expect(mode.value).toBe('cell') // Default
      expect(retain.value).toBe(false) // Default
    })
  })
})

describe('integration', () => {
  it('should create config and extract props correctly', () => {
    const config = createNuGridConfig({
      preset: 'editable',
      config: {
        focus: { pageStep: 15 },
        validation: { validateOn: 'blur' },
      },
    })

    // Verify merged config
    expect(config.focus?.mode).toBe('cell')
    expect(config.focus?.retain).toBe(true)
    expect(config.focus?.pageStep).toBe(15)
    expect(config.editing?.enabled).toBe(true)
    expect(
      config.validation && typeof config.validation === 'object' && config.validation.validateOn,
    ).toBe('blur')

    // Use prop utilities with the config
    const mode = usePropWithDefault(config, 'focus', 'mode')
    const retain = usePropWithDefault(config, 'focus', 'retain')
    const pageStep = usePropWithDefault(config, 'focus', 'pageStep')

    expect(mode.value).toBe('cell')
    expect(retain.value).toBe(true)
    expect(pageStep.value).toBe(15)
  })

  it('should merge multiple configs and apply correctly', () => {
    const baseConfig = createNuGridConfig({ preset: 'readOnly' })
    const enhancedConfig = mergeNuGridConfig(baseConfig, {
      editing: { enabled: true },
      layout: { stickyHeaders: true },
    })

    expect(enhancedConfig.focus?.mode).toBe('row') // From preset
    expect(enhancedConfig.editing?.enabled).toBe(true) // Overridden
    expect(enhancedConfig.layout?.stickyHeaders).toBe(true) // Added
  })

  it('should work with defaults throughout the chain', () => {
    // Start with getNuGridDefaults
    const defaults = getNuGridDefaults()

    // Verify defaults structure
    expect(defaults.focus?.mode).toBe('cell')
    expect(defaults.editing?.enabled).toBe(false)

    // Use getDefaults for specific group
    const focusDefaults = getDefaults('focus')
    expect(focusDefaults.mode).toBe('cell')
    expect(focusDefaults.pageStep).toBe(10)

    // Create config with preset
    const config = createNuGridConfig({ preset: 'forms' })

    // Extract with usePropsWithDefaults
    const { mode, cmdArrows, pageStep } = usePropsWithDefaults(config, 'focus', [
      'mode',
      'cmdArrows',
      'pageStep',
    ])

    expect(mode.value).toBe('cell')
    expect(cmdArrows.value).toBe('firstlast')
    expect(pageStep.value).toBe(5)
  })
})
