import { EventCard } from '@/components/EventCard'
import { Event } from '@/payload-types'

export type Props = {
  events: Event[] | null | undefined
  variant?: 'horizontal' | 'vertical' | 'compact'
  showGroup?: boolean
  showType?: boolean
  showDate?: boolean
}

export const EventCollection = (props: Props) => {
  const { events, variant = 'vertical', showGroup = true, showType = true, showDate = true } = props

  return (
    <>
      {events && events?.length > 0 ? (
        <div className="space-y-6">
          {events?.map((event, index) => {
            if (typeof event === 'object' && event !== null) {
              return (
                <EventCard
                  key={event.id || index}
                  event={event}
                  variant={variant}
                  showGroup={showGroup}
                  showType={showType}
                  showDate={showDate}
                />
              )
            }
            return null
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600">
            There are no events matching your current filters. Try adjusting your search criteria.
          </p>
        </div>
      )}
    </>
  )
}
