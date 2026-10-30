import {
  describeWhere,
  groupEventsByPlace,
  placeKeyFor,
  pointOf,
} from '@/components/EventsMap/eventPlaces'
import type { Event } from '@/payload-types'

const event = (id: number, location: Event['location']): Event => ({
  id,
  title: `Event ${id}`,
  slug: `event-${id}`,
  startDate: '2026-11-01T18:00:00.000Z',
  startDate_tz: 'America/Los_Angeles',
  endDate_tz: 'America/Los_Angeles',
  type: 'event',
  tenant: 1,
  updatedAt: '',
  createdAt: '',
  location,
})

const northBend = { placeName: 'Taproom', city: 'North Bend', state: 'WA' as const }
const at = (latitude: number, longitude: number) => ({ latitude, longitude })

describe('pointOf', () => {
  it('reads an in-person event’s coordinates', () => {
    expect(pointOf(event(1, { ...northBend, coordinates: at(47.49, -121.78) }))).toEqual(
      at(47.49, -121.78),
    )
  })

  it('has no point for virtual, unplaced or half-placed events', () => {
    expect(pointOf(event(1, { isVirtual: true, coordinates: at(1, 2) }))).toBeNull()
    expect(pointOf(event(2, northBend))).toBeNull()
    expect(pointOf(event(3, { ...northBend, coordinates: { latitude: 47 } }))).toBeNull()
    expect(pointOf(event(4, undefined))).toBeNull()
  })
})

describe('groupEventsByPlace', () => {
  it('puts events at the same point under one pin and keeps the rest aside', () => {
    const a = event(1, { ...northBend, coordinates: at(47.495701, -121.786801) })
    const b = event(2, { ...northBend, coordinates: at(47.4957, -121.7868) })
    const c = event(3, { ...northBend, coordinates: at(47.7, -121.3) })
    const virtual = event(4, { isVirtual: true })

    const { places, unplaced } = groupEventsByPlace([a, b, c, virtual])

    expect(places.map((place) => place.events.map((e) => e.id))).toEqual([[1, 2], [3]])
    expect(unplaced.map((e) => e.id)).toEqual([4])
    expect(placeKeyFor(a)).toBe(places[0].key)
    expect(placeKeyFor(virtual)).toBeNull()
  })
})

describe('describeWhere', () => {
  it('joins the place and town', () => {
    expect(describeWhere(northBend)).toBe('Taproom · North Bend, WA')
    expect(describeWhere({ city: 'Leavenworth' })).toBe('Leavenworth')
  })

  it('labels virtual events and tolerates no location', () => {
    expect(describeWhere({ isVirtual: true, placeName: 'Zoom' })).toBe('Virtual event')
    expect(describeWhere(undefined)).toBe('')
  })
})
