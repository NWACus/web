import { RevalidateOnView } from '@/components/freshness/RevalidateOnView.client'
import '@testing-library/jest-dom'
import { act, render } from '@testing-library/react'

const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: () => mockRefresh() }) }))

const ENDPOINT = '/api/nwac/forecast-freshness/west-slopes-north/' + 'a'.repeat(40)
const RECHECK_INTERVAL_MS = 5 * 60 * 1000

let visibility: DocumentVisibilityState = 'visible'
let mockFetch: jest.Mock

/** Let the fetch promise chain settle without advancing timers. */
async function settle() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

function answer(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) })
}

/** Flip the tab's visibility and dispatch the event the browser would. */
async function setVisibility(next: DocumentVisibilityState) {
  visibility = next
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await settle()
}

beforeEach(() => {
  jest.useFakeTimers()
  visibility = 'visible'
  mockRefresh.mockClear()
  mockFetch = jest.fn(() => answer({ changed: false }))
  // defineProperty rather than assignment: jsdom has no fetch to spy on, and the component only
  // ever touches `ok` and `json()`.
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    writable: true,
    value: mockFetch,
  })
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => visibility,
  })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('RevalidateOnView', () => {
  it('checks on mount and refreshes when the product has changed', async () => {
    mockFetch.mockReturnValue(answer({ changed: true, etag: 'b'.repeat(40) }))

    render(<RevalidateOnView endpoint={ENDPOINT} />)
    await settle()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch.mock.calls[0][0]).toBe(ENDPOINT)
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('leaves the page alone when nothing has changed', async () => {
    render(<RevalidateOnView endpoint={ENDPOINT} />)
    await settle()

    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('leaves the page alone on an indeterminate answer', async () => {
    // Upstream could not be established — that is not the same as the product going away.
    mockFetch.mockReturnValue(answer({ changed: false, reason: 'indeterminate' }))

    render(<RevalidateOnView endpoint={ENDPOINT} />)
    await settle()

    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('leaves the page alone when the endpoint errors', async () => {
    mockFetch.mockReturnValue(Promise.reject(new Error('offline')))

    render(<RevalidateOnView endpoint={ENDPOINT} />)
    await settle()

    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('leaves the page alone when the endpoint rejects the request', async () => {
    // A 400 or 404 — a stale bundle asking an old-shaped URL, say — is not a change.
    mockFetch.mockReturnValue(answer({ error: 'Malformed fingerprint' }, false))

    render(<RevalidateOnView endpoint={ENDPOINT} />)
    await settle()

    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('still checks on mount when the tab starts hidden (the check is never gated)', async () => {
    visibility = 'hidden'

    render(<RevalidateOnView endpoint={ENDPOINT} />)
    await settle()

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('re-checks when the tab becomes visible again', async () => {
    render(<RevalidateOnView endpoint={ENDPOINT} />)
    await settle()
    expect(mockFetch).toHaveBeenCalledTimes(1)

    await setVisibility('hidden')
    expect(mockFetch).toHaveBeenCalledTimes(1)

    mockFetch.mockReturnValue(answer({ changed: true, etag: 'c'.repeat(40) }))
    await setVisibility('visible')

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('re-checks on a slow interval while visible', async () => {
    render(<RevalidateOnView endpoint={ENDPOINT} />)
    await settle()

    await act(async () => {
      jest.advanceTimersByTime(RECHECK_INTERVAL_MS * 3)
    })
    await settle()

    expect(mockFetch).toHaveBeenCalledTimes(4) // mount + three ticks
  })

  it('stops the interval while hidden and does not accumulate timers across flips', async () => {
    render(<RevalidateOnView endpoint={ENDPOINT} />)
    await settle()

    await setVisibility('hidden')
    await act(async () => {
      jest.advanceTimersByTime(RECHECK_INTERVAL_MS * 3)
    })
    await settle()
    expect(mockFetch).toHaveBeenCalledTimes(1) // mount only; nothing ticks while hidden

    // Three round trips through visibility must leave exactly one live timer, not three.
    for (let i = 0; i < 3; i++) {
      await setVisibility('visible')
      await setVisibility('hidden')
    }
    await setVisibility('visible')
    const afterFlips = mockFetch.mock.calls.length

    await act(async () => {
      jest.advanceTimersByTime(RECHECK_INTERVAL_MS)
    })
    await settle()

    expect(mockFetch).toHaveBeenCalledTimes(afterFlips + 1)
  })

  it('stops checking once unmounted', async () => {
    const { unmount } = render(<RevalidateOnView endpoint={ENDPOINT} />)
    await settle()

    unmount()
    await act(async () => {
      jest.advanceTimersByTime(RECHECK_INTERVAL_MS * 2)
    })
    await settle()

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('re-arms against the new endpoint after the page refreshes', async () => {
    const { rerender } = render(<RevalidateOnView endpoint={ENDPOINT} />)
    await settle()

    // A refresh re-renders the page with the current product, so the URL it asks about changes.
    const next = '/api/nwac/forecast-freshness/west-slopes-north/' + 'd'.repeat(40)
    rerender(<RevalidateOnView endpoint={next} />)
    await settle()

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch.mock.calls[1][0]).toBe(next)
  })
})
