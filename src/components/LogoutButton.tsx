'use client'

import { Button, useAuth, useConfig, useTranslation } from '@payloadcms/ui'
import { HelpCircle, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatAdminURL } from 'payload/shared'

export function LogoutButton() {
  const { t } = useTranslation()
  const { logOut } = useAuth()
  const { config } = useConfig()
  const router = useRouter()

  const {
    routes: { admin: adminRoute },
  } = config

  async function handleLogout() {
    await logOut()
    router.push(
      formatAdminURL({
        adminRoute,
        path: '/login',
      }),
    )
  }

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
      <Button
        aria-label={t('authentication:logOut')}
        buttonStyle="icon-label"
        iconPosition="left"
        icon={<LogOut className="w-5 h-5 flex-shrink-0" />}
        className="mt-4"
        onClick={handleLogout}
      >
        Log out
      </Button>
    </div>
  )
}
