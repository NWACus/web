import { resolveMwfApiContext } from '@/services/products/mwf/apiHelpers'
import { createLocalPayloadMwfSource } from '@/services/products/mwf/source'
import { NextResponse } from 'next/server'

// One published forecast by id (archive permalinks): superseded revisions
// stay fetchable, scheduled-future rows stay embargoed until live.
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ center: string; id: string }> },
) {
  const { center, id } = await params
  const numericId = Number(id)
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const context = await resolveMwfApiContext(center)
  if (!context) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const source = createLocalPayloadMwfSource(context.payload, context.tenantId)
  const forecast = await source.byId(numericId)
  if (!forecast) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ forecast })
}
