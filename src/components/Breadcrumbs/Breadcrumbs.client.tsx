'use client'

import { useNotFound } from '@/providers/NotFoundProvider'
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

const knownPathsWithoutPages = ['/forecasts', '/weather', '/weather/stations']

type BreadcrumbType = {
  name: string
  isLast: boolean
  href: string | null
}

const createBreadcrumbItem = (
  name: string,
  href: string | null,
  isLast: boolean,
): BreadcrumbType => ({
  name: name.replace(/-/g, ' '),
  href: href && knownPathsWithoutPages.includes(href) ? null : href,
  isLast,
})

const processNestedSegments = (
  nestedSegments: string[],
  index: number,
  totalSegments: number,
): BreadcrumbType[] => {
  const prependedSegments = nestedSegments
    .slice(0, -1)
    .map((segment) => createBreadcrumbItem(segment, null, false))

  const lastNestedSegment = nestedSegments[nestedSegments.length - 1]
  const href = '/' + [...nestedSegments.slice(0, index), lastNestedSegment].join('/')
  const isLast = index === totalSegments - 1

  const mainSegment = createBreadcrumbItem(lastNestedSegment, href, isLast)

  return [...prependedSegments, mainSegment]
}

export function Breadcrumbs() {
  const segments = useSelectedLayoutSegments()
  const decodedSegments = segments.map(decodeURIComponent)
  const { isNotFound } = useNotFound()
  const { captureWithTenant } = useAnalytics()

  if (decodedSegments.length === 0 || isNotFound) return null

  const breadcrumbItems: BreadcrumbType[] = decodedSegments.flatMap((segment, index) => {
    const nestedSegments = segment.split('/').filter((seg) => seg !== '')

    if (nestedSegments.length > 1) {
      return processNestedSegments(nestedSegments, index, decodedSegments.length)
    } else {
      const href = '/' + decodedSegments.slice(0, index + 1).join('/')
      const isLast = index === decodedSegments.length - 1

      return [createBreadcrumbItem(segment, href, isLast)]
    }
  })

  const onClick = (item: BreadcrumbType, depth: string) => {
    captureWithTenant('breadcrumb_click', {
      breadcrumb_name: item.name,
      from_page: window.location.pathname,
      to_page: item.href ?? '',
      breadcrumb_level: depth,
    })
  }

  return (
    <Breadcrumb className="container py-4 md:py-6">
      <BreadcrumbList>
        <BreadcrumbItem>
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
            <BreadcrumbItem>
              {item.isLast || !item.href ? (
                <BreadcrumbPage
                  className={cn('capitalize', !item.isLast && 'text-muted-foreground')}
                  onClick={() => onClick(item, index.toString())}
                >
                  {item.name}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild onClick={() => onClick(item, (index++).toString())}>
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
