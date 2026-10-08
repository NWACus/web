const mockFind = jest.fn()
jest.mock('payload', () => ({
  getPayload: async () => ({ find: mockFind }),
}))
jest.mock('../../src/payload.config', () => ({}))

import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'

beforeEach(() => {
  mockFind.mockReset()
  mockFind.mockResolvedValue({ docs: [{ nativeProducts: { forecast: true, weather: true } }] })
})

describe('getNativeProductFlag', () => {
  it('reads the flag from the center’s Settings', async () => {
    expect(await getNativeProductFlag('snfac', 'forecast')).toBe(true)
    expect(await getNativeProductFlag('snfac', 'dangerMap')).toBe(false)
  })

  it('ignores weather for every center, whatever Settings says', async () => {
    expect(await getNativeProductFlag('snfac', 'weather')).toBe(false)
    expect(await getNativeProductFlag('nwac', 'weather')).toBe(false)
    expect(mockFind).not.toHaveBeenCalled()
  })
})
