import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs.client'
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
      <NotFoundProvider>
        <Breadcrumbs />
      </NotFoundProvider>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders breadcrumbs for a knownPathsWithoutPages route and does not render those breadcrumb items as links', () => {
    mockUseSelectedLayoutSegments.mockReturnValue(['weather', 'stations', 'map'])
    render(
      <NotFoundProvider>
        <Breadcrumbs />
      </NotFoundProvider>,
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
      <NotFoundProvider>
        <Breadcrumbs />
      </NotFoundProvider>,
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
      <NotFoundProvider>
        <Breadcrumbs />
      </NotFoundProvider>,
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
})
