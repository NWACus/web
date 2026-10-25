import { isCalendarDate } from '@/services/nac/archiveDates'
import { widgetArchiveHandOverAddress } from '@/services/nac/widgetArchiveHandOver'
import { zoneSlugFromParam } from '@/services/nac/zoneSlug'
import { notFound, redirect } from 'next/navigation'

/**
 * A page rather than an API route so that a client-side navigation keeps the widget's `#/…`
 * route: the router follows a page's `redirect()` itself, but loses the fragment of a fetched 307.
 */
export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{ center: string; zone: string; date: string }>
}

/** A widget center's dated address, handed over per request (`widgetArchiveHandOver.ts`). */
export default async function Page({ params }: Args) {
  const { center, zone, date } = await params
  if (!isCalendarDate(date)) notFound()

  const address = await widgetArchiveHandOverAddress(center, zoneSlugFromParam(zone), date)
  if (!address) notFound()
  redirect(address)
}
