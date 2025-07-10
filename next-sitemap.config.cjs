const PROTOCOL = process.env.NODE_ENV === 'production' ? 'https' : 'http'
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
const ROOT_SITE_URL = `${PROTOCOL}://${ROOT_DOMAIN}`

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: ROOT_SITE_URL,
  generateRobotsTxt: true,
  exclude: ['/posts-sitemap.xml', '/pages-sitemap.xml', '/*', '/blog/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        disallow: '/admin/*',
      },
    ],
    additionalSitemaps: [
      `${ROOT_SITE_URL}/pages-sitemap.xml`,
      `${ROOT_SITE_URL}/posts-sitemap.xml`,
    ],
  },
}
