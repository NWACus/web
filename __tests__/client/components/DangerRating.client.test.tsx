import { DangerRating } from '@/components/forecast/DangerRating'
import { DangerLevel, ForecastPeriod } from '@/services/nac/types/forecastSchemas'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'

const bandNames = { upper: 'Above Treeline', middle: 'Near Treeline', lower: 'Below Treeline' }

const today = {
  valid_day: ForecastPeriod.Current,
  upper: DangerLevel.Considerable,
  middle: DangerLevel.Considerable,
  lower: DangerLevel.Moderate,
}
const tomorrow = {
  valid_day: ForecastPeriod.Tomorrow,
  upper: DangerLevel.Moderate,
  middle: DangerLevel.Moderate,
  lower: DangerLevel.Low,
}

/** The zone page's dated view, as NativeForecastView renders it. */
function renderDated(danger = [today, tomorrow], elevationBandsUrl: string | null = null) {
  return render(
    <DangerRating
      danger={danger}
      elevationBandNames={bandNames}
      publishedTime="2026-01-05T13:00:00+00:00"
      timezone="America/Los_Angeles"
      elevationBandsUrl={elevationBandsUrl}
    />,
  )
}

describe('DangerRating', () => {
  // Forecast-59
  it('puts the help popover beside the heading, outside it', () => {
    renderDated()

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/^Avalanche Danger$/)
    expect(screen.getByRole('button', { name: 'About Avalanche Danger' })).toBeInTheDocument()
  })

  // Forecast-60
  it("links the center's elevation band page, and leaves the link out without one", () => {
    const { unmount } = renderDated([today, tomorrow], 'https://example.org/bands/')
    expect(screen.getByRole('link', { name: /Elevation Band Descriptions/ })).toHaveAttribute(
      'href',
      'https://example.org/bands/',
    )
    unmount()

    renderDated()
    expect(screen.queryByRole('link', { name: /Elevation Band Descriptions/ })).toBeNull()
  })

  // Forecast-66
  it('folds the outlook into a collapsed row that expands on tap, and prints open', () => {
    renderDated()

    const toggle = screen.getByRole('button', { name: 'Tuesday, January 6, 2026' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    const panel = document.getElementById(toggle.getAttribute('aria-controls') ?? '')
    expect(panel).toHaveClass('hidden', 'print:block')

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(panel).not.toHaveClass('hidden')
    expect(within(panel ?? document.body).getAllByText('2 - Moderate')).toHaveLength(2)
  })

  // Forecast-67
  it("fills the outlook's column with today's travel advice when there is no outlook", () => {
    renderDated([today])

    const advice = screen.getByRole('list', { name: 'Travel advice' })
    const rows = within(advice).getAllByRole('listitem')
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringMatching(/^Dangerous avalanche conditions\./),
      expect.stringMatching(/^Dangerous avalanche conditions\./),
      expect.stringMatching(/^Heightened avalanche conditions/),
    ])
    expect(screen.queryByRole('button', { name: /Tuesday/ })).toBeNull()
  })

  // Forecast-61 beside Forecast-67: the advice column already explains No Rating for each band.
  it('keeps the No Rating line off desktop only when the advice column stands in for the outlook', () => {
    const unrated = {
      ...today,
      upper: DangerLevel.None,
      middle: DangerLevel.None,
      lower: DangerLevel.None,
    }
    const line = () =>
      screen
        .getAllByText(/^Insufficient data for issuing of danger ratings/)
        .find((el) => el.tagName === 'P')

    const { unmount } = renderDated([unrated])
    expect(line()).toHaveClass('lg:hidden', 'printWide:hidden')
    unmount()

    renderDated([unrated, tomorrow])
    expect(line()).not.toHaveClass('lg:hidden')
  })

  it('leaves the all-zones card as it was: both days, no help, no collapsible outlook', () => {
    render(<DangerRating danger={[today, tomorrow]} elevationBandNames={bandNames} />)

    expect(screen.getByRole('heading', { level: 4, name: 'Tomorrow' })).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('list', { name: 'Travel advice' })).toBeNull()
  })
})
