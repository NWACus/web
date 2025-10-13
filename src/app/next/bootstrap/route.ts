import { bootstrap } from '@/endpoints/bootstrap'
import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

export const maxDuration = 240 // seconds

export async function POST(): Promise<Response> {
  // Don't allow bootstrapping in production
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not allowed.', { status: 403 })
  }

  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  // Authenticate by passing request headers
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    await bootstrap({ payload, user })
    return Response.json({ success: true })
  } catch (e) {
    payload.logger.error(e)
    return new Response('Error seeding data.', { status: 500 })
  }
}
