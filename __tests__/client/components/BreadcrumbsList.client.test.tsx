import { BreadcrumbsList } from '@/components/Breadcrumbs/BreadcrumbsList.client'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

const mockCaptureWithTenant = jest.fn()

jest.mock('../../../src/utilities/useAnalytics', () => ({
  useAnalytics: () => ({ captureWithTenant: mockCaptureWithTenant }),
}))

describe('BreadcrumbsList', () => {
  it('always links Home first', () => {
    render(
      <BreadcrumbsList items={[{ name: 'blog', href: null, isLast: true, isDerived: true }]} />,
    )

    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/')
  })

  it('renders derived names with the capitalize class and explicit names without it', () => {
    render(
      <BreadcrumbsList
        items={[
          { name: 'blog', href: '/blog', isLast: false, isDerived: true },
          { name: 'iPhone tips', href: null, isLast: true, isDerived: false },
        ]}
      />,
    )

    expect(screen.getByText('blog')).toHaveClass('capitalize')
    expect(screen.getByText('iPhone tips')).not.toHaveClass('capitalize')
  })

  it('renders linked items as anchors and unlinked items as text', () => {
    render(
      <BreadcrumbsList
        items={[
          { name: 'observations', href: '/observations', isLast: false, isDerived: true },
          { name: 'avalanches', href: null, isLast: false, isDerived: true },
          { name: 'Avalanche Occurrence', href: null, isLast: true, isDerived: false },
        ]}
      />,
    )

    expect(screen.getByText('observations').closest('a')).toHaveAttribute('href', '/observations')
    expect(screen.getByText('avalanches').closest('a')).toBeNull()
    expect(screen.getByText('Avalanche Occurrence').closest('a')).toBeNull()
    expect(screen.getByText('Avalanche Occurrence')).toHaveAttribute('aria-current', 'page')
  })

  it('fires breadcrumb_click with the existing properties when a crumb is clicked', () => {
    render(
      <BreadcrumbsList
        items={[
          { name: 'blog', href: '/blog', isLast: false, isDerived: true },
          { name: 'Some Post', href: null, isLast: true, isDerived: false },
        ]}
      />,
    )

    fireEvent.click(screen.getByText('blog'))

    expect(mockCaptureWithTenant).toHaveBeenCalledWith('breadcrumb_click', {
      breadcrumb_name: 'blog',
      from_page: window.location.pathname,
      to_page: '/blog',
      breadcrumb_level: '0',
    })
  })

  it('fires breadcrumb_click for Home with level 0 and to_page /', () => {
    render(
      <BreadcrumbsList items={[{ name: 'blog', href: null, isLast: true, isDerived: true }]} />,
    )

    fireEvent.click(screen.getByText('Home'))

    expect(mockCaptureWithTenant).toHaveBeenCalledWith('breadcrumb_click', {
      breadcrumb_name: 'Home',
      from_page: window.location.pathname,
      to_page: '/',
      breadcrumb_level: '0',
    })
  })
})
