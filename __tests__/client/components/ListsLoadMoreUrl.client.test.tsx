import '@testing-library/jest-dom'
import { render, waitFor } from '@testing-library/react'

const mockSearchParams = new URLSearchParams()
jest.mock('next/navigation', () => ({ useSearchParams: () => mockSearchParams }))
// In view on first render, so each list fires its load-more fetch straight away.
jest.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: jest.fn(), inView: true }),
}))
// The lists render empty here; the real previews pull in the Payload config, which jsdom can't load.
jest.mock('../../../src/components/EventPreview', () => ({ EventPreview: () => null }))
jest.mock('../../../src/components/PostPreview', () => ({ PostPreview: () => null }))
jest.mock('../../../src/components/CoursePreviewSmallRow', () => ({
  CoursePreviewSmallRow: () => null,
}))

import { CoursesList } from '@/components/CoursesList'
import { EventsList } from '@/components/EventsList'
import { PostsList } from '@/components/PostsList'
import { FiltersTotalProvider } from '@/contexts/FiltersTotalContext'

let mockFetch: jest.Mock

beforeEach(() => {
  mockFetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ events: [], posts: [], courses: [], hasMore: false }),
    }),
  )
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
    render(<FiltersTotalProvider initialTotal={0}>{list}</FiltersTotalProvider>)

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    const url = new URL(mockFetch.mock.calls[0][0], 'http://localhost')
    expect(url.pathname).toBe(pathname)
    expect(url.searchParams.get('offset')).toBe('0')
  })
})
