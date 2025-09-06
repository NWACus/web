'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FieldLabel, useField, useFormFields } from '@payloadcms/ui'
import { Columns2, Columns3, Columns4, Square } from 'lucide-react'
import { Field, SelectFieldClientProps } from 'payload'
import { Columns112, Columns12, Columns121, Columns21, Columns211 } from './icons'
type ColumnLayoutPickerProps = {
  sb: Field
} & SelectFieldClientProps
const ColumnLayoutPicker = (props: ColumnLayoutPickerProps) => {
  const layoutOptions = [
    { label: 'full', value: '1_1', icon: Square },
    { label: '1:1', value: '2_11', icon: Columns2 },
    { label: '1:1:1', value: '3_111', icon: Columns3 },
    { label: '1:2', value: '2_12', icon: Columns12 },
    { label: '2:1', value: '2_21', icon: Columns21 },
    { label: '1:1:1:1', value: '4_1111', icon: Columns4 },
    { label: '1:1:2', value: '3_112', icon: Columns112 },
    { label: '1:2:1', value: '3_121', icon: Columns121 },
    { label: '2:1:1', value: '3_211', icon: Columns211 },
  ]
  const { path, field } = props

  const { value, setValue } = useField<string>({ path })

  const currentValue = value || 'one_1'

  const fields = useFormFields(([fields]) => fields)
  const columnsPath = path.replace(/layout$/, 'columns')
  const numOfCols = fields[columnsPath].rows?.length || 0

  const filteredLayoutOptions = layoutOptions.filter((option) => {
    const colCount = parseInt(option.value.split('_')[0])
    return colCount <= numOfCols
  })

  return (
    <div className="flex items-start mb-6">
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      <ToggleGroup
        type="single"
        value={currentValue}
        onValueChange={(newValue: string) => newValue && setValue(newValue)}
        variant="outline"
        className="justify-start"
      >
        {filteredLayoutOptions.map((option) => {
          const Icon = option.icon
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
    </div>
  )
}

export default ColumnLayoutPicker
