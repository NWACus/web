// The MWF product source (ADR-018-shaped adapter seam): stacked visibility
// through the chain rules, and snapshot-faithful normalization — the
// rendered config/structure come from the row's publish snapshot, never the
// center's current Settings.
import type { MwfForecast as MwfForecastDoc } from '@/payload-types'
import { createLocalPayloadMwfSource, normalizeForecast } from '@/services/products/mwf/source'
import { MWF_STRUCTURE } from '@/utilities/mwf/structure'
import { weatherForecastPageMode } from '@/utilities/mwf/weatherPageMode'
import type { Payload } from 'payload'

const NOW_PAST = '2026-08-25T14:00:00.000Z'

function doc(overrides: Partial<MwfForecastDoc>): MwfForecastDoc {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    id: 1,
    tenant: 7,
    status: 'published',
    issuance: 'morning',
    serviceDate: '2026-08-25',
    issuedAt: NOW_PAST,
    withdrawnAt: null,
    revision: 1,
    supersedes: null,
    author: null,
    source: 'native',
    body: {},
    publishSnapshot: null,
    contentHash: null,
    updatedAt: NOW_PAST,
    createdAt: NOW_PAST,
    ...overrides,
  } as MwfForecastDoc
}

interface FakeWhere {
  and?: FakeWhere[]
  id?: { equals?: number; in?: number[] }
  tenant?: { equals?: number }
}

function matches(d: MwfForecastDoc, where: FakeWhere | undefined): boolean {
  if (!where) return true
  if (where.and) return where.and.every((w) => matches(d, w))
  if (where.id?.equals != null && d.id !== where.id.equals) return false
  if (where.id?.in && !where.id.in.includes(d.id)) return false
  if (where.tenant?.equals != null && d.tenant !== where.tenant.equals) return false
  return true
}

function fakePayload(docs: MwfForecastDoc[]): Payload {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    async find({ where }: { where?: FakeWhere }) {
      return { docs: docs.filter((d) => matches(d, where)) }
    },
  } as unknown as Payload
}

describe('normalizeForecast', () => {
  it('builds config and structure from the publish snapshot, not current Settings', () => {
    const snapshotted = doc({
      publishSnapshot: {
        config: {
          zones: [{ code: 'old-zone', name: 'Old Zone Name' }],
          points: [
            {
              code: 'HUR',
              name: 'Hurricane Ridge',
              zoneCode: 'old-zone',
              latitude: 1,
              longitude: 2,
            },
          ],
          extendedSnowLevelZones: [{ zoneCode: 'old-zone' }],
        },
        structure: {
          ...MWF_STRUCTURE,
          defaultDropFt: 999,
        },
      },
    })
    const normalized = normalizeForecast(snapshotted)
    expect(normalized.config.zones).toEqual([{ id: 'old-zone', name: 'Old Zone Name' }])
    expect(normalized.config.extendedZoneIds).toEqual(['old-zone'])
    expect(normalized.structure.defaultDropFt).toBe(999)
  })

  it('falls back to the code structure constant when a row has no snapshot', () => {
    const normalized = normalizeForecast(doc({}))
    expect(normalized.structure).toBe(MWF_STRUCTURE)
    expect(normalized.config.zones).toEqual([])
  })
})

describe('stackedForDate', () => {
  it('returns visible chain heads for the latest date, newest first, withdrawn hidden', async () => {
    const am = doc({ id: 1, issuance: 'morning', issuedAt: '2026-08-25T14:00:00.000Z' })
    const pm = doc({ id: 2, issuance: 'afternoon', issuedAt: '2026-08-25T22:00:00.000Z' })
    const pmWithdrawal = doc({
      id: 3,
      issuance: 'afternoon',
      status: 'withdrawn',
      revision: 2,
      supersedes: 2,
      issuedAt: '2026-08-25T22:30:00.000Z',
      withdrawnAt: '2026-08-25T23:00:00.000Z',
    })
    const source = createLocalPayloadMwfSource(fakePayload([am, pm, pmWithdrawal]), 7)
    const stacked = await source.stackedForDate()
    // The PM chain head is withdrawn → the whole PM issuance disappears.
    expect(stacked.map((f) => f.id)).toEqual([1])
  })
})

describe('archiveIndex and byId', () => {
  const am = () =>
    doc({
      id: 1,
      issuance: 'morning',
      issuedAt: '2026-08-24T14:00:00.000Z',
      serviceDate: '2026-08-24',
    })
  const pm = () =>
    doc({
      id: 2,
      issuance: 'afternoon',
      issuedAt: '2026-08-24T22:00:00.000Z',
      serviceDate: '2026-08-24',
    })
  const nextAm = () => doc({ id: 3, issuance: 'morning', issuedAt: '2026-08-25T14:00:00.000Z' })

  it('lists visible heads newest-issued first with range bounds', async () => {
    const source = createLocalPayloadMwfSource(fakePayload([am(), pm(), nextAm()]), 7)
    const all = await source.archiveIndex()
    expect(all.map((e) => e.id)).toEqual([3, 2, 1])
    const bounded = await source.archiveIndex({
      from: '2026-08-24T16:00:00.000Z',
      to: '2026-08-25T00:00:00.000Z',
    })
    expect(bounded.map((e) => e.id)).toEqual([2])
  })

  it('byId serves published rows and embargoes scheduled-future ones', async () => {
    const future = doc({ id: 9, issuedAt: '2099-01-01T00:00:00.000Z' })
    const source = createLocalPayloadMwfSource(fakePayload([am(), future]), 7)
    expect((await source.byId(1))?.id).toBe(1)
    expect(await source.byId(9)).toBeNull()
    expect(await source.byId(404)).toBeNull()
  })
})

describe('weatherForecastPageMode', () => {
  it('the MWF flag takes precedence over platforms.weather', () => {
    expect(weatherForecastPageMode({ mwfEnabled: true, platformsWeather: false })).toBe(
      'native-mwf',
    )
    expect(weatherForecastPageMode({ mwfEnabled: true, platformsWeather: true })).toBe('native-mwf')
    expect(weatherForecastPageMode({ mwfEnabled: false, platformsWeather: true })).toBe('widget')
    expect(weatherForecastPageMode({ mwfEnabled: false, platformsWeather: false })).toBe(
      'not-found',
    )
  })
})
