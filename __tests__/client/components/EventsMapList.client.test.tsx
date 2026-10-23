/**
 * The map view's cards stand in for the list view's, so they carry the same flags: a past event's
 * badge, a virtual event's badge, and (under Details) the address with Copy and Open in Maps.
 */
import { EventsMapList } from '@/components/EventsMap/EventsMapList'
import type { Event } from '@/payload-types'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'

const event = (id: number, startDate: string, location: Event['location']): Event => ({
  id,
  title: `Event ${id}`,
  slug: `event-${id}`,
  startDate,
  startDate_tz: 'America/Los_Angeles',
  endDate_tz: 'America/Los_Angeles',
  type: 'event',
  tenant: 1,
  updatedAt: '',
  createdAt: '',
  location,
})

const taproom = {
  placeName: 'Taproom',
  address: '101 Main St',
  city: 'North Bend',
  state: 'WA' as const,
  coordinates: { latitude: 47.49, longitude: -121.78 },
}

const selection = { hover: () => {}, isSelected: () => false, showOnMap: () => {} }

function renderCards(events: Event[]) {
  render(
    <EventsMapList
      state={{ events, total: events.length, error: null, loading: false, near: '' }}
      searchingArea={false}
      selection={selection}
      distanceFrom={null}
    />,
  )
}

const card = (title: string) => {
  const item = screen.getByRole('link', { name: title }).closest('li')
  if (!item) throw new Error(`No card for ${title}`)
  return within(item)
}

describe('EventsMapList cards', () => {
  it('badges a past event and not an upcoming one', () => {
    renderCards([
      event(1, '2020-01-01T18:00:00.000Z', taproom),
      event(2, '2099-01-01T18:00:00.000Z', taproom),
    ])

    expect(card('Event 1').getByText('Past Event')).toBeInTheDocument()
    expect(card('Event 2').queryByText('Past Event')).not.toBeInTheDocument()
  })

  it('badges a virtual event in place of a place', () => {
    renderCards([event(1, '2099-01-01T18:00:00.000Z', { isVirtual: true })])

    expect(card('Event 1').getByText('Virtual Event')).toBeInTheDocument()
  })

  it('shows the address with a way to open it in maps under Details', () => {
    renderCards([event(1, '2099-01-01T18:00:00.000Z', taproom)])

    fireEvent.click(screen.getByRole('button', { name: 'Details: Event 1' }))

    expect(card('Event 1').getByText('101 Main St')).toBeInTheDocument()
    expect(card('Event 1').getByRole('link', { name: /Open in Maps/ })).toHaveAttribute(
      'href',
      expect.stringContaining('101%20Main%20St'),
    )
  })
})
