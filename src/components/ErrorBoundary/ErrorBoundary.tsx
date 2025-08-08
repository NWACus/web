'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

type ErrorBoundaryProps = {
  error: Error & { digest?: string }
  reset: () => void
  showGoBack?: boolean
  homeHref?: string
}

export function ErrorBoundary({
  error,
  reset,
  showGoBack = true,
  homeHref = '/',
}: ErrorBoundaryProps) {
  const router = useRouter()

  useEffect(() => {
    console.error(error)
  }, [error])

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push(homeHref)
  }

  return (
    <div className="container py-14">
      <div className="max-w-4xl mx-auto text-center border-4 border-red-500 p-8 shadow rounded">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            We encountered an unexpected error. Don&apos;t worry, we&apos;re on it.
          </p>

          {process.env.NODE_ENV !== 'production' && (
            <details className="text-left bg-muted p-4 rounded-lg mb-8 max-w-2xl mx-auto">
              <summary className="cursor-pointer font-medium text-sm mb-2">
                Error Details (Development only)
              </summary>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                {error.message}
                {error.stack && '\n\n' + error.stack}
              </pre>
            </details>
          )}
        </div>

        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <Button onClick={reset} size="lg">
            Reset
          </Button>
          {showGoBack && (
            <Button onClick={handleGoBack} variant="outline" size="lg">
              Go Back
            </Button>
          )}
          <Button onClick={handleGoHome} variant="outline" size="lg">
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}
