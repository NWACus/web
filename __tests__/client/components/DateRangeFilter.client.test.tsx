// An iframe's pushState lands in the host page's history, so the courses embed must not push on mount.
// nuqs's React adapter writes through the real history API; the testing adapter never calls it.
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { QUICK_DATE_FILTERS_EVENTS } from '@/constants/quickDateFilters'
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NuqsAdapter } from 'nuqs/adapters/react'

// Pinned clock so the quick filters can't roll over midnight mid-test
const NOW = new Date(2026, 2, 4, 12)
const TODAY = '03-04-2026'

function renderFilter() {
  return render(
    <NuqsAdapter>
      <DateRangeFilter startDate="" endDate="" quickFilters={QUICK_DATE_FILTERS_EVENTS} />
    </NuqsAdapter>,
  )
}

describe('DateRangeFilter', () => {
  let pushState: jest.SpyInstance
  let replaceState: jest.SpyInstance

  beforeEach(() => {
    jest.useFakeTimers({ now: NOW, advanceTimers: true })
    window.history.replaceState(null, '', '/events')
    pushState = jest.spyOn(window.history, 'pushState')
    replaceState = jest.spyOn(window.history, 'replaceState')
  })

  afterEach(() => {
    pushState.mockRestore()
    replaceState.mockRestore()
    jest.useRealTimers()
  })

  it('fills in the default start date on mount without pushing a history entry', async () => {
    renderFilter()

    await waitFor(() => expect(window.location.search).toBe(`?startDate=${TODAY}`))
    expect(replaceState).toHaveBeenCalled()
    expect(pushState).not.toHaveBeenCalled()
  })

  it('writes nothing to history on mount when the URL already has dates', async () => {
    window.history.replaceState(null, '', `/events?startDate=${TODAY}`)
    replaceState.mockClear()

    renderFilter()

    // Outlast the mount effect's setTimeout and nuqs's 50ms URL-update throttle
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)))
    expect(pushState).not.toHaveBeenCalled()
    expect(replaceState).not.toHaveBeenCalled()
  })

  it('pushes one history entry when the user picks a quick filter', async () => {
    renderFilter()
    await waitFor(() => expect(window.location.search).toBe(`?startDate=${TODAY}`))
    pushState.mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Next Month' }))

    await waitFor(() =>
      expect(window.location.search).toBe('?startDate=04-01-2026&endDate=04-30-2026'),
    )
    expect(pushState).toHaveBeenCalledTimes(1)
  })
})
