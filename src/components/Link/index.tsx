'use client'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React from 'react'

import type { BuiltInPage, Page, Post } from '@/payload-types'
import { useAnalytics } from '@/utilities/analytics'
import { handleReferenceURL } from '@/utilities/handleReferenceURL'

type CMSLinkType = {
  appearance?: 'inline' | ButtonProps['variant']
  children?: React.ReactNode
  className?: string
  label?: string | null
  newTab?: boolean | null
  reference?: {
    relationTo: 'builtInPages' | 'pages' | 'posts'
    value: BuiltInPage | Page | Post | number
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
  const { captureWithTenant } = useAnalytics()

  const href = handleReferenceURL({ url: url, type: type, reference: reference })
  const referenceTitle =
    (reference &&
      reference.value &&
      typeof reference.value !== 'number' &&
      reference?.value.title) ||
    ''
  const buttonLabel = label ? label : referenceTitle

  if (!href) return null

  const size = appearance === 'link' ? 'clear' : sizeFromProps
  const newTabProps = newTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}
  const linkDestination = href || url || ''

  const onClickWithCapture = () => {
    captureWithTenant('button_click', {
      button_label: buttonLabel,
      destination: linkDestination,
      appearance: appearance ?? '',
    })
  }

  /* Ensure we don't break any styles set by richText */
  if (appearance === 'inline') {
    return (
      <Link
        className={cn(className)}
        href={linkDestination}
        onClick={onClickWithCapture}
        {...newTabProps}
      >
        {buttonLabel}
        {children && children}
      </Link>
    )
  }

  return (
    <Button asChild className={className} size={size} variant={appearance}>
      <Link
        className={cn(className)}
        href={linkDestination}
        onClick={onClickWithCapture}
        {...newTabProps}
      >
        {buttonLabel}
        {children && children}
      </Link>
    </Button>
  )
}
