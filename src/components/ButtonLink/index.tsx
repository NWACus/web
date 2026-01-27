import Link from 'next/link'
import * as React from 'react'
import { Button, type ButtonProps } from '../ui/button'

export interface ButtonLinkProps extends ButtonProps {
  href: string
  newTab?: boolean
}

const ButtonLink = React.forwardRef<HTMLButtonElement, ButtonLinkProps>(
  ({ href, newTab = false, children, ...props }, ref) => {
    const externalProps = newTab
      ? {
          target: '_blank',
          rel: 'noopener noreferrer',
        }
      : {}

    return (
      <Button asChild ref={ref} {...props}>
        <Link href={href} {...externalProps}>
          {children}
        </Link>
      </Button>
    )
  },
)
ButtonLink.displayName = 'ButtonLink'

export { ButtonLink }
