/**
 * Records the obs API's answer to the zone tabs' query (Forecast-9) for one center and week, as
 * the mocked suite's fixture: `__tests__/e2e/mocks/obs/graphql-week.json`.
 *
 * One request per run. The obs API has no golden corpus (no v2→v3 parity obligation), so this is
 * an ordinary recorded fixture like SnowObs's. Media items keep only `type` and `url`: the rest
 * carries photographers' names, captions and titles the cards never read.
 *
 *   pnpm e2e:capture-obs [CENTER] [FROM] [TO]
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [center = 'SNFAC', from = '2026-02-24', to = '2026-03-02'] = process.argv.slice(2)

// The query `src/services/nac/zoneObservations.ts` sends; keep the two in step.
const query = `{
  getObservationList(centerId: "${center}", startDate: "${from}", endDate: "${to}") {
    id startDate locationName locationPoint { lat lng } observerType organization instability media
    avalanches { media }
  }
  getAvalancheObservationList(centerId: "${center}", startDate: "${from}", endDate: "${to}") {
    id date locationName locationPoint { lat lng } number aspect elevation dSize trigger media
  }
}`

const res = await fetch('https://api.avalanche.org/obs/v1/public/graphql', {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: 'https://avy-fx.org' },
  body: JSON.stringify({ query }),
})
if (!res.ok) throw new Error(`obs API answered ${res.status}`)
const body = await res.json()

const scrubMedia = (media) => (media ?? []).map(({ type, url }) => ({ type, url }))

const { getObservationList, getAvalancheObservationList } = body.data
for (const obs of getObservationList) {
  obs.media = scrubMedia(obs.media)
  obs.avalanches = (obs.avalanches ?? []).map((a) => ({ media: scrubMedia(a.media) }))
  // Only the three signs the cards read.
  const { cracking, collapsing, avalanches_observed } = obs.instability ?? {}
  obs.instability = { cracking, collapsing, avalanches_observed }
}
for (const avy of getAvalancheObservationList) avy.media = scrubMedia(avy.media)

const out = join(import.meta.dirname, '../../__tests__/e2e/mocks/obs/graphql-week.json')
writeFileSync(out, `${JSON.stringify({ captured: { center, from, to }, ...body }, null, 2)}\n`)
console.log(
  `${getObservationList.length} observations, ${getAvalancheObservationList.length} avalanches → ${out}`,
)
