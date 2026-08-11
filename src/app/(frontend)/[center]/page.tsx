import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import HighlightedContent from '@/collections/HomePages/components/HighlightedContent'
import QuickLinkButton from '@/components/QuickLinkButton'
import { HomeDangerMap } from '@/components/dangerMap/HomeDangerMap'
import { HomeWarnings } from '@/components/warnings/HomeWarnings'
import { getCachedHomePage } from '@/utilities/getCachedHomePage'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

export const dynamic = 'force-static'
export const revalidate = 3600 // Next.js requires a static literal here
export const dynamicParams = true

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
          <div className="w-full">
            <HomeDangerMap centerSlug={center} />
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
