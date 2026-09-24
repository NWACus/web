import { StationCard, type StationCardContext } from '@/components/stationMap/StationCard'
import type { StationMapStation } from '@/services/snowobs/stationMap/model'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

const station: StationMapStation = {
  stid: '57',
  name: 'White Chuck Mountain',
  source: 'nwac',
  coordinates: [-121.44, 48.22],
  elevation: 5030,
  observedAt: '2026-09-10T22:00:00Z',
  data: { snow_depth: 1, air_temp: 40, wind_direction: 119, battery_voltage: null },
  zone: 'West Slopes North',
  href: '/weather/stations/station/nwac/57',
  areaHref: null,
}

const context: StationCardContext = {
  variables: [
    { variable: 'air_temp', longName: 'Air Temperature' },
    { variable: 'snow_depth', longName: 'Snow Depth' },
    { variable: 'wind_direction', longName: 'Wind Direction' },
  ],
  units: {
    air_temp: 'fahrenheit',
    snow_depth: 'inches',
    wind_direction: 'degrees',
    battery_voltage: 'volt',
  },
  timezone: 'America/Los_Angeles',
  displayUnits: 'default',
  ageMinutes: 30,
  staleAfterMinutes: 180,
}

describe('StationCard', () => {
  it('shows the station, its source, elevation and reading time', () => {
    render(<StationCard station={station} context={context} />)

    expect(screen.getByRole('heading', { name: 'White Chuck Mountain' })).toBeInTheDocument()
    expect(screen.getByText('NWAC')).toBeInTheDocument()
    expect(screen.getByText(/5030'/)).toBeInTheDocument()
    expect(screen.getByText(/Sep 10 15:00/)).toBeInTheDocument()
    expect(screen.queryByText('(data may be stale)')).not.toBeInTheDocument()
  })

  it("lists readings in the widget's order with labels, units and compass points", () => {
    render(<StationCard station={station} context={context} />)

    const rows = screen.getAllByRole('row').map((row) => row.textContent)
    expect(rows).toEqual([
      'Air Temperature (F)40',
      'Wind Direction (deg)ESE',
      'Snow Depth (in)1',
      'battery_voltage (volt)—',
    ])
  })

  it("links to the station's detail page's table and graphs in a new tab", () => {
    render(<StationCard station={station} context={context} />)
    const table = screen.getByRole('link', { name: 'Table' })
    const graphs = screen.getByRole('link', { name: 'Graphs' })
    expect(table).toHaveAttribute('href', '/weather/stations/station/nwac/57')
    expect(graphs).toHaveAttribute('href', '/weather/stations/station/nwac/57?range=graphs')
    for (const link of [table, graphs]) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  it('links a station on a station page to that page as its area, in a new tab', () => {
    const areaHref = '/weather/stations/white-chuck'
    render(<StationCard station={{ ...station, areaHref }} context={context} />)
    const tables = screen.getByRole('link', { name: 'Area Tables' })
    const graphs = screen.getByRole('link', { name: 'Area Graphs' })
    expect(tables).toHaveAttribute('href', areaHref)
    expect(graphs).toHaveAttribute('href', `${areaHref}?range=graphs`)
    for (const link of [tables, graphs]) expect(link).toHaveAttribute('target', '_blank')
  })

  it('offers no area for a station no page lists', () => {
    render(<StationCard station={station} context={context} />)
    expect(screen.queryByRole('link', { name: 'Area Tables' })).not.toBeInTheDocument()
  })

  it("flags a reading older than the center's threshold", () => {
    render(<StationCard station={station} context={{ ...context, ageMinutes: 200 }} />)
    expect(screen.getByText('(data may be stale)')).toBeInTheDocument()
  })

  it('shows metric elevation in meters', () => {
    render(<StationCard station={station} context={{ ...context, displayUnits: 'metric' }} />)
    expect(screen.getByText(/5030 m/)).toBeInTheDocument()
  })
})
