'use client'

import type { PayloadAdminBarProps, PayloadMeUser } from '@payloadcms/admin-bar'

import { cn } from '@/utilities/ui'
import { PayloadAdminBar } from '@payloadcms/admin-bar'
import { usePathname, useRouter } from 'next/navigation'
import React, { useState } from 'react'

import './index.scss'

import { getClientSideURL } from '@/utilities/getURL'

const baseClass = 'admin-bar'

const Title = () => <span>AvyFx Admin Panel</span>

export const AdminBar = (props: { adminBarProps?: PayloadAdminBarProps }) => {
  const { adminBarProps } = props || {}
  const [show, setShow] = useState(false)
  const router = useRouter()

  const onAuthChange = React.useCallback((user: PayloadMeUser) => {
    setShow(!!user?.id)
  }, [])

  const pathname = usePathname()

  return (
    <div
      className={cn(baseClass, 'py-2 bg-black text-white z-50', {
        block: show,
        hidden: !show,
        'bg-red-500': adminBarProps?.preview,
      })}
    >
      <div className="container">
        <PayloadAdminBar
          {...adminBarProps}
          className="py-2 text-white"
          classNames={{
            controls: 'font-medium text-white',
            logo: 'text-white',
            user: 'text-white',
          }}
          cmsURL={getClientSideURL()}
          logo={<Title />}
          onAuthChange={onAuthChange}
          onPreviewExit={() => {
            fetch('/next/exit-preview').then(() => {
              router.push(pathname)
              router.refresh()
            })
          }}
          style={{
            backgroundColor: 'transparent',
            padding: 0,
            position: 'relative',
            zIndex: 'unset',
          }}
        />
      </div>
    </div>
  )
}
