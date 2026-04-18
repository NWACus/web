'use client'

import { Banner } from '@payloadcms/ui'
import { AlertCircle, CheckCircle, Info, MessageSquare } from 'lucide-react'

type BannerDescriptionProps = {
  message: string
  type?: 'default' | 'error' | 'info' | 'success'
  [key: string]: unknown
}

const icons: Record<NonNullable<BannerDescriptionProps['type']>, React.ReactNode> = {
  default: <MessageSquare size={18} />,
  error: <AlertCircle size={18} />,
  info: <Info size={18} />,
  success: <CheckCircle size={18} />,
}

export const BannerDescription = ({ message, type = 'default' }: BannerDescriptionProps) => {
  if (!message) return null

  return (
    <Banner alignIcon="left" icon={icons[type]} type={type} className="w-100 gap-2 items-center">
      {message}
    </Banner>
  )
}
