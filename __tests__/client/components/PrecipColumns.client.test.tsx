import { PrecipAccumulationTable } from '@/components/WeatherStations/PrecipAccumulationTable'
import type { PrecipAccumulationTable as PrecipAccumulationData } from '@/services/snowobs/tableHelpers'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

const table: PrecipAccumulationData = {
  timezoneLabel: 'PST',
  rows: [
    {
      stid: 'A',
      name: 'Alta',
      latitude: 47,
      longitude: -121.5,
      elevation: 4000,
      lastUpdate: '07/07 04:00',
      lastUpdateMs: 1_700_000_000_000,
      totals: { 1: 0.1, 3: 0.3, 6: 0.5, 12: 0.5, 24: 0.5, 48: 0.5, 72: 0.5 },
      hasData: true,
      notes: [],
    },
  ],
}

describe('PrecipAccumulationTable columns', () => {
  it('shows every column when none are chosen', () => {
    render(<PrecipAccumulationTable table={table} />)
    for (const label of ['1H', '72H', 'Last update', 'Latitude', 'Longitude', 'Elevation']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('shows only the chosen columns, and always the station', () => {
    render(<PrecipAccumulationTable table={table} columns={['24h', '72h', 'elevation']} />)
    expect(screen.getByText('Alta')).toBeInTheDocument()
    expect(screen.getByText('24H')).toBeInTheDocument()
    expect(screen.getByText('72H')).toBeInTheDocument()
    expect(screen.getByText('Elevation')).toBeInTheDocument()
    for (const label of ['1H', '3H', 'Last update', 'Latitude', 'Longitude']) {
      expect(screen.queryByText(label)).not.toBeInTheDocument()
    }
    expect(screen.getAllByRole('columnheader')).toHaveLength(4)
  })
})
