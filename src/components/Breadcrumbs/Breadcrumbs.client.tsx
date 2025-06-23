'use client'

import { cn } from '@/utilities/ui'
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
const knownPathTitleOverrides: Record<string, string> = {
  '/posts': 'Blog',
}

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
  name: knownPathTitleOverrides[href || ''] ?? name.replace(/-/g, ' '),
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

  if (segments.length === 0) return null

  const breadcrumbItems: BreadcrumbType[] = segments.flatMap((segment, index) => {
    const nestedSegments = segment.split('/').filter((seg) => seg !== '')

    if (nestedSegments.length > 1) {
      return processNestedSegments(nestedSegments, index, segments.length)
    } else {
      const href = '/' + segments.slice(0, index + 1).join('/')
      const isLast = index === segments.length - 1

      return [createBreadcrumbItem(segment, href, isLast)]
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
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={`${item.name}__${item.href}__${index}`}>
            <BreadcrumbItem>
              {item.isLast || !item.href ? (
                <BreadcrumbPage
                  className={cn('capitalize', !item.isLast && 'text-muted-foreground')}
                >
                  {item.name}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
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
