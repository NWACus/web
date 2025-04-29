'use client'
import { FieldLabel, useField } from '@payloadcms/ui'
import { TextFieldClientProps } from 'payload'

// TODO - import color list from theme
// white, slate-300, slate-600, slate-700
const colorOptions = ['#FFFFFF', '#CBD5E1', '#475569', '#334155']

const ColorPicker = (props: TextFieldClientProps) => {
  const { path, field } = props

  const validateHexColor = (value: string): true | string => {
    return (
      value?.match(/^#(?:[0-9a-fA-F]{3}){1,2}$/)?.length === 1 ||
      `${value} is not a valid hex color`
    )
  }
  const { value = '', setValue } = useField({
    path,
    validate: validateHexColor,
  })

  return (
    <div className="flex items-start mb-6">
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      <ul className="flex flex-wrap list-none">
        {colorOptions.map((color, i) => (
          <li key={i} className={`border ${color === value ? 'border-solid' : ''}`}>
            <div
              className="w-[2em] h-[2em] m-2 p-2 rounded-full cursor-pointer"
              style={{ backgroundColor: `${color}` }}
              aria-label={color}
              onClick={() => setValue(color)}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ColorPicker
