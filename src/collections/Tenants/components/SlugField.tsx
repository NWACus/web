'use client'

import type { SelectFieldClientProps } from 'payload'

import { SelectField, useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

export const SlugField = (props: SelectFieldClientProps) => {
  const { id } = useDocumentInfo()
  const [usedSlugs, setUsedSlugs] = useState<string[]>([])

  useEffect(() => {
    if (id) return

    fetch('/api/tenants?limit=0&depth=0&select[slug]=true')
      .then((res) => res.json())
      .then((data) => setUsedSlugs(data.docs.map((doc: { slug: string }) => doc.slug)))
      .catch(() => {})
  }, [id])

  const options = id
    ? props.field.options
    : props.field.options?.filter((option) => {
        const value = typeof option === 'string' ? option : option.value
        return !usedSlugs.includes(value)
      })

  return <SelectField {...props} field={{ ...props.field, options }} />
}
