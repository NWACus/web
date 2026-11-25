import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addYears, endOfYear, format, setMonth, setYear, startOfYear, subYears } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { DropdownProps, useDayPicker } from 'react-day-picker'

const YEARS_BEFORE_CURRENT = 5
const YEARS_AFTER_CURRENT = 1

type DatePickerFieldProps = {
  label: string
  value: string
  id: string
  onChange: (date: string) => void
}

type CalendarSelectProps = DropdownProps & {
  onValueChange: (value: number) => void
}

const CalendarSelect = ({
  options,
  value,
  disabled,
  onValueChange,
  'aria-label': ariaLabel,
}: CalendarSelectProps) => (
  <Select
    value={String(value)}
    disabled={disabled}
    onValueChange={(next) => onValueChange(Number(next))}
  >
    <SelectTrigger aria-label={ariaLabel} className="h-8 w-fit gap-1 px-2 text-sm font-medium">
      <SelectValue />
    </SelectTrigger>
    <SelectContent className="max-h-64">
      {options?.map((option) => (
        <SelectItem key={option.value} value={String(option.value)} disabled={option.disabled}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

// react-day-picker's handlers expect a native select change event, so navigate via the context instead
const MonthsDropdown = (props: DropdownProps) => {
  const { months, goToMonth } = useDayPicker()
  const current = months[0]?.date ?? new Date()
  return (
    <CalendarSelect {...props} onValueChange={(month) => goToMonth(setMonth(current, month))} />
  )
}

const YearsDropdown = (props: DropdownProps) => {
  const { months, goToMonth } = useDayPicker()
  const current = months[0]?.date ?? new Date()
  return <CalendarSelect {...props} onValueChange={(year) => goToMonth(setYear(current, year))} />
}

export const DatePickerField = ({ label, value, id, onChange }: DatePickerFieldProps) => {
  const [open, setOpen] = useState(false)

  const today = new Date()
  const startMonth = startOfYear(subYears(today, YEARS_BEFORE_CURRENT))
  const endMonth = endOfYear(addYears(today, YEARS_AFTER_CURRENT))

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'MM-dd-yyyy')
      onChange(formattedDate)
    }
    setOpen(false)
  }

  const parseDate = (dateString: string): Date | undefined => {
    if (!dateString) return undefined
    try {
      const [month, day, year] = dateString.split('-').map(Number)
      return new Date(year, month - 1, day)
    } catch {
      return undefined
    }
  }

  return (
    <div className="flex flex-col w-1/2">
      <Label htmlFor={id} className="mb-1 text-sm font-medium text-gray-400">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" id={id} className="w-full justify-between p-2">
            {value ? value : 'Select date'}
            <CalendarIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={parseDate(value)}
            captionLayout="dropdown"
            startMonth={startMonth}
            endMonth={endMonth}
            defaultMonth={parseDate(value)}
            components={{ MonthsDropdown, YearsDropdown }}
            onSelect={handleDateSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
