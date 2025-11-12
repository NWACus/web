'use client'

import { EventType } from '@/collections/Events/constants'
import { CheckboxFilter } from '@/components/filters/CheckboxFilter'

type Props = {
  types: EventType[]
}

export const EventsTypeFilter = ({ types }: Props) => {
  return (
    <CheckboxFilter
      title="Filter by type"
      urlParam="types"
      options={types}
      defaultOpen={true}
      showBottomBorder={false}
    />
  )
}
