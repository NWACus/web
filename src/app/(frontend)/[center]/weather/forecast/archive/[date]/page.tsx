import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { MwfStackedView } from '@/components/mwf/MwfForecastView'
import { createLocalPayloadMwfSource } from '@/services/products/mwf/source'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// Archived MWF issuances for a service date, rendered from each forecast's
// publish-time snapshot of config and structure — history displays correctly
// regardless of later config changes. Flag-gated like the live page.
export const revalidate = 3600

type Args = {
  params: Promise<{ center: string; date: string }>
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export default async function Page({ params }: Args) {
  const { center, date } = await params
  if (!DATE_RE.test(date)) notFound()

  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: center } },
    limit: 1,
    depth: 0,
  })
  const tenant = tenants.docs[0]
  if (!tenant) notFound()

  const settings = await payload.find({
    collection: 'settings',
    where: { tenant: { equals: tenant.id } },
    limit: 1,
    depth: 0,
  })
  if (!settings.docs[0]?.nativeProducts?.mwf) notFound()

  const source = createLocalPayloadMwfSource(payload, tenant.id)
  const forecasts = await source.stackedForDate(date)

  return (
    <div className="container flex flex-col gap-6 pb-10">
      <div className="prose dark:prose-invert max-w-none">
        <h1 className="font-bold">Mountain Weather Archive · {date}</h1>
      </div>
      <nav className="flex gap-4 text-sm">
        <Link className="underline" href={`/weather/forecast/archive/${shiftDate(date, -1)}`}>
          ← {shiftDate(date, -1)}
        </Link>
        <Link className="underline" href="/weather/forecast">
          Current forecast
        </Link>
        <Link className="underline" href={`/weather/forecast/archive/${shiftDate(date, 1)}`}>
          {shiftDate(date, 1)} →
        </Link>
      </nav>
      <MwfStackedView
        forecasts={forecasts}
        emptyMessage="No mountain weather forecast was published for this date."
      />
    </div>
  )
}
