'use client'

import { useBreadcrumbs } from '@/providers/BreadcrumbProvider'
import { useEffect } from 'react'

export function BreadcrumbSetter({ label }: { label: string }) {
  const { setPageLabel } = useBreadcrumbs()

  useEffect(() => {
    setPageLabel(label)
    return () => setPageLabel(null)
  }, [label, setPageLabel])

  return null
}
