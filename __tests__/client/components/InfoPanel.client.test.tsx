import { InfoPanel } from '@/components/stationMap/InfoPanel'
import type { StationCardContext } from '@/components/stationMap/StationCard'
import type { MapPoint } from '@/services/snowobs/stationMap/filters'
import type { StationMapStation } from '@/services/snowobs/stationMap/model'
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'

function station(stid: string, name: string): StationMapStation {
  return {
    stid,
    name,
    source: 'nwac',
    coordinates: [-121.44, 48.22],
    elevation: 5030,
    observedAt: '2026-09-10T22:00:00Z',
    data: { air_temp: 40 },
    zone: 'West Slopes North',
    href: `/weather/stations/station/nwac/${stid}`,
    areaHref: null,
  }
}

const points: MapPoint[] = [
  { kind: 'station', id: 'station-1', station: station('1', 'Alpha') },
  { kind: 'station', id: 'station-2', station: station('2', 'Bravo') },
  { kind: 'station', id: 'station-3', station: station('3', 'Charlie') },
]

const context: Omit<StationCardContext, 'ageMinutes'> = {
  variables: [{ variable: 'air_temp', longName: 'Air Temperature' }],
  units: { air_temp: 'fahrenheit' },
  timezone: 'America/Los_Angeles',
  displayUnits: 'default',
  staleAfterMinutes: 180,
}

function setViewport(phone: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: phone,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

function renderPanel({ phone = true, index = 1 } = {}) {
  setViewport(phone)
  const onStep = jest.fn()
  const onClose = jest.fn()
  const panelAt = (at: number) => (
    <InfoPanel
      points={points}
      index={at}
      context={context}
      ages={new Map()}
      onStep={onStep}
      onClose={onClose}
    />
  )
  const { rerender } = render(panelAt(index))
  return {
    panel: screen.getByRole('complementary', { name: 'Selected station' }),
    onStep,
    onClose,
    select: (at: number) => rerender(panelAt(at)),
  }
}

const findPanel = () => screen.queryByRole('complementary', { name: 'Selected station' })

function swipe(
  target: Element,
  from: [number, number],
  to: [number, number],
  path: [number, number][] = [to],
) {
  const touch = ([clientX, clientY]: [number, number]) => ({ touches: [{ clientX, clientY }] })
  fireEvent.touchStart(target, touch(from))
  for (const step of path) fireEvent.touchMove(target, touch(step))
  fireEvent.touchEnd(target, { touches: [] })
}

describe('InfoPanel', () => {
  it('shows the selected card and where it sits in the list', () => {
    renderPanel()
    expect(screen.getByRole('heading', { name: 'Bravo' })).toBeInTheDocument()
    expect(screen.getByText('2 of 3')).toBeInTheDocument()
  })

  it('steps with the buttons and disables them at the ends', () => {
    const { onStep } = renderPanel({ index: 0 })
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onStep).toHaveBeenCalledWith(1)
  })

  it('swipes left to the next point and right to the previous', () => {
    const { panel, onStep } = renderPanel()
    swipe(panel, [200, 100], [100, 104])
    expect(onStep).toHaveBeenLastCalledWith(1)
    swipe(panel, [100, 100], [220, 90])
    expect(onStep).toHaveBeenLastCalledWith(-1)
  })

  it('ignores a short horizontal nudge', () => {
    const { panel, onStep } = renderPanel()
    swipe(panel, [100, 100], [130, 100])
    expect(onStep).not.toHaveBeenCalled()
  })

  it('closes when the sheet is dragged down on a phone, leaving it where the finger let go', () => {
    const { panel, onClose } = renderPanel()
    swipe(
      panel,
      [100, 100],
      [104, 220],
      [
        [101, 130],
        [104, 220],
      ],
    )
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(panel).toHaveStyle({ transform: 'translateY(120px)' })
  })

  it('renders nothing until something is selected', () => {
    setViewport(true)
    render(
      <InfoPanel
        points={points}
        index={-1}
        context={context}
        ages={new Map()}
        onStep={jest.fn()}
        onClose={jest.fn()}
      />,
    )
    expect(findPanel()).not.toBeInTheDocument()
  })

  it('lingers through its exit animation once the selection clears', () => {
    const { panel, select } = renderPanel()
    select(-1)
    expect(panel).toHaveAttribute('data-state', 'closed')
    expect(screen.getByRole('heading', { name: 'Bravo' })).toBeInTheDocument()
    fireEvent.animationEnd(panel)
    expect(findPanel()).not.toBeInTheDocument()
  })

  it('leaves without an animation event where animations do not run', () => {
    jest.useFakeTimers()
    try {
      const { panel, select } = renderPanel()
      select(-1)
      expect(panel).toHaveAttribute('data-state', 'closed')
      act(() => {
        jest.advanceTimersByTime(300)
      })
      expect(findPanel()).not.toBeInTheDocument()
    } finally {
      jest.useRealTimers()
    }
  })

  it('slides a stepped-to card in from the side it came from', () => {
    const { select } = renderPanel({ index: 0 })
    select(1)
    expect(screen.getByTestId('station-card').parentElement).toHaveClass('slide-in-from-right-1/4')
    select(0)
    expect(screen.getByTestId('station-card').parentElement).toHaveClass('slide-in-from-left-1/4')
  })

  it('springs back from a drag that is too short to close', () => {
    const { panel, onClose } = renderPanel()
    swipe(panel, [100, 100], [100, 150])
    expect(onClose).not.toHaveBeenCalled()
    expect(panel).not.toHaveStyle({ transform: 'translateY(50px)' })
  })

  it('leaves a downward drag to the readings once they have scrolled', () => {
    const { onClose } = renderPanel()
    const readings = screen.getByRole('table').parentElement
    if (!readings) throw new Error('readings container missing')
    Object.defineProperty(readings, 'scrollTop', { value: 40, configurable: true })
    swipe(readings, [100, 100], [100, 250])
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not close on a downward drag in the desktop column', () => {
    const { panel, onClose } = renderPanel({ phone: false })
    swipe(panel, [100, 100], [100, 250])
    expect(onClose).not.toHaveBeenCalled()
  })
})
