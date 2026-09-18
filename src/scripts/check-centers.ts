/**
 * Checks AVALANCHE_CENTERS against the NAC center metadata and AFP capabilities APIs.
 *
 * Fails when a listed center is missing from the AFP, its metadata doesn't parse with
 * `avalancheCenterSchema`, or its timezone differs. AFP centers we don't list are reported as
 * candidates, not failures. Run with `pnpm check:centers` when adding or changing a center.
 */
import {
  allAvalancheCenterCapabilitiesSchema,
  avalancheCenterSchema,
  type AvalancheCenterCapabilities,
} from '@/services/nac/types/schemas'
import {
  AVALANCHE_CENTERS,
  VALID_TENANT_SLUGS,
  type ValidTenantSlug,
} from '@/utilities/tenancy/avalancheCenters'
import 'dotenv/config'
import type { z } from 'zod'

const nacHost = process.env.NAC_HOST || 'https://api.avalanche.org'
const afpHost = process.env.AFP_HOST || 'https://forecasts.avalanche.org'

// DVAC is the template tenant and shares NWAC's upstream data.
const nacCenterId = (slug: string) => (slug === 'dvac' ? 'NWAC' : slug.toUpperCase())

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`${url} responded ${res.status} ${res.statusText}`)
  }
  return res.json()
}

async function fetchAfpCenters(): Promise<AvalancheCenterCapabilities[]> {
  const data = await fetchJson(`${afpHost}?rest_route=/v1/public/avalanche-centers`)
  return allAvalancheCenterCapabilitiesSchema.parse(data).centers
}

function describeIssues(error: z.ZodError): string {
  const issues = error.issues.map(
    (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
  )
  const more = issues.length > 3 ? ` (+${issues.length - 3} more)` : ''
  return issues.slice(0, 3).join('; ') + more
}

async function fetchMetadata(centerId: string) {
  const data = await fetchJson(`${nacHost}/v2/public/avalanche-center/${centerId}`)
  return avalancheCenterSchema.safeParse(data)
}

/** Resolves to a problem description, or null when the listed center checks out. */
async function checkListedCenter(slug: ValidTenantSlug, afpIds: Set<string>) {
  const centerId = nacCenterId(slug)
  if (!afpIds.has(centerId)) {
    return `${centerId} is not in the AFP centers list, so every platform reads as off`
  }

  const parsed = await fetchMetadata(centerId)
  if (!parsed.success) {
    return `metadata doesn't match avalancheCenterSchema: ${describeIssues(parsed.error)}`
  }

  const expected = AVALANCHE_CENTERS[slug].timezone
  if (parsed.data.timezone !== expected) {
    return `AVALANCHE_CENTERS has ${expected}, NAC reports ${parsed.data.timezone}`
  }

  return null
}

async function describeCandidate({ id, platforms }: AvalancheCenterCapabilities) {
  const enabled = Object.entries(platforms)
    .filter(([, on]) => on)
    .map(([platform]) => platform)
  const parsed = await fetchMetadata(id)
  const status = parsed.success
    ? `${parsed.data.name}, ${parsed.data.timezone}`
    : `metadata doesn't parse: ${describeIssues(parsed.error)}`
  return `[${enabled.join(', ') || 'no platforms'}] ${status}`
}

function settledMessage(label: string, result: PromiseSettledResult<string | null>) {
  if (result.status === 'rejected') {
    return `${label}: ${result.reason instanceof Error ? result.reason.message : result.reason}`
  }
  return result.value ? `${label}: ${result.value}` : null
}

async function main() {
  const afpCenters = await fetchAfpCenters()
  const afpIds = new Set(afpCenters.map((center) => center.id))

  const listed = await Promise.allSettled(
    VALID_TENANT_SLUGS.map((slug) => checkListedCenter(slug, afpIds)),
  )
  const problems = listed
    .map((result, i) => settledMessage(VALID_TENANT_SLUGS[i], result))
    .filter((message) => message !== null)
  console.log(`Checked ${VALID_TENANT_SLUGS.length} centers in AVALANCHE_CENTERS.`)

  const listedIds = new Set(VALID_TENANT_SLUGS.map(nacCenterId))
  const candidates = afpCenters.filter((center) => !listedIds.has(center.id))
  const described = await Promise.allSettled(candidates.map(describeCandidate))

  if (candidates.length > 0) {
    console.log('\nAFP centers not in AVALANCHE_CENTERS (candidates, not failures):')
    described.forEach((result, i) =>
      console.log(`  - ${settledMessage(candidates[i].id, result) ?? candidates[i].id}`),
    )
  }

  if (problems.length > 0) {
    console.error('\nCenter check failed:')
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }

  console.log('\nAll listed centers match the NAC and AFP APIs.')
}

main()
