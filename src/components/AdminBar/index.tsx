'use client'

import type { PayloadAdminBarProps, PayloadMeUser } from '@payloadcms/admin-bar'

import { cn } from '@/utilities/ui'
import { PayloadAdminBar } from '@payloadcms/admin-bar'
import { usePathname, useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { useTenant } from '@/providers/TenantProvider'
import { getURL } from '@/utilities/getURL'
import { getHostnameFromTenant } from '@/utilities/tenancy/getHostnameFromTenant'
import './index.scss'

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
  const { tenant } = useTenant()
  const hostname = getHostnameFromTenant(tenant)

  return (
    <>
      <div
        className={cn(baseClass, 'fixed top-0 inset-x-0 bg-black text-white z-50', {
          'block py-2': show,
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
            cmsURL={getURL(hostname)}
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
      {/* content padding for mobile nav */}
      <div
        className={cn('h-[36px] bg-background', {
          block: show,
          hidden: !show,
        })}
      />
    </>
  )
}
