import { NativeWeatherView } from '@/components/forecast/NativeWeatherView'
import { mapV2Weather } from '@/services/nac/sources/v2/mappers'
import { weatherSchema } from '@/services/nac/types/forecastSchemas'
import { AvalancheCenterType } from '@/services/nac/types/schemas'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import inlineWeather from '../../server/fixtures/inline-weather.json'
import sacWeather from '../../server/fixtures/sac-weather.json'

const sac = mapV2Weather(weatherSchema.parse(sacWeather))
const inline = mapV2Weather(weatherSchema.parse(inlineWeather))

const galena = { zone_id: '3', zone_name: 'Galena Summit & Eastern Mtns' }
const banner = { zone_id: '1', zone_name: 'Banner Summit' }

/** SNFAC's shape: one table per zone, carried out of the center's zone order. */
const snfacLike = {
  ...sac,
  weather_data: [
    { ...sac.weather_data[0], ...banner },
    { ...sac.weather_data[0], ...galena },
  ],
}
const snfacZones = [
  { zone_id: '3', rank: 1 },
  { zone_id: '1', rank: 4 },
]

function renderView(weather: typeof sac, zones = snfacZones) {
  return render(
    <NativeWeatherView
      weather={weather}
      zones={zones}
      timezone="America/Los_Angeles"
      centerType={AvalancheCenterType.USFS}
    />,
  )
}

describe('NativeWeatherView', () => {
  it('renders the title, the product’s own metadata, the discussion, and the disclaimer', () => {
    renderView(sac, [])

    expect(screen.getByRole('heading', { level: 1, name: 'Mountain Weather' })).toBeInTheDocument()
    expect(screen.getByText('All Zones')).toBeInTheDocument()
    expect(screen.getByText(/Issued:/)).toBeInTheDocument()
    expect(screen.getByText(sac.author ?? '')).toBeInTheDocument()
    // The weather product carries no expiry, and must not show one.
    expect(screen.queryByText(/Expires:/)).not.toBeInTheDocument()
    expect(screen.getByText(/U\.S\.D\.A\. Forest Service/)).toBeInTheDocument()
  })

  it('renders one table per zone, in the center’s zone order', () => {
    renderView(snfacLike)

    const titles = screen
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent)
      .filter((text) => text === galena.zone_name || text === banner.zone_name)
    expect(titles).toEqual([galena.zone_name, banner.zone_name])
  })

  it('shape-detects the inline/periods format', () => {
    renderView(inline, [])

    expect(screen.getByText('Snowfall')).toBeInTheDocument()
    expect(screen.getAllByText(/12hr/).length).toBeGreaterThan(0)
  })

  it('says so, visibly, when the product has neither discussion nor tables', () => {
    // The state an MWF envelope degrades to (see mapV2Weather): still a product, nothing to show.
    renderView({ ...sac, weather_data: [], weather_discussion: null }, [])

    expect(screen.getByRole('status')).toHaveTextContent(
      'This Mountain Weather product has no discussion or weather tables to display.',
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Mountain Weather' })).toBeInTheDocument()
  })
})
