'use client'
import { Button, type ButtonProps } from '@/components/ui/button'
import type { BuiltInPage, Page, Post } from '@/payload-types'
import { handleReferenceURL } from '@/utilities/handleReferenceURL'
import { useAnalytics } from '@/utilities/useAnalytics'
import Link from 'next/link'
import * as React from 'react'

export interface ButtonLinkProps extends Omit<ButtonProps, 'type'> {
  children?: React.ReactNode
  href?: string
  newTab?: boolean | null
  label?: string | null
  reference?: {
    relationTo: 'builtInPages' | 'pages' | 'posts'
    value: BuiltInPage | Page | Post | number
  } | null
  type?: 'internal' | 'external' | null
  url?: string | null
}

const ButtonLink = React.forwardRef<HTMLButtonElement, ButtonLinkProps>(
  (
    { href: hrefProp, newTab = false, children, className, label, reference, type, url, ...props },
    ref,
  ) => {
    const { captureWithTenant } = useAnalytics()

    // Determine href from either direct prop or CMS reference
    if (reference && !type) return null
    const href = hrefProp || handleReferenceURL({ url, type, reference })
    if (!href) return null

    const referenceTitle =
      (reference &&
        reference.value &&
        typeof reference.value !== 'number' &&
        reference?.value.title) ||
      ''
    const buttonLabel = label || referenceTitle

    const newTabProps = newTab
      ? {
          target: '_blank',
          rel: 'noopener noreferrer',
        }
      : {}

    const handleClick = () => {
      captureWithTenant('button_click', {
        button_label: buttonLabel,
        from_page: window.location.pathname,
        to_page: href || '',
        appearance: props.variant ?? '',
      })
    }

    return (
      <Button asChild ref={ref} className={className} {...props}>
        <Link href={href || ''} onClick={handleClick} {...newTabProps}>
          {buttonLabel}
          {children && children}
        </Link>
      </Button>
    )
  },
)
ButtonLink.displayName = 'ButtonLink'

export { ButtonLink }
