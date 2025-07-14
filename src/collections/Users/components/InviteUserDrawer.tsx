'use client'

import {
  Button,
  Collapsible,
  Drawer,
  FieldLabel,
  Gutter,
  MoreIcon,
  Popup,
  PopupList,
  Select,
  toast,
  useModal,
  usePayloadAPI,
} from '@payloadcms/ui'

import { Role, Tenant } from '@/payload-types'
import { OptionObject } from 'payload'
import React, { useTransition } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { inviteUserAction } from './inviteUserAction'

type InviteUserFormValues = {
  email: string
  name: string
  roleAssignments: {
    role: OptionObject | null
    tenant: OptionObject | null
  }[]
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
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InviteUserFormValues>({
    defaultValues: { email: '', name: '', roleAssignments: [] },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'roleAssignments',
  })

  const [isPending, startTransition] = useTransition()

  const onSubmit = (data: InviteUserFormValues) => {
    startTransition(async () => {
      const transformedRoleAssignments = data.roleAssignments
        .filter((assignment): assignment is { role: OptionObject; tenant: OptionObject } =>
          Boolean(
            assignment.role &&
              assignment.role.value &&
              assignment.tenant &&
              assignment.tenant.value,
          ),
        )
        .map((assignment) => ({
          roleId: Number(assignment.role.value),
          tenantId: Number(assignment.tenant.value),
        }))
      const result = await inviteUserAction({
        email: data.email,
        name: data.name,
        roleAssignments: transformedRoleAssignments,
      })
      if (result.success) {
        toast.success(`Invite sent to: ${data.email}`)
        reset()
        closeModal(drawerSlug)

        // Trigger Payload to refetch the list view
        window.dispatchEvent(new Event('payload.reload'))
      } else {
        toast.error(<FieldErrorsToast errorMessage={result.error || 'Failed to invite user.'} />)
      }
    })
  }

  const [{ data: rolesData }] = usePayloadAPI('/api/roles?limit=100')
  const roleOptions = rolesData?.docs?.map((role: Role) => ({
    label: role.name,
    value: role.id,
  }))

  const [{ data: tenantsData }] = usePayloadAPI('/api/tenants?limit=100')
  const tenantOptions = tenantsData?.docs?.map((tenant: Tenant) => ({
    label: tenant.name,
    value: tenant.id,
  }))

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
          <div className="field-type space-y-2">
            <FieldLabel label="Role Assignments" />
            <div className="field-type__wrap space-y-4">
              {fields.map((field, index) => (
                <Collapsible
                  key={field.id}
                  header={
                    <div className="array-field__row-header">
                      <span className="array-field__row-label">
                        Role Assignment {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                  }
                  actions={
                    <Popup
                      button={<MoreIcon />}
                      horizontalAlign="center"
                      buttonClassName="array-actions__button popup-button--default"
                      render={({ close }) => (
                        <PopupList.ButtonGroup buttonSize="small">
                          <PopupList.Button
                            onClick={() => {
                              remove(index)
                              close()
                            }}
                          >
                            Remove
                          </PopupList.Button>
                        </PopupList.ButtonGroup>
                      )}
                      size="medium"
                    />
                  }
                >
                  <div className="array-field__row-fields space-y-4">
                    <div className="field-type">
                      <FieldLabel htmlFor={`field-${field.id}-role`} label="Role" required />
                      <Controller
                        name={`roleAssignments.${index}.role`}
                        control={control}
                        render={({ field: controllerField }) => (
                          <Select
                            value={controllerField.value ?? undefined}
                            onChange={controllerField.onChange}
                            options={roleOptions}
                          />
                        )}
                      />
                    </div>
                    <div className="field-type">
                      <FieldLabel htmlFor={`field-${field.id}-tenant`} label="Tenant" required />
                      <Controller
                        name={`roleAssignments.${index}.tenant`}
                        control={control}
                        render={({ field: controllerField }) => (
                          <Select
                            value={controllerField.value ?? undefined}
                            onChange={controllerField.onChange}
                            options={tenantOptions}
                          />
                        )}
                      />
                    </div>
                  </div>
                </Collapsible>
              ))}
              <Button
                type="button"
                buttonStyle="icon-label"
                className="array-field__add-row"
                icon="plus"
                iconPosition="left"
                iconStyle="with-border"
                onClick={() => append({ role: null, tenant: null })}
              >
                Add Role Assignment
              </Button>
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
