import { ValidityBanner } from '@/components/forecast/ValidityBanner'
import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'

const BASE = '/forecasts/avalanche/west-slopes-north'

describe('ValidityBanner', () => {
  it('shows the archived-product notice with a link to the most recent forecast', () => {
    const { container } = render(
      <ValidityBanner
        forecast={{ expires_time: null }}
        selectedDate="2026-01-09"
        basePath={BASE}
      />,
    )
    expect(container.textContent).toMatch(/this is an archived product/i)
    expect(screen.getByRole('link', { name: /most recent forecast/i })).toHaveAttribute(
      'href',
      BASE,
    )
  })

  it('prefers the archived notice over the expired one, matching the legacy banner', () => {
    // An archived product is always past its expiry; legacy's v-if/v-else-if never labels it
    // expired, and neither do we.
    const { container } = render(
      <ValidityBanner
        forecast={{ expires_time: '2020-01-02T00:00:00+00:00' }}
        selectedDate="2020-01-01"
        basePath={BASE}
      />,
    )
    expect(container.textContent).toMatch(/this is an archived product/i)
    expect(container.textContent).not.toMatch(/expired/i)
  })

  it('warns when a live forecast has expired', () => {
    const { container } = render(
      <ValidityBanner
        forecast={{ expires_time: '2020-01-02T00:00:00+00:00' }}
        selectedDate={null}
        basePath={BASE}
      />,
    )
    expect(container.textContent).toMatch(/this product is expired/i)
  })

  it('renders nothing for a current, unexpired live forecast', () => {
    const { container } = render(
      <ValidityBanner
        forecast={{ expires_time: '2099-01-02T00:00:00+00:00' }}
        selectedDate={null}
        basePath={BASE}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing for a forecast with no expiry', () => {
    const { container } = render(
      <ValidityBanner forecast={{ expires_time: null }} selectedDate={null} basePath={BASE} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  describe('when the expiry instant passes with the page open', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('shows the expired notice on its own, with no reload', async () => {
      // A forecast can lapse with no replacement published, in which case the freshness check
      // correctly reports no change and this banner is the viewer's only signal.
      const expiresTime = new Date(Date.now() + 60_000).toISOString()
      const { container } = render(
        <ValidityBanner
          forecast={{ expires_time: expiresTime }}
          selectedDate={null}
          basePath={BASE}
        />,
      )
      expect(container).toBeEmptyDOMElement()

      await act(async () => {
        jest.advanceTimersByTime(60_001)
      })

      expect(container.textContent).toMatch(/this product is expired/i)
    })
  })
})
