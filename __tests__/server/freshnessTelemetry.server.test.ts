/**
 * @jest-environment node
 */

const mockCaptureMessage = jest.fn()
jest.mock('@sentry/nextjs', () => ({
  captureMessage: (...args: unknown[]) => mockCaptureMessage(...args),
}))

import { reportIndeterminate } from '@/utilities/freshnessTelemetry'

/** The throttle is module-level state that outlives a test, so the clock has to keep moving. */
let clock = Date.now()

describe('reportIndeterminate', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    // Each test starts an hour on, so the throttle the last one left behind has expired.
    clock += 60 * 60_000
    jest.setSystemTime(clock)
    mockCaptureMessage.mockClear()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('reports the cause and the center it happened to', () => {
    reportIndeterminate('no-fresh-forecast', 'nwac')

    expect(mockCaptureMessage).toHaveBeenCalledWith(
      'Freshness check indeterminate: no-fresh-forecast',
      { level: 'warning', tags: { freshness_cause: 'no-fresh-forecast', center: 'nwac' } },
    )
  })

  it('reports once per cause per center, not once per request', () => {
    // Under a real outage every viewer's check goes indeterminate. The signal is that it is
    // happening to this center, and Sentry has no sample rate configured to absorb the rest.
    for (let i = 0; i < 50; i++) reportIndeterminate('no-fresh-forecast', 'nwac')

    expect(mockCaptureMessage).toHaveBeenCalledTimes(1)
  })

  it('keeps causes and centers on their own throttles', () => {
    reportIndeterminate('no-fresh-forecast', 'nwac')
    reportIndeterminate('no-fresh-forecast', 'sac')
    reportIndeterminate('warning-vanished', 'nwac')
    reportIndeterminate('no-fresh-forecast', 'nwac')

    expect(mockCaptureMessage).toHaveBeenCalledTimes(3)
  })

  it('reports again once the window has passed', () => {
    reportIndeterminate('zones-unreachable', 'snfac')

    clock += 60_000
    jest.setSystemTime(clock)
    reportIndeterminate('zones-unreachable', 'snfac')

    expect(mockCaptureMessage).toHaveBeenCalledTimes(2)
  })
})
