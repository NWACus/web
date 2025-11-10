'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { stateOptions } from '@/fields/location/states'
import { ChevronDown } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

export const CoursesLocationFilter = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const [selectedStates, setSelectedStates] = useState<string[]>(() => {
    const statesParam = searchParams.get('states')
    return statesParam ? statesParam.split(',').filter(Boolean) : []
  })

  const updateParams = useCallback(
    (newStates: string[]) => {
      const params = new URLSearchParams(searchParams.toString())

      if (newStates.length > 0) {
        params.set('states', newStates.join(','))
      } else {
        params.delete('states')
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  const toggleState = useCallback(
    (stateValue: string) => {
      const newStates = selectedStates.includes(stateValue)
        ? selectedStates.filter((s) => s !== stateValue)
        : [...selectedStates, stateValue]
      setSelectedStates(newStates)
      updateParams(newStates)
    },
    [selectedStates, updateParams],
  )

  const clearFilter = () => {
    setSelectedStates([])

    const params = new URLSearchParams(searchParams.toString())
    params.delete('states')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="border-b">
      {stateOptions.length > 0 && (
        <div>
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between py-3 cursor-pointer transition-colors"
          >
            <h3 className="font-semibold">Location</h3>
            <div className="flex items-center gap-2">
              {selectedStates.length > 0 && (
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
            <ul className="flex flex-col gap-1 p-0 list-none max-h-64 overflow-y-auto pb-4">
              {stateOptions.map((state) => (
                <li key={state.value}>
                  <div
                    className="cursor-pointer flex items-center"
                    onClick={() => toggleState(state.value)}
                  >
                    <Checkbox
                      id={state.value}
                      className="mr-2"
                      checked={selectedStates.includes(state.value)}
                    />
                    <Label htmlFor={state.value} className="text-md">
                      {state.label}
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
