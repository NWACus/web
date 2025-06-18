'use client'

import { Button, useConfig, useTranslation } from '@payloadcms/ui'
import { LogOut } from 'lucide-react'
import Link from 'next/link'
import { formatAdminURL } from 'payload/shared'

const baseClass = 'nav'

export function LogoutButton() {
  const { t } = useTranslation()
  const { config } = useConfig()

  const {
    admin: {
      routes: { logout: logoutRoute },
    },
    routes: { admin: adminRoute },
  } = config

  return (
    <Link
      aria-label={t('authentication:logOut')}
      className={`${baseClass}__log-out`}
      href={formatAdminURL({
        adminRoute,
        path: logoutRoute,
      })}
      prefetch={false}
      title={t('authentication:logOut')}
    >
      <Button
        buttonStyle="icon-label"
        iconPosition="left"
        icon={<LogOut className="w-5 h-5 flex-shrink-0" />}
      >
        Log out
      </Button>
    </Link>
  )
}
