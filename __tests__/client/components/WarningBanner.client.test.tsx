import { WarningBanner } from '@/components/forecast/WarningBanner'
import { ProductType } from '@/services/nac/model/forecast'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { warningFixture } from '../../fixtures/warningProducts'

const TZ = 'America/Los_Angeles'

// The danger scale's High red; warnings and watches share it, specials are blue.
const HIGH_RED = 'rgb(237, 28, 36)'
const SPECIAL_BLUE = 'rgb(0, 0, 255)'

describe('WarningBanner', () => {
  it('renders nothing when no alert is active', () => {
    const { container } = render(<WarningBanner warning={null} timezone={TZ} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('labels each alert type distinctly', () => {
    const { rerender } = render(
      <WarningBanner warning={warningFixture(ProductType.Warning)} timezone={TZ} />,
    )
    expect(screen.getByText('Avalanche Warning in Effect')).toBeInTheDocument()

    rerender(<WarningBanner warning={warningFixture(ProductType.Watch)} timezone={TZ} />)
    expect(screen.getByText('Avalanche Watch in Effect')).toBeInTheDocument()

    rerender(<WarningBanner warning={warningFixture(ProductType.Special)} timezone={TZ} />)
    expect(screen.getByText('Special Avalanche Bulletin in Effect')).toBeInTheDocument()
  })

  it('fills the bar with the danger scale High red for a warning and a watch', () => {
    const { rerender } = render(
      <WarningBanner warning={warningFixture(ProductType.Warning)} timezone={TZ} />,
    )
    expect(screen.getByRole('alert').querySelector('summary')).toHaveStyle({
      backgroundColor: HIGH_RED,
    })

    rerender(<WarningBanner warning={warningFixture(ProductType.Watch)} timezone={TZ} />)
    expect(screen.getByRole('alert').querySelector('summary')).toHaveStyle({
      backgroundColor: HIGH_RED,
    })
  })

  it('fills the bar with blue for a special bulletin', () => {
    render(<WarningBanner warning={warningFixture(ProductType.Special)} timezone={TZ} />)
    expect(screen.getByRole('alert').querySelector('summary')).toHaveStyle({
      backgroundColor: SPECIAL_BLUE,
    })
  })

  it('surfaces the bottom line and validity window in the bar itself', () => {
    render(<WarningBanner warning={warningFixture(ProductType.Warning)} timezone={TZ} />)

    expect(screen.getByText('Travel in avalanche terrain is not recommended.')).toBeInTheDocument()
    expect(screen.getByText('Issued')).toBeInTheDocument()
    expect(screen.getByText('Expires')).toBeInTheDocument()
  })

  it('expands in place rather than linking away', () => {
    render(<WarningBanner warning={warningFixture(ProductType.Warning)} timezone={TZ} />)

    expect(screen.getByRole('alert').tagName).toBe('DETAILS')
    expect(screen.getByText('Read more')).toBeInTheDocument()
    expect(screen.getByText(/Heavy snow and strong wind/)).toBeInTheDocument()
  })

  it('sanitizes the hazard discussion', () => {
    render(
      <WarningBanner
        warning={warningFixture(ProductType.Warning, {
          hazard_discussion: '<p>Large avalanches<script>alert(1)</script></p>',
        })}
        timezone={TZ}
      />,
    )

    expect(screen.getByRole('alert').innerHTML).not.toContain('<script')
  })

  it('stays a plain alert, with no expander, when there is nothing to expand into', () => {
    render(
      <WarningBanner
        warning={warningFixture(ProductType.Warning, {
          affected_area: '',
          reason: '',
          hazard_discussion: '',
        })}
        timezone={TZ}
      />,
    )

    const alert = screen.getByRole('alert')
    expect(alert.tagName).toBe('DIV')
    expect(screen.queryByText('Read more')).not.toBeInTheDocument()
    expect(screen.getByText('Avalanche Warning in Effect')).toBeInTheDocument()
  })
})
