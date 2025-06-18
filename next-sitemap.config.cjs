import { ROOT_SITE_URL } from '@/utilities/domain'

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: ROOT_SITE_URL,
  generateRobotsTxt: true,
  exclude: ['/posts-sitemap.xml', '/pages-sitemap.xml', '/*', '/posts/*'],
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
