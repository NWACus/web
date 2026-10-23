import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'

jest.mock('../../../src/utilities/useAnalytics', () => ({
  useAnalytics: () => ({ captureWithTenant: jest.fn() }),
}))

// The nav links /forecasts/avalanche but not the /forecasts dropdown tab above it
jest.mock('../../../src/components/Header/utils', () => ({
  getCachedTopLevelNavItems: () => async () => ({ topLevelNavItems: [] }),
  extractAllInternalUrls: () => ['/forecasts/avalanche'],
}))

describe('Breadcrumbs', () => {
  beforeAll(() => {
    // jsdom has no ResizeObserver; the trail only uses it to notice when it overflows.
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  })

  it('renders nothing for the center home path', async () => {
    const { container } = render(await Breadcrumbs({ center: 'dvac', path: '/' }))

    expect(container).toBeEmptyDOMElement()
  })

  it('shows the title as the leaf in the initial server render, with no provider or effect', async () => {
    const html = renderToStaticMarkup(
      await Breadcrumbs({
        center: 'dvac',
        path: '/observations/12345',
        title: 'Field Observation',
      }),
    )

    expect(html).toContain('Field Observation')
    expect(html).not.toContain('12345')
  })

  it('derives the trail from the path, links what the nav links, and applies labels by href', async () => {
    render(
      await Breadcrumbs({
        center: 'nwac',
        path: '/forecasts/avalanche/stevens-pass',
        labels: { '/forecasts/avalanche/stevens-pass': 'Stevens Pass' },
      }),
    )

    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/')
    expect(screen.getByText('forecasts').closest('a')).toBeNull()
    expect(screen.getByText('avalanche').closest('a')).toHaveAttribute(
      'href',
      '/forecasts/avalanche',
    )
    expect(screen.getByText('Stevens Pass')).not.toHaveClass('capitalize')
    expect(screen.queryByText('stevens pass')).not.toBeInTheDocument()
  })
})
