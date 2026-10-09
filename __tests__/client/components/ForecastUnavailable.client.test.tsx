import { ForecastUnavailable } from '@/components/forecast/ForecastUnavailable'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

function expectWayOnLinks() {
  expect(screen.getByRole('link', { name: 'Current Forecast' })).toHaveAttribute(
    'href',
    '/forecasts/avalanche',
  )
  expect(screen.getByRole('link', { name: 'Forecast Archive' })).toHaveAttribute(
    'href',
    '/forecasts/avalanche/archive',
  )
}

describe('ForecastUnavailable', () => {
  it("says the product doesn't exist when nothing is published", () => {
    render(<ForecastUnavailable reason="none" />)

    expect(
      screen.getByRole('heading', { name: "The requested product doesn't exist" }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Unable to load/)).not.toBeInTheDocument()
    expectWayOnLinks()
  })

  it('keeps the outage wording for a failed read, with the same links', () => {
    render(<ForecastUnavailable reason="failed" />)

    expect(
      screen.getByText('Unable to load forecast data. Please try again later.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/doesn't exist/)).not.toBeInTheDocument()
    expectWayOnLinks()
  })
})
