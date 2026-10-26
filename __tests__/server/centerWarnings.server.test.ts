import { isFingerprint } from '@/utilities/freshnessResponses'
const mockGetAvalancheCenterMetadata = jest.fn()
// Stubbing nac.ts also keeps the Payload config out of this suite. zoneSlugFromUrl is trivial and
// used verbatim so the slug derivation under test stays real.
jest.mock('../../src/services/nac/nac', () => ({
  getAvalancheCenterMetadata: (...a: unknown[]) => mockGetAvalancheCenterMetadata(...a),
  zoneSlugFromUrl: (url: string) => url.split('/').filter(Boolean).pop(),
}))

const mockGetWarning = jest.fn()
const mockGetWarningFresh = jest.fn()
jest.mock('../../src/services/nac/sources', () => ({
  getWarningSource: () => ({
    getWarning: (...a: unknown[]) => mockGetWarning(...a),
    getWarningFresh: (...a: unknown[]) => mockGetWarningFresh(...a),
  }),
}))

import {
  centerWarningsFingerprint,
  getCenterWarnings,
  getCenterWarningsFresh,
  groupWarningsByType,
  type ZoneWarningLookup,
} from '@/services/nac/centerWarnings'
import { ProductType } from '@/services/nac/model/forecast'
import { warningFixture as alert } from '../fixtures/warningProducts'

const olympics = { id: 1, name: 'Olympics', slug: 'olympics' }
const westNorth = { id: 2, name: 'West Slopes North', slug: 'west-slopes-north' }
const eastCentral = { id: 3, name: 'East Slopes Central', slug: 'east-slopes-central' }
const retired = { id: 4, name: 'Retired Zone', slug: null }

describe('groupWarningsByType', () => {
  it('returns no groups when no zone has an active alert', () => {
    const lookups: ZoneWarningLookup[] = [
      { zone: olympics, warning: null },
      { zone: westNorth, warning: null },
    ]

    expect(groupWarningsByType(lookups)).toEqual([])
  })

  it('returns no groups for a center with no zones at all', () => {
    expect(groupWarningsByType([])).toEqual([])
  })

  it('classifies each alert by product_type into its own group', () => {
    const lookups: ZoneWarningLookup[] = [
      { zone: olympics, warning: alert(ProductType.Warning) },
      { zone: westNorth, warning: alert(ProductType.Watch) },
      { zone: eastCentral, warning: alert(ProductType.Special) },
    ]

    const groups = groupWarningsByType(lookups)

    expect(groups.map((g) => g.productType)).toEqual([
      ProductType.Warning,
      ProductType.Watch,
      ProductType.Special,
    ])
    expect(groups.map((g) => g.entries.map((e) => e.zone.name))).toEqual([
      ['Olympics'],
      ['West Slopes North'],
      ['East Slopes Central'],
    ])
  })

  it('collects every zone sharing a product type into one group, in zone order', () => {
    const lookups: ZoneWarningLookup[] = [
      { zone: olympics, warning: alert(ProductType.Warning) },
      { zone: westNorth, warning: alert(ProductType.Warning) },
      { zone: eastCentral, warning: null },
    ]

    const groups = groupWarningsByType(lookups)

    expect(groups).toHaveLength(1)
    expect(groups[0].productType).toBe(ProductType.Warning)
    expect(groups[0].entries.map((e) => e.zone.name)).toEqual(['Olympics', 'West Slopes North'])
  })

  it('orders groups warning → watch → special regardless of zone order', () => {
    const lookups: ZoneWarningLookup[] = [
      { zone: olympics, warning: alert(ProductType.Special) },
      { zone: westNorth, warning: alert(ProductType.Watch) },
      { zone: eastCentral, warning: alert(ProductType.Warning) },
    ]

    expect(groupWarningsByType(lookups).map((g) => g.productType)).toEqual([
      ProductType.Warning,
      ProductType.Watch,
      ProductType.Special,
    ])
  })

  it('includes a zone with no native forecast page (null slug)', () => {
    const lookups: ZoneWarningLookup[] = [{ zone: retired, warning: alert(ProductType.Warning) }]

    const groups = groupWarningsByType(lookups)

    expect(groups).toHaveLength(1)
    expect(groups[0].entries[0].zone.slug).toBeNull()
  })
})

describe('centerWarningsFingerprint', () => {
  it('is addressable: the freshness route only accepts fingerprints of this shape', () => {
    // The route 400s anything that doesn't match, so a fingerprint that stopped being lowercase
    // sha1 hex would lock every viewer out of the check.
    expect(isFingerprint(centerWarningsFingerprint([]))).toBe(true)
    expect(
      isFingerprint(
        centerWarningsFingerprint(
          groupWarningsByType([{ zone: olympics, warning: alert(ProductType.Warning) }]),
        ),
      ),
    ).toBe(true)
  })

  it('is stable for the same alerts', () => {
    const groups = groupWarningsByType([{ zone: olympics, warning: alert(ProductType.Warning) }])

    expect(centerWarningsFingerprint(groups)).toBe(centerWarningsFingerprint(groups))
  })

  it('distinguishes "no alerts" from an active alert', () => {
    const none = centerWarningsFingerprint(groupWarningsByType([{ zone: olympics, warning: null }]))
    const one = centerWarningsFingerprint(
      groupWarningsByType([{ zone: olympics, warning: alert(ProductType.Warning) }]),
    )

    expect(none).not.toBe(one)
  })

  it('changes when an alert is re-issued with new content', () => {
    const before = groupWarningsByType([{ zone: olympics, warning: alert(ProductType.Warning) }])
    const after = groupWarningsByType([
      {
        zone: olympics,
        warning: alert(ProductType.Warning, { bottom_line: 'Conditions have worsened.' }),
      },
    ])

    expect(centerWarningsFingerprint(before)).not.toBe(centerWarningsFingerprint(after))
  })

  it('changes when an alert is upgraded from a watch to a warning', () => {
    const watch = groupWarningsByType([{ zone: olympics, warning: alert(ProductType.Watch) }])
    const warning = groupWarningsByType([{ zone: olympics, warning: alert(ProductType.Warning) }])

    expect(centerWarningsFingerprint(watch)).not.toBe(centerWarningsFingerprint(warning))
  })

  it('changes when a second zone joins an existing warning', () => {
    const one = groupWarningsByType([{ zone: olympics, warning: alert(ProductType.Warning) }])
    const two = groupWarningsByType([
      { zone: olympics, warning: alert(ProductType.Warning) },
      { zone: westNorth, warning: alert(ProductType.Warning) },
    ])

    expect(centerWarningsFingerprint(one)).not.toBe(centerWarningsFingerprint(two))
  })
})

describe('getCenterWarnings', () => {
  const metadata = {
    zones: [
      {
        id: 1,
        name: 'Olympics',
        status: 'active',
        url: 'https://nwac.us/avalanche-forecast/#/olympics',
      },
      {
        id: 2,
        name: 'West Slopes North',
        status: 'active',
        url: 'https://nwac.us/avalanche-forecast/#/west-slopes-north',
      },
      { id: 3, name: 'Retired Zone', status: 'disabled' },
    ],
  }

  beforeEach(() => {
    mockGetAvalancheCenterMetadata.mockReset()
    mockGetWarning.mockReset()
    mockGetWarningFresh.mockReset()
    mockGetAvalancheCenterMetadata.mockResolvedValue(metadata)
  })

  it('returns no groups when no zone has an active alert', async () => {
    mockGetWarning.mockResolvedValue(null)
    await expect(getCenterWarnings('nwac')).resolves.toEqual([])
  })

  it('queries every zone, including disabled ones', async () => {
    mockGetWarning.mockResolvedValue(null)

    await getCenterWarnings('nwac')

    expect(mockGetWarning).toHaveBeenCalledTimes(3)
    expect(mockGetWarning.mock.calls.map((call) => call[1])).toEqual([1, 2, 3])
  })

  it('derives each active zone’s forecast-page slug from its upstream url', async () => {
    mockGetWarning.mockImplementation(async (_center: string, zoneId: number) =>
      zoneId === 2 ? alert(ProductType.Warning) : null,
    )

    const groups = await getCenterWarnings('nwac')

    expect(groups[0].entries[0].zone).toEqual({
      id: 2,
      name: 'West Slopes North',
      slug: 'west-slopes-north',
    })
  })

  it('surfaces an alert on a disabled zone with a null slug rather than hiding it', async () => {
    mockGetWarning.mockImplementation(async (_center: string, zoneId: number) =>
      zoneId === 3 ? alert(ProductType.Warning) : null,
    )

    const groups = await getCenterWarnings('nwac')

    expect(groups[0].entries[0].zone).toEqual({ id: 3, name: 'Retired Zone', slug: null })
  })

  it('keeps the other zones’ alerts when one zone’s lookup fails', async () => {
    mockGetWarning.mockImplementation(async (_center: string, zoneId: number) => {
      if (zoneId === 1) throw new Error('upstream 503')
      return zoneId === 2 ? alert(ProductType.Warning) : null
    })

    const groups = await getCenterWarnings('nwac')

    expect(groups).toHaveLength(1)
    expect(groups[0].entries.map((e) => e.zone.id)).toEqual([2])
  })

  it('groups alerts across zones by type', async () => {
    mockGetWarning.mockImplementation(async (_center: string, zoneId: number) =>
      zoneId === 3 ? alert(ProductType.Watch) : alert(ProductType.Warning),
    )

    const groups = await getCenterWarnings('nwac')

    expect(groups.map((g) => g.productType)).toEqual([ProductType.Warning, ProductType.Watch])
    expect(groups[0].entries.map((e) => e.zone.id)).toEqual([1, 2])
  })
})

describe('getCenterWarningsFresh', () => {
  beforeEach(() => {
    mockGetAvalancheCenterMetadata.mockReset()
    mockGetWarning.mockReset()
    mockGetWarningFresh.mockReset()
    mockGetAvalancheCenterMetadata.mockResolvedValue({
      zones: [{ id: 1, name: 'Olympics', status: 'active', url: 'https://nwac.us/x/olympics' }],
    })
  })

  it('reads through the source’s fresh path, never the cached one', async () => {
    mockGetWarningFresh.mockResolvedValue(alert(ProductType.Warning))

    const groups = await getCenterWarningsFresh('nwac')

    expect(mockGetWarningFresh).toHaveBeenCalledWith('nwac', 1)
    expect(mockGetWarning).not.toHaveBeenCalled()
    expect(groups[0].productType).toBe(ProductType.Warning)
  })
})
