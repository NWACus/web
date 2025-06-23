'use client'

import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb'

export function Breadcrumbs() {
  const pathname = usePathname()

  const pathSegments = pathname.split('/').filter((segment) => segment !== '')

  if (pathSegments.length === 0) return null

  const breadcrumbItems = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/')
    const isLast = index === pathSegments.length - 1

    const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')

    return {
      name,
      href,
      isLast,
    }
  })

  return (
    <Breadcrumb className="container py-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbItems.length > 0 && <BreadcrumbSeparator />}
        {breadcrumbItems.map((item) => (
          <React.Fragment key={item.href}>
            <BreadcrumbItem>
              <BreadcrumbPage className={cn('capitalize', !item.isLast && 'text-muted-foreground')}>
                {item.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
            {!item.isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
