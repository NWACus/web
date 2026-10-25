// The same false positive the sibling `api/[center]` routes waive; see `forecast-current-date`.
// fallow-ignore-file dynamic-segment-name-conflicts
import { forecastAddressForProduct } from '@/services/nac/forecastAddress'
import { NO_STORE } from '@/utilities/apiResponses'
import { nativeProductGate } from '@/utilities/nativeProductGate'
import { NextRequest, NextResponse } from 'next/server'

/** An archived product's address doesn't change. */
const FOUND_CACHE = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
/** Nothing found may be an upstream hiccup, so it isn't held long. */
const NOT_FOUND_CACHE = 'public, max-age=0, s-maxage=300'

// Matches a product id: digits only.
const ID_PATTERN = /^\d+$/

/**
 * The native dated address of an archived product (`?id=`, with the link's `?zone=` zone_id), for
 * an old widget link on a native center: `{ address }`, null when the center has none for it.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ center: string }> },
) {
  const { center } = await params
  const blocked = await nativeProductGate(center, 'forecast')
  if (blocked) return blocked

  const id = request.nextUrl.searchParams.get('id') ?? ''
  const productId = ID_PATTERN.test(id) ? Number(id) : NaN
  if (!Number.isSafeInteger(productId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400, headers: NO_STORE })
  }

  let address: string | null
  try {
    const zone = request.nextUrl.searchParams.get('zone')
    address = await forecastAddressForProduct(center, productId, zone)
  } catch {
    return NextResponse.json({ address: null }, { headers: NO_STORE })
  }

  return NextResponse.json(
    { address },
    { headers: { 'Cache-Control': address ? FOUND_CACHE : NOT_FOUND_CACHE } },
  )
}
