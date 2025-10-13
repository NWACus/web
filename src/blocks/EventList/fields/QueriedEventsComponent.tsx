'use client'

import { Event, EventSubType, EventType } from '@/payload-types'
import { useTenantSelection } from '@/providers/TenantSelectionProvider/index.client'
import { FieldDescription, SelectInput, useField, useForm, useFormFields } from '@payloadcms/ui'
import { OptionObject } from 'payload'
import { useEffect, useState } from 'react'

type QueriedEventsComponentProps = {
  path: string
  field?: {
    label?: string
  }
}

export const QueriedEventsComponent = ({ path, field }: QueriedEventsComponentProps) => {
  const label = field?.label || 'Queried Events'
  const parentPathParts = path.split('.').slice(0, -1)

  const { value, setValue } = useField<Event[]>({ path })
  const [isLoading, setIsLoading] = useState(false)
  const [fetchedEvents, setFetchedEvents] = useState<Event[]>([])
  const [selectOptions, setSelectOptions] = useState<OptionObject[]>([])
  const { setDisabled } = useForm()

  const filterByEventTypes = useFormFields(
    ([fields]) => fields[parentPathParts.concat(['filterByEventTypes']).join('.')]?.value,
  )
  const filterByEventSubTypes = useFormFields(
    ([fields]) => fields[parentPathParts.concat(['filterByEventSubTypes']).join('.')]?.value,
  )
  const sortBy = useFormFields(
    ([fields]) => fields[parentPathParts.concat(['sortBy']).join('.')]?.value,
  )
  const maxEvents = useFormFields(
    ([fields]) => fields[parentPathParts.concat(['maxEvents']).join('.')]?.value,
  )
  const showUpcomingOnly = useFormFields(
    ([fields]) => fields[parentPathParts.concat(['showUpcomingOnly']).join('.')]?.value,
  )
  const { selectedTenantID: tenant } = useTenantSelection()

  useEffect(() => {
    if (!tenant) {
      return
    }

    const fetchEvents = async () => {
      setIsLoading(true)
      setDisabled(true)

      try {
        const tenantId = typeof tenant === 'number' ? tenant : (tenant as { id?: number })?.id
        if (!tenantId) return

        const params = new URLSearchParams({
          limit: String(maxEvents || 4),
          depth: '1',
          'where[tenant][equals]': String(tenantId),
        })

        if (sortBy) {
          params.append('sort', String(sortBy))
        }

        if (showUpcomingOnly) {
          params.append('where[startDate][greater_than]', new Date().toISOString())
        }

        if (
          filterByEventTypes &&
          Array.isArray(filterByEventTypes) &&
          filterByEventTypes.length > 0
        ) {
          const typeIds = filterByEventTypes
            .map((type: number | EventType) => (typeof type === 'number' ? type : type.id))
            .filter(Boolean)

          if (typeIds.length > 0) {
            params.append('where[eventType][in]', typeIds.join(','))
          }
        }

        if (
          filterByEventSubTypes &&
          Array.isArray(filterByEventSubTypes) &&
          filterByEventSubTypes.length > 0
        ) {
          const subTypeIds = filterByEventSubTypes
            .map((subType: number | EventSubType) =>
              typeof subType === 'number' ? subType : subType.id,
            )
            .filter(Boolean)

          if (subTypeIds.length > 0) {
            params.append('where[eventSubType][in]', subTypeIds.join(','))
          }
        }

        const response = await fetch(`/api/events?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch events')
        }

        const data = await response.json()
        const events = data.docs || []
        setFetchedEvents(events)

        const options: OptionObject[] = events.map((event: Event) => ({
          label: event.title,
          value: String(event.id),
        }))
        setSelectOptions(options)

        const currentEventIds = (value || [])
          .map((event) => (typeof event === 'number' ? event : event.id))
          .sort()
        const newEventIds = events.map((event: Event) => event.id).sort()

        if (JSON.stringify(currentEventIds) !== JSON.stringify(newEventIds)) {
          setValue(events)
        }
      } catch (error) {
        console.error('Error fetching events for EventList block:', error)
        setFetchedEvents([])
        setSelectOptions([])
        setValue([])
      } finally {
        setIsLoading(false)
        setDisabled(false)
      }
    }

    fetchEvents()
  }, [
    filterByEventTypes,
    filterByEventSubTypes,
    sortBy,
    maxEvents,
    showUpcomingOnly,
    tenant,
    setValue,
    value,
    setDisabled,
  ])

  const currentValue = fetchedEvents.map((event) => String(event.id))

  return (
    <div className="field-type">
      <SelectInput
        label={label}
        name={path}
        path={path}
        options={selectOptions}
        value={currentValue}
        hasMany
        readOnly={true}
        isClearable={false}
        placeholder={isLoading ? 'Loading events...' : 'No events match current filters'}
      />
      <FieldDescription
        description={`Events are automatically updated based on filter settings. ${isLoading ? 'Updating...' : ''}`}
        path={path}
      />
    </div>
  )
}
