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
    render(
      <WeatherSummary
        weather={sac}
        zoneName="Central Sierra Nevada"
        timezone="America/Los_Angeles"
      />,
    )
    expect(screen.getByText('Weather Summary')).toBeInTheDocument()
    // Zone title cell + a row heading from the columns/rows table.
    expect(screen.getByText('Central Sierra Nevada')).toBeInTheDocument()
    expect(screen.getByText('Ridgetop Winds')).toBeInTheDocument()
  })

  it('renders an inline/periods weather table with split-cell values', () => {
    render(<WeatherSummary weather={inline} zoneName="Test Zone" timezone="America/Los_Angeles" />)
    expect(screen.getByText('Snowfall')).toBeInTheDocument()
    // Period headers are inline HTML, sanitized and rendered.
    expect(screen.getByText('Today')).toBeInTheDocument()
    // Split-cell labels ("12hr:") appear for the Snowfall row.
    expect(screen.getAllByText(/12hr/).length).toBeGreaterThan(0)
  })

  it('renders nothing when there is no table and no discussion', () => {
    const empty = { ...inline, weather_data: [], weather_discussion: null }
    const { container } = render(
      <WeatherSummary weather={empty} zoneName="Test Zone" timezone="America/Los_Angeles" />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
