import { resolveMwfApiContext } from '@/services/products/mwf/apiHelpers'
import { buildLegacyWeatherResponse } from '@/services/products/mwf/legacyShim'
import { normalizeForecast } from '@/services/products/mwf/source'
import { latestVisibleHead } from '@/utilities/mwf/chain'
import { chainRowsFor } from '@/utilities/mwf/workflow'
import { NextRequest, NextResponse } from 'next/server'

// The legacy-shape shim: serves the exact nwac.us Django/WordPress wire shape
// at the legacy path so installed Avy app versions keep working after the
// cutover. Zone-scoped by the app's NAC forecast-zone id; the requested
// published_datetime selects the newest forecast live at that time. The shim
// dies when its traffic does.
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams
  // nwac.us serves exactly one center; ?center= exists for local testing.
  const center = search.get('center') ?? 'nwac'
  const zoneIdParam = search.get('zone_id')
  if (!zoneIdParam) {
    return NextResponse.json(
      { error: 'The regional weather API requires a zone_id query parameter.' },
      { status: 400 },
    )
  }

  const context = await resolveMwfApiContext(center)
  if (!context) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const zone = context.mwfZones.find((z) =>
    (z.nacZoneIds ?? '')
      .split(',')
      .map((part) => part.trim())
      .includes(zoneIdParam),
  )
  if (!zone) return NextResponse.json({ error: 'Unknown zone_id' }, { status: 404 })

  const publishedParam = search.get('published_datetime')
  const at = publishedParam ? new Date(publishedParam) : new Date()
  if (Number.isNaN(at.getTime())) {
    return NextResponse.json({ error: 'Invalid published_datetime' }, { status: 400 })
  }

  const rows = await chainRowsFor(context.payload, context.tenantId)
  const head = latestVisibleHead(rows, at)
  if (!head) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { docs } = await context.payload.find({
    collection: 'mwfForecasts',
    where: { id: { equals: head.id } },
    limit: 1,
    depth: 0,
  })
  const doc = docs[0]
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let authorName: string | null = null
  const authorId = typeof doc.author === 'number' ? doc.author : doc.author?.id
  if (authorId != null) {
    const users = await context.payload.find({
      collection: 'users',
      where: { id: { equals: authorId } },
      limit: 1,
      depth: 0,
    })
    authorName = users.docs[0]?.name ?? null
  }

  const response = buildLegacyWeatherResponse({
    forecast: normalizeForecast(doc),
    zoneId: zone.code,
    authorName,
  })
  if (!response) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(response)
}
