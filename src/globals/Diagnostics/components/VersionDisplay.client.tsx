'use client'

import { useSyncExternalStore } from 'react'

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

// `window.next.version` is a one-shot client-only value. useSyncExternalStore
// with a server snapshot of `'...'` is the SSR-safe way to read it without a
// hydration guard.
const subscribeToNothing = () => () => {}
const getNextjsVersion = () => window.next?.version ?? 'unknown'
const getNextjsVersionServer = () => '...'

export function VersionDisplay({ payloadVersion, nodeVersion }: VersionDisplayProps) {
  const nextjs = useSyncExternalStore(subscribeToNothing, getNextjsVersion, getNextjsVersionServer)

  const versionInfo = {
    payload: payloadVersion,
    nextjs,
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
