// An iframe's pushState lands in the host page's history, so the courses embed must not push on mount.
// nuqs's React adapter writes through the real history API; the testing adapter never calls it.
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { QUICK_DATE_FILTERS_EVENTS } from '@/constants/quickDateFilters'
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'

// Pinned clock so the quick filters can't roll over midnight mid-test
const NOW = new Date(2026, 2, 4, 12)
const TODAY = '03-04-2026'

// startDate/endDate stand in for the server's props, which lag nuqs until the RSC refetch lands
function filterTree(startDate = '', endDate = '') {
  return (
    <NuqsAdapter>
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        quickFilters={QUICK_DATE_FILTERS_EVENTS}
      />
    </NuqsAdapter>
  )
}

function renderFilter(startDate?: string, endDate?: string) {
  return render(filterTree(startDate, endDate))
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

  async function expectNoHistoryWrites() {
    // Outlast the mount effect's setTimeout and nuqs's 50ms URL-update throttle
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)))
    expect(pushState).not.toHaveBeenCalled()
    expect(replaceState).not.toHaveBeenCalled()
  }

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

    await expectNoHistoryWrites()
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

  it('highlights the quick filter that matches the URL after Back', async () => {
    renderFilter()
    await waitFor(() => expect(window.location.search).toBe(`?startDate=${TODAY}`))
    fireEvent.click(screen.getByRole('button', { name: 'Next Week' }))
    await waitFor(() => expect(window.location.search).toContain('endDate='))
    fireEvent.click(screen.getByRole('button', { name: 'Next Month' }))
    await waitFor(() => expect(window.location.search).toContain('endDate=04-30-2026'))

    await act(async () => {
      window.history.back()
      await new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }))
    })

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Next Week' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    )
    expect(screen.getByRole('button', { name: 'Next Month' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('opens the custom range without writing to history', async () => {
    renderFilter()
    await waitFor(() => expect(window.location.search).toBe(`?startDate=${TODAY}`))
    pushState.mockClear()
    replaceState.mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Custom date range' }))

    expect(screen.getByRole('button', { name: 'Custom date range' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument()
    await expectNoHistoryWrites()
  })

  it('highlights the clicked filter while the server props are still stale', async () => {
    window.history.replaceState(null, '', '/events?startDate=04-01-2026&endDate=04-30-2026')
    renderFilter('04-01-2026', '04-30-2026')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Next Month' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Upcoming' }))

    expect(screen.getByRole('button', { name: 'Upcoming' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByLabelText('Start Date')).not.toBeInTheDocument()
  })

  it("hydrates cleanly when the server's today differs from the browser's", async () => {
    window.history.replaceState(null, '', `/events?startDate=${TODAY}`)
    const container = document.createElement('div')
    container.innerHTML = renderToString(filterTree(TODAY))
    document.body.append(container)
    // The server is in UTC, so for part of the day it's already tomorrow there
    jest.setSystemTime(new Date(2026, 2, 3, 12))
    const onRecoverableError = jest.fn()

    const root = await act(async () =>
      hydrateRoot(container, filterTree(TODAY), { onRecoverableError }),
    )

    try {
      expect(onRecoverableError).not.toHaveBeenCalled()
    } finally {
      act(() => root.unmount())
      container.remove()
    }
  })
})
