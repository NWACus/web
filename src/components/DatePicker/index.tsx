import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { addYears, endOfYear, format, startOfYear, subYears } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'

const YEARS_BEFORE_CURRENT = 5
const YEARS_AFTER_CURRENT = 1

type DatePickerFieldProps = {
  label: string
  value: string
  id: string
  onChange: (date: string) => void
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
            onSelect={handleDateSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
