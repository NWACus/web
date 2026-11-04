import { deployedZoneId } from '@/services/nac/sources/v3/stagingZoneIds'

const STAGING = 'https://staging-api.avalanche.org'
const PRODUCTION = 'https://api.avalanche.org'

describe('deployedZoneId', () => {
  it('maps East Slopes Central when only v3 reads staging', () => {
    expect(deployedZoneId(2170, STAGING, PRODUCTION)).toBe(3030)
  })

  it('leaves every other zone alone', () => {
    expect(deployedZoneId(2167, STAGING, PRODUCTION)).toBe(2167)
    expect(deployedZoneId(null, STAGING, PRODUCTION)).toBeNull()
  })

  it('does nothing when v3 reads production', () => {
    expect(deployedZoneId(2170, PRODUCTION, PRODUCTION)).toBe(2170)
  })

  it('does nothing when v2 reads staging too, where the ids already agree', () => {
    expect(deployedZoneId(2170, STAGING, STAGING)).toBe(2170)
  })
})
