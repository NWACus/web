import { ZoneSummary } from '@/components/NWACWeather/ZoneSummary'
import { mapV3NWACWeatherForecastDay } from '@/services/nac/sources/v3/nwacWeatherMappers'
import { nwacWeatherForecastsResponseSchema } from '@/services/nac/types/nwacWeatherSchemas'
import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import fixture from '../../server/fixtures/nwac-weather-forecasts.json'

const mapped = mapV3NWACWeatherForecastDay(nwacWeatherForecastsResponseSchema.parse(fixture))
if (!mapped) throw new Error('fixture should map to a forecast day')
// The afternoon issuance is index 0, the morning's 1 (newest first).
const day = {
  ...mapped,
  windows: [
    { startsAt: '2026-09-14T13:00:00.000Z', issuance: 1, periodKeys: ['d1', 'n1'] },
    { startsAt: '2026-09-15T01:00:00.000Z', issuance: 0, periodKeys: ['n1', 'd2'] },
  ],
}
const OLYMPICS = 1645
const TZ = 'America/Los_Angeles'
const columns = (container: HTMLElement) =>
  [...(container.querySelector('table thead')?.querySelectorAll('th') ?? [])].map(
    (th) => th.textContent,
  )

describe('ZoneSummary', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('shows the day and the night after it from 6 am, from the morning issuance', () => {
    // 2 pm PDT on the 14th.
    jest.useFakeTimers({ now: new Date('2026-09-14T21:00:00Z') })
    const { container } = render(<ZoneSummary day={day} avalancheZoneId={OLYMPICS} timezone={TZ} />)

    expect(columns(container)).toEqual([
      expect.stringContaining('Sep 14'),
      expect.stringContaining('Sep 14'),
    ])
    expect(screen.getByText(/Morning Forecast/)).toBeInTheDocument()
  })

  it('rolls to the night and the next day at 6 pm, in a page left open across it', () => {
    jest.useFakeTimers({ now: new Date('2026-09-15T00:59:30Z') })
    const { container } = render(<ZoneSummary day={day} avalancheZoneId={OLYMPICS} timezone={TZ} />)
    expect(columns(container)[1]).toContain('Sep 14')

    act(() => {
      jest.advanceTimersByTime(60 * 1000)
    })

    expect(columns(container)).toEqual([
      expect.stringContaining('Sep 14'),
      expect.stringContaining('Sep 15'),
    ])
    expect(screen.getByText(/Afternoon Forecast/)).toBeInTheDocument()
  })

  it('leaves a past forecast as it was published', () => {
    jest.useFakeTimers({ now: new Date('2026-10-01T18:00:00Z') })
    const { container } = render(
      <ZoneSummary
        day={{ ...day, windows: [day.windows[1]] }}
        avalancheZoneId={OLYMPICS}
        timezone={TZ}
      />,
    )

    expect(columns(container)[1]).toContain('Sep 15')
  })

  // Forecast-241
  it('reads as one of the native forecast panel’s sections there', () => {
    const { container } = render(
      <ZoneSummary day={day} avalancheZoneId={OLYMPICS} timezone="America/Los_Angeles" inPanel />,
    )

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/^Mountain Weather · /)
    expect(container.querySelector('#mountain-weather')).toBeNull()
    expect(screen.getByRole('link', { name: /Full Mountain Weather Forecast/ })).toBeInTheDocument()
  })

  it('keeps the widget’s card everywhere else', () => {
    const { container } = render(
      <ZoneSummary day={day} avalancheZoneId={OLYMPICS} timezone="America/Los_Angeles" />,
    )

    expect(container.querySelector('#mountain-weather')).not.toBeNull()
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull()
  })
})
