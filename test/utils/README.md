# Router Test Utilities

Comprehensive test utilities for testing NuGrid interaction router functionality.

## Quick Start

```typescript
import { createTestRouter, createMockRow, createMockCell } from './utils/router-test-utils'

const { router, simulateCellClick, getRegisteredHandlers } = createTestRouter()

// Register a handler
router.registerCellClickHandler({
  id: 'my-feature',
  priority: 10,
  handle: () => ({ handled: true })
})

// Simulate interaction
const row = createMockRow({ id: 1, name: 'Test' })
const cell = createMockCell(row, 'name', 'Test')
simulateCellClick(row, cell)

// Verify behavior
expect(getRegisteredHandlers().cellClick).toHaveLength(1)
```

## API Reference

### `createTestRouter<T>(options?)`

Creates a test router instance with spies and utilities.

**Options:**
- `debug?: boolean` - Enable debug mode for console logging

**Returns:** `RouterTestUtils<T>`

```typescript
const { router, dispatchSpy, simulateCellClick, ... } = createTestRouter({ debug: true })
```

### RouterTestUtils Methods

#### `router`
The actual interaction router instance to test against.

#### `dispatchSpy`
Vitest spy that tracks all dispatch calls. Useful for verifying events were routed.

```typescript
expect(dispatchSpy).toHaveBeenCalledWith('cellClick', expect.any(Object))
```

#### `getRegisteredHandlers()`
Returns all currently registered handlers by type.

```typescript
const handlers = getRegisteredHandlers()
console.log(handlers.cellClick) // [{ id: 'handler-1', priority: 10 }, ...]
```

#### `simulateCellClick(row, cell, cellIndex?, event?)`
Simulates a cell click event.

```typescript
const row = createMockRow({ id: 1 })
const cell = createMockCell(row, 'name', 'Test')
simulateCellClick(row, cell)

// With custom event
const customEvent = new MouseEvent('click', { cancelable: true })
simulateCellClick(row, cell, 0, customEvent)
```

#### `simulatePointerDown(event?)`
Simulates a global pointer down event.

```typescript
simulatePointerDown()
simulatePointerDown({ clientX: 100, clientY: 200 })
```

#### `simulateHover(target, type, event?)`
Simulates a hover event.

```typescript
const element = document.createElement('div')
simulateHover(element, 'enter')
simulateHover(element, 'move')
simulateHover(element, 'leave')
```

#### `getLastDispatch()`
Returns the last dispatched event.

```typescript
const last = getLastDispatch()
console.log(last.type) // 'cellClick' | 'pointerDown' | 'hover'
console.log(last.context) // Event context
```

#### `clearDispatchHistory()`
Clears all dispatch history and spy calls.

```typescript
clearDispatchHistory()
expect(dispatchSpy).not.toHaveBeenCalled()
```

### Helper Functions

#### `createMockRow<T>(data, options?)`
Creates a mock TanStack Table row for testing.

```typescript
const row = createMockRow(
  { id: 1, name: 'John' },
  { id: 'row-1', index: 0 }
)
```

#### `createMockCell<T>(row, columnId, value?)`
Creates a mock TanStack Table cell for testing.

```typescript
const cell = createMockCell(row, 'name', 'John')
```

#### `waitForAnimationFrame()`
Waits for the next animation frame (useful for RAF-throttled events).

```typescript
await waitForAnimationFrame()
```

#### `waitForAnimationFrames(count)`
Waits for multiple animation frames.

```typescript
await waitForAnimationFrames(3)
```

## Common Testing Patterns

### Testing Handler Registration

```typescript
it('should register handler', () => {
  const { router, getRegisteredHandlers } = createTestRouter()

  const unregister = router.registerCellClickHandler({
    id: 'test',
    priority: 10,
    handle: () => ({})
  })

  expect(getRegisteredHandlers().cellClick).toHaveLength(1)

  unregister()

  expect(getRegisteredHandlers().cellClick).toHaveLength(0)
})
```

### Testing Priority Order

```typescript
it('should execute in priority order', () => {
  const { router, simulateCellClick } = createTestRouter()
  const order: string[] = []

  router.registerCellClickHandler({
    id: 'low',
    priority: 50,
    handle: () => { order.push('low'); return {} }
  })

  router.registerCellClickHandler({
    id: 'high',
    priority: 10,
    handle: () => { order.push('high'); return {} }
  })

  simulateCellClick(createMockRow({}), createMockCell(row, 'id'))

  expect(order).toEqual(['high', 'low'])
})
```

### Testing Event Stoppage

```typescript
it('should stop on handled: true', () => {
  const { router, simulateCellClick } = createTestRouter()
  const secondSpy = vi.fn()

  router.registerCellClickHandler({
    id: 'first',
    priority: 10,
    handle: () => ({ handled: true })
  })

  router.registerCellClickHandler({
    id: 'second',
    priority: 20,
    handle: secondSpy
  })

  simulateCellClick(createMockRow({}), createMockCell(row, 'id'))

  expect(secondSpy).not.toHaveBeenCalled()
})
```

### Testing Conditional Handlers

```typescript
it('should skip when predicate fails', () => {
  const { router, simulateCellClick } = createTestRouter()
  const handleSpy = vi.fn()

  router.registerCellClickHandler({
    id: 'conditional',
    priority: 10,
    when: ({ row }) => row.original.enabled === true,
    handle: handleSpy
  })

  const disabledRow = createMockRow({ enabled: false })
  simulateCellClick(disabledRow, createMockCell(disabledRow, 'id'))

  expect(handleSpy).not.toHaveBeenCalled()
})
```

### Testing Debug Mode

```typescript
it('should log in debug mode', () => {
  const { router, simulateCellClick } = createTestRouter({ debug: true })
  const consoleSpy = vi.spyOn(console, 'log')

  router.registerCellClickHandler({
    id: 'debug',
    priority: 10,
    handle: () => ({ handled: true })
  })

  simulateCellClick(createMockRow({}), createMockCell(row, 'id'))

  expect(consoleSpy).toHaveBeenCalledWith('[Router] Executing: debug')
  expect(consoleSpy).toHaveBeenCalledWith('[Router] Claimed by: debug')

  consoleSpy.mockRestore()
})
```

## Full Example

See [router-example.test.ts](../router-example.test.ts) for comprehensive examples of all testing patterns.
