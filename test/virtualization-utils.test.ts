import { describe, expect, it } from 'vitest'
import { resolveVirtualizationOptions } from '../src/runtime/composables/_internal/useNuGridVirtualization'

/**
 * Tests for virtualization option resolution
 *
 * This suite verifies resolveVirtualizationOptions:
 * 1. Applies defaults and enablement correctly
 * 2. Handles dynamic row heights and rowHeights merging
 * 3. Preserves custom overrides and edge cases
 */

describe('resolveVirtualizationOptions', () => {
  describe('default behavior', () => {
    it('should return default values when virtualization is true', () => {
      const result = resolveVirtualizationOptions(true)

      expect(result.estimateSize).toBe(65)
      expect(result.overscan).toBe(20)
      expect(result.dynamicRowHeights).toBe(true)
      expect(result.enabled).toBe(true)
    })

    it('should use custom default estimate size', () => {
      const result = resolveVirtualizationOptions(true, 100)

      expect(result.estimateSize).toBe(100)
    })

    it('should return defaults when virtualization is undefined', () => {
      const result = resolveVirtualizationOptions(undefined)

      expect(result.estimateSize).toBe(65)
      expect(result.overscan).toBe(20)
      expect(result.dynamicRowHeights).toBe(true)
      expect(result.enabled).toBe(false)
    })
  })

  describe('dynamic row heights behavior', () => {
    it('should have dynamicRowHeights true by default', () => {
      const result = resolveVirtualizationOptions(true)

      expect(result.dynamicRowHeights).toBe(true)
    })

    it('should have dynamicRowHeights true when virtualization is empty object', () => {
      const result = resolveVirtualizationOptions({})

      expect(result.dynamicRowHeights).toBe(true)
      expect(result.enabled).toBe(true)
    })

    it('should have dynamicRowHeights false when rowHeights is provided', () => {
      const result = resolveVirtualizationOptions({
        rowHeights: { dataRow: 100 },
      })

      expect(result.dynamicRowHeights).toBe(false)
      expect(result.rowHeights.dataRow).toBe(100)
    })

    it('should respect explicit dynamicRowHeights: true', () => {
      const result = resolveVirtualizationOptions({
        dynamicRowHeights: true,
      })

      expect(result.dynamicRowHeights).toBe(true)
    })

    it('should respect explicit dynamicRowHeights: false', () => {
      const result = resolveVirtualizationOptions({
        dynamicRowHeights: false,
      })

      expect(result.dynamicRowHeights).toBe(false)
    })

    it('should allow dynamicRowHeights: true with rowHeights', () => {
      const result = resolveVirtualizationOptions({
        rowHeights: { dataRow: 100 },
        dynamicRowHeights: true,
      })

      expect(result.dynamicRowHeights).toBe(true)
    })

    it('should allow dynamicRowHeights: false without rowHeights', () => {
      const result = resolveVirtualizationOptions({
        dynamicRowHeights: false,
      })

      expect(result.dynamicRowHeights).toBe(false)
    })
  })

  describe('custom options merging', () => {
    it('should merge custom estimateSize with defaults', () => {
      const result = resolveVirtualizationOptions({
        estimateSize: 80,
      })

      expect(result.estimateSize).toBe(80)
      expect(result.overscan).toBe(20) // Default value preserved
    })

    it('should merge custom overscan with defaults', () => {
      const result = resolveVirtualizationOptions({
        overscan: 20,
      })

      expect(result.overscan).toBe(20)
      expect(result.estimateSize).toBe(65) // Default value preserved
    })

    it('should allow multiple custom options', () => {
      const result = resolveVirtualizationOptions({
        estimateSize: 100,
        overscan: 25,
      })

      expect(result.estimateSize).toBe(100)
      expect(result.overscan).toBe(25)
    })

    it('should preserve rowHeights in result', () => {
      const rowHeights = {
        groupHeader: 60,
        columnHeader: 45,
        dataRow: 100,
        footer: 50,
      }
      const result = resolveVirtualizationOptions({
        rowHeights,
      })

      expect(result.rowHeights).toEqual(rowHeights)
    })

    it('should handle partial rowHeights', () => {
      const rowHeights = {
        dataRow: 100,
      }
      const result = resolveVirtualizationOptions({
        rowHeights,
      })

      expect(result.rowHeights).toEqual({
        groupHeader: 50,
        columnHeader: 50,
        dataRow: 100,
        footer: 45,
      })
    })

    describe('breakpoint-aware overscan', () => {
      it('should fall back to numeric overscan when no map is provided', () => {
        const result = resolveVirtualizationOptions(true, 65, 'sm')

        expect(result.overscan).toBe(20)
        expect(result.overscanByBreakpoint).toBeUndefined()
      })

      it('should use breakpoint-specific overscan from a map', () => {
        const result = resolveVirtualizationOptions(
          {
            overscan: { default: 14, sm: 6, lg: 20 },
          },
          65,
          'sm',
        )

        expect(result.overscan).toBe(6)
        expect(result.overscanByBreakpoint).toEqual({ default: 14, sm: 6, lg: 20 })
      })

      it('should fall back to default when breakpoint is missing', () => {
        const result = resolveVirtualizationOptions(
          {
            overscan: { default: 10, sm: 6 },
          },
          65,
          'xl',
        )

        expect(result.overscan).toBe(10)
      })

      it('should prefer overscanByBreakpoint over overscan number when both are set', () => {
        const result = resolveVirtualizationOptions(
          {
            overscan: 18,
            overscanByBreakpoint: { default: 11, md: 13 },
          },
          65,
          'md',
        )

        expect(result.overscan).toBe(13)
        expect(result.overscanByBreakpoint).toEqual({ default: 11, md: 13 })
      })
    })
  })

  describe('edge cases', () => {
    it('should handle null virtualization option gracefully', () => {
      // eslint-disable-next-line ts/ban-ts-comment
      // @ts-expect-error
      const result = resolveVirtualizationOptions(null)

      expect(result.estimateSize).toBe(65)
      expect(result.overscan).toBe(20)
      expect(result.enabled).toBe(false)
    })

    it('should handle false virtualization option', () => {
      const result = resolveVirtualizationOptions(false)

      expect(result.estimateSize).toBe(65)
      expect(result.overscan).toBe(20)
      expect(result.enabled).toBe(false)
    })

    it('should handle zero estimateSize', () => {
      const result = resolveVirtualizationOptions({
        estimateSize: 0,
      })

      // Zero is a valid value and should be preserved by defu
      expect(result.estimateSize).toBe(0)
    })

    it('should handle zero overscan', () => {
      const result = resolveVirtualizationOptions({
        overscan: 0,
      })

      // Zero is a valid value and should be preserved by defu
      expect(result.overscan).toBe(0)
    })

    it('should handle large estimateSize', () => {
      const result = resolveVirtualizationOptions({
        estimateSize: 1000,
      })

      expect(result.estimateSize).toBe(1000)
    })

    it('should handle large overscan', () => {
      const result = resolveVirtualizationOptions({
        overscan: 100,
      })

      expect(result.overscan).toBe(100)
    })
  })

  describe('integration with default estimate size parameter', () => {
    it('should use provided defaultEstimateSize when virtualization is boolean', () => {
      const result = resolveVirtualizationOptions(true, 80)

      expect(result.estimateSize).toBe(80)
    })

    it('should prefer explicit estimateSize over default', () => {
      const result = resolveVirtualizationOptions(
        {
          estimateSize: 100,
        },
        80,
      )

      expect(result.estimateSize).toBe(100)
    })

    it('should use defaultEstimateSize when options have no estimateSize', () => {
      const result = resolveVirtualizationOptions(
        {
          overscan: 20,
        },
        90,
      )

      expect(result.estimateSize).toBe(90)
    })
  })
})
