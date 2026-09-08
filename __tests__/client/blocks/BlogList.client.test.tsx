import { BlogListBlockComponent } from '@/blocks/BlogList/Component'
import type { Post, Tag, Tenant } from '@/payload-types'
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { ComponentProps } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const mockTenant: Tenant = {
  id: 1,
  name: 'Northwest Avalanche Center',
  slug: 'nwac',
  provisioning: { status: 'complete' },
  updatedAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
}

jest.mock('../../../src/providers/TenantProvider', () => ({
  useTenant: () => ({ tenant: mockTenant }),
}))

jest.mock('../../../src/components/RichText', () => ({
  __esModule: true,
  default: () => null,
}))

// Render the href as a plain anchor so the generated /blog URL can be asserted
// without pulling in next/link and the analytics provider.
jest.mock('../../../src/components/ButtonLink', () => ({
  ButtonLink: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

jest.mock('../../../src/components/PostPreviewSmallRow', () => ({
  PostPreviewSmallRow: ({ doc }: { doc: { title: string } }) => <div>{doc.title}</div>,
}))

type Props = ComponentProps<typeof BlogListBlockComponent>

const tagFixture = (id: number, slug: string): Tag => ({
  id,
  tenant: 1,
  title: slug,
  slug,
  updatedAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
})

const postFixture = (id: number, title: string): Post => ({
  id,
  tenant: 1,
  title,
  slug: `post-${id}`,
  content: {
    root: { type: 'root', children: [], direction: null, format: '', indent: 0, version: 1 },
  },
  publishedAt: '2026-01-01T00:00:00.000Z',
  _status: 'published',
  updatedAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
})

const dynamicBlock = (dynamicOptions?: Partial<Props['dynamicOptions']>): Props => ({
  blockType: 'blogList',
  isLayoutBlock: false,
  backgroundColor: 'brand-100',
  heading: 'Latest posts',
  postOptions: 'dynamic',
  dynamicOptions: {
    sortBy: '-publishedAt',
    ...dynamicOptions,
  },
})

const mockFetch = jest.fn()

const okResponse = (posts: Post[]) => ({
  ok: true,
  json: async () => ({ posts, hasMore: false, total: posts.length }),
})

beforeEach(() => {
  mockFetch.mockReset()
  mockFetch.mockResolvedValue(okResponse([]))
  global.fetch = mockFetch
})

const requestedUrl = () => new URL(mockFetch.mock.calls[0][0], 'https://nwac.us')

describe('BlogListBlockComponent', () => {
  describe('dynamic post fetching', () => {
    it('sends the configured tag and sort filters to the posts API', async () => {
      render(
        <BlogListBlockComponent
          {...dynamicBlock({
            filterByTags: [tagFixture(1, 'climbing-forecast'), tagFixture(2, 'education')],
            maxPosts: 6,
          })}
        />,
      )

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

      const url = requestedUrl()
      expect(url.pathname).toBe('/api/nwac/posts')
      expect(url.searchParams.get('tags')).toBe('climbing-forecast,education')
      expect(url.searchParams.get('sort')).toBe('-publishedAt')
      expect(url.searchParams.get('limit')).toBe('6')
    })

    it('falls back to a limit of 4 when maxPosts is unset', async () => {
      render(<BlogListBlockComponent {...dynamicBlock()} />)

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))
      expect(requestedUrl().searchParams.get('limit')).toBe('4')
    })

    it('renders the fetched posts', async () => {
      mockFetch.mockResolvedValue(okResponse([postFixture(1, 'Avalanche 101')]))

      render(<BlogListBlockComponent {...dynamicBlock()} />)

      expect(await screen.findByText('Avalanche 101')).toBeInTheDocument()
    })
  })

  describe('the "View all" link', () => {
    it('carries the filters in the server-rendered markup, before any effect runs', () => {
      // Regression test: the params used to be computed inside the fetch effect, so
      // prerendered (force-static) pages shipped an unfiltered `/blog?` href.
      const markup = renderToStaticMarkup(
        <BlogListBlockComponent
          {...dynamicBlock({ filterByTags: [tagFixture(1, 'climbing-forecast')] })}
        />,
      )

      expect(markup).toContain('sort=-publishedAt')
      expect(markup).toContain('tags=climbing-forecast')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('matches the filters sent to the posts API', async () => {
      render(
        <BlogListBlockComponent
          {...dynamicBlock({ filterByTags: [tagFixture(1, 'climbing-forecast')] })}
        />,
      )

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

      const link = new URL(
        screen.getByRole('link', { name: /View all/ }).getAttribute('href') || '',
        'https://nwac.us',
      )
      const api = requestedUrl()
      expect(link.pathname).toBe('/blog')
      expect(link.searchParams.get('tags')).toBe(api.searchParams.get('tags'))
      expect(link.searchParams.get('sort')).toBe(api.searchParams.get('sort'))
    })

    it('is not rendered for statically chosen posts', () => {
      render(
        <BlogListBlockComponent
          blockType="blogList"
          isLayoutBlock={false}
          backgroundColor="brand-100"
          heading="Latest posts"
          postOptions="static"
          staticOptions={{ staticPosts: [postFixture(1, 'Avalanche 101')] }}
        />,
      )

      expect(screen.queryByRole('link', { name: /View all/ })).not.toBeInTheDocument()
      expect(screen.getByText('Avalanche 101')).toBeInTheDocument()
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('when configured tags cannot be resolved', () => {
    it('fails closed rather than fetching every post', async () => {
      // Unresolved relationships arrive as bare IDs (e.g. the Tag was deleted). Omitting
      // the `tags` param would return posts from every tag, which is the bug this guards.
      render(<BlogListBlockComponent {...dynamicBlock({ filterByTags: [1, 2] })} />)

      expect(
        await screen.findByText('There are no posts matching these results.'),
      ).toBeInTheDocument()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('still fetches when at least one tag resolves', async () => {
      render(
        <BlogListBlockComponent
          {...dynamicBlock({ filterByTags: [1, tagFixture(2, 'education')] })}
        />,
      )

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))
      expect(requestedUrl().searchParams.get('tags')).toBe('education')
    })
  })

  describe('error handling', () => {
    it('surfaces the API error message instead of reporting an empty result', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          posts: [],
          hasMore: false,
          total: 0,
          error: 'Failed to load posts. Please reload the page or clear your filters.',
        }),
      })

      render(<BlogListBlockComponent {...dynamicBlock()} />)

      expect(
        await screen.findByText(
          'Failed to load posts. Please reload the page or clear your filters.',
        ),
      ).toBeInTheDocument()
      expect(
        screen.queryByText('There are no posts matching these results.'),
      ).not.toBeInTheDocument()
    })

    it('surfaces a network failure instead of rejecting unhandled', async () => {
      mockFetch.mockRejectedValue(new Error('network down'))

      render(<BlogListBlockComponent {...dynamicBlock()} />)

      expect(
        await screen.findByText('An unexpected error occurred. Please try again.'),
      ).toBeInTheDocument()
    })
  })

  it('shows a loading state before the fetch resolves, not the empty-result message', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))

    render(<BlogListBlockComponent {...dynamicBlock()} />)

    expect(screen.getByText('Loading posts')).toBeInTheDocument()
    expect(screen.queryByText('There are no posts matching these results.')).not.toBeInTheDocument()
  })
})
