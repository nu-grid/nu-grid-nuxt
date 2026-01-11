import { describe, expect, it, vi } from 'vitest'
import { ROUTER_PRIORITIES } from '../src/runtime/types/_internal'
import { createMockCell, createMockRow, createTestRouter } from './utils/router-test-utils'

describe('interaction Router - Example Tests', () => {
  describe('basic handler registration', () => {
    it('should register and execute a cell click handler', () => {
      const { router, simulateCellClick, dispatchSpy } = createTestRouter()
      const handleSpy = vi.fn()

      // Register a handler
      router.registerCellClickHandler({
        id: 'test-handler',
        priority: ROUTER_PRIORITIES.ACTION_MIN,
        handle: (context) => {
          handleSpy(context)
          return { handled: true }
        },
      })

      // Simulate a cell click
      const row = createMockRow({ id: 1, name: 'Test' })
      const cell = createMockCell(row, 'name', 'Test')
      simulateCellClick(row as any, cell as any)

      // Verify handler was called
      expect(handleSpy).toHaveBeenCalledOnce()
      expect(dispatchSpy).toHaveBeenCalledWith('cellClick', expect.any(Object))
    })

    it('should prevent duplicate handler IDs', () => {
      const { router } = createTestRouter()

      router.registerCellClickHandler({
        id: 'duplicate-id',
        priority: 10,
        handle: () => ({}),
      })

      // Attempting to register with same ID should throw
      expect(() => {
        router.registerCellClickHandler({
          id: 'duplicate-id',
          priority: 20,
          handle: () => ({}),
        })
      }).toThrow('Handler with id "duplicate-id" already registered')
    })

    it('should unregister handlers correctly', () => {
      const { router, getRegisteredHandlers } = createTestRouter()

      const unregister = router.registerCellClickHandler({
        id: 'temp-handler',
        priority: 10,
        handle: () => ({}),
      })

      expect(getRegisteredHandlers().cellClick).toHaveLength(1)

      unregister()

      expect(getRegisteredHandlers().cellClick).toHaveLength(0)
    })
  })

  describe('priority-based dispatch', () => {
    it('should execute handlers in priority order', () => {
      const { router, simulateCellClick } = createTestRouter()
      const executionOrder: string[] = []

      // Register handlers in reverse priority order
      router.registerCellClickHandler({
        id: 'low-priority',
        priority: 50,
        handle: () => {
          executionOrder.push('low')
          return {}
        },
      })

      router.registerCellClickHandler({
        id: 'high-priority',
        priority: 10,
        handle: () => {
          executionOrder.push('high')
          return {}
        },
      })

      router.registerCellClickHandler({
        id: 'medium-priority',
        priority: 30,
        handle: () => {
          executionOrder.push('medium')
          return {}
        },
      })

      const row = createMockRow({ id: 1 })
      const cell = createMockCell(row, 'id', 1)
      simulateCellClick(row as any, cell as any)

      // Should execute in priority order: 10, 30, 50
      expect(executionOrder).toEqual(['high', 'medium', 'low'])
    })

    it('should stop execution when handler returns handled: true', () => {
      const { router, simulateCellClick } = createTestRouter()
      const firstHandlerSpy = vi.fn(() => ({ handled: true }))
      const secondHandlerSpy = vi.fn()

      router.registerCellClickHandler({
        id: 'first',
        priority: 10,
        handle: firstHandlerSpy,
      })

      router.registerCellClickHandler({
        id: 'second',
        priority: 20,
        handle: secondHandlerSpy,
      })

      const row = createMockRow({ id: 1 })
      const cell = createMockCell(row, 'id', 1)
      simulateCellClick(row as any, cell as any)

      expect(firstHandlerSpy).toHaveBeenCalledOnce()
      expect(secondHandlerSpy).not.toHaveBeenCalled()
    })
  })

  describe('conditional execution with when predicate', () => {
    it('should skip handler when when() returns false', () => {
      const { router, simulateCellClick } = createTestRouter()
      const handleSpy = vi.fn()

      router.registerCellClickHandler({
        id: 'conditional',
        priority: 10,
        when: ({ row }) => (row.original as any).enabled === true,
        handle: handleSpy,
      })

      // Test with disabled row
      const disabledRow = createMockRow({ id: 1, enabled: false })
      const disabledCell = createMockCell(disabledRow, 'id', 1)
      simulateCellClick(disabledRow as any, disabledCell as any)

      expect(handleSpy).not.toHaveBeenCalled()

      // Test with enabled row
      const enabledRow = createMockRow({ id: 2, enabled: true })
      const enabledCell = createMockCell(enabledRow, 'id', 2)
      simulateCellClick(enabledRow as any, enabledCell as any)

      expect(handleSpy).toHaveBeenCalledOnce()
    })
  })

  describe('event manipulation', () => {
    it('should preventDefault when handler returns preventDefault: true', () => {
      const { router, simulateCellClick } = createTestRouter()

      router.registerCellClickHandler({
        id: 'prevent-default',
        priority: 10,
        handle: () => ({ preventDefault: true }),
      })

      const row = createMockRow({ id: 1 })
      const cell = createMockCell(row, 'id', 1)
      const mockEvent = new MouseEvent('click', { cancelable: true })

      simulateCellClick(row as any, cell as any, 0, mockEvent)

      expect(mockEvent.defaultPrevented).toBe(true)
    })

    it('should stopPropagation when handler returns stopPropagation: true', () => {
      const { router, simulateCellClick } = createTestRouter()
      const stopPropagationSpy = vi.fn()

      router.registerCellClickHandler({
        id: 'stop-propagation',
        priority: 10,
        handle: () => ({ stopPropagation: true }),
      })

      const row = createMockRow({ id: 1 })
      const cell = createMockCell(row, 'id', 1)
      const mockEvent = new MouseEvent('click')
      mockEvent.stopPropagation = stopPropagationSpy

      simulateCellClick(row as any, cell as any, 0, mockEvent)

      expect(stopPropagationSpy).toHaveBeenCalled()
    })
  })

  describe('debug mode', () => {
    it('should log execution in debug mode', () => {
      const { router, simulateCellClick } = createTestRouter({ debug: true })
      const consoleLogSpy = vi.spyOn(console, 'log')

      router.registerCellClickHandler({
        id: 'debug-handler',
        priority: 10,
        handle: () => ({ handled: true }),
      })

      const row = createMockRow({ id: 1 })
      const cell = createMockCell(row, 'id', 1)
      simulateCellClick(row as any, cell as any)

      // Check for new debug format with emojis and enhanced logging
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Router] 📋 Dispatching click to 1 handler(s):',
        'debug-handler(p:10)',
      )
      expect(consoleLogSpy).toHaveBeenCalledWith('[Router] ▶️  Executing: debug-handler')
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Router] ✋ Claimed by: debug-handler (handled: true)',
      )

      consoleLogSpy.mockRestore()
    })
  })

  describe('global pointer handlers', () => {
    it('should execute global pointer handlers on document pointerdown', () => {
      const { router, simulatePointerDown } = createTestRouter()
      const handleSpy = vi.fn()

      router.registerGlobalPointerHandler({
        id: 'global-handler',
        priority: 10,
        handle: handleSpy,
      })

      simulatePointerDown()

      expect(handleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: expect.any(PointerEvent),
        }),
      )
    })
  })

  describe('dispatch tracking', () => {
    it('should track last dispatch', () => {
      const { router, simulateCellClick, getLastDispatch } = createTestRouter()

      router.registerCellClickHandler({
        id: 'tracker',
        priority: 10,
        handle: () => ({}),
      })

      const row = createMockRow({ id: 1 })
      const cell = createMockCell(row, 'id', 1)
      simulateCellClick(row as any, cell as any)

      const lastDispatch = getLastDispatch()
      expect(lastDispatch).toBeTruthy()
      expect(lastDispatch?.type).toBe('cellClick')
      expect(lastDispatch?.context.row).toBe(row)
    })

    it('should clear dispatch history', () => {
      const { router, simulateCellClick, dispatchSpy, clearDispatchHistory } = createTestRouter()

      router.registerCellClickHandler({
        id: 'tracker',
        priority: 10,
        handle: () => ({}),
      })

      const row = createMockRow({ id: 1 })
      const cell = createMockCell(row, 'id', 1)
      simulateCellClick(row as any, cell as any)

      expect(dispatchSpy).toHaveBeenCalledOnce()

      clearDispatchHistory()

      expect(dispatchSpy).not.toHaveBeenCalled()
    })
  })
})
