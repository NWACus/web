import { WindowRollover } from '@/components/NWACWeather/WindowRollover.client'
import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'

// 6 am and 6 pm PDT on Sep 15.
const windows = [
  { startsAt: '2026-09-15T13:00:00.000Z', node: <p>Today and Tonight</p> },
  { startsAt: '2026-09-16T01:00:00.000Z', node: <p>Tonight and Tomorrow</p> },
]

afterEach(() => {
  jest.useRealTimers()
})

describe('WindowRollover', () => {
  it('rolls over to the next window at its start on the reader’s clock', () => {
    jest.useFakeTimers({ now: new Date('2026-09-16T00:59:30Z') })
    render(<WindowRollover windows={windows} />)
    expect(screen.getByText('Today and Tonight')).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(60 * 1000)
    })

    expect(screen.getByText('Tonight and Tomorrow')).toBeInTheDocument()
    expect(screen.queryByText('Today and Tonight')).not.toBeInTheDocument()
  })

  it('opens on the window already started by a cached page’s reader', () => {
    jest.useFakeTimers({ now: new Date('2026-09-16T03:00:00Z') })
    render(<WindowRollover windows={windows} />)

    expect(screen.getByText('Tonight and Tomorrow')).toBeInTheDocument()
  })

  it('shows the first window before any has started', () => {
    jest.useFakeTimers({ now: new Date('2026-09-15T12:00:00Z') })
    render(<WindowRollover windows={windows} />)

    expect(screen.getByText('Today and Tonight')).toBeInTheDocument()
  })
})
