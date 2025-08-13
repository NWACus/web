import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { LivePreviewListener } from '@/components/LivePreviewListener'
import { NACWidget } from '@/components/NACWidget'
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
  const { isEnabled: draft } = await draftMode()
  const { center } = await params

  const { version, baseUrl } = await getNACWidgetsConfig()

  return (
    <>
      <NACWidget
        center={center}
        widget="warning"
        widgetsVersion={version}
        widgetsBaseUrl={baseUrl}
      />
      <div className="py-6 md:py-8 lg:py-12">
        {draft && <LivePreviewListener />}
        <div className="container">
          <NACWidget
            center={center}
            widget="map"
            widgetsVersion={version}
            widgetsBaseUrl={baseUrl}
          />
        </div>
      </div>
    </>
  )
}
