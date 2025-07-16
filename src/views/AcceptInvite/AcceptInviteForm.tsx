'use client'

import { getURL } from '@/utilities/getURL'
import {
  ConfirmPasswordField,
  EmailField,
  Form,
  FormSubmit,
  HiddenField,
  PasswordField,
  TextField,
  useAuth,
  useConfig,
} from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'
import { type FormState } from 'payload'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback } from 'react'

const staticInitialState: FormState = {
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

export function AcceptInviteForm({
  token,
  hostname,
  email,
  name,
}: {
  token: string
  hostname: string
  email: string
  name: string
}) {
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

  const validateName = useCallback((value: string | null | undefined) => {
    if (!value || value.trim() === '') {
      return 'Name is required'
    }
    return true
  }, [])

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
      initialState={{
        ...staticInitialState,
        email: {
          initialValue: email,
          valid: true,
          value: email,
        },
        name: {
          initialValue: name,
          valid: !!name,
          value: name,
        },
      }}
      method="POST"
      onSuccess={onSuccess}
      disableSuccessStatus
    >
      <div className="inputWrap">
        <EmailField
          field={{
            name: 'email',
            label: 'Email',
          }}
          readOnly={true}
          path="email"
        />
        <TextField
          field={{
            name: 'name',
            label: 'Name',
            required: true,
          }}
          path="name"
          schemaPath={`${userSlug}.name`}
          validate={validateName}
        />
        <PasswordField
          field={{
            name: 'password',
            label: 'Password',
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
