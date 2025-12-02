import { BreadcrumbSetter } from '@/components/Breadcrumbs/BreadcrumbSetter.client'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs.client'
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider'
import { NotFoundProvider } from '@/providers/NotFoundProvider'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  useSelectedLayoutSegments: jest.fn(),
}))

import { useSelectedLayoutSegments } from 'next/navigation'

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const mockUseSelectedLayoutSegments = useSelectedLayoutSegments as jest.MockedFunction<
  typeof useSelectedLayoutSegments
>

describe('Breadcrumbs', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('does not render breadcrumbs on the root route', () => {
    mockUseSelectedLayoutSegments.mockReturnValue([])
    const { container } = render(
      <BreadcrumbProvider>
        <NotFoundProvider>
          <Breadcrumbs />
        </NotFoundProvider>
      </BreadcrumbProvider>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders breadcrumbs for a knownPathsWithoutPages route and does not render those breadcrumb items as links', () => {
    mockUseSelectedLayoutSegments.mockReturnValue(['weather', 'stations', 'map'])
    render(
      <BreadcrumbProvider>
        <NotFoundProvider>
          <Breadcrumbs />
        </NotFoundProvider>
      </BreadcrumbProvider>,
    )
    // Home is always clickable
    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/')
    // weather and stations are in knownPathsWithoutPages, so not clickable
    expect(screen.getByText('weather')).not.toHaveAttribute('href')
    expect(screen.getByText('stations')).not.toHaveAttribute('href')
    // map is the last segment, not clickable
    expect(screen.getByText('map')).not.toHaveAttribute('href')
  })

  it('renders breadcrumbs for a catch-all segment (single string with slashes)', () => {
    mockUseSelectedLayoutSegments.mockReturnValue(['education/classes/field-classes'])
    render(
      <BreadcrumbProvider>
        <NotFoundProvider>
          <Breadcrumbs />
        </NotFoundProvider>
      </BreadcrumbProvider>,
    )
    // Home is always clickable
    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/')
    // All segments from catch-all are not clickable
    expect(screen.getByText('education')).not.toHaveAttribute('href')
    expect(screen.getByText('classes')).not.toHaveAttribute('href')
    // field classes is the last segment, not clickable
    expect(screen.getByText('field classes')).not.toHaveAttribute('href')
  })

  it('renders breadcrumbs for a generic multi-segment path', () => {
    mockUseSelectedLayoutSegments.mockReturnValue([
      'blog',
      'two-feet-of-right-side-up-pow-fell-overnight',
    ])
    render(
      <BreadcrumbProvider>
        <NotFoundProvider>
          <Breadcrumbs />
        </NotFoundProvider>
      </BreadcrumbProvider>,
    )
    // Home is always clickable
    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/')
    // blog is clickable
    expect(screen.getByText('blog').closest('a')).toHaveAttribute('href', '/blog')
    // two-feet-of-right-side-up-pow-fell-overnight is the last segment, not clickable
    expect(screen.getByText('two feet of right side up pow fell overnight')).not.toHaveAttribute(
      'href',
    )
  })

  it('overrides the last breadcrumb label when BreadcrumbSetter is used', () => {
    mockUseSelectedLayoutSegments.mockReturnValue(['observations', '12345'])
    render(
      <BreadcrumbProvider>
        <NotFoundProvider>
          <BreadcrumbSetter label="Avalanche near Stevens Pass" />
          <Breadcrumbs />
        </NotFoundProvider>
      </BreadcrumbProvider>,
    )
    // Home is always clickable
    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/')
    // observations is clickable
    expect(screen.getByText('observations').closest('a')).toHaveAttribute('href', '/observations')
    // The last breadcrumb should show the custom label instead of the segment ID
    expect(screen.getByText('Avalanche near Stevens Pass')).toBeInTheDocument()
    expect(screen.queryByText('12345')).not.toBeInTheDocument()
  })
})
