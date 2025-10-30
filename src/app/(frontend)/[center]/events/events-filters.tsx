'use client'

import { EventSubType, EventType } from '@/collections/Events/constants'
import { Checkbox } from '@/components/ui/checkbox'
import { Minus } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  types: EventType[]
  subTypes: EventSubType[]
}

type ParentState = 'unchecked' | 'checked' | 'indeterminate'

export const EventsFilters = ({ types, subTypes }: Props) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasUserInteracted = useRef(false)

  // Initialize from URL params
  const [selectedSubTypes, setSelectedSubTypes] = useState(
    () => new Set(searchParams.get('subtypes')?.split(',').filter(Boolean) || []),
  )

  const [selectedTypesWithoutSubTypes, setSelectedTypesWithoutSubTypes] = useState(() => {
    const typesFromUrl = searchParams.get('types')?.split(',').filter(Boolean) || []
    return new Set(typesFromUrl.filter((typeId) => !subTypes.some((st) => st.eventType === typeId)))
  })

  // Create lookup map: typeId -> [subTypeId, subTypeId, ...]
  const subTypesByParent = useMemo(
    () =>
      subTypes.reduce(
        (acc, subType) => {
          const parentId = subType.eventType
          if (!acc[parentId]) acc[parentId] = []
          acc[parentId].push(subType.value)
          return acc
        },
        {} as Record<string, string[]>,
      ),
    [subTypes],
  )

  // Determine state of parent checkbox
  const getParentState = useCallback(
    (typeId: string): ParentState => {
      const childIds = subTypesByParent[typeId] || []

      if (childIds.length === 0) {
        return selectedTypesWithoutSubTypes.has(typeId) ? 'checked' : 'unchecked'
      }

      const selectedCount = childIds.filter((id) => selectedSubTypes.has(id)).length
      if (selectedCount === 0) return 'unchecked'
      if (selectedCount === childIds.length) return 'checked'
      return 'indeterminate'
    },
    [selectedSubTypes, selectedTypesWithoutSubTypes, subTypesByParent],
  )

  // Toggle parent type
  const toggleType = useCallback(
    (typeId: string) => {
      hasUserInteracted.current = true
      const childIds = subTypesByParent[typeId] || []

      if (childIds.length === 0) {
        // Type has no subtypes - toggle it directly
        setSelectedTypesWithoutSubTypes((prev) => {
          const selectedTypes = new Set(prev)
          if (selectedTypes.has(typeId)) selectedTypes.delete(typeId)
          else selectedTypes.add(typeId)
          return selectedTypes
        })
      } else {
        // Type has subtypes - toggle all children
        const state = getParentState(typeId)
        setSelectedSubTypes((prev) => {
          const selectedSubTypes = new Set(prev)
          const shouldCheck = state === 'indeterminate' || state === 'unchecked'
          childIds.forEach((id) =>
            shouldCheck ? selectedSubTypes.add(id) : selectedSubTypes.delete(id),
          )
          return selectedSubTypes
        })
      }
    },
    [getParentState, subTypesByParent],
  )

  // Toggle individual subtype
  const toggleSubType = useCallback((subTypeId: string) => {
    hasUserInteracted.current = true
    setSelectedSubTypes((prev) => {
      const selectedSubTypes = new Set(prev)
      if (selectedSubTypes.has(subTypeId)) selectedSubTypes.delete(subTypeId)
      else selectedSubTypes.add(subTypeId)
      return selectedSubTypes
    })
  }, [])

  // Update URL params when selections change
  useEffect(() => {
    if (!hasUserInteracted.current) return

    const params = new URLSearchParams(searchParams.toString())

    // Types with subtypes that have selections
    const typesWithSubTypesSelected = types
      .filter((type) => {
        const childIds = subTypesByParent[type.value]
        if (!childIds?.length) return false
        const state = getParentState(type.value)
        return state === 'checked' || state === 'indeterminate'
      })
      .map((type) => type.value)

    // Combine with standalone types
    const allSelectedTypes = [...typesWithSubTypesSelected, ...selectedTypesWithoutSubTypes]

    if (allSelectedTypes.length > 0) params.set('types', allSelectedTypes.join(','))
    else params.delete('types')

    if (selectedSubTypes.size > 0) params.set('subtypes', Array.from(selectedSubTypes).join(','))
    else params.delete('subtypes')

    router.push(`/events?${params.toString()}`, { scroll: false })
  }, [
    router,
    searchParams,
    selectedSubTypes,
    selectedTypesWithoutSubTypes,
    types,
    getParentState,
    subTypesByParent,
  ])

  return (
    <div className="space-y-6">
      {types.length > 0 && (
        <div className="mb-4">
          <h4 className="w-full">Filter by type</h4>
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
                            aria-pressed={selectedSubTypes.has(subType.value)}
                          >
                            <Checkbox
                              className="mr-2"
                              checked={selectedSubTypes.has(subType.value)}
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
