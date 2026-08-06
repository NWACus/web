import { CenterWarningsBanner } from '@/components/warnings/CenterWarningsBanner'
import type { CenterWarningGroup } from '@/services/nac/centerWarnings'
import { ProductType } from '@/services/nac/model/forecast'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { warningFixture as alert } from '../../fixtures/warningProducts'

function group(
  productType: ProductType.Warning | ProductType.Watch | ProductType.Special,
  zones: { id: number; name: string; slug: string | null }[],
): CenterWarningGroup {
  return {
    productType,
    entries: zones.map((zone) => ({ zone, warning: alert(productType) })),
  }
}

const olympics = { id: 1, name: 'Olympics', slug: 'olympics' }
const westNorth = { id: 2, name: 'West Slopes North', slug: 'west-slopes-north' }
const retired = { id: 3, name: 'Retired Zone', slug: null }

describe('CenterWarningsBanner', () => {
  it('renders nothing when no alert is active', () => {
    const { container } = render(<CenterWarningsBanner groups={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('labels a warning, a watch and a special bulletin distinctly', () => {
    render(
      <CenterWarningsBanner
        groups={[
          group(ProductType.Warning, [olympics]),
          group(ProductType.Watch, [westNorth]),
          group(ProductType.Special, [retired]),
        ]}
      />,
    )

    expect(screen.getByText('Avalanche Warning in Effect')).toBeInTheDocument()
    expect(screen.getByText('Avalanche Watch in Effect')).toBeInTheDocument()
    expect(screen.getByText('Special Avalanche Bulletin in Effect')).toBeInTheDocument()
  })

  it('lists every affected zone in a group under one heading', () => {
    render(<CenterWarningsBanner groups={[group(ProductType.Warning, [olympics, westNorth])]} />)

    expect(screen.getAllByText('Avalanche Warning in Effect')).toHaveLength(1)
    expect(screen.getByText('Olympics')).toBeInTheDocument()
    expect(screen.getByText('West Slopes North')).toBeInTheDocument()
  })

  it('links "Learn More" to the first affected zone’s forecast page', () => {
    render(<CenterWarningsBanner groups={[group(ProductType.Warning, [olympics, westNorth])]} />)

    expect(screen.getByRole('link', { name: 'Learn More' })).toHaveAttribute(
      'href',
      '/forecasts/avalanche/olympics',
    )
  })

  it('skips past a zone with no forecast page when choosing the link target', () => {
    render(<CenterWarningsBanner groups={[group(ProductType.Warning, [retired, westNorth])]} />)

    expect(screen.getByRole('link', { name: 'Learn More' })).toHaveAttribute(
      'href',
      '/forecasts/avalanche/west-slopes-north',
    )
  })

  it('still surfaces an alert on a zone with no forecast page, without a link', () => {
    render(<CenterWarningsBanner groups={[group(ProductType.Warning, [retired])]} />)

    expect(screen.getByText('Retired Zone')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Learn More' })).not.toBeInTheDocument()
  })

  it('announces each banner to assistive technology', () => {
    render(
      <CenterWarningsBanner
        groups={[group(ProductType.Warning, [olympics]), group(ProductType.Watch, [westNorth])]}
      />,
    )

    expect(screen.getAllByRole('alert')).toHaveLength(2)
  })
})
