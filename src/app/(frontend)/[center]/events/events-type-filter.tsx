'use client'

import { EventType } from '@/collections/Events/constants'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

type Props = {
  types: EventType[]
}

export const EventsTypeFilter = ({ types }: Props) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
    const typesParam = searchParams.get('types')
    return typesParam ? typesParam.split(',').filter(Boolean) : []
  })

  const updateParams = useCallback(
    (newTypes: string[]) => {
      const params = new URLSearchParams(searchParams.toString())

      if (newTypes.length > 0) {
        params.set('types', newTypes.join(','))
      } else {
        params.delete('types')
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  const toggleType = useCallback(
    (typeId: string) => {
      const newTypes = selectedTypes.includes(typeId)
        ? selectedTypes.filter((t) => t !== typeId)
        : [...selectedTypes, typeId]
      setSelectedTypes(newTypes)
      updateParams(newTypes)
    },
    [selectedTypes, updateParams],
  )

  const clearFilter = () => {
    setSelectedTypes([])

    const params = new URLSearchParams(searchParams.toString())
    params.delete('types')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      {types.length > 0 && (
        <div className="mb-4">
          <div className="hidden md:flex justify-between items-center">
            <h3 className="font-semibold my-2">Filter by type</h3>
            {selectedTypes.length > 0 && (
              <Button onClick={clearFilter} variant="ghost">
                <X width={16} />
              </Button>
            )}
          </div>
          <hr className="hidden md:block p-2" />
          <ul className="flex flex-col gap-1 p-0 list-none">
            {types.map((type) => (
              <li key={type.value}>
                <div
                  className="cursor-pointer flex items-center"
                  onClick={() => toggleType(type.value)}
                >
                  <Checkbox
                    id={type.value}
                    className="mr-2"
                    checked={selectedTypes.includes(type.value)}
                  />
                  <Label htmlFor={type.value} className="text-md">
                    {type.label}
                  </Label>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
