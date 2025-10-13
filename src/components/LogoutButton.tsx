'use client'

import { Button, useConfig, useTranslation } from '@payloadcms/ui'
import { Book, LogOut } from 'lucide-react'
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
    <div className={`flex flex-col ${baseClass}__log-out`}>
      <Link
        className={`${baseClass}__docs`}
        href="https://avy-fx.notion.site/23b5af40f1988035a071e397e3780103?v=23b5af40f19880dcae89000c75417e41"
        title="Docs"
      >
        <Button
          buttonStyle="icon-label"
          iconPosition="left"
          icon={<Book className="w-5 h-5 flex-shrink-0" />}
          className="m-0"
        >
          Docs
        </Button>
      </Link>
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
          className="mt-4"
        >
          Log out
        </Button>
      </Link>
    </div>
  )
}
