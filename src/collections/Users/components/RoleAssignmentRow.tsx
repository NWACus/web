import { Button, SelectField } from '@payloadcms/ui'

export function RoleAssignmentRow({
  path,
  index,
  roleOptions,
  tenantOptions,
  onRemove,
}: {
  path: string
  index: number
  roleOptions: { label: string; value: string }[]
  tenantOptions: { label: string; value: string }[]
  onRemove: () => void
}) {
  return (
    <div className="array-field__row pl-4 pb-6">
      <div className="flex justify-between items-center">
        <span className="array-field__row-label">
          Role Assignment {String(index + 1).padStart(2, '0')}
        </span>
        <Button
          buttonStyle="icon-label"
          className="my-3"
          icon="x"
          iconPosition="left"
          iconStyle="with-border"
          onClick={onRemove}
          size="small"
        >
          Remove
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SelectField
          field={{
            name: 'role',
            type: 'select',
            label: 'Role',
            required: true,
            options: roleOptions,
          }}
          path={`${path}.role`}
          validate={(value) => {
            if (!value) return 'Role is required'
            return true
          }}
        />
        <SelectField
          field={{
            name: 'tenant',
            type: 'select',
            label: 'Tenant',
            required: true,
            options: tenantOptions,
          }}
          path={`${path}.tenant`}
          validate={(value) => {
            if (!value) return 'Tenant is required'
            return true
          }}
        />
      </div>
    </div>
  )
}
