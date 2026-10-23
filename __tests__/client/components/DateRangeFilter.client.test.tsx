/**
 * The courses embed is iframed by partner sites, and an iframe's pushState lands in the host page's
 * session history. Uses nuqs's plain React adapter because it writes through the real
 * history.pushState / replaceState, which the testing adapter never calls.
 */
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { QUICK_DATE_FILTERS_EVENTS } from '@/constants/quickDateFilters'
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { format } from 'date-fns'
import { NuqsAdapter } from 'nuqs/adapters/react'

const today = () => format(new Date(), 'MM-dd-yyyy')

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
    window.history.replaceState(null, '', '/events')
    pushState = jest.spyOn(window.history, 'pushState')
    replaceState = jest.spyOn(window.history, 'replaceState')
  })

  afterEach(() => {
    pushState.mockRestore()
    replaceState.mockRestore()
  })

  it('fills in the default start date on mount without pushing a history entry', async () => {
    renderFilter()

    await waitFor(() => expect(window.location.search).toBe(`?startDate=${today()}`))
    expect(replaceState).toHaveBeenCalled()
    expect(pushState).not.toHaveBeenCalled()
  })

  it('writes nothing to history on mount when the URL already has dates', async () => {
    window.history.replaceState(null, '', `/events?startDate=${today()}`)
    replaceState.mockClear()

    renderFilter()

    // Outlast the mount effect's setTimeout and nuqs's 50ms URL-update throttle
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)))
    expect(pushState).not.toHaveBeenCalled()
    expect(replaceState).not.toHaveBeenCalled()
  })

  it('pushes a history entry when the user picks a quick filter', async () => {
    renderFilter()
    await waitFor(() => expect(window.location.search).toBe(`?startDate=${today()}`))

    fireEvent.click(screen.getByRole('button', { name: 'Next Month' }))

    await waitFor(() => expect(pushState).toHaveBeenCalledTimes(1))
    expect(window.location.search).toMatch(/^\?startDate=[\d-]+&endDate=[\d-]+$/)
  })
})
