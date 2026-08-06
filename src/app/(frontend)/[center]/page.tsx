import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import HighlightedContent from '@/collections/HomePages/components/HighlightedContent'
import { NACWidget } from '@/components/NACWidget'
import QuickLinkButton from '@/components/QuickLinkButton'
import { HomeWarnings } from '@/components/warnings/HomeWarnings'
import { getCachedHomePage } from '@/utilities/getCachedHomePage'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

export const dynamic = 'force-static'
export const revalidate = 3600 // Next.js requires a static literal here
export const dynamicParams = true

// The danger map widget's own CSS renders the map at 500px and centers like that size, so we
// deliberately ignore the AFP-configured `widget_config.danger_map.height` and pin it here. It
// feeds the wrapper's min-height below so the page doesn't shift while the widget loads, and is
// passed to the widget as `mapWidgetData.height` for builds that read it. Older (Google Maps)
// widget builds ignore that and write the AFP height inline instead, so nac-widgets.css also
// forces the map container to this height. Keep the two values in sync.
const DANGER_MAP_HEIGHT = 500
const HEIGHT_OF_DANGER_SCALE_GRAPHIC = 73.59

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants',
    limit: 1000,
    select: {
      slug: true,
    },
  })

  return tenants.docs.map((tenant): PathArgs => ({ center: tenant.slug }))
}

type Args = {
  params: Promise<PathArgs>
}

type PathArgs = {
  center: string
}

export default async function Page({ params }: Args) {
  const payload = await getPayload({ config: configPromise })
  const { isEnabled: draft } = await draftMode()
  const { center } = await params

  if (!isValidTenantSlug(center)) {
    notFound()
  }
  const { quickLinks, highlightedContent, layout } =
    (await getCachedHomePage(center, draft)()) ?? {}

  return (
    <>
      <HomeWarnings centerSlug={center} />
      <div className="py-4 md:py-6 flex flex-col gap-8 md:gap-14">
        <div className="container flex flex-col md:flex-row gap-4 md:gap-8">
          <div
            className="w-full"
            style={{ minHeight: DANGER_MAP_HEIGHT + HEIGHT_OF_DANGER_SCALE_GRAPHIC }}
          >
            <NACWidget center={center} widget="map" mapHeight={DANGER_MAP_HEIGHT} />
          </div>
          {quickLinks && quickLinks.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="prose md:prose-md dark:prose-invert">
                <h2>Quick Links</h2>
              </div>
              <div className="flex flex-row flex-wrap justify-center md:flex-col gap-2">
                {quickLinks.map((quickLink) => (
                  <QuickLinkButton key={quickLink.id} {...quickLink} />
                ))}
              </div>
            </div>
          )}
        </div>
        {highlightedContent &&
          highlightedContent.enabled &&
          (highlightedContent.heading ||
            (highlightedContent.columns && highlightedContent.columns.length > 0)) && (
            <div className="container">
              <HighlightedContent {...highlightedContent} />
            </div>
          )}
      </div>
      {layout && <RenderBlocks blocks={layout} payload={payload} />}
    </>
  )
}
