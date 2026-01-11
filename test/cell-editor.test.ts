import type { Ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useNuGridCellEditor } from '../src/runtime/composables/useNuGridCellEditor'

/**
 * Tests for useNuGridCellEditor composable
 *
 * This test suite verifies:
 * 1. handleKeydown correctly handles various key events
 * 2. handleBlur emits stop-editing when not navigating
 * 3. focusInput handles focus correctly
 */

function createMockProps(overrides: Partial<any> = {}): any {
  return {
    modelValue: 'test value',
    cell: {},
    row: {},
    columnDef: {},
    shouldFocus: false,
    isNavigating: false,
    ...overrides,
  }
}

function createMockEmit(): any {
  const emitFn = vi.fn()
  return emitFn
}

describe('useNuGridCellEditor', () => {
  describe('handleKeydown', () => {
    it('should emit stop-editing on Enter key', () => {
      const props = createMockProps()
      const emit = createMockEmit()
      const inputRef = ref(null)

      const { handleKeydown } = useNuGridCellEditor(props, emit, inputRef)

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation')

      handleKeydown(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(stopPropagationSpy).toHaveBeenCalled()
      expect(emit).toHaveBeenCalledWith('stop-editing')
    })

    it('should emit cancel-editing on Escape key', () => {
      const props = createMockProps()
      const emit = createMockEmit()
      const inputRef = ref(null)

      const { handleKeydown } = useNuGridCellEditor(props, emit, inputRef)

      const event = new KeyboardEvent('keydown', { key: 'Escape' })

      handleKeydown(event)

      expect(emit).toHaveBeenCalledWith('cancel-editing')
    })

    it('should emit stop-editing with up direction on ArrowUp key', () => {
      const props = createMockProps()
      const emit = createMockEmit()
      const inputRef = ref(null)

      const { handleKeydown } = useNuGridCellEditor(props, emit, inputRef)

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' })

      handleKeydown(event)

      expect(emit).toHaveBeenCalledWith('update:isNavigating', true)
      expect(emit).toHaveBeenCalledWith('stop-editing', 'up')
    })

    it('should emit stop-editing with down direction on ArrowDown key', () => {
      const props = createMockProps()
      const emit = createMockEmit()
      const inputRef = ref(null)

      const { handleKeydown } = useNuGridCellEditor(props, emit, inputRef)

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })

      handleKeydown(event)

      expect(emit).toHaveBeenCalledWith('update:isNavigating', true)
      expect(emit).toHaveBeenCalledWith('stop-editing', 'down')
    })

    it('should emit stop-editing with next direction on Tab key', () => {
      const props = createMockProps()
      const emit = createMockEmit()
      const inputRef = ref(null)

      const { handleKeydown } = useNuGridCellEditor(props, emit, inputRef)

      const event = new KeyboardEvent('keydown', { key: 'Tab' })

      handleKeydown(event)

      expect(emit).toHaveBeenCalledWith('update:isNavigating', true)
      expect(emit).toHaveBeenCalledWith('stop-editing', 'next')
    })

    it('should emit stop-editing with previous direction on Shift+Tab key', () => {
      const props = createMockProps()
      const emit = createMockEmit()
      const inputRef = ref(null)

      const { handleKeydown } = useNuGridCellEditor(props, emit, inputRef)

      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true })

      handleKeydown(event)

      expect(emit).toHaveBeenCalledWith('update:isNavigating', true)
      expect(emit).toHaveBeenCalledWith('stop-editing', 'previous')
    })

    it('should stop propagation for all keys to prevent focus system interference', () => {
      const props = createMockProps()
      const emit = createMockEmit()
      const inputRef = ref(null)

      const { handleKeydown } = useNuGridCellEditor(props, emit, inputRef)

      const event = new KeyboardEvent('keydown', { key: 'a' })
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation')

      handleKeydown(event)

      expect(stopPropagationSpy).toHaveBeenCalled()
    })
  })

  describe('handleBlur', () => {
    it('should emit stop-editing when not navigating', () => {
      const props = createMockProps({ isNavigating: false })
      const emit = createMockEmit()
      const inputRef = ref(null)

      const { handleBlur } = useNuGridCellEditor(props, emit, inputRef)

      handleBlur()

      expect(emit).toHaveBeenCalledWith('stop-editing')
    })

    it('should not emit stop-editing when navigating', () => {
      const props = createMockProps({ isNavigating: true })
      const emit = createMockEmit()
      const inputRef = ref(null)

      const { handleBlur } = useNuGridCellEditor(props, emit, inputRef)

      handleBlur()

      expect(emit).not.toHaveBeenCalled()
    })
  })

  describe('focusInput', () => {
    it('should return focusInput function', () => {
      const props = createMockProps()
      const emit = createMockEmit()
      const inputRef = ref(null)

      const { focusInput } = useNuGridCellEditor(props, emit, inputRef)

      expect(typeof focusInput).toBe('function')
    })

    it('should call focus on direct ref when available', async () => {
      const props = createMockProps()
      const emit = createMockEmit()
      const mockInput = { focus: vi.fn() }
      const inputRef = ref(mockInput) as Ref<any>

      const { focusInput } = useNuGridCellEditor(props, emit, inputRef)

      focusInput()

      // Wait for nextTick
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockInput.focus).toHaveBeenCalled()
    })

    it('should call focus on nested inputRef when available', async () => {
      const props = createMockProps()
      const emit = createMockEmit()
      const mockNestedInput = { focus: vi.fn() }
      const mockComponent = { inputRef: mockNestedInput }
      const inputRef = ref(mockComponent) as Ref<any>

      const { focusInput } = useNuGridCellEditor(props, emit, inputRef)

      focusInput()

      // Wait for nextTick
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockNestedInput.focus).toHaveBeenCalled()
    })

    it('should use custom focus callback when provided', async () => {
      const props = createMockProps()
      const emit = createMockEmit()
      const inputRef = ref(null)
      const customFocusCallback = vi.fn()

      const { focusInput } = useNuGridCellEditor(props, emit, inputRef, customFocusCallback)

      focusInput()

      // Wait for nextTick
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(customFocusCallback).toHaveBeenCalled()
    })
  })

  describe('return value', () => {
    it('should return all expected functions', () => {
      const props = createMockProps()
      const emit = createMockEmit()
      const inputRef = ref(null)

      const result = useNuGridCellEditor(props, emit, inputRef)

      expect(typeof result.handleKeydown).toBe('function')
      expect(typeof result.handleBlur).toBe('function')
      expect(typeof result.focusInput).toBe('function')
    })
  })
})
