'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/utilities/ui'
import Fuse from 'fuse.js'
import { ChevronDown, Search, X } from 'lucide-react'
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import { useCallback, useMemo, useState } from 'react'

export type CheckboxOption = {
  label: string
  value: string
}

export type CheckboxFilterProps = {
  title: string
  titleClassName?: string
  urlParam: string
  options: CheckboxOption[]
  defaultOpen?: boolean
  maxHeight?: string
  hideOnEmpty?: boolean
  showBottomBorder?: boolean
  enableSearch?: boolean
  searchPlaceholder?: string
}

export const CheckboxFilter = ({
  title,
  titleClassName,
  urlParam,
  options,
  defaultOpen = false,
  maxHeight,
  hideOnEmpty = true,
  showBottomBorder = true,
  enableSearch = false,
  searchPlaceholder = 'Search...',
}: CheckboxFilterProps) => {
  const [selectedValues, setSelectedValues] = useQueryState(
    urlParam,
    parseAsArrayOf(parseAsString).withDefault([]),
  )
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [searchQuery, setSearchQuery] = useState('')

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(options, {
        keys: ['label'],
        threshold: 0.3,
        includeScore: true,
      }),
    [options],
  )

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!enableSearch || !searchQuery.trim()) {
      return options
    }
    return fuse.search(searchQuery).map((result) => result.item)
  }, [enableSearch, searchQuery, options, fuse])

  const toggleValue = useCallback(
    (value: string) => {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value]
      setSelectedValues(newValues.length > 0 ? newValues : null)
    },
    [selectedValues, setSelectedValues],
  )

  const clearFilter = () => {
    setSelectedValues(null)
  }

  if (hideOnEmpty && options.length === 0) {
    return null
  }

  return (
    <div className={showBottomBorder ? 'border-b' : ''}>
      {options.length > 0 && (
        <div>
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between py-3 cursor-pointer transition-colors"
          >
            <h3 className={cn('font-semibold', titleClassName)}>{title}</h3>
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
            <>
              {enableSearch && (
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 pr-8 text-sm"
                  />
                  {searchQuery && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0.5 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-transparent"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </Button>
                  )}
                </div>
              )}
              {filteredOptions.length === 0 ? (
                <div className="pt-1 pb-3 text-center text-sm text-muted-foreground">
                  {searchQuery ? 'No results found' : 'No options available'}
                </div>
              ) : (
                <ul
                  className={cn(
                    'flex flex-col gap-2.5 p-0 list-none pb-4',
                    maxHeight && `${maxHeight} overflow-y-auto`,
                  )}
                >
                  {filteredOptions.map((option) => (
                    <li key={option.value}>
                      <Label htmlFor={option.value} className="cursor-pointer flex items-center">
                        <Checkbox
                          id={option.value}
                          className="mr-2"
                          checked={selectedValues.includes(option.value)}
                          onCheckedChange={() => toggleValue(option.value)}
                        />
                        <span>{option.label}</span>
                      </Label>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
