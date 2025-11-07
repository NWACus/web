import { EventPreview } from '@/components/EventPreview'
import type { Event } from '@/payload-types'

export type Props = {
  events: Event[] | null | undefined
}

export const EventCollection = (props: Props) => {
  const { events } = props

  return (
    <div className="@container">
      {events && events?.length > 0 ? (
        events?.map((result, index) => {
          if (typeof result === 'object' && result !== null) {
            return (
              <div className="mb-8" key={index}>
                <EventPreview className="h-full" event={result} />
              </div>
            )
          }

          return null
        })
      ) : (
        <h3>There are no events matching these results.</h3>
      )}
    </div>
  )
}
