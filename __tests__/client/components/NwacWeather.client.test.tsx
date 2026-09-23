import { ZoneSummary } from '@/components/weather/nwac/ZoneSummary'
import { mapV3NwacWeatherForecastDay } from '@/services/nac/sources/v3/nwacWeatherMappers'
import { nwacWeatherForecastsResponseSchema } from '@/services/nac/types/nwacWeatherSchemas'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'
import fixture from '../../server/fixtures/nwac-weather-forecasts.json'

const day = mapV3NwacWeatherForecastDay(nwacWeatherForecastsResponseSchema.parse(fixture))
if (!day) throw new Error('fixture should map to a forecast day')

describe('ZoneSummary', () => {
  it('shows the newest issuance and switches to the other', () => {
    render(<ZoneSummary day={day} avalancheZoneId={1645} timezone="America/Los_Angeles" />)
    expect(screen.getByText('Mountain Weather')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Full Mountain Weather Forecast/ })).toHaveAttribute(
      'href',
      '/weather/forecast',
    )

    const afternoonTab = screen.getByRole('radio', { name: /Afternoon/ })
    const morningTab = screen.getByRole('radio', { name: /Morning/ })
    expect(afternoonTab).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('region', { name: 'Afternoon Forecast' })).toBeVisible()
    expect(screen.queryByRole('region', { name: 'Morning Forecast' })).toBeNull()
    // Extended snow levels come with the afternoon issuance only.
    expect(screen.getByRole('heading', { name: 'Extended Snow Level (ft)' })).toBeInTheDocument()

    fireEvent.click(morningTab)
    expect(morningTab).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('region', { name: 'Morning Forecast' })).toBeVisible()
    expect(screen.queryByRole('region', { name: 'Afternoon Forecast' })).toBeNull()
  })

  it('leads with the zone’s sensible weather and tabulates its periods', () => {
    render(<ZoneSummary day={day} avalancheZoneId={1645} timezone="America/Los_Angeles" />)
    const panel = screen.getByRole('region', { name: 'Afternoon Forecast' })
    expect(within(panel).getByRole('heading', { name: 'Today / Tonight' })).toBeInTheDocument()
    expect(within(panel).getByRole('rowheader', { name: /Snow level/ })).toBeInTheDocument()
    expect(within(panel).getByRole('rowheader', { name: /Ridge wind/ })).toBeInTheDocument()
    // Narrowed: no other zone's name appears.
    expect(screen.queryByText('Stevens Pass')).toBeNull()
  })

  it('renders nothing for a zone the forecast does not cover', () => {
    const { container } = render(
      <ZoneSummary day={day} avalancheZoneId={999999} timezone="America/Los_Angeles" />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
