import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

/** Generic: a missing token or a SnowObs fault is ours to read in the log. */
export async function stationDataError(
  route: string,
  center: string,
  error: unknown,
): Promise<NextResponse> {
  const payload = await getPayload({ config })
  payload.logger.error({ err: error, center }, `${route} failed`)
  return NextResponse.json({ error: 'failed to load station data' }, { status: 502 })
}
