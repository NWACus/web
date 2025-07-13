'use client'

import { getURL } from '@/utilities/getURL'
import {
  ConfirmPasswordField,
  Form,
  FormSubmit,
  HiddenField,
  PasswordField,
  useAuth,
  useConfig,
} from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'
import { type FormState } from 'payload'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

const initialState: FormState = {
  'confirm-password': {
    initialValue: '',
    valid: false,
    value: '',
  },
  password: {
    initialValue: '',
    valid: false,
    value: '',
  },
}

export function AcceptInviteForm({ token, hostname }: { token: string; hostname: string }) {
  const {
    config: {
      admin: {
        routes: { login: loginRoute },
        user: userSlug,
      },
      routes: { admin: adminRoute, api: apiRoute },
    },
  } = useConfig()

  const history = useRouter()
  const { fetchFullUser } = useAuth()

  const onSuccess = React.useCallback(async () => {
    const user = await fetchFullUser()
    if (user) {
      history.push(adminRoute)
    } else {
      history.push(
        formatAdminURL({
          adminRoute,
          path: loginRoute,
        }),
      )
    }
  }, [adminRoute, fetchFullUser, history, loginRoute])

  if (!token) {
    return (
      <div className="accept-invite__error">
        <p>
          Invalid or missing invite token. Please check your email for the correct invitation link.
        </p>
      </div>
    )
  }

  return (
    <Form
      action={`${getURL(hostname)}${apiRoute}/${userSlug}/accept-invite`}
      initialState={initialState}
      method="POST"
      onSuccess={onSuccess}
      disableSuccessStatus
    >
      <div className="inputWrap">
        <PasswordField
          field={{
            name: 'password',
            label: 'New Password',
            required: true,
          }}
          path="password"
          schemaPath={`${userSlug}.password`}
        />
        <ConfirmPasswordField />
        <HiddenField path="token" schemaPath={`${userSlug}.token`} value={token} />
      </div>
      <FormSubmit size="large">Accept Invite</FormSubmit>
    </Form>
  )
}
