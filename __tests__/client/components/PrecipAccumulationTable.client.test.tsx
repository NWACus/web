import { PrecipAccumulationTable } from '@/components/WeatherStations/PrecipAccumulationTable'
import type {
  PrecipAccumulationTable as PrecipAccumulationData,
  PrecipAccumulationRow,
} from '@/services/snowobs/tableHelpers'
import '@testing-library/jest-dom'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'

function buildRow(overrides: Partial<PrecipAccumulationRow>): PrecipAccumulationRow {
  return {
    stid: 'stid',
    source: 'nwac',
    name: 'Station',
    latitude: 47,
    longitude: -121.5,
    elevation: 4000,
    lastUpdate: '07/07 04:00',
    lastUpdateMs: 1_700_000_000_000,
    totals: { 1: 0.1, 3: 0.3, 6: 0.5, 12: 0.5, 24: 0.5, 48: 0.5, 72: 0.5 },
    hasData: true,
    notes: [],
    ...overrides,
  }
}

// Server order is the block's list; names deliberately not alphabetical so
// the name sort visibly reorders.
const zeta = buildRow({ stid: 'Z', name: 'Zeta', latitude: 48.5, lastUpdateMs: 2000 })
const alta = buildRow({
  stid: 'A',
  name: 'Alta',
  latitude: 47.0,
  elevation: 5000,
  lastUpdateMs: 1000,
  totals: { 1: null, 3: null, 6: null, 12: null, 24: null, 48: 0.2, 72: 0.7 },
})
const mist = buildRow({
  stid: 'M',
  name: 'Mist',
  latitude: 46.0,
  elevation: 3000,
  lastUpdate: '',
  lastUpdateMs: null,
  totals: { 1: null, 3: null, 6: null, 12: null, 24: null, 48: null, 72: null },
  hasData: false,
})

const table: PrecipAccumulationData = {
  rows: [zeta, alta, mist],
  timezoneLabel: 'PDT',
  unit: 'in',
  decimals: 2,
}

function bodyRowNames(): string[] {
  // Skip the header row; the station name is each body row's first cell.
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent ?? '')
}

describe('PrecipAccumulationTable', () => {
  it('renders rows in server order with missing stations collapsed', () => {
    render(<PrecipAccumulationTable table={table} unit="default" onUnitChange={jest.fn()} />)

    expect(bodyRowNames()).toEqual(['Zeta', 'Alta', 'Mist'])
    expect(screen.getByText('missing')).toHaveAttribute('colspan', '7')
    expect(screen.getByText('no report in 72H')).toBeInTheDocument()
    expect(screen.getByText('PDT')).toBeInTheDocument()
  })

  it('sorts a window column descending first, keeping null totals last', () => {
    render(<PrecipAccumulationTable table={table} unit="default" onUnitChange={jest.fn()} />)

    fireEvent.click(screen.getByTitle('Sort by 72H'))
    expect(bodyRowNames()).toEqual(['Alta', 'Zeta', 'Mist'])

    fireEvent.click(screen.getByTitle('Sort by 72H'))
    expect(bodyRowNames()).toEqual(['Zeta', 'Alta', 'Mist'])
  })

  it('sorts by station name ascending first', () => {
    render(<PrecipAccumulationTable table={table} unit="default" onUnitChange={jest.fn()} />)

    fireEvent.click(screen.getByTitle('Sort by Station'))
    expect(bodyRowNames()).toEqual(['Alta', 'Mist', 'Zeta'])
  })

  it('sorts last update by timestamp with never-reported stations last', () => {
    render(<PrecipAccumulationTable table={table} unit="default" onUnitChange={jest.fn()} />)

    fireEvent.click(screen.getByTitle('Sort by Last update'))
    expect(bodyRowNames()).toEqual(['Zeta', 'Alta', 'Mist'])

    fireEvent.click(screen.getByTitle('Sort by Last update'))
    expect(bodyRowNames()).toEqual(['Alta', 'Zeta', 'Mist'])
  })

  it('shows totals in the unit and precision SnowObs sent, converting only elevation', () => {
    render(<PrecipAccumulationTable table={table} unit="default" onUnitChange={jest.fn()} />)
    expect(screen.getByText('0.10')).toBeInTheDocument()
    expect(screen.getByText('4,000')).toBeInTheDocument()
    cleanup()

    const metric = {
      ...table,
      unit: 'mm',
      decimals: 1,
      rows: [{ ...zeta, totals: { ...zeta.totals, 1: 2.5 } }, alta, mist],
    }
    render(<PrecipAccumulationTable table={metric} unit="metric" onUnitChange={jest.fn()} />)
    // 4000 ft -> 1219 m; the totals arrive in mm.
    expect(screen.getByText('2.5')).toBeInTheDocument()
    expect(screen.getByText('1,219')).toBeInTheDocument()
    expect(screen.getAllByText('mm')).toHaveLength(7)
    expect(screen.getByText('m')).toBeInTheDocument()
  })

  it('asks for the other unit system when toggled', () => {
    const onUnitChange = jest.fn()
    render(<PrecipAccumulationTable table={table} unit="default" onUnitChange={onUnitChange} />)
    fireEvent.click(screen.getByText('Metric'))
    expect(onUnitChange).toHaveBeenCalledWith('metric')
  })

  it('renders columns in the chosen order, collapsing each run of windows', () => {
    render(
      <PrecipAccumulationTable
        table={table}
        unit="default"
        onUnitChange={jest.fn()}
        columns={['elevation', '24h', '1h', 'lastUpdate', '72h']}
      />,
    )

    const headers = within(screen.getAllByRole('row')[0])
      .getAllByRole('columnheader')
      .map((th) => th.textContent)
    expect(headers).toEqual(['Station', 'Elevationft', '24Hin', '1Hin', 'Last updatePDT', '72Hin'])

    const mistCells = within(screen.getAllByRole('row')[3])
      .getAllByRole('cell')
      .map((td) => [td.textContent, td.getAttribute('colspan')])
    expect(mistCells).toEqual([
      ['Mist', null],
      ['3,000', null],
      ['missing', '2'],
      ['no report in 72H', null],
      ['missing', '1'],
    ])
  })

  it('renders an empty state when there are no rows', () => {
    render(
      <PrecipAccumulationTable
        table={{ rows: [], timezoneLabel: '', unit: '', decimals: 0 }}
        unit="default"
        onUnitChange={jest.fn()}
      />,
    )

    expect(
      screen.getByText('No precipitation readings from these stations in the last 72 hours.'),
    ).toBeInTheDocument()
  })
})
