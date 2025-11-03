'use client'

import { EventSubType, EventType } from '@/collections/Events/constants'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Minus, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

type Props = {
  types: EventType[]
  subTypes: EventSubType[]
}

type CheckboxState = 'unchecked' | 'checked' | 'indeterminate'

export const EventsTypeFilter = ({ types, subTypes }: Props) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [selectedSubTypes, setSelectedSubTypes] = useState<string[]>(() => {
    const subTypesParam = searchParams.get('subtypes')
    return subTypesParam ? subTypesParam.split(',').filter(Boolean) : []
  })

  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
    const typesParam = searchParams.get('types')
    const typesFromUrl = typesParam ? typesParam.split(',').filter(Boolean) : []
    return typesFromUrl.filter((typeId) => !subTypes.some((st) => st.eventType === typeId))
  })

  const subTypesByType = subTypes.reduce((acc: Record<string, string[]>, subType) => {
    const subTypeEventType: string = subType.eventType
    if (!acc[subTypeEventType]) acc[subTypeEventType] = []
    acc[subTypeEventType].push(subType.value)
    return acc
  }, {})

  // Determine state of parent checkbox
  const getCheckboxState = useCallback(
    (typeId: string): CheckboxState => {
      const childIds = subTypesByType[typeId] || []

      if (childIds.length === 0) {
        return selectedTypes.includes(typeId) ? 'checked' : 'unchecked'
      }

      const selectedCount = childIds.filter((id) => selectedSubTypes.includes(id)).length
      if (selectedCount === 0) return 'unchecked'
      if (selectedCount === childIds.length) return 'checked'
      return 'indeterminate'
    },
    [selectedSubTypes, selectedTypes, subTypesByType],
  )

  const updateParams = useCallback(
    (newTypes: string[], newSubTypes: string[]) => {
      const params = new URLSearchParams(searchParams.toString())

      const typesWithSubTypesSelected = types
        .filter((type) => {
          const childIds = subTypesByType[type.value]
          if (!childIds?.length) return false
          return newTypes.includes(type.value) || childIds.every((id) => newSubTypes.includes(id))
        })
        .map((type) => type.value)

      const allSelectedTypes = [...typesWithSubTypesSelected, ...newTypes]

      if (allSelectedTypes.length > 0) {
        params.set('types', allSelectedTypes.join(','))
      } else {
        params.delete('types')
      }

      if (newSubTypes.length > 0) {
        params.set('subtypes', newSubTypes.join(','))
      } else {
        params.delete('subtypes')
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, types, router, pathname, subTypesByType],
  )

  // Toggle parent type
  const toggleType = useCallback(
    (typeId: string) => {
      const childIds = subTypesByType[typeId] || []

      // Type has no subtypes - toggle it directly
      if (childIds.length === 0) {
        const newTypes = selectedTypes.includes(typeId)
          ? selectedTypes.filter((t) => t !== typeId)
          : [...selectedTypes, typeId]
        setSelectedTypes(newTypes)
        updateParams(newTypes, selectedSubTypes)
      } else {
        // Type has subtypes - toggle all children
        const state = getCheckboxState(typeId)
        const shouldBeCheck = state === 'indeterminate' || state === 'unchecked'
        const newSubTypes = shouldBeCheck
          ? Array.from(new Set([...selectedSubTypes, ...childIds]))
          : selectedSubTypes.filter((id) => !childIds.includes(id))
        setSelectedSubTypes(newSubTypes)
        updateParams(selectedTypes, newSubTypes)
      }
    },
    [getCheckboxState, subTypesByType, selectedTypes, selectedSubTypes, updateParams],
  )

  // Toggle individual subtype
  const toggleSubType = useCallback(
    (subTypeId: string) => {
      const newSubTypes = selectedSubTypes.includes(subTypeId)
        ? selectedSubTypes.filter((s) => s !== subTypeId)
        : [...selectedSubTypes, subTypeId]
      setSelectedSubTypes(newSubTypes)
      updateParams(selectedTypes, newSubTypes)
    },
    [selectedSubTypes, selectedTypes, updateParams],
  )

  const clearFilter = () => {
    setSelectedTypes([])
    setSelectedSubTypes([])

    const params = new URLSearchParams(searchParams.toString())
    params.delete('types')
    params.delete('subtypes')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      {types.length > 0 && (
        <div className="mb-4">
          <div className="hidden md:flex justify-between items-center">
            <h3 className="font-semibold my-2">Filter by type</h3>
            {(selectedTypes.length > 0 || selectedSubTypes.length > 0) && (
              <Button onClick={clearFilter} variant="ghost">
                <X width={16} />
              </Button>
            )}
          </div>
          <hr className="hidden md:block p-2" />
          <ul className="flex flex-col gap-1 p-0 list-none">
            {types.map((type) => {
              const typeId = type.value
              const CheckboxState = getCheckboxState(typeId)
              const childSubTypes = subTypes.filter((subType) => subType.eventType === typeId)

              return (
                <li key={typeId}>
                  <div
                    className="cursor-pointer flex items-center"
                    onClick={() => toggleType(typeId)}
                  >
                    <Checkbox
                      id={typeId}
                      className="mr-2"
                      checked={CheckboxState === 'checked' || CheckboxState === 'indeterminate'}
                      icon={CheckboxState === 'indeterminate' && <Minus className="h-4 w-4" />}
                    />
                    <Label htmlFor={typeId} className="text-md">
                      {type.label}
                    </Label>
                  </div>

                  {childSubTypes.length > 0 && (
                    <ul className="flex flex-col gap-1 p-0 list-none ml-6 mt-1.5">
                      {childSubTypes.map((subType) => (
                        <li key={subType.value}>
                          <div className="cursor-pointer flex items-center">
                            <Checkbox
                              id={subType.value}
                              className="mr-2"
                              checked={selectedSubTypes.includes(subType.value)}
                              onCheckedChange={() => toggleSubType(subType.value)}
                            />
                            <Label htmlFor={subType.value} className="text-md">
                              {subType.label}
                            </Label>
                          </div>
                        </li>
                      ))}
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
