'use client'

import { useBreadcrumbs } from '@/providers/BreadcrumbProvider'
import { useNotFound } from '@/providers/NotFoundProvider'
import { useTenant } from '@/providers/TenantProvider'
import { useSelectedLayoutSegments } from 'next/navigation'
import { BreadcrumbsList } from './BreadcrumbsList.client'
import { buildBreadcrumbs } from './buildBreadcrumbs'

export function Breadcrumbs() {
  const segments = useSelectedLayoutSegments()

  const { isNotFound } = useNotFound()
  const { pageLabel } = useBreadcrumbs()
  const { tenant } = useTenant()

  if (segments.length === 0 || isNotFound) return null

  const breadcrumbItems = buildBreadcrumbs({
    center: tenant?.slug ?? '',
    path: '/' + segments.join('/'),
    title: pageLabel ?? undefined,
  })

  return <BreadcrumbsList items={breadcrumbItems} />
}
