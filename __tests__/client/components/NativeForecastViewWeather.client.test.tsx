jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/forecasts/avalanche/olympics',
  useSearchParams: () => new URLSearchParams(),
}))

import { NativeForecastView } from '@/components/forecast/NativeForecastView'
import {
  ProductStatus,
  ProductType,
  type Summary,
  type Weather,
} from '@/services/nac/model/forecast'
import { mapV3NWACWeatherForecastDay } from '@/services/nac/sources/v3/nwacWeatherMappers'
import { nwacWeatherForecastsResponseSchema } from '@/services/nac/types/nwacWeatherSchemas'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import fixture from '../../server/fixtures/nwac-weather-forecasts.json'

const nwacWeather = mapV3NWACWeatherForecastDay(nwacWeatherForecastsResponseSchema.parse(fixture))
const OLYMPICS = 1645

// A summary with no discussion or media: the panel holds nothing but the weather, if that.
const summary: Summary = {
  id: 1,
  product_type: ProductType.Summary,
  status: ProductStatus.Published,
  author: 'Forecaster',
  published_time: '2026-09-15T01:00:00Z',
  expires_time: '2026-09-16T01:00:00Z',
  created_at: '2026-09-15T01:00:00Z',
  updated_at: '2026-09-15T01:00:00Z',
  bottom_line: null,
  hazard_discussion: null,
  weather_data: null,
  media: null,
  avalanche_center: {
    id: 'NWAC',
    name: 'Northwest Avalanche Center',
    url: 'https://nwac.us/',
    city: 'Seattle',
    state: 'WA',
  },
  forecast_zone: [],
}

const afpWeather: Weather = {
  id: 9,
  product_type: ProductType.Weather,
  status: ProductStatus.Published,
  author: 'AFP Forecaster',
  published_time: '2026-09-14T22:00:00Z',
  created_at: '2026-09-14T22:00:00Z',
  updated_at: null,
  weather_discussion: '<p>The AFP product</p>',
  weather_data: [],
  avalanche_center: summary.avalanche_center,
  forecast_zone: [],
}

function renderView(props: Partial<ComponentProps<typeof NativeForecastView>>) {
  return render(
    <NativeForecastView
      center="nwac"
      zone={{
        slug: 'olympics',
        zone: {
          id: OLYMPICS,
          name: 'Olympics',
          zone_id: '1',
          config: {
            elevation_band_names: { upper: 'Above', middle: 'Near', lower: 'Below' },
          },
        },
      }}
      timezone="America/Los_Angeles"
      forecastResult={summary}
      warning={null}
      initialDates={[]}
      initialRange={{ from: '2026-08-01', to: '2026-09-30' }}
      currentDate="2026-09-15"
      selectedDate={null}
      basePath="/forecasts/avalanche/olympics"
      pickerSettings={{ calendarStart: '2019-11-01', showZoneName: false }}
      centerDetails={{ type: null, elevationBandsUrl: null }}
      {...props}
    />,
  )
}

// Forecast-241
describe('NativeForecastView, Mountain Weather', () => {
  it("keeps a panel whose only content is NWAC's own weather", () => {
    renderView({ nwacWeather })

    expect(
      screen.getByRole('heading', { level: 2, name: /^Mountain Weather · / }),
    ).toBeInTheDocument()
  })

  it("shows NWAC's own weather in place of an AFP weather product", () => {
    const { unmount } = renderView({ weather: afpWeather })
    expect(screen.getByText('The AFP product')).toBeInTheDocument()
    unmount()

    renderView({ nwacWeather, weather: afpWeather })

    expect(screen.getAllByRole('heading', { name: /^Mountain Weather/ })).toHaveLength(1)
    expect(screen.queryByText('The AFP product')).toBeNull()
  })

  it('shows no panel with neither', () => {
    renderView({})

    expect(screen.queryByRole('heading', { name: /^Mountain Weather/ })).toBeNull()
  })
})
