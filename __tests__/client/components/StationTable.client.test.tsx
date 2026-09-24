import { StationTable, type StationTableContext } from '@/components/stationMap/StationTable'
import type { StationMapStation } from '@/services/snowobs/stationMap/model'
import { DEFAULT_TABLE_SORT, type TableSort } from '@/services/snowobs/stationMap/table'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { createRef } from 'react'

function station(overrides: Partial<StationMapStation>): StationMapStation {
  return {
    stid: '1',
    name: 'Station',
    source: 'nwac',
    coordinates: [-121, 47],
    elevation: 3000,
    observedAt: '2026-09-10T22:00:00Z',
    data: {},
    zone: 'Olympics',
    href: null,
    ...overrides,
  }
}

const stations = [
  station({
    stid: 'hurricane',
    name: 'Hurricane Ridge',
    elevation: 5250,
    data: { air_temp: 34, wind_speed: 25 },
    href: '/weather/stations/hurricane-ridge',
  }),
  station({ stid: 'old', name: 'Old Station', elevation: 1200, data: { air_temp: 20 } }),
  station({ stid: 'hood', name: 'Timberline', zone: 'Mt Hood', data: { wind_speed: 5 } }),
]

const context: StationTableContext = {
  variables: [
    { variable: 'wind_speed', longName: 'Wind Speed' },
    { variable: 'air_temp', longName: 'Air Temperature' },
  ],
  units: { air_temp: 'fahrenheit', wind_speed: 'mph' },
  zoneNames: ['Olympics', 'Mt Hood'],
  timezone: 'America/Los_Angeles',
  ages: new Map([
    ['hurricane', 30],
    ['old', 500],
    ['hood', 30],
  ]),
  staleAfterMinutes: 180,
  colorRules: true,
}

function renderTable({
  sort = DEFAULT_TABLE_SORT,
  highlighted = null,
  colorRules = true,
}: { sort?: TableSort; highlighted?: string | null; colorRules?: boolean } = {}) {
  const onSort = jest.fn()
  const onOpenStation = jest.fn()
  render(
    <StationTable
      stations={stations}
      context={{ ...context, colorRules }}
      sort={sort}
      onSort={onSort}
      highlighted={highlighted}
      onOpenStation={onOpenStation}
      frameRef={createRef()}
    />,
  )
  return { onSort, onOpenStation }
}

describe('StationTable', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn()
  })

  it('heads each column with its short name and unit, in the widget order', () => {
    renderTable()
    const headers = screen.getAllByRole('columnheader').map((th) => th.textContent)
    expect(headers).toEqual([
      'Station',
      'Elevft, Elevation (ft)',
      expect.stringMatching(/^Time(PDT|PST), Date Time \((PDT|PST)\)$/),
      'TempF, Air Temperature (F)',
      'Spdmph, Wind Speed (mph)',
    ])
    // The long name is the tooltip too, as in the widget.
    expect(screen.getByRole('button', { name: /^Temp/ })).toHaveAttribute(
      'title',
      'Air Temperature (F)',
    )
  })

  it('marks the sorted column for assistive tech, and sorts by the column clicked', () => {
    const { onSort } = renderTable({ sort: { column: 'air_temp', direction: 'desc' } })
    const temp = screen.getByRole('columnheader', { name: /^Temp/ })
    expect(temp).toHaveAttribute('aria-sort', 'descending')
    expect(screen.getByRole('columnheader', { name: /Elev/ })).not.toHaveAttribute('aria-sort')

    fireEvent.click(within(temp).getByRole('button'))
    expect(onSort).toHaveBeenCalledWith('air_temp')
  })

  it('groups rows under a heading per zone, sorted within each', () => {
    renderTable()
    const groups = screen.getAllByRole('rowgroup').slice(1)
    expect(groups.map((group) => within(group).getAllByRole('rowheader')[0].textContent)).toEqual([
      'Olympics',
      'Mt Hood',
    ])
    const olympics = within(groups[0])
      .getAllByRole('rowheader')
      .slice(1)
      .map((th) => th.textContent)
    expect(olympics).toEqual(['Old Station', 'Hurricane Ridge'])
  })

  it('links a station to its page when it has one, and names it plainly when it does not', () => {
    const { onOpenStation } = renderTable()
    const link = screen.getByRole('link', { name: 'Hurricane Ridge' })
    expect(link).toHaveAttribute('href', '/weather/stations/hurricane-ridge')
    expect(screen.queryByRole('link', { name: 'Old Station' })).not.toBeInTheDocument()

    fireEvent.click(link)
    expect(onOpenStation).toHaveBeenCalled()
  })

  it("shows the reading's time in the center's zone, and flags one older than the center allows", () => {
    renderTable()
    const old = screen.getByRole('row', { name: /Old Station/ })
    expect(old).toHaveTextContent('15:00')
    expect(within(old).getByText('(Data is older than 3 hours)')).toBeInTheDocument()

    const fresh = screen.getByRole('row', { name: /Hurricane Ridge/ })
    expect(within(fresh).queryByText(/older than/)).not.toBeInTheDocument()
  })

  /** The row's reading cells, after station, elevation and time: Temp, then Spd. */
  function readingCells(name: RegExp) {
    return within(screen.getByRole('row', { name })).getAllByRole('cell').slice(2)
  }

  it('colors readings over the thresholds, and says so in words', () => {
    renderTable()
    const [temp, speed] = readingCells(/Hurricane Ridge/)
    expect(temp).toHaveClass('bg-[#fd7e14]')
    expect(temp).toHaveTextContent('34 (Value greater than 32 F)')
    expect(speed).toHaveClass('bg-[#fd7e14]')
    expect(speed).toHaveTextContent('25 (Value greater than 20 mph)')

    const [, calm] = readingCells(/Timberline/)
    expect(calm).toHaveTextContent(/^5$/)
    expect(calm.className).not.toMatch(/bg-\[/)
  })

  it('leaves readings uncolored when color rules are off', () => {
    renderTable({ colorRules: false })
    const [temp] = readingCells(/Hurricane Ridge/)
    expect(temp).toHaveTextContent(/^34$/)
    expect(temp.className).not.toMatch(/bg-\[/)
  })

  it('picks out the highlighted station, scrolls it into view and moves focus to it', () => {
    renderTable({ highlighted: 'hood' })
    const row = screen.getByRole('row', { name: /Timberline/ })
    expect(row).toHaveAttribute('aria-current', 'true')
    expect(within(row).getByRole('rowheader')).toHaveFocus()
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      block: 'center',
      inline: 'start',
    })
  })
})
