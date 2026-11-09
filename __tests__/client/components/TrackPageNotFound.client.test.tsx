import { TrackPageNotFound } from '@/components/TrackPageNotFound.client'
import { render } from '@testing-library/react'

const mockCapture = jest.fn()

jest.mock('../../../src/utilities/useAnalytics', () => ({
  useAnalytics: () => ({ capture: mockCapture }),
}))

describe('TrackPageNotFound', () => {
  beforeEach(() => {
    mockCapture.mockClear()
    window.history.pushState({}, '', '/classes-events/avalanche-101')
  })

  it('captures page_not_found once with the path and referrer', () => {
    render(<TrackPageNotFound />)

    expect(mockCapture).toHaveBeenCalledTimes(1)
    expect(mockCapture).toHaveBeenCalledWith('page_not_found', {
      path: '/classes-events/avalanche-101',
      referrer: '',
    })
  })
})
