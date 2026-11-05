import { snowFill } from '@/components/NWACWeather/Values'
import { ZoneTable } from '@/components/NWACWeather/ZoneTable'
import { zoneSnow } from '@/services/nac/nwacWeatherFormat'
import { mapV3NWACWeatherForecastDay } from '@/services/nac/sources/v3/nwacWeatherMappers'
import { nwacWeatherForecastsResponseSchema } from '@/services/nac/types/nwacWeatherSchemas'
import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import fixture from '../../server/fixtures/nwac-weather-forecasts.json'

const day = mapV3NWACWeatherForecastDay(nwacWeatherForecastsResponseSchema.parse(fixture))
if (!day) throw new Error('fixture should map to a forecast day')
const [afternoon] = day.issuances
const DAY_ONE = ['n1', 'd2']
const zone = (id: string) => {
  const found = afternoon.zones.find((z) => z.id === id)
  if (!found) throw new Error(`fixture has no ${id} zone`)
  return found
}

describe('ZoneTable', () => {
  it('shows only the periods asked for, and their sensible weather', () => {
    const z = zone('olympics')
    const { container } = render(
      <ZoneTable issuance={afternoon} zone={z} periodKeys={['d2']} heading={false} />,
    )

    expect(container.querySelector('table thead')?.querySelectorAll('th')).toHaveLength(1)
    expect(screen.getByText(afternoon.sensible[z.id].afternoon)).toBeInTheDocument()
    expect(screen.queryByText(afternoon.sensible[z.id].morning)).not.toBeInTheDocument()
  })

  it('keeps to the short rows, without each point', () => {
    render(<ZoneTable issuance={afternoon} zone={zone('west-south')} periodKeys={DAY_ONE} />)

    expect(
      screen
        .getAllByRole('rowheader')
        .map((row) => row.textContent)
        .slice(0, 4),
    ).toEqual(['Snow (in)', 'Snow level (ft)', "5000' Temperatures (°F)", 'Ridge wind (mph)'])
    expect(screen.queryByRole('rowheader', { name: 'Paradise' })).not.toBeInTheDocument()
  })

  it("fills the zone's snow cells by amount and keeps the keys under the table", () => {
    const z = zone('west-south')
    const { container } = render(<ZoneTable issuance={afternoon} zone={z} periodKeys={DAY_ONE} />)

    const table = container.querySelector('table')
    if (!table) throw new Error('no zone table')
    const snowRow = within(table)
      .getByRole('rowheader', { name: /^Snow \(in\)$/ })
      .closest('tr')
    if (!snowRow) throw new Error('no snow row')
    const cells = within(snowRow).getAllByRole('cell')
    cells.forEach((td, i) => {
      const fill = snowFill(zoneSnow(afternoon, z.id, afternoon.periods[i].key))
      if (fill) expect(td).toHaveClass(fill)
    })

    const key = screen.getByText(/none, freezing level/)
    expect(table.compareDocumentPosition(key) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const levelRow = within(table)
      .getByRole('rowheader', { name: /^Snow level/ })
      .closest('tr')
    expect(levelRow?.querySelector('[class*="bg-"]')).not.toBeNull()
  })
})
