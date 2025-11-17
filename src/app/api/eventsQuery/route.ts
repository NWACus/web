import config from '@/payload.config'
import { getPayload, Where } from 'payload'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const searchParams = url.searchParams

    const tenantId = searchParams.get('tenantId')
    const maxEvents = parseInt(searchParams.get('limit') || '4')
    const depth = parseInt(searchParams.get('depth') || '1')
    const types = searchParams.get('types')?.split(',').filter(Boolean)
    const groups = searchParams.get('groups')?.split(',').filter(Boolean)
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)

    if (!tenantId) {
      return Response.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const where: Where = {
      tenant: { equals: tenantId },
      startDate: { greater_than: new Date().toISOString() },
    }

    if (types?.length) {
      where.eventType = { in: types }
    }

    if (groups?.length) {
      where.eventGroup = { in: groups }
    }

    if (tags?.length) {
      where.eventTags = { in: tags }
    }

    const data = await payload.find({
      collection: 'events',
      where,
      limit: maxEvents,
      depth,
    })

    return Response.json(
      { docs: data.docs || [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    )
  } catch (error) {
    console.error('[Dynamic Events Endpoint Error]:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 },
    )
  }
}
