import type { BuiltInPage, Media, Page, StationPage, Tenant } from '@/payload-types'
import { NWAC_STATION_PAGES, seedStationPages } from '@/services/stations/seedStationPages'
import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { headingNode, paragraphNode, textNode } from '../utilities'

type LinkTarget =
  | { relationTo: 'pages'; value: number }
  | { relationTo: 'builtInPages'; value: number }
  | { relationTo: 'stationPages'; value: number }

// Internal links: the rich-text link field only accepts full URLs for external ones
const linkParagraph = (text: string, doc: LinkTarget) => ({
  type: 'paragraph' as const,
  children: [
    {
      type: 'link' as const,
      version: 3,
      direction: null,
      format: '' as const,
      indent: 0,
      children: [textNode(text)],
      fields: { linkType: 'internal' as const, doc, newTab: false },
    },
  ],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  textFormat: 0,
  version: 1,
})

// The seeded station pages, grouped under NWAC's zones
const REGIONS = [
  { heading: 'Olympics', slugs: ['hurricane-ridge'] },
  { heading: 'Snoqualmie Pass', slugs: ['alpental'] },
  { heading: 'South Cascades', slugs: ['mt-st-helens'] },
]

const SEEDED_STATION_SLUGS = REGIONS.flatMap((region) => region.slugs)

/**
 * Seeds a few of the 32 station pages the migration creates (a multi-station, a single-station
 * and an archived one) and returns them. The migration runs before any tenant exists locally,
 * so the seed does it here.
 */
export async function seedNwacStationPages(
  payload: Payload,
  nwac: Tenant | undefined,
): Promise<StationPage[]> {
  if (!nwac) return []

  payload.logger.info(`— Seeding NWAC station pages...`)
  const pages = NWAC_STATION_PAGES.filter((page) => SEEDED_STATION_SLUGS.includes(page.slug))
  const seeded = await seedStationPages(payload, nwac.id, pages)
  payload.logger.info(seeded, 'station pages seeded')

  const { docs } = await payload.find({
    collection: 'stationPages',
    where: { tenant: { equals: nwac.id }, slug: { in: SEEDED_STATION_SLUGS } },
    depth: 0,
    limit: SEEDED_STATION_SLUGS.length,
  })
  return docs
}

const stationPageLinks = (stationPages: StationPage[]) =>
  REGIONS.flatMap(({ heading, slugs }) => {
    const inRegion = stationPages.filter((page) => slugs.includes(page.slug))
    if (inRegion.length === 0) return []
    return [
      headingNode(heading, 'h3'),
      ...inRegion.map((page) =>
        linkParagraph(page.archived ? `${page.displayName} (archived)` : page.displayName, {
          relationTo: 'stationPages',
          value: page.id,
        }),
      ),
    ]
  })

/**
 * A real Weather Stations page for NWAC, modelled after nwac.us/weather/stations.
 * Lists the seeded station pages by region so every link resolves locally.
 */
export const weatherStationsPage = (
  tenant: Tenant,
  seoImage: Media,
  stationPages: StationPage[],
  stationMap: BuiltInPage,
  precipPage: Page,
): RequiredDataFromCollectionSlug<'pages'> => ({
  slug: 'stations',
  tenant: tenant.id,
  _status: 'published',
  publishedAt: new Date().toISOString(),
  layout: [
    {
      backgroundColor: 'white',
      layout: '1_1',
      verticalAlignment: 'top',
      columns: [
        {
          richText: {
            root: {
              type: 'root',
              children: [
                paragraphNode(
                  'NWAC maintains a network of automated weather stations throughout the Cascade Range ' +
                    'and Olympic Mountains. Select a station below to view current conditions and recent history.',
                ),
                ...stationPageLinks(stationPages),
                headingNode('Additional data visualizations', 'h3'),
                linkParagraph('Weather Stations Map', {
                  relationTo: 'builtInPages',
                  value: stationMap.id,
                }),
                linkParagraph('Accumulated Precipitation', {
                  relationTo: 'pages',
                  value: precipPage.id,
                }),
              ],
              direction: 'ltr' as const,
              format: '' as const,
              indent: 0,
              version: 1,
            },
          },
        },
      ],
      blockType: 'content',
    },
  ],
  meta: {
    description:
      'Current conditions and history from the NWAC weather station network across the Pacific Northwest.',
    image: seoImage.id,
  },
  title: 'Weather Stations',
})
