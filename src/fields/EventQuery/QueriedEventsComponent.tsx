'use client'

import { Event } from '@/payload-types'
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

  const filterByEventGroups = useFormFields(
    ([fields]) => fields[parentPathParts.concat(['filterByEventGroups']).join('.')]?.value,
  )
  const filterByEventTypes = useFormFields(
    ([fields]) => fields[parentPathParts.concat(['filterByEventTypes']).join('.')]?.value,
  )
  const filterByEventTags = useFormFields(
    ([fields]) => fields[parentPathParts.concat(['filterByEventTags']).join('.')]?.value,
  )
  const sortBy = useFormFields(
    ([fields]) => fields[parentPathParts.concat(['sortBy']).join('.')]?.value,
  )
  const maxEvents = useFormFields(
    ([fields]) => fields[parentPathParts.concat(['maxEvents']).join('.')]?.value,
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

        if (
          filterByEventGroups &&
          Array.isArray(filterByEventGroups) &&
          filterByEventGroups.length > 0
        ) {
          const groupIds = filterByEventGroups.filter(Boolean)

          if (groupIds.length > 0) {
            params.append('where[type][in]', groupIds.join(','))
          }
        }

        if (
          filterByEventTypes &&
          Array.isArray(filterByEventTypes) &&
          filterByEventTypes.length > 0
        ) {
          const typeIds = filterByEventTypes.filter(Boolean)

          if (typeIds.length > 0) {
            params.append('where[type][in]', typeIds.join(','))
          }
        }

        if (filterByEventTags && Array.isArray(filterByEventTags) && filterByEventTags.length > 0) {
          const tagIds = filterByEventTags.filter(Boolean)

          if (tagIds.length > 0) {
            params.append('where[tags][in]', tagIds.join(','))
          }
        }
        params.append('where[startDate][greater_than]', new Date().toISOString())

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
    filterByEventGroups,
    filterByEventTags,
    filterByEventTypes,
    maxEvents,
    setDisabled,
    setValue,
    sortBy,
    tenant,
    value,
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
