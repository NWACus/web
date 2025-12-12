'use client'

import { Button, FieldDescription, FieldLabel, toast } from '@payloadcms/ui'
import { useState } from 'react'
import { revalidateCacheAction } from '../actions/revalidateCache'

export function RevalidateCache() {
  const [isLoading, setIsLoading] = useState(false)

  const handleRevalidate = async () => {
    setIsLoading(true)

    try {
      const result = await revalidateCacheAction()

      if (result.success) {
        toast.success(result.message || 'Cache revalidated successfully')
      } else {
        toast.error(result.error || 'Failed to revalidate cache')
      }
    } catch (_err) {
      toast.error('Failed to revalidate cache')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <FieldLabel label="Revalidate Cache" />
        <FieldDescription
          description="Force revalidation of cached pages for the entire application."
          path=""
          className="mb-2"
        />
      </div>

      <div
        className="p-4 rounded border-l-4"
        style={{
          backgroundColor: 'var(--theme-warning-50)',
          borderLeftColor: 'var(--theme-warning-500)',
        }}
      >
        <p className="font-semibold mb-2" style={{ color: 'var(--theme-warning-700)' }}>
          ⚠️ Warning: Use with caution
        </p>
        <ul
          className="list-disc list-inside text-sm space-y-1"
          style={{ color: 'var(--theme-warning-600)' }}
        >
          <li>Revalidating the cache will force all pages to be regenerated on the next request</li>
          <li>This can cause a temporary increase in server load and slower page loads</li>
          <li>Normal content updates are automatically revalidated and don&apos;t require this</li>
          <li>This is intended as an escape hatch only</li>
        </ul>
      </div>

      <div className="w-full md:w-fit">
        <Button onClick={handleRevalidate} disabled={isLoading}>
          {isLoading ? 'Revalidating...' : 'Revalidate Entire Application Cache'}
        </Button>
      </div>
    </div>
  )
}
