import { resolveMwfApiContext } from '@/services/products/mwf/apiHelpers'
import { createLocalPayloadMwfSource } from '@/services/products/mwf/source'
import { NextRequest, NextResponse } from 'next/server'

// The clean MWF read API: the visible issuances for a service date (default:
// the latest date with visible content), stacked newest first.
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ center: string }> },
) {
  const { center } = await params
  const context = await resolveMwfApiContext(center)
  if (!context) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const date = request.nextUrl.searchParams.get('date') ?? undefined
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 })
  }
  const source = createLocalPayloadMwfSource(context.payload, context.tenantId)
  const forecasts = await source.stackedForDate(date)
  return NextResponse.json({
    serviceDate: forecasts[0]?.serviceDate ?? date ?? null,
    forecasts,
  })
}
