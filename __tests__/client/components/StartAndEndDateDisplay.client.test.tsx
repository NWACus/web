import { StartAndEndDateDisplay } from '@/components/StartAndEndDateDisplay'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

jest.mock('../../../src/utilities/getBrowserTimezone', () => ({
  getBrowserTimezone: jest.fn(() => 'America/Los_Angeles'),
}))

const PACIFIC = 'America/Los_Angeles'
// Jan 6, 9:00 AM - Jan 8, 4:00 PM Pacific.
const START = '2026-01-06T17:00:00Z'
const END = '2026-01-09T00:00:00Z'

describe('StartAndEndDateDisplay', () => {
  it('shows date, time and timezone by default, as events do', () => {
    const { container } = render(
      <StartAndEndDateDisplay startDate={START} startDate_tz={PACIFIC} endDate={END} />,
    )

    expect(container).toHaveTextContent('Jan 6, 9:00 AM - Jan 8, 2026, 4:00 PM PST')
  })

  it('shows a date-only range with no time or timezone when dateOnly is set', () => {
    const { container } = render(
      <StartAndEndDateDisplay startDate={START} startDate_tz={PACIFIC} endDate={END} dateOnly />,
    )

    expect(container).toHaveTextContent(/^Jan 6 - Jan 8, 2026$/)
    expect(container.querySelector('time')).toHaveAttribute('datetime', START)
  })

  it('shows a single date for a same-day course when dateOnly is set', () => {
    const { container } = render(
      <StartAndEndDateDisplay
        startDate={START}
        startDate_tz={PACIFIC}
        endDate="2026-01-07T00:00:00Z"
        dateOnly
      />,
    )

    expect(container).toHaveTextContent(/^Jan 6, 2026$/)
  })
})
