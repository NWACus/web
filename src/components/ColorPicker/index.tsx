'use client'

import { useTenantSelection } from '@/providers/TenantSelectionProvider/index.client'
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
  const { selectedTenantID: tenant } = useTenantSelection() as { selectedTenantID: number }

  // TODO map to slug directly
  const tenantColorClass: Record<number, string> = {
    1: 'dvac',
    2: 'nwac',
    3: 'sac',
    4: 'snfac',
  }

  return (
    <div className={cn(`flex flex-col mb-6 ${tenantColorClass[tenant]}`)}>
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      <ul className="flex flex-wrap max-w-[260px] list-none pl-0">
        {colorOptions.map((color, i) => {
          const bgColor = `bg-${color}`
          return (
            <li key={i} className={cn('border', { 'border-solid': color === value })}>
              <div
                className={cn(
                  `relative w-[2em] h-[2em] m-2 p-2 rounded-full cursor-pointer ${bgColor}`,
                  {
                    'bg-white bg-[repeating-linear-gradient(45deg,#aaa_25%,transparent_25%,transparent_75%,#aaa_75%,#aaa),repeating-linear-gradient(45deg,#aaa_25%,#e5e5f7_25%,#e5e5f7_75%,#aaa_75%,#aaa)] bg-[position:0_0,10px_10px] bg-[size:20px_20px] bg-repeat':
                      color === 'transparent',
                  },
                )}
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
