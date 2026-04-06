import type { SelectFieldServerComponent } from 'payload'

import { SelectField } from '@payloadcms/ui'

export const TenantSlugField: SelectFieldServerComponent = async ({
  clientField,
  field,
  payload,
}) => {
  const { docs } = await payload.find({
    collection: 'tenants',
    limit: 0,
    depth: 0,
    select: { slug: true },
  })

  const usedSlugs: Set<string> = new Set(docs.map((doc) => doc.slug))

  const options = clientField.options?.filter((option) => {
    const value = typeof option === 'string' ? option : option.value
    return !usedSlugs.has(value)
  })

  return <SelectField field={{ ...clientField, options }} path={field.name} />
}
