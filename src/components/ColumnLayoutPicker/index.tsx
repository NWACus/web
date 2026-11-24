'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FieldLabel, useField } from '@payloadcms/ui'
import { mergeFieldStyles } from '@payloadcms/ui/shared'
import { SelectFieldClientProps } from 'payload'
import { ColumnsIcon } from './icons'
import { columnCount, layoutOptions } from './layouts'

export const ColumnLayoutPicker = (props: SelectFieldClientProps) => {
  const { path, field } = props
  const { value, setValue, showError, errorMessage } = useField<string>({ path })

  const parentPath = path.split(`.${field.name}`)[0]
  const columnsPath = `${parentPath}.columns`

  const { value: numColumns } = useField<number>({ path: columnsPath })

  // A single column has only one layout, so there's nothing to choose
  if (!numColumns || numColumns < 2) return null

  const options = layoutOptions.filter((opt) => columnCount(opt.value) === numColumns)

  return (
    <div className="mb-6" style={mergeFieldStyles(field)}>
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      <ToggleGroup
        type="single"
        value={value || ''}
        onValueChange={(newValue: string) => {
          if (newValue) setValue(newValue)
        }}
        variant="outline"
        size="sm"
        className="flex-wrap justify-start"
      >
        {options.map((option) => {
          const label = option.parts.join(':')
          return (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              aria-label={`${label} column widths`}
              className="cursor-pointer gap-1.5 px-2 [&_svg]:size-5"
            >
              <ColumnsIcon parts={option.parts} />
              {label}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
      {showError && <div className="mt-2 text-sm text-red-500">{errorMessage}</div>}
    </div>
  )
}
