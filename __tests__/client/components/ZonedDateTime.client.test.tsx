import { ZonedDateTime } from '@/components/ZonedDateTime'
import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'

jest.mock('../../../src/utilities/getBrowserTimezone', () => ({
  getBrowserTimezone: jest.fn(),
}))

const { getBrowserTimezone } = jest.requireMock('../../../src/utilities/getBrowserTimezone')

const PACIFIC = 'America/Los_Angeles'
// 3:00 PM Pacific, 4:00 PM Mountain.
const JAN_15_3PM_PACIFIC = '2026-01-15T23:00:00Z'

const viewerIn = (timeZone: string) => getBrowserTimezone.mockReturnValue(timeZone)

describe('ZonedDateTime', () => {
  it('shows the time in the given zone with its abbreviation and no local time when the viewer shares it', () => {
    viewerIn(PACIFIC)
    const { container } = render(<ZonedDateTime dateTime={JAN_15_3PM_PACIFIC} timeZone={PACIFIC} />)

    expect(screen.getByText('Jan 15, 2026, 3:00 PM PST')).toBeInTheDocument()
    expect(container).not.toHaveTextContent('your time')
  })

  it('follows the time with the viewer-local time in parentheses when the viewer is in a different zone', () => {
    viewerIn('America/Denver')
    const { container } = render(<ZonedDateTime dateTime={JAN_15_3PM_PACIFIC} timeZone={PACIFIC} />)

    expect(screen.getByText('Jan 15, 2026, 3:00 PM PST')).toBeInTheDocument()
    expect(container).toHaveTextContent('Jan 15, 2026, 3:00 PM PST (your time: 4:00 PM MST)')
    // "your time" is for screen readers; sighted viewers see just the parenthetical.
    expect(screen.getByText('your time:')).toHaveClass('sr-only')
  })

  it('adds the date when the viewer clock is on another day', () => {
    viewerIn('America/New_York')
    const { container } = render(
      <ZonedDateTime dateTime="2026-01-16T07:30:00Z" timeZone={PACIFIC} format="h:mm a" />,
    )

    expect(container).toHaveTextContent('11:30 PM PST (your time: Jan 16, 2:30 AM EST)')
  })

  it('treats differently named zones that agree at that instant as the same', () => {
    viewerIn('America/Boise')
    const { container } = render(
      <ZonedDateTime dateTime={JAN_15_3PM_PACIFIC} timeZone="America/Denver" />,
    )

    expect(container).not.toHaveTextContent('your time')
  })

  it('shows a date-only value as that calendar day, with no invented time, zone or local time', () => {
    viewerIn('Pacific/Honolulu')
    const { container } = render(
      <ZonedDateTime dateTime="2026-01-15" timeZone="America/New_York" />,
    )

    const time = screen.getByText('Jan 15, 2026')
    expect(time).toHaveAttribute('datetime', '2026-01-15')
    expect(container).not.toHaveTextContent('your time')
  })

  describe('ranges', () => {
    const renderRange = (viewerTimeZone: string, start: string, end: string) => {
      viewerIn(viewerTimeZone)
      return render(<ZonedDateTime dateTime={start} endDateTime={end} timeZone={PACIFIC} />)
        .container
    }

    it('shows just the times when both ends land on the same days for the viewer', () => {
      // Jan 15, 3:00 PM - 5:00 PM Pacific.
      const container = renderRange('America/Denver', JAN_15_3PM_PACIFIC, '2026-01-16T01:00:00Z')

      expect(container).toHaveTextContent(
        'Jan 15, 2026, 3:00 PM - 5:00 PM PST (your time: 4:00 PM - 6:00 PM MST)',
      )
    })

    it('dates only the end when just the end crosses midnight for the viewer', () => {
      // Jan 15, 8:00 PM - 10:00 PM Pacific is 11:00 PM - 1:00 AM Eastern.
      const container = renderRange(
        'America/New_York',
        '2026-01-16T04:00:00Z',
        '2026-01-16T06:00:00Z',
      )

      expect(container).toHaveTextContent('(your time: 11:00 PM - Jan 16, 1:00 AM EST)')
    })

    it('dates the start once when the whole range moves to the next day for the viewer', () => {
      // Jan 15, 10:00 PM - 11:00 PM Pacific is Jan 16, 1:00 AM - 2:00 AM Eastern.
      const container = renderRange(
        'America/New_York',
        '2026-01-16T06:00:00Z',
        '2026-01-16T07:00:00Z',
      )

      expect(container).toHaveTextContent('(your time: Jan 16, 1:00 AM - 2:00 AM EST)')
    })

    it('puts the local time beside each day of a multi-day range', () => {
      // Jan 15, 5:00 PM - Jan 16, 1:00 PM Pacific.
      const container = renderRange(
        'America/Denver',
        '2026-01-16T01:00:00Z',
        '2026-01-16T21:00:00Z',
      )

      expect(container).toHaveTextContent(
        'Jan 15, 5:00 PM (your time: 6:00 PM MST) - Jan 16, 2026, 1:00 PM PST (your time: 2:00 PM MST)',
      )
      expect(container.querySelectorAll('time')).toHaveLength(2)
    })

    it('dates each day of a multi-day range that lands on another day for the viewer', () => {
      const container = renderRange('Asia/Tokyo', '2026-01-16T01:00:00Z', '2026-01-16T21:00:00Z')

      expect(container).toHaveTextContent(
        'Jan 15, 5:00 PM (your time: Jan 16, 10:00 AM GMT+9) - Jan 16, 2026, 1:00 PM PST (your time: Jan 17, 6:00 AM GMT+9)',
      )
    })
  })

  it('hydrates server markup without a mismatch, then adds the local time', async () => {
    viewerIn('America/Denver')
    const element = <ZonedDateTime dateTime={JAN_15_3PM_PACIFIC} timeZone={PACIFIC} />
    const html = renderToString(element)
    expect(html).not.toContain('your time')

    const container = document.createElement('div')
    container.innerHTML = html
    document.body.appendChild(container)
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    const recoverableErrors: unknown[] = []

    await act(async () => {
      hydrateRoot(container, element, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      })
    })

    expect(recoverableErrors).toEqual([])
    expect(consoleError).not.toHaveBeenCalled()
    expect(container).toHaveTextContent('3:00 PM PST (your time: 4:00 PM MST)')

    consoleError.mockRestore()
    container.remove()
  })
})
