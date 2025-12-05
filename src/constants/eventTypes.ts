export type EventType = {
  label: string
  value: 'awareness' | 'field-class' | 'event'
  description?: string | null
}

export const eventTypesData: EventType[] = [
  {
    label: 'Event',
    value: 'event',
  },
  {
    label: 'Awareness Class',
    value: 'awareness',
  },
  {
    label: 'Field Class',
    value: 'field-class',
  },
]
