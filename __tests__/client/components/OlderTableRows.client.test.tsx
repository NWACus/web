import type { OlderRows } from '@/components/WeatherStations/OlderTableRows'
import { OlderTableRows, useOlderTableRows } from '@/components/WeatherStations/OlderTableRows'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const OLDER: OlderRows = {
  range: { from: '2025-09-01', to: '2026-08-31' },
  before: '2025-10-01',
  source: { page: 'alpental' },
}

const EMPTY = {
  columns: [],
  rows: [],
  timezoneLabel: '',
  latestObservation: null,
  latestDisplay: null,
}

function Harness({ older }: { older: OlderRows | null }) {
  const rows = useOlderTableRows(older)
  return <OlderTableRows rows={rows} />
}

beforeAll(() => {
  Object.defineProperty(window, 'IntersectionObserver', {
    value: class {
      observe() {}
      disconnect() {}
    },
  })
})

describe('OlderTableRows', () => {
  it('shows nothing when every row is on the page', () => {
    render(<Harness older={null} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('asks for the next chunk, and is done at the start of the range', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ default: EMPTY, metric: null }),
    })
    render(<Harness older={OLDER} />)
    fireEvent.click(screen.getByRole('button', { name: 'Load older days' }))
    await waitFor(() => expect(screen.queryByRole('button')).toBeNull())
    expect(global.fetch).toHaveBeenCalledWith(
      '/weather/table-data?page=alpental&from=2025-09-01&to=2025-09-30',
    )
  })

  it('offers a retry when a chunk fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 502 })
    render(<Harness older={OLDER} />)
    fireEvent.click(screen.getByRole('button', { name: 'Load older days' }))
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent("Older days didn't load.")
  })

  it('forgets a failure when the range changes', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 502 })
    const { rerender } = render(<Harness older={OLDER} />)
    fireEvent.click(screen.getByRole('button', { name: 'Load older days' }))
    await screen.findByRole('button', { name: 'Try again' })

    rerender(<Harness older={{ ...OLDER, before: '2025-09-15' }} />)

    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('button', { name: 'Load older days' })).toBeInTheDocument()
  })
})
