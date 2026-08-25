// The MWF workflow state machine, exercised end-to-end over an in-memory
// Payload stand-in that runs the REAL collection hooks (workflowGuards) on
// every write — so these tests cover the workflow module and the storage
// invariants together: draft lifecycle, correction pinning, the publish
// guard, snapshot freezing, embargo, withdrawal semantics, and deletes.
import {
  enforceWorkflowInvariants,
  guardDelete,
} from '@/collections/MwfForecasts/hooks/workflowGuards'
import {
  getCurrentVisible,
  getPublishedById,
  listVisibleForDate,
  publishDraft,
  removeForecast,
  upsertDraft,
} from '@/utilities/mwf/workflow'
import type { SerializedForecast } from '@/utilities/mwf/mwfData'
import type { Payload } from 'payload'

type Doc = Record<string, unknown> & { id: number }

interface Where {
  and?: Where[]
  id?: { equals?: number; in?: number[] }
  tenant?: { equals?: number }
}

function matches(doc: Doc, where: Where | undefined): boolean {
  if (!where) return true
  if (where.and) return where.and.every((w) => matches(doc, w))
  if (where.id?.equals != null && doc.id !== where.id.equals) return false
  if (where.id?.in && !where.id.in.includes(doc.id)) return false
  if (where.tenant?.equals != null && doc.tenant !== where.tenant.equals) return false
  return true
}

// A minimal Payload local API over in-memory collections. Writes to
// mwfForecasts run the real beforeChange/beforeDelete hooks. `findDelayMs`
// lets the race test widen the guard's read-check window.
function fakePayload({ findDelayMs = 0 } = {}) {
  const store: Record<string, Doc[]> = { mwfForecasts: [], settings: [] }
  let nextId = 1
  const clone = (d: Doc): Doc => structuredClone(d)

  const self = {
    store,
    async find({ collection, where }: { collection: string; where?: Where }) {
      if (findDelayMs) await new Promise((r) => setTimeout(r, findDelayMs))
      return { docs: (store[collection] ?? []).filter((d) => matches(d, where)).map(clone) }
    },
    async findByID({ collection, id }: { collection: string; id: number }) {
      const doc = (store[collection] ?? []).find((d) => d.id === id)
      return doc ? clone(doc) : null
    },
    async create({
      collection,
      data,
      context,
    }: {
      collection: string
      data: Record<string, unknown>
      context?: Record<string, unknown>
    }) {
      let payload = { ...data }
      if (collection === 'mwfForecasts') {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        payload = (await enforceWorkflowInvariants({
          data: payload,
          operation: 'create',
          req: { payload: self, context: context ?? {} },
          context: context ?? {},
        } as never)) as Record<string, unknown>
      }
      const doc: Doc = { status: 'draft', revision: 1, ...payload, id: nextId++ }
      store[collection].push(doc)
      return clone(doc)
    },
    async update({
      collection,
      id,
      data,
      context,
    }: {
      collection: string
      id: number
      data: Record<string, unknown>
      context?: Record<string, unknown>
    }) {
      const doc = (store[collection] ?? []).find((d) => d.id === id)
      if (!doc) throw new Error('not found')
      let payload = { ...data }
      if (collection === 'mwfForecasts') {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        payload = (await enforceWorkflowInvariants({
          data: payload,
          originalDoc: clone(doc),
          operation: 'update',
          req: { payload: self, context: context ?? {} },
          context: context ?? {},
        } as never)) as Record<string, unknown>
      }
      Object.assign(doc, payload)
      return clone(doc)
    },
    async delete({ collection, id }: { collection: string; id: number }) {
      if (collection === 'mwfForecasts') {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        await guardDelete({ id, req: { payload: self } } as never)
      }
      store[collection] = (store[collection] ?? []).filter((d) => d.id !== id)
    },
  }
  return self
}

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const asPayload = (fake: ReturnType<typeof fakePayload>) => fake as unknown as Payload

const TENANT = 7
const NOW = new Date('2026-08-25T18:00:00Z')

function body(initialDate = '2026-08-25'): Partial<SerializedForecast> {
  return { meta: { type: 'morning', author: '', issued: `${initialDate}T07:00`, initialDate } }
}

function seedSettings(
  fake: ReturnType<typeof fakePayload>,
  zones = [{ code: 'olympics', name: 'Olympics' }],
) {
  fake.store.settings.push({ id: 1, tenant: TENANT, mwf: { zones } })
}

describe('draft lifecycle', () => {
  it('creates a new draft at revision 1 with the service date from the body anchor', async () => {
    const fake = fakePayload()
    const doc = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      issuance: 'morning',
      body: body('2026-08-25'),
    })
    expect(doc).toMatchObject({ status: 'draft', revision: 1, serviceDate: '2026-08-25' })
  })

  it('autosaves a draft in place', async () => {
    const fake = fakePayload()
    const created = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      issuance: 'morning',
      body: body(),
    })
    const updated = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      id: created.id,
      issuance: 'morning',
      body: { ...body(), discussion: { synopsis: 'Snow.', extended: '' } },
    })
    expect(updated.id).toBe(created.id)
    expect(fake.store.mwfForecasts).toHaveLength(1)
  })

  it('editing a published forecast opens a correction pinned to the parent slot', async () => {
    const fake = fakePayload()
    seedSettings(fake)
    const draft = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      issuance: 'morning',
      body: body('2026-08-25'),
    })
    await publishDraft(asPayload(fake), { id: draft.id, tenantId: TENANT, now: NOW })
    // The client tries to drift the correction to another slot/date — ignored.
    const correction = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      id: draft.id,
      issuance: 'afternoon',
      body: body('2026-08-26'),
    })
    expect(correction).toMatchObject({
      status: 'draft',
      revision: 2,
      supersedes: draft.id,
      issuance: 'morning',
      serviceDate: '2026-08-25',
    })
  })
})

describe('publish', () => {
  it('publishes a draft, stamps issuedAt, and freezes config + structure', async () => {
    const fake = fakePayload()
    seedSettings(fake, [{ code: 'olympics', name: 'Olympics' }])
    const draft = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      issuance: 'morning',
      body: body(),
    })
    const published = await publishDraft(asPayload(fake), {
      id: draft.id,
      tenantId: TENANT,
      now: NOW,
    })
    expect(published).toMatchObject({ status: 'published', issuedAt: NOW.toISOString() })
    // Later config changes must not touch the frozen snapshot.
    fake.store.settings[0].mwf = { zones: [{ code: 'renamed', name: 'Renamed' }] }
    const stored = fake.store.mwfForecasts[0]
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const snapshot = stored.publishSnapshot as {
      config: { zones: Array<{ code: string }> }
      structure: { issuances: { morning: { periods: string[] } } }
    }
    expect(snapshot.config.zones[0].code).toBe('olympics')
    expect(snapshot.structure.issuances.morning.periods).toEqual(['d1', 'n1', 'd2', 'n2'])
  })

  it('a second NEW forecast for an occupied slot loses the guard', async () => {
    const fake = fakePayload()
    seedSettings(fake)
    const first = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      issuance: 'morning',
      body: body(),
    })
    const second = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      issuance: 'morning',
      body: body(),
    })
    expect(
      await publishDraft(asPayload(fake), { id: first.id, tenantId: TENANT, now: NOW }),
    ).toBeTruthy()
    expect(
      await publishDraft(asPayload(fake), { id: second.id, tenantId: TENANT, now: NOW }),
    ).toBeNull()
    // A different slot publishes freely.
    const pm = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      issuance: 'afternoon',
      body: body(),
    })
    expect(
      await publishDraft(asPayload(fake), { id: pm.id, tenantId: TENANT, now: NOW }),
    ).toBeTruthy()
  })

  it('two corrections from the same parent: only the first publishes', async () => {
    const fake = fakePayload()
    seedSettings(fake)
    const draft = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      issuance: 'morning',
      body: body(),
    })
    await publishDraft(asPayload(fake), { id: draft.id, tenantId: TENANT, now: NOW })
    const c1 = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      id: draft.id,
      issuance: 'morning',
      body: body(),
    })
    const c2 = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      id: draft.id,
      issuance: 'morning',
      body: body(),
    })
    expect(
      await publishDraft(asPayload(fake), { id: c1.id, tenantId: TENANT, now: NOW }),
    ).toBeTruthy()
    // c2's parent is no longer the slot head — it must not silently shadow c1.
    expect(
      await publishDraft(asPayload(fake), { id: c2.id, tenantId: TENANT, now: NOW }),
    ).toBeNull()
  })

  it('a correction of a withdrawn issuance never resurfaces it; a fresh forecast can take the slot', async () => {
    const fake = fakePayload()
    seedSettings(fake)
    const draft = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      issuance: 'morning',
      body: body(),
    })
    await publishDraft(asPayload(fake), { id: draft.id, tenantId: TENANT, now: NOW })
    const correction = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      id: draft.id,
      issuance: 'morning',
      body: body(),
    })
    await removeForecast(asPayload(fake), { id: draft.id, tenantId: TENANT, now: NOW })
    expect(
      await publishDraft(asPayload(fake), { id: correction.id, tenantId: TENANT, now: NOW }),
    ).toBeNull()
    const fresh = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      issuance: 'morning',
      body: body(),
    })
    expect(
      await publishDraft(asPayload(fake), { id: fresh.id, tenantId: TENANT, now: NOW }),
    ).toBeTruthy()
  })

  it('concurrent publishes for the same slot serialize — exactly one wins', async () => {
    const fake = fakePayload({ findDelayMs: 20 })
    seedSettings(fake)
    const a = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      issuance: 'morning',
      body: body(),
    })
    const b = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      issuance: 'morning',
      body: body(),
    })
    const [ra, rb] = await Promise.all([
      publishDraft(asPayload(fake), { id: a.id, tenantId: TENANT, now: NOW }),
      publishDraft(asPayload(fake), { id: b.id, tenantId: TENANT, now: NOW }),
    ])
    expect([ra, rb].filter(Boolean)).toHaveLength(1)
  })
})

describe('immutability at the storage boundary', () => {
  it('a direct update to a published row is rejected', async () => {
    const fake = fakePayload()
    seedSettings(fake)
    const draft = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      issuance: 'morning',
      body: body(),
    })
    await publishDraft(asPayload(fake), { id: draft.id, tenantId: TENANT, now: NOW })
    await expect(
      asPayload(fake).update({
        collection: 'mwfForecasts',
        id: draft.id,
        data: { body: { discussion: { synopsis: 'sneaky edit', extended: '' } } },
      }),
    ).rejects.toThrow(/immutable/)
  })

  it('a direct draft→published status flip without the workflow is rejected', async () => {
    const fake = fakePayload()
    const draft = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      issuance: 'morning',
      body: body(),
    })
    await expect(
      asPayload(fake).update({
        collection: 'mwfForecasts',
        id: draft.id,
        data: { status: 'published' },
      }),
    ).rejects.toThrow(/publish flow/)
  })

  it('deleting a published forecast is rejected; drafts hard-delete', async () => {
    const fake = fakePayload()
    seedSettings(fake)
    const draft = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      issuance: 'morning',
      body: body(),
    })
    await publishDraft(asPayload(fake), { id: draft.id, tenantId: TENANT, now: NOW })
    await expect(
      asPayload(fake).delete({ collection: 'mwfForecasts', id: draft.id }),
    ).rejects.toThrow(/withdrawn, not deleted/)

    const scratch = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      issuance: 'afternoon',
      body: body(),
    })
    expect(await removeForecast(asPayload(fake), { id: scratch.id, tenantId: TENANT })).toBe(
      scratch.id,
    )
    expect(fake.store.mwfForecasts.find((d) => d.id === scratch.id)).toBeUndefined()
  })
})

describe('withdrawal and public reads', () => {
  async function publishedPair(fake: ReturnType<typeof fakePayload>) {
    seedSettings(fake)
    const am = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      issuance: 'morning',
      issuedAt: '2026-08-25T14:00:00.000Z',
      body: body(),
    })
    await publishDraft(asPayload(fake), { id: am.id, tenantId: TENANT, now: NOW })
    const pm = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      issuance: 'afternoon',
      issuedAt: '2026-08-25T15:00:00.000Z',
      body: body(),
    })
    await publishDraft(asPayload(fake), { id: pm.id, tenantId: TENANT, now: NOW })
    return { am, pm }
  }

  it('stacks AM+PM for the date; withdrawing the PM falls back to the AM', async () => {
    const fake = fakePayload()
    const { am, pm } = await publishedPair(fake)
    const later = new Date('2026-08-25T20:00:00Z')
    let visible = await listVisibleForDate(asPayload(fake), { tenantId: TENANT, now: later })
    expect(visible.map((d) => d.id)).toEqual([pm.id, am.id])

    expect(await removeForecast(asPayload(fake), { id: pm.id, tenantId: TENANT, now: later })).toBe(
      pm.id,
    )
    visible = await listVisibleForDate(asPayload(fake), { tenantId: TENANT, now: later })
    expect(visible.map((d) => d.id)).toEqual([am.id])
    // Withdrawing twice is a no-op signalled by null.
    expect(
      await removeForecast(asPayload(fake), { id: pm.id, tenantId: TENANT, now: later }),
    ).toBeNull()
  })

  it('a scheduled publish stays embargoed until its issue time', async () => {
    const fake = fakePayload()
    seedSettings(fake)
    const draft = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      issuance: 'morning',
      issuedAt: '2026-08-25T22:00:00.000Z',
      body: body(),
    })
    await publishDraft(asPayload(fake), { id: draft.id, tenantId: TENANT, now: NOW })
    expect(await getCurrentVisible(asPayload(fake), { tenantId: TENANT, now: NOW })).toBeNull()
    expect(
      await getPublishedById(asPayload(fake), { tenantId: TENANT, id: draft.id, now: NOW }),
    ).toBeNull()
    const later = new Date('2026-08-25T23:00:00Z')
    expect((await getCurrentVisible(asPayload(fake), { tenantId: TENANT, now: later }))?.id).toBe(
      draft.id,
    )
    expect(
      (await getPublishedById(asPayload(fake), { tenantId: TENANT, id: draft.id, now: later }))?.id,
    ).toBe(draft.id)
  })

  it('superseded revisions stay fetchable by id (archive permalinks)', async () => {
    const fake = fakePayload()
    const { am } = await publishedPair(fake)
    const correction = await upsertDraft(asPayload(fake), {
      tenantId: TENANT,
      id: am.id,
      issuance: 'morning',
      body: body(),
    })
    const later = new Date('2026-08-25T20:00:00Z')
    await publishDraft(asPayload(fake), { id: correction.id, tenantId: TENANT, now: later })
    expect(
      (await getPublishedById(asPayload(fake), { tenantId: TENANT, id: am.id, now: later }))?.id,
    ).toBe(am.id)
  })
})
