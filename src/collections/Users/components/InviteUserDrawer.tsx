'use client'

import { Button, Drawer, FieldLabel, Gutter, toast, useModal } from '@payloadcms/ui'

import React, { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { inviteUserAction } from './inviteUserAction'

interface InviteUserFormValues {
  email: string
  name: string
}

const drawerSlug = 'invite-user-drawer'

function FieldErrorsToast({ errorMessage }: { errorMessage: string }) {
  const [{ errors, message }] = React.useState(() => createErrorsFromMessage(errorMessage))

  return (
    <div>
      {message}
      {Array.isArray(errors) && errors.length > 0 ? (
        <ul data-testid="field-errors">
          {errors.map((error, index) => {
            return <li key={index}>{error}</li>
          })}
        </ul>
      ) : null}
    </div>
  )
}

function groupSimilarErrors(items: string[]): string[] {
  const result: string[] = []

  for (const item of items) {
    if (item) {
      const parts = item.split(' → ')
      let inserted = false

      // Find a place where a similar path exists
      for (let i = 0; i < result.length; i++) {
        if (result[i].startsWith(parts[0])) {
          result.splice(i + 1, 0, item)
          inserted = true
          break
        }
      }

      // If no similar path was found, add to the end
      if (!inserted) {
        result.push(item)
      }
    }
  }

  return result
}

function createErrorsFromMessage(message: string): {
  errors?: string[]
  message: string
} {
  const [intro, errorsString] = message.split(':')

  if (!errorsString) {
    return {
      message: intro,
    }
  }

  const errors = errorsString.split(',').map((error) => error.replaceAll(' > ', ' → ').trim())

  if (errors.length === 1) {
    return {
      errors,
      message: `${intro}:`,
    }
  }

  return {
    errors: groupSimilarErrors(errors),
    message: `${intro} (${errors.length}):`,
  }
}

export function InviteUserDrawer() {
  const { openModal, closeModal } = useModal()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InviteUserFormValues>({
    defaultValues: { email: '', name: '' },
  })

  const [isPending, startTransition] = useTransition()

  const onSubmit = (data: InviteUserFormValues) => {
    startTransition(async () => {
      const result = await inviteUserAction({ email: data.email, name: data.name })
      if (result.success) {
        toast.success(`Invite sent to: ${data.email}`)
        reset()
        closeModal(drawerSlug)
      } else {
        toast.error(<FieldErrorsToast errorMessage={result.error || 'Failed to invite user.'} />)
      }
    })
  }

  return (
    <>
      <Gutter>
        <Button buttonStyle="secondary" onClick={() => openModal(drawerSlug)}>
          Invite New User
        </Button>
      </Gutter>
      <Drawer slug={drawerSlug} title="Invite New User">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pt-8">
          <div className="field-type text">
            <FieldLabel htmlFor="field-email" label="Email" required />
            <div className="field-type__wrap">
              {errors.email && (
                <div className="field-type__error">
                  <span>{errors.email.message || 'This field is required'}</span>
                </div>
              )}
              <input
                id="field-email"
                type="email"
                className={`field-type__input ${errors.email ? 'error' : ''}`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address',
                  },
                })}
              />
            </div>
          </div>
          <div className="field-type text">
            <FieldLabel htmlFor="field-name" label="Name" required />
            <div className="field-type__wrap">
              {errors.name && (
                <div className="field-type__error">
                  <span>{errors.name.message || 'This field is required'}</span>
                </div>
              )}
              <input
                id="field-name"
                type="text"
                className={`field-type__input ${errors.name ? 'error' : ''}`}
                {...register('name', {
                  required: 'Name is required',
                })}
              />
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting || isPending}>
            {isPending ? 'Inviting...' : 'Invite User'}
          </Button>
        </form>
      </Drawer>
    </>
  )
}
