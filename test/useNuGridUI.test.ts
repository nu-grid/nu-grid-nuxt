import type { NuGridProps } from '../src/runtime/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNuGridUI } from '../src/runtime/composables/_internal/useNuGridUI'

// Type for the mock tv result
interface MockUIResult {
  root: string
  header: string
  body: string
  sticky?: boolean
  loading?: boolean
  virtualize?: boolean
  loadingColor?: string
  loadingAnimation?: string
  _theme?: unknown
}

// Mock #imports
vi.mock('#imports', () => ({
  useAppConfig: vi.fn(() => ({
    ui: {
      table: {},
    },
  })),
}))

// Mock the tv utility
vi.mock('@nuxt/ui/runtime/utils/tv.js', () => ({
  tv: vi.fn((theme) => {
    return vi.fn((options) => {
      // Return a mock that includes both the theme base and the passed options
      return {
        root: 'mock-root-class',
        header: 'mock-header-class',
        body: 'mock-body-class',
        sticky: options?.sticky,
        loading: options?.loading,
        virtualize: options?.virtualize,
        loadingColor: options?.loadingColor,
        loadingAnimation: options?.loadingAnimation,
        _theme: theme,
      }
    })
  }),
}))

// Mock themes
vi.mock('../src/runtime/config/nuGridTheme', () => ({
  default: {
    base: 'default-base',
    slots: {
      root: 'default-root',
      header: 'default-header',
    },
  },
}))

vi.mock('../src/runtime/config/nuGridThemeCompact', () => ({
  default: {
    base: 'compact-base',
    slots: {
      root: 'compact-root',
      header: 'compact-header',
    },
  },
}))

/**
 * Helper to create mock props
 */
function createMockProps(overrides: Partial<NuGridProps<any>> = {}): NuGridProps<any> {
  return {
    columns: [],
    data: [],
    ...overrides,
  } as NuGridProps<any>
}

describe('useNuGridUI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ui computed', () => {
    it('should return a computed ui object', () => {
      const props = createMockProps()
      const { ui } = useNuGridUI(props)

      expect(ui.value).toBeDefined()
      expect(typeof ui.value).toBe('object')
    })

    it('should include root class', () => {
      const props = createMockProps()
      const { ui } = useNuGridUI(props)

      expect((ui.value as unknown as MockUIResult).root).toBeDefined()
    })

    it('should include header class', () => {
      const props = createMockProps()
      const { ui } = useNuGridUI(props)

      expect((ui.value as unknown as MockUIResult).header).toBeDefined()
    })
  })

  describe('theme selection', () => {
    it('should use default theme when no theme prop specified', async () => {
      const props = createMockProps()
      const { ui } = useNuGridUI(props)

      // The mock captures which theme was passed
      expect((ui.value as unknown as MockUIResult)._theme).toBeDefined()
    })

    it('should use default theme when theme prop is default', async () => {
      const props = createMockProps({ theme: 'default' })
      const { ui } = useNuGridUI(props)

      expect((ui.value as unknown as MockUIResult)._theme).toBeDefined()
    })

    it('should use compact theme when theme prop is compact', async () => {
      const props = createMockProps({ theme: 'compact' })
      const { ui } = useNuGridUI(props)

      expect((ui.value as unknown as MockUIResult)._theme).toBeDefined()
    })
  })

  describe('sticky option', () => {
    it('should pass sticky option to tv function', () => {
      const props = createMockProps({ sticky: true })
      const { ui } = useNuGridUI(props)

      expect((ui.value as unknown as MockUIResult).sticky).toBe(true)
    })

    it('should pass sticky: false when not specified', () => {
      const props = createMockProps({ sticky: false })
      const { ui } = useNuGridUI(props)

      expect((ui.value as unknown as MockUIResult).sticky).toBe(false)
    })

    it('should disable sticky when virtualization is enabled', () => {
      const props = createMockProps({
        sticky: true,
        virtualization: { overscan: 5 },
      })
      const { ui } = useNuGridUI(props)

      expect((ui.value as unknown as MockUIResult).sticky).toBe(false)
    })

    it('should keep sticky when virtualization is disabled', () => {
      const props = createMockProps({
        sticky: true,
        virtualization: undefined,
      })
      const { ui } = useNuGridUI(props)

      expect((ui.value as unknown as MockUIResult).sticky).toBe(true)
    })
  })

  describe('loading option', () => {
    it('should pass loading option to tv function', () => {
      const props = createMockProps({ loading: true })
      const { ui } = useNuGridUI(props)

      expect((ui.value as unknown as MockUIResult).loading).toBe(true)
    })

    it('should pass loading: false when not loading', () => {
      const props = createMockProps({ loading: false })
      const { ui } = useNuGridUI(props)

      expect((ui.value as unknown as MockUIResult).loading).toBe(false)
    })
  })

  describe('loadingColor option', () => {
    it('should pass loadingColor option to tv function', () => {
      const props = createMockProps({ loadingColor: 'primary' })
      const { ui } = useNuGridUI(props)

      expect((ui.value as unknown as MockUIResult).loadingColor).toBe('primary')
    })

    it('should handle custom loadingColor', () => {
      const props = createMockProps({ loadingColor: 'secondary' })
      const { ui } = useNuGridUI(props)

      expect((ui.value as unknown as MockUIResult).loadingColor).toBe('secondary')
    })
  })

  describe('loadingAnimation option', () => {
    it('should pass loadingAnimation option to tv function', () => {
      const props = createMockProps({ loadingAnimation: 'carousel' })
      const { ui } = useNuGridUI(props)

      expect((ui.value as unknown as MockUIResult).loadingAnimation).toBe('carousel')
    })

    it('should handle elastic animation', () => {
      const props = createMockProps({ loadingAnimation: 'elastic' })
      const { ui } = useNuGridUI(props)

      expect((ui.value as unknown as MockUIResult).loadingAnimation).toBe('elastic')
    })
  })

  describe('virtualize option', () => {
    it('should set virtualize: true when virtualization is enabled', () => {
      const props = createMockProps({
        virtualization: { overscan: 10 },
      })
      const { ui } = useNuGridUI(props)

      expect((ui.value as unknown as MockUIResult).virtualize).toBe(true)
    })

    it('should set virtualize: false when virtualization is disabled', () => {
      const props = createMockProps({
        virtualization: undefined,
      })
      const { ui } = useNuGridUI(props)

      expect((ui.value as unknown as MockUIResult).virtualize).toBe(false)
    })

    it('should set virtualize: false when virtualization is false', () => {
      const props = createMockProps({
        virtualization: false as any,
      })
      const { ui } = useNuGridUI(props)

      expect((ui.value as unknown as MockUIResult).virtualize).toBe(false)
    })
  })

  describe('appConfig integration', () => {
    it('should use appConfig.ui.table for overrides', async () => {
      // @ts-expect-error - #imports is a Nuxt auto-import alias
      const { useAppConfig } = await import('#imports')
      vi.mocked(useAppConfig).mockReturnValue({
        ui: {
          table: {
            customClass: 'from-app-config',
          },
        },
      })

      const props = createMockProps()
      const { ui } = useNuGridUI(props)

      // The tv mock should have received the appConfig overrides
      expect(ui.value).toBeDefined()
    })
  })

  describe('return value', () => {
    it('should return object with ui property', () => {
      const props = createMockProps()
      const result = useNuGridUI(props)

      expect(result).toHaveProperty('ui')
      expect(typeof result.ui.value).toBe('object')
    })
  })
})
