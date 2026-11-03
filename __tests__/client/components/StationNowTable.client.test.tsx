import { StationNowTable } from '@/components/WeatherStations/StationNowTable'
import type { StationTable, TableColumn } from '@/services/snowobs/tableHelpers'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

function column(variable: string, unit: string, label: string): TableColumn {
  return {
    key: `nwac:1_${variable}`,
    stid: '1',
    source: 'nwac',
    variable,
    label,
    longName: label,
    unit,
    decimals: 0,
    elevation: null,
  }
}

const TABLE: StationTable = {
  columns: [
    column('wind_direction', '°', 'Dir'),
    column('wind_direction_compass', '', 'Compass'),
    column('wind_speed', 'mph', 'Speed'),
  ],
  rows: [
    {
      timestamp: 0,
      display: '11/14 12:00',
      values: {
        'nwac:1_wind_direction': 224.6,
        'nwac:1_wind_direction_compass': 224.6,
        'nwac:1_wind_speed': 12,
      },
    },
  ],
  timezoneLabel: 'PST',
  latestObservation: 0,
  latestDisplay: '11/14 12:00',
}

describe('StationNowTable', () => {
  it('shows wind direction in degrees, with its compass point in its own column', () => {
    render(<StationNowTable table={TABLE} />)

    expect(screen.getByText('225')).toBeInTheDocument()
    expect(screen.getByText('°')).toBeInTheDocument()
    expect(screen.getByText('SW')).toBeInTheDocument()
    expect(screen.getByText('Compass')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })
})
