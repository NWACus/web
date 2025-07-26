'use client'

import { cn } from '@/utilities/ui'
import { FieldLabel, useField } from '@payloadcms/ui'
import { TextFieldClientProps } from 'payload'

const ColorPicker = (props: TextFieldClientProps) => {
  const colorOptions = [
    'white',
    'brand-100',
    'brand-200',
    'brand-300',
    'brand-400',
    'brand-500',
    'brand-600',
    'brand-700',
    'brand-800',
    'brand-900',
    'brand-950',
    'transparent',
  ]

  const { path, field } = props

  const { value, setValue } = useField({ path })

  return (
    <div className="flex items-start justify-between mb-6">
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      <ul className="flex flex-wrap max-w-[200px] list-none">
        {colorOptions.map((color, i) => {
          const bgColor = `bg-${color}`
          return (
            <li key={i} className={cn('border', { 'border-solid': color === value })}>
              <div
                className={cn(
                  `relative w-[2em] h-[2em] m-2 p-2 rounded-full cursor-pointer ${bgColor}`,
                  {
                    'border border-solid border-muted-foreground': color === 'transparent',
                  },
                )}
                aria-label={color}
                onClick={() => setValue(color)}
              >
                {color === 'transparent' && (
                  <div className="absolute inset-0 bg-destructive h-1 w-full transform -rotate-45 top-[45%]"></div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default ColorPicker
