/**
 * Browser APIs jsdom does not implement, stubbed inertly for every client test.
 *
 * The forecast and gallery lightboxes pull in embla-carousel and react-zoom-pan-pinch, which
 * construct observers and read `matchMedia` on mount, and mapbox-gl reads `TextDecoder` while it
 * loads. Without these a component test fails on the environment rather than on the component.
 */
import { TextDecoder, TextEncoder } from 'node:util'

// jsdom leaves Node's text encoders off the global; `Object.assign` because the Node and DOM
// declarations of each are structurally different.
Object.assign(global, { TextDecoder, TextEncoder })

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
