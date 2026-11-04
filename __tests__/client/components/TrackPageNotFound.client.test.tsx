import { TrackPageNotFound } from '@/components/TrackPageNotFound.client'
import { act, render } from '@testing-library/react'

const mockCapture = jest.fn()

jest.mock('../../../src/utilities/useAnalytics', () => ({
  useAnalytics: () => ({ capture: mockCapture }),
}))

describe('TrackPageNotFound', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockCapture.mockClear()
    window.history.pushState({}, '', '/classes-events/avalanche-101')
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('defers the capture until after the mount commit so PostHog can initialize first', () => {
    render(<TrackPageNotFound />)

    expect(mockCapture).not.toHaveBeenCalled()

    act(() => jest.runAllTimers())

    expect(mockCapture).toHaveBeenCalledTimes(1)
    expect(mockCapture).toHaveBeenCalledWith('page_not_found', {
      path: '/classes-events/avalanche-101',
      referrer: '',
    })
  })

  it('does not capture when unmounted before the deferred capture runs', () => {
    const { unmount } = render(<TrackPageNotFound />)
    unmount()

    act(() => jest.runAllTimers())

    expect(mockCapture).not.toHaveBeenCalled()
  })
})
