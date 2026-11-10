import { snowFill } from '@/components/NWACWeather/Values'
import { ZoneTable } from '@/components/NWACWeather/ZoneTable'
import { pointSnow, zonePoints } from '@/services/nac/nwacWeatherFormat'
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
    const table = container.querySelector('table')
    if (!table) throw new Error('no zone table')
    expect(within(table).getByText(afternoon.sensible[z.id].afternoon)).toBeInTheDocument()
    expect(screen.queryByText(afternoon.sensible[z.id].morning)).not.toBeInTheDocument()
  })

  it('leads with each point’s precipitation beside its snow, in the MWF’s order', () => {
    const { container } = render(
      <ZoneTable issuance={afternoon} zone={zone('snoqualmie')} periodKeys={DAY_ONE} />,
    )
    const table = container.querySelector('table')
    if (!table) throw new Error('no zone table')

    expect(
      within(table)
        .getAllByRole('rowheader')
        .map((row) => row.textContent),
    ).toEqual([
      'Precipitation & Snow (in)',
      'Snoqualmie Pass',
      'Snow & Freezing Level (ft)',
      "5000' Temperatures (°F)",
      'Ridgeline Winds (mph)',
      'Summary',
    ])
  })

  it('gives every point of a zone its own row', () => {
    const z = zone('west-south')
    const { container } = render(<ZoneTable issuance={afternoon} zone={z} periodKeys={DAY_ONE} />)
    const table = container.querySelector('table')
    if (!table) throw new Error('no zone table')

    const names = zonePoints(afternoon, z.id).map((p) => p.name)
    const rows = within(table)
      .getAllByRole('rowheader')
      .map((row) => row.textContent)
    expect(rows.slice(0, names.length + 1)).toEqual(['Precipitation & Snow (in)', ...names])
  })

  it('names the 24 hours Tonight and Tomorrow from 6 pm, with their dates', () => {
    const { container } = render(
      <ZoneTable issuance={afternoon} zone={zone('olympics')} periodKeys={DAY_ONE} />,
    )
    const heads = [...(container.querySelector('table thead')?.querySelectorAll('th') ?? [])]

    expect(heads.map((th) => th.textContent)).toEqual([
      'Tonight · Mon Sep 145 pm–5 am PDT',
      'Tomorrow · Tue Sep 155 am–5 pm PDT',
    ])
  })

  it('gives the hours the precipitation and snow cover, which are not the columns’ own', () => {
    const { container } = render(
      <ZoneTable
        issuance={afternoon}
        zone={zone('olympics')}
        periodKeys={DAY_ONE}
        timezone="America/Los_Angeles"
      />,
    )
    const heads = [...(container.querySelector('table thead')?.querySelectorAll('th') ?? [])]

    expect(heads.map((th) => th.lastElementChild?.textContent)).toEqual([
      '5 pm–5 am PDT',
      '5 am–5 pm PDT',
    ])
  })

  it('labels the temperatures Hi and Lo, high first', () => {
    const { container } = render(
      <ZoneTable issuance={afternoon} zone={zone('olympics')} periodKeys={DAY_ONE} />,
    )
    const table = container.querySelector('table')
    if (!table) throw new Error('no zone table')
    const row = within(table)
      .getAllByRole('rowheader')
      .find((th) => th.textContent?.startsWith("5000'"))
      ?.closest('tr')
    if (!row) throw new Error('no temperature row')

    const [first] = within(row).getAllByRole('cell')
    expect(first.textContent).toMatch(/^Hi \d+ · Lo \d+$/)
  })

  it('names them Today and Tonight from 6 am', () => {
    const [, morning] = day.issuances
    const { container } = render(
      <ZoneTable issuance={morning} zone={zone('olympics')} periodKeys={['d1', 'n1']} />,
    )
    const heads = [...(container.querySelector('table thead')?.querySelectorAll('th') ?? [])]

    expect(heads.map((th) => th.textContent)).toEqual([
      'Today · Mon Sep 145 am–5 pm PDT',
      'Tonight · Mon Sep 145 pm–5 am PDT',
    ])
  })

  it('labels the 6h parts of day Morn, Aft, Eve and Night', () => {
    const { container } = render(
      <ZoneTable issuance={afternoon} zone={zone('olympics')} periodKeys={['n1', 'd2']} />,
    )
    const table = container.querySelector('table')
    if (!table) throw new Error('no zone table')
    const levelRow = within(table)
      .getByRole('rowheader', { name: /^Snow & Freezing Level/ })
      .closest('tr')
    if (!levelRow) throw new Error('no snow level row')

    for (const part of ['Eve', 'Night', 'Morn', 'Aft']) {
      expect(within(levelRow).getByText(part)).toBeInTheDocument()
    }
  })

  it("fills each point's snow cells by amount and keeps the keys under the table", () => {
    const z = zone('west-south')
    const { container } = render(<ZoneTable issuance={afternoon} zone={z} periodKeys={DAY_ONE} />)

    const table = container.querySelector('table')
    if (!table) throw new Error('no zone table')
    const [point] = zonePoints(afternoon, z.id)
    const snowRow = within(table)
      .getAllByRole('rowheader')
      .find((th) => th.textContent === point.name)
      ?.closest('tr')
    if (!snowRow) throw new Error('no snow row')
    const cells = within(snowRow).getAllByRole('cell')
    cells.forEach((td, i) => {
      const fill = snowFill(pointSnow(afternoon, point.code, afternoon.periods[i].key))
      if (fill) expect(td).toHaveClass(fill)
    })

    const key = screen.getByText(/none, freezing level/)
    expect(table.compareDocumentPosition(key) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const levelRow = within(table)
      .getByRole('rowheader', { name: /^Snow & Freezing Level/ })
      .closest('tr')
    expect(levelRow?.querySelector('[class*="bg-"]')).not.toBeNull()
  })
})
