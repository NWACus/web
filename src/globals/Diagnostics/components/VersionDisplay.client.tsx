'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    next?: {
      version?: string
    }
  }
}

type VersionDisplayProps = {
  payloadVersion: string
  nodeVersion: string
}

export function VersionDisplay({ payloadVersion, nodeVersion }: VersionDisplayProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const versionInfo = {
    payload: payloadVersion,
    // Only show Next.js version after mount to avoid hydration mismatch
    nextjs: mounted ? (window.next?.version ?? 'unknown') : '...',
    node: nodeVersion,
  }

  return (
    <pre
      className="p-4 rounded text-sm overflow-auto"
      style={{
        backgroundColor: 'var(--theme-elevation-50)',
        border: '1px solid var(--theme-elevation-150)',
      }}
    >
      {JSON.stringify(versionInfo, null, 2)}
    </pre>
  )
}
