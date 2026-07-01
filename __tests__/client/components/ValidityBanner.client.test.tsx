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
})
