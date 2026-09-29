import { isDeadLegacyPath } from '@/utilities/deadLegacyPath'

describe('isDeadLegacyPath', () => {
  it.each([
    '/feeds',
    '/feeds/',
    '/news-rss.xml',
    '/danger-rating-rss.xml',
    '/email-subscriptions',
    '/weather-station-map',
    '/classes-events/list/',
    '/classes-events/category/class/list/',
    '/data-portal/csv/q',
    '/forecasts/tabs/bottom-line',
    '/FAQ',
    '/ie-incompatible.html',
    '/wp-admin',
    '/wp-content/uploads/2019/01/photo.jpg',
    '/xmlrpc.php',
    '/apple-touch-icon.png',
    '/apple-touch-icon-precomposed.png',
    '/apple-touch-icon-120x120.png',
  ])('matches %s', (pathname) => {
    expect(isDeadLegacyPath(pathname)).toBe(true)
  })

  it.each([
    '/',
    '/faq',
    '/blog/new-nwac-website',
    '/about/about-us',
    '/forecasts/avalanche',
    '/forecasts/avalanche/olympics',
    '/weather/stations/map',
    '/observations',
    '/events',
    '/feeds-and-speeds',
    '/rss.xml',
  ])('does not match %s', (pathname) => {
    expect(isDeadLegacyPath(pathname)).toBe(false)
  })
})
