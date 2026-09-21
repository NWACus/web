// fallow-ignore-file unused-export
// The admin import map references this component by its module path string.
'use client'

import { BACKGROUND_COLOR_OPTIONS } from '@/fields/color'
import { getSlugFromTenantId } from '@/utilities/getSlugFromTenantId'
import { cn } from '@/utilities/ui'
import { FieldLabel, useDocumentInfo, useField } from '@payloadcms/ui'
import { TextFieldClientProps } from 'payload'
import { useEffect, useState } from 'react'

const ColorPicker = (props: TextFieldClientProps) => {
  const { path, field } = props
  const { data } = useDocumentInfo()
  const { value, setValue } = useField({ path })
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTenantSlug() {
      const slug = await getSlugFromTenantId(data?.tenant)
      setTenantSlug(slug)
    }
    fetchTenantSlug()
  }, [data?.tenant])

  return (
    <div className={cn('flex flex-col mb-6', tenantSlug)}>
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      <ul className="flex flex-wrap list-none pl-0">
        {tenantSlug &&
          BACKGROUND_COLOR_OPTIONS.map((color, i) => {
            const bgColor = `bg-${color}`
            return (
              <li key={i} className={cn('border', { 'border-solid': color === value })}>
                <div
                  className={cn(
                    `relative w-[2em] h-[2em] m-2 p-2 rounded-full cursor-pointer ${bgColor} border border-solid border-gray-600`,
                    {
                      'bg-center bg-[length:20px_20px] bg-[image:repeating-conic-gradient(#ddd_0%_25%,white_0%_50%)]':
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
