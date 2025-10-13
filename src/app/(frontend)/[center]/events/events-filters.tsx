'use client'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { EventSubType, EventType } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Props = {
  eventTypes: EventType[]
  eventSubTypes: EventSubType[]
  showUpcomingOnly: boolean
}

export const EventsFilters = ({ eventTypes, eventSubTypes, showUpcomingOnly }: Props) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasUserInteracted = useRef(false)

  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
    const typesParam = searchParams.get('types')
    return typesParam ? typesParam.split(',').filter(Boolean) : []
  })

  const [selectedSubTypes, setSelectedSubTypes] = useState<string[]>(() => {
    const subTypesParam = searchParams.get('subtypes')
    return subTypesParam ? subTypesParam.split(',').filter(Boolean) : []
  })

  const [upcomingOnly, setUpcomingOnly] = useState(showUpcomingOnly)

  const toggleType = (id: string) => {
    hasUserInteracted.current = true
    setSelectedTypes((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  const toggleSubType = (id: string) => {
    hasUserInteracted.current = true
    setSelectedSubTypes((prev) =>
      prev.includes(id) ? prev.filter((st) => st !== id) : [...prev, id],
    )
  }

  const toggleUpcomingOnly = (checked: boolean) => {
    hasUserInteracted.current = true
    setUpcomingOnly(checked)
  }

  useEffect(() => {
    if (!hasUserInteracted.current) return

    const params = new URLSearchParams(searchParams.toString())

    if (selectedTypes.length > 0) {
      params.set('types', selectedTypes.join(','))
    } else {
      params.delete('types')
    }

    if (selectedSubTypes.length > 0) {
      params.set('subtypes', selectedSubTypes.join(','))
    } else {
      params.delete('subtypes')
    }

    params.set('upcoming', String(upcomingOnly))

    router.push(`/events?${params.toString()}`)
  }, [router, searchParams, selectedTypes, selectedSubTypes, upcomingOnly])

  return (
    <div className="space-y-6">
      {/* Upcoming Only Toggle */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Switch id="upcoming-only" checked={upcomingOnly} onCheckedChange={toggleUpcomingOnly} />
          <Label htmlFor="upcoming-only">Show Upcoming Events Only</Label>
        </div>
      </div>

      {/* Event Types Filter */}
      {eventTypes.length > 0 && (
        <div className="mb-4">
          <h4 className="w-full">Filter by Event Type</h4>
          <hr className="p-2" />
          <ul className="flex flex-col gap-3 p-0 list-none">
            {eventTypes.map((type) => {
              const typeId = String(type.id)
              const isChecked = selectedTypes.includes(typeId)
              return (
                <li key={type.id}>
                  <div
                    className={cn(
                      'p-2 rounded-md cursor-pointer flex items-center border border-brand-200 text-primary bg-white',
                      { 'bg-brand-200': isChecked },
                    )}
                    onClick={() => toggleType(typeId)}
                    aria-pressed={isChecked}
                  >
                    <Checkbox className="mr-2" checked={isChecked} />
                    {type.title}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Event SubTypes Filter */}
      {eventSubTypes.length > 0 && (
        <div className="mb-4">
          <h4 className="w-full">Filter by Event Category</h4>
          <hr className="p-2" />
          <ul className="flex flex-col gap-3 p-0 list-none">
            {eventSubTypes.map((subType) => {
              const subTypeId = String(subType.id)
              const isChecked = selectedSubTypes.includes(subTypeId)
              return (
                <li key={subType.id}>
                  <div
                    className={cn(
                      'p-2 rounded-md cursor-pointer flex items-center border border-brand-200 text-primary bg-white',
                      { 'bg-brand-200': isChecked },
                    )}
                    onClick={() => toggleSubType(subTypeId)}
                    aria-pressed={isChecked}
                  >
                    <Checkbox className="mr-2" checked={isChecked} />
                    {subType.title}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
