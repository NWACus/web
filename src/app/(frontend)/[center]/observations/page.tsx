import type { Metadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { NACWidget } from '@/components/NACWidget'

export const dynamic = 'force-static'
export const revalidate = 600

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants',
    draft: false,
    limit: 1000,
    overrideAccess: true,
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
  const { center } = await params
  return (
    <div className="py-12">
      <div className="container flex flex-col gap-4">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Observations</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          We make every effort to populate the avalanche occurrence database (map and table) in a
          timely manner. We will record larger avalanches we directly observe, those with human
          involvement, and all other notable slides we can confirm within reason. The avalanche
          occurrence database will never be a comprehensive list of all events. You can contact us
          at <a href="mailto:forecasters@nwac.us">forecasters@nwac.us</a> with any questions.
        </p>
        <NACWidget center={center} widget={'observations'} />
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const payload = await getPayload({ config: configPromise })
  const { center } = await params
  const tenant = await payload.find({
    collection: 'tenants',
    overrideAccess: true,
    select: {
      name: true,
    },
    where: {
      slug: {
        equals: center,
      },
    },
  })
  if (tenant.docs.length < 1) {
    return {
      title: `Avalanche Observations`,
    }
  }
  return {
    title: `${tenant.docs[0].name} - Avalanche Observations`,
  }
}
