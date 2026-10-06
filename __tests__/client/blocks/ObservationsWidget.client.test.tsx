import { ObservationsWidgetBlockComponent } from '@/blocks/ObservationsWidget/Component'
import type { ObservationsWidgetBlock } from '@/payload-types'
import { NACWidgetsConfigProvider } from '@/providers/NACWidgetsConfigProvider'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

let mockTenant: { slug: string } | null = { slug: 'ewyaix' }

jest.mock('../../../src/providers/TenantProvider', () => ({
  useTenant: () => ({ tenant: mockTenant }),
}))

jest.mock('../../../src/utilities/useAnalytics', () => ({
  useAnalytics: () => ({ captureWithTenant: jest.fn() }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

// The widget script is loaded from a remote CDN; never fetch it in tests.
jest.mock('next/script', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }))

const config = { version: '1.0.0', baseUrl: 'https://widgets.example.com', devMode: false }

const renderBlock = (props: Partial<ObservationsWidgetBlock> = {}) =>
  render(
    <NACWidgetsConfigProvider config={config}>
      <ObservationsWidgetBlockComponent
        blockType="observationsWidget"
        dateRange="past2Weeks"
        {...props}
      />
    </NACWidgetsConfigProvider>,
  )

describe('ObservationsWidgetBlockComponent', () => {
  afterEach(() => {
    mockTenant = { slug: 'ewyaix' }
    delete window.obsWidgetData
    window.history.replaceState(null, '', '/')
  })

  it('renders the heading, submit link, disclaimer, and observations widget', () => {
    const { container } = renderBlock()

    expect(screen.getByRole('heading', { name: 'Recent Observations' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Submit Observation' })).toHaveAttribute(
      'href',
      '/observations/submit',
    )
    expect(screen.getByText(/Observations document past conditions/)).toBeInTheDocument()
    expect(container.querySelector('[data-widget="observations"]')).toBeInTheDocument()
    expect(window.obsWidgetData).toMatchObject({ centerId: 'EWYAIX' })
  })

  it('uses a custom heading', () => {
    renderBlock({ heading: 'Storm cycle avalanches' })

    expect(screen.getByRole('heading', { name: 'Storm cycle avalanches' })).toBeInTheDocument()
  })

  it('hides the heading and submit link but keeps the disclaimer', () => {
    renderBlock({ showHeader: false })

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Submit Observation' })).not.toBeInTheDocument()
    expect(screen.getByText(/Observations document past conditions/)).toBeInTheDocument()
  })

  it('opens the widget on its starting filters', () => {
    renderBlock({ tab: 'avalanches', zones: ['Mt Hood'] })

    const [path, query] = window.location.hash.split('?')
    expect(path).toBe('#/view/avalanches')
    expect(new URLSearchParams(query).get('zone')).toBe('["Mt Hood"]')
  })

  it("keeps a visitor's own widget route", () => {
    window.history.replaceState(null, '', '/#/view/observations?zone=%5B%22Olympics%22%5D')
    renderBlock({ tab: 'avalanches', zones: ['Mt Hood'] })

    expect(window.location.hash).toBe('#/view/observations?zone=%5B%22Olympics%22%5D')
  })

  it('renders nothing without a tenant', () => {
    mockTenant = null
    const { container } = renderBlock()

    expect(container).toBeEmptyDOMElement()
  })
})
