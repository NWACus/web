/**
 * Records the obs API's REST lists behind the zone tabs (Forecast-9) for one center and week, as
 * the mocked suite's fixture: `__tests__/e2e/mocks/obs/week.json`.
 *
 * Three requests per run: one zone's observations and avalanches, and a second zone's
 * observations, so the spec can show a record from another zone staying off the first zone's tab.
 * The obs API has no golden corpus (no v2→v3 parity obligation), so this is an ordinary recorded
 * fixture like SnowObs's. Records keep only the fields the cards read plus their zone: the rest
 * carries observers' names, write-ups and photographers' credits the cards never read.
 *
 *   pnpm e2e:capture-obs [CENTER] [FROM] [TO] [ZONE] [OTHER_ZONE]
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [
  center = 'snfac',
  from = '2026-02-24',
  to = '2026-03-02',
  zone = '2904',
  otherZone = '2905',
] = process.argv.slice(2)

// The URL `listUrl` in `src/services/nac/zoneObservations.ts` builds; keep the two in step.
async function list(name, zoneId) {
  const dateField = name === 'observation' ? 'start_date' : 'date'
  const params = new URLSearchParams({
    'center_id[eq]': center.toLowerCase(),
    'zone_id[in]': zoneId,
    [`${dateField}[gte]`]: from,
    [`${dateField}[lte]`]: to,
    page_size: '100',
    sort_by: dateField,
    sort_order: 'DESC',
  })
  const res = await fetch(`https://api.avalanche.org/obs/v1/public/${name}/list/?${params}`, {
    headers: { origin: 'https://avy-fx.org' },
  })
  if (!res.ok) throw new Error(`obs API answered ${res.status} for ${name} in zone ${zoneId}`)
  const body = await res.json()
  if (body.pages > 1) throw new Error(`${name} in zone ${zoneId} has more than one page`)
  return body.results
}

const pick = (record, keys) => Object.fromEntries(keys.map((k) => [k, record[k] ?? null]))
const scrubMedia = (media) => (media ?? []).map(({ type, url }) => ({ type, url }))

const RECORD = ['id', 'created_at', 'center_id', 'zone_id', 'zone_name', 'location_name']

function scrubObservation(obs) {
  // Only the three signs the cards read.
  const { cracking, collapsing, avalanches_observed } = obs.instability ?? {}
  return {
    ...pick(obs, ['start_date', ...RECORD, 'observer_type', 'organization']),
    instability: { cracking, collapsing, avalanches_observed },
    media: scrubMedia(obs.media),
    avalanches: (obs.avalanches ?? []).map((a) => ({ media: scrubMedia(a.media) })),
  }
}

function scrubAvalanche(avy) {
  return {
    ...pick(avy, ['date', ...RECORD, 'number', 'aspect', 'elevation', 'd_size', 'trigger']),
    media: scrubMedia(avy.media),
  }
}

const [observations, avalanches, otherObservations] = await Promise.all([
  list('observation', zone),
  list('avalanche_observation', zone),
  list('observation', otherZone),
])

const fixture = {
  captured: { center, from, to, zones: [zone, otherZone] },
  observations: [...observations, ...otherObservations].map(scrubObservation),
  avalanches: avalanches.map(scrubAvalanche),
}

const out = join(import.meta.dirname, '../../__tests__/e2e/mocks/obs/week.json')
writeFileSync(out, `${JSON.stringify(fixture, null, 2)}\n`)
console.log(
  `zone ${zone}: ${observations.length} observations, ${avalanches.length} avalanches; ` +
    `zone ${otherZone}: ${otherObservations.length} observations → ${out}`,
)
