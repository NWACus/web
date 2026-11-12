import { MemberAccount } from '@/components/Members/MemberAccount'
import { ROOT_DOMAIN } from '@/utilities/domain'
import { VALID_TENANT_SLUGS } from '@/utilities/tenancy/avalancheCenters'

export const dynamic = 'force-dynamic'

/** Apex-only Member account home (ADR 026). Links to the seeded centers for the site-session demo. */
export default function MemberAccountPage() {
  const demoCenters = VALID_TENANT_SLUGS.filter((slug) =>
    ['nwac', 'sac', 'snfac', 'dvac'].includes(slug),
  )
  return <MemberAccount centerHosts={demoCenters.map((slug) => `${slug}.${ROOT_DOMAIN}`)} />
}
