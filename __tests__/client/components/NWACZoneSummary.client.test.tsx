import { ZoneSummary } from '@/components/NWACWeather/ZoneSummary'
import { mapV3NWACWeatherForecastDay } from '@/services/nac/sources/v3/nwacWeatherMappers'
import { nwacWeatherForecastsResponseSchema } from '@/services/nac/types/nwacWeatherSchemas'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import fixture from '../../server/fixtures/nwac-weather-forecasts.json'

const day = mapV3NWACWeatherForecastDay(nwacWeatherForecastsResponseSchema.parse(fixture))
const OLYMPICS = 1645

describe('ZoneSummary', () => {
  // Forecast-241
  it('reads as one of the native forecast panel’s sections there', () => {
    if (!day) throw new Error('fixture should map to a forecast day')
    const { container } = render(
      <ZoneSummary day={day} avalancheZoneId={OLYMPICS} timezone="America/Los_Angeles" inPanel />,
    )

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/^Mountain Weather · /)
    expect(container.querySelector('#mountain-weather')).toBeNull()
    expect(screen.getByRole('link', { name: /Full Mountain Weather Forecast/ })).toBeInTheDocument()
  })

  it('keeps the widget’s card everywhere else', () => {
    if (!day) throw new Error('fixture should map to a forecast day')
    const { container } = render(
      <ZoneSummary day={day} avalancheZoneId={OLYMPICS} timezone="America/Los_Angeles" />,
    )

    expect(container.querySelector('#mountain-weather')).not.toBeNull()
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull()
  })
})
