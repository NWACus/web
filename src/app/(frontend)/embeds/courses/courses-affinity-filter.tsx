'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ChevronDown } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

const affinityGroupsOptions = [
  { label: 'LGBTQ+', value: 'lgbtq' },
  { label: "Women's Specific", value: 'womens-specific' },
  { label: 'Youth Specific', value: 'youth-specific' },
]

export const CoursesAffinityFilter = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const [selectedGroups, setSelectedGroups] = useState<string[]>(() => {
    const groupsParam = searchParams.get('affinityGroups')
    return groupsParam ? groupsParam.split(',').filter(Boolean) : []
  })

  const updateParams = useCallback(
    (newGroups: string[]) => {
      const params = new URLSearchParams(searchParams.toString())

      if (newGroups.length > 0) {
        params.set('affinityGroups', newGroups.join(','))
      } else {
        params.delete('affinityGroups')
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  const toggleGroup = useCallback(
    (groupValue: string) => {
      const newGroups = selectedGroups.includes(groupValue)
        ? selectedGroups.filter((g) => g !== groupValue)
        : [...selectedGroups, groupValue]
      setSelectedGroups(newGroups)
      updateParams(newGroups)
    },
    [selectedGroups, updateParams],
  )

  const clearFilter = () => {
    setSelectedGroups([])

    const params = new URLSearchParams(searchParams.toString())
    params.delete('affinityGroups')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="border-b">
      {affinityGroupsOptions.length > 0 && (
        <div>
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between py-3 cursor-pointer transition-colors"
          >
            <h3 className="font-semibold">Affinity Group</h3>
            <div className="flex items-center gap-2">
              {selectedGroups.length > 0 && (
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
              {affinityGroupsOptions.map((group) => (
                <li key={group.value}>
                  <div
                    className="cursor-pointer flex items-center"
                    onClick={() => toggleGroup(group.value)}
                  >
                    <Checkbox
                      id={group.value}
                      className="mr-2"
                      checked={selectedGroups.includes(group.value)}
                    />
                    <Label htmlFor={group.value} className="text-md">
                      {group.label}
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
