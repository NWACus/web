import { ValidityBanner } from '@/components/forecast/ValidityBanner'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

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
})

// What happens as the clock crosses the expiry instant belongs to `ProductExpiry`, which this
// component now delegates to and which has its own suite. What is asserted here is the one
// decision this component still owns: archived, or hand it to expiry.
