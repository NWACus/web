'use client'

import { getURL } from '@/utilities/getURL'
import {
  ConfirmPasswordField,
  EmailField,
  Form,
  FormSubmit,
  PasswordField,
  TextField,
  toast,
  useAuth,
  useConfig,
} from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'
import { type FormState } from 'payload'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useMemo } from 'react'
import { acceptInviteAction } from './acceptInviteAction'

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

  const initialState = useMemo(
    () => ({
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
    }),
    [email, name],
  )

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const onSubmit = React.useCallback(
    async (formState: FormState) => {
      setIsSubmitting(true)
      try {
        const tokenValue = token
        const nameValue = String(formState.name?.value) || ''
        const passwordValue = String(formState.password?.value) || ''
        const confirmPasswordValue = String(formState['confirm-password']?.value) || ''

        if (!tokenValue || !nameValue || !passwordValue) {
          toast.error('Missing required fields.')
          setIsSubmitting(false)
          return
        }
        if (passwordValue !== confirmPasswordValue) {
          toast.error('Passwords do not match.')
          setIsSubmitting(false)
          return
        }

        const result = await acceptInviteAction({
          token: tokenValue,
          name: nameValue,
          password: passwordValue,
        })

        if (result.success) {
          const loginRes = await fetch(`${getURL(hostname)}${apiRoute}/${userSlug}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: passwordValue }),
            credentials: 'include',
          })
          if (loginRes.ok) {
            await onSuccess()
          } else {
            toast.error('Account updated, but failed to log in. Please log in manually.')
          }
        } else {
          toast.error(result.error || 'Failed to accept invite.')
        }
      } catch (_err) {
        toast.error('Something went wrong accepting invite.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [token, hostname, apiRoute, userSlug, email, onSuccess],
  )

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
      initialState={initialState}
      onSubmit={onSubmit}
      disableSuccessStatus
      disabled={isSubmitting}
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
          validate={validateName}
        />
        <PasswordField
          field={{
            name: 'password',
            label: 'Password',
            required: true,
          }}
          path="password"
        />
        <ConfirmPasswordField />
      </div>
      <FormSubmit size="large" disabled={isSubmitting}>
        {isSubmitting ? 'Accepting...' : 'Accept Invite'}
      </FormSubmit>
    </Form>
  )
}
