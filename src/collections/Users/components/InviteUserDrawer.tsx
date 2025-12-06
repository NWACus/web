'use client'

import {
  Button,
  Drawer,
  EmailField,
  FieldLabel,
  Form,
  FormSubmit,
  Gutter,
  SelectField,
  TextField,
  toast,
  useAllFormFields,
  useForm,
  useListQuery,
  useModal,
  usePayloadAPI,
} from '@payloadcms/ui'

import { GlobalRole, Provider, Role, Tenant } from '@/payload-types'
import { type FormState } from 'payload'
import { reduceFieldsToValues } from 'payload/shared'
import { useCallback, useMemo, useState } from 'react'
import { inviteUserAction } from './inviteUserAction'
import { RoleAssignmentRow } from './RoleAssignmentRow'

const drawerSlug = 'invite-user-drawer'

type RoleAssignmentRowInput = {
  id: string
  role: string
  tenant: string
}

const collectValidationErrors = (formState: FormState): string[] => {
  const errors: string[] = []

  if (formState.email?.valid === false) {
    errors.push(`Email: ${formState.email.errorMessage || 'Email is required'}`)
  }

  if (formState.name?.valid === false) {
    errors.push(`Name: ${formState.name.errorMessage || 'Name is required'}`)
  }

  const roleAssignmentFields = Object.keys(formState).filter(
    (key) =>
      key.startsWith('roleAssignments.') && (key.endsWith('.role') || key.endsWith('.tenant')),
  )

  // Group by row index
  const rowErrors: { [index: number]: { role?: string; tenant?: string } } = {}

  roleAssignmentFields.forEach((fieldPath) => {
    const field = formState[fieldPath]
    if (field?.valid === false && field?.errorMessage) {
      const pathParts = fieldPath.split('.')
      const rowIndex = parseInt(pathParts[1])
      const fieldType = pathParts[2] // 'role' or 'tenant'

      if (!rowErrors[rowIndex]) {
        rowErrors[rowIndex] = {}
      }

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      rowErrors[rowIndex][fieldType as 'role' | 'tenant'] = field.errorMessage
    }
  })

  // Convert grouped errors to validation messages
  Object.entries(rowErrors).forEach(([index, rowError]) => {
    const rowNumber = parseInt(index) + 1
    if (rowError.role) {
      errors.push(`Role Assignment ${rowNumber}: ${rowError.role}`)
    }
    if (rowError.tenant) {
      errors.push(`Role Assignment ${rowNumber}: ${rowError.tenant}`)
    }
  })

  return errors
}

const initialState: FormState = {
  email: {
    initialValue: '',
    valid: false,
    value: '',
  },
  name: {
    initialValue: '',
    valid: false,
    value: '',
  },
  roleAssignments: {
    initialValue: [],
    valid: true,
    value: [],
  },
  globalRoleAssignments: {
    initialValue: [],
    valid: true,
    value: [],
  },
  providers: {
    initialValue: [],
    valid: true,
    value: [],
  },
}

export function InviteUserDrawer({
  canCreateGlobalRoleAssignments,
  canCreateTenantRoleAssignments,
  isProviderManager = false,
  canAssignProviders = false,
}: {
  canCreateGlobalRoleAssignments: boolean
  canCreateTenantRoleAssignments: boolean
  isProviderManager?: boolean
  canAssignProviders?: boolean
}) {
  const { openModal, closeModal } = useModal()
  const { refineListData } = useListQuery()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [{ data: rolesData }] = usePayloadAPI('/api/roles?limit=100')
  const roleOptions = useMemo(
    () =>
      rolesData?.docs
        ?.filter(
          (role: Role | null): role is Role => role != null && role.name != null && role.id != null,
        )
        .map((role: Role) => ({
          label: role.name,
          value: String(role.id),
        })) || [],
    [rolesData],
  )

  const [{ data: tenantsData }] = usePayloadAPI('/api/tenants?limit=100')
  const tenantOptions = useMemo(
    () =>
      tenantsData?.docs
        ?.filter(
          (tenant: Tenant | null): tenant is Tenant =>
            tenant != null && tenant.name != null && tenant.id != null,
        )
        .map((tenant: Tenant) => ({
          label: tenant.name,
          value: String(tenant.id),
        })) || [],
    [tenantsData],
  )

  const [{ data: globalRolesData }] = usePayloadAPI('/api/globalRoles?limit=100')
  const globalRoleOptions = useMemo(
    () =>
      globalRolesData?.docs
        ?.filter(
          (globalRole: GlobalRole | null): globalRole is GlobalRole =>
            globalRole != null && globalRole.name != null && globalRole.id != null,
        )
        .map((globalRole: GlobalRole) => ({
          label: globalRole.name,
          value: String(globalRole.id),
        })) || [],
    [globalRolesData],
  )

  const [{ data: providersData }] = usePayloadAPI('/api/providers?limit=0')
  const providerOptions = useMemo(
    () =>
      providersData?.docs
        ?.filter(
          (provider: Provider | null): provider is Provider =>
            provider != null && provider.name != null && provider.id != null,
        )
        .map((provider: Provider) => ({
          label: provider.name,
          value: String(provider.id),
        })) || [],
    [providersData],
  )

  const handleSubmit = useCallback(
    async (formState: FormState) => {
      // Check for client side validation errors before submitting
      const validationErrors = collectValidationErrors(formState)

      if (validationErrors.length > 0) {
        // Format error message exactly like Payload's FieldErrorsToast
        const errorMessage =
          validationErrors.length === 1
            ? validationErrors[0]
            : `Please correct the following errors (${validationErrors.length}):`

        // Create a React component that matches Payload's format
        const ErrorToast = () => (
          <div>
            {errorMessage}
            {validationErrors.length > 1 && (
              <ul data-testid="field-errors">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        )

        toast.error(<ErrorToast />)
        return
      }

      try {
        setIsSubmitting(true)
        const reducedVals = reduceFieldsToValues(formState, true)
        const roleAssignments = Array.isArray(reducedVals.roleAssignments)
          ? reducedVals.roleAssignments
              .filter(
                (row: RoleAssignmentRowInput) => row.role !== undefined && row.tenant !== undefined,
              )
              .map((row: RoleAssignmentRowInput) => ({
                roleId: Number(row.role),
                tenantId: Number(row.tenant),
              }))
          : []
        const globalRoleAssignments = Array.isArray(reducedVals.globalRoleAssignments)
          ? reducedVals.globalRoleAssignments.map((roleId) => Number(roleId))
          : []

        const providers = Array.isArray(reducedVals.providers)
          ? reducedVals.providers.map((providerId) => Number(providerId))
          : []

        const result = await inviteUserAction({
          email: String(formState.email?.value) || '',
          name: String(formState.name?.value) || '',
          roleAssignments,
          globalRoleAssignments,
          providers,
        })

        if (result.success) {
          toast.success(`Invite sent to: ${formState.email?.value}`)
          closeModal(drawerSlug)

          // Trigger Payload to refetch the list view
          refineListData({})
        } else {
          toast.error(result.error || 'Failed to invite user.')
        }
      } catch (error) {
        console.error('Error inviting user:', error)
        toast.error('An unexpected error occurred while inviting the user.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [closeModal, refineListData],
  )

  const RoleAssignmentsArray = ({ path }: { path: string }) => {
    const { dispatchFields, removeFieldRow, addFieldRow } = useForm()

    const [formState] = useAllFormFields()
    const roleAssignmentsField = formState?.[path]
    const rows = Array.isArray(roleAssignmentsField?.rows) ? roleAssignmentsField.rows : []

    const addRow = useCallback(() => {
      addFieldRow({ path, schemaPath: path })

      // If there's only one tenant, set it automatically
      if (tenantOptions.length === 1) {
        dispatchFields({
          type: 'UPDATE',
          path: `${path}.${rows.length}.tenant`,
          value: tenantOptions[0].value,
          valid: true,
        })
      }
    }, [addFieldRow, dispatchFields, path, rows.length])

    const removeRow = useCallback(
      (index: number) => {
        removeFieldRow({ path, rowIndex: index })
      },
      [removeFieldRow, path],
    )

    return (
      <div className="field-type">
        <div className="field-type__wrap">
          {rows.map((row, index) => (
            <RoleAssignmentRow
              key={row.id || index}
              path={`${path}.${index}`}
              index={index}
              roleOptions={roleOptions}
              tenantOptions={tenantOptions}
              onRemove={() => removeRow(index)}
            />
          ))}
        </div>
        <Button
          buttonStyle="icon-label"
          className="field-type__add-button"
          icon="plus"
          iconPosition="left"
          iconStyle="with-border"
          onClick={addRow}
        >
          Add Role Assignment
        </Button>
      </div>
    )
  }

  if (!canCreateTenantRoleAssignments && !canCreateGlobalRoleAssignments && !canAssignProviders) {
    return (
      <Gutter>
        <Button buttonStyle="secondary" onClick={() => openModal(drawerSlug)}>
          Error: You are not allowed to invite users
        </Button>
      </Gutter>
    )
  }

  return (
    <>
      <Gutter>
        <Button buttonStyle="secondary" onClick={() => openModal(drawerSlug)}>
          Invite New User
        </Button>
      </Gutter>
      <Drawer slug={drawerSlug} title="Invite New User">
        <Form
          initialState={initialState}
          onSubmit={handleSubmit}
          disableValidationOnSubmit={true}
          className="space-y-8 pt-8"
        >
          <EmailField
            field={{
              name: 'email',
              type: 'email',
              label: 'Email',
              required: true,
            }}
            path="email"
            validate={(value) => {
              if (!value) return 'Email is required'
              const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
              if (!emailRegex.test(value)) return 'Please enter a valid email address'
              return true
            }}
          />

          <TextField
            field={{
              name: 'name',
              type: 'text',
              label: 'Name',
              required: true,
            }}
            path="name"
            validate={(value) => {
              if (!value) return 'Name is required'
              return true
            }}
          />

          {canCreateTenantRoleAssignments && (
            <div className="field-type space-y-2">
              <FieldLabel label="Role Assignments" />
              <RoleAssignmentsArray path="roleAssignments" />
            </div>
          )}

          {canCreateGlobalRoleAssignments && globalRoleOptions.length > 0 && (
            <SelectField
              field={{
                name: 'globalRoleAssignments',
                type: 'select',
                label: 'Global Role Assignments',
                options: globalRoleOptions,
                hasMany: true,
              }}
              path="globalRoleAssignments"
            />
          )}

          {canAssignProviders && providerOptions.length > 0 && (
            <SelectField
              field={{
                name: 'providers',
                type: 'select',
                label: 'Providers',
                options: providerOptions,
                hasMany: true,
                required: isProviderManager,
              }}
              path="providers"
              validate={(value) => {
                // Only require providers for provider managers
                if (isProviderManager && (!value || (Array.isArray(value) && value.length === 0))) {
                  return 'At least one provider is required'
                }
                return true
              }}
            />
          )}

          <FormSubmit className="w-fit px-6" disabled={isSubmitting}>
            {isSubmitting ? 'Inviting...' : 'Invite User'}
          </FormSubmit>
        </Form>
      </Drawer>
    </>
  )
}
