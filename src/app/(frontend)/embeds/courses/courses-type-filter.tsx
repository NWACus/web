'use client'

import { courseTypesData } from '@/collections/Courses/constants'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ChevronDown } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

export const CoursesTypeFilter = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

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
    <div className="border-b">
      {courseTypesData.length > 0 && (
        <div>
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between py-3 cursor-pointer transition-colors"
          >
            <h3 className="font-semibold">Course Type</h3>
            <div className="flex items-center gap-2">
              {selectedTypes.length > 0 && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    clearFilter()
                  }}
                  variant="ghost"
                  className="underline text-sm h-auto p-0"
                >
                  Clear
                </Button>
              )}
              <ChevronDown
                className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </div>
          {isOpen && (
            <ul className="flex flex-col gap-1 p-0 list-none pb-4">
              {courseTypesData.map((type) => (
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
          )}
        </div>
      )}
    </div>
  )
}
