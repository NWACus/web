'use client'

import { useBreadcrumbs } from '@/providers/BreadcrumbProvider'
import { useNotFound } from '@/providers/NotFoundProvider'
import { useTenant } from '@/providers/TenantProvider'
import { cn } from '@/utilities/ui'
import { useAnalytics } from '@/utilities/useAnalytics'
import Link from 'next/link'
import { useSelectedLayoutSegments } from 'next/navigation'
import React from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb'
import { buildBreadcrumbs, type BreadcrumbItemData } from './buildBreadcrumbs'

export function Breadcrumbs() {
  const segments = useSelectedLayoutSegments()

  const { isNotFound } = useNotFound()
  const { pageLabel } = useBreadcrumbs()
  const { captureWithTenant } = useAnalytics()
  const { tenant } = useTenant()

  if (segments.length === 0 || isNotFound) return null

  const breadcrumbItems = buildBreadcrumbs({
    center: tenant?.slug ?? '',
    path: '/' + segments.join('/'),
  })

  // Apply page label override to the last breadcrumb if provided
  if (pageLabel && breadcrumbItems.length > 0) {
    breadcrumbItems[breadcrumbItems.length - 1].name = pageLabel
  }

  const onClick = (item: BreadcrumbItemData, depth: string) => {
    captureWithTenant('breadcrumb_click', {
      breadcrumb_name: item.name,
      from_page: window.location.pathname,
      to_page: item.href ?? '',
      breadcrumb_level: depth,
    })
  }

  return (
    <Breadcrumb className="container md:max-xl:max-w-none py-4 md:py-6 flex-nowrap whitespace-nowrap overflow-hidden">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink
            asChild
            onClick={() => onClick({ name: 'Home', href: '/', isLast: false }, '0')}
          >
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbItems.length > 0 && <BreadcrumbSeparator />}
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={`${item.name}__${item.href}__${index}`}>
            <BreadcrumbItem className={item.isLast ? 'min-w-0' : 'shrink-0'}>
              {item.isLast || !item.href ? (
                <BreadcrumbPage
                  className={cn(
                    'capitalize',
                    !item.isLast && 'text-muted-foreground',
                    item.isLast && 'truncate block',
                  )}
                  onClick={() => onClick(item, index.toString())}
                >
                  {item.name}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild onClick={() => onClick(item, index.toString())}>
                  <Link href={item.href} className="capitalize">
                    {item.name}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!item.isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
