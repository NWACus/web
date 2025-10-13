import { EventPreview, EventPreviewData } from '@/components/EventPreview'

export type Props = {
  events: EventPreviewData[] | null | undefined
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
                <EventPreview className="h-full" doc={result} />
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
