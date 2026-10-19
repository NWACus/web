import { coordinatesFromResult, planGeocode } from '@/fields/location/hooks/geocodeLocation'
import { buildGeocodeQuery, geocodeAddress } from '@/services/geocodio'

const address = { address: '123 Alpine Way', city: 'North Bend', state: 'WA', zip: '98045' }
const geocodedPoint = { latitude: 47.49, longitude: -121.78, geocodeStatus: 'geocoded' as const }

describe('buildGeocodeQuery', () => {
  it('joins the parts into one line', () => {
    expect(buildGeocodeQuery(address)).toBe('123 Alpine Way, North Bend, WA 98045')
  })

  it('accepts a city and state, or a ZIP, without a street', () => {
    expect(buildGeocodeQuery({ city: 'Leavenworth', state: 'WA' })).toBe('Leavenworth, WA')
    expect(buildGeocodeQuery({ zip: '98826' })).toBe('98826')
  })

  it('refuses a street with no city/state or ZIP to anchor it', () => {
    expect(buildGeocodeQuery({ address: '123 Alpine Way', city: 'North Bend' })).toBeNull()
    expect(buildGeocodeQuery({})).toBeNull()
  })
})

describe('geocodeAddress', () => {
  const respond = (status: number, body: unknown) =>
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }))

  afterEach(() => jest.restoreAllMocks())

  it('is unavailable without an API key', async () => {
    expect(await geocodeAddress(address, { apiKey: '' })).toMatchObject({ status: 'unavailable' })
  })

  it('reads the first result and grades it by match type', async () => {
    respond(200, {
      results: [{ location: { lat: 47.5, lng: -121.8 }, accuracy: 1, accuracy_type: 'rooftop' }],
    })
    expect(await geocodeAddress(address, { apiKey: 'k' })).toEqual({
      status: 'found',
      latitude: 47.5,
      longitude: -121.8,
      accuracyType: 'rooftop',
      precision: 'exact',
    })
  })

  it('calls a city centroid approximate even at accuracy 1', async () => {
    respond(200, {
      results: [{ location: { lat: 47.6, lng: -120.7 }, accuracy: 1, accuracy_type: 'place' }],
    })
    expect(
      await geocodeAddress({ city: 'Leavenworth', state: 'WA' }, { apiKey: 'k' }),
    ).toMatchObject({ status: 'found', precision: 'approximate' })
  })

  it('treats 422 and empty results as no match, and 5xx as unavailable', async () => {
    respond(422, { error: 'Could not parse address' })
    expect(await geocodeAddress(address, { apiKey: 'k' })).toEqual({ status: 'no-match' })
    respond(200, { results: [] })
    expect(await geocodeAddress(address, { apiKey: 'k' })).toEqual({ status: 'no-match' })
    respond(503, {})
    expect(await geocodeAddress(address, { apiKey: 'k' })).toMatchObject({ status: 'unavailable' })
  })
})

describe('planGeocode', () => {
  const saved = { ...address, coordinates: geocodedPoint }

  it('geocodes a new event with an address', () => {
    expect(planGeocode(address, null)).toBe('geocode')
  })

  it('leaves virtual events without a pin alone', () => {
    expect(planGeocode({ ...address, isVirtual: true }, null)).toBe('keep')
  })

  it('clears the pin when an event goes virtual, and geocodes it afresh when it comes back', () => {
    const virtual = { ...saved, isVirtual: true }
    expect(planGeocode(virtual, saved)).toBe('clear')
    const cleared = { ...address, isVirtual: true, coordinates: {} }
    expect(planGeocode({ ...cleared, isVirtual: false }, cleared)).toBe('geocode')
  })

  it('keeps the point when nothing relevant changed', () => {
    expect(planGeocode(saved, saved)).toBe('keep')
  })

  it('re-geocodes when the address changes, even over a hand-placed pin', () => {
    const manual = { ...saved, coordinates: { ...geocodedPoint, geocodeStatus: 'manual' as const } }
    expect(planGeocode({ ...manual, zip: '98065' }, manual)).toBe('geocode')
  })

  it('marks typed coordinates as manual', () => {
    const typed = { ...saved, coordinates: { ...geocodedPoint, latitude: 47.6 } }
    expect(planGeocode(typed, saved)).toBe('mark-manual')
  })

  it('trusts the status the picker sent with a new point', () => {
    const picked = {
      ...saved,
      coordinates: { latitude: 47.6, longitude: -121.7, geocodeStatus: 'manual' as const },
    }
    expect(planGeocode(picked, saved)).toBe('keep')
  })

  it('keeps a "Find from address" result for a new address, not marking it manual', () => {
    const found = {
      ...saved,
      zip: '98065',
      coordinates: { ...geocodedPoint, latitude: 47.53, longitude: -121.82 },
    }
    expect(planGeocode(found, saved)).toBe('keep')
  })

  it('marks API-sent coordinates as manual, even when only one of them is sent', () => {
    const failed = { ...address, coordinates: { geocodeStatus: 'failed' as const } }
    expect(planGeocode({ coordinates: { latitude: 47.6, longitude: -121.7 } }, failed)).toBe(
      'mark-manual',
    )
    expect(planGeocode({ coordinates: { latitude: 47.6 } }, saved)).toBe('mark-manual')
  })

  it('reads a partial update against the saved location', () => {
    expect(planGeocode({ placeName: 'Community Hall' }, saved)).toBe('keep')
    const virtual = { ...address, isVirtual: true }
    expect(planGeocode({ extraInfo: 'Zoom link to follow' }, virtual)).toBe('keep')
  })

  it('backfills an old event that has never been geocoded, but not one that failed', () => {
    expect(planGeocode(address, address)).toBe('geocode')
    const failed = { ...address, coordinates: { geocodeStatus: 'failed' as const } }
    expect(planGeocode(failed, failed)).toBe('keep')
  })
})

describe('coordinatesFromResult', () => {
  it('stores a found point with its precision', () => {
    expect(
      coordinatesFromResult({
        status: 'found',
        latitude: 1,
        longitude: 2,
        accuracyType: 'place',
        precision: 'approximate',
      }),
    ).toEqual({ latitude: 1, longitude: 2, geocodeStatus: 'approximate' })
  })

  it('clears a stale point when the new address has no match', () => {
    expect(coordinatesFromResult({ status: 'no-match' }, geocodedPoint)).toEqual({
      latitude: null,
      longitude: null,
      geocodeStatus: 'failed',
    })
  })

  it('keeps a hand-placed pin when the new address has no match', () => {
    const manual = { ...geocodedPoint, geocodeStatus: 'manual' as const }
    expect(coordinatesFromResult({ status: 'no-match' }, manual)).toBe(manual)
  })

  it('drops a geocoded point when the geocoder is unavailable, so the next save tries again', () => {
    expect(coordinatesFromResult({ status: 'unavailable', reason: 'x' }, geocodedPoint)).toEqual({
      latitude: null,
      longitude: null,
      geocodeStatus: null,
    })
  })

  it('changes nothing else when the geocoder is unavailable', () => {
    const manual = { ...geocodedPoint, geocodeStatus: 'manual' as const }
    expect(coordinatesFromResult({ status: 'unavailable', reason: 'x' }, manual)).toBeNull()
    expect(coordinatesFromResult({ status: 'unavailable', reason: 'x' }, {})).toBeNull()
  })
})
