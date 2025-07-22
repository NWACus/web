import { Button, ButtonProps } from '@react-email/components'
import { ReactNode } from 'react'

export default function EmailButton({ children, ...props }: ButtonProps & { children: ReactNode }) {
  return (
    <Button
      {...props}
      style={{
        backgroundColor: '#142e57',
        color: 'white',
        padding: '14px 22px',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: 600,
        lineHeight: '20px',
        cursor: 'pointer',
        ...props.style,
      }}
    >
      {children}
    </Button>
  )
}
