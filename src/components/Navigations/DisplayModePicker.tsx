'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FieldLabel, useField } from '@payloadcms/ui'
import { SquareArrowOutUpRight, SquareChevronDown, SquareMousePointer } from 'lucide-react'
import { SelectFieldClientProps } from 'payload'

const options = [
  { value: 'dropdown', label: 'Dropdown', icon: SquareChevronDown },
  { value: 'link', label: 'Link', icon: SquareArrowOutUpRight },
  { value: 'button', label: 'Button', icon: SquareMousePointer },
]

const DisplayModePicker = (props: SelectFieldClientProps) => {
  const { path, field } = props
  const { value, setValue } = useField<string>({ path })
  const currentValue = value || 'dropdown'

  return (
    <div className="mb-4">
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      <ToggleGroup
        type="single"
        value={currentValue}
        onValueChange={(newValue: string) => newValue && setValue(newValue)}
        variant="outline"
        className="justify-start"
      >
        {options.map(({ value: optionValue, label, icon: Icon }) => (
          <ToggleGroupItem
            key={optionValue}
            value={optionValue}
            aria-label={label}
            className="cursor-pointer gap-1.5"
          >
            <Icon style={{ width: '16px', height: '16px' }} />
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

export default DisplayModePicker
