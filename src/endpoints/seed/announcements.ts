import type { Tenant } from '@/payload-types'
import type { RequiredDataFromCollectionSlug } from 'payload'
import { blockNode, paragraphNode, richTextRoot } from './utilities'

export const getAnnouncementsData = (
  tenant: Tenant,
): RequiredDataFromCollectionSlug<'announcements'>[] => {
  const now = new Date()
  const oneMonthAgo = new Date(now)
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  const oneMonthFromNow = new Date(now)
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)
  const twoMonthsAgo = new Date(now)
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
  const oneWeekAgo = new Date(now)
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  return [
    {
      title: 'Backcountry Access Road Closure',
      type: 'banner',
      tenant: tenant.id,
      startDate: oneMonthAgo.toISOString(),
      content: richTextRoot(
        paragraphNode(
          'Due to recent storm damage, the access road to the northern trailhead is closed until further notice. Please use alternate routes.',
        ),
        blockNode({
          blockType: 'buttonBlock',
          button: {
            type: 'external',
            url: 'https://avalanche.org',
            label: 'View Road Status',
            variant: 'default',
          },
        }),
      ),
      _status: 'published',
    },
    {
      title: 'Annual Fundraiser Gala',
      type: 'popup',
      tenant: tenant.id,
      startDate: oneWeekAgo.toISOString(),
      endDate: oneMonthFromNow.toISOString(),
      displayFrequency: 'every_n_views',
      displayInterval: 3,
      pageScope: 'homepage_only',
      deviceTarget: 'all',
      content: richTextRoot(
        paragraphNode(
          'Join us for our annual fundraiser gala! Your support helps fund avalanche forecasting, education programs, and safety research. Early bird tickets are available now.',
        ),
        blockNode({
          blockType: 'buttonBlock',
          button: {
            type: 'external',
            url: 'https://avalanche.org',
            label: 'Get Tickets',
            variant: 'default',
          },
        }),
      ),
      _status: 'published',
    },
    {
      title: 'Text Alerts for Forecast Updates',
      type: 'banner',
      tenant: tenant.id,
      startDate: oneMonthAgo.toISOString(),
      deviceTarget: 'mobile_only',
      content: richTextRoot(
        paragraphNode(
          'Heading out? Sign up for text alerts and get forecast changes and special bulletins on your phone.',
        ),
        blockNode({
          blockType: 'buttonBlock',
          button: {
            type: 'external',
            url: 'https://avalanche.org',
            label: 'Sign Up for Alerts',
            variant: 'default',
          },
        }),
      ),
      _status: 'published',
    },
    {
      title: 'Explore the Interactive Danger Map',
      type: 'banner',
      tenant: tenant.id,
      startDate: oneMonthAgo.toISOString(),
      deviceTarget: 'desktop_only',
      content: richTextRoot(
        paragraphNode(
          'Compare danger ratings across every zone, layer in weather stations, and zoom into the terrain you are planning for.',
        ),
        blockNode({
          blockType: 'buttonBlock',
          button: {
            type: 'external',
            url: 'https://avalanche.org',
            label: 'Open the Map',
            variant: 'default',
          },
        }),
      ),
      _status: 'published',
    },
    {
      title: 'Past Season Summary Available',
      type: 'banner',
      tenant: tenant.id,
      startDate: twoMonthsAgo.toISOString(),
      endDate: oneWeekAgo.toISOString(),
      content: richTextRoot(
        paragraphNode(
          'The season summary report for the previous winter is now available. Check the blog for a detailed analysis.',
        ),
        blockNode({
          blockType: 'buttonBlock',
          button: {
            type: 'external',
            url: 'https://avalanche.org',
            label: 'Read Summary',
            variant: 'default',
          },
        }),
      ),
      _status: 'published',
    },
  ]
}
