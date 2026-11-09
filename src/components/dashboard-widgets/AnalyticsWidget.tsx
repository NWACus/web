import { getCachedCenterAnalytics } from '@/services/posthog/getCachedCenterAnalytics'
import { getPostHogQueryConfig } from '@/services/posthog/hogql'
import { ValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import type { Payload, WidgetServerProps } from 'payload'
import { Suspense } from 'react'
import { AnalyticsTiles } from './AnalyticsTiles'
import { resolveWidgetTenant, type WidgetTenant } from './resolveWidgetTenant'

const MUTED = 'text-[var(--theme-elevation-600)]'

function Note({ children }: { children: string }) {
  return <p className={`m-0 text-sm ${MUTED}`}>{children}</p>
}

async function AnalyticsData({ slug, payload }: { slug: ValidTenantSlug; payload: Payload }) {
  try {
    const data = await getCachedCenterAnalytics(slug)
    return <AnalyticsTiles data={data} />
  } catch (err) {
    payload.logger.warn({ err, slug }, 'Site analytics widget could not load PostHog data')
    return <Note>Site analytics are unavailable right now. Try again in a few minutes.</Note>
  }
}

function WidgetBody({ tenant, payload }: { tenant: WidgetTenant; payload: Payload }) {
  if (tenant.kind !== 'selected') {
    return <Note>Select a center in the sidebar to see its site analytics.</Note>
  }
  if (!getPostHogQueryConfig()) {
    return <Note>Site analytics are not connected in this environment.</Note>
  }
  return (
    <Suspense fallback={<Note>Loading site analytics…</Note>}>
      <AnalyticsData slug={tenant.slug} payload={payload} />
    </Suspense>
  )
}

/**
 * Per-center site usage from PostHog on the admin landing page, so staff never need a PostHog
 * login. Data is queried server-side and cached per center; see docs/admin-analytics.md.
 */
export async function AnalyticsWidget({ req }: WidgetServerProps) {
  const tenant = await resolveWidgetTenant(req)
  if (tenant.kind === 'none') return null

  return (
    <div className="card mb-4 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="m-0">Site analytics{tenant.kind === 'selected' && `: ${tenant.name}`}</h3>
        <Note>Last 30 days, compared with the 30 days before. Updated about once an hour.</Note>
      </div>
      <WidgetBody tenant={tenant} payload={req.payload} />
    </div>
  )
}
