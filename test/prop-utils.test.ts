import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import {
  getDefaults,
  usePropsWithDefaults,
  usePropWithDefault,
} from '../src/runtime/config/_internal/prop-utils'

describe('prop-utils', () => {
  describe('getDefaults', () => {
    it('should return focus defaults', () => {
      const defaults = getDefaults('focus')

      expect(defaults).toBeDefined()
      expect(defaults.mode).toBeDefined()
    })

    it('should return editing defaults', () => {
      const defaults = getDefaults('editing')

      expect(defaults).toBeDefined()
      expect(defaults.enabled).toBeDefined()
    })

    it('should return validation defaults', () => {
      const defaults = getDefaults('validation')

      expect(defaults).toBeDefined()
      expect(defaults.validateOn).toBeDefined()
    })

    it('should return rowSelection defaults', () => {
      const defaults = getDefaults('rowSelection')

      expect(defaults).toBeDefined()
    })

    it('should return layout defaults', () => {
      const defaults = getDefaults('layout')

      expect(defaults).toBeDefined()
    })

    it('should return virtualization defaults', () => {
      const defaults = getDefaults('virtualization')

      expect(defaults).toBeDefined()
      expect(defaults.overscan).toBeDefined()
    })
  })

  describe('usePropWithDefault', () => {
    it('should return prop value when provided', () => {
      const props = {
        focus: { mode: 'row' },
      }

      const mode = usePropWithDefault(props, 'focus', 'mode')

      expect(mode.value).toBe('row')
    })

    it('should return default when prop not provided', () => {
      const props = {}

      const mode = usePropWithDefault(props, 'focus', 'mode')
      const defaults = getDefaults('focus')

      expect(mode.value).toBe(defaults.mode)
    })

    it('should return default when prop group is undefined', () => {
      const props = {
        focus: undefined,
      }

      const mode = usePropWithDefault(props, 'focus', 'mode')
      const defaults = getDefaults('focus')

      expect(mode.value).toBe(defaults.mode)
    })

    it('should return default when specific key is undefined', () => {
      const props = {
        focus: { retain: true }, // mode is not set
      }

      const mode = usePropWithDefault(props, 'focus', 'mode')
      const defaults = getDefaults('focus')

      expect(mode.value).toBe(defaults.mode)
    })

    it('should handle editing group', () => {
      const props = {
        editing: { enabled: false },
      }

      const enabled = usePropWithDefault(props, 'editing', 'enabled')

      expect(enabled.value).toBe(false)
    })

    it('should handle validation group', () => {
      const props = {
        validation: { validateOn: 'blur' },
      }

      const validateOn = usePropWithDefault(props, 'validation', 'validateOn')

      expect(validateOn.value).toBe('blur')
    })

    it('should be reactive', async () => {
      const props = reactive({
        focus: { mode: 'cell' },
      }) as any

      const mode = usePropWithDefault(props, 'focus', 'mode')
      expect(mode.value).toBe('cell')

      // Change prop
      props.focus = { mode: 'row' }

      // Computed should update
      expect(mode.value).toBe('row')
    })
  })

  describe('usePropsWithDefaults', () => {
    it('should return multiple computed refs', () => {
      const props = {
        focus: { mode: 'row', retain: true },
      }

      const result = usePropsWithDefaults(props, 'focus', ['mode', 'retain'])

      expect(result.mode).toBeDefined()
      expect(result.retain).toBeDefined()
      expect(result.mode.value).toBe('row')
      expect(result.retain.value).toBe(true)
    })

    it('should use defaults for missing props', () => {
      const props = {
        focus: { mode: 'cell' }, // retain not provided
      }

      const result = usePropsWithDefaults(props, 'focus', ['mode', 'retain'])
      const defaults = getDefaults('focus')

      expect(result.mode.value).toBe('cell')
      expect(result.retain.value).toBe(defaults.retain)
    })

    it('should handle empty props', () => {
      const props = {}

      const result = usePropsWithDefaults(props, 'editing', ['enabled', 'startClicks'])
      const defaults = getDefaults('editing')

      expect(result.enabled.value).toBe(defaults.enabled)
      expect(result.startClicks.value).toBe(defaults.startClicks)
    })

    it('should handle validation group', () => {
      const props = {
        validation: { showErrors: false },
      }

      const result = usePropsWithDefaults(props, 'validation', ['showErrors', 'validateOn'])
      const defaults = getDefaults('validation')

      expect(result.showErrors.value).toBe(false)
      expect(result.validateOn.value).toBe(defaults.validateOn)
    })

    it('should handle layout group', () => {
      const props = {
        layout: { stickyHeaders: true },
      }

      const result = usePropsWithDefaults(props, 'layout', ['stickyHeaders'])

      expect(result.stickyHeaders.value).toBe(true)
    })
  })
})
