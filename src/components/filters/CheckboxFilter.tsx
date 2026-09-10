'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/utilities/ui'
import Fuse from 'fuse.js'
import { Search, X } from 'lucide-react'
import { parseAsArrayOf, parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { useCallback, useId, useMemo, useState } from 'react'
import { FilterSection } from './FilterSection'

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
  /**
   * Whether a change stays client-side (the default; the list beside it refetches on its own) or
   * re-renders the server component tree with the new URL, for a page whose list is rendered on the
   * server from the search params.
   */
  shallow?: boolean
  /** Other params cleared whenever this filter changes — a `page` number, typically. */
  resetParams?: string[]
}

const EMPTY_RESET_PARAMS: string[] = []

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
  shallow = true,
  resetParams = EMPTY_RESET_PARAMS,
}: CheckboxFilterProps) => {
  const [selectedValues, setSelectedValues] = useQueryState(
    urlParam,
    parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow }),
  )
  const [, setResetParams] = useQueryStates(
    Object.fromEntries(resetParams.map((key) => [key, parseAsString])),
    { shallow },
  )
  // The same filter renders twice on a page — in the sidebar and again in the mobile drawer — so
  // an id made from the value alone is duplicated, and every label's `for` then binds to the
  // hidden copy, leaving the visible checkbox without an accessible name.
  const idPrefix = useId()
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

  // nuqs coalesces updates queued in the same tick into one URL change, so clearing the reset
  // params beside the value is a single navigation.
  const clearResetParams = useCallback(() => {
    if (resetParams.length === 0) return
    setResetParams(Object.fromEntries(resetParams.map((key) => [key, null])))
  }, [resetParams, setResetParams])

  const toggleValue = useCallback(
    (value: string) => {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value]
      setSelectedValues(newValues.length > 0 ? newValues : null)
      clearResetParams()
    },
    [selectedValues, setSelectedValues, clearResetParams],
  )

  const clearFilter = () => {
    setSelectedValues(null)
    clearResetParams()
  }

  if (hideOnEmpty && options.length === 0) {
    return null
  }

  return (
    <FilterSection
      title={title}
      titleClassName={titleClassName}
      defaultOpen={defaultOpen}
      showBottomBorder={showBottomBorder}
      actions={
        selectedValues.length > 0 && (
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
        )
      }
    >
      {enableSearch && (
        <FilterSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={searchPlaceholder}
        />
      )}
      <FilterOptions
        idPrefix={idPrefix}
        options={filteredOptions}
        selectedValues={selectedValues}
        onToggle={toggleValue}
        maxHeight={maxHeight}
        emptyMessage={searchQuery ? 'No results found' : 'No options available'}
      />
    </FilterSection>
  )
}

const FilterSearch = ({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) => (
  <div className="relative mb-3">
    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    <Input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 pl-8 pr-8 text-sm"
    />
    {value && (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0.5 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-transparent"
        onClick={() => onChange('')}
      >
        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
      </Button>
    )}
  </div>
)

const FilterOptions = ({
  idPrefix,
  options,
  selectedValues,
  onToggle,
  maxHeight,
  emptyMessage,
}: {
  /** Makes the option ids unique per rendered instance of the filter. */
  idPrefix: string
  options: CheckboxOption[]
  selectedValues: string[]
  onToggle: (value: string) => void
  maxHeight?: string
  emptyMessage: string
}) => {
  if (options.length === 0) {
    return <div className="pt-1 pb-3 text-center text-sm text-muted-foreground">{emptyMessage}</div>
  }

  return (
    <ul
      className={cn(
        'flex flex-col gap-2.5 p-0 list-none pb-4',
        maxHeight && `${maxHeight} overflow-y-auto`,
      )}
    >
      {options.map((option) => (
        <li key={option.value}>
          <Label
            htmlFor={`${idPrefix}${option.value}`}
            className="cursor-pointer flex items-center"
          >
            <Checkbox
              id={`${idPrefix}${option.value}`}
              className="mr-2"
              checked={selectedValues.includes(option.value)}
              onCheckedChange={() => onToggle(option.value)}
            />
            <span>{option.label}</span>
          </Label>
        </li>
      ))}
    </ul>
  )
}
