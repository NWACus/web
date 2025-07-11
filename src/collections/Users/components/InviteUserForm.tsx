'use client'

import { Error } from '@/blocks/Form/Error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@payloadcms/ui'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { inviteUserAction } from './inviteUserAction'

interface InviteUserFormValues {
  email: string
}

export default function InviteUserForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InviteUserFormValues>({
    defaultValues: { email: '' },
  })

  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const onSubmit = (data: InviteUserFormValues) => {
    setSuccess(null)
    setError(null)
    startTransition(async () => {
      const result = await inviteUserAction({ email: data.email })
      if (result.success) {
        setSuccess(`Invite sent to: ${data.email}`)
        reset()
      } else {
        setError(result.error || 'Failed to invite user.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pt-8">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email', {
            required: true,
            pattern: {
              value: /^\S[^\s@]*@\S+$/,
              message: 'Please enter a valid email address',
            },
          })}
        />
        {/* <FieldLabel htmlFor="email" label="Email" required />
        <TextInput
          path="email"
          required
          showError={!!errors.email}
                  autoComplete="email"
          {...register('email', {
            required: true,
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Please enter a valid email address',
            },
          })}
        /> */}
        {errors.email && <Error />}
      </div>
      {success && <div className="text-green-600 text-sm">{success}</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <Button type="submit" disabled={isSubmitting || isPending}>
        {isPending ? 'Inviting...' : 'Invite User'}
      </Button>
    </form>
  )
}
