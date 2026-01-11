import { vi } from 'vitest'

// Mock ResizeObserver as a proper class
class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  constructor(_callback: ResizeObserverCallback) {
    // Store callback if needed for testing
  }
}
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

// Mock IntersectionObserver as a proper class
class IntersectionObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  root = null
  rootMargin = ''
  thresholds = []
  takeRecords = vi.fn().mockReturnValue([])
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    // Store callback if needed for testing
  }
}
globalThis.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
