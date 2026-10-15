import { clusterPlaces, mapItemsAt } from '@/components/EventsMap/clusters'
import type { EventPlace } from '@/components/EventsMap/eventPlaces'
import type { Event } from '@/payload-types'

// Places only need their events counted here.
const events = (count: number): Event[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    title: `Event ${i}`,
    slug: `event-${i}`,
    startDate: '2026-11-01T18:00:00.000Z',
    startDate_tz: 'America/Los_Angeles',
    endDate_tz: 'America/Los_Angeles',
    type: 'event',
    tenant: 1,
    updatedAt: '',
    createdAt: '',
  }))

const place = (key: string, latitude: number, longitude: number, count = 1): EventPlace => ({
  key,
  latitude,
  longitude,
  events: events(count),
})

// North Bend and Snoqualmie Pass are about 30 km apart; Bellingham is 150 km north.
const northBend = place('north-bend', 47.4957, -121.7868, 2)
const snoqualmie = place('snoqualmie', 47.4245, -121.4137, 3)
const bellingham = place('bellingham', 48.7519, -122.4787)
const places = [northBend, snoqualmie, bellingham]

describe('mapItemsAt', () => {
  it('merges nearby places into one cluster when zoomed out, counting their events', () => {
    const items = mapItemsAt(clusterPlaces(places, null), 6)
    const clusters = items.flatMap((item) => (item.kind === 'cluster' ? [item.cluster] : []))
    expect(clusters).toHaveLength(1)
    expect(clusters[0]).toMatchObject({ eventCount: 5 })
    expect(clusters[0]?.keys.sort()).toEqual(['north-bend', 'snoqualmie'])
    expect(clusters[0]?.expansionZoom).toBeGreaterThan(6)
    expect(items).toContainEqual({ kind: 'place', place: bellingham })
  })

  it('gives every place its own pin when zoomed in', () => {
    const items = mapItemsAt(clusterPlaces(places, null), 12)
    expect(items.every((item) => item.kind === 'place')).toBe(true)
    expect(items).toHaveLength(3)
  })

  it('keeps the selected place out of any cluster, so its popup can open', () => {
    const items = mapItemsAt(clusterPlaces(places, 'snoqualmie'), 6)
    expect(items).toContainEqual({ kind: 'place', place: snoqualmie })
    expect(items).toContainEqual({ kind: 'place', place: northBend })
    expect(items.some((item) => item.kind === 'cluster')).toBe(false)
  })
})
