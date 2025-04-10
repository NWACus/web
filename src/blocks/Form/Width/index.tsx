import * as React from 'react'

export const Width = ({
  children,
  className,
  width,
}: {
  children: React.ReactNode
  className?: string
  width?: number | string
}) => {
  return (
    <div className={className} style={{ maxWidth: width ? `${width}%` : undefined }}>
      {children}
    </div>
  )
}
