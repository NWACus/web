'use client'

import { FieldLabel, useField } from '@payloadcms/ui'
import { TextFieldClientProps } from 'payload'

const ColorPicker = (props: TextFieldClientProps) => {
  const colorOptions = ['white', 'slate-300', 'brand-600', 'brand-700']
  const { path, field } = props

  const { value, setValue } = useField({ path })

  return (
    <div className="flex items-start mb-6">
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      <ul className="flex flex-wrap list-none">
        {colorOptions.map((color, i) => {
          const bgColor = `bg-${color}`
          return (
            <li key={i} className={`border ${color === value ? 'border-solid' : ''}`}>
              <div
                className={`w-[2em] h-[2em] m-2 p-2 rounded-full cursor-pointer ${bgColor}`}
                aria-label={color}
                onClick={() => setValue(color)}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default ColorPicker
