/**
 * @jest-environment node
 */

import { createCooldown } from '@/utilities/cooldown'

const WINDOW_MS = 30_000

describe('createCooldown', () => {
  let clock: number

  beforeEach(() => {
    jest.useFakeTimers()
    clock = Date.now()
    jest.setSystemTime(clock)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  function advance(ms: number) {
    clock += ms
    jest.setSystemTime(clock)
  }

  it('allows the first ask and refuses the rest of the window', () => {
    const allow = createCooldown(WINDOW_MS)

    expect(allow('nwac')).toBe(true)
    expect(allow('nwac')).toBe(false)

    advance(WINDOW_MS - 1)
    expect(allow('nwac')).toBe(false)
  })

  it('allows again once the window has passed', () => {
    const allow = createCooldown(WINDOW_MS)
    allow('nwac')

    advance(WINDOW_MS)

    expect(allow('nwac')).toBe(true)
  })

  it('measures the window from the last allowed ask, not the last ask', () => {
    // Otherwise a caller asking continuously would push the window out forever and starve the
    // effect it is throttling.
    const allow = createCooldown(WINDOW_MS)
    allow('nwac')

    advance(WINDOW_MS - 1)
    expect(allow('nwac')).toBe(false)
    advance(1)

    expect(allow('nwac')).toBe(true)
  })

  it('tracks each key on its own clock', () => {
    const allow = createCooldown(WINDOW_MS)

    expect(allow('nwac')).toBe(true)
    expect(allow('sac')).toBe(true)
    expect(allow('nwac')).toBe(false)
    expect(allow('sac')).toBe(false)
  })

  it('keeps separate instances independent', () => {
    const purges = createCooldown(WINDOW_MS)
    const reports = createCooldown(WINDOW_MS)

    expect(purges('nwac')).toBe(true)
    expect(reports('nwac')).toBe(true)
  })
})
