import { filterValidRelationships } from '@/utilities/relationships'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'

import { EventsTable } from '@/components/EventsTable'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function ProviderPage({
  params,
}: {
  params: Promise<{
    token: string
  }>
}) {
  const { token } = await params
  const payload = await getPayload({ config: configPromise })

  const providersRes = await payload.find({
    collection: 'providers',
    limit: 1,
    where: {
      token: {
        equals: token,
      },
    },
    pagination: false,
  })
  const provider = providersRes.docs[0]
  const events = filterValidRelationships(provider.events?.docs)

  return (
    <div className="flex flex-col pt-8 md:pt-14">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-2xl">Your Events</h2>
          <Button asChild size="sm">
            <Link href="#create-event">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Link>
          </Button>
        </div>
        <EventsTable events={events || []} />
      </div>
    </div>
  )
}
