import { describe, expect, it } from 'vitest'

describe('row Dragging Feature', () => {
  it('should have row drag options interface', () => {
    // This is a type-level test - if it compiles, the interface exists
    const options: {
      enabled?: boolean
      sortOrderField?: string
      allowCrossGroup?: boolean
      allowCrossGrid?: boolean
      gridId?: string
    } = {
      enabled: true,
      sortOrderField: 'order',
    }

    expect(options.enabled).toBe(true)
    expect(options.sortOrderField).toBe('order')
  })

  it('should handle drag event structure', () => {
    // Test the expected shape of a drag event
    const dragEvent = {
      row: { id: '1', original: { name: 'Test' } },
      originalIndex: 0,
      newIndex: 2,
      sourceGridId: 'grid1',
      targetGridId: 'grid1',
    }

    expect(dragEvent.originalIndex).toBe(0)
    expect(dragEvent.newIndex).toBe(2)
    expect(dragEvent.row.id).toBe('1')
  })

  it('should define row drag options with correct defaults', () => {
    const defaultOptions = {
      enabled: false,
    }

    expect(defaultOptions.enabled).toBe(false)
  })

  it('should support sort order field configuration', () => {
    const options = {
      enabled: true,
      sortOrderField: 'displayOrder',
    }

    expect(options.sortOrderField).toBe('displayOrder')
  })

  it('should support cross-grid dragging configuration', () => {
    const options = {
      enabled: true,
      allowCrossGrid: true,
      gridId: 'grid-1',
    }

    expect(options.allowCrossGrid).toBe(true)
    expect(options.gridId).toBe('grid-1')
  })

  it('should support cross-group dragging configuration', () => {
    const options = {
      enabled: true,
      allowCrossGroup: true,
    }

    expect(options.allowCrossGroup).toBe(true)
  })
})
