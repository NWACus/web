import React from 'react'

function NotFoundHeading() {
  return (
    <div className="mb-12">
      <div className="text-8xl font-bold text-primary mb-4">404</div>
      <h1 className="text-4xl font-bold mb-4">Route not found</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
        You&apos;ve ventured into unknown terrain. Best to keep it under 30°.
      </p>
    </div>
  )
}

/** The shared 404 body; `children` are the call-to-action links. */
export function NotFoundMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="container py-28">
      <div className="max-w-4xl mx-auto text-center">
        <NotFoundHeading />
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          {children}
        </div>
      </div>
    </div>
  )
}
