'use client'

import { cn } from '@/utilities/ui'
import { useAnalytics } from '@/utilities/useAnalytics'
import Link from 'next/link'
import React from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb'
import type { BreadcrumbItemData } from './buildBreadcrumbs'

const HOME_ITEM: BreadcrumbItemData = { name: 'Home', href: '/', isLast: false, isDerived: false }

export function BreadcrumbsList({ items }: { items: BreadcrumbItemData[] }) {
  const { captureWithTenant } = useAnalytics()

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
          <BreadcrumbLink asChild onClick={() => onClick(HOME_ITEM, '0')}>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {items.length > 0 && <BreadcrumbSeparator />}
        {items.map((item, index) => (
          <React.Fragment key={`${item.name}__${item.href}__${index}`}>
            <BreadcrumbItem className={item.isLast ? 'min-w-0' : 'shrink-0'}>
              {item.isLast || !item.href ? (
                <BreadcrumbPage
                  className={cn(
                    item.isDerived && 'capitalize',
                    !item.isLast && 'text-muted-foreground',
                    item.isLast && 'truncate block',
                  )}
                  onClick={() => onClick(item, index.toString())}
                >
                  {item.name}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild onClick={() => onClick(item, index.toString())}>
                  <Link href={item.href} className={cn(item.isDerived && 'capitalize')}>
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
