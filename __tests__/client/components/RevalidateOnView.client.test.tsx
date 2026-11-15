import { RevalidateOnView } from '@/components/freshness/RevalidateOnView.client'
import '@testing-library/jest-dom'
import { act, render } from '@testing-library/react'

const mockRefresh = jest.fn()
// One stable object, as the real `useRouter` returns — a fresh one per render would churn the
// effect's dependencies and hide whether the component itself re-arms correctly.
const mockRouter = { refresh: () => mockRefresh() }
jest.mock('next/navigation', () => ({ useRouter: () => mockRouter }))

const ENDPOINT = '/api/nwac/forecast-freshness/west-slopes-north/' + 'a'.repeat(40)
/** Two more zones, as the all-zones grid would supply alongside the first. */
const NEIGHBOURS = ['b', 'c'].map((c) => `/api/nwac/forecast-freshness/zone-${c}/` + c.repeat(40))
const GRID = [ENDPOINT, ...NEIGHBOURS]
const RECHECK_INTERVAL_MS = 2 * 60 * 1000
const MIN_CHECK_INTERVAL_MS = 30 * 1000
const FOLLOW_UP_MS = 60 * 1000
const CONVERGE_RETRY_MS = [5 * 1000, 15 * 1000, 30 * 1000]

/** Advance the fake clock and let whatever check it fired settle. */
async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms)
  })
  await settle()
}

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

/**
 * Flip the tab's visibility and dispatch the event the browser would, having first let enough of
 * the clock pass that the minimum-gap floor is not what is under test. Pass `0` to flip inside it.
 */
async function setVisibility(next: DocumentVisibilityState, afterMs = MIN_CHECK_INTERVAL_MS) {
  if (afterMs > 0) {
    await act(async () => {
      jest.advanceTimersByTime(afterMs)
    })
  }
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

    render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch.mock.calls[0][0]).toBe(ENDPOINT)
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('leaves the page alone when nothing has changed', async () => {
    render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()

    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('leaves the page alone on an indeterminate answer', async () => {
    // Upstream could not be established — that is not the same as the product going away.
    mockFetch.mockReturnValue(answer({ changed: false, reason: 'indeterminate' }))

    render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()

    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('leaves the page alone when the endpoint errors', async () => {
    mockFetch.mockReturnValue(Promise.reject(new Error('offline')))

    render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()

    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('leaves the page alone when the endpoint rejects the request', async () => {
    // A 400 or 404 — a stale bundle asking an old-shaped URL, say — is not a change.
    mockFetch.mockReturnValue(answer({ error: 'Malformed fingerprint' }, false))

    render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()

    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('still checks on mount when the tab starts hidden (the check is never gated)', async () => {
    visibility = 'hidden'

    render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('re-checks when the tab becomes visible again', async () => {
    render(<RevalidateOnView endpoints={[ENDPOINT]} />)
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
    render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()

    await act(async () => {
      jest.advanceTimersByTime(RECHECK_INTERVAL_MS * 3)
    })
    await settle()

    expect(mockFetch).toHaveBeenCalledTimes(5) // mount + the follow-up + three ticks
  })

  it('asks once more after the detection budget, so a just-published product is not missed', async () => {
    // The mount check can be answered from inside the 60s budget (edge + fresh-fetch caches), so a
    // page opened right after a publish hears "you're current". Without the follow-up it would not
    // ask again until the two-minute interval.
    render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()
    expect(mockRefresh).not.toHaveBeenCalled()

    mockFetch.mockReturnValue(answer({ changed: true, etag: 'b'.repeat(40) }))
    await advance(FOLLOW_UP_MS - 1)
    expect(mockFetch).toHaveBeenCalledTimes(1)

    await advance(1)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('skips the follow-up in a hidden tab (returning to visibility checks instead)', async () => {
    visibility = 'hidden'
    render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()

    await advance(FOLLOW_UP_MS)

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('asks again within seconds when a refresh does not converge', async () => {
    // `router.refresh()` on a stale ISR entry can be served the stale render while the page
    // regenerates behind it. Same fingerprint, so nothing re-arms — the retry is what picks up the
    // regenerated page instead of the interval.
    mockFetch.mockReturnValue(answer({ changed: true, etag: 'b'.repeat(40) }))
    render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()
    expect(mockRefresh).toHaveBeenCalledTimes(1)

    await advance(CONVERGE_RETRY_MS[0] - 1)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    await advance(1)

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockRefresh).toHaveBeenCalledTimes(2)
  })

  it('stops retrying a page that cannot converge, and leaves it to the interval', async () => {
    // Every "changed" answer reaches origin, so the retries are bounded: a page that never renders
    // what its endpoint reports must not become a steady stream of origin requests.
    mockFetch.mockReturnValue(answer({ changed: true, etag: 'b'.repeat(40) }))
    render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()

    for (const wait of CONVERGE_RETRY_MS) await advance(wait)
    const total = CONVERGE_RETRY_MS.reduce((sum, wait) => sum + wait, 0)
    expect(mockFetch).toHaveBeenCalledTimes(1 + CONVERGE_RETRY_MS.length)

    // Nothing more until the follow-up, which is the next timer due.
    await advance(FOLLOW_UP_MS - total - 1)
    expect(mockFetch).toHaveBeenCalledTimes(1 + CONVERGE_RETRY_MS.length)
  })

  it('drops the retry once the refresh converges', async () => {
    mockFetch.mockReturnValue(answer({ changed: true, etag: 'd'.repeat(40) }))
    const { rerender } = render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()

    // The refresh re-rendered the page with the current product: a new address, and it is current.
    mockFetch.mockReturnValue(answer({ changed: false }))
    const next = '/api/nwac/forecast-freshness/west-slopes-north/' + 'd'.repeat(40)
    rerender(<RevalidateOnView endpoints={[next]} />)
    await settle()
    expect(mockFetch).toHaveBeenCalledTimes(2)

    await advance(CONVERGE_RETRY_MS[0])

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('gives a later change its own full set of retries', async () => {
    // The budget is per change, not per page lifetime: an unchanged answer resets it.
    mockFetch.mockReturnValue(answer({ changed: true, etag: 'b'.repeat(40) }))
    render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()
    for (const wait of CONVERGE_RETRY_MS) await advance(wait)

    mockFetch.mockReturnValue(answer({ changed: false }))
    await advance(FOLLOW_UP_MS) // past the follow-up, which hears "unchanged"
    const before = mockFetch.mock.calls.length

    mockFetch.mockReturnValue(answer({ changed: true, etag: 'c'.repeat(40) }))
    await advance(RECHECK_INTERVAL_MS) // the next interval tick hears the new change
    const afterTick = mockFetch.mock.calls.length
    expect(afterTick).toBeGreaterThan(before)

    await advance(CONVERGE_RETRY_MS[0])
    expect(mockFetch.mock.calls.length).toBeGreaterThan(afterTick)
  })

  it('stops the interval while hidden and does not accumulate timers across flips', async () => {
    render(<RevalidateOnView endpoints={[ENDPOINT]} />)
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

  it('does not re-check on a visibility flip inside the minimum gap', async () => {
    // Returning to visibility is the one trigger a viewer fires at will, and on the all-zones grid
    // each one costs a request per zone. Inside the unchanged answer's edge TTL there is nothing
    // newer to be told, so suppressing it costs no freshness.
    render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()
    expect(mockFetch).toHaveBeenCalledTimes(1)

    for (let i = 0; i < 5; i++) {
      await setVisibility('hidden', 0)
      await setVisibility('visible', 0)
    }

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('re-checks on the next flip once the minimum gap has passed', async () => {
    render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()

    await setVisibility('hidden', 0)
    await setVisibility('visible', MIN_CHECK_INTERVAL_MS)

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('checks on mount however recently the last one ran', async () => {
    // A remount is a new page: the floor is per-armed-effect, and the mount check is unconditional.
    const { unmount } = render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()
    unmount()

    render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('stops checking once unmounted', async () => {
    const { unmount } = render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()

    unmount()
    await act(async () => {
      jest.advanceTimersByTime(RECHECK_INTERVAL_MS * 2)
    })
    await settle()

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('aborts an in-flight check on unmount', async () => {
    // Navigating away mid-check must not land a router.refresh() on the page the viewer moved to.
    let signal: AbortSignal | undefined
    mockFetch.mockImplementation((_url: string, init: RequestInit) => {
      signal = init.signal ?? undefined
      return new Promise(() => {}) // never settles, so the abort is the only way out
    })

    const { unmount } = render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()
    expect(signal?.aborted).toBe(false)

    unmount()

    expect(signal?.aborted).toBe(true)
  })

  it('re-arms against the new endpoint after the page refreshes', async () => {
    const { rerender } = render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()

    // A refresh re-renders the page with the current product, so the URL it asks about changes.
    const next = '/api/nwac/forecast-freshness/west-slopes-north/' + 'd'.repeat(40)
    rerender(<RevalidateOnView endpoints={[next]} />)
    await settle()

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch.mock.calls[1][0]).toBe(next)
  })
  it('asks every endpoint a page gave it', async () => {
    // The all-zones grid shows one product pair per zone and asks the same per-zone addresses the
    // individual forecast pages do.
    render(<RevalidateOnView endpoints={GRID} />)
    await settle()

    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(mockFetch.mock.calls.map((call) => call[0])).toEqual(GRID)
  })

  it('refreshes once however many products moved', async () => {
    // A daily publish moves every zone at once; one refresh re-renders the whole page.
    mockFetch.mockReturnValue(answer({ changed: true, etag: 'e'.repeat(40) }))

    render(<RevalidateOnView endpoints={GRID} />)
    await settle()

    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('still hears the one changed product when its neighbours fail', async () => {
    const [survivor] = NEIGHBOURS
    mockFetch.mockImplementation((url: string) =>
      url === survivor
        ? answer({ changed: true, etag: 'f'.repeat(40) })
        : Promise.reject(new Error('offline')),
    )

    render(<RevalidateOnView endpoints={GRID} />)
    await settle()

    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('does not re-arm when a re-render produces the same endpoints in a new array', async () => {
    const { rerender } = render(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()

    rerender(<RevalidateOnView endpoints={[ENDPOINT]} />)
    await settle()

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
