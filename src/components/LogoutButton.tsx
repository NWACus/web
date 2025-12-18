'use client'

import { Button, useConfig, useTranslation } from '@payloadcms/ui'
import { HelpCircle, LogOut } from 'lucide-react'
import Link from 'next/link'
import { formatAdminURL } from 'payload/shared'

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
    <div className="flex flex-col">
      <Link
        href="https://avy-fx.notion.site/Help-2cb5af40f19880dfb71af06a3bd0ae90"
        title="Help"
        target="_blank"
      >
        <Button
          buttonStyle="icon-label"
          iconPosition="left"
          icon={<HelpCircle className="w-5 h-5 flex-shrink-0" />}
          className="m-0"
        >
          Help
        </Button>
      </Link>
      <Link
        aria-label={t('authentication:logOut')}
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
          className="mt-4"
        >
          Log out
        </Button>
      </Link>
    </div>
  )
}
