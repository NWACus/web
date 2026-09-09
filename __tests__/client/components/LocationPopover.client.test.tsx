import { LocationPopover } from '@/components/EventPreview/LocationPopover'
import type { Event } from '@/payload-types'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

const buildLocation = (
  overrides: Partial<NonNullable<Event['location']>> = {},
): NonNullable<Event['location']> => ({
  isVirtual: false,
  placeName: 'Snoqualmie Pass Trailhead',
  city: 'Snoqualmie Pass',
  state: 'WA',
  ...overrides,
})

describe('LocationPopover', () => {
  it('shows City, State at a glance without opening the popover', () => {
    render(<LocationPopover location={buildLocation()} />)

    expect(screen.getByText('Snoqualmie Pass Trailhead')).toBeInTheDocument()
    expect(screen.getByText('Snoqualmie Pass, WA')).toBeInTheDocument()
  })

  it('shows only the city when no state is set', () => {
    render(<LocationPopover location={buildLocation({ state: null })} />)

    expect(screen.getByText('Snoqualmie Pass')).toBeInTheDocument()
  })

  it('shows only the state when no city is set', () => {
    render(<LocationPopover location={buildLocation({ city: null })} />)

    expect(screen.getByText('WA')).toBeInTheDocument()
  })

  it('omits the City, State line when neither city nor state is set', () => {
    render(<LocationPopover location={buildLocation({ city: null, state: null })} />)

    // Only the placeName should remain as visible location text
    expect(screen.getByText('Snoqualmie Pass Trailhead')).toBeInTheDocument()
    expect(screen.queryByText(/,/)).not.toBeInTheDocument()
  })
})
