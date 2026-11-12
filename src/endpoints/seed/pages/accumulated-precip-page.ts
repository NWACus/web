import type { Media, StationPage, Tenant } from '@/payload-types'
import type { RequiredDataFromCollectionSlug } from 'payload'
import { simpleContent } from '../utilities'

/**
 * An accumulated-precipitation page for NWAC with a precipTable block, so the
 * block renders locally and the Weather Stations page link resolves.
 */
export const accumulatedPrecipPage = (
  tenant: Tenant,
  seoImage: Media,
  stationPages: StationPage[],
): RequiredDataFromCollectionSlug<'pages'> => ({
  slug: 'accumulated-precipitation',
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
          richText: simpleContent(
            'Accumulated precipitation totals from NWAC weather stations. ' +
              'Values are computed from hourly precipitation readings.',
          ),
        },
      ],
      blockType: 'content',
    },
    {
      blockType: 'precipTable',
      columns: ['1h', '3h', '6h', '12h', '24h', '48h', '72h'],
      // Archived pages' stations may no longer be tracked, which 400s the whole table.
      stations: stationPages
        .filter((page) => !page.archived)
        .flatMap((page) => (page.stations ?? []).map(({ stid, source }) => ({ stid, source }))),
    },
  ],
  meta: {
    description:
      'Accumulated precipitation totals across NWAC weather stations in the Pacific Northwest.',
    image: seoImage.id,
  },
  title: 'Accumulated Precipitation',
})
