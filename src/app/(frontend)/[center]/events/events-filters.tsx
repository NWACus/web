'use client'
import { EventType } from '@/collections/Events/constants'
import { Checkbox } from '@/components/ui/checkbox'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Props = {
  types: EventType[]
}

export const EventsFilters = ({ types }: Props) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasUserInteracted = useRef(false)

  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
    const typesParam = searchParams.get('types')
    return typesParam ? typesParam.split(',').filter(Boolean) : []
  })

  const toggleType = (id: string) => {
    hasUserInteracted.current = true
    setSelectedTypes((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  useEffect(() => {
    if (!hasUserInteracted.current) return

    const params = new URLSearchParams(searchParams.toString())

    if (selectedTypes.length > 0) {
      params.set('types', selectedTypes.join(','))
    } else {
      params.delete('types')
    }

    router.push(`/events?${params.toString()}`)
  }, [router, searchParams, selectedTypes])

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
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
