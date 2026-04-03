import type { SelectFieldServerComponent } from 'payload'

import { SelectField, SelectInput } from '@payloadcms/ui'

export const TenantSlugField: SelectFieldServerComponent = async ({
  clientField,
  data,
  field,
  payload,
}) => {
  const currentSlug = data?.slug
  // Slug is immutable after creation
  if (data.id) {
    return (
      <SelectInput
        name={field.name}
        path={field.name}
        label={clientField.label}
        description={clientField.admin?.description}
        options={[{ label: String(currentSlug).toUpperCase(), value: currentSlug }]}
        value={currentSlug}
        required
        readOnly
      />
    )
  }

  const { docs } = await payload.find({
    collection: 'tenants',
    limit: 0,
    depth: 0,
    select: { slug: true },
  })

  const usedSlugs: Set<string> = new Set(docs.map((doc) => doc.slug))

  const options = clientField.options?.filter((option) => {
    const value = typeof option === 'string' ? option : option.value
    // Keep the current document's slug so the label displays correctly
    return value === currentSlug || !usedSlugs.has(value)
  })

  return <SelectField field={{ ...clientField, options }} path={field.name} />
}
