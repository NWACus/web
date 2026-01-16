'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FieldLabel, useField } from '@payloadcms/ui'
import { Columns2, Columns3, Columns4, Square } from 'lucide-react'
import { Field, SelectFieldClientProps } from 'payload'
import { useEffect, useMemo, useState } from 'react'
import { Columns112, Columns12, Columns121, Columns21, Columns211 } from './icons'

type ColumnLayoutPickerProps = {
  sb: Field
} & SelectFieldClientProps

const ColumnLayoutPicker = (props: ColumnLayoutPickerProps) => {
  const layoutOptions = useMemo(
    () => [
      { label: 'full', value: '1_1', icon: Square },
      { label: '1:1', value: '2_11', icon: Columns2 },
      { label: '1:2', value: '2_12', icon: Columns12 },
      { label: '2:1', value: '2_21', icon: Columns21 },
      { label: '1:1:1', value: '3_111', icon: Columns3 },
      { label: '1:1:2', value: '3_112', icon: Columns112 },
      { label: '1:2:1', value: '3_121', icon: Columns121 },
      { label: '2:1:1', value: '3_211', icon: Columns211 },
      { label: '1:1:1:1', value: '4_1111', icon: Columns4 },
    ],
    [],
  )

  const { path, field } = props
  const { value, setValue } = useField<string>({ path })
  const [layoutSelection, setLayoutSelection] = useState(value || '1_1')

  const parentPath = path.split(`.${field.name}`)[0]
  const columnsPath = `${parentPath}.columns`

  const { value: numColumns } = useField<number>({ path: columnsPath })

  useEffect(() => {
    if (value) {
      setLayoutSelection(value)
    }
  }, [value])

  // Auto-select valid layout when columns change
  useEffect(() => {
    if (numColumns && numColumns > 0) {
      const currentColCount = parseInt(layoutSelection.split('_')[0])
      // If current selection doesn't match column count, find the first valid option
      if (currentColCount !== numColumns) {
        const validOption = layoutOptions.find(
          (opt) => parseInt(opt.value.split('_')[0]) === numColumns,
        )
        if (validOption) {
          setValue(validOption.value)
          setLayoutSelection(validOption.value)
        }
      }
    }
  }, [numColumns, layoutSelection, setValue, layoutOptions])

  if (numColumns === 0) return null

  return (
    <div className="mb-6">
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
        className="justify-start"
      >
        {layoutOptions.map((option) => {
          const Icon = option.icon
          const colCount = parseInt(option.value.split('_')[0])
          if (colCount !== numColumns) return null

          return (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              aria-label={option.label}
              className="cursor-pointer"
            >
              <Icon style={{ width: '20px', height: '20px' }} />
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
      <div className="field-description">Options update based on the number of columns.</div>
    </div>
  )
}

export default ColumnLayoutPicker
