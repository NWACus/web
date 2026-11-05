import { ZoneSummary } from '@/components/NWACWeather/ZoneSummary'
import { mapV3NWACWeatherForecastDay } from '@/services/nac/sources/v3/nwacWeatherMappers'
import { nwacWeatherForecastsResponseSchema } from '@/services/nac/types/nwacWeatherSchemas'
import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import fixture from '../../server/fixtures/nwac-weather-forecasts.json'

const mapped = mapV3NWACWeatherForecastDay(nwacWeatherForecastsResponseSchema.parse(fixture))
if (!mapped) throw new Error('fixture should map to a forecast day')
const day = { ...mapped, dayOne: { day: 'd2', night: 'n1', rollsOn: '2026-09-15' } }
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

  it('shows the night and the day until midnight in the center’s timezone', () => {
    // 11:30 pm PDT on the 14th.
    jest.useFakeTimers({ now: new Date('2026-09-15T06:30:00Z') })
    const { container } = render(<ZoneSummary day={day} avalancheZoneId={OLYMPICS} timezone={TZ} />)

    expect(columns(container)).toHaveLength(2)
  })

  it('moves to the day alone at midnight, in a page left open across it', () => {
    jest.useFakeTimers({ now: new Date('2026-09-15T06:59:30Z') })
    const { container } = render(<ZoneSummary day={day} avalancheZoneId={OLYMPICS} timezone={TZ} />)
    expect(columns(container)).toHaveLength(2)

    act(() => {
      jest.advanceTimersByTime(60 * 1000)
    })

    expect(columns(container)).toHaveLength(1)
  })

  it('shows the day alone after midnight', () => {
    // 12:30 am PDT on the 15th.
    jest.useFakeTimers({ now: new Date('2026-09-15T07:30:00Z') })
    const { container } = render(<ZoneSummary day={day} avalancheZoneId={OLYMPICS} timezone={TZ} />)

    expect(columns(container)).toHaveLength(1)
  })

  it('leaves a past forecast as it was published', () => {
    jest.useFakeTimers({ now: new Date('2026-10-01T18:00:00Z') })
    const { container } = render(
      <ZoneSummary
        day={{ ...day, dayOne: { day: 'd2', night: 'n1', rollsOn: null } }}
        avalancheZoneId={OLYMPICS}
        timezone={TZ}
      />,
    )

    expect(columns(container)).toHaveLength(2)
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
