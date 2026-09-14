/**
 * Verifies the hardcoded center timezones in AVALANCHE_CENTERS against the NAC center metadata API.
 *
 * Run with `pnpm check:center-timezones` when adding or changing a center. Exits non-zero on any
 * mismatch or unreachable center.
 */
import {
  AVALANCHE_CENTERS,
  VALID_TENANT_SLUGS,
  type ValidTenantSlug,
} from '@/utilities/tenancy/avalancheCenters'
import 'dotenv/config'
import { z } from 'zod'

const host = process.env.NAC_HOST || 'https://api.avalanche.org'

// DVAC is the template tenant and shares NWAC's upstream data.
const nacCenterId = (slug: string) => (slug === 'dvac' ? 'NWAC' : slug.toUpperCase())

const centerTimezoneSchema = z.object({ timezone: z.string() })

async function fetchNacTimezone(slug: string): Promise<string> {
  const res = await fetch(`${host}/v2/public/avalanche-center/${nacCenterId(slug)}`)
  if (!res.ok) {
    throw new Error(`NAC responded ${res.status} ${res.statusText}`)
  }
  return centerTimezoneSchema.parse(await res.json()).timezone
}

/** Resolves to a problem description, or null when the center's timezone checks out. */
async function checkCenter(slug: ValidTenantSlug): Promise<string | null> {
  const expected = AVALANCHE_CENTERS[slug].timezone
  const actual = await fetchNacTimezone(slug)
  if (actual !== expected) {
    return `AVALANCHE_CENTERS has ${expected}, NAC reports ${actual}`
  }
  console.log(`${slug}: ${actual}`)
  return null
}

function problemFor(slug: ValidTenantSlug, result: PromiseSettledResult<string | null>): string[] {
  if (result.status === 'rejected') {
    return [`${slug}: ${result.reason instanceof Error ? result.reason.message : result.reason}`]
  }
  return result.value ? [`${slug}: ${result.value}`] : []
}

async function main() {
  const settled = await Promise.allSettled(VALID_TENANT_SLUGS.map(checkCenter))
  const problems = settled.flatMap((result, i) => problemFor(VALID_TENANT_SLUGS[i], result))

  if (problems.length > 0) {
    console.error('\nCenter timezone check failed:')
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }

  console.log('\nAll center timezones match the NAC API.')
}

main()
