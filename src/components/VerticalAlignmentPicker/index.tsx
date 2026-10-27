'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FieldLabel, useField } from '@payloadcms/ui'
import { mergeFieldStyles } from '@payloadcms/ui/shared'
import {
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartHorizontal,
  StretchVertical,
} from 'lucide-react'
import { SelectFieldClientProps } from 'payload'

export const alignmentOptions = [
  { label: 'Top', value: 'top', icon: AlignStartHorizontal },
  { label: 'Middle', value: 'center', icon: AlignCenterHorizontal },
  { label: 'Bottom', value: 'bottom', icon: AlignEndHorizontal },
  { label: 'Stretch', value: 'stretch', icon: StretchVertical },
]

export const VerticalAlignmentPicker = (props: SelectFieldClientProps) => {
  const { path, field } = props
  const { value, setValue, showError, errorMessage } = useField<string>({ path })

  const parentPath = path.split(`.${field.name}`)[0]
  const { value: numColumns } = useField<number>({ path: `${parentPath}.columns` })

  // Alignment only matters when columns sit side by side
  if (!numColumns || numColumns < 2) return null

  return (
    <div className="mb-6" style={mergeFieldStyles(field)}>
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      <ToggleGroup
        type="single"
        value={value || 'top'}
        onValueChange={(newValue: string) => {
          if (newValue) setValue(newValue)
        }}
        variant="outline"
        size="sm"
        className="flex-wrap justify-start"
      >
        {alignmentOptions.map(({ label, value: optionValue, icon: Icon }) => (
          <ToggleGroupItem
            key={optionValue}
            value={optionValue}
            aria-label={`Align ${label.toLowerCase()}`}
            className="cursor-pointer [&_svg]:size-5"
          >
            <Icon />
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {showError && <div className="mt-2 text-sm text-red-500">{errorMessage}</div>}
    </div>
  )
}
