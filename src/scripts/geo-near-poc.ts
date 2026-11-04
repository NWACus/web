// PoC: `pnpm geo:near-poc` after `pnpm seed:standalone`.
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { findNear } from '../utilities/geo/findNear'

const payload = await getPayload({ config: configPromise })

const { docs: tenants } = await payload.find({
  collection: 'tenants',
  where: { slug: { equals: 'nwac' } },
  limit: 1,
})
const nwac = tenants[0]
if (!nwac) throw new Error('No nwac tenant; run pnpm seed:standalone first')

const searches = [
  { label: 'Seattle, 50 km', center: { latitude: 47.6062, longitude: -122.3321 }, radiusKm: 50 },
  { label: 'Seattle, 100 km', center: { latitude: 47.6062, longitude: -122.3321 }, radiusKm: 100 },
  {
    label: 'Leavenworth, 50 km',
    center: { latitude: 47.5962, longitude: -120.6615 },
    radiusKm: 50,
  },
  { label: 'Spokane, 100 km', center: { latitude: 47.6588, longitude: -117.426 }, radiusKm: 100 },
]

for (const { label, center, radiusKm } of searches) {
  const started = performance.now()
  const results = await findNear({
    payload,
    collection: 'events',
    path: 'location.coordinates',
    getCoordinates: (event) => event.location?.coordinates,
    center,
    radiusKm,
    where: { tenant: { equals: nwac.id }, _status: { equals: 'published' } },
    depth: 0,
  })
  const ms = (performance.now() - started).toFixed(1)

  payload.logger.info(`${label} → ${results.length} event(s) in ${ms} ms`)
  for (const { doc, distanceKm } of results) {
    payload.logger.info(
      `  ${distanceKm.toFixed(1).padStart(6)} km  ${doc.title} — ${doc.location?.placeName}, ${doc.location?.city}`,
    )
  }
}

process.exit(0)
