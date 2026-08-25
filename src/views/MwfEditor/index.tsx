import type { AdminViewServerProps } from 'payload'

import { byTenantRole } from '@/access/byTenantRole'
import { getTenantSlugFromCookie } from '@/utilities/tenancy/getTenantFromCookie'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { PayloadRequest } from 'payload'
import { MwfEditorClient } from './MwfEditorClient'
import { MwfListClient } from './MwfListClient'
import {
  listForecastsAction,
  loadForecastAction,
  loadGuidanceAction,
  type MwfListRow,
} from './actions'

// The MWF authoring surface (embed-generator pattern: DefaultTemplate +
// Payload UI + server actions). /admin/mwf lists the center's forecasts;
// /admin/mwf?id=N opens the editor. The whole view is gated on the tenant's
// nativeProducts.mwf Settings flag and ordinary mwfForecasts RBAC — while the
// flag is off the view reports the feature as unavailable.
export async function MwfEditor({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult

  let gateMessage: string | null = null
  let rows: MwfListRow[] | null = null
  const tenantSlug = getTenantSlugFromCookie(req.headers)
  if (!req.user) {
    gateMessage = 'Sign in to author the Mountain Weather Forecast.'
  } else if (!tenantSlug) {
    gateMessage = 'Select a center to author its Mountain Weather Forecast.'
  } else {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const accessReq = {
      user: req.user,
      payload: req.payload,
      headers: req.headers,
    } as unknown as PayloadRequest
    const allowed = await byTenantRole('read', 'mwfForecasts')({ req: accessReq })
    if (!allowed) {
      gateMessage = 'You do not have Mountain Weather Forecast access for this center.'
    } else {
      const tenants = await req.payload.find({
        collection: 'tenants',
        where: { slug: { equals: tenantSlug } },
        limit: 1,
        depth: 0,
      })
      const tenant = tenants.docs[0]
      const settings = tenant
        ? await req.payload.find({
            collection: 'settings',
            where: { tenant: { equals: tenant.id } },
            limit: 1,
            depth: 0,
          })
        : null
      if (!settings?.docs[0]?.nativeProducts?.mwf) {
        gateMessage = 'The Mountain Weather Forecast is not enabled for this center.'
      }
    }
  }

  const rawId = searchParams?.id
  const idParam = Array.isArray(rawId) ? rawId[0] : rawId
  const forecastId = idParam ? Number(idParam) : null

  let content: React.ReactNode
  if (gateMessage) {
    content = <p className="custom-view-description">{gateMessage}</p>
  } else if (forecastId) {
    const [loaded, guidance] = await Promise.all([
      loadForecastAction(forecastId),
      loadGuidanceAction(),
    ])
    content =
      'error' in loaded ? (
        <p className="custom-view-description">{loaded.error}</p>
      ) : (
        <MwfEditorClient
          initial={loaded.forecast}
          guidance={'error' in guidance ? null : guidance}
        />
      )
  } else {
    const list = await listForecastsAction()
    rows = 'error' in list ? [] : list.rows
    content =
      'error' in list ? (
        <p className="custom-view-description">{list.error}</p>
      ) : (
        <MwfListClient initialRows={rows} />
      )
  }

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter>
        <div className="py-8">
          <div className="doc-header__header">
            <h1 className="doc-header__title">Mountain Weather Forecast</h1>
          </div>
          <div className="mt-6">{content}</div>
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
