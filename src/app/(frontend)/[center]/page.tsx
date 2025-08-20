import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import HighlightedContent from '@/collections/HomePages/components/HighlightedContent'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { NACWidget } from '@/components/NACWidget'
import QuickLinkButton from '@/components/QuickLinkButton'
import { getCachedHomePage } from '@/utilities/getCachedHomePage'
import { getNACWidgetsConfig } from '@/utilities/getNACWidgetsConfig'
import { draftMode } from 'next/headers'

export const dynamic = 'force-static'
export const revalidate = 600
export const dynamicParams = false

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

  const { version, baseUrl } = await getNACWidgetsConfig()
  const { quickLinks, highlightedContent, layout } = await getCachedHomePage(center, draft)()

  return (
    <>
      <NACWidget
        center={center}
        widget="warning"
        widgetsVersion={version}
        widgetsBaseUrl={baseUrl}
      />
      <div className="py-4 md:py-6 flex flex-col gap-8 md:gap-14">
        {draft && <LivePreviewListener />}
        <div className="container flex flex-col md:flex-row gap-4 md:gap-8">
          <div className="w-full">
            <NACWidget
              center={center}
              widget="map"
              widgetsVersion={version}
              widgetsBaseUrl={baseUrl}
            />
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
