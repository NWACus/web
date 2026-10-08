import { ForecastDatePicker } from '@/components/forecast/ForecastDatePicker.client'
import type { ForecastArchiveDate } from '@/components/forecast/datePickerNavigation'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ComponentProps } from 'react'

const BASE = '/forecasts/avalanche/west-slopes-north'
const CURRENT = '2026-02-09'

const DATES: ForecastArchiveDate[] = [
  { date: '2026-02-05', dangerRating: 2 },
  { date: CURRENT, dangerRating: 3 },
]

// Only Date is faked, so the notice's timer and waitFor still run on the real clock.
beforeEach(() => {
  jest.useFakeTimers({
    now: new Date('2026-02-15T12:00:00'),
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

function renderPicker(props: Partial<ComponentProps<typeof ForecastDatePicker>> = {}) {
  return render(
    <ForecastDatePicker
      center="nwac"
      zoneSlug="west-slopes-north"
      zoneName="West Slopes North"
      basePath={BASE}
      selectedDate={null}
      currentDate={CURRENT}
      initialDates={DATES}
      initialRange={{ from: '2026-01-01', to: '2026-02-28' }}
      calendarStart="2025-09-01"
      showZoneName
      {...props}
    />,
  )
}

function openCalendar(label: string) {
  fireEvent.click(screen.getByRole('button', { name: label }))
}

describe('ForecastDatePicker', () => {
  it('labels the button with the live product’s date, with the widget’s hint', () => {
    renderPicker()

    const trigger = screen.getByRole('button', { name: 'Feb 9, 2026' })
    expect(trigger).toHaveAttribute('title', 'Choose a date')
  })

  it('names the zone only when asked to', () => {
    const { unmount } = renderPicker()
    openCalendar('Feb 9, 2026')
    expect(screen.getByText('West Slopes North')).toBeInTheDocument()
    unmount()

    renderPicker({ showZoneName: false })
    openCalendar('Feb 9, 2026')
    expect(screen.queryByText('West Slopes North')).toBeNull()
  })

  it('answers a day with no product with a brief, announced notice', async () => {
    renderPicker()
    openCalendar('Feb 9, 2026')

    fireEvent.click(screen.getByRole('button', { name: 'Fri Feb 06 2026' }))

    const notice = screen.getByText('Nothing found for the selected date and forecast zone')
    const status = notice.closest('[role="status"]')
    expect(status).not.toBeNull()
    await waitFor(() => expect(status).toHaveTextContent(''), { timeout: 3000 })
  })

  it('leaves a future day inert', () => {
    renderPicker()
    openCalendar('Feb 9, 2026')

    const calendar = screen.getByRole('grid')
    expect(within(calendar).queryByRole('button', { name: 'Fri Feb 20 2026' })).toBeNull()
    expect(within(calendar).queryByRole('link', { name: 'Fri Feb 20 2026' })).toBeNull()
  })

  it('does not page back past the calendar start', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ dates: [] }) })
    renderPicker({ calendarStart: '2025-12-01' })
    openCalendar('Feb 9, 2026')

    fireEvent.click(screen.getByRole('button', { name: /previous month/i }))
    fireEvent.click(screen.getByRole('button', { name: /previous month/i }))

    await waitFor(() => expect(screen.getByText('December 2025')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /previous month/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})
