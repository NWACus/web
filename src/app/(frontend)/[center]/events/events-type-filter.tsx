'use client'

import { EventSubType, EventType } from '@/collections/Events/constants'
import { Checkbox } from '@/components/ui/checkbox'
import { Minus } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

type Props = {
  types: EventType[]
  subTypes: EventSubType[]
}

type ParentState = 'unchecked' | 'checked' | 'indeterminate'

export const EventsTypeFilter = ({ types, subTypes }: Props) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedSubTypes, setSelectedSubTypes] = useState<string[]>(() => {
    const subTypesParam = searchParams.get('subtypes')
    return subTypesParam ? subTypesParam.split(',').filter(Boolean) : []
  })

  const [selectedTypesWithoutSubTypes, setSelectedTypesWithoutSubTypes] = useState<string[]>(() => {
    const typesParam = searchParams.get('types')
    const typesFromUrl = typesParam ? typesParam.split(',').filter(Boolean) : []
    return typesFromUrl.filter((typeId) => !subTypes.some((st) => st.eventType === typeId))
  })

  const subTypesByType = subTypes.reduce(
    (acc, subType) => {
      const parentId = subType.eventType
      if (!acc[parentId]) acc[parentId] = []
      acc[parentId].push(subType.value)
      return acc
    },
    {} as Record<string, string[]>,
  )

  // Determine state of parent checkbox
  const getParentState = useCallback(
    (typeId: string): ParentState => {
      const childIds = subTypesByType[typeId] || []

      if (childIds.length === 0) {
        return selectedTypesWithoutSubTypes.includes(typeId) ? 'checked' : 'unchecked'
      }

      const selectedCount = childIds.filter((id) => selectedSubTypes.includes(id)).length
      if (selectedCount === 0) return 'unchecked'
      if (selectedCount === childIds.length) return 'checked'
      return 'indeterminate'
    },
    [selectedSubTypes, selectedTypesWithoutSubTypes, subTypesByType],
  )

  const pushUpdatedParams = useCallback(
    (newSubTypes: string[], newTypesWithoutSubTypes: string[]) => {
      const params = new URLSearchParams(searchParams.toString())

      const typesWithSubTypesSelected = types
        .filter((type) => {
          const childIds = subTypesByType[type.value]
          if (!childIds?.length) return false
          return (
            newTypesWithoutSubTypes.includes(type.value) ||
            childIds.every((id) => newSubTypes.includes(id))
          )
        })
        .map((type) => type.value)

      const allSelectedTypes = [...typesWithSubTypesSelected, ...newTypesWithoutSubTypes]

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

      router.push(`/events?${params.toString()}`, { scroll: false })
    },
    [searchParams, types, subTypesByType, router],
  )

  // Toggle parent type
  const toggleType = useCallback(
    (typeId: string) => {
      const childIds = subTypesByType[typeId] || []

      // Type has no subtypes - toggle it directly
      if (childIds.length === 0) {
        const newTypes = selectedTypesWithoutSubTypes.includes(typeId)
          ? selectedTypesWithoutSubTypes.filter((t) => t !== typeId)
          : [...selectedTypesWithoutSubTypes, typeId]
        setSelectedTypesWithoutSubTypes(newTypes)
        pushUpdatedParams(selectedSubTypes, newTypes)
      } else {
        // Type has subtypes - toggle all children
        const state = getParentState(typeId)
        const shouldCheck = state === 'indeterminate' || state === 'unchecked'
        const newSubTypes = shouldCheck
          ? Array.from(new Set([...selectedSubTypes, ...childIds]))
          : selectedSubTypes.filter((id) => !childIds.includes(id))
        setSelectedSubTypes(newSubTypes)
        pushUpdatedParams(newSubTypes, selectedTypesWithoutSubTypes)
      }
    },
    [
      getParentState,
      subTypesByType,
      selectedTypesWithoutSubTypes,
      selectedSubTypes,
      pushUpdatedParams,
    ],
  )

  // Toggle individual subtype
  const toggleSubType = useCallback(
    (subTypeId: string) => {
      const newSubTypes = selectedSubTypes.includes(subTypeId)
        ? selectedSubTypes.filter((s) => s !== subTypeId)
        : [...selectedSubTypes, subTypeId]
      setSelectedSubTypes(newSubTypes)
      pushUpdatedParams(newSubTypes, selectedTypesWithoutSubTypes)
    },
    [selectedSubTypes, selectedTypesWithoutSubTypes, pushUpdatedParams],
  )

  return (
    <div className="space-y-6">
      {types.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold">Filter by type</h3>
          <hr className="p-2" />
          <ul className="flex flex-col gap-1.5 p-0 list-none">
            {types.map((type) => {
              const typeId = type.value
              const parentState = getParentState(typeId)
              const childSubTypes = subTypes.filter((subType) => subType.eventType === typeId)

              return (
                <li key={typeId}>
                  <div
                    className="cursor-pointer flex items-center"
                    onClick={() => toggleType(typeId)}
                    aria-pressed={parentState === 'checked'}
                  >
                    <Checkbox
                      className="mr-2"
                      checked={parentState === 'checked' || parentState === 'indeterminate'}
                      icon={
                        parentState === 'indeterminate' ? <Minus className="h-4 w-4" /> : undefined
                      }
                    />
                    {type.label}
                  </div>

                  {childSubTypes.length > 0 && (
                    <ul className="flex flex-col gap-1.5 p-0 list-none ml-6 mt-1.5">
                      {childSubTypes.map((subType) => (
                        <li key={subType.value}>
                          <div
                            className="cursor-pointer flex items-center"
                            onClick={() => toggleSubType(subType.value)}
                            aria-pressed={selectedSubTypes.includes(subType.value)}
                          >
                            <Checkbox
                              className="mr-2"
                              checked={selectedSubTypes.includes(subType.value)}
                            />
                            {subType.label}
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
