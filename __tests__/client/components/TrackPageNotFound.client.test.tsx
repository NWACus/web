import { TrackPageNotFound } from '@/components/TrackPageNotFound.client'
import { act, render } from '@testing-library/react'

const mockCaptureWithTenant = jest.fn()

jest.mock('../../../src/utilities/useAnalytics', () => ({
  useAnalytics: () => ({ captureWithTenant: mockCaptureWithTenant }),
}))

describe('TrackPageNotFound', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockCaptureWithTenant.mockClear()
    window.history.pushState({}, '', '/classes-events/avalanche-101')
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('defers the capture until after the mount commit so PostHog can initialize first', () => {
    render(<TrackPageNotFound />)

    expect(mockCaptureWithTenant).not.toHaveBeenCalled()

    act(() => jest.runAllTimers())

    expect(mockCaptureWithTenant).toHaveBeenCalledTimes(1)
    expect(mockCaptureWithTenant).toHaveBeenCalledWith('page_not_found', {
      path: '/classes-events/avalanche-101',
      referrer: '',
    })
  })

  it('does not capture when unmounted before the deferred capture runs', () => {
    const { unmount } = render(<TrackPageNotFound />)
    unmount()

    act(() => jest.runAllTimers())

    expect(mockCaptureWithTenant).not.toHaveBeenCalled()
  })
})
