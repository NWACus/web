import { DatePicker, dateHref } from '@/components/NWACWeather/DatePicker.client'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const DATES = ['2026-09-15', '2026-09-17', '2026-09-22', '2026-09-23']
const RANGE = { from: '2026-08-01', to: '2026-09-30' }
const TODAY = '2026-09-23'

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
  return render(<DatePicker date={date} today={TODAY} initialDates={DATES} initialRange={RANGE} />)
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

    renderPicker('2026-09-17')
    fireEvent.click(screen.getByRole('button', { name: /Sep 17, 2026/ }))
    // August is in the initial window; July is not.
    fireEvent.click(screen.getByRole('button', { name: /previous month/i }))
    expect(fetchMock).not.toHaveBeenCalled()
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
})
