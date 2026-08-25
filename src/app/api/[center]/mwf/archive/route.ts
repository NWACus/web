import { resolveMwfApiContext } from '@/services/products/mwf/apiHelpers'
import { createLocalPayloadMwfSource } from '@/services/products/mwf/source'
import { NextRequest, NextResponse } from 'next/server'

// Lean archive index: one entry per visible chain head, newest issued first,
// optionally bounded with ?from=&to= (ISO datetimes) and ?limit=.
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ center: string }> },
) {
  const { center } = await params
  const context = await resolveMwfApiContext(center)
  if (!context) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const search = request.nextUrl.searchParams
  const limitRaw = search.get('limit')
  const limit = limitRaw ? Math.min(Math.max(Number(limitRaw) || 0, 1), 1000) : undefined
  const source = createLocalPayloadMwfSource(context.payload, context.tenantId)
  const entries = await source.archiveIndex({
    from: search.get('from') ?? undefined,
    to: search.get('to') ?? undefined,
    limit,
  })
  return NextResponse.json({ forecasts: entries })
}
