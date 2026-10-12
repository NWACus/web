import type { Event } from '@/payload-types'

/** One pin: every listed event held at the same point. */
export type EventPlace = {
  key: string
  latitude: number
  longitude: number
  events: Event[]
}

type Point = { latitude: number; longitude: number }

/** Where an in-person event sits, or null for virtual and never-placed events. */
export function pointOf(event: Event): Point | null {
  const location = event.location
  if (!location || location.isVirtual) return null
  const { latitude, longitude } = location.coordinates ?? {}
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null
  return { latitude, longitude }
}

// Five decimals is about a metre, so a venue's recurring events share one pin.
const keyOf = ({ latitude, longitude }: Point) => `${latitude.toFixed(5)},${longitude.toFixed(5)}`

/** The key of the pin an event sits under, if it has one. */
export function placeKeyFor(event: Event): string | null {
  const point = pointOf(event)
  return point && keyOf(point)
}

/** Splits events into map pins and those that can't go on the map. */
export function groupEventsByPlace(events: Event[]): { places: EventPlace[]; unplaced: Event[] } {
  const places = new Map<string, EventPlace>()
  const unplaced: Event[] = []

  for (const event of events) {
    const point = pointOf(event)
    if (!point) {
      unplaced.push(event)
      continue
    }
    const key = keyOf(point)
    const place = places.get(key) ?? { key, ...point, events: [] }
    place.events.push(event)
    places.set(key, place)
  }

  return { places: [...places.values()], unplaced }
}

/** "Place · City, ST" for a list item, or "Virtual event". */
export function describeWhere(location: Event['location']): string {
  if (!location) return ''
  if (location.isVirtual) return 'Virtual event'
  const town = [location.city, location.state].filter(Boolean).join(', ')
  return [location.placeName, town].filter(Boolean).join(' · ')
}
