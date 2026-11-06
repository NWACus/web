import { DatePicker, dateHref } from '@/components/NWACWeather/DatePicker.client'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const DATES = ['2026-09-15', '2026-09-17', '2026-09-22', '2026-09-23']
const RANGE = { from: '2026-08-01', to: '2026-09-30' }
const TODAY = '2026-09-23'
const FIRST_DATE = '2020-12-10'

// The picker re-reads today from the clock after mount; only Date is faked, so waitFor still runs.
beforeEach(() => {
  jest.useFakeTimers({
    now: new Date('2026-09-23T12:00:00'),
    doNotFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'setImmediate',
      'clearImmediate',
      'nextTick',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
    ],
  })
})

afterEach(() => {
  jest.useRealTimers()
})

function renderPicker(date: string) {
  return render(
    <DatePicker
      date={date}
      today={TODAY}
      firstDate={FIRST_DATE}
      initialDates={DATES}
      initialRange={RANGE}
    />,
  )
}

describe('dateHref', () => {
  it('keeps today on the plain weather page', () => {
    expect(dateHref(TODAY, TODAY)).toBe('/weather/forecast')
    expect(dateHref('2026-09-17', TODAY)).toBe('/weather/forecast/2026-09-17')
  })
})

describe('DatePicker', () => {
  it('steps to the neighboring published dates, skipping days with none', () => {
    renderPicker('2026-09-17')
    expect(screen.getByRole('link', { name: 'Older forecast' })).toHaveAttribute(
      'href',
      '/weather/forecast/2026-09-15',
    )
    expect(screen.getByRole('link', { name: 'Newer forecast' })).toHaveAttribute(
      'href',
      '/weather/forecast/2026-09-22',
    )
    expect(screen.getByRole('button', { name: /Sep 17, 2026/ })).toBeInTheDocument()
  })

  it('links the next step back to today at the plain page', () => {
    renderPicker('2026-09-22')
    expect(screen.getByRole('link', { name: 'Newer forecast' })).toHaveAttribute(
      'href',
      '/weather/forecast',
    )
  })

  it('disables a step with nowhere to go', () => {
    renderPicker(TODAY)
    expect(screen.queryByRole('link', { name: 'Newer forecast' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Newer forecast' })).toBeDisabled()
  })

  it('loads a month the reader pages into, and only once', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ dates: ['2026-07-30'] }),
    })
    global.fetch = fetchMock

    renderPicker('2026-08-20')
    fireEvent.click(screen.getByRole('button', { name: /Aug 20, 2026/ }))
    expect(fetchMock).not.toHaveBeenCalled()
    // August is in the initial window; July is not.
    fireEvent.click(screen.getByRole('button', { name: /previous month/i }))

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Thu Jul 30 2026' })).toHaveAttribute(
        'href',
        '/weather/forecast/2026-07-30',
      ),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/nwac/nwac-weather-dates?from=2026-07-01&to=2026-07-31',
    )
    // Once loaded, the older arrow knows the new date too.
    fireEvent.click(screen.getByRole('button', { name: /next month/i }))
    fireEvent.click(screen.getByRole('button', { name: /previous month/i }))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('offers the seasons back to the earliest forecast, and moves the calendar without changing the date', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ dates: ['2023-09-12'] }),
    })

    renderPicker('2026-09-17')
    fireEvent.click(screen.getByRole('button', { name: /Sep 17, 2026/ }))
    expect(screen.getByRole('button', { name: '2020–21' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '2019–20' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '2023–24' }))

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Tue Sep 12 2023' })).toBeInTheDocument(),
    )
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/nwac/nwac-weather-dates?from=2023-09-01&to=2023-09-30',
    )
    expect(screen.getByRole('button', { name: /Sep 17, 2026/ })).toBeInTheDocument()
  })

  it('opens the first season no earlier than the month of the earliest forecast', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ dates: [] }) })

    renderPicker('2026-09-17')
    fireEvent.click(screen.getByRole('button', { name: /Sep 17, 2026/ }))
    fireEvent.click(screen.getByRole('button', { name: '2020–21' }))

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/nwac/nwac-weather-dates?from=2020-12-01&to=2020-12-31',
      ),
    )
    expect(screen.getByRole('button', { name: /previous month/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('stops the calendar at the season edges', () => {
    renderPicker('2026-09-17')
    fireEvent.click(screen.getByRole('button', { name: /Sep 17, 2026/ }))
    expect(screen.getByRole('button', { name: /previous month/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})
