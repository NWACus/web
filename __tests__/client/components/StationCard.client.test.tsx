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
  href: '/weather/stations/white-chuck',
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

  it('links the whole card to the native station page', () => {
    render(<StationCard station={station} context={context} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/weather/stations/white-chuck')
    expect(screen.getByText('View station')).toBeInTheDocument()
  })

  it('is a plain card for a station with no native page', () => {
    render(<StationCard station={{ ...station, href: null }} context={context} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByText('View station')).not.toBeInTheDocument()
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
