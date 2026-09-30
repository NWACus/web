import { ObservationsWidgetBlockComponent } from '@/blocks/ObservationsWidget/Component'
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

const renderBlock = () =>
  render(
    <NACWidgetsConfigProvider config={config}>
      <ObservationsWidgetBlockComponent />
    </NACWidgetsConfigProvider>,
  )

describe('ObservationsWidgetBlockComponent', () => {
  afterEach(() => {
    mockTenant = { slug: 'ewyaix' }
    delete window.obsWidgetData
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

  it('renders nothing without a tenant', () => {
    mockTenant = null
    const { container } = renderBlock()

    expect(container).toBeEmptyDOMElement()
  })
})
