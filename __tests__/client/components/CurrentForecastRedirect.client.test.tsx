const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace }) }))

import { CurrentForecastRedirect } from '@/components/forecast/CurrentForecastRedirect.client'
import { render, waitFor } from '@testing-library/react'

const ENDPOINT = '/api/snfac/forecast-current-date/banner-summit'
const LIVE = '/forecasts/avalanche/banner-summit'

const originalFetch = global.fetch
afterEach(() => {
  global.fetch = originalFetch
})

function answer(body: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({ ok, json: async () => body })
}

function renderRedirect(enabled = true) {
  render(
    <CurrentForecastRedirect
      enabled={enabled}
      endpoint={ENDPOINT}
      date="2026-04-05"
      liveHref={LIVE}
    />,
  )
}

describe('CurrentForecastRedirect', () => {
  it('opens the live page when this date is the live product’s', async () => {
    answer({ date: '2026-04-05' })
    renderRedirect()

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(LIVE))
    expect(global.fetch).toHaveBeenCalledWith(ENDPOINT)
  })

  it.each([
    // Yesterday stops redirecting once today's product is live.
    ['a newer product is live', { date: '2026-04-06' }, true],
    ['the answer cannot be had', {}, false],
  ])('stays when %s', async (_label, body, ok) => {
    answer(body, ok)
    renderRedirect()

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('asks nothing on a page whose date cannot be the live one', () => {
    answer({ date: '2026-04-05' })
    renderRedirect(false)

    expect(global.fetch).not.toHaveBeenCalled()
  })
})
