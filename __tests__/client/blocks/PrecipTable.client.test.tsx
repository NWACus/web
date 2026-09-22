import { PrecipTableClient } from '@/blocks/PrecipTable/PrecipTable.client'
import type { PrecipAccumulationTable } from '@/services/snowobs/tableHelpers'
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'

const STATIONS = [
  { stid: '1', source: 'nwac' },
  { stid: '1011', source: 'snotel' },
]

const TABLE: PrecipAccumulationTable = {
  timezoneLabel: 'PST',
  rows: [
    {
      stid: '1',
      source: 'nwac',
      name: 'Alpental Base',
      latitude: 47.4,
      longitude: -121.4,
      elevation: 3100,
      lastUpdate: '09/22 04:00',
      lastUpdateMs: 1_700_000_000_000,
      totals: { 1: 0.1, 3: 0.2, 6: 0.3, 12: 0.4, 24: 0.5, 48: 0.6, 72: 0.7 },
      hasData: true,
      notes: [],
    },
  ],
}

const urls: string[] = []

function mockFetch(impl: () => Promise<unknown>) {
  urls.length = 0
  const spy = (input: unknown) => {
    urls.push(String(input))
    return impl()
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  global.fetch = spy as unknown as typeof fetch
}

afterEach(() => jest.restoreAllMocks())

describe('PrecipTableClient', () => {
  it('asks the route for its own stations, by source and id', async () => {
    mockFetch(async () => ({ ok: true, json: async () => TABLE }))
    render(<PrecipTableClient stations={STATIONS} columns={['24h']} />)

    await waitFor(() => expect(screen.getByText('Alpental Base')).toBeInTheDocument())
    expect(urls[0]).toBe(
      `/weather/precip-data?stations=${encodeURIComponent('nwac:1,snotel:1011')}`,
    )
  })

  it('shows a placeholder until the table arrives', () => {
    mockFetch(() => new Promise(() => {}))
    render(<PrecipTableClient stations={STATIONS} columns={['24h']} />)

    expect(screen.getByRole('status', { name: 'Loading precipitation totals' })).toBeInTheDocument()
  })

  it('says so when the route fails rather than rendering an empty table', async () => {
    mockFetch(async () => ({ ok: false, status: 502, json: async () => ({}) }))
    render(<PrecipTableClient stations={STATIONS} columns={['24h']} />)

    await waitFor(() =>
      expect(screen.getByText(/Precipitation data is unavailable/)).toBeInTheDocument(),
    )
  })
})
