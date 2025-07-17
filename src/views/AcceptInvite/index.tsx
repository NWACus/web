import type { AdminViewServerProps } from 'payload'

import { MinimalTemplate } from '@payloadcms/next/templates'
import { Button, Link } from '@payloadcms/ui'

import { AvyFxLogo } from '@/components/Logo/AvyFxLogo'
import { LogoutButton } from '@/components/LogoutButton'
import { formatAdminURL } from 'payload/shared'
import { AcceptInviteForm } from './AcceptInviteForm'
import './index.scss'

const baseClass = 'accept-invite'

export async function AcceptInvite({ initPageResult, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult

  const { i18n, payload, user } = req

  const {
    admin: {
      routes: { login: loginRoute },
    },
    routes: { admin: adminRoute },
  } = payload.config

  const token = searchParams?.token

  const currentHost = req.headers.get('host') || req.host

  if (!token || Array.isArray(token)) {
    return (
      <div className={`${baseClass}__error`}>
        <p>
          Invalid or missing invite token. Please check your email for the correct invitation link.
        </p>
      </div>
    )
  }

  // Find user with valid invite token
  const usersRes = await payload.find({
    collection: 'users',
    where: {
      inviteToken: { equals: token },
      inviteExpiration: { greater_than: new Date().toISOString() },
    },
    limit: 1,
  })

  if (!usersRes.docs.length) {
    return (
      <MinimalTemplate className={`${baseClass}`}>
        <div>
          <div className="form-header">
            <h1>Invite Invalid or Expired</h1>
            <p>
              Invite is either invalid or has expired. Please request a new invite from your admin.
            </p>
          </div>
        </div>
      </MinimalTemplate>
    )
  }

  const invitedUser = usersRes.docs[0]

  if (user) {
    return (
      <MinimalTemplate className={`${baseClass}`}>
        <div>
          <div className="form-header">
            <h1>Already Logged In</h1>
            <p>You are already logged in.</p>
          </div>
          <Button buttonStyle="secondary" el="link" size="large" to={adminRoute}>
            {i18n.t('general:backToDashboard')}
          </Button>
        </div>
        <LogoutButton />
      </MinimalTemplate>
    )
  }

  return (
    <MinimalTemplate className={`${baseClass}`}>
      <div className={`${baseClass}__brand`}>
        <AvyFxLogo loading="eager" priority="high" />
      </div>
      <div className={`${baseClass}__wrap`}>
        <div className="form-header">
          <h1>Accept Invite</h1>
          <p>Complete your account setup by setting your password and editing your name.</p>
        </div>
        <AcceptInviteForm
          token={token}
          hostname={currentHost}
          email={invitedUser.email}
          name={invitedUser.name}
        />
        <Link
          href={formatAdminURL({
            adminRoute,
            path: loginRoute,
          })}
          prefetch={false}
        >
          {i18n.t('authentication:backToLogin')}
        </Link>
      </div>
    </MinimalTemplate>
  )
}
