'use client'
import { EventSubType, EventType } from '@/collections/Events/constants'
import { Checkbox } from '@/components/ui/checkbox'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Props = {
  types: EventType[]
  subTypes: EventSubType[]
}

export const EventsFilters = ({ types, subTypes }: Props) => {
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
      {types.length > 0 && (
        <div className="mb-4">
          <h4 className="w-full">Filter by Event Type</h4>
          <hr className="p-2" />
          <ul className="flex flex-col gap-1.5 p-0 list-none">
            {types.map((type) => {
              const typeId = type.value
              const isTypeChecked = selectedTypes.includes(typeId)
              const childSubTypes = subTypes.filter((subType) => {
                const parentTypeId = subType.eventType
                return parentTypeId === typeId
              })

              return (
                <li key={type.value}>
                  <div
                    className="cursor-pointer flex items-center"
                    onClick={() => toggleType(typeId)}
                    aria-pressed={isTypeChecked}
                  >
                    <Checkbox className="mr-2" checked={isTypeChecked} />
                    {type.label}
                  </div>

                  {childSubTypes.length > 0 && (
                    <ul className="flex flex-col gap-1.5 p-0 list-none ml-6 mt-1.5">
                      {childSubTypes.map((subType) => {
                        const subTypeId = subType.value
                        const isSubTypeChecked = selectedSubTypes.includes(subTypeId)
                        return (
                          <li key={subType.value}>
                            <div
                              className="cursor-pointer flex items-center"
                              onClick={() => toggleSubType(subTypeId)}
                              aria-pressed={isSubTypeChecked}
                            >
                              <Checkbox className="mr-2" checked={isSubTypeChecked} />
                              {subType.label}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
