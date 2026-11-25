import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { StartDateBounds } from '@/utilities/queries/getStartDateBounds'
import { endOfMonth, format, max, min, startOfMonth } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'

type DatePickerFieldProps = {
  label: string
  value: string
  id: string
  onChange: (date: string) => void
  dateBounds: StartDateBounds
}

// Today is always in range so the calendar can still open on the current month
const calendarBounds = ({ earliest, latest }: StartDateBounds, today: Date) => ({
  startMonth: startOfMonth(earliest ? min([new Date(earliest), today]) : today),
  endMonth: endOfMonth(latest ? max([new Date(latest), today]) : today),
})

export const DatePickerField = ({
  label,
  value,
  id,
  onChange,
  dateBounds,
}: DatePickerFieldProps) => {
  const [open, setOpen] = useState(false)

  const { startMonth, endMonth } = calendarBounds(dateBounds, new Date())

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
        <PopoverContent className="z-[60] w-auto overflow-hidden p-0 md:z-50" align="start">
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
