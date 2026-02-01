import { describe, expect, it } from 'vitest'
import { applyNuGridPreset, getNuGridPreset } from '../src/runtime/config/presets'

describe('presets', () => {
  describe('getNuGridPreset', () => {
    it('should return readOnly preset', () => {
      const preset = getNuGridPreset('readOnly')

      expect(preset).toBeDefined()
      expect(preset.focus?.mode).toBe('row')
      expect(preset.editing?.enabled).toBe(false)
    })

    it('should return editable preset', () => {
      const preset = getNuGridPreset('editable')

      expect(preset).toBeDefined()
      expect(preset.focus?.mode).toBe('cell')
      expect(preset.focus?.retain).toBe(true)
      expect(preset.editing?.enabled).toBe(true)
      expect(preset.layout?.stickyHeaders).toBe(true)
      expect(preset.layout?.autoSize).toBe('content')
    })

    it('should return kanban preset', () => {
      const preset = getNuGridPreset('kanban')

      expect(preset).toBeDefined()
      expect(preset.focus?.mode).toBe('row')
      expect(preset.editing?.enabled).toBe(true)
      expect(preset.editing?.startKeys).toBe('minimal')
      expect(preset.layout?.mode).toBe('group')
      expect(preset.layout?.stickyHeaders).toBe(true)
    })

    it('should return forms preset', () => {
      const preset = getNuGridPreset('forms')

      expect(preset).toBeDefined()
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
      expect(preset.layout?.autoSize).toBe('fill')
    })

    it('should return analytics preset', () => {
      const preset = getNuGridPreset('analytics')

      expect(preset).toBeDefined()
      expect(preset.focus?.mode).toBe('row')
      expect(preset.editing?.enabled).toBe(false)
      const virt = preset.virtualization
      expect(virt && typeof virt === 'object' && virt.estimateSize).toBe(50)
      expect(virt && typeof virt === 'object' && virt.overscan).toBe(20)
      expect(virt && typeof virt === 'object' && virt.dynamicRowHeights).toBe(false)
      expect(preset.layout?.stickyHeaders).toBe(true)
    })
  })

  describe('applyNuGridPreset', () => {
    it('should return base preset when no overrides provided', () => {
      const result = applyNuGridPreset('readOnly')

      expect(result).toEqual(getNuGridPreset('readOnly'))
    })

    it('should return base preset when overrides is undefined', () => {
      const result = applyNuGridPreset('editable', undefined)

      expect(result).toEqual(getNuGridPreset('editable'))
    })

    it('should merge overrides with preset', () => {
      const result = applyNuGridPreset('readOnly', {
        focus: { mode: 'cell' },
      })

      expect(result.focus?.mode).toBe('cell')
      expect(result.editing?.enabled).toBe(false) // From preset
    })

    it('should allow overriding nested properties', () => {
      const result = applyNuGridPreset('editable', {
        layout: { stickyHeaders: false },
      })

      expect(result.layout?.stickyHeaders).toBe(false)
      expect(result.layout?.autoSize).toBe('content') // From preset
    })

    it('should allow adding new properties', () => {
      const result = applyNuGridPreset('readOnly', {
        selection: { mode: 'multiple' },
      } as any)

      expect((result as any).selection?.mode).toBe('multiple')
      expect(result.focus?.mode).toBe('row') // From preset
    })

    it('should handle deep overrides', () => {
      const result = applyNuGridPreset('forms', {
        focus: { pageStep: 10 },
        editing: { startClicks: 'double' },
      })

      expect(result.focus?.pageStep).toBe(10) // Overridden
      expect(result.focus?.mode).toBe('cell') // From preset
      expect(result.focus?.cmdArrows).toBe('firstlast') // From preset
      expect(result.editing?.startClicks).toBe('double') // Overridden
      expect(result.editing?.enabled).toBe(true) // From preset
    })

    it('should handle empty overrides object', () => {
      const result = applyNuGridPreset('analytics', {})

      expect(result).toEqual(getNuGridPreset('analytics'))
    })

    it('should allow overriding virtualization options', () => {
      const result = applyNuGridPreset('analytics', {
        virtualization: { overscan: 50, dynamicRowHeights: true },
      })

      const virt = result.virtualization
      expect(virt && typeof virt === 'object' && virt.overscan).toBe(50) // Overridden
      expect(virt && typeof virt === 'object' && virt.dynamicRowHeights).toBe(true) // Overridden
      expect(virt && typeof virt === 'object' && virt.estimateSize).toBe(50) // From preset
    })

    it('should handle validation overrides on non-validation preset', () => {
      const result = applyNuGridPreset('readOnly', {
        validation: { showErrors: 'always', validateOn: 'change' },
      })

      const val = result.validation
      expect(val && typeof val === 'object' && val.showErrors).toBe('always')
      expect(val && typeof val === 'object' && val.validateOn).toBe('change')
      expect(result.editing?.enabled).toBe(false) // From preset
    })

    it('should override kanban startKeys', () => {
      const result = applyNuGridPreset('kanban', {
        editing: { startKeys: 'all' },
      })

      expect(result.editing?.startKeys).toBe('all') // Overridden
      expect(result.editing?.enabled).toBe(true) // From preset
    })

    it('should preserve preset type generic', () => {
      interface MyData {
        id: number
        name: string
      }

      const result = applyNuGridPreset<MyData>('editable', {
        focus: { mode: 'row' },
      })

      expect(result.focus?.mode).toBe('row')
    })
  })
})
