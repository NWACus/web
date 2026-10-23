import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

let mockSearchParams = new URLSearchParams()
let mockInView = true
jest.mock('next/navigation', () => ({ useSearchParams: () => mockSearchParams }))
jest.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: jest.fn(), inView: mockInView }),
}))
// The real previews pull in the Payload config, which jsdom can't load.
jest.mock('../../../src/components/EventPreview', () => ({
  EventPreview: ({ event }: { event: { title: string } }) => <p>{event.title}</p>,
}))
jest.mock('../../../src/components/PostPreview', () => ({ PostPreview: () => null }))
let mockOrigin: { point: { latitude: number; longitude: number }; query: string } | null = null
jest.mock('../../../src/components/EventsMap/useNearOrigin', () => ({
  ...jest.requireActual('../../../src/components/EventsMap/useNearOrigin'),
  useNearOrigin: () => mockOrigin,
}))
jest.mock('../../../src/components/CoursePreviewSmallRow', () => ({
  CoursePreviewSmallRow: () => null,
}))

import { CoursesList } from '@/components/CoursesList'
import { EventsList } from '@/components/EventsList'
import { PostsList } from '@/components/PostsList'
import { FiltersTotalProvider } from '@/contexts/FiltersTotalContext'

let mockFetch: jest.Mock

const page = (body: object) => Promise.resolve({ json: () => Promise.resolve(body) })
const emptyPage = { events: [], posts: [], courses: [], hasMore: false, total: 0 }
const withTotal = (list: ReactNode) => (
  <FiltersTotalProvider initialTotal={0}>{list}</FiltersTotalProvider>
)
const fetchedUrl = (call: number) => new URL(mockFetch.mock.calls[call][0], 'http://localhost')

beforeEach(() => {
  mockSearchParams = new URLSearchParams()
  mockInView = true
  mockOrigin = null
  mockFetch = jest.fn(() => page(emptyPage))
  // defineProperty rather than assignment: jsdom has no fetch to spy on.
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    writable: true,
    value: mockFetch,
  })
})

describe.each([
  [
    'EventsList',
    '/api/nwac/events',
    <EventsList key="e" initialEvents={[]} initialHasMore center="nwac" />,
  ],
  [
    'PostsList',
    '/api/nwac/posts',
    <PostsList key="p" initialPosts={[]} initialHasMore center="nwac" />,
  ],
  ['CoursesList', '/api/courses/list', <CoursesList key="c" initialCourses={[]} initialHasMore />],
])('%s', (_name, pathname, list) => {
  it('fetches the next page with a single ? so the API reads offset', async () => {
    render(withTotal(list))

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    expect(fetchedUrl(0).pathname).toBe(pathname)
    expect(fetchedUrl(0).searchParams.get('offset')).toBe('0')
  })
})

describe('InfiniteList', () => {
  it("passes the page's filters to the API and drops empty and unrelated params", async () => {
    mockSearchParams = new URLSearchParams('types=a,b&startDate=&utm_source=x')
    render(withTotal(<EventsList initialEvents={[]} initialHasMore center="nwac" />))

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    expect([...fetchedUrl(0).searchParams]).toEqual([
      ['types', 'a,b'],
      ['offset', '0'],
    ])
  })

  it('sends the default sort when the page URL has none', async () => {
    render(
      withTotal(<PostsList initialPosts={[]} initialHasMore center="nwac" defaultSort="title" />),
    )

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    expect(fetchedUrl(0).searchParams.get('sort')).toBe('title')
  })

  it('starts over from the first page when a filter changes, but not for other params', async () => {
    mockInView = false
    mockFetch.mockImplementation(() =>
      page({ ...emptyPage, events: [{ id: 1, title: 'Avalanche Awareness' }] }),
    )
    const list = () => withTotal(<EventsList initialEvents={[]} initialHasMore center="nwac" />)
    const { rerender } = render(list())

    mockSearchParams = new URLSearchParams('utm_source=x')
    rerender(list())
    expect(mockFetch).not.toHaveBeenCalled()

    mockSearchParams = new URLSearchParams('types=workshop')
    rerender(list())
    expect(await screen.findByText('Avalanche Awareness')).toBeInTheDocument()
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(fetchedUrl(0).searchParams.get('types')).toBe('workshop')
    expect(fetchedUrl(0).searchParams.get('offset')).toBe('0')
  })

  it('drops a next page still loading when the filters change', async () => {
    let resolveStale: (body: object) => void = () => {}
    mockFetch
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveStale = (body) => resolve({ json: () => Promise.resolve(body) })
          }),
      )
      .mockImplementationOnce(() => page({ ...emptyPage, events: [{ id: 2, title: 'Fresh' }] }))
    const list = () => withTotal(<EventsList initialEvents={[]} initialHasMore center="nwac" />)
    const { rerender } = render(list())
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

    mockSearchParams = new URLSearchParams('types=workshop')
    rerender(list())
    expect(await screen.findByText('Fresh')).toBeInTheDocument()
    resolveStale({ ...emptyPage, events: [{ id: 1, title: 'Stale' }] })

    expect(mockFetch.mock.calls[0][1].signal.aborted).toBe(true)
    await waitFor(() => expect(screen.queryByText('Stale')).not.toBeInTheDocument())
    expect(screen.getByText('Fresh')).toBeInTheDocument()
  })

  it("doesn't load the old filters' next page alongside the reset", async () => {
    mockInView = false
    const shown = [
      { id: 1, title: 'One' },
      { id: 2, title: 'Two' },
    ]
    // @ts-expect-error the stub events carry only what the mocked preview renders
    const list = () => withTotal(<EventsList initialEvents={shown} initialHasMore center="nwac" />)
    const { rerender } = render(list())

    mockInView = true
    mockSearchParams = new URLSearchParams('types=workshop')
    rerender(list())

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(fetchedUrl(0).searchParams.get('offset')).toBe('0')
  })

  it('skips items already shown when the next page overlaps', async () => {
    mockFetch
      .mockImplementationOnce(() =>
        page({
          ...emptyPage,
          hasMore: true,
          events: [
            { id: 1, title: 'One' },
            { id: 2, title: 'Two' },
          ],
        }),
      )
      .mockImplementationOnce(() =>
        page({
          ...emptyPage,
          events: [
            { id: 2, title: 'Two' },
            { id: 3, title: 'Three' },
          ],
        }),
      )
    render(withTotal(<EventsList initialEvents={[]} initialHasMore center="nwac" />))

    expect(await screen.findByText('Three')).toBeInTheDocument()
    expect(screen.getAllByText('Two')).toHaveLength(1)
    expect(fetchedUrl(1).searchParams.get('offset')).toBe('2')
  })

  it('refetches events sorted from the device location, which the server never sees', async () => {
    mockInView = false
    mockSearchParams = new URLSearchParams('near=me')
    mockOrigin = { point: { latitude: 47.61, longitude: -122.33 }, query: '47.61,-122.33' }
    render(withTotal(<EventsList initialEvents={[]} initialHasMore center="nwac" />))

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))
    expect(fetchedUrl(0).searchParams.get('near')).toBe('47.61,-122.33')
    expect(fetchedUrl(0).searchParams.get('offset')).toBe('0')
  })

  it('lists unplaced events under their own heading once sorted by distance', async () => {
    mockInView = false
    mockSearchParams = new URLSearchParams('near=47.6,-120.66')
    mockOrigin = { point: { latitude: 47.6, longitude: -120.66 }, query: '47.6000,-120.6600' }
    const events = [
      { id: 1, title: 'Trailhead', location: { coordinates: { latitude: 47.5, longitude: -121 } } },
      { id: 2, title: 'Webinar', location: { isVirtual: true } },
    ]
    // @ts-expect-error the stub events carry only what the list and mocked preview read
    render(withTotal(<EventsList initialEvents={events} initialHasMore center="nwac" />))

    const heading = screen.getByRole('heading', { name: 'Online & no location' })
    expect(screen.getByText('Trailhead').compareDocumentPosition(heading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('names the list in its error state', async () => {
    mockFetch.mockImplementation(() => Promise.reject(new Error('offline')))
    render(withTotal(<CoursesList initialCourses={[]} initialHasMore />))

    expect(await screen.findByRole('heading', { name: 'Error loading courses' })).toBeVisible()
    expect(
      screen.getByText('An unexpected error occurred while loading more courses.'),
    ).toBeVisible()
  })
})
