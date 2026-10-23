const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace }) }))

import { LegacyWidgetHashHandOverClient } from '@/components/forecast/LegacyWidgetHashHandOver.client'
import { widgetHashTarget, type WidgetHashContext } from '@/components/forecast/legacyWidgetHash'
import { render, waitFor } from '@testing-library/react'

const context: WidgetHashContext = {
  zones: [
    { name: 'Stevens Pass', slug: 'stevens-pass' },
    { name: 'Galena Summit & Eastern Mtns', slug: 'galena-summit-&-eastern-mtns' },
    // A slug from the zone's URL that differs from the widget's name-based one.
    { name: 'Presidential Range', slug: 'presidential' },
  ],
  weatherArchive: true,
}

// Forecast-244
describe('widgetHashTarget', () => {
  it.each([
    ['#/forecast/2/123', { productId: 123, zoneId: '2' }],
    ['#/forecast/2/123/observations', { productId: 123, zoneId: '2' }],
    ['#/all', { address: '/forecasts/avalanche' }],
    ['#/stevens-pass/', { address: '/forecasts/avalanche/stevens-pass' }],
    ['#/stevens-pass/observations', { address: '/forecasts/avalanche/stevens-pass' }],
    ['#/presidential-range/', { address: '/forecasts/avalanche/presidential' }],
    [
      '#/galena-summit-%26-eastern-mtns/',
      { address: '/forecasts/avalanche/galena-summit-&-eastern-mtns' },
    ],
    ['#/archive', { address: '/forecasts/avalanche/archive' }],
    ['#/archive/forecast', { address: '/forecasts/avalanche/archive' }],
    ['#/archive/visual', { address: '/forecasts/avalanche/archive/danger-over-time' }],
    ['#/archive/weather', { address: '/forecasts/avalanche/archive/mountain-weather' }],
    ['#/archive/post', { address: '/forecasts/avalanche/archive' }],
    ['#/weather/456', { address: '/forecasts/avalanche/archive/mountain-weather/456' }],
  ])('hands %s over', (hash, target) => {
    expect(widgetHashTarget(hash, context)).toEqual(target)
  })

  it.each([
    [''],
    ['#mountain-weather'],
    ['#/'],
    ['#/forecast/2'],
    ['#/forecast/2/abc'],
    ['#/weather/abc'],
    ['#/no-such-zone/'],
  ])('leaves %p alone', (hash) => {
    expect(widgetHashTarget(hash, context)).toBeNull()
  })

  it('sends archived weather to the archive where the center has no page for it', () => {
    expect(widgetHashTarget('#/weather/456', { ...context, weatherArchive: false })).toEqual({
      address: '/forecasts/avalanche/archive',
    })
  })
})

describe('LegacyWidgetHashHandOverClient', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    mockReplace.mockReset()
    window.history.replaceState(null, '', '/')
  })

  function renderAt(hash: string) {
    window.history.replaceState(null, '', `/forecasts/avalanche/stevens-pass${hash}`)
    render(<LegacyWidgetHashHandOverClient center="nwac" {...context} />)
  }

  it("opens an archived product's dated page, not the live one", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ address: '/forecasts/avalanche/stevens-pass/2026-01-05' }),
    })

    renderAt('#/forecast/2/123')

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/forecasts/avalanche/stevens-pass/2026-01-05'),
    )
    expect(global.fetch).toHaveBeenCalledWith('/api/nwac/forecast-address?id=123&zone=2')
  })

  it.each([
    ['has no address for it', { ok: true, json: async () => ({ address: null }) }],
    ['cannot answer', { ok: false, json: async () => ({}) }],
  ])('falls back to the archive when the server %s', async (_label, response) => {
    global.fetch = jest.fn().mockResolvedValue(response)

    renderAt('#/forecast/2/123')

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/forecasts/avalanche/archive'))
  })

  it('hands a zone link over without asking the server', async () => {
    global.fetch = jest.fn()

    renderAt('#/presidential-range/')

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/forecasts/avalanche/presidential'),
    )
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('hands over a widget link opened from the same page, which only changes the hash', async () => {
    global.fetch = jest.fn()
    renderAt('')

    window.history.replaceState(null, '', '/forecasts/avalanche#/all')
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/forecasts/avalanche'))
  })

  it('does nothing without a widget hash', async () => {
    global.fetch = jest.fn()

    renderAt('')

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(mockReplace).not.toHaveBeenCalled()
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
