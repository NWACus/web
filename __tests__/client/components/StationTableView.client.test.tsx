jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))

import { StationTableView } from '@/components/WeatherStations/StationTableView'
import type { StationTable } from '@/services/snowobs/tableHelpers'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

const table: StationTable = {
  columns: [],
  rows: [],
  timezoneLabel: 'PST',
  latestObservation: null,
  latestDisplay: null,
}

function renderView(metric: StationTable | null) {
  render(
    <StationTableView
      tables={{ default: table, metric }}
      activePeriodKey="24h"
      customRange={null}
      timeZone="America/Los_Angeles"
    />,
  )
}

describe('StationTableView', () => {
  it('offers the unit toggle when both systems loaded', () => {
    renderView(table)
    expect(screen.getByRole('group', { name: 'Units' })).toBeInTheDocument()
  })

  it('drops the toggle, keeping the table, when the metric read failed', () => {
    renderView(null)
    expect(screen.queryByRole('group', { name: 'Units' })).not.toBeInTheDocument()
    expect(screen.getByText('No station observations in this period.')).toBeInTheDocument()
  })
})
