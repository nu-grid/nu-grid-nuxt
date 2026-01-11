import type { PinnableHeader } from '../src/runtime/types/_internal'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useNuGridColumnPinning } from '../src/runtime/composables/_internal/useNuGridColumnPinning'
import {
  getHeaderEffectivePinning,
  getHeaderPinningStyle,
} from '../src/runtime/composables/_internal/useNuGridCore'

describe('column Pinning Feature', () => {
  it('should have column pinning composable', () => {
    // This test verifies the composable exists and exports the right interface
    expect(typeof useNuGridColumnPinning).toBe('function')
  })

  it('should support column pinning state structure', () => {
    // Test the expected shape of column pinning state
    const pinningState = {
      left: ['select', 'name'],
      right: ['actions'],
    }

    expect(Array.isArray(pinningState.left)).toBe(true)
    expect(Array.isArray(pinningState.right)).toBe(true)
    expect(pinningState.left).toContain('select')
    expect(pinningState.right).toContain('actions')
  })

  it('should handle empty pinning state', () => {
    const emptyPinningState = {
      left: [],
      right: [],
    }

    expect(emptyPinningState.left.length).toBe(0)
    expect(emptyPinningState.right.length).toBe(0)
  })

  it('should define column pinning controls interface', () => {
    // Test the expected interface of pinning controls
    const mockTableApi = {
      getState: () => ({
        columnPinning: { left: ['id'], right: ['actions'] },
      }),
      setColumnPinning: (_pinning: any) => {
        // Mock implementation
      },
    }

    const tableApiRef = ref(mockTableApi as any)
    const controls = useNuGridColumnPinning(tableApiRef)

    expect(typeof controls.pinColumn).toBe('function')
    expect(typeof controls.unpinColumn).toBe('function')
    expect(typeof controls.isPinned).toBe('function')
    expect(typeof controls.getPinnedColumns).toBe('function')
  })

  it('should pin column to left', () => {
    let currentPinning = { left: [] as string[], right: [] as string[] }

    const mockTableApi = {
      getState: () => ({ columnPinning: currentPinning }),
      setColumnPinning: (pinning: any) => {
        currentPinning = pinning
      },
    }

    const tableApiRef = ref(mockTableApi as any)
    const controls = useNuGridColumnPinning(tableApiRef)

    controls.pinColumn('name', 'left')

    expect(currentPinning.left).toContain('name')
    expect(currentPinning.right).not.toContain('name')
  })

  it('should pin column to right', () => {
    let currentPinning = { left: [] as string[], right: [] as string[] }

    const mockTableApi = {
      getState: () => ({ columnPinning: currentPinning }),
      setColumnPinning: (pinning: any) => {
        currentPinning = pinning
      },
    }

    const tableApiRef = ref(mockTableApi as any)
    const controls = useNuGridColumnPinning(tableApiRef)

    controls.pinColumn('actions', 'right')

    expect(currentPinning.right).toContain('actions')
    expect(currentPinning.left).not.toContain('actions')
  })

  it('should unpin column', () => {
    let currentPinning = {
      left: ['select', 'name'] as string[],
      right: ['actions'] as string[],
    }

    const mockTableApi = {
      getState: () => ({ columnPinning: currentPinning }),
      setColumnPinning: (pinning: any) => {
        currentPinning = pinning
      },
    }

    const tableApiRef = ref(mockTableApi as any)
    const controls = useNuGridColumnPinning(tableApiRef)

    controls.unpinColumn('name')

    expect(currentPinning.left).not.toContain('name')
    expect(currentPinning.left).toContain('select')
  })

  it('should move column from left to right when re-pinned', () => {
    let currentPinning = {
      left: ['name'] as string[],
      right: [] as string[],
    }

    const mockTableApi = {
      getState: () => ({ columnPinning: currentPinning }),
      setColumnPinning: (pinning: any) => {
        currentPinning = pinning
      },
    }

    const tableApiRef = ref(mockTableApi as any)
    const controls = useNuGridColumnPinning(tableApiRef)

    controls.pinColumn('name', 'right')

    expect(currentPinning.left).not.toContain('name')
    expect(currentPinning.right).toContain('name')
  })

  it('should detect pinned column side correctly', () => {
    const currentPinning = {
      left: ['select', 'id'],
      right: ['actions'],
    }

    const mockTableApi = {
      getState: () => ({ columnPinning: currentPinning }),
      setColumnPinning: () => {},
    }

    const tableApiRef = ref(mockTableApi as any)
    const controls = useNuGridColumnPinning(tableApiRef)

    expect(controls.isPinned('select')).toBe('left')
    expect(controls.isPinned('id')).toBe('left')
    expect(controls.isPinned('actions')).toBe('right')
    expect(controls.isPinned('name')).toBe(false)
  })

  it('should get all pinned columns', () => {
    const currentPinning = {
      left: ['select', 'id'],
      right: ['actions', 'menu'],
    }

    const mockTableApi = {
      getState: () => ({ columnPinning: currentPinning }),
      setColumnPinning: () => {},
    }

    const tableApiRef = ref(mockTableApi as any)
    const controls = useNuGridColumnPinning(tableApiRef)

    const pinnedColumns = controls.getPinnedColumns()

    expect(pinnedColumns.left).toEqual(['select', 'id'])
    expect(pinnedColumns.right).toEqual(['actions', 'menu'])
  })

  it('should handle undefined pinning arrays gracefully', () => {
    const currentPinning = {}

    const mockTableApi = {
      getState: () => ({ columnPinning: currentPinning }),
      setColumnPinning: () => {},
    }

    const tableApiRef = ref(mockTableApi as any)
    const controls = useNuGridColumnPinning(tableApiRef)

    const pinnedColumns = controls.getPinnedColumns()

    expect(Array.isArray(pinnedColumns.left)).toBe(true)
    expect(Array.isArray(pinnedColumns.right)).toBe(true)
    expect(pinnedColumns.left.length).toBe(0)
    expect(pinnedColumns.right.length).toBe(0)
  })
})

describe('getHeaderPinningStyle', () => {
  it('should return empty for non-pinned columns', () => {
    const header = {
      colSpan: 1,
      column: {
        getIsPinned: () => false,
        getStart: () => 0,
        getAfter: () => 0,
      },
      getLeafHeaders: () => [],
    }
    expect(getHeaderPinningStyle(header as PinnableHeader)).toEqual({})
  })

  it('should return left position for left-pinned regular column', () => {
    const header = {
      colSpan: 1,
      column: {
        getIsPinned: () => 'left',
        getStart: () => 48,
        getAfter: () => 0,
      },
      getLeafHeaders: () => [],
    }
    expect(getHeaderPinningStyle(header as PinnableHeader)).toEqual({ left: '48px', zIndex: 20 })
  })

  it('should return right position for right-pinned regular column', () => {
    const header = {
      colSpan: 1,
      column: {
        getIsPinned: () => 'right',
        getStart: () => 0,
        getAfter: () => 60,
      },
      getLeafHeaders: () => [],
    }
    expect(getHeaderPinningStyle(header as PinnableHeader)).toEqual({ right: '60px', zIndex: 20 })
  })

  it('should not include zIndex when includeZIndex is false', () => {
    const header = {
      colSpan: 1,
      column: {
        getIsPinned: () => 'left',
        getStart: () => 0,
        getAfter: () => 0,
      },
      getLeafHeaders: () => [],
    }
    expect(getHeaderPinningStyle(header as PinnableHeader, { includeZIndex: false })).toEqual({
      left: '0px',
    })
  })

  it('should return left position for left-pinned column group when all leaves are left-pinned', () => {
    const header = {
      colSpan: 3,
      column: {
        getIsPinned: () => 'left',
        getStart: () => 0,
        getAfter: () => 0,
      },
      getLeafHeaders: () => [
        { column: { getIsPinned: () => 'left', getStart: () => 0, getAfter: () => 0 } },
        { column: { getIsPinned: () => 'left', getStart: () => 100, getAfter: () => 0 } },
        { column: { getIsPinned: () => 'left', getStart: () => 200, getAfter: () => 0 } },
      ],
    }
    expect(getHeaderPinningStyle(header as PinnableHeader)).toEqual({ left: '0px', zIndex: 20 })
  })

  it('should return empty for column group with mixed pinning', () => {
    const header = {
      colSpan: 3,
      column: {
        getIsPinned: () => 'left',
        getStart: () => 0,
        getAfter: () => 0,
      },
      getLeafHeaders: () => [
        { column: { getIsPinned: () => 'left', getStart: () => 0, getAfter: () => 0 } },
        { column: { getIsPinned: () => false, getStart: () => 100, getAfter: () => 0 } },
        { column: { getIsPinned: () => false, getStart: () => 200, getAfter: () => 0 } },
      ],
    }
    expect(getHeaderPinningStyle(header as PinnableHeader)).toEqual({})
  })

  it('should return right position for right-pinned column group when all leaves are right-pinned', () => {
    const header = {
      colSpan: 2,
      column: {
        getIsPinned: () => 'right',
        getStart: () => 0,
        getAfter: () => 0,
      },
      getLeafHeaders: () => [
        { column: { getIsPinned: () => 'right', getStart: () => 0, getAfter: () => 100 } },
        { column: { getIsPinned: () => 'right', getStart: () => 0, getAfter: () => 0 } },
      ],
    }
    expect(getHeaderPinningStyle(header as PinnableHeader)).toEqual({ right: '0px', zIndex: 20 })
  })

  it('should use custom zIndex when provided', () => {
    const header = {
      colSpan: 1,
      column: {
        getIsPinned: () => 'left',
        getStart: () => 48,
        getAfter: () => 0,
      },
      getLeafHeaders: () => [],
    }
    expect(getHeaderPinningStyle(header as PinnableHeader, { zIndex: 30 })).toEqual({
      left: '48px',
      zIndex: 30,
    })
  })
})

describe('getHeaderEffectivePinning', () => {
  it('should return false for non-pinned columns', () => {
    const header = {
      colSpan: 1,
      column: {
        getIsPinned: () => false,
        getStart: () => 0,
        getAfter: () => 0,
      },
      getLeafHeaders: () => [],
    }
    expect(getHeaderEffectivePinning(header as PinnableHeader)).toBe(false)
  })

  it('should return left for left-pinned regular column', () => {
    const header = {
      colSpan: 1,
      column: {
        getIsPinned: () => 'left',
        getStart: () => 0,
        getAfter: () => 0,
      },
      getLeafHeaders: () => [],
    }
    expect(getHeaderEffectivePinning(header as PinnableHeader)).toBe('left')
  })

  it('should return right for right-pinned regular column', () => {
    const header = {
      colSpan: 1,
      column: {
        getIsPinned: () => 'right',
        getStart: () => 0,
        getAfter: () => 0,
      },
      getLeafHeaders: () => [],
    }
    expect(getHeaderEffectivePinning(header as PinnableHeader)).toBe('right')
  })

  it('should return left for column group when all leaves are left-pinned', () => {
    const header = {
      colSpan: 3,
      column: {
        getIsPinned: () => 'left',
        getStart: () => 0,
        getAfter: () => 0,
      },
      getLeafHeaders: () => [
        { column: { getIsPinned: () => 'left', getStart: () => 0, getAfter: () => 0 } },
        { column: { getIsPinned: () => 'left', getStart: () => 100, getAfter: () => 0 } },
        { column: { getIsPinned: () => 'left', getStart: () => 200, getAfter: () => 0 } },
      ],
    }
    expect(getHeaderEffectivePinning(header as PinnableHeader)).toBe('left')
  })

  it('should return false for column group with mixed pinning', () => {
    const header = {
      colSpan: 2,
      column: {
        getIsPinned: () => 'right',
        getStart: () => 0,
        getAfter: () => 0,
      },
      getLeafHeaders: () => [
        { column: { getIsPinned: () => false, getStart: () => 0, getAfter: () => 0 } },
        { column: { getIsPinned: () => 'right', getStart: () => 0, getAfter: () => 0 } },
      ],
    }
    expect(getHeaderEffectivePinning(header as PinnableHeader)).toBe(false)
  })

  it('should return right for column group when all leaves are right-pinned', () => {
    const header = {
      colSpan: 2,
      column: {
        getIsPinned: () => 'right',
        getStart: () => 0,
        getAfter: () => 0,
      },
      getLeafHeaders: () => [
        { column: { getIsPinned: () => 'right', getStart: () => 0, getAfter: () => 100 } },
        { column: { getIsPinned: () => 'right', getStart: () => 0, getAfter: () => 0 } },
      ],
    }
    expect(getHeaderEffectivePinning(header as PinnableHeader)).toBe('right')
  })
})
