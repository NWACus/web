import type { PayloadRequest } from 'payload'

import './styles.scss'

type PageViewData = {
  pathname: string
  count: number
}

type PostHogQueryResponse = {
  results?: Array<[string, number]>
  error?: string
}

async function fetchPageViews(): Promise<PageViewData[]> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
  const projectId = process.env.POSTHOG_PROJECT_ID
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com'

  if (!apiKey || !projectId) {
    return []
  }

  // Calculate date range for last 7 days
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const dateFrom = sevenDaysAgo.toISOString().split('T')[0]
  const dateTo = now.toISOString().split('T')[0]

  // HogQL query to get top pages by pageview count
  const query = {
    kind: 'HogQLQuery',
    query: `
      SELECT
        properties.$pathname as pathname,
        count() as count
      FROM events
      WHERE event = '$pageview'
        AND timestamp >= toDateTime('${dateFrom}')
        AND timestamp <= toDateTime('${dateTo} 23:59:59')
      GROUP BY pathname
      ORDER BY count DESC
      LIMIT 10
    `,
  }

  try {
    const response = await fetch(`${host}/api/projects/${projectId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      console.error('PostHog API error:', response.status, await response.text())
      return []
    }

    const data: PostHogQueryResponse = await response.json()

    if (data.error) {
      console.error('PostHog query error:', data.error)
      return []
    }

    // Transform results from [pathname, count][] to PageViewData[]
    return (data.results || []).map(([pathname, count]) => ({
      pathname: pathname || '(unknown)',
      count,
    }))
  } catch (error) {
    console.error('Failed to fetch PostHog pageviews:', error)
    return []
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// Truncate pathname for display, keeping the most relevant parts
function truncatePathname(pathname: string, maxLength: number = 40): string {
  if (pathname.length <= maxLength) {
    return pathname
  }
  // Keep beginning and end, truncate middle
  const start = pathname.slice(0, Math.floor(maxLength / 2) - 2)
  const end = pathname.slice(-(Math.floor(maxLength / 2) - 2))
  return `${start}...${end}`
}

export async function PostHogViewsWidget(props: { req: PayloadRequest }) {
  const { user } = props.req

  if (!user) {
    return null
  }

  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
  const projectId = process.env.POSTHOG_PROJECT_ID

  if (!apiKey || !projectId) {
    return (
      <div className="posthog-views-widget card">
        <h3 className="card__title">Page Views (Last 7 Days)</h3>
        <p className="posthog-views-widget__message posthog-views-widget__message--warning">
          PostHog not configured. Set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID environment
          variables.
        </p>
      </div>
    )
  }

  const pageViews = await fetchPageViews()
  const totalViews = pageViews.reduce((sum, page) => sum + page.count, 0)

  return (
    <div className="posthog-views-widget card">
      <div className="posthog-views-widget__header">
        <h3 className="card__title">Page Views (Last 7 Days)</h3>
        <span className="posthog-views-widget__total">{formatNumber(totalViews)} total</span>
      </div>

      <div className="posthog-views-widget__content">
        {pageViews.length === 0 ? (
          <p className="posthog-views-widget__message">No pageview data available</p>
        ) : (
          <ul className="posthog-views-widget__list">
            {pageViews.map((page, index) => (
              <li key={page.pathname} className="posthog-views-widget__item">
                <span className="posthog-views-widget__rank">{index + 1}</span>
                <span className="posthog-views-widget__pathname" title={page.pathname}>
                  {truncatePathname(page.pathname)}
                </span>
                <span className="posthog-views-widget__count">{formatNumber(page.count)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default PostHogViewsWidget
