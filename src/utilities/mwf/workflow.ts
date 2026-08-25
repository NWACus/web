// MWF workflow operations over Payload's local API — a full port of
// products-api's crud_mwf_forecast.py lifecycle: drafts autosave in place,
// published rows are immutable, corrections are new drafts pinned to their
// parent's slot, publish is guarded per (tenant, service date, issuance) and
// freezes the tenant's MWF config + product structure into the row, drafts
// hard-delete, published rows withdraw softly.
//
// Chain-head visibility rules live in ./chain (pure, unit-tested); this
// module wires them to storage. Collection hooks (see
// collections/MwfForecasts/hooks) enforce the same invariants at the storage
// boundary; the WORKFLOW_CONTEXT flag marks this module's own transitions so
// the hooks let them through.
import type { MwfForecast as MwfForecastDoc, Setting } from '@/payload-types'
import type { Payload } from 'payload'
import { ChainRow, latestVisibleHead, operativeSlotHead, visibleForDate } from './chain'
import { SerializedForecast } from './mwfData'
import { MWF_STRUCTURE } from './structure'

export const WORKFLOW_CONTEXT = { mwfWorkflow: true }

export interface UpsertDraftArgs {
  tenantId: number
  id?: number
  issuance: 'morning' | 'afternoon'
  issuedAt?: string | null
  body: Partial<SerializedForecast> | null
  authorId?: number | null
}

const relationId = (rel: number | { id: number } | null | undefined): number | null => {
  if (rel == null) return null
  return typeof rel === 'number' ? rel : rel.id
}

export function toChainRow(doc: MwfForecastDoc): ChainRow {
  return {
    id: doc.id,
    status: doc.status,
    issuance: doc.issuance,
    serviceDate: doc.serviceDate,
    issuedAt: doc.issuedAt ?? null,
    withdrawnAt: doc.withdrawnAt ?? null,
    revision: doc.revision,
    supersedes: relationId(doc.supersedes),
  }
}

// Every row for the tenant, lean (depth 0). The chain math happens in TS.
export async function chainRowsFor(payload: Payload, tenantId: number): Promise<ChainRow[]> {
  const { docs } = await payload.find({
    collection: 'mwfForecasts',
    where: { tenant: { equals: tenantId } },
    depth: 0,
    pagination: false,
  })
  return docs.map(toChainRow)
}

async function findOwned(
  payload: Payload,
  id: number,
  tenantId: number,
): Promise<MwfForecastDoc | null> {
  const { docs } = await payload.find({
    collection: 'mwfForecasts',
    where: { and: [{ id: { equals: id } }, { tenant: { equals: tenantId } }] },
    depth: 0,
    limit: 1,
  })
  return docs[0] ?? null
}

// The forecast's Day 1: body.meta.initialDate, else the issued date.
export function serviceDateFrom(
  body: Partial<SerializedForecast> | null | undefined,
  issuedAt: string | null | undefined,
): string | null {
  const initial = body?.meta?.initialDate
  if (initial) return initial.slice(0, 10)
  if (issuedAt) return issuedAt.slice(0, 10)
  return null
}

// Save the working content.
// - id targets a draft row -> update it in place (autosave).
// - id targets a PUBLISHED row -> published content is immutable, so this
//   creates a correction: a new draft with revision+1 and supersedes set,
//   pinned to the parent's issuance and service date (the client's values are
//   ignored — a correction may never drift into another slot).
// - no id (or id gone) -> create a new draft row (revision 1).
export async function upsertDraft(
  payload: Payload,
  { tenantId, id, issuance, issuedAt, body, authorId }: UpsertDraftArgs,
): Promise<MwfForecastDoc> {
  const service = serviceDateFrom(body, issuedAt)

  if (id) {
    const current = await findOwned(payload, id, tenantId)
    if (current && current.status === 'draft') {
      const pinned = relationId(current.supersedes) != null
      return payload.update({
        collection: 'mwfForecasts',
        id: current.id,
        data: {
          issuance: pinned ? current.issuance : issuance,
          serviceDate: (pinned ? current.serviceDate : service) ?? current.serviceDate,
          issuedAt: issuedAt ?? current.issuedAt,
          body,
          author: authorId ?? undefined,
        },
        depth: 0,
      })
    }
    if (current && current.status === 'published') {
      return payload.create({
        collection: 'mwfForecasts',
        data: {
          tenant: tenantId,
          status: 'draft',
          issuance: current.issuance,
          serviceDate: current.serviceDate,
          issuedAt: issuedAt ?? current.issuedAt,
          body,
          author: authorId ?? undefined,
          revision: current.revision + 1,
          supersedes: current.id,
          source: 'native',
        },
        depth: 0,
      })
    }
  }

  return payload.create({
    collection: 'mwfForecasts',
    data: {
      tenant: tenantId,
      status: 'draft',
      issuance,
      serviceDate: service ?? new Date().toISOString().slice(0, 10),
      issuedAt: issuedAt ?? null,
      body,
      author: authorId ?? undefined,
      revision: 1,
      source: 'native',
    },
    depth: 0,
  })
}

// --- Publish ---------------------------------------------------------------
// Publishes are serialized per (tenant, service date, issuance) with an
// in-process lock so two publishers for the same slot cannot both pass the
// guard: the second waits and re-reads the committed head. Adequate for the
// single-server local proof (SQLite also single-writes); a multi-instance
// deploy would move this to a database-level guard (products-api uses a
// pg advisory lock).
const slotLocks = new Map<string, Promise<unknown>>()

async function withSlotLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = slotLocks.get(key) ?? Promise.resolve()
  const run = previous.catch(() => undefined).then(fn)
  const settled = run.catch(() => undefined)
  slotLocks.set(key, settled)
  try {
    return await run
  } finally {
    // Last writer for the slot drops the entry so the map doesn't grow.
    if (slotLocks.get(key) === settled) slotLocks.delete(key)
  }
}

async function tenantMwfConfig(payload: Payload, tenantId: number): Promise<Setting['mwf']> {
  const { docs } = await payload.find({
    collection: 'settings',
    where: { tenant: { equals: tenantId } },
    depth: 0,
    limit: 1,
  })
  return docs[0]?.mwf ?? {}
}

// Issue the named draft: flip it to published (content becomes immutable).
// Enforces one operative forecast per (tenant, service date, issuance) for
// NEW forecasts; corrections publish only while their parent is still the
// slot's operative head (two corrections started from the same version can't
// both land, and a correction of a withdrawn issuance never resurfaces it).
// Freezes the tenant's MWF config and the product structure into the row.
// Returns the published doc, or null when the row is missing, isn't a draft,
// or lost to the guard.
export async function publishDraft(
  payload: Payload,
  { id, tenantId, now = new Date() }: { id: number; tenantId: number; now?: Date },
): Promise<MwfForecastDoc | null> {
  const draft = await findOwned(payload, id, tenantId)
  if (!draft || draft.status !== 'draft') return null

  const lockKey = `${tenantId}|${draft.serviceDate}|${draft.issuance}`
  return withSlotLock(lockKey, async () => {
    const rows = await chainRowsFor(payload, tenantId)
    const me = rows.find((r) => r.id === id)
    if (!me || me.status !== 'draft') return null
    const head = operativeSlotHead(rows, me.serviceDate, me.issuance)
    if (me.supersedes == null) {
      // New forecasts need a vacant slot (a withdrawn issuance vacates it).
      if (head) return null
    } else if (!head || head.id !== me.supersedes) {
      return null
    }

    const config = await tenantMwfConfig(payload, tenantId)
    return payload.update({
      collection: 'mwfForecasts',
      id,
      data: {
        status: 'published',
        issuedAt: draft.issuedAt ?? now.toISOString(),
        publishSnapshot: { config, structure: MWF_STRUCTURE },
      },
      context: WORKFLOW_CONTEXT,
      depth: 0,
    })
  })
}

// Discard a draft or withdraw a published forecast. Returns the id, or null
// when the row is missing or already withdrawn.
// Drafts are HARD-deleted: they were never public, and a withdrawn tombstone
// would otherwise become the issuance's chain head and hide the live
// published forecast. Published rows withdraw softly, stamped withdrawnAt so
// the chain can tell a withdrawal of a LIVE product (hides the issuance) from
// removal of a scheduled row that never went live (a non-event).
export async function removeForecast(
  payload: Payload,
  { id, tenantId, now = new Date() }: { id: number; tenantId: number; now?: Date },
): Promise<number | null> {
  const doc = await findOwned(payload, id, tenantId)
  if (!doc || doc.status === 'withdrawn') return null
  if (doc.status === 'draft') {
    await payload.delete({ collection: 'mwfForecasts', id, context: WORKFLOW_CONTEXT, depth: 0 })
    return id
  }
  await payload.update({
    collection: 'mwfForecasts',
    id,
    data: { status: 'withdrawn', withdrawnAt: now.toISOString() },
    context: WORKFLOW_CONTEXT,
    depth: 0,
  })
  return id
}

// --- Public reads ----------------------------------------------------------

async function docsByIds(payload: Payload, ids: number[]): Promise<MwfForecastDoc[]> {
  if (!ids.length) return []
  const { docs } = await payload.find({
    collection: 'mwfForecasts',
    where: { id: { in: ids } },
    depth: 0,
    pagination: false,
  })
  return ids
    .map((id) => docs.find((d) => d.id === id))
    .filter((d): d is MwfForecastDoc => Boolean(d))
}

// The current forecast: the newest visible chain head across service dates.
export async function getCurrentVisible(
  payload: Payload,
  { tenantId, now = new Date() }: { tenantId: number; now?: Date },
): Promise<MwfForecastDoc | null> {
  const head = latestVisibleHead(await chainRowsFor(payload, tenantId), now)
  if (!head) return null
  const [doc] = await docsByIds(payload, [head.id])
  return doc ?? null
}

// The visible issuances for a service date (default: the latest date with
// visible content), newest first — the stacked AM+PM public view.
export async function listVisibleForDate(
  payload: Payload,
  { tenantId, date, now = new Date() }: { tenantId: number; date?: string; now?: Date },
): Promise<MwfForecastDoc[]> {
  const heads = visibleForDate(await chainRowsFor(payload, tenantId), { date, now })
  return docsByIds(
    payload,
    heads.map((h) => h.id),
  )
}

// One published forecast by id (archive permalinks): superseded revisions stay
// fetchable, scheduled-future rows stay embargoed until their issue time.
export async function getPublishedById(
  payload: Payload,
  { tenantId, id, now = new Date() }: { tenantId: number; id: number; now?: Date },
): Promise<MwfForecastDoc | null> {
  const doc = await findOwned(payload, id, tenantId)
  if (!doc || doc.status !== 'published') return null
  if (!doc.issuedAt || new Date(doc.issuedAt).getTime() > now.getTime()) return null
  return doc
}
