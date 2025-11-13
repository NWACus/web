import config from '@payload-config'
import { getPayload } from 'payload'
import { EventTable } from './index'

export default async function EventTableWrapper() {
  const payload = await getPayload({ config })

  const { docs: events } = await payload.find({
    collection: 'events',
    limit: 1000,
    sort: '-startDate',
  })

  return <EventTable events={events} />
}
