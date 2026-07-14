import { StationLatestObservation } from '@/components/WeatherStations/StationLatestObservation'
import type { StationTable } from '@/services/snowobs/transform'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

const NOW = 1_700_000_000_000
const HOUR_MS = 60 * 60 * 1000

function buildTable(overrides: Partial<StationTable> = {}): StationTable {
  return {
    columns: [],
    rows: [{ timestamp: NOW, display: '11/14 12:00', values: {} }],
    timezoneLabel: 'PST',
    latestObservation: NOW,
    ...overrides,
  }
}

describe('StationLatestObservation', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders the latest observation with the timezone label', () => {
    render(<StationLatestObservation table={buildTable()} />)

    expect(screen.getByText(/Latest observation 11\/14 12:00 PST/)).toBeInTheDocument()
    expect(screen.queryByText('Data may be stale')).not.toBeInTheDocument()
  })

  it('omits the timezone label when it is empty', () => {
    render(<StationLatestObservation table={buildTable({ timezoneLabel: '' })} />)

    expect(screen.getByText('Latest observation 11/14 12:00')).toBeInTheDocument()
  })

  it('shows a fallback when there are no observations', () => {
    render(<StationLatestObservation table={buildTable({ rows: [], latestObservation: null })} />)

    expect(screen.getByText('No recent observations')).toBeInTheDocument()
    expect(screen.queryByText('Data may be stale')).not.toBeInTheDocument()
  })

  it('flags data as stale when the latest observation is older than two hours', () => {
    render(
      <StationLatestObservation table={buildTable({ latestObservation: NOW - 3 * HOUR_MS })} />,
    )

    expect(screen.getByText('Data may be stale')).toBeInTheDocument()
  })

  it('does not flag staleness when latestObservation is null', () => {
    render(<StationLatestObservation table={buildTable({ latestObservation: null })} />)

    expect(screen.queryByText('Data may be stale')).not.toBeInTheDocument()
  })
})
