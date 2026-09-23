import { Overall } from '@/components/weather/nwac/Overall'
import { ZoneSummary } from '@/components/weather/nwac/ZoneSummary'
import { mapV3NwacWeatherForecastDay } from '@/services/nac/sources/v3/nwacWeatherMappers'
import { nwacWeatherForecastsResponseSchema } from '@/services/nac/types/nwacWeatherSchemas'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'
import fixture from '../../server/fixtures/nwac-weather-forecasts.json'

const day = mapV3NwacWeatherForecastDay(nwacWeatherForecastsResponseSchema.parse(fixture))
if (!day) throw new Error('fixture should map to a forecast day')
const [afternoon, morning] = day.issuances

describe('Overall', () => {
  it('renders one table per variable, stations and zones down the rows', () => {
    render(<Overall issuance={afternoon} />)
    for (const title of [
      'Snow (in)',
      "5000' Temperatures (°F)",
      'Snow Level (ft)',
      'Extended Snow Level (ft)',
      'Ridgeline Winds (mph)',
      'Sensible Weather',
    ]) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    }
    expect(screen.getByText('Hurricane Ridge')).toBeInTheDocument()
    expect(screen.getAllByText('Olympics').length).toBeGreaterThan(0)
    // 53 / 47 °F for Olympics on Night 1, as entered.
    const temps = screen.getByRole('region', { name: "5000' Temperatures (°F)" })
    const olympics = within(temps).getByRole('rowheader', { name: 'Olympics' }).closest('tr')
    expect(olympics).toHaveTextContent('53 / 47')
  })

  it('leads with sensible weather and links each zone to its forecast page', () => {
    render(
      <Overall
        issuance={afternoon}
        zonePaths={{ 1645: '/forecasts/avalanche/olympics#mountain-weather' }}
      />,
    )
    const headings = screen.getAllByRole('heading').map((h) => h.textContent)
    expect(headings.indexOf('Sensible Weather')).toBeLessThan(headings.indexOf('Snow Level (ft)'))
    expect(screen.getByRole('link', { name: 'Olympics' })).toHaveAttribute(
      'href',
      '/forecasts/avalanche/olympics#mountain-weather',
    )
    expect(screen.getByRole('navigation', { name: 'Forecast sections' })).toBeInTheDocument()
  })

  it('groups snow stations under their zones', () => {
    render(<Overall issuance={afternoon} />)
    const snow = screen.getByRole('region', { name: 'Snow (in)' })
    expect(within(snow).getByRole('columnheader', { name: 'Olympics' })).toBeInTheDocument()
    expect(within(snow).getByRole('rowheader', { name: 'Hurricane Ridge' })).toBeInTheDocument()
  })

  it('has no extended table on a morning issuance', () => {
    render(<Overall issuance={morning} />)
    expect(screen.queryByRole('heading', { name: 'Extended Snow Level (ft)' })).toBeNull()
  })
})

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
