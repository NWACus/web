import { getPostHogQueryConfig } from '@/services/posthog/hogql'
import { AVALANCHE_CENTERS } from '@/utilities/tenancy/avalancheCenters'
import { resolveSelectedTenant } from '@/utilities/tenancy/resolveSelectedTenant'
import { TIMEZONE_OPTIONS } from '@/utilities/timezones'
import type { AdminViewServerProps } from 'payload'
import { CustomView } from '../CustomView'
import { AnalyticsDashboard } from './AnalyticsDashboard.client'

function timezoneLabel(timezone: string): string {
  return TIMEZONE_OPTIONS.find((option) => option.value === timezone)?.label ?? timezone
}

async function Body({ req }: Pick<AdminViewServerProps['initPageResult'], 'req'>) {
  const tenant = await resolveSelectedTenant(req)
  if (tenant.kind === 'none') {
    return <p className="custom-view-description">Your account has no center to report on.</p>
  }
  if (tenant.kind === 'unselected') {
    return (
      <p className="custom-view-description">
        Select a center in the sidebar to see its site analytics.
      </p>
    )
  }
  const timezone = AVALANCHE_CENTERS[tenant.slug].timezone
  return (
    <AnalyticsDashboard
      center={tenant.slug}
      centerName={tenant.name}
      timezone={timezone}
      timezoneLabel={timezoneLabel(timezone)}
      configured={getPostHogQueryConfig() !== null}
    />
  )
}

/** Plausible-style per-center site analytics, read from PostHog. See docs/admin-analytics.md. */
export async function Analytics(props: AdminViewServerProps) {
  return (
    <CustomView {...props} title="Site Analytics">
      <Body req={props.initPageResult.req} />
    </CustomView>
  )
}
