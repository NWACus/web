import { ZoneTable } from '@/components/NWACWeather/ZoneTable'
import { mapV3NWACWeatherForecastDay } from '@/services/nac/sources/v3/nwacWeatherMappers'
import { nwacWeatherForecastsResponseSchema } from '@/services/nac/types/nwacWeatherSchemas'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import fixture from '../../server/fixtures/nwac-weather-forecasts.json'

const day = mapV3NWACWeatherForecastDay(nwacWeatherForecastsResponseSchema.parse(fixture))
if (!day) throw new Error('fixture should map to a forecast day')
const [afternoon] = day.issuances
const zone = (id: string) => {
  const found = afternoon.zones.find((z) => z.id === id)
  if (!found) throw new Error(`fixture has no ${id} zone`)
  return found
}

describe('ZoneTable', () => {
  it("lists each point's snow under a zone forecast from several points", () => {
    render(<ZoneTable issuance={afternoon} zone={zone('west-south')} />)

    for (const point of ['Crystal Mountain', 'Paradise', 'White Pass', 'Mt St Helens']) {
      expect(screen.getAllByRole('rowheader', { name: point }).length).toBeGreaterThan(0)
    }
  })

  it('adds no point rows for a zone forecast from one point', () => {
    render(<ZoneTable issuance={afternoon} zone={zone('olympics')} />)

    expect(screen.queryByRole('rowheader', { name: 'Hurricane Ridge' })).not.toBeInTheDocument()
  })
})
