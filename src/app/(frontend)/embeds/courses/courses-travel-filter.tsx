'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ChevronDown } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

const modesOfTravelOptions = [
  { label: 'Ski', value: 'ski' },
  { label: 'Splitboard', value: 'splitboard' },
  { label: 'Motorized', value: 'motorized' },
  { label: 'Snowshoe', value: 'snowshoe' },
]

export const CoursesTravelFilter = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const [selectedModes, setSelectedModes] = useState<string[]>(() => {
    const modesParam = searchParams.get('modesOfTravel')
    return modesParam ? modesParam.split(',').filter(Boolean) : []
  })

  const updateParams = useCallback(
    (newModes: string[]) => {
      const params = new URLSearchParams(searchParams.toString())

      if (newModes.length > 0) {
        params.set('modesOfTravel', newModes.join(','))
      } else {
        params.delete('modesOfTravel')
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  const toggleMode = useCallback(
    (modeValue: string) => {
      const newModes = selectedModes.includes(modeValue)
        ? selectedModes.filter((m) => m !== modeValue)
        : [...selectedModes, modeValue]
      setSelectedModes(newModes)
      updateParams(newModes)
    },
    [selectedModes, updateParams],
  )

  const clearFilter = () => {
    setSelectedModes([])

    const params = new URLSearchParams(searchParams.toString())
    params.delete('modesOfTravel')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="border-b">
      {modesOfTravelOptions.length > 0 && (
        <div>
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between py-3 cursor-pointer transition-colors"
          >
            <h3 className="font-semibold">Mode of Travel</h3>
            <div className="flex items-center gap-2">
              {selectedModes.length > 0 && (
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
              {modesOfTravelOptions.map((mode) => (
                <li key={mode.value}>
                  <div
                    className="cursor-pointer flex items-center"
                    onClick={() => toggleMode(mode.value)}
                  >
                    <Checkbox
                      id={mode.value}
                      className="mr-2"
                      checked={selectedModes.includes(mode.value)}
                    />
                    <Label htmlFor={mode.value} className="text-md">
                      {mode.label}
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
