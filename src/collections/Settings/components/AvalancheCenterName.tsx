import { TextInput } from '@payloadcms/ui'
import { FieldServerComponent } from 'payload'

export const AvalancheCenterName: FieldServerComponent = async ({ data, payload }) => {
  const { tenant: tenantId } = data

  let tenantName: string = '--'

  if (tenantId && typeof tenantId === 'number') {
    const tenant = await payload.findByID({
      collection: 'tenants',
      id: tenantId,
      select: {
        name: true,
      },
    })

    if (tenant) {
      tenantName = tenant.name
    }
  }

  return (
    <TextInput
      value={tenantName}
      path=""
      readOnly
      Label={<label className="field-label">Name</label>}
      Description={
        <p className="field-description field-description-description">
          Please contact an admin if you need to change this name.
        </p>
      }
    />
  )
}
