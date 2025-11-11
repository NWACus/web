'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ChevronDown } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

export type CheckboxOption = {
  label: string
  value: string
}

type CheckboxFilterProps = {
  title: string
  urlParam: string
  options: CheckboxOption[]
  defaultOpen?: boolean
  maxHeight?: string
  hideOnEmpty?: boolean
}

export const CheckboxFilter = ({
  title,
  urlParam,
  options,
  defaultOpen = false,
  maxHeight,
  hideOnEmpty = true,
}: CheckboxFilterProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const [selectedValues, setSelectedValues] = useState<string[]>(() => {
    const param = searchParams.get(urlParam)
    return param ? param.split(',').filter(Boolean) : []
  })

  const updateParams = useCallback(
    (newValues: string[]) => {
      const params = new URLSearchParams(searchParams.toString())

      if (newValues.length > 0) {
        params.set(urlParam, newValues.join(','))
      } else {
        params.delete(urlParam)
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname, urlParam],
  )

  const toggleValue = useCallback(
    (value: string) => {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value]
      setSelectedValues(newValues)
      updateParams(newValues)
    },
    [selectedValues, updateParams],
  )

  const clearFilter = () => {
    setSelectedValues([])

    const params = new URLSearchParams(searchParams.toString())
    params.delete(urlParam)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  if (hideOnEmpty && options.length === 0) {
    return null
  }

  const listClasses = `flex flex-col gap-1 p-0 list-none pb-4 ${maxHeight ? `${maxHeight} overflow-y-auto` : ''}`

  return (
    <div className="border-b">
      {options.length > 0 && (
        <div>
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between py-3 cursor-pointer transition-colors"
          >
            <h3 className="font-semibold">{title}</h3>
            <div className="flex items-center gap-2">
              {selectedValues.length > 0 && (
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
            <ul className={listClasses}>
              {options.map((option) => (
                <li key={option.value}>
                  <div
                    className="cursor-pointer flex items-center"
                    onClick={() => toggleValue(option.value)}
                  >
                    <Checkbox
                      id={option.value}
                      className="mr-2"
                      checked={selectedValues.includes(option.value)}
                    />
                    <Label htmlFor={option.value} className="text-md">
                      {option.label}
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
