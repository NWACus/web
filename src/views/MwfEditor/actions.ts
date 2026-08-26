'use server'

// Server actions backing the MWF authoring view. Every action authorizes the
// same way: authenticated admin user, tenant resolved from the admin tenant
// cookie, MWF feature flag on for that tenant, and mwfForecasts access via
// the ordinary tenant-role RBAC.
import { byTenantRole } from '@/access/byTenantRole'
import type { MwfForecast as MwfForecastDoc, Setting } from '@/payload-types'
import { isStale, type GuidanceArtifact } from '@/services/mwf/guidance'
import { loadCached, refreshGuidance, type GuidanceTable } from '@/services/mwf/guidanceCache'
import {
  SerializedForecast,
  airfireCodeMap,
  emptyExtendedSnowLevel,
  emptyForecast,
  hydrateForecast,
  pointsFromSettings,
  serializeForecast,
  shiftBodyToAnchor,
  withinCopyForwardHorizon,
  zonesFromSettings,
} from '@/utilities/mwf/mwfData'
import {
  getCurrentVisible,
  publishDraft,
  removeForecast,
  upsertDraft,
} from '@/utilities/mwf/workflow'
import { getTenantSlugFromCookie } from '@/utilities/tenancy/getTenantFromCookie'
import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, type Payload, type PayloadRequest } from 'payload'

export interface MwfListRow {
  id: number
  serviceDate: string
  issuance: 'morning' | 'afternoon'
  status: 'draft' | 'published' | 'withdrawn'
  revision: number
  isCorrection: boolean
  authorName: string | null
  issuedAt: string | null
  updatedAt: string
}

interface AuthContext {
  payload: Payload
  tenantId: number
  userId: number
  mwfConfig: NonNullable<Setting['mwf']>
}

async function authorize(): Promise<AuthContext | { error: string }> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
  if (!user) return { error: 'Unauthorized' }

  const tenantSlug = getTenantSlugFromCookie(requestHeaders)
  if (!tenantSlug) return { error: 'Select a center first' }
  const tenants = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: tenantSlug } },
    limit: 1,
    depth: 0,
  })
  const tenant = tenants.docs[0]
  if (!tenant) return { error: 'Unknown center' }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const accessReq = { user, payload, headers: requestHeaders } as unknown as PayloadRequest
  const allowed = await byTenantRole('update', 'mwfForecasts')({ req: accessReq })
  if (!allowed) return { error: 'You do not have MWF authoring access for this center' }

  const settings = await payload.find({
    collection: 'settings',
    where: { tenant: { equals: tenant.id } },
    limit: 1,
    depth: 0,
  })
  const setting = settings.docs[0]
  if (!setting?.nativeProducts?.mwf) {
    return { error: 'The Mountain Weather Forecast is not enabled for this center' }
  }
  return { payload, tenantId: tenant.id, userId: user.id, mwfConfig: setting.mwf ?? {} }
}

function toListRow(doc: MwfForecastDoc, authorName: string | null): MwfListRow {
  return {
    id: doc.id,
    serviceDate: doc.serviceDate,
    issuance: doc.issuance,
    status: doc.status,
    revision: doc.revision,
    isCorrection: doc.supersedes != null,
    authorName,
    issuedAt: doc.issuedAt ?? null,
    updatedAt: doc.updatedAt,
  }
}

async function authorNames(payload: Payload, docs: MwfForecastDoc[]): Promise<Map<number, string>> {
  const ids = Array.from(
    new Set(
      docs
        .map((d) => (typeof d.author === 'number' ? d.author : d.author?.id))
        .filter((id): id is number => id != null),
    ),
  )
  if (!ids.length) return new Map()
  const { docs: users } = await payload.find({
    collection: 'users',
    where: { id: { in: ids } },
    depth: 0,
    pagination: false,
  })
  return new Map(users.map((u) => [u.id, u.name ?? u.email]))
}

// The forecasts list: every non-deleted row for the center, newest touch
// first — drafts, published revisions, corrections, and withdrawals.
export async function listForecastsAction(): Promise<{ rows: MwfListRow[] } | { error: string }> {
  const auth = await authorize()
  if ('error' in auth) return auth
  const { docs } = await auth.payload.find({
    collection: 'mwfForecasts',
    where: { tenant: { equals: auth.tenantId } },
    sort: '-updatedAt',
    depth: 0,
    pagination: false,
  })
  const names = await authorNames(auth.payload, docs)
  return {
    rows: docs.map((d) =>
      toListRow(
        d,
        names.get(typeof d.author === 'number' ? d.author : (d.author?.id ?? -1)) ?? null,
      ),
    ),
  }
}

// Start a new issuance draft for a service date, pre-populated from the
// newest visible forecast with every value re-anchored to the new Day 1 —
// a PM-to-next-AM copy keeps values on the same absolute half-day.
export async function createForecastAction({
  issuance,
  serviceDate,
}: {
  issuance: 'morning' | 'afternoon'
  serviceDate: string
}): Promise<{ id: number } | { error: string }> {
  const auth = await authorize()
  if ('error' in auth) return auth
  const zones = zonesFromSettings(auth.mwfConfig.zones ?? [])
  const points = pointsFromSettings(auth.mwfConfig.points ?? [])
  const extendedZones = zones.filter((z) =>
    (auth.mwfConfig.extendedSnowLevelZones ?? []).some((row) => row.zoneCode === z.id),
  )

  const seed = emptyForecast(zones, points, issuance)
  seed.meta.initialDate = serviceDate
  seed.meta.issued = `${serviceDate}T${issuance === 'afternoon' ? '15' : '07'}:00`
  if (issuance === 'afternoon') {
    seed.extendedSnowLevel = emptyExtendedSnowLevel(extendedZones)
  }

  const previous = await getCurrentVisible(auth.payload, { tenantId: auth.tenantId })
  if (previous?.body && withinCopyForwardHorizon(previous.serviceDate, serviceDate)) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const prevBody = previous.body as Partial<SerializedForecast>
    const shifted = shiftBodyToAnchor(
      // hydrate onto a same-shape scaffold anchored at the PREVIOUS forecast's
      // day 1, then re-key to the new anchor
      (() => {
        const scaffold = emptyForecast(zones, points, issuance)
        if (issuance === 'afternoon')
          scaffold.extendedSnowLevel = emptyExtendedSnowLevel(extendedZones)
        hydrateForecast(scaffold, prevBody)
        scaffold.meta.type = issuance
        return scaffold
      })(),
      serviceDate,
    )
    shifted.meta.issued = seed.meta.issued
    hydrateForecast(seed, serializeForecast(shifted))
    seed.meta.initialDate = serviceDate
  }

  const doc = await upsertDraft(auth.payload, {
    tenantId: auth.tenantId,
    issuance,
    issuedAt: seed.meta.issued,
    body: serializeForecast(seed),
    authorId: auth.userId,
  })
  return { id: doc.id }
}

export interface LoadedForecast {
  id: number
  status: 'draft' | 'published' | 'withdrawn'
  issuance: 'morning' | 'afternoon'
  serviceDate: string
  issuedAt: string | null
  revision: number
  isCorrection: boolean
  authorName: string | null
  body: Partial<SerializedForecast> | null
  config: {
    zones: { id: string; name: string }[]
    points: { code: string; name: string; zone: string; lat: number | null; lng: number | null }[]
    extendedZoneIds: string[]
    airfireCodeMap: Record<string, string>
  }
  // The newest visible forecast other than this one, its body re-anchored to
  // this forecast's Day 1 — feeds the Prev reference column.
  previousBody: Partial<SerializedForecast> | null
  previousLabel: string | null
}

export async function loadForecastAction(
  id: number,
): Promise<{ forecast: LoadedForecast } | { error: string }> {
  const auth = await authorize()
  if ('error' in auth) return auth
  const { docs } = await auth.payload.find({
    collection: 'mwfForecasts',
    where: { and: [{ id: { equals: id } }, { tenant: { equals: auth.tenantId } }] },
    limit: 1,
    depth: 0,
  })
  const doc = docs[0]
  if (!doc) return { error: 'Forecast not found' }

  let authorName: string | null = null
  const authorId = typeof doc.author === 'number' ? doc.author : doc.author?.id
  if (authorId != null) {
    const users = await auth.payload.find({
      collection: 'users',
      where: { id: { equals: authorId } },
      limit: 1,
      depth: 0,
    })
    authorName = users.docs[0]?.name ?? users.docs[0]?.email ?? null
  }

  const zones = zonesFromSettings(auth.mwfConfig.zones ?? [])
  const points = pointsFromSettings(auth.mwfConfig.points ?? [])
  let previousBody: Partial<SerializedForecast> | null = null
  let previousLabel: string | null = null
  const previous = await getCurrentVisible(auth.payload, { tenantId: auth.tenantId })
  // The Prev reference obeys the same copy-forward horizon as pre-population:
  // an adjacent issuance is a useful baseline, a months-old one is noise.
  if (
    previous &&
    previous.id !== doc.id &&
    previous.body &&
    withinCopyForwardHorizon(previous.serviceDate, doc.serviceDate)
  ) {
    const scaffold = emptyForecast(zones, points, previous.issuance)
    scaffold.extendedSnowLevel = emptyExtendedSnowLevel(zones)
    scaffold.meta.initialDate = previous.serviceDate
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    hydrateForecast(scaffold, previous.body as Partial<SerializedForecast>)
    scaffold.meta.initialDate = previous.serviceDate
    previousBody = serializeForecast(shiftBodyToAnchor(scaffold, doc.serviceDate))
    previousLabel = `${previous.serviceDate} ${previous.issuance}`
  }

  return {
    forecast: {
      id: doc.id,
      status: doc.status,
      issuance: doc.issuance,
      serviceDate: doc.serviceDate,
      issuedAt: doc.issuedAt ?? null,
      revision: doc.revision,
      isCorrection: doc.supersedes != null,
      authorName,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      body: (doc.body ?? null) as Partial<SerializedForecast> | null,
      config: {
        zones,
        points,
        extendedZoneIds: (auth.mwfConfig.extendedSnowLevelZones ?? []).map((r) => r.zoneCode),
        airfireCodeMap: airfireCodeMap(auth.mwfConfig.zones ?? []),
      },
      previousBody,
      previousLabel,
    },
  }
}

// Autosave. Saving over a published forecast silently opens a correction
// draft — the returned id/revision may therefore differ from the request; the
// editor adopts them.
export async function saveDraftAction({
  id,
  issuance,
  issuedAt,
  body,
}: {
  id: number
  issuance: 'morning' | 'afternoon'
  issuedAt: string | null
  body: Partial<SerializedForecast>
}): Promise<
  { id: number; status: 'draft'; revision: number; isCorrection: boolean } | { error: string }
> {
  const auth = await authorize()
  if ('error' in auth) return auth
  const doc = await upsertDraft(auth.payload, {
    tenantId: auth.tenantId,
    id,
    issuance,
    issuedAt,
    body,
    authorId: auth.userId,
  })
  return {
    id: doc.id,
    status: 'draft',
    revision: doc.revision,
    isCorrection: doc.supersedes != null,
  }
}

// Housekeeping from the list: hard-delete drafts, withdraw published rows.
export async function removeForecastAction(
  id: number,
): Promise<{ removed: boolean } | { error: string }> {
  const auth = await authorize()
  if ('error' in auth) return auth
  const removed = await removeForecast(auth.payload, { id, tenantId: auth.tenantId })
  return { removed: removed != null }
}

// Guarded publish (full publish-flow UI lands with the publish milestone;
// this is the workflow-backed action it will call).
export async function publishForecastAction(
  id: number,
): Promise<{ published: boolean } | { error: string }> {
  const auth = await authorize()
  if ('error' in auth) return auth
  const doc = await publishDraft(auth.payload, { id, tenantId: auth.tenantId })
  if (!doc) return { error: 'Publish blocked: the slot already has an operative forecast' }
  return { published: true }
}

export interface GuidanceBundle {
  precip: GuidanceArtifact | null
  temps: GuidanceArtifact | null
  winds: GuidanceArtifact | null
  stale: boolean
}

// The tenant's cached guidance artifacts, refreshing any that are due (the
// cron owns the schedule; this keeps a first load from being empty). The
// bundle is stale when any table's artifact is stale or kept-last-good.
export async function loadGuidanceAction(): Promise<GuidanceBundle | { error: string }> {
  const auth = await authorize()
  if ('error' in auth) return auth
  const tables: GuidanceTable[] = ['precip', 'temps', 'winds']
  const out: Record<string, GuidanceArtifact | null> = {}
  for (const table of tables) {
    try {
      out[table] = await refreshGuidance(auth.tenantId, table, auth.mwfConfig)
    } catch {
      out[table] = loadCached(auth.tenantId, table)
    }
  }
  const now = new Date()
  const artifacts = tables.map((t) => out[t]).filter((a): a is GuidanceArtifact => a != null)
  return {
    precip: out.precip,
    temps: out.temps,
    winds: out.winds,
    stale: artifacts.length === 0 || artifacts.some((a) => isStale(a, now)),
  }
}
