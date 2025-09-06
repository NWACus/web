'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FieldLabel, useField } from '@payloadcms/ui'
import { Columns2, Columns3, Columns4 } from 'lucide-react'
import { Field, SelectFieldClientProps } from 'payload'
type ColumnLayoutPickerProps = {
  sb: Field
} & SelectFieldClientProps
const ColumnLayoutPicker = (props: ColumnLayoutPickerProps) => {
  // TODO: update icons to be correct
  const layoutOptions = [
    { label: 'full', value: '1_1', icon: Columns2 },
    { label: '1:1', value: '2_11', icon: Columns2 },
    { label: '1:1:1', value: '3_111', icon: Columns3 },
    { label: '1:2', value: '2_12', icon: Columns3 },
    { label: '2:1', value: '2_21', icon: Columns3 },
    { label: '1:1:1:1', value: '4_1111', icon: Columns4 },
    { label: '1:1:2', value: '3_112', icon: Columns4 },
    { label: '1:2:1', value: '3_121', icon: Columns4 },
    { label: '2:1:1', value: '3_211', icon: Columns4 },
  ]
  const { path, field } = props

  const { value, setValue } = useField<string>({ path })

  const currentValue = value || 'one_1'

  // const fields = useFormFields(([fields]) => fields)
  // const totalColumns = fields.columns?.value
  // console.log(fields)
  // console.log('path', path)

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
        {/* TODO only render possible layout per # of columns */}
        {layoutOptions.map((option) => {
          const Icon = option.icon
          return (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              aria-label={option.label}
              className="cursor-pointer"
            >
              <Icon />
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
    </div>
  )
}

export default ColumnLayoutPicker
