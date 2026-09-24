'use client'

/**
 * The small pieces every observation filter is built from: a toolbar dropdown, and native
 * checkboxes in the site's accent color (as the station map's filters use).
 */
import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { useId } from 'react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function FilterDropdown({
  label,
  children,
  contentClassName = 'w-72',
}: {
  label: ReactNode
  children: ReactNode
  contentClassName?: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-9 gap-1">
          {label}
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={`max-h-[70vh] overflow-y-auto p-3 ${contentClassName}`}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}

export function CheckOption({
  label,
  checked,
  onChange,
  type = 'checkbox',
}: {
  label: ReactNode
  checked: boolean
  onChange: () => void
  type?: 'checkbox' | 'radio'
}) {
  const id = useId()
  return (
    <label htmlFor={id} className="flex items-center gap-2 py-0.5 text-sm">
      <input id={id} type={type} className="accent-primary" checked={checked} onChange={onChange} />
      {label}
    </label>
  )
}

/** A fieldset of checkboxes over a list filter, with the widget's "All …" option first. */
export function CheckList<T extends string>({
  legend,
  allLabel,
  options,
  selected,
  onChange,
  columns = 1,
}: {
  legend: string
  allLabel?: string
  options: readonly { value: T; label: string }[]
  selected: readonly T[]
  onChange: (next: T[]) => void
  columns?: 1 | 2
}) {
  const toggle = (value: T) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-semibold">{legend}</legend>
      {allLabel && (
        <CheckOption
          label={allLabel}
          checked={selected.length === 0}
          onChange={() => onChange([])}
        />
      )}
      <div className={columns === 2 ? 'grid grid-cols-2 gap-x-3' : ''}>
        {options.map((option) => (
          <CheckOption
            key={option.value}
            label={option.label}
            checked={selected.includes(option.value)}
            onChange={() => toggle(option.value)}
          />
        ))}
      </div>
    </fieldset>
  )
}

export function toOptions<T extends string>(values: readonly T[]) {
  return values.map((value) => ({ value, label: value }))
}
