/**
 * Responses shared by the `/api/[center]/…` routes.
 *
 * These routes all answer for a tenant slug taken from the URL, so they all need the same
 * "that isn't one of ours" reply and the same no-store headers. Kept in one place so the status
 * code and body don't drift apart between routes.
 */
import { NextResponse } from 'next/server'

/** Error and freshness replies are per-caller and must never be cached at the edge. */
export const NO_STORE = { 'Cache-Control': 'no-store' }

/** The reply for a `[center]` slug that isn't a known tenant. */
export function unknownCenterResponse(): NextResponse {
  return NextResponse.json({ error: 'Unknown center' }, { status: 404, headers: NO_STORE })
}
