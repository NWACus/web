'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FieldLabel, useField } from '@payloadcms/ui'
import { mergeFieldStyles } from '@payloadcms/ui/shared'
import { SelectFieldClientProps } from 'payload'
import { useEffect, useMemo, useState } from 'react'
import { ColumnsIcon } from './icons'

const layoutOptions = [
  { value: '1_1', parts: [1] },
  { value: '2_11', parts: [1, 1] },
  { value: '2_21', parts: [2, 1] },
  { value: '2_12', parts: [1, 2] },
  { value: '3_111', parts: [1, 1, 1] },
  { value: '3_211', parts: [2, 1, 1] },
  { value: '3_121', parts: [1, 2, 1] },
  { value: '3_112', parts: [1, 1, 2] },
  { value: '4_1111', parts: [1, 1, 1, 1] },
]

const columnCount = (layout: string) => parseInt(layout.split('_')[0])

export const ColumnLayoutPicker = (props: SelectFieldClientProps) => {
  const { path, field } = props
  const { value, setValue, showError, errorMessage } = useField<string>({ path })
  const [layoutSelection, setLayoutSelection] = useState(value || '1_1')

  const parentPath = path.split(`.${field.name}`)[0]
  const columnsPath = `${parentPath}.columns`

  const { value: numColumns } = useField<number>({ path: columnsPath })

  const options = useMemo(
    () => layoutOptions.filter((opt) => columnCount(opt.value) === numColumns),
    [numColumns],
  )

  useEffect(() => {
    if (value) {
      setLayoutSelection(value)
    }
  }, [value])

  // Keep the layout valid for the current column count, including null values from bad seed data
  useEffect(() => {
    if (!numColumns || numColumns < 1) return
    if (value && columnCount(layoutSelection) === numColumns) return

    const validOption = layoutOptions.find((opt) => columnCount(opt.value) === numColumns)
    if (validOption) {
      setValue(validOption.value)
      setLayoutSelection(validOption.value)
    }
  }, [numColumns, layoutSelection, value, setValue])

  // A single column has only one layout, so there's nothing to choose
  if (!numColumns || numColumns < 2) return null

  return (
    <div className="mb-6" style={mergeFieldStyles(field)}>
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      <ToggleGroup
        type="single"
        value={layoutSelection}
        onValueChange={(newValue: string) => {
          if (newValue) {
            setLayoutSelection(newValue)
            setValue(newValue)
          }
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
