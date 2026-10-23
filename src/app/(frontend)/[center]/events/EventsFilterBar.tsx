'use client'

import { DatePickerField } from '@/components/DatePicker'
import { type CheckboxOption } from '@/components/filters/CheckboxFilter'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { QUICK_DATE_FILTERS_EVENTS } from '@/constants/quickDateFilters'
import type { QuickDateFilter } from '@/utilities/createQuickDateFilters'
import { cn } from '@/utilities/ui'
import { format, isValid, parse } from 'date-fns'
import { Check, ChevronDown } from 'lucide-react'
import { parseAsArrayOf, parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { useId, useState } from 'react'

export type EventsFilterOptions = {
  types: CheckboxOption[]
  modesOfTravel: CheckboxOption[]
  groups: CheckboxOption[]
  tags: CheckboxOption[]
}

const CHECKBOX_FILTERS = [
  { param: 'types', title: 'Type' },
  { param: 'modesOfTravel', title: 'Mode of travel' },
  { param: 'groups', title: 'Group' },
  { param: 'tags', title: 'Tag' },
] as const

type CheckboxParam = (typeof CHECKBOX_FILTERS)[number]['param']

const UPCOMING = 'upcoming'
const CUSTOM = 'custom'
const upcomingFilter = QUICK_DATE_FILTERS_EVENTS.find((filter) => filter.id === UPCOMING)

// The same URL options as the sidebar's DateRangeFilter and CheckboxFilter.
function useDateParams() {
  return useQueryStates(
    { startDate: parseAsString.withDefault(''), endDate: parseAsString.withDefault('') },
    { history: 'push', shallow: false },
  )
}

function useCheckboxParam(param: CheckboxParam) {
  return useQueryState(
    param,
    parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }),
  )
}

/** The quick date filter the dates match, or "custom". No dates is the page's default, Upcoming. */
function quickDateFilterId(startDate: string, endDate: string) {
  if (!startDate && !endDate) return UPCOMING
  const match = QUICK_DATE_FILTERS_EVENTS.find(
    (filter) => filter.startDate() === startDate && (filter.endDate() ?? '') === endDate,
  )
  return match?.id ?? CUSTOM
}

function shortDate(value: string) {
  const date = parse(value, 'MM-dd-yyyy', new Date())
  return isValid(date) ? format(date, 'MMM d') : value
}

function dateLabel(startDate: string, endDate: string) {
  const id = quickDateFilterId(startDate, endDate)
  const quick = QUICK_DATE_FILTERS_EVENTS.find((filter) => filter.id === id)
  if (quick) return quick.label
  if (startDate && endDate) return `${shortDate(startDate)} – ${shortDate(endDate)}`
  return startDate ? `From ${shortDate(startDate)}` : `Until ${shortDate(endDate)}`
}

function MenuButton({
  active,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { active: boolean }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn('gap-1.5 [&_svg]:size-4', active && 'border-foreground bg-accent')}
      {...props}
    >
      {children}
      <ChevronDown aria-hidden className="opacity-60" />
    </Button>
  )
}

function MenuOption({
  checked,
  onClick,
  children,
}: {
  checked: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onClick}
      className="flex w-full items-center rounded px-2 py-1.5 text-sm hover:bg-accent"
    >
      {children}
      {checked && <Check aria-hidden className="ml-auto size-4" />}
    </button>
  )
}

/** Picking one date option closes the menu; a custom range keeps it open for both dates. */
function DateMenu() {
  const [{ startDate, endDate }, setDates] = useDateParams()
  const current = quickDateFilterId(startDate, endDate)
  const [open, setOpen] = useState(false)
  const [pickingRange, setPickingRange] = useState(current === CUSTOM)
  const idPrefix = useId()
  const setRange = (start: string, end: string) =>
    setDates({ startDate: start || null, endDate: end || null })
  const pick = (filter: QuickDateFilter) => {
    setPickingRange(false)
    setDates({ startDate: filter.startDate(), endDate: filter.endDate() })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <MenuButton active={current !== UPCOMING}>{dateLabel(startDate, endDate)}</MenuButton>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn('p-1', pickingRange ? 'w-80' : 'w-56')}>
        {QUICK_DATE_FILTERS_EVENTS.map((filter) => (
          <MenuOption key={filter.id} checked={current === filter.id} onClick={() => pick(filter)}>
            {filter.label}
          </MenuOption>
        ))}
        <MenuOption checked={current === CUSTOM} onClick={() => setPickingRange(true)}>
          Custom range…
        </MenuOption>
        {pickingRange && (
          <div className="flex gap-2 px-2 pt-2 pb-1">
            <DatePickerField
              label="Start"
              value={startDate}
              id={`${idPrefix}start`}
              onChange={(date) => setRange(date, endDate)}
            />
            <DatePickerField
              label="End"
              value={endDate}
              id={`${idPrefix}end`}
              onChange={(date) => setRange(startDate, date)}
            />
          </div>
        )}
        {current !== UPCOMING && upcomingFilter && (
          <Button
            variant="ghost"
            className="mx-2 mt-2 mb-2 h-auto p-0 text-sm underline"
            onClick={() => pick(upcomingFilter)}
          >
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

function CheckboxMenu({
  param,
  title,
  options,
}: {
  param: CheckboxParam
  title: string
  options: CheckboxOption[]
}) {
  const [selected, setSelected] = useCheckboxParam(param)
  const idPrefix = useId()
  if (options.length === 0) return null

  const toggle = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value]
    setSelected(next.length > 0 ? next : null)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <MenuButton active={selected.length > 0}>
          {title}
          {selected.length > 0 && (
            <span className="rounded-full bg-foreground px-1.5 text-xs leading-5 text-background">
              {selected.length}
              <span className="sr-only"> selected</span>
            </span>
          )}
        </MenuButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-3" aria-label={title}>
        <ul className="flex flex-col gap-2.5">
          {options.map(({ label, value }) => (
            <li key={value}>
              <Label htmlFor={`${idPrefix}${value}`} className="flex cursor-pointer items-center">
                <Checkbox
                  id={`${idPrefix}${value}`}
                  className="mr-2"
                  checked={selected.includes(value)}
                  onCheckedChange={() => toggle(value)}
                />
                {label}
              </Label>
            </li>
          ))}
        </ul>
        {selected.length > 0 && (
          <Button
            variant="ghost"
            className="mt-3 h-auto p-0 text-sm underline"
            onClick={() => setSelected(null)}
          >
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

/** The map view's filters, as dropdowns in the bar beside the sort button. */
export function EventsFilterMenus({ options }: { options: EventsFilterOptions }) {
  return (
    <div className="flex items-center gap-2">
      <DateMenu />
      {CHECKBOX_FILTERS.map(({ param, title }) => (
        <CheckboxMenu key={param} param={param} title={title} options={options[param]} />
      ))}
    </div>
  )
}
