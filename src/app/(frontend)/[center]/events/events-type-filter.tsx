'use client'

import { CheckboxFilter } from '@/components/filters/CheckboxFilter'
import { EventType } from '@/constants/eventTypes'

type Props = {
  types: EventType[]
}

export const EventsTypeFilter = ({ types }: Props) => {
  return (
    <CheckboxFilter title="Filter by type" urlParam="types" options={types} defaultOpen={true} />
  )
}
