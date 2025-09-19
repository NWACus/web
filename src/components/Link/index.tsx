import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React from 'react'

import type { BuiltInPage, Page, Post } from '@/payload-types'

type CMSLinkType = {
  appearance?: 'inline' | ButtonProps['variant']
  children?: React.ReactNode
  className?: string
  label?: string | null
  newTab?: boolean | null
  reference?: {
    relationTo: 'builtInPages' | 'pages' | 'posts'
    value: BuiltInPage | Page | Post | string | number
  } | null
  size?: ButtonProps['size'] | null
  type?: 'internal' | 'external' | null
  url?: string | null
}

export const CMSLink = (props: CMSLinkType) => {
  const {
    type,
    appearance = 'inline',
    children,
    className,
    label,
    newTab,
    reference,
    size: sizeFromProps,
    url,
  } = props

  const center: string | undefined =
    type === 'internal' &&
    typeof reference?.value === 'object' &&
    reference.value.tenant &&
    typeof reference.value.tenant === 'object'
      ? reference.value.tenant.slug
      : undefined

  let href = url
  if (center) {
    href = `/${center}/`
  } else if (type === 'internal' && typeof reference?.value === 'object') {
    const { relationTo, value } = reference
    const prefix = reference?.relationTo !== 'pages' ? `/${reference?.relationTo}` : ''
    if ('slug' in value) {
      href = `${prefix}/${value.slug}`
    } else if (relationTo === 'builtInPages' && 'url' in value) {
      href = `/${value.url}`
    }
  }

  if (!href) return null

  const size = appearance === 'link' ? 'clear' : sizeFromProps
  const newTabProps = newTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}

  /* Ensure we don't break any styles set by richText */
  if (appearance === 'inline') {
    return (
      <Link className={cn(className)} href={href || url || ''} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    )
  }

  return (
    <Button asChild className={className} size={size} variant={appearance}>
      <Link className={cn(className)} href={href || url || ''} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    </Button>
  )
}
