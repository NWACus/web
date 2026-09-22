import { StationNotes } from '@/components/WeatherStations/StationNotes'
import type { StationNote } from '@/services/snowobs/tableHelpers'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

const TZ = 'America/Los_Angeles'

const note = (over: Partial<StationNote> = {}): StationNote => ({
  stid: '1',
  stationName: 'Alpental Base',
  note: 'A note.',
  status: 'active',
  startDate: '2026-05-01T18:30:52Z',
  ...over,
})

const ACTIVE = note({
  note: 'The 24-hour boards have been removed for the summer season. Disregard all values.',
})
const PERMANENT = note({
  stid: '3',
  status: 'static',
  note: 'Wind gauges are unheated and may rime.',
})
const PERMANENT_TWO = note({
  stid: '2',
  status: 'static',
  note: 'This is a propane heated precipitation gauge.',
})

function disclosure(): HTMLDetailsElement {
  const found = document.querySelector('details')
  if (!found) throw new Error('expected a disclosure')
  return found
}

function summary(): HTMLElement {
  const found = disclosure().querySelector('summary')
  if (!found) throw new Error('expected a summary')
  return found
}

describe('StationNotes', () => {
  it('renders nothing without notes', () => {
    const { container } = render(<StationNotes notes={[]} timeZone={TZ} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('starts collapsed', () => {
    render(<StationNotes notes={[ACTIVE, PERMANENT]} timeZone={TZ} />)
    expect(disclosure().open).toBe(false)
  })

  it('leads with an active note, even when a permanent note comes first', () => {
    render(<StationNotes notes={[PERMANENT, ACTIVE]} timeZone={TZ} />)
    expect(summary()).toContainElement(screen.getByText(/Disregard all values/))
    expect(summary()).not.toContainElement(screen.getByText(/may rime/))
  })

  it('counts the notes folded behind the lead', () => {
    const { rerender } = render(<StationNotes notes={[ACTIVE, PERMANENT]} timeZone={TZ} />)
    expect(screen.getByText('+1 note')).toBeInTheDocument()
    rerender(<StationNotes notes={[ACTIVE, PERMANENT, PERMANENT_TWO]} timeZone={TZ} />)
    expect(screen.getByText('+2 notes')).toBeInTheDocument()
  })

  it('shows a lone note without a disclosure', () => {
    render(<StationNotes notes={[ACTIVE]} timeZone={TZ} />)
    expect(document.querySelector('details')).toBeNull()
    expect(screen.getByText(/Disregard all values/)).toBeInTheDocument()
    expect(screen.queryByText(/^\+\d/)).toBeNull()
  })

  it('follows a note with its start date', () => {
    render(<StationNotes notes={[ACTIVE]} timeZone={TZ} />)
    expect(screen.getByText('May 1, 2026')).toBeInTheDocument()
  })
})
