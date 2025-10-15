'use client'
import { Checkbox } from '@/components/ui/checkbox'
import { EventSubType, EventType } from '@/payload-types'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Props = {
  eventTypes: EventType[]
  eventSubTypes: EventSubType[]
}

export const EventsFilters = ({ eventTypes, eventSubTypes }: Props) => {
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

    router.push(`/events?${params.toString()}`)
  }, [router, searchParams, selectedTypes, selectedSubTypes])

  return (
    <div className="space-y-6">
      {eventTypes.length > 0 && (
        <div className="mb-4">
          <h4 className="w-full">Filter by Event Type</h4>
          <hr className="p-2" />
          <ul className="flex flex-col gap-1.5 p-0 list-none">
            {eventTypes.map((type) => {
              const typeId = String(type.id)
              const isChecked = selectedTypes.includes(typeId)
              return (
                <li key={type.id}>
                  <div
                    className="cursor-pointer flex items-center"
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

      {eventSubTypes.length > 0 && (
        <div className="mb-4">
          <h4 className="w-full">Filter by Event Category</h4>
          <hr className="p-2" />
          <ul className="flex flex-col gap-1.5 p-0 list-none">
            {eventSubTypes.map((subType) => {
              const subTypeId = String(subType.id)
              const isChecked = selectedSubTypes.includes(subTypeId)
              return (
                <li key={subType.id}>
                  <div
                    className="cursor-pointer flex items-center"
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
