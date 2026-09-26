import { ZonedDateTime } from '@/components/ZonedDateTime'
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
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
  it('shows the time in the given zone with its abbreviation and no hint when the viewer shares it', () => {
    viewerIn(PACIFIC)
    render(<ZonedDateTime dateTime={JAN_15_3PM_PACIFIC} timeZone={PACIFIC} />)

    expect(screen.getByText('Jan 15, 2026, 3:00 PM PST')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('offers the viewer-local time when the viewer is in a different zone', () => {
    viewerIn('America/Denver')
    render(<ZonedDateTime dateTime={JAN_15_3PM_PACIFIC} timeZone={PACIFIC} />)

    const trigger = screen.getByRole('button', { name: /Jan 15, 2026, 3:00 PM PST/ })
    // Screen readers get the local time without opening the popover.
    expect(trigger).toHaveAccessibleName(
      'Jan 15, 2026, 3:00 PM PST (Thu, Jan 15, 4:00 PM MST your time)',
    )

    fireEvent.click(trigger)
    expect(screen.getByRole('dialog')).toHaveTextContent('Thu, Jan 15, 4:00 PM MST')
  })

  it('shows the viewer date as well as the time when the local clock is on another day', () => {
    viewerIn('America/New_York')
    render(<ZonedDateTime dateTime="2026-01-16T07:30:00Z" timeZone={PACIFIC} format="h:mm a" />)

    expect(screen.getByRole('button')).toHaveAccessibleName(
      '11:30 PM PST (Fri, Jan 16, 2:30 AM EST your time)',
    )
  })

  it('treats differently named zones that agree at that instant as the same', () => {
    viewerIn('America/Boise')
    render(<ZonedDateTime dateTime={JAN_15_3PM_PACIFIC} timeZone="America/Denver" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows a date-only value as that calendar day, with no invented time, zone or hint', () => {
    viewerIn('Pacific/Honolulu')
    render(<ZonedDateTime dateTime="2026-01-15" timeZone="America/New_York" />)

    const time = screen.getByText('Jan 15, 2026')
    expect(time).toHaveAttribute('datetime', '2026-01-15')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('formats a range in both zones', () => {
    viewerIn('America/Denver')
    render(
      <ZonedDateTime
        dateTime={JAN_15_3PM_PACIFIC}
        endDateTime="2026-01-16T01:00:00Z"
        timeZone={PACIFIC}
      />,
    )

    expect(screen.getByRole('button')).toHaveAccessibleName(
      'Jan 15, 2026, 3:00 PM - 5:00 PM PST (Jan 15, 2026, 4:00 PM - 6:00 PM MST your time)',
    )
  })

  it('omits the hint when asked to, for use inside links', () => {
    viewerIn('America/Denver')
    render(
      <ZonedDateTime dateTime={JAN_15_3PM_PACIFIC} timeZone={PACIFIC} viewerTimeHint={false} />,
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('uses a native button, so the hint is reachable by keyboard', () => {
    viewerIn('America/Denver')
    render(<ZonedDateTime dateTime={JAN_15_3PM_PACIFIC} timeZone={PACIFIC} />)

    const trigger = screen.getByRole('button')
    trigger.focus()

    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('does not bubble clicks to a clickable ancestor', () => {
    viewerIn('America/Denver')
    const onRowClick = jest.fn()
    render(
      <div onClick={onRowClick}>
        <ZonedDateTime dateTime={JAN_15_3PM_PACIFIC} timeZone={PACIFIC} />
      </div>,
    )

    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('dialog'))

    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('hydrates server markup without a mismatch, then adds the hint', async () => {
    viewerIn('America/Denver')
    const element = <ZonedDateTime dateTime={JAN_15_3PM_PACIFIC} timeZone={PACIFIC} />
    const html = renderToString(element)
    expect(html).not.toContain('button')

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
    expect(container.querySelector('button')).toHaveTextContent('Jan 15, 2026, 3:00 PM PST')

    consoleError.mockRestore()
    container.remove()
  })
})
