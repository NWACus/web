import { getMemberAuth } from '@/auth/members/getMemberAuth'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

// Better Auth for Members (ADR 026). More specific than Payload's /api/[...slug], so it wins.
async function handle(request: Request) {
  const payload = await getPayload({ config: configPromise })
  return getMemberAuth(payload).handler(request)
}

export const GET = handle
export const POST = handle
