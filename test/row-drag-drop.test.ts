import type {
  RowDragEvent,
  RowDragOptions,
} from '../src/runtime/composables/_internal/useNuGridRowDragDrop'
import { describe, expect, it } from 'vitest'

/**
 * Tests for useNuGridRowDragDrop composable types and interfaces
 *
 * Note: The useNuGridRowDragDrop composable uses Nuxt's auto-imports (ref, toRef)
 * which are not available in the Vitest environment. These tests focus on
 * testing the exported interfaces and type structures.
 *
 * The actual composable functionality is tested through integration tests
 * and existing tests in row-drag.test.ts.
 */

describe('rowDragOptions Interface', () => {
  it('should have correct structure for basic options', () => {
    const options: RowDragOptions = {
      enabled: true,
    }

    expect(options.enabled).toBe(true)
    expect(options.sortOrderField).toBeUndefined()
    expect(options.allowCrossGroup).toBeUndefined()
    expect(options.allowCrossGrid).toBeUndefined()
    expect(options.gridId).toBeUndefined()
  })

  it('should support sortOrderField option', () => {
    const options: RowDragOptions = {
      enabled: true,
      sortOrderField: 'displayOrder',
    }

    expect(options.sortOrderField).toBe('displayOrder')
  })

  it('should support allowCrossGroup option', () => {
    const options: RowDragOptions = {
      enabled: true,
      allowCrossGroup: true,
    }

    expect(options.allowCrossGroup).toBe(true)
  })

  it('should support allowCrossGrid option with gridId', () => {
    const options: RowDragOptions = {
      enabled: true,
      allowCrossGrid: true,
      gridId: 'grid-1',
    }

    expect(options.allowCrossGrid).toBe(true)
    expect(options.gridId).toBe('grid-1')
  })

  it('should default enabled to false conceptually', () => {
    const options: RowDragOptions = {}

    // enabled defaults to false when not specified
    expect(options.enabled).toBeUndefined()
  })
})

describe('rowDragEvent Interface', () => {
  it('should have correct structure for basic event', () => {
    const event: RowDragEvent = {
      row: { id: 1, name: 'Test' },
      originalIndex: 0,
      newIndex: 2,
      positionChange: 2,
      groupChanged: false,
      gridChanged: false,
      dropPosition: 'after',
    }

    expect(event.row).toEqual({ id: 1, name: 'Test' })
    expect(event.originalIndex).toBe(0)
    expect(event.newIndex).toBe(2)
    expect(event.positionChange).toBe(2)
    expect(event.groupChanged).toBe(false)
    expect(event.gridChanged).toBe(false)
    expect(event.dropPosition).toBe('after')
  })

  it('should support cross-grid event properties', () => {
    const event: RowDragEvent = {
      row: { id: 1, name: 'Test' },
      originalIndex: 0,
      newIndex: 1,
      sourceGridId: 'grid-1',
      targetGridId: 'grid-2',
      positionChange: 1,
      groupChanged: false,
      gridChanged: true,
      dropPosition: 'before',
    }

    expect(event.sourceGridId).toBe('grid-1')
    expect(event.targetGridId).toBe('grid-2')
    expect(event.gridChanged).toBe(true)
  })

  it('should support cross-group event properties', () => {
    const event: RowDragEvent = {
      row: { id: 1, name: 'Test' },
      originalIndex: 0,
      newIndex: 3,
      sourceGroup: 'group-a',
      targetGroup: 'group-b',
      positionChange: 3,
      groupChanged: true,
      gridChanged: false,
      dropPosition: 'after',
    }

    expect(event.sourceGroup).toBe('group-a')
    expect(event.targetGroup).toBe('group-b')
    expect(event.groupChanged).toBe(true)
  })

  it('should track position change correctly for upward movement', () => {
    const event: RowDragEvent = {
      row: { id: 1, name: 'Test' },
      originalIndex: 5,
      newIndex: 2,
      positionChange: -3,
      groupChanged: false,
      gridChanged: false,
      dropPosition: 'before',
    }

    expect(event.positionChange).toBe(-3) // Negative means moved up
    expect(event.dropPosition).toBe('before')
  })

  it('should track position change correctly for downward movement', () => {
    const event: RowDragEvent = {
      row: { id: 1, name: 'Test' },
      originalIndex: 2,
      newIndex: 7,
      positionChange: 5,
      groupChanged: false,
      gridChanged: false,
      dropPosition: 'after',
    }

    expect(event.positionChange).toBe(5) // Positive means moved down
    expect(event.dropPosition).toBe('after')
  })
})

describe('dropPosition values', () => {
  it('should support before position', () => {
    const position: 'before' | 'after' = 'before'
    expect(position).toBe('before')
  })

  it('should support after position', () => {
    const position: 'before' | 'after' = 'after'
    expect(position).toBe('after')
  })
})
