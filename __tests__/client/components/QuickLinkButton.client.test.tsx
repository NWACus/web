import QuickLinkButton from '@/components/QuickLinkButton'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

const mockCaptureWithTenant = jest.fn()

jest.mock('../../../src/utilities/useAnalytics', () => ({
  useAnalytics: () => ({ captureWithTenant: mockCaptureWithTenant }),
}))

jest.mock('../../../src/utilities/handleReferenceURL', () => ({
  handleReferenceURL: ({ url }: { url?: string }) => url ?? '/mock-href',
}))

const resolvedPage = {
  id: 1,
  title: 'Avalanche Forecast',
  slug: 'avalanche-forecast',
  layout: [],
  tenant: 1,
  _status: 'published' as const,
  createdAt: '',
  updatedAt: '',
}

describe('QuickLinkButton', () => {
  it('renders the custom label when one is provided', () => {
    render(
      <QuickLinkButton
        type="internal"
        label="Custom Label"
        reference={{ relationTo: 'pages', value: resolvedPage }}
        url="/forecast"
      />,
    )

    expect(screen.getByText('Custom Label')).toBeInTheDocument()
    expect(screen.queryByText('Avalanche Forecast')).not.toBeInTheDocument()
  })

  it('falls back to the referenced page title when no label is provided', () => {
    render(
      <QuickLinkButton
        type="internal"
        label=""
        reference={{ relationTo: 'pages', value: resolvedPage }}
        url="/forecast"
      />,
    )

    expect(screen.getByText('Avalanche Forecast')).toBeInTheDocument()
  })

  it('renders an empty label when no label is provided and reference is unresolved', () => {
    render(
      <QuickLinkButton
        type="internal"
        label=""
        reference={{ relationTo: 'pages', value: 42 }}
        url="/forecast"
      />,
    )

    const span = screen.getByRole('link').querySelector('span')
    expect(span).toHaveTextContent('')
  })

  it('renders nothing when handleReferenceURL returns no href', () => {
    jest.requireMock('../../../src/utilities/handleReferenceURL').handleReferenceURL = () => null

    const { container } = render(
      <QuickLinkButton
        type="internal"
        label="Label"
        reference={{ relationTo: 'pages', value: resolvedPage }}
        url=""
      />,
    )

    expect(container).toBeEmptyDOMElement()

    jest.requireMock('../../../src/utilities/handleReferenceURL').handleReferenceURL = ({
      url,
    }: {
      url?: string
    }) => url ?? '/mock-href'
  })

  it('opens in a new tab when newTab is set', () => {
    render(
      <QuickLinkButton
        type="external"
        label="Recent Avalanches"
        newTab
        url="https://example.com/avalanches"
      />,
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('opens in place when newTab is not set', () => {
    render(
      <QuickLinkButton
        type="internal"
        label="Avalanche Forecast"
        reference={{ relationTo: 'pages', value: resolvedPage }}
        url="/forecast"
      />,
    )

    const link = screen.getByRole('link')
    expect(link).not.toHaveAttribute('target')
    expect(link).not.toHaveAttribute('rel')
  })

  // Legacy rows typed internal with no reference render as external links, since
  // handleReferenceURL falls back to url.
  it('honors newTab on an internal row that only carries a url', () => {
    render(
      <QuickLinkButton
        type="internal"
        label="How to Use the Forecast"
        newTab
        url="https://example.com/tutorial"
      />,
    )

    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank')
  })

  it('uses the resolved display label in analytics events', () => {
    render(
      <QuickLinkButton
        type="internal"
        label=""
        reference={{ relationTo: 'pages', value: resolvedPage }}
        url="/forecast"
      />,
    )

    fireEvent.click(screen.getByRole('link'))

    expect(mockCaptureWithTenant).toHaveBeenCalledWith(
      'home_page_quick_links',
      expect.objectContaining({ name: 'Avalanche Forecast' }),
    )
  })
})
