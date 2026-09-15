/**
 * Browser APIs jsdom does not implement, stubbed inertly for every client test.
 *
 * The forecast and gallery lightboxes pull in embla-carousel and react-zoom-pan-pinch, which
 * construct observers and read `matchMedia` on mount. Without these a component test fails on the
 * environment rather than on the component.
 */
class NoopObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds: number[] = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

global.ResizeObserver = NoopObserver
global.IntersectionObserver = NoopObserver

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
})
