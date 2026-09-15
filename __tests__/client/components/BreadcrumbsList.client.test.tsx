import { BreadcrumbsList } from '@/components/Breadcrumbs/BreadcrumbsList.client'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

const mockCaptureWithTenant = jest.fn()

jest.mock('../../../src/utilities/useAnalytics', () => ({
  useAnalytics: () => ({ captureWithTenant: mockCaptureWithTenant }),
}))

// jsdom lays nothing out, so the breadcrumbs' overflow measurements have to be supplied.
const layout = { scrollWidth: 0, clientWidth: 0, scrollLeft: 0 }

// The worst trail in the app: a long upstream zone name plus a date leaf.
const LONG_TRAIL = [
  { name: 'forecasts', href: null, isLast: false, isDerived: true },
  { name: 'avalanche', href: '/forecasts/avalanche', isLast: false, isDerived: true },
  {
    name: 'soldier & wood river valley mtns',
    href: '/forecasts/avalanche/soldier-&-wood-river-valley-mtns',
    isLast: false,
    isDerived: true,
  },
  { name: '2026-04-05', href: null, isLast: true, isDerived: false },
]

const getList = () => screen.getByRole('list')

// A faded edge is a gradient running away from it, so the left edge fades with `to right`.
const fadedEdges = () => ({
  left: getList().className.includes('(to_right,transparent'),
  right: getList().className.includes('(to_left,transparent'),
})

describe('BreadcrumbsList', () => {
  beforeAll(() => {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    for (const property of ['scrollWidth', 'clientWidth', 'scrollLeft'] as const) {
      Object.defineProperty(HTMLElement.prototype, property, {
        configurable: true,
        get: () => layout[property],
      })
    }
  })

  beforeEach(() => {
    Object.assign(layout, { scrollWidth: 0, clientWidth: 0, scrollLeft: 0 })
  })

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

  it('keeps the leaf crumb at full width so scrolling can reveal it', () => {
    layout.scrollWidth = 700
    layout.clientWidth = 390

    render(<BreadcrumbsList items={LONG_TRAIL} />)

    expect(getList()).toHaveClass('overflow-x-auto')
    expect(screen.getByText('2026-04-05')).not.toHaveClass('truncate')
  })

  it('takes a tab stop and fades whichever edge still has crumbs behind it', () => {
    layout.scrollWidth = 700
    layout.clientWidth = 390

    render(<BreadcrumbsList items={LONG_TRAIL} />)

    expect(getList()).toHaveAttribute('tabindex', '0')
    expect(fadedEdges()).toEqual({ left: false, right: true })

    layout.scrollLeft = 150
    fireEvent.scroll(getList())
    expect(fadedEdges()).toEqual({ left: true, right: true })

    layout.scrollLeft = 310
    fireEvent.scroll(getList())
    expect(getList()).toHaveAttribute('tabindex', '0')
    expect(fadedEdges()).toEqual({ left: true, right: false })
  })

  it('adds no scroll affordance to a trail that already fits', () => {
    layout.scrollWidth = 240
    layout.clientWidth = 390

    render(
      <BreadcrumbsList
        items={[
          { name: 'blog', href: '/blog', isLast: false, isDerived: true },
          { name: 'Some Post', href: null, isLast: true, isDerived: false },
        ]}
      />,
    )

    expect(getList()).not.toHaveAttribute('tabindex')
    expect(fadedEdges()).toEqual({ left: false, right: false })
  })
})
