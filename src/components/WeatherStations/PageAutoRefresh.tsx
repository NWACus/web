'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Re-renders the page's server data on an interval — backs the legacy
// data-portal "This page refreshes every 5 minutes" behavior.
export function PageAutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000)
    return () => clearInterval(id)
  }, [router, seconds])

  return null
}
