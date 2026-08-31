/**
 * @jest-environment node
 */

import {
  AVALANCHE_CENTERS,
  VALID_TENANT_SLUGS,
  isValidTenantSlug,
} from '@/utilities/tenancy/avalancheCenters'

describe('isValidTenantSlug', () => {
  it('accepts every slug the table declares', () => {
    for (const slug of VALID_TENANT_SLUGS) {
      expect(isValidTenantSlug(slug)).toBe(true)
    }
    expect(VALID_TENANT_SLUGS.length).toBe(Object.keys(AVALANCHE_CENTERS).length)
  })

  it('rejects a slug that is not a center', () => {
    expect(isValidTenantSlug('not-a-center')).toBe(false)
    expect(isValidTenantSlug('')).toBe(false)
    expect(isValidTenantSlug('NWAC')).toBe(false)
  })

  // The guard is the boundary that keeps a caller-controlled `[center]` segment out of an upstream
  // NAC URL, and it narrows to `ValidTenantSlug` for callers that index the table. A `in` check
  // walks the prototype chain, so every one of these passed it.
  it.each([
    'constructor',
    'toString',
    'valueOf',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'toLocaleString',
    '__proto__',
    '__defineGetter__',
    '__lookupGetter__',
  ])('rejects the inherited property %s', (name) => {
    expect(isValidTenantSlug(name)).toBe(false)
  })

  it('narrows to a key that is really there', () => {
    // The point of the guard failing closed: anything it accepts can be indexed without an
    // undefined slipping past the type.
    const slug = 'nwac'
    if (!isValidTenantSlug(slug)) throw new Error('unreachable')
    expect(AVALANCHE_CENTERS[slug].customDomain).toBe('nwac.us')
  })
})
