'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/utilities/ui'
import { FieldLabel, useField } from '@payloadcms/ui'
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react'
import { SelectFieldClientProps } from 'payload'

const AlignContentPicker = (props: SelectFieldClientProps) => {
  const alignOptions = [
    { value: 'left', label: 'Left', icon: AlignLeft },
    { value: 'center', label: 'Center', icon: AlignCenter },
    { value: 'right', label: 'Right', icon: AlignRight },
  ]

  const { path, field } = props

  const { value, setValue } = useField({ path })

  const currentValue = (value as string) || 'left'

  return (
    <div className="flex items-start mb-6">
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      <ToggleGroup
        type="single"
        value={currentValue}
        onValueChange={(newValue) => newValue && setValue(newValue)}
        variant="outline"
        className="justify-start"
      >
        {alignOptions.map((option) => {
          const Icon = option.icon
          return (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              aria-label={option.label}
              className={cn('w-10 h-10 p-2 cursor-pointer')}
            >
              <Icon className="h-4 w-4" />
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
    </div>
  )
}

export default AlignContentPicker
