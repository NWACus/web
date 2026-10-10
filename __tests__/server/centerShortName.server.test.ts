import { centerShortName } from '@/utilities/centerShortName'

describe('centerShortName', () => {
  it('is the tenant slug uppercased', () => {
    expect(centerShortName('nwac')).toBe('NWAC')
    expect(centerShortName('snfac')).toBe('SNFAC')
  })
})
