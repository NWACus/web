'use client'

import { getSlugFromTenantId } from '@/utilities/getSlugFromTenantId'
import { cn } from '@/utilities/ui'
import { FieldLabel, useDocumentInfo, useField } from '@payloadcms/ui'
import { TextFieldClientProps } from 'payload'
import { useEffect, useState } from 'react'

const ColorPicker = (props: TextFieldClientProps) => {
  const brandShades = [100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
  const colorOptions = ['white', ...brandShades.map((n) => `brand-${n}`), 'transparent']
  const { path, field } = props
  const { data } = useDocumentInfo()
  const { value, setValue } = useField({ path })
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUser() {
      const userData = await getSlugFromTenantId(data?.tenant)
      setTenantSlug(userData)
    }
    fetchUser()
  }, [data?.tenant])

  return (
    <div className={cn(`flex flex-col mb-6 ${tenantSlug}`)}>
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      <ul className="flex flex-wrap list-none pl-0">
        {tenantSlug &&
          colorOptions.map((color, i) => {
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
