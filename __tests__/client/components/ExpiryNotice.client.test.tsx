import { ExpiryNotice } from '@/components/forecast/ExpiryNotice.client'
import '@testing-library/jest-dom'
import { act, render } from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'

let visibility: DocumentVisibilityState = 'visible'

async function setVisibility(next: DocumentVisibilityState) {
  visibility = next
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

/** An expiry instant `ms` from now, as the server would send it. */
function expiryIn(ms: number) {
  return new Date(Date.now() + ms).toISOString()
}

/** Mount as the server rendered it — not yet expired — and let the effect settle. */
async function mount(expiresTime: string) {
  const view = render(<ExpiryNotice expiresTime={expiresTime} initiallyExpired={false} />)
  await act(async () => {})
  return view
}

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms)
  })
}

beforeEach(() => {
  jest.useFakeTimers()
  visibility = 'visible'
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => visibility,
  })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('ExpiryNotice', () => {
  it('hydrates over the server’s answer without a mismatch', () => {
    // Reading the clock during the client's first render would disagree with the server's value.
    // The server here says "not expired" while the instant has in fact already passed, which is
    // exactly the case ISR produces — the first client paint must still match, and only then flip.
    const alreadyPast = new Date(Date.now() - 60_000).toISOString()
    const element = <ExpiryNotice expiresTime={alreadyPast} initiallyExpired={false} />

    const container = document.createElement('div')
    container.innerHTML = renderToString(element)
    expect(container.innerHTML).toBe('')

    const errors = jest.spyOn(console, 'error').mockImplementation(() => {})
    let root: ReturnType<typeof hydrateRoot> | undefined
    act(() => {
      root = hydrateRoot(container, element)
    })

    expect(errors).not.toHaveBeenCalled()
    // ...and the effect then corrects the server's stale answer.
    expect(container.textContent).toMatch(/this product is expired/i)

    act(() => root?.unmount())
    errors.mockRestore()
  })

  it('corrects HTML that was rendered before the instant and served after it', async () => {
    // ISR bakes the server's answer in up to the revalidate window before the viewer loads it.
    const alreadyPast = new Date(Date.now() - 60_000).toISOString()

    const { container } = await mount(alreadyPast)

    expect(container.textContent).toMatch(/this product is expired/i)
  })

  it('flips when the expiry instant passes with the page open', async () => {
    const { container } = await mount(expiryIn(60_000))
    expect(container.innerHTML).toBe('')

    await advance(60_001)

    expect(container.textContent).toMatch(/this product is expired/i)
  })

  it('announces itself politely, since it arrives on a page that has already been read', async () => {
    // A product that lapses with no replacement produces no freshness change, so this notice is
    // the viewer's only signal — inserted with no live region it would be announced to nobody.
    // Polite rather than assertive: it can land mid-sentence on a page someone is reading, and an
    // expiry is a product going old, not a hazard going up. The WarningBanner bulletins are the
    // ones worth interrupting for.
    const { getByRole, queryByRole } = await mount(expiryIn(60_000))

    await advance(60_001)

    expect(getByRole('status')).toHaveTextContent(/this product is expired/i)
    expect(queryByRole('alert')).toBeNull()
  })

  it('re-evaluates on return to visibility, since background timers are throttled', async () => {
    const { container } = await mount(expiryIn(60_000))

    await setVisibility('hidden')
    // The clock moves on while the tab is backgrounded, without timers being allowed to run.
    jest.setSystemTime(new Date(Date.now() + 120_000))
    await setVisibility('visible')

    expect(container.textContent).toMatch(/this product is expired/i)
  })

  it('stays put for a far-future expiry rather than overflowing setTimeout', async () => {
    // A delay past 2^31-1 ms wraps and fires immediately, which would claim a live product had
    // expired. Nothing is scheduled instead.
    const { container } = await mount(expiryIn(2 ** 31 + 60_000))

    await advance(60_000)

    expect(container.innerHTML).toBe('')
  })

  it('clears when a replacement forecast arrives, rather than latching', async () => {
    // The daily case on a tab that stays open: last night's product lapses, this morning's is
    // published, RevalidateOnView refreshes the page — and the notice must not sit over the new
    // forecast. A refresh reconciles this component in place, so nothing remounts it.
    const { container, rerender } = await mount(expiryIn(60_000))
    await advance(60_001)
    expect(container.textContent).toMatch(/this product is expired/i)

    const replacement = expiryIn(12 * 60 * 60_000)
    await act(async () => {
      rerender(<ExpiryNotice expiresTime={replacement} initiallyExpired={false} />)
    })

    expect(container.innerHTML).toBe('')
  })

  it('re-arms its timer against the replacement’s expiry', async () => {
    const { container, rerender } = await mount(expiryIn(60_000))
    await advance(60_001)

    const replacement = expiryIn(60_000)
    await act(async () => {
      rerender(<ExpiryNotice expiresTime={replacement} initiallyExpired={false} />)
    })
    expect(container.innerHTML).toBe('')

    await advance(60_001)

    expect(container.textContent).toMatch(/this product is expired/i)
  })

  it('renders the notice when the server already decided it was expired', () => {
    const { container } = render(
      <ExpiryNotice expiresTime={new Date(Date.now() - 60_000).toISOString()} initiallyExpired />,
    )

    expect(container.textContent).toMatch(/this product is expired/i)
  })

  it('does nothing with an unparseable expiry', async () => {
    const { container } = await mount('not-a-date')

    await advance(60_000)

    expect(container.innerHTML).toBe('')
  })
})
