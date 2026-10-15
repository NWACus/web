import { WeatherSummary } from '@/components/forecast/WeatherSummary'
import { mapV2Weather } from '@/services/nac/sources/v2/mappers'
import { weatherSchema } from '@/services/nac/types/forecastSchemas'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import inlineWeather from '../../server/fixtures/inline-weather.json'
import sacWeather from '../../server/fixtures/sac-weather.json'

const sac = mapV2Weather(weatherSchema.parse(sacWeather))
const inline = mapV2Weather(weatherSchema.parse(inlineWeather))

describe('WeatherSummary', () => {
  it('renders a columns/rows weather table', () => {
    render(<WeatherSummary weather={sac} zoneId="1" timezone="America/Los_Angeles" />)
    expect(screen.getByText('Mountain Weather')).toBeInTheDocument()
    // Zone title cell + a row heading from the columns/rows table.
    expect(screen.getByText('Central Sierra Nevada')).toBeInTheDocument()
    expect(screen.getByText('Ridgetop Winds')).toBeInTheDocument()
  })

  it('renders an inline/periods weather table with split-cell values', () => {
    render(<WeatherSummary weather={inline} zoneId="9" timezone="America/Los_Angeles" />)
    expect(screen.getByText('Snowfall')).toBeInTheDocument()
    // Period headers are inline HTML, sanitized and rendered.
    expect(screen.getByText('Today')).toBeInTheDocument()
    // Split-cell labels ("12hr:") appear for the Snowfall row.
    expect(screen.getAllByText(/12hr/).length).toBeGreaterThan(0)
  })

  it('renders nothing when there is no table and no discussion', () => {
    const empty = { ...inline, weather_data: [], weather_discussion: null }
    const { container } = render(
      <WeatherSummary weather={empty} zoneId="9" timezone="America/Los_Angeles" />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows no table when none is for this zone, rather than another zone’s', () => {
    const { container } = render(
      <WeatherSummary weather={sac} zoneId="2" timezone="America/Los_Angeles" />,
    )
    // The discussion still renders under the heading; the Central Sierra table does not.
    expect(screen.getByText('Mountain Weather')).toBeInTheDocument()
    expect(screen.queryByText('Ridgetop Winds')).not.toBeInTheDocument()
    expect(container.querySelector('table')).toBeNull()
  })

  it('renders nothing when no table is for this zone and there is no discussion', () => {
    const tableOnly = { ...sac, weather_discussion: null }
    const { container } = render(
      <WeatherSummary weather={tableOnly} zoneId="2" timezone="America/Los_Angeles" />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
